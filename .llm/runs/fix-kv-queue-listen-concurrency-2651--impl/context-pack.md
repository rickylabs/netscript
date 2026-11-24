# Context Pack — fix-kv-queue-listen-concurrency-2651--impl

- **Issue:** #2651 (`Closes #2651` in PR #2657 body `## Scope`)
- **Draft PR:** `https://github.com/rickylabs/netscript/pull/2657`
- **Branch:** `fix/kv-queue-listen-concurrency-2651`
- **Baseline:** `main` `87965d800b7d61312e8612c82bdb0cb98bdf5b29`; coordinator bootstrap `5b97a4b56be4018e3713e7c02739e7232c1413f0`
- **Archetypes / Overlays:** Archetype 2 (`packages/queue`, `Keep`), Archetype 5 + `SCOPE-service.md` (`plugins/workers`, `Refactor`), surgical best-effort span guard in `packages/telemetry/src/instrumentation/queue.ts` (zero open-PR overlap), zero public API additions and zero cross-package hidden runtime protocols across all 4 touched packages
- **Status:** S1 (`bb398c780`), S2 (`7e58cd6d3`), S3 (`ead877193`), Fix round 1 (`9f8a2c369`, `0e0b551de`), Fix round 2 (`c02f21842`, `1abcb7b3a`), Fix round 3 (`4e2ffdc89`, `0b4a6e978`), and Fix round 4 (Items A, B, C from `issuecomment-7140900682`) completed; awaiting owner decision on Acceptance box 3 before round 5 (draft PR #2657 remains `status:impl`).

## Key Anchors
- `packages/queue/adapters/_envelope.ts` — envelope normalization (`toAddressedEnvelope` preserves v1 `messageId` and assigns fresh unique UUIDs to distinct raw non-envelope payloads)
- `packages/queue/adapters/deno-kv.adapter.ts` — validates `ListenOptions.concurrency` before KV open; marks per-adapter pause token on `options.signal` abort while live (`Worker.pause()`) and clears on resume/`stop()`; retains attempted settlement promise so failed explicit `nack` never issues a second counted `nack`
- `packages/queue/adapters/_kv-queue/routes.ts` — per-listener `KvQueueRegistration` semaphore covering whole deliveries (`handler` + `ack`/`nack`), atomic slot handoff, cancellation/drain, `has(queueName)`
- `packages/queue/adapters/_kv-queue/dispatcher.ts` — shared per-database listen loop, token-counted pause state (`markPaused`/`clearPause`/`pauseQueue`/`resumeQueue`/`stopQueue`), per-queue `#admittedByQueue` drain wait before parking paused deliveries (eliminates competing SQLite parking writes during settlement), bounded `reroute -> unroutable DLQ` for retired routes
- `packages/queue/adapters/_kv-queue/registry.ts` — process-wide dispatcher registry keyed by KV path or caller-owned instance (`acquireKvQueueDispatcher`)
- `packages/queue/adapters/_kv-queue/write-retry.ts` — locked bounded retry policy (monotonic retry-start deadline checked before & after backoff) and explicit non-busy SQLite code precedence
- `packages/queue/adapters/kv-dead-letter-store.ts` — bounded transient busy retry + O(1) `identityKey` verification on unknown commit outcome; CAS `{ ok: false }` stays conflict
- `packages/queue/README.md` — consumer documentation for local Deno KV concurrency, pause vs permanent stop, zero blind replay, at-least-once transport semantics, and the local-worker external-effect crash boundary
- `packages/telemetry/src/instrumentation/queue.ts` — best-effort `TracedQueue` post-handler/ack/nack/error span operations (`bestEffortSpan`) so queue telemetry faults after handler completion never trigger a counted requeue or mask real handler errors
- `packages/plugin-workers-core/src/stores/kv-worker-idempotency-store.ts` — read-only owner-token commit verification inside `markApplied` on ambiguous write errors while preserving CAS `{ ok: false }` conflicts (zero new public API, zero `Symbol.for`)
- `plugins/workers/src/runtime/settlement-retry.ts` — locked bounded retry policy (retry-start deadline checked before & after backoff) & explicit non-busy SQLite code precedence
- `plugins/workers/src/runtime/settlement-persistence.ts` — internal `ReadableExecutionState` + `verifyExecutionStatus`, telemetry-free `settleAppliedExecution`, and best-effort `logPostEffectSettlementFailure`
- `plugins/workers/worker/job-dispatcher.ts` — job & task settlement persistence with post-success `executionSucceeded` catch latch covering completion span events, metrics, logging, and best-effort `finally` gauge updates
- Regressions: `packages/queue/tests/{deno-kv-concurrency-contention,deno-kv-sibling-pause,deno-kv-nack-ambiguity,deno-kv-requeue-fence,deno-kv-write-retry,envelope}_test.ts`, `packages/telemetry/tests/instrumentation/queue-consumer_test.ts`, `packages/plugin-workers-core/src/stores/kv-worker-idempotency-store_test.ts`, `plugins/workers/tests/runtime/{kv-settlement-recovery,settlement-persistence,kv-settlement-post-success,worker-sibling-pause}_test.ts`

## Boundaries
- No Redis adapter edits (`packages/kv/adapters/redis/**` and Redis queue code belong to #2649).
- No dependency, lock, or `.github/` edits.
- Acceptance box 3 owner decision pending before round 5 (see `worklog.md` `## Acceptance Box 3 — Owner Decision Analysis (Fix round 4)`).
