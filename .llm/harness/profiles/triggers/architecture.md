# Triggers — Architecture

> **Purpose.** The production-grade target shape for `@netscript/plugin-triggers-core`
> and `@netscript/plugin-triggers`. The implementer reads this before any slice
> in Group F.
>
> **Source.** Derived from
> `.llm/research/triggers-production-architecture/07-netscript-triggers-synthesis.md`.
> The synthesis is the long form; this is the operational summary.
>
> **Status.** This is **v1**. Sections marked "see v2" are superseded by
> `.llm/tmp/run/feat-plat-impl-triggers--plan-and-impl/architecture-v2.md`
> (rescope target absorbing evaluator findings F-1..F-14). Read v1 for the
> unchanged sections (layers, T1 pipeline, durability tiers, observability
> spec); read v2 for kind taxonomy (§3), idempotency precedence (§6),
> testing surface (§11), scheduler primitive (§13), watcher primitive (§14),
> Concept of Done (§16), primitive audit table (§17), and scheduler-ownership
> decision (§18).
>
> **Key cross-cutting decision.** `@netscript/cron` is a generic scheduling
> primitive. `plugin-triggers-core` does NOT import it. The core defines
> `TriggerSchedulerPort`. The Tier-2 plugin provides a `@netscript/cron` adapter.
> This mirrors the workers pattern and prevents scheduling primitive fragmentation.
> **See `architecture-v2.md` §18** for the locked decision that scheduling
> lives on the triggers axis (not workers), backed by cross-ecosystem evidence
> in `10-cross-ecosystem-libraries.md` §1.

## 1. The one-sentence shape

> A NetScript trigger is a **frozen definition** discovered statically by the
> walker, executed by an injected **runtime** (processor + ingress + scheduler +
> store), with **ack-then-process** event ingestion, **idempotent action
> dispatch**, and **cross-axis typed cascading** to workers, sagas, and streams.

## 2. Layers

| Layer | Owner | What lives here |
|---|---|---|
| **Userland** | Application repo (`triggers/*-trigger.ts`) | Frozen `TriggerDefinition` values produced by `defineWebhook(...)`, `defineFileWatch(...)`, `defineScheduledTrigger(...)` |
| **Core (Tier 1)** | `@netscript/plugin-triggers-core` | DSL builders, ports, default adapters, processor engine, telemetry, contracts, testing |
| **Plugin (Tier 2)** | `@netscript/plugin-triggers` | HTTP ingress service, file-watcher runtime, scheduler adapter, CLI, scaffolding, Aspire resource, e2e gates |
| **Infra primitives** | `@netscript/{cron,queue,kv,watchers,streams}` | Generic primitives consumed via ports by both core and plugin |

## 3. Trigger Kinds

| Kind | Event source | Ingress pattern | Key production concern |
|---|---|---|---|
| **Webhook** | External HTTP POST | `POST /webhooks/:triggerId` → fast 202 ACK → queue → processor | HMAC verification, dedup, fast ack (<100ms) |
| **FileWatch** | File system events | `@netscript/watchers` → event → processor | Debounce, stability threshold, lifecycle (archive/delete) |
| **Scheduled** | Cron-like ticks | `TriggerSchedulerPort` → `TriggerEvent` → queue → processor | Durability (schedule in KV), backfill, timezone |

All three kinds produce a unified `TriggerEvent` that flows through the same dispatch pipeline.

## 4. Durability Tiers

| Tier | Guarantee | What it means for triggers |
|---|---|---|
| **T1** (default) | At-least-once event delivery | Event is ack'd, persisted to store, dispatched with retry. Duplicate delivery possible. |
| **T2** (deferred) | Exactly-once event processing | Outbox pattern: event persistence + action dispatch commit atomically. |
| **T3** (deferred) | Event-sourced replay | Full event history stored; trigger definitions can replay against historical events. |

Group F ships T1. T2/T3 are reserved as ports in core, implemented in Phase 7.

## 5. Ack-Then-Process Pipeline

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  Webhook    │     │   Ingress    │     │   Queue /    │     │  Trigger     │
│  Provider   │────▶│  (fast 202)  │────▶│   Event      │────▶│  Processor   │
│  (Stripe)   │     │  verify HMAC │     │   Store      │     │  dispatch    │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                                                              │
                                    ┌─────────────────────────┼─────────────────────────┐
                                    ▼                         ▼                         ▼
                              ┌───────────┐            ┌───────────┐            ┌───────────┐
                              │ enqueueJob│            │ publishSaga│            │ emitStream│
                              │ (workers) │            │  (sagas)  │            │ (streams) │
                              └───────────┘            └───────────┘            └───────────┘
