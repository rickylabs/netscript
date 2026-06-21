# research.md — worker-applied-keys-dedup

## Slice meta (from blocker_slices.json key `worker-applied-keys-dedup`)

- **Title:** Worker consumer-side applied-keys dedup + JobMessage idempotency propagation
- **Severity:** blocker · **Wave:** A · **dependsOn:** none
- **Units:** `plugins/workers`, `packages/plugin-workers-core` (the slice meta lists
  `packages/queue`, but ground-truth below shows the queue layer is **not** the defect site — the
  queue already exposes `deduplicationId` (enqueue-time) and `deliveryCount` (consume-time). The
  fix belongs in the worker consumer + the workers-core message/port contracts. `packages/queue`
  is read-only context here; we do not modify it.)

## Doctrine ground truth (verbatim, verified)

`docs/architecture/doctrine/08-runtime-state-failure.md:202-221` — "Idempotency, ordering, and
exactly-once":

- NetScript runtime packages **default to at-least-once with idempotency keys** (211-212).
- The contract (214-218): "Every inbound message carries an idempotency key. The handler's effects
  are keyed on it. The store records 'applied keys' and rejects duplicates with a structured
  'already applied' outcome that the supervisor records but does not treat as a failure."
- (220-221) "A package that does not declare its delivery guarantee is incomplete. The README
  states it."

This is the exact contract the worker path violates today.

## Gap-by-gap verification against current `main`

### Gap 1 — `idempotency-e2e-worker-consumer-no-dedup` (blocker, partial) — CONFIRMED

- `plugins/workers/worker/job-dispatcher.ts:17-127` — `processWorkerJob` unconditionally calls
  `context.executionState.create(...)` (line 41) then `traceJobExecution → executeWorkerJob`
  (101-107). No applied-key read/claim. It never reads `deliveryCount`/attempts. Verified
  (evidence cited lines 31-119 ≈ verified 17-127 after shifts).
- `plugins/workers/worker/job-dispatcher.ts:130-196` — `processWorkerTask` unconditionally calls
  `context.taskExecutor.execute(...)` (line 157). No dedup. Verified (evidence cited 140-170).
- `plugins/workers/worker/worker.ts:244-275` — `listenForJobs` forwards every delivery into
  `processWorkerJob(this.dispatchContext(), message, context as TracedMessageContext)` with no
  dedup gate (evidence cited 251-267). Verified.
- `plugins/workers/worker/queue-consumer.ts:49-73` (`startTaskQueueListener`) and `93-131`
  (`listenToTriggerQueue`) — same: every delivery dispatched without a dedup gate. Verified
  (this is an additional consumer path the evidence under-cited; the task + queue-trigger paths
  must also be guarded).
- `packages/queue/adapters/kv-polling.adapter.ts:497-522` — `nack()` requeues the **same**
  message id with incremented attempts → at-least-once redelivery. Verified.
- `packages/queue/adapters/kv-polling.adapter.ts:529-541` — `recoverTimedOutMessages()` re-nacks
  visibility-expired messages. Verified.
- `packages/queue/adapters/kv-polling.adapter.ts:546-559` — `createContext()` sets
  `MessageContext.deliveryCount = message.attempts`; **no worker code consumes it**. Verified.
  (`packages/queue/ports/message-queue.ts:14-49` confirms `MessageContext.deliveryCount` and
  `headers` are part of the public consume contract.)
- `packages/plugin-workers-core/src/runtime/runtime-types.ts` — grep for idempotency returns zero;
  `JobMessage`/`TaskMessage` carry only `correlationId`/trace fields. Verified.
- CONTRAST verified: `packages/plugin-triggers-core/src/ports/trigger-idempotency-port.ts:1-24`
  (`TriggerIdempotencyPort` with `resolveKey/markCompleted/release`) and
  `packages/plugin-sagas-core/src/runtime/saga-idempotency.ts:51-70` (`reserve` first-wins TTL
  reservation) implement the applied-key pattern for siblings; neither is consumed by workers.

### Gap 2 — `idempotency-e2e-jobmessage-no-idempotency-field` (high, dropped-input) — CONFIRMED

- `packages/plugin-workers-core/src/runtime/runtime-types.ts:134-161` — `JobMessage` (134-146) and
  `TaskMessage` (149-161) define `jobId/taskId, topic, triggeredBy, triggeredAt?, payload?,
  priority?, correlationId?, traceparent?, tracestate?`. **No `idempotencyKey`/`deduplicationId`
  field.** Verified.
