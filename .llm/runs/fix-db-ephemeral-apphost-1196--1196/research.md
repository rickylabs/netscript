# Research — db ephemeral AppHost lifecycle (#1196)

## Re-baseline

- Read live issue #1196 first on 2026-08-05; it has five Acceptance boxes and milestone 0.0.5.
- Fresh baseline: `origin/main` at `6c3b534fce31d261a378e4a17a6a6b6c9aabc8f8`.
- Re-read merged #1088 / commit `a8a129feb`: it introduced the nested DB-operation AppHost,
  scoped stop, PID reaping, and a resident-preservation E2E gate, but did not prove ephemeral
  absence after the command.
- Orchestrator reproduction (2026-08-04/05, #1250 verification): after `netscript db seed`,
  `aspire ps` listed both the resident project and `<project>/aspire/db-operation/apphost.mts`; the
  latter required an explicit path-scoped stop.

## Findings

1. `DbOperationRunner` serializes access with an `AppHostLifecycleLock`, yet currently classifies an
   already-running exact DB-operation path as not owned and intentionally leaves it running.
2. Normal success/failure calls `aspire stop`, but cleanup trusts command completion plus an
   optionally parsed start PID. It does not require the exact AppHost path to disappear from
   `aspire ps`.
3. No signal listener or `AbortSignal` reaches Aspire commands or polling; SIGINT/SIGTERM can bypass
   the command's awaited cleanup path.
4. `.netscript-db-operation.json` is removed normally, but the generated `aspire/db-operation/`
   project is persistent scaffold output. Acceptance requires both to be absent when a one-shot
   command returns.
5. `runDbOperation` constructs the runner directly. `DatabaseWorkspaceMutator` already owns helper
   generation and can materialize the operation project before a command; the command can remove it
   in `finally` without adding a public option.
6. The existing live gate asserts only resident PID/CLI PID/dashboard stability. It never scans
   `aspire ps` for the operation path or checks filesystem absence—the exact false-green gap.
7. Read-only host inspection found a foreign stale `db-operation` entry in another worktree whose
   advertised PIDs no longer exist. It is evidence that PID absence alone is insufficient; it was
   not mutated.

## RED baseline

The existing unit suite passes because it explicitly asserts that a pre-existing DB-operation host
is never stopped. The new regression must invert that obsolete contract and assert verified absence
after success, failure, and a simulated signal. The live gate must assert resident visibility plus
zero operation-host entries and zero operation artifacts.

## JSR/public surface scan

No export-map, binary name, command option, or returned result changes. All changes stay inside the
CLI command/adapter implementation and E2E gate. Publish/doc-lint remains an archetype gate; the
planned surface introduces no slow-type risk.

## Open questions

None that force later rework. `db studio` remains resident/interactive and does not use the
ephemeral project, so acceptance box 4 is earned by proving that no ephemeral host persists rather
than by inventing a persistence mode.
