# Sagas — Architecture

> **Purpose.** The production-grade target shape for `@netscript/plugin-sagas-core` and
> `@netscript/plugin-sagas`. The implementer reads this before any slice in Group E.
>
> **Source.** Derived from
> `.llm/research/sagas-production-architecture/05-netscript-sagas-synthesis.md`. The synthesis is
> the long form; this is the operational summary.

## 1. The one-sentence shape

> A NetScript saga is a **frozen definition** discovered statically by the walker, executed by an
> injected **runtime** (bus + transport + store + clock), at a chosen **durability tier**, with
> **idempotent cascading messages** as the only side-effect ledger.

## 2. Layers

| Layer                   | Owner                                                       | What lives here                                                                                      |
| ----------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Userland**            | Application repo (`sagas/*-saga.ts`)                        | Frozen `SagaDefinition` values produced by `defineSaga(id)...build()`                                |
| **Core (Tier 1)**       | `@netscript/plugin-sagas-core`                              | DSL builders, ports, default adapters, native runtime engine, transports, stores, telemetry, testing |
| **Plugin (Tier 2)**     | `@netscript/plugin-sagas`                                   | HTTP publisher SDK, service entrypoint, CLI, scaffolding, Aspire resource, e2e gates                 |
| **Integration plugins** | `@netscript/plugin-stripe`, `@netscript/plugin-ai-agent`, … | Topic-emitting plugins consumed by sagas                                                             |

## 3. Durability Tiers

| Tier   | Guarantee                                                         | Required ports               | Use case                                                           | Default? |
| ------ | ----------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------ | -------- |
| **T1** | At-least-once delivery; idempotency-key dedup                     | bus, transport, store        | Background workflows where rerunning a step is safe                | ✓        |
| **T2** | Transactional outbox; state + cascaded messages commit atomically | + outbox port                | Financial flows; integrations where double-publish is unacceptable | Phase 7d |
| **T3** | Event-sourced; deterministic replay from history                  | + history store, replay loop | Long-running (months); audit-critical; AI conversation history     | Phase 7d |

Per-saga declaration: `defineSaga('payment-flow').durability('t2').state(...)`.

T2 and T3 ship in Phase 7d. T1 is shipped in Group E with **reserved ports** for T2/T3 so the public
surface does not break later.

## 4. Public Surface (≤25 root exports)

Final shape per `synthesis.md` §10:

```ts
// @netscript/plugin-sagas-core/mod.ts

// Builders (5)
export { defineAgent, defineQuery, defineSaga, defineSignal } from './src/public/builders.ts';

// Cascaded message constructors (6)
export {
  sagaCompensate,
  sagaComplete,
  sagaFail,
  schedule,
  send,
  spawn,
} from './src/public/messages.ts';

// Composition root (2)
export { createSagaRuntime, startSagas } from './src/public/runtime.ts';

// Integration (1) — others on subpath
export { triggerJob } from './src/public/integration.ts';

// Inspect (1) — others on subpath
export { inspectSaga } from './src/public/inspect.ts';

// Branded types (3)
export type { JobId, SagaId, SagaInstanceId } from './src/public/ids.ts';

// Core types (7)
export type {
  CascadedMessage,
  RetryPolicy,
  SagaBusPort,
  SagaContext,
  SagaDefinition,
  SagaMessage,
  SagaState,
} from './src/public/types.ts';

// Errors (1)
export { SagasError } from './src/public/errors.ts';
```

Count: 5 + 6 + 2 + 1 + 1 + 3 + 7 + 1 = **26 → trim `defineAgent` to subpath `./agent` for a
final 25.**

Subpaths in `deno.json` `exports`: `.`, `./builders`, `./domain`, `./ports`, `./runtime`,
`./transports`, `./stores`, `./middleware`, `./integration/workers`, `./integration/publisher`,
`./telemetry`, `./config`, `./contracts/v1`, `./testing`, `./agent`.

## 5. Runtime Composition Root

