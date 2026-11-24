# Context Pack — fix-kv-queue-listen-concurrency-2651--impl

- **Issue:** #2651 (`Closes #2651` in PR body `## Scope`)
- **Branch:** `fix/kv-queue-listen-concurrency-2651`
- **Baseline:** `main` `87965d800b7d61312e8612c82bdb0cb98bdf5b29`; coordinator bootstrap `5b97a4b56be4018e3713e7c02739e7232c1413f0`
- **Archetypes / Overlays:** Archetype 2 (`packages/queue`, `Keep`), Archetype 5 + `SCOPE-service.md` (`plugins/workers`, `Refactor`)
- **Status:** S1 (`packages/queue`) implemented and verified green (94 passed / 0 failed / 25 ignored); ready for S1 commit + draft PR creation, then S2 (`plugins/workers`).

## Key Anchors
- `packages/queue/adapters/deno-kv.adapter.ts` — validates `ListenOptions.concurrency` before opening KV, short-circuits pre-aborted signals, forwards concurrency to dispatcher
- `packages/queue/adapters/_kv-queue/routes.ts` — per-listener `KvQueueRegistration` semaphore covering whole deliveries (`handler` + `ack`/`nack`), atomic slot handoff, cancellation/drain
- `packages/queue/adapters/_kv-queue/dispatcher.ts` — shared per-database listen loop, routing, crash-safe file-backed unadmitted handback (`min(25ms, parkDelayMs)`), bounded transient `enqueue` retry
- `packages/queue/adapters/_kv-queue/write-retry.ts` — locked bounded retry policy (`maxAttempts: 6`, `maxTotalTimeMs: 2_000`, `baseDelayMs: 15`, `maxDelayMs: 250`, equal jitter, abort-aware) & 4-way `WRITE_FAILURE_CLASS`
- `packages/queue/adapters/kv-dead-letter-store.ts` — bounded transient busy retry + O(1) `identityKey` verification on unknown commit outcome; CAS `{ ok: false }` stays conflict
- `packages/queue/tests/deno-kv-concurrency-contention_test.ts` — file-backed concurrency=1/2, cancellation/drain handback, whole-delivery `nack` slot coverage, `KvDeadLetterStore` contention/CAS/ambiguous regressions
- `packages/queue/tests/deno-kv-write-retry_test.ts` — unit tests for failure classification, retry ceilings/jitter/abort, and `KvQueueDispatcher.enqueue` retry vs unknown outcome
- `plugins/workers/src/runtime/settlement-persistence.ts` — (S2) worker settlement bounded retry, CAS conflict preservation, and read-verify recovery
- `plugins/workers/worker/job-dispatcher.ts` — (S2) job & task settlement persistence wiring preserving #2645 pause/ack/redelivery semantics
- `plugins/workers/tests/runtime/kv-settlement-recovery_test.ts` — (S2) file-backed worker settlement contention, CAS refusal, ambiguous commit, and concurrency=1 pause/drain/resume regressions

## Boundaries
- No Redis adapter edits (`packages/kv/adapters/redis/**` and Redis queue code belong to #2649).
- No dependency or lock edits.
- No edits to `plugins/workers` beyond settlement wiring and its regression tests.
