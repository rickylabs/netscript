# research.md — rbp-dlq-contract

## Slice

- **id**: `rbp-dlq-contract`
- **title**: Uniform dead-letter-queue contract across default/native adapters
- **severity**: blocker · **wave**: A · **dependsOn**: none
- **unit**: `packages/queue` only.
- **archetype**: ARCHETYPE-2 (Integration).

## Baseline

Worktree `.claude/worktrees/fw-prime-time` on `main` (HEAD `cc3b8731`, post S2/S3/S5/OTel). Every cited
file:line below was re-opened and re-verified at current line numbers. The single gap
`reliability-backpressure-no-dlq-default-adapters` is **fully unresolved on main**; nothing in the
queue package implements a DLQ outside `kv-polling.adapter.ts`.

## The contract surface today (`@netscript/queue`)

- `packages/queue/ports/message-queue.ts:14-49` — `MessageContext` exposes `ack()` and
  `nack(options?: { requeue?: boolean })`. There is **no DLQ concept** on the context, only requeue-or-not.
- `packages/queue/ports/message-queue.ts:57-104` — `MessageQueue<T>` interface (`nativeRetrial`,
  `enqueue`, `enqueueMany?`, `listen`, `stop`). No DLQ inspection/reprocess method on the public port.
- `packages/queue/ports/options.ts:208-230` — `TypedQueueOptions.onValidationError?: 'discard' | 'dlq' | 'throw'`
  is the **only** advertised DLQ knob on the public surface (`@default 'discard'`).
- `packages/queue/ports/options.ts:41-85` — base `QueueOptions` (provider, autoDiscover, retryAttempts,
  retryDelay, connection, disableAutoTracing). **No DLQ config.**
- `packages/queue/ports/options.ts:90-152` — `QueueConnectionOptions.denoKv` carries the KvPolling DLQ-adjacent
  knobs (`maxRetries`, `retryBaseDelay`, `retryMaxDelay`, `deduplicationWindow`) but **only** the KvPolling
  adapter consumes them.
- `packages/queue/mod.ts:50-99` — public exports: factory fns + `MessageQueue`/`MessageContext`/option types +
  errors (`QueueError`, `QueueErrorCode`, …) + validation utils. **No DLQ port/type exported.**
- `packages/queue/adapters/mod.ts:9-12` — exports the five adapter classes. Sub-path exports declared in
  `packages/queue/deno.json:6-17` (`.`, `./adapters/*`, `./ports`, `./errors`, `./validation`, `./testing`).
- `packages/queue/adapters/_envelope.ts:14-79` — shared `MessageEnvelope<T>` (`__envelope_version:1`, payload,
  headers, messageId, enqueuedAt, deliveryCount), `createEnvelope`, `isMessageEnvelope`, `createMessageContext`.
  This is the natural home for a shared DLQ record shape and a shared "route to DLQ" helper.

## Per-adapter DLQ ground truth (re-verified)

### KvPolling (the ONLY adapter with a real DLQ) — the reference impl

- `packages/queue/adapters/kv-polling.adapter.ts:142-151` — `KvPrefixes` const: `pending`,`processing`,
  `dlq:'queue:dlq'`,`dedup`.
- `:283-285` — `dlqKey(timestamp,id) = [KvPrefixes.dlq, queueName, timestamp, id]`.
- `:471-523` — `nack(message, requeue)`: when `!requeue || attempts >= maxAttempts` it writes a `dlqMessage`
  (`{...message, failedAt, reason: 'max_attempts_exceeded' | 'nack_without_requeue'}`) to `dlqKey(...)`,
  else exponential-backoff requeue. **This is the canonical DLQ record + routing logic to extract.**
- `:529-541` — `recoverTimedOutMessages()` re-nacks visibility-expired messages.
- `:564-650` — `listen()` auto-acks on handler success and `nack(message, true)` on handler error
  (`:624-630`); poison messages reach DLQ only after `attempts >= maxAttempts`.
- `:674-698` — `getStats()` returns `{pending, processing, dlq}` (DLQ depth metric, counts `KvPrefixes.dlq`).
- `:704-721` — `purge()` clears pending/processing/dlq/dedup.
- `:726-760` — `reprocessDlq(limit?)` resets attempts and requeues from DLQ. **DLQ inspection/replay surface.**
- Constructor options `:75-137`, `:202-213`: `maxRetries` default 3, etc. `nativeRetrial = false` (`:195`).

### Postgres — poison silently DELETED (no DLQ)

- `packages/queue/adapters/postgres.adapter.ts:392-418` — `createContext`: on `nack({requeue:false})` it calls
  `this.ack(storageMessageId)`.
- `:420-427` — `ack()` is a hard `DELETE FROM <table> WHERE queue_name=$1 AND message_id=$2`. So
  `nack({requeue:false})` **discards the poison message with zero DLQ record**.
- `:294-318` — `createSchema()` creates ONE table (`message_queue` default, `:16`,`:119-127`) with columns
  `queue_name,message_id,payload(jsonb),headers,delivery_count,enqueued_at,available_at,locked_at,locked_by`.
  No DLQ table. `nativeRetrial = true` (`:112`). Adapter accepts a caller-owned `PostgresQueueClient`
  (`:27-44`, `:79`) — the DLQ store can reuse the same client.

### Redis — poison LOST (no DLQ)

- `packages/queue/adapters/redis.adapter.ts:317-342` — `createContext`: on `nack`, always `lrem` from
  `processingKey`; if `requeue` it `lpush` back to `queueKey`, else **pushes nowhere → message lost**.