- `plugins/triggers/src/runtime/trigger-runtime-processor.ts:111-119` — `enqueueWorkerJob` builds
  the `JobMessage` without an idempotency field; `:142` passes
  `deduplicationId: action.options.idempotencyKey ?? event.idempotencyKey ?? event.id` to
  `queue.enqueue` options **only** (enqueue-time queue dedup), never onto the message body.
  Verified. So the producer *has* a key in hand and discards it past the queue boundary.
- `plugins/workers/worker/job-dispatcher.ts:22` — consumer destructures only
  `{ jobId, payload, correlationId }`; no idempotency key reaches `executionState.create`. Verified.
- MITIGATION (does not resolve) verified: `packages/queue/adapters/kv-polling.adapter.ts:290-323`
  enforces `deduplicationId` via a KV TTL marker **at enqueue only**, and only on the KvPolling
  adapter. It does not survive nack/redelivery or visibility-timeout recovery, and other adapters
  (deno-kv/redis/postgres/amqp) do not honor it at consume time.

## Existing assets to reuse (wrap, don't reinvent)

- **Durable substrate:** `plugins/workers/services/src/service-runtime.ts:11-19` already builds the
  workers runtime from `getKv()` (`@netscript/kv`, returns `WatchableKv`) cast to
  `RegistryKvStore`. `KvExecutionState`, `KvJobRegistry`, `KvTaskRegistry` all run over this same KV.
  The applied-keys store must run over the **same** KV handle — this is the durable, restart-safe,
  cross-replica store the doctrine demands. `plugins/workers/deno.json:30` already imports
  `@netscript/kv`.
- **KV contract:** `packages/kv/types/kv-store.ts:45-184` — `KvStore` (extended by `WatchableKv`)
  exposes `get`/`set(key,value,{expireIn})`/`delete`/`has`/`list` and an **optional**
  `atomic?(checks, mutations)` (line 171). `AtomicMutation` supports
  `{ type:'set', key, value, expireIn? }` (line 190). TTL expiry is native via `expireIn`.
- **Idempotency port shape precedent:** triggers `TriggerIdempotencyPort` (resolve/markCompleted/
  release three-state claim) and `KvTriggerIdempotencyStore`
  (`plugins/triggers/src/runtime/kv-trigger-runtime-stores.ts:104-165`) — the canonical durable
  applied-keys implementation in this repo (active-claim + completed-marker keys, atomic check-null
  reservation, TTL via `expireIn`, `release` on failure, SHA-256 payload-hash fallback at 244-251).
  We mirror its semantics but over the `WatchableKv`/`KvStore` abstraction (not raw `Deno.Kv`),
  because the workers composition root standardizes on `getKv()`.
- **Registry pattern precedent:** `packages/plugin-workers-core/src/registry/registry-options.ts`
  (`RegistryKvStore` minimal shape + `RegistryOptions.kv?`) — the established way workers-core
  adapters accept an injected KV. The applied-keys store mirrors this constructor shape.

## Port placement decision

- The **port type** (`WorkerIdempotencyPort` + claim/result types + `JobMessage.idempotencyKey`
  field) is a runtime contract → lives in `@netscript/plugin-workers-core`
  (`src/ports/worker-idempotency-port.ts`, re-exported from `src/ports/mod.ts` and the runtime
  message types in `src/runtime/runtime-types.ts`). plugin-workers-core deno.json does **not**
  import `@netscript/kv`, so the port stays storage-agnostic (Deno/web-API-free, type-only).
- The **concrete KV-backed store** lives in `plugins/workers/worker/` (e.g.
  `worker-idempotency-store.ts`) — that package already imports `@netscript/kv`. This keeps the
  publishable core package free of a `@netscript/kv` dependency and mirrors how triggers places
  `KvTriggerIdempotencyStore` in the plugin, not the core.

## Catalog / JSR notes

- No new npm deps. SHA-256 fallback uses Web Crypto `crypto.subtle` (already used by triggers) — no
  import. `@netscript/kv` is already an import in `plugins/workers/deno.json`. No `catalog:`/`jsr:`
  pin changes; do not touch `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, or version
  pins. `@netscript/cli` is untouched.
- New core exports (`WorkerIdempotencyPort` + claim types) are interface/type-only → no slow-type
  risk on the published surface. New plugin store is internal to `./worker` subpath which is
  already a published export (`plugins/workers/deno.json:15`).

## Out of scope (explicit)

- `packages/queue` adapters (DLQ uniformity is a separate slice `rbp-dlq-contract`).
- Saga/streams idempotency (separate Wave-A slices).
- `packages/aspire`, scaffold versions, version pins, `@netscript/cli`.
