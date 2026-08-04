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