```

The **Ingress** (plugin layer) does minimum work:
1. Parse HTTP body.
2. Verify HMAC via `WebhookVerifierPort`.
3. Create `TriggerEvent`.
4. Persist to `TriggerEventStore` (via port).
5. Return 202.

The **Processor** (core layer) does the work:
1. Poll / subscribe to event store.
2. Deduplicate via `TriggerIdempotencyPort`.
3. Open OTEL span `trigger.process`.
4. Dispatch each action in the trigger's action chain.
5. Handle retries per `TriggerRetryPolicy`.
6. On exhaustion, send to `TriggerDlqPort`.
7. Close span, update event status.

## 6. Idempotency Model

Event-level (producer-side): dedup by `event.idempotencyKey ?? hash(event.payload)` within a TTL window (default 24h).

Action-level (consumer-side): each dispatched action carries an idempotency key to the downstream system:
```ts
// EnqueueJobAction carries key to workers
readonly idempotencyKey?: string;  // = `${triggerId}:${eventId}:${actionIndex}`
```

## 7. Concurrency and Throttling

```ts
export interface TriggerConcurrencySpec {
  readonly limit: number;
  readonly key?: (event: TriggerEvent) => string;
}
```
A semaphore per `(triggerId, concurrencyKey)` limits in-flight dispatches.

## 8. Retry Policy

```ts
export interface TriggerRetryPolicy {
  readonly maxAttempts: number;        // @default 3
  readonly initialDelayMs: number;      // @default 1000
  readonly maxDelayMs: number;          // @default 300_000
  readonly backoffMultiplier: number;   // @default 2
  readonly jitter: boolean;             // @default true
  readonly nonRetryableErrors?: readonly string[];
}
```

## 9. Circuit Breaker

```ts
export interface TriggerCircuitBreakerSpec {
  readonly failureThreshold: number;  // @default 5
  readonly cooldownMs: number;        // @default 60_000
  readonly probeIntervalMs: number;   // @default 30_000
}
```

Circuit breaker state is stored in the trigger state store (KV-backed), surviving restarts.

## 10. Dead Letter Queue

```ts
export interface TriggerDlqPort {
  enqueue(entry: TriggerDlqEntry): Promise<void>;
  list(options: { triggerId?: string; since?: Date }): Promise<TriggerDlqEntry[]>;
  replay(eventId: TriggerEventId): Promise<void>;
}
```

## 11. Graceful Shutdown

```ts
await processor.stop({ drainTimeoutMs: 30_000 });
```

## 12. Observability Spec

Traces:
- `trigger.ingress` (server)
  - `trigger.detect` (internal)
  - `trigger.process` (internal)
    - `trigger.action.dispatch` (producer)
    - `trigger.dlq.enqueue` (producer) [if exhausted]
  - `trigger.ingress.response` (server)

Metrics:
- `netscript_trigger_ingress_total{trigger_id, type, status}` (counter)
- `netscript_trigger_dispatch_duration_ms{trigger_id, action_kind, outcome}` (histogram)
- `netscript_trigger_dlq_total{trigger_id, reason}` (counter)
- `netscript_trigger_circuit_breaker_state{trigger_id, state}` (gauge)
- `netscript_trigger_concurrent_dispatches{trigger_id, key}` (gauge)

## 13. @netscript/cron Cross-Cutting Concern

**Decision:** `@netscript/cron` is a generic scheduling primitive. `plugin-triggers-core` does NOT import it.

| Package | Role |
|---|---|
| `@netscript/cron` | Generic `createScheduler()`, `DenoCronAdapter`, `MemoryCronAdapter` |
| `plugin-triggers-core` | Defines `TriggerSchedulerPort` (contract) |
| `plugin-triggers` (Tier-2) | Provides `CronTriggerSchedulerAdapter` (wraps `@netscript/cron`) |

## 14. Public Surface (≤25 root exports)

```ts
// @netscript/plugin-triggers-core/mod.ts

// Builders (3)
export { defineWebhook, defineFileWatch, defineScheduledTrigger } from './src/public/builders.ts';

// Types — branded IDs (3)
export type { TriggerId, TriggerEventId, WebhookId } from './src/public/ids.ts';

// Types — definitions (4)
export type {
  TriggerDefinition, TriggerKind,
  WebhookDefinition, FileWatchDefinition, ScheduledTriggerDefinition,
} from './src/public/definitions.ts';

// Types — events (2)
export type { TriggerEvent, TriggerEventStatus } from './src/public/events.ts';

// Types — specs (2)
export type { TriggerRetryPolicy, TriggerConcurrencySpec } from './src/public/specs.ts';

// Types — ports (3)
export type {
  TriggerProcessorPort, TriggerIngressPort, TriggerSchedulerPort,
} from './src/public/ports.ts';

// Runtime (3)
export { createTriggerProcessor, TriggerProcessor } from './src/public/processor.ts';
export { createTriggerIngress } from './src/public/ingress.ts';

// Errors (2)
export { TriggersError, TriggerNotFoundError, TriggerDeduplicatedError } from './src/public/errors.ts';

// Inspect (1)
export { inspectTrigger } from './src/public/inspect.ts';

// Total: 23 ✓
```

Subpaths in `deno.json` `exports`:
`.`, `./builders`, `./domain`, `./ports`, `./runtime`, `./adapters`, `./telemetry`, `./contracts/v1`, `./testing`, `./config`.

## 15. Cross-Axis References

| Reference | From | To | Mechanism |
|---|---|---|---|
| `enqueueJob` action | triggers-core | workers-core `JobDefinition` | typed — `JobId<TId>` branded |
| `publishSaga` action | triggers-core | sagas-core `SagaDefinition` | typed — `SagaId<TId>` branded |
| `emitStream` action | triggers-core | streams-core `StreamTopicDefinition` | typed — topic name |
| `idempotencyKey` | triggers-core | workers-core | string propagated |

## 16. Concept of Done (Group F)

| Outcome | Evidence |
|---|---|
| T1 default pipeline | `createTriggerProcessor()` with all ports wired |
| Fast webhook ack | Ingress adapter only verifies + persists, returns 202 |
| Unified event pipeline | All 3 trigger kinds produce `TriggerEvent` into same processor |
| `@netscript/cron` not in core | F-PLG-1 lint |
| 0 slow-types on both packages | `deno publish --dry-run --allow-dirty` |
| ≤25 root barrel exports | Manual count |
| All consumers migrated | grep `@netscript/triggers` returns 0 |
| Registry owned by triggers plugin | `plugins/triggers/scaffold.runtime.json` has `"dir": "triggers"` |
| Telemetry + config extracted | `@netscript/telemetry/instrumentation/triggers.ts` deleted; `@netscript/config/domain/trigger-schema.ts` deleted |
| E2E gates pass | `tests/e2e/trigger-roundtrip_test.ts` |