- `:344-363` — keys are `queueKey`/`processingKey`/`delayedKey` only; **no DLQ key**. `nativeRetrial = true`
  (`:54`). Adapter holds `RedisQueueClients` (`commands`,`blocking`) via `ensureClients()`.

### DenoKv (Fedify-backed) — ack/nack are no-ops

- `packages/queue/adapters/deno-kv.adapter.ts:291-305` — `createContext` builds a context whose
  `ack`/`nack` are `async () => {}`. Underlying delivery/retry is owned by Fedify `DenoKvMessageQueue`
  (`:9`,`:102`); the NetScript context cannot DLQ. `nativeRetrial = true` (`:64`).

### AMQP (Fedify-backed) — ack/nack are no-ops; native DLX is the real lever

- `packages/queue/adapters/amqp.adapter.ts:207-221` — `createContext` ack/nack are `async () => {}`.
- `:118-178` — `listen()` delegates to `@fedify/amqp` queue's own `listen`; the NetScript-built context is
  passed to the user handler but Fedify drives the broker ack. RabbitMQ DLQ is a broker-side dead-letter
  exchange (DLX), not a NetScript write path.

### Memory (testing) — no DLQ

- `packages/queue/testing/memory-queue.ts:180-213` — `nack({requeue:false})` just marks settled and drops.
  Test-only; not a production gap but should honor the new contract so port tests can run in-memory.

## Factory / typed-queue ground truth

- `packages/queue/factory/create-queue.ts:113-143` — `createQueue` selects provider, wraps telemetry, returns
  a lazy queue. `:149-162` `detectProvider()` priority RabbitMQ > Redis > DenoKv. `:209-229`
  `createQueueFactory` switch builds the adapter per provider; `:248-264` DenoKv path picks `KvPollingAdapter`
  only when `isKvConnect(kvPath)` is true (`:256`), else `DenoKvAdapter`. **So the DLQ-capable adapter is
  reachable only under KV Connect** — this is the structural root of the gap.
- `packages/queue/factory/create-typed-queue.ts:154-200` — typed `listen` wraps base `listen`; on validation
  failure with `onValidationError:'dlq'` it calls `context.nack({requeue:false})` (`:174-177`). Today that
  inherits each adapter's broken discard path → the advertised `'dlq'` action is a **lie on 4 of 5 adapters**.

## Doctrine constraints (authoritative)

- `docs/architecture/doctrine/08-runtime-state-failure.md:13-27` — a stateful package owes callers a
  **failure model**: "What happens when a handler throws … and when a duplicate message arrives." A queue that
  silently drops poison messages violates this.
- `:202-221` — delivery-guarantee contract: at-least-once with idempotency keys; "A package that does not
  declare its delivery guarantee is incomplete. The README states it." DLQ is the terminal failure sink of
  that model.
- `:173-200` — **error normalization**: errors crossing a runtime boundary are normalized into a structured
  record (`NormalizedError`: `code`,`message`,`cause`,`correlationId`,`attempt`,`tags`,`capturedAt`). The DLQ
  record must carry a structured failure reason consistent with this, and normalization/logging happens in one
  place (`diagnostics/`).
- ARCHETYPE-2 (`.llm/harness/archetypes/ARCHETYPE-2-integration.md:52-66`) anti-patterns: **AP-3** (don't make
  the port mirror every backend op — keep DLQ port minimal: append + list + reprocess + depth), **AP-9** (don't
  add shared helper flags instead of clear sibling adapters), **AP-11** (no module-load-time `Deno.openKv()` /
  env reads — DLQ store must take an injected KV/client, defaults resolved in the composition root, not at
  import), **AP-17** (`ports/` not `interfaces/`). Design checkpoint must name the port shape, adapter set,
  composition root, required permissions, and consumer import impact.

## Catalog / dependency law

- `packages/queue/deno.json:25-34` — imports already include `@netscript/kv` (`../kv/mod.ts`), `@std/async`,
  `@std/assert`, `zod`, and the `@fedify/*` JSR pins. The KvDeadLetterStore reuses `@netscript/kv` (already
  present) → **no new dependency, no catalog change**. Do NOT touch version pins or `@fedify/*` lines.

## Verified gap disposition

- `reliability-backpressure-no-dlq-default-adapters` (blocker): **CONFIRMED, unresolved.** Only
  `kv-polling.adapter.ts` has a DLQ (`:471-496`, depth `:674-698`, reprocess `:726`). Postgres
  `nack(requeue:false)`→hard DELETE (`:409-413`,`:420-427`); Redis pushes nowhere (`:334-339`); DenoKv/AMQP
  ack/nack no-ops (`deno-kv:302-304`, `amqp:218-219`); factory reaches DLQ-capable adapter only under KV
  Connect (`create-queue.ts:256`); typed-queue `onValidationError:'dlq'` inherits the per-adapter gap
  (`create-typed-queue.ts:174-177`); `options.ts:224-229` + `README.md:81,226` advertise the `'dlq'`
  capability. Grep for `dlq`/`deadLetter` across `packages/queue` matches only `kv-polling.adapter.ts`
  (re-verified — no `DeadLetterStorePort`/`DlqStore` class exists anywhere).

No cited line was found already resolved; nothing to drop.

## Reusable assets to wrap (do not reinvent)

- `@netscript/kv` (`getKv`, `WatchableKv`, `KvKey`) — already imported by KvPolling; the durable default DLQ
  store wraps it, mirroring `KvPrefixes.dlq` layout and `dlqKey` shape.
- `_envelope.ts` `MessageEnvelope`/`createMessageContext` — extend for the DLQ record + a shared
  `routeToDeadLetter` helper so all adapters share one code path (kills AP-9 risk of divergent flags).
- `@std/async` `delay`/`pooledMap` already available for tests and any bounded reprocess loop.