# Independent implementation slice review

Before the implementation commit; final exact-head attestation is posted on the PR after push.

**IMPL-EVAL round 1: issue #2401, Aspire watch lifecycle (uncommitted slice, blockers only)**

I found no source or evidence blockers. This is not the final exact-head attestation.

**Ordering follows the locked plan**
- `watchExecutableCompletion` opens the resource-scoped follower first and reads up to the first matching record before calling `start`. All of this runs under one deadline.
- After `start`, a terminal record is accepted only once a new nonterminal record has been seen. So stale replays from a previous run are ignored, and a run with no fresh lifecycle fails closed.
- Tests cover a stale earlier terminal record followed by a new run, a fast run, an early end of stream, a run with no new lifecycle, and a run with no terminal record.

**Identity and exit codes**
- Records must match the exact display name or name and have type `Executable`. Sibling resources and non-executable records are ignored, and there are tests for both.
- A terminal state is accepted only with a non-negative integer exit code. Anything else throws.
- Each follow record is checked against the exact resource, scoped by the `--apphost` argument.

**No snapshot polling**
- The `describe` snapshot loop and its sleep are removed from the database runner.
- The polling guard test now also scans shipped CLI source (`packages/cli/src`), not just the CLI E2E source.
- The negative control restored the old `operation-runner.ts`, and the run exited 1. The named test `one follow stream spans simulated minutes without snapshot polls` failed (0 versus 1), and the migration test also caught the forbidden `describe` call.

**Cancellation, deadline and child reaping**
- The executor stream ends on EOF, abort, a malformed record, an oversized line or a nonzero exit.
- Its `finally` sends SIGTERM, escalates to SIGKILL after a named grace period of 1 second, cancels the reader, then awaits the exit status and the stderr drain.
- stderr is drained concurrently, and only a bounded tail is kept.
- Real fake-CLI child processes cover:
  - early return
  - quiet timeout with a child that ignores SIGTERM (SIGTERM then SIGKILL observed)
  - cancellation by the caller
  - malformed JSON
  - split UTF-8 and CRLF line endings
  - nonzero exit
  - an oversized line
  
  Each case asserts that the child was reaped, and Deno's resource sanitizer also passes.
- A deadline that hits during `resource start` aborts the start command and surfaces the timeout error.

**Cleanup ownership**
- `resource stop` runs only if a start was requested.
- The request file is removed even when the stop fails.
- Tests cover a failure during initial observation (no stop, file removed) and a run with no exit code (stop issued, file removed).

**Public surface**
- `AspireCommandExecutor` is still internal and has no implementers outside the operations folder.
- No exports, dependencies, templates or SDK pins changed.
- The CLI JSR audit dry run passes, with warnings unchanged from baseline.

**Evidence**
- 53 focused tests pass with zero failures or ignores.
- check, lint and fmt pass, with lint and fmt processing every selected file.
- `quality:gate`, the Aspire host-port scan and the docs link check pass.
- `scaffold.runtime` is correctly recorded as UNPROVEN, pending the coordinator-owned CI run.
- The docs qualify the upstream measurements and do not claim a fix.

**Risks for CI (not blockers)**
- The follow-record shape is tested only with synthetic records, not recorded Aspire 13.5.3 output. If real records lacked `resourceType`, the watch would time out rather than report a false success. The coordinator's `scaffold.runtime` run, which exercises database init, is the gate that would catch this.
- The worklog still says the JSR audit is "recorded when complete". `gate-results.json` now contains it, so that line is out of date.

PASS