```ts
const runtime = createSagaRuntime({
  // adapter selection (migration toggle)
  adapter: 'native', // | 'legacy'

  // transport
  transport: createRedisTransport({ url: env.REDIS_URL }),

  // store (explicit backend choice)
  store: new KvSagaStore({ kv }), // or new PrismaSagaStore({ prisma })

  // discovery
  registry: sagaRegistry, // emitted by walker

  // observability
  telemetry: createSagaInstrumentation({ tracer, meter }),

  // logger port (NOT console.*)
  logger: createLogger({ component: 'sagas' }),

  // clock port (TestSagaClock in tests)
  clock: createSystemClock(),

  // global middleware
  middleware: composeMiddleware([traceMiddleware(), retryMiddleware()]),

  // T2 only
  outbox: undefined, // SagaOutboxPort, deferred

  // T3 only
  history: undefined, // SagaHistoryStorePort, deferred
});

await runtime.start();
await runtime.publish({ type: 'UserRegistered', userId: 'u1', email: 'a@b' });
await runtime.signal(sagaId, instanceId, cancelSignal, { reason: 'user requested' });
const status = await runtime.query(sagaId, instanceId, statusQuery);
await runtime.stop({ gracePeriodMs: 5000 });
```

Replaces all current singletons (`getSagaBus`, `setSagaBus`, `resetSagaBus`, `getSagaRegistry`,
`resetSagaRegistry`).

## 6. The Native Engine (`src/runtime/saga-engine.ts`)

The native engine replaces `@saga-bus/core` as the default adapter. It owns:

1. **O(1) dispatch** by `(sagaId, eventType)` → handler map.
2. **Concurrency-key semaphore** per `(sagaId, key)` (Trigger.dev pattern).
3. **Idempotency dedup** by `(target, idempotencyKey)` over configurable window (default 24h).
4. **Retry classification** via `SagasError.nonRetryable`/`retryable` factories
   - `RetryPolicy.nonRetryableErrorTypes` (Temporal pattern).
5. **Scheduler** for delayed messages (`schedule()` cascaded kind) via Redis sorted-set or KV TTL.
6. **Compensator** for `sagaFail()` / `sagaCompensate()` cascades.
7. **Middleware pipeline** (outer = telemetry, inner = handler).

The engine is fully replaceable: it implements `SagaBusPort` and any alternate implementation can
substitute it.

## 7. Observability Spec

Every saga invocation produces an OTEL trace:

```
span: saga.handle           (kind=internal)
  attrs: saga.id, saga.instance.id, saga.event.type, saga.attempt, saga.durability_tier
  events: state.before, state.after
  ├─ span: saga.cascade.send      (kind=producer)
  │     attrs: target.job.id, idempotency.key, retry.max_attempts
  ├─ span: saga.cascade.schedule  (kind=producer)
  │     attrs: scheduled.for, delay.ms
  └─ span: saga.cascade.complete  (kind=internal)
```

Metrics:

- `netscript_saga_handle_duration_ms{saga_id, event_type, outcome}` (histogram)
- `netscript_saga_instances_active{saga_id}` (gauge)
- `netscript_saga_compensations_total{saga_id, reason}` (counter)
- `netscript_saga_dlq_total{saga_id, error_class}` (counter)
- `netscript_saga_idempotency_hits_total{saga_id}` (counter)
- `netscript_saga_concurrency_throttled_total{saga_id, key}` (counter)

Implemented in `src/telemetry/saga-instrumentation.ts`. Spans are produced by middleware (outermost
layer) so user handlers see clean stack traces.

## 8. Plugin Layer (`@netscript/plugin-sagas`)

Folder shape (Arch-5 plugin package):

