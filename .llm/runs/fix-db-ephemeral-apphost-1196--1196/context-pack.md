# Context pack — db ephemeral AppHost lifecycle (#1196)

Branch `fix/db-ephemeral-apphost-1196`, baseline `6c3b534fce31d261a378e4a17a6a6b6c9aabc8f8`.
Archetype 6, D6 composed evaluation. Live issue has five acceptance boxes.

Current main contains #1088's distinct nested operation AppHost and normal stop/PID reap, but its
ownership rule preserves a pre-existing operation host and its E2E gate checks only resident
stability. There is no signal cancellation and the generated operation project remains in the
workspace. The locked correction makes the lifecycle lock authoritative, verifies exact-path and
PID absence, materializes/removes the operation project around one-shot commands, and extends the
live gate to prove the resident remains the sole visible host.

Foreign state: pre-existing modified `deno.lock`; never stage. A read-only `aspire ps` also showed a
foreign stale operation-host record in another worktree; never mutate it.

## Current state — 2026-08-05

- Implementation commit: `e29a7ad9e`.
- RED: the exact-path pre-existing AppHost scenario failed because no `stop` was issued.
- GREEN: focused runner/command tests cover success, failure, signal, artifact removal, and studio;
  the complete CLI package suite passes.
- Live proof: `scaffold.runtime` passed 71/71, including the strengthened read-only `db status`
  gate proving resident identity stability, operation-host absence from `aspire ps`, and operation
  directory/request absence.
- Required gates green: scoped check/lint/fmt, `quality:gate`, package check/test, publish dry-run.
- Next: push evidence, update the draft PR, and transition draft→ready/status:impl-eval so the
  milestone-run composed evaluator triggers; then mirror acceptance and move to ready-merge.
