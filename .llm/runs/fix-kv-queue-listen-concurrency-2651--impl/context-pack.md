# Context Pack — fix-kv-queue-listen-concurrency-2651--impl

- **Issue:** #2651 (`Closes #2651` in PR #2657 body `## Scope`)
- **Draft PR:** `https://github.com/rickylabs/netscript/pull/2657`
- **Branch:** `fix/kv-queue-listen-concurrency-2651`
- **Baseline:** `main` `87965d800b7d61312e8612c82bdb0cb98bdf5b29`; coordinator bootstrap `5b97a4b56be4018e3713e7c02739e7232c1413f0`
- **Archetypes / Overlays:** Archetype 2 (`packages/queue`, `Keep`), Archetype 5 + `SCOPE-service.md` (`plugins/workers`, `Refactor`)
- **Status:** S1 (`bb398c780`), S2 (`7e58cd6d3`), and S3 (docs + full validation) completed; ready for independent IMPL-EVAL review (draft PR #2657 remains `status:impl`).

## Key Anchors
- `packages/queue/adapters/deno-kv.adapter.ts` — validates `ListenOptions.concurrency` before opening KV, short-circuits pre-aborted signals, forwards concurrency to dispatcher
- `packages/queue/adapters/_kv-queue/routes.ts` — per-listener `KvQueueRegistration` semaphore covering whole deliveries (`handler` + `ack`/`nack`), atomic slot handoff, cancellation/drain
- `packages/queue/adapters/_kv-queue/dispatcher.ts` — shared per-database listen loop, routing, crash-safe file-backed unadmitted handback (`min(25ms, parkDelayMs)`), bounded transient `enqueue` retry
- `packages/queue/adapters/_kv-queue/write-retry.ts` — locked bounded retry policy (`maxAttempts: 6`, `maxTotalTimeMs: 2_000`, `baseDelayMs: 15`, `maxDelayMs: 250`, equal jitter, abort-aware) & 4-way `WRITE_FAILURE_CLASS`
- `packages/queue/adapters/kv-dead-letter-store.ts` — bounded transient busy retry + O(1) `identityKey` verification on unknown commit outcome; CAS `{ ok: false }` stays conflict
- `packages/queue/README.md` — consumer documentation for local Deno KV listener concurrency and bounded transient write contention recovery
- `plugins/workers/src/runtime/settlement-retry.ts` — locked bounded transient retry & 4-way `SETTLEMENT_FAILURE_CLASS` for worker settlement writes
- `plugins/workers/src/runtime/settlement-persistence.ts` — read-first verification (`verifyIdempotencyApplied`, `verifyExecutionStatus`) and settlement helpers for worker idempotency and execution state
- `plugins/workers/worker/worker-options.ts` — optional read-only `WorkerExecutionState.get?`
- `plugins/workers/worker/job-dispatcher.ts` — job & task settlement persistence wiring preserving pause/ack/redelivery/shutdown semantics
- `plugins/workers/tests/runtime/kv-settlement-recovery_test.ts` & `settlement-persistence_test.ts` — file-backed worker busy contention, CAS refusal, ambiguous commit, task settlement, and `concurrency: 1` pause/drain/resume regressions

## Boundaries
- No Redis adapter edits (`packages/kv/adapters/redis/**` and Redis queue code belong to #2649).
- No dependency or lock edits.
- No edits to `plugins/workers` beyond settlement wiring and its regression tests.