```
plugins/sagas/
├── deno.json
├── mod.ts                          # definePlugin manifest
├── verify-plugin.ts
├── src/
│   ├── public/mod.ts               # plugin exports (≤15)
│   ├── runtime/
│   │   ├── saga-publisher.ts       # HTTP client for sagas-api service
│   │   ├── saga-supervisor.ts      # Background process supervisor
│   │   └── mod.ts
│   ├── service/
│   │   ├── sagas-api.ts            # Hono server entrypoint
│   │   ├── routes/
│   │   │   ├── publish.ts          # POST /sagas/publish
│   │   │   ├── signal.ts           # POST /sagas/signals
│   │   │   ├── query.ts            # GET  /sagas/queries
│   │   │   └── health.ts
│   │   └── mod.ts
│   ├── cli/
│   │   ├── generate-registry.ts    # ns-sagas generate registry
│   │   ├── inspect.ts              # ns-sagas inspect <saga-id>
│   │   └── mod.ts
│   ├── scaffolding/
│   │   └── scaffold.runtime.json   # owns sagas/_registry.ts emission
│   ├── e2e/
│   │   ├── roundtrip-test.ts
│   │   └── health-test.ts
│   └── aspire/
│       └── resource.ts             # Aspire resource contribution
└── docs/
    ├── README.md
    └── recipes/
```

Plugin manifest:

```ts
export default definePlugin('@netscript/plugin-sagas', '0.1.0')
  .withDisplayName('Sagas')
  .withDependencies({
    workers: workersPlugin, // typed deps
    streams: streamsPlugin,
  })
  .withService({
    name: 'sagas-api',
    entrypoint: './src/service/sagas-api.ts',
    permissions: SAGAS_SERVICE_PERMISSIONS,
  })
  .withCli({ name: 'ns-sagas', entrypoint: './src/cli/mod.ts' })
  .withStreamTopics(({ deps }) => [
    deps.streams.defineTopic('sagas.instances', SagaInstanceSchema),
  ])
  .withVerification('./verify-plugin.ts')
  .withAspireResource('./src/aspire/resource.ts')
  .build();
```

## 9. Cross-Plugin Boundary Rules

| Direction                                | Permitted?                         | Rule                                                       |
| ---------------------------------------- | ---------------------------------- | ---------------------------------------------------------- |
| `plugin-sagas-core` → workers-core types | ✓                                  | Import branded `JobId<TId>` for `triggerJob` typing        |
| `plugin-sagas-core` → streams-core types | ✓                                  | Import topic schema types for typed `defineSaga.on(topic)` |
| `plugin-sagas` → other plugins           | via typed `.withDependencies` only | No direct import paths                                     |
| Userland saga → core                     | ✓                                  | Only `@netscript/plugin-sagas-core`                        |
| Userland saga → plugin                   | ✗                                  | Userland never imports plugin runtime SDK                  |
| Core → plugin                            | ✗                                  | One-way only; checked by F-PLG-1                           |
| `@saga-bus/*` in public exports          | ✗                                  | F-15 (re-export-upstream lint)                             |

## 10. Concept of Done (Group E)

| Outcome                                                   | Evidence                                                                        |
| --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Native engine ships as default adapter                    | `createSagaRuntime({})` resolves `adapter: 'native'`                            |
| Legacy `@saga-bus/core` adapter ships, deprecated, opt-in | `createSagaRuntime({ adapter: 'legacy' })` works and logs a deprecation warning |
| 0 slow-types on both packages                             | `deno publish --dry-run` clean                                                  |
| ≤25 root barrel exports                                   | `deno doc` count                                                                |
| All consumers migrated                                    | grep `@netscript/sagas` returns 0 results                                       |
| Saga registry owned by sagas plugin                       | `plugins/workers/scaffold.runtime.json` has no saga entry                       |
| Signal + query public surface reserved                    | exports present; runtime stubs throw `SagasError.notImplemented()`              |
| E2E roundtrip green                                       | `tests/e2e/saga-roundtrip_test.ts` passes                                       |
| Observability spec implemented                            | spans + metrics named per §7                                                    |

Phase 7d (post-Group-E, separate run) ships T2/T3 durability runtime and signal/query dispatch.
