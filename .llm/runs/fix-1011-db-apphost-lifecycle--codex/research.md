# Research — fix-1011-db-apphost-lifecycle--codex

## Re-baseline

- Carried-in source: issue #1011 plus the user's verified reproduction and cause candidates.
- Re-derived against `origin/main` @ `3ab64720f` on 2026-08-01.
- The branch is clean, exactly at `origin/main`, and has no upstream.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | Every detached DB operation enters `finally` and unconditionally calls `stopDetached(apphostPath, aspireDir)`. | `packages/cli/src/kernel/adapters/database/operation-runner.ts` (`executeDetached`) |
| 2 | `stopDetached` executes `aspire stop --apphost <same aspire/apphost.mts>`, which directly targets the resident project identity. | Same file (`stopDetached`) and `aspire stop --help` |
| 3 | The existing fake-executor success test records `stop` as the last command and has no pre-start ownership probe. | `operation-runner_test.ts` |
| 4 | `studio` uses the interactive `aspire run`/spawn path and never calls detached cleanup. | `executeOne` / `executeInteractive` and the studio test |
| 5 | Aspire 13.4.6 exposes `describe --format Json` for a read-only running-instance probe. `start --isolated` exists, but `stop` exposes no PID/instance selector, so isolated cleanup cannot be made ownership-safe through the current command seam. | `aspire start|describe|stop --help` |
| 6 | No checked-in runnable AppHost fixture exists in this worktree, so the supplied clean-room 2/2 reproduction remains the live-runtime evidence. The deterministic executor seam can prove command ownership and the absence of `stop`. | `find . -maxdepth 3 -name apphost.mts -o -name apphost.cs` |
| 7 | The explicit `aspire stop` is sufficient to cause the reported termination and definitely fires even when the DB resource exits non-zero. The issue's separate “Aspire retires an existing identity when the short-lived host exits” mechanism is not established by repository evidence. | Control flow in `executeDetached`; issue reproduction |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/cli/deno.json` exports (`.`, `./scaffolding`, `./testing`) and binary.
- Planned change is private adapter/test behavior only: no export, entrypoint, signature, dependency,
  metadata, or publish file-list change.
- Slow-type / surface risks: none introduced; targeted check plus the existing package quality gates
  are sufficient. A publish dry-run is not needed to prove an unchanged public surface.

## Open questions

- Resolved for planning: use a pre-start `describe` probe and explicit `startedByInvocation`
  ownership. Cleanup is permitted only when this invocation observed no resident AppHost before
  starting. This is the issue's stated minimum viable shape.
- Safe to defer: a PID-addressable Aspire backchannel or unique generated DB AppHost identity. The
  current Aspire `stop` CLI cannot address an isolated instance by PID, and template work would
  expand this bounded fix.
