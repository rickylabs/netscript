# Research — research-aspire-restore-root-cause--1227

## Re-baseline

- Carried-in sources: issue #1227; draft PR #1305 and run
  `.llm/runs/fix-aspire-restore-stability-1227--1227/`; earlier run
  `.llm/runs/fix-aspire-restore-reliability-1227--1227/`.
- Re-derived against `main` at `00f96af76` on 2026-08-05.
- PR #1305 S1 log capture is reused. Its S2 package-cache/signature-retry hypothesis is treated as
  a control and is falsified by run 30964226683.

## Root-cause verdict

Aspire CLI 13.4.6 starts NuGet metadata prefetches as discarded background work. Earlier Aspire
commands in the same workflow can exit while `aspire-managed nuget search` helpers survive in
stopped (`T`) state. Those helpers retain/starve NuGet scratch/global locks; a later bundled
`aspire-managed nuget restore` then waits indefinitely in
`BundleNuGetService.RestorePackagesAsync`.

The visible `TaskCanceledException` is secondary. NetScript's Quickstart 180-second timer aborts the
`Deno.Command` signal, which terminates Aspire. Aspire logs `Termination signal received` and
cancels the `Process.WaitForExitAsync` awaiting the stuck restore child. Aspire maps that prepare
failure to exit 6. The canceler is therefore NetScript's deadline; the component blocked before
cancellation is Aspire's bundled NuGet restore; the condition that blocks it is the 13.4.6 orphaned
NuGet-prefetch lock defect tracked upstream as microsoft/aspire#18948.

## Findings

| # | Finding | Evidence |
| - | - | - |
| 1 | The retained cloud log starts package work at 00:17:26.117, receives termination at 00:20:26.028, then throws from `BundleNuGetService.RestorePackagesAsync` and exits 6. | `evidence/failing-cli-log.md`; run 30962130571 artifact 8913614196 |
| 2 | NetScript owns the 180-second cancellation: `setTimeout(() => controller.abort(), timeoutMs)` supplies the signal to `Deno.Command`. | `packages/cli/e2e/src/application/gates/quickstart/aspire-walk.ts:81-109` |
| 3 | The causal upstream defect exists for exact CLI 13.4.6, has independent WSL confirmation, and is closed by PR #18958. | <https://github.com/microsoft/aspire/issues/18948>; <https://github.com/microsoft/aspire/pull/18958> |
| 4 | Six long-lived 13.4.6 `aspire-managed nuget search` helpers are stopped on this WSL host, matching #18948 exactly. | `evidence/local-and-control-evidence.md` |
| 5 | Pre-seeding all exact SDK packages does not remove the failure: PR #1305 run 30964226683 verified the cache, then a later four-package bundled restore hung for 300 seconds. | `evidence/local-and-control-evidence.md`; run 30964226683 child log |
| 6 | Stable 13.4.6 predates the Aug 3 fix. Exact daily `13.5.0-preview.1.26404.10+1f098dff...` is 25 commits ahead and zero behind the fix merge. | `evidence/upstream-and-version.md` |
| 7 | The exact daily CLI restored the unchanged 13.4.6 TypeScript SDK graph from isolated empty caches in 13.06 seconds and leaked no new helper. | `evidence/local-and-control-evidence.md` |
| 8 | `aspire doctor` reports Docker, WSL2, DCP/.NET, and TypeScript tooling healthy for both builds; certificate warnings are unrelated. | `evidence/upstream-and-version.md` |
| 9 | The inherited `deno.lock` modification is unrelated/user-owned and excluded from this run. | Initial and current `git diff -- deno.lock` |

## Upstream scope distinction

PR #18958 fixes the helper lifetime that lets an earlier command poison later restores. Open issue
#18965/PR #18968 narrows metadata prefetch to commands that consume it; it is desirable hardening,
but not required to reap helpers. The published workflow's full scaffold run precedes
`quickstart.walk`, supplying the exact earlier-command/later-restore sequence from #18948.

An exact upstream report exists, so this run does not draft a duplicate issue.

## Fix decision

Pin the published-canary workflow to exact daily CLI `13.5.0-preview.1.26404.10`, the first tested
build containing #18958, while leaving the generated AppHost SDK/package train at 13.4.6. Install it
through the official versioned installer, assert the exact version, run `aspire doctor`, and retain
all Aspire CLI logs. Do not add PR #1305's cache-seed job or signature-only retry.

This is a direct version move to the upstream lifecycle repair, not a retry workaround. It is still
an explicit preview pin; once 13.5 stable contains the same fix, the stable pin should replace it.

## Proof threshold

`N = 5` consecutive green published-canary workflows at the same branch head. Under the observed
rough 50/50 failure rate, a lucky five-green streak has probability `1/32` (3.125%), materially
stronger than the single-run evidence that let the defect survive. Any red NuGet restore/start hang
resets the streak to zero.

## jsr-audit surface scan

N/A. This changes CI workflow infrastructure and harness evidence, not a package export map,
`mod.ts`, JSDoc, or the published JSR surface.

## Remaining gate

- Five consecutive workflow-dispatch runs of published `0.0.5-canary.10` on the fixed branch head.
- Inspect every run's exact Aspire version, full scaffold verdict, Quickstart verdict, and retained
  Aspire logs/process termination evidence before calling the streak green.
