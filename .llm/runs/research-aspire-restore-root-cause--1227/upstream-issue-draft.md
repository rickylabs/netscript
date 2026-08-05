# Draft upstream issue — Aspire CLI bundled NuGet restore intermittently hangs on Linux/WSL

> Hand-off only: do not file without owner/orchestrator approval.

## Title

Aspire CLI 13.4.6 bundled NuGet restore intermittently hangs on Linux/WSL until the caller cancels it

## Body

### Describe the bug

For TypeScript AppHosts, `aspire restore` and the prepare phase of `aspire start` intermittently
hang inside the bundled `aspire-managed nuget restore`. The operation produces no further output
until an outer process deadline sends SIGTERM. Aspire then logs `Termination signal received,
requesting cancellation`, cancels `ProcessExecution.WaitForExitAsync`, and surfaces either exit 6
with `Failed to prepare: A task was canceled / Failed to prepare AppHost server`, or an `aspire
start` timeout.

This reproduces on GitHub Actions Linux and locally under WSL, so it is not CI-only. Exact packages
were present and verified in the global NuGet cache in the latest CI reproduction; the bundled
restore still ran and hung.

### Versions/environment

- Aspire CLI: `13.4.6+87fe259e4fc244c599019a7b1304c85a1488f248`
- Build ID: `13.400.626.31906`
- TypeScript AppHost / SDK packages: 13.4.6 (plus the logged Browsers preview integration)
- GitHub-hosted Ubuntu runner and WSL/Linux local development machine
- NuGet signature verification: enabled (no signature validation error in the failing logs)

The current dev build tested was
`13.5.0-preview.1.26404.10+1f098dffe7e143c18f5a79c37218718f822415ed`; it contains #18958 and
completed a fresh comparison restore, but the failure is intermittent.

### Minimal reproduction

1. Create a TypeScript AppHost whose `aspire.config.json` declares several Aspire integration
   packages from NuGet.
2. Run repeatedly on a clean Linux runner:

   ```sh
   aspire restore --non-interactive --nologo
   ```

   The equivalent failure also occurs while `aspire start` prepares the AppHost.
3. Preserve the CLI log named on stderr from `~/.aspire/logs/cli_*.log`.

Expected: bundled restore completes or reports a concrete feed/package error.

Actual: the last log entries before the caller's deadline are:

```text
[PrebuiltAppHostServer] Restoring 5 integration packages via bundled NuGet
[BundleNuGetService] Restoring 5 packages
[BundleNuGetService] NuGet restore args: nuget restore ...
... no output ...
[Cli] Termination signal received, requesting cancellation.
System.Threading.Tasks.TaskCanceledException: A task was canceled.
   at Aspire.Cli.DotNet.ProcessExecution.WaitForExitAsync(...)
   at Aspire.Cli.NuGet.BundleNuGetService.RestorePackagesAsync(...)
[Stdout] Failed to prepare AppHost server.
[Cli] Exit code: 6
```

In a clean GitHub Actions reproduction, the same bundled restore emitted no output for 300 seconds
until `aspire start` terminated its detached child.

### Reproduction evidence

- Published-canary green control: https://github.com/rickylabs/netscript/actions/runs/30959430176
- Published-canary exit-6 failure: https://github.com/rickylabs/netscript/actions/runs/30961102523
- Clean Linux failure after exact package cache preseed: https://github.com/rickylabs/netscript/actions/runs/30964226683
- Earlier occurrences took 2 × 900 seconds before the caller deadline was bounded; the same shape
  occurred locally.
- Attach the two retained CLI logs from the NetScript slice artifact:
  `local-failing-cli_20260804T092654_7dc37fe7.log` and
  `linux-ci-failing-cli_20260805T005338525.log`.

### Relationship to existing issues

#18948/#18958 identify orphaned `aspire-managed nuget search` helpers holding NuGet locks and
deadlocking restores; #18965 proposes disabling unnecessary metadata prefetch by command. Our
13.4.6 logs start `BundleNuGetPackageCache` searches concurrently with the restore, and the WSL
host accumulated stopped search helpers. Does #18958 fully cover this clean Linux restore case, or
can the concurrent prefetch still contend with the restore before shutdown?

#16791 is related but its known reproduction is macOS with TTY stdin. Redirecting stdin from
`/dev/null` and a PTY control both completed locally and did not distinguish this intermittent
Linux/WSL failure.

### Additional context

Please consider emitting child progress/lock diagnostics or applying a bounded child timeout with
a specific error. Today `A task was canceled` only describes the outer caller ending the hung
operation, which obscures the component that stopped making progress.
