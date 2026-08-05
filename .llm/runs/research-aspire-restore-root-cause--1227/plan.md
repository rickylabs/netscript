# Plan: root-cause intermittent Aspire restore cancellation (#1227)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `research-aspire-restore-root-cause--1227` |
| Branch | `research/aspire-restore-root-cause` |
| Phase | `impl` |
| Target | CLI E2E and published-canary workflow |
| Archetype | `6 — CLI / Tooling` (workflow-only implementation) |
| Scope overlays | none |

## Archetype and doctrine

Archetype 6 is the smallest fit because the exercised surface is a process-spawning CLI E2E flow.
The change stays in workflow infrastructure and its semantic policy test; it introduces no command,
public flow API, adapter, or exported package surface. The CLI's `Restructure` doctrine verdict is
not deepened.

## Goal

Remove the diagnosed Aspire 13.4.6 orphaned-NuGet-helper defect from the published-canary path and
prove the result through five consecutive green published-canary workflows, while preserving the
failing log, upstream trace, version comparison, and PR #1305 control evidence.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Cancellation is secondary: NetScript's 180-second deadline terminates Aspire while Aspire waits in `BundleNuGetService.RestorePackagesAsync`. | Cloud log timestamp/order and NetScript source trace. |
| D2 | The underlying wait is microsoft/aspire#18948: orphaned stopped 13.4.6 NuGet prefetch helpers starve locks used by later restore. | Exact upstream build/WSL/component/process-state match plus six local stopped helpers. |
| D3 | PR #1305 S1 log capture is retained; S2 cache/retry is superseded. | Its own run 30964226683 hangs with a verified package cache and outside the exit-6 retry shape. |
| D4 | Use exact CLI `13.5.0-preview.1.26404.10`; keep SDK packages at 13.4.6. | Exact daily contains merged #18958 and restored the unchanged SDK graph from empty isolated caches. |
| D5 | `N = 5` consecutive green published-canary runs. | A lucky streak under a 50% defect occurs only 3.125% of the time. |
| D6 | No local PLAN-EVAL. | Written owner waiver, recorded in `supervisor.md`/`drift.md`. |

## Scope

- Retain and read failing Aspire logs and doctor/version output.
- Record cancellation ownership, upstream issue/fix, stopped-process evidence, and PR #1305 control.
- Pin the exact fixed daily CLI in `.github/workflows/e2e-cli-prod.yml` through the official
  versioned installer.
- Assert exact CLI version, run doctor, and retain `~/.aspire/logs/cli_*.log`.
- Extend the existing workflow semantic policy test.
- Push with an explicit refspec, dispatch five published-canary.10 workflows, and inspect all
  verdicts/logs.

## Non-Scope

- Opening a duplicate upstream issue.
- Adding a retry loop, new cache-seed job, or hiding the failure behind a longer timeout.
- Changing the generated AppHost SDK/package train from 13.4.6.
- Broad CLI restructuring or unrelated lock/dependency churn.
- Killing foreign stopped helpers or containers on the shared host.

## Commit Slices

| # | Slice | Gate | Files |
| - | - | - | - |
| 1 | Causal/upstream/version evidence and exact fixed CLI pin | Policy test, scoped fmt, installer dry-run, isolated daily restore | workflow, policy test, run artifacts |
| 2 | Published-canary proof and handoff | Five consecutive full workflow greens at one head; inspect logs | run artifacts and PR phase summary |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Daily build changes more than the lifecycle fix | Exact version, commit ancestry, unchanged 13.4.6 SDK, isolated compatibility restore, repeated full E2E. |
| PR #18958 repairs shutdown but a later race remains | Five full runs exercise many Aspire commands before both scaffold and Quickstart restores; any recurrence resets proof. |
| Preview artifact moves/disappears | Pin exact version; official installer checksum-verifies it; replace with 13.5 stable after upstream ships. |
| Cache hides the defect | Preserve current v1 cache behavior and inspect logs; do not add PR #1305 prewarm job. |
| Foreign host state contaminates local proof | Use isolated temp/package roots locally and Actions hosted runners for acceptance. |

## Fitness and Validation Gates

| Gate | Required | Evidence |
| --- | --- | --- |
| Failing log/source trace | PASS | `evidence/failing-cli-log.md` |
| Upstream/version/doctor | PASS | `evidence/upstream-and-version.md` |
| Fixed daily compatibility | PASS | 13.06-second isolated restore, no new helper |
| Workflow semantic policy | PASS | two focused Deno tests |
| Scoped TypeScript formatting | PASS | `.llm/tools/run-deno-fmt.ts` over the policy test |
| Workflow syntax/Actions validation | PENDING | GitHub workflow dispatch on pushed branch |
| Runtime acceptance | PENDING | five consecutive published-canary greens |

## Arch-Debt Implications

- No new architecture debt. The implementation is workflow-only.
- The preview CLI pin is tracked operational debt: replace it with a stable Aspire release
  containing #18958, without reverting to affected 13.4.6.
