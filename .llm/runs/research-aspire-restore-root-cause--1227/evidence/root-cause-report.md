# Root-cause report — Aspire restore cancellation #1227

## Verdict

The cancelled operation is Aspire CLI 13.4.6's bundled NuGet child process:
`aspire-managed nuget restore`, awaited by `BundleNuGetService.RestorePackagesAsync`. The
cancellation is not initiated by NuGet, an Aspire HTTP timeout, or a container probe. NetScript's
outer gate deadline terminates the Aspire process; Aspire's `ConsoleCancellationManager` handles
SIGTERM, cancels its shared token, and `ProcessExecution.WaitForExitAsync` kills the NuGet child and
rethrows `OperationCanceledException`. Exit 6 is therefore the bounded symptom of an already-hung
NuGet restore.

The best-supported cause of the preceding hang is an Aspire 13.4.6 CLI defect in NuGet metadata
prefetch lifecycle/lock handling. Stable 13.4.6 starts concurrent `aspire-managed nuget search`
helpers for commands including restore/start and does not retain their tasks. Upstream issue
[#18948](https://github.com/microsoft/aspire/issues/18948) demonstrates those orphaned helpers
holding NuGet locks and deadlocking unrelated restores; merged PR
[#18958](https://github.com/microsoft/aspire/pull/18958) reaps them for 13.5. The local WSL host also
has six stopped 13.4.6 `aspire-managed nuget search` helpers. The fresh Linux CI failure starts a
metadata search concurrently with the restore and then stalls in the restore for 300 seconds.
Issue [#18965](https://github.com/microsoft/aspire/issues/18965) remains open to stop unnecessary
prefetching on restore/start altogether.

This is an upstream-blocked verdict, not proof that local cache warming fixes the defect. Exact
package prewarming was a cache hit in run 30964226683, yet the bundled restore still hung.

## Failing-log evidence

The original WSL failure is retained verbatim as
`local-failing-cli_20260804T092654_7dc37fe7.log` (SHA-256
`93c4c141b5d0f36785c2cec71c109540d4368e443ee459d6c284bf6f4abc42b5` after removing the UTF-8
BOM). The decisive sequence is:

> `[BundleNuGetService] Restoring 5 packages`
>
> `[Cli] Termination signal received, requesting cancellation.`
>
> `System.Threading.Tasks.TaskCanceledException: A task was canceled.`
>
> `at Aspire.Cli.NuGet.BundleNuGetService.RestorePackagesAsync(...)`

The clean Linux Actions failure is retained as `linux-ci-failing-cli_20260805T005338525.log`. It
records the full `aspire-managed nuget restore` invocation at `00:53:38.983`, then no child output
until:

> `[2026-08-05 00:58:38.744] [INFO] [Cli] Termination signal received, requesting cancellation.`

This was run 30964226683 after the workflow had restored and verified all exact packages from the
v2 cache. The parent `aspire start` reports its own 300-second deadline and exit 2; the detached
child log names the same stalled component as the exit-6 restore failure.

## Cancellation ownership source trace

Pinned to the failing 13.4.6 build commit `87fe259e4fc244c599019a7b1304c85a1488f248`:

1. [`ConsoleCancellationManager`](https://github.com/microsoft/aspire/blob/87fe259e4fc244c599019a7b1304c85a1488f248/src/Aspire.Cli/ConsoleCancellationManager.cs#L68-L76)
   registers SIGINT and SIGTERM; its handler
   [logs the exact line and calls `_cts.Cancel()`](https://github.com/microsoft/aspire/blob/87fe259e4fc244c599019a7b1304c85a1488f248/src/Aspire.Cli/ConsoleCancellationManager.cs#L122-L131).
2. [`PrebuiltAppHostServer`](https://github.com/microsoft/aspire/blob/87fe259e4fc244c599019a7b1304c85a1488f248/src/Aspire.Cli/Projects/Polyglot/PrebuiltAppHostServer.cs#L282-L304)
   passes that token to the bundled NuGet restore.
3. [`BundleNuGetService`](https://github.com/microsoft/aspire/blob/87fe259e4fc244c599019a7b1304c85a1488f248/src/Aspire.Cli/NuGet/BundleNuGetService.cs#L180-L192)
   passes it to the layout process runner.
4. [`ProcessExecution.WaitForExitAsync`](https://github.com/microsoft/aspire/blob/87fe259e4fc244c599019a7b1304c85a1488f248/src/Aspire.Cli/DotNet/ProcessExecution.cs#L85-L103)
   catches token cancellation, kills the entire child process tree, and rethrows.
5. NetScript's gate uses an `AbortController` deadline as the `Deno.Command` signal, which sends
   the termination that begins this chain.

## Controls and version currency

- Stable `aspire doctor --non-interactive --nologo`: Aspire 13.4.6; DCP and container checks pass;
  only the expected Linux development-certificate warning remains.
- Official `dev` quality installed in an isolated scratch path:
  `13.5.0-preview.1.26404.10+1f098dffe7e143c18f5a79c37218718f822415ed`.
  Its commit is 25 commits ahead of PR #18958's merge commit, so this daily contains the helper
  lifecycle fix. A fresh restore completed in 9 seconds, but one green comparison is not causal
  proof and a preview CLI/13.4 SDK mismatch is not an acceptable production pin.
- Stable restore with stdin from `/dev/null` completed in 15 seconds; a PTY control completed in
  9 seconds. Neither reproduced the intermittent hang. This makes #16791 adjacent rather than a
  demonstrated fix for Linux/WSL; stdin redirection is not selected as mitigation.
- Milestone 13.5 was independently queried on 2026-08-05: 71 open, 787 closed (91%), updated that
  day. No 13.5 item contains our exact error signature.

## Upstream search disposition

- [#16791](https://github.com/microsoft/aspire/issues/16791): macOS/TTY hang after file writes;
  `/dev/null` workaround. Same family, different platform/signature/stage.
- [#16704](https://github.com/microsoft/aspire/issues/16704): TypeScript AppHost start performance;
  confirms the prebuilt server/bundled NuGet path, but not this cancellation.
- [#17758](https://github.com/microsoft/aspire/issues/17758): app-model self-wait deadlock after
  preparation; not this restore-stage hang.
- [#15222](https://github.com/microsoft/aspire/issues/15222): explicit NuGet signature validation
  failure. Our logs show signature verification enabled but no validation error.
- Searches for `"Failed to prepare AppHost server"`, `"A task was canceled" restore`, and the
  combined signature found no report of this clean Linux/WSL restore hang and outer cancellation.

## Local response

PR #1305 should remain the coordinating mitigation but its causal description must be corrected:

- retaining the CLI log and bounding attempts are justified;
- exact-signature retry reduces impact when stable 13.4.6 wedges, but cannot remove the cause;
- cache prewarming reduces feed work but does not eliminate Aspire's bundled restore and did not
  prevent run 30964226683;
- database AppHost retry coverage is justified because the same child path wedged there;
- do not add `/dev/null` based on the negative control;
- move to 13.5 after a stable release (or separately accept preview risk), because daily already
  contains #18958. Track #18965 as residual risk.

PR #1305's final-head run
[30965320792](https://github.com/rickylabs/netscript/actions/runs/30965320792) then falsified the
mitigation directly: both the first restore and its exact-signature retry hung for 180 seconds in
`BundleNuGetService`, received SIGTERM, and exited 6. The two retained proof logs are
`proof-failure-attempt1_20260805T011257.log` and
`proof-failure-attempt2_20260805T011557.log`.

The diagnosis-derived implementation is therefore a version move on this research branch: pin the
published-walk **CLI only** to exact daily `13.5.0-preview.1.26404.10`, the tested build containing
#18958, while keeping the generated AppHost SDK/package train at 13.4.6. This does not erase the
preview risk; it is the earliest available upstream fix and should be replaced by fixed stable 13.5.

Completion requires five consecutive green published-canary workflows at one immutable branch
head. At the observed roughly 50/50 failure rate, five lucky greens have probability 1/32. Any
failure or head change resets the sequence.
