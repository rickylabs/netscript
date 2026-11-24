# Context Pack — fix-kv-queue-listen-concurrency-2651--impl

- **Issue:** #2651 (`Closes #2651` in PR #2657 body `## Scope`)
- **Draft PR:** `https://github.com/rickylabs/netscript/pull/2657`
- **Branch:** `fix/kv-queue-listen-concurrency-2651`
- **Baseline:** `main` `87965d800b7d61312e8612c82bdb0cb98bdf5b29`; coordinator bootstrap `5b97a4b56be4018e3713e7c02739e7232c1413f0`
- **Archetypes / Overlays:** Archetype 2 (`packages/queue`, `Keep`), Archetype 5 + `SCOPE-service.md` (`plugins/workers`, `Refactor`), zero public API additions across all 3 packages (internal non-enumerable read-only lookup symbol on `KvWorkerIdempotencyStore`, internal `ReadableExecutionState` port in `settlement-persistence.ts`)
- **Status:** S1 (`bb398c780`), S2 (`7e58cd6d3`), S3 (`ead877193`), Fix round 1 (`9f8a2c369`, `0e0b551de`), and Fix round 2 (all 3 blockers + zero-public-surface-diff resolution for `issuecomment-7133760550`) completed and verified green; ready for independent IMPL-EVAL round 3 (draft PR #2657 remains `status:impl`).

## Key Anchors
- `packages/queue/adapters/_envelope.ts` — internal `requeueEpoch` metadata and deterministic content-derived `legacy-<hash>` IDs for raw non-envelope payloads in `toAddressedEnvelope`
- `packages/queue/adapters/deno-kv.adapter.ts` — validates `ListenOptions.concurrency` before KV open, retains attempted settlement promise on rejection, delegates atomic requeue fencing, calls `stopQueue` on permanent `stop()`
- `packages/queue/adapters/_kv-queue/routes.ts` — per-listener `KvQueueRegistration` semaphore covering whole deliveries (`handler` + `ack`/`nack`), atomic slot handoff, cancellation/drain, `has(queueName)`
- `packages/queue/adapters/_kv-queue/dispatcher.ts` — shared per-database listen loop, pre-routing `isRequeueCommitted` fence with post-ack marker cleanup (no wall-clock TTL), explicit `pauseQueue`/`resumeQueue`/`stopQueue` lifecycle, bounded `reroute -> unroutable DLQ` for retired routes, single hop-0 handback for unadmitted waiters
- `packages/queue/adapters/_kv-queue/registry.ts` — process-wide dispatcher registry keyed by KV path or caller-owned instance (`acquireKvQueueDispatcher`)
- `packages/queue/adapters/_kv-queue/write-retry.ts` — locked bounded retry policy (monotonic retry-start deadline checked before & after backoff), explicit non-busy SQLite code precedence, durable zero-TTL atomic requeue marker helpers (`requeueMarkerKey`, `isKvRequeueCommitted`, `deleteKvRequeueMarker`, `requeueKvEnvelopeAtomically`)
- `packages/queue/adapters/kv-dead-letter-store.ts` — bounded transient busy retry + O(1) `identityKey` verification on unknown commit outcome; CAS `{ ok: false }` stays conflict
- `packages/queue/README.md` — consumer documentation for local Deno KV concurrency, explicit pause vs permanent stop, pre-routing zero-TTL requeue fence + legacy payload rule, and retry-start deadline
- `packages/plugin-workers-core/src/stores/kv-worker-idempotency-store.ts` — non-enumerable internal read-only lookup symbol (`Symbol.for('netscript.workers.idempotency.isApplied')`, `#kv.has(...)`, zero mutations, zero public export diff)
- `plugins/workers/src/runtime/settlement-retry.ts` — locked bounded retry policy (retry-start deadline checked before & after backoff) & explicit non-busy SQLite code precedence
- `plugins/workers/src/runtime/settlement-persistence.ts` — internal `INTERNAL_APPLIED_LOOKUP_SYMBOL` + zero-mutation `verifyIdempotencyApplied`, internal `ReadableExecutionState` + `verifyExecutionStatus`, and telemetry-free `settleAppliedExecution`
- `plugins/workers/worker/job-dispatcher.ts` — job & task settlement persistence with post-success `executionSucceeded` catch latch covering `addJobStepEvent('state_update', { status: 'completed' })`, metrics, and logging
- Regressions: `packages/queue/tests/{deno-kv-concurrency-contention,deno-kv-sibling-pause,deno-kv-nack-ambiguity,deno-kv-requeue-fence,deno-kv-write-retry,envelope}_test.ts`, `packages/plugin-workers-core/src/stores/kv-worker-idempotency-store_test.ts`, `plugins/workers/tests/runtime/{kv-settlement-recovery,settlement-persistence,kv-settlement-post-success}_test.ts`

## Boundaries
- No Redis adapter edits (`packages/kv/adapters/redis/**` and Redis queue code belong to #2649).
- No dependency, lock, or `.github/` edits.
