---
layout: layouts/base.vto
title: "@netscript/plugin-sagas-core"
---

# `@netscript/plugin-sagas-core`

Saga DSL, runtime ports, adapters, telemetry, config, and testing primitives for NetScript sagas
plugins. This page is written against the package's public surface reported by `deno doc`.
For the full index of packages and plugins return to the [reference overview](/reference/).

Sagas are the honest answer to distributed transactions: a sequence of steps, each with a
compensation, driven by messages that may arrive twice or out of order. `defineSaga` builds a
frozen, typed definition — state, handlers, compensations, signals, queries — and the runtime drives
it through explicit ports for storage, transport, clock, and idempotency. Nothing is global:
applications inject their own durability, and tests inject deterministic in-memory doubles.

This is the core that the deployable [`@netscript/plugin-sagas`](/reference/sagas/) plugin binds to a
NetScript host. Use it directly for custom hosts, libraries, and tests.

## Exports

The package publishes nineteen entrypoints. The root path carries the userland DSL; the remaining
subpaths expose the layers a host, adapter author, or test harness composes.

| Export specifier | Module | Exports | Purpose |
| --- | --- | --- | --- |
| `@netscript/plugin-sagas-core` | `./mod.ts` | 45 | The userland saga DSL — `defineSaga`, the cascaded-message constructors, signals, queries, and the definition types they produce (documented below). |
| `@netscript/plugin-sagas-core/builders` | `./src/builders/mod.ts` | 31 | The builder layer behind the DSL, for tooling that constructs definitions programmatically. |
| `@netscript/plugin-sagas-core/domain` | `./src/domain/mod.ts` | 48 | Saga domain vocabulary and policy defaults (`DEFAULT_RETRY_POLICY`, `DEFAULT_IDEMPOTENCY_WINDOW_MS`, `DEFAULT_RETRY_MAX_ATTEMPTS`). |
| `@netscript/plugin-sagas-core/ports` | `./src/ports/mod.ts` | 70 | The port interfaces the runtime depends on — store, bus, transport, clock, idempotency, telemetry. |
| `@netscript/plugin-sagas-core/runtime` | `./src/runtime/mod.ts` | 87 | The engine: `createSagaRuntime`, `createSagaEngine`, `createSagaCompensator`, `createSagaScheduler`, and the idempotency-key helpers. |
| `@netscript/plugin-sagas-core/adapters` | `./src/adapters/mod.ts` | 72 | Concrete port adapters, including `createSagaBusBridge`. |
| `@netscript/plugin-sagas-core/transports` | `./src/transports/mod.ts` | 49 | Saga bus transports (`createNetScriptRedisTransport`, `createGarnetListTransport`) with their message and delayed-entry codecs. |
| `@netscript/plugin-sagas-core/stores` | `./src/stores/mod.ts` | 72 | KV-backed instance and applied-key stores, `openSagaRuntimeKv`, and `resolveSagaStoreBackend`. |
| `@netscript/plugin-sagas-core/middleware` | `./src/middleware/mod.ts` | 30 | Host middleware — `createSagaMiddleware`, `createSSEEventsMiddleware`, `emitSagaEvent`. |
| `@netscript/plugin-sagas-core/integration/workers` | `./src/integration/workers/mod.ts` | 23 | Selected-schema pure worker effect constructors plus explicit trigger helpers for callers outside synchronous handlers. |
| `@netscript/plugin-sagas-core/integration/publisher` | `./src/integration/publisher/mod.ts` | 11 | Non-throwing publisher contracts plus `publishSagaOrThrow` for an explicit exception boundary. |
| `@netscript/plugin-sagas-core/telemetry` | `./src/telemetry/mod.ts` | 43 | Telemetry attributes and instrumentation helpers, including an OpenTelemetry tracer factory. |
| `@netscript/plugin-sagas-core/config` | `./src/config/mod.ts` | 24 | `defineSagaConfig` and the saga runtime configuration schemas. |
| `@netscript/plugin-sagas-core/contracts/v1` | `./src/contracts/v1/mod.ts` | 31 | Version 1 saga API schemas and contract route types (`sagasContract`, `sagasContractV1`). |
| `@netscript/plugin-sagas-core/streams` | `./src/streams/mod.ts` | 17 | Durable stream schemas for projected saga instance records (`sagasStreamSchema`). |
| `@netscript/plugin-sagas-core/presets` | `./src/presets/mod.ts` | 9 | Preset composition helpers — `startSagas`, `startSagaHandlers`. |
| `@netscript/plugin-sagas-core/abstracts` | `./src/abstracts/mod.ts` | 62 | Abstract runtime contracts and reserved extension-point base classes. |
| `@netscript/plugin-sagas-core/testing` | `./src/testing/mod.ts` | 67 | `createTestSagaRuntime` plus in-memory bus and store doubles for deterministic verification. |
| `@netscript/plugin-sagas-core/agent` | `./src/agent/mod.ts` | 6 | `defineAgent` — the agent-shaped builder over the same saga definition. |

Export counts are the symbol counts `deno doc` reports for each entrypoint; subpaths overlap where a
type is re-exported through more than one layer.

## Root surface (`@netscript/plugin-sagas-core`)

### Defining a saga

| Symbol | Kind | Description |
| --- | --- | --- |
| `defineSaga` | function | Start a userland saga definition chain. |
| `SagaBuilder` | interface | The userland fluent saga builder. |
| `SagaBuilderPhase` | type alias | Typestate phase for the userland saga builder. |
| `SagaDefinition` | type alias | Frozen saga definition produced by the fluent DSL. |
| `SagaState` | type alias | Base state shape accepted by saga definitions. |
| `SagaContext` | type alias | Handler context passed to pure saga projections. |
| `SagaHandler` | type alias | Synchronous saga handler that returns cascaded messages. |
| `SagaEvent` | type alias | Event shape inferred by `defineSaga().on(type, handler)`. |
| `SagaMessage` | type alias | Base event or command delivered to a saga handler. |

### Cascaded messages

A handler is a pure projection: it returns cascaded messages rather than performing effects. These
constructors keep their existing cascade meanings. Opted-in ordinary transition handlers can also
return the explicit pure worker effects documented below.

| Symbol | Kind | Description |
| --- | --- | --- |
| `send` | function | Create a cascade that republishes an internal saga message onto the saga bus. |
| `schedule` | function | Create a cascaded scheduled message. |
| `sagaComplete` | function | Create a terminal saga completion message. |
| `sagaFail` | function | Create a terminal saga failure message. |
| `sagaCompensate` | function | Create a cascaded compensation message. |
| `spawn` | function | **Rejects** an unsupported child-saga spawn request — spawn cascades are not implemented. |
| `CASCADED_MESSAGE_KINDS` | variable | Cascaded message kinds emitted by saga handlers. |
| `CascadedMessage` | type alias | Message emitted by a saga handler as its only side-effect ledger. |
| `CascadedMessageKind` | type alias | Cascaded message discriminator. |
| `CascadedMessageOptions` | type alias | Common options accepted by cascaded message constructors. |
| `CascadedMessageTarget` | type alias | Cascaded message target for jobs, sagas, or arbitrary runtime adapters. |
| `SendOptions` | type alias | Options for republishing an internal saga message onto the saga bus. |
| `SagaScheduleDelay` | type alias | Delay accepted by the `schedule()` cascaded-message constructor. |
| `SpawnOptions` | type alias | Options reserved for the unsupported `spawn()` cascade. |

### Signals and queries

| Symbol | Kind | Description |
| --- | --- | --- |
| `defineSignal` | function | Define a signal that can be sent to a running saga instance. |
| `defineQuery` | function | Define a synchronous read-only query for a running saga instance. |
| `SignalDefinition` | type alias | Signal definition reserved by the public DSL. |
| `QueryDefinition` | type alias | Query definition reserved by the public DSL. |
| `SagaSignalHandler` | type alias | Signal handler reserved by the userland saga DSL. |
| `SagaQueryHandler` | type alias | Synchronous query handler reserved by the userland saga DSL. |
| `SyncQueryResult` | type alias | Synchronous query result accepted by `onQuery`; promises are rejected at type level. |

### Correlation and identity

| Symbol | Kind | Description |
| --- | --- | --- |
| `SagaCorrelation` | type alias | Extracts a correlation key from an incoming saga message. |
| `SagaCorrelationKey` | type alias | Branded correlation key used to route messages to saga instances. |
| `SagaCorrelationRule` | type alias | Named correlation rule stored on a saga definition. |
| `SagaId` | type alias | Branded saga definition identifier. |
| `SagaInstanceId` | type alias | Branded saga instance identifier. |
| `SagaMessageId` | type alias | Branded message identifier for runtime and diagnostics records. |

### Policies

| Symbol | Kind | Description |
| --- | --- | --- |
| `RetryPolicy` | type alias | Retry policy for saga handlers and cascaded messages. |
| `SagaConcurrencyOptions` | type alias | Concurrency options accepted by the saga builder. |
| `SagaConcurrencyPolicy` | type alias | Concurrency policy for a saga definition. |
| `SAGA_DURABILITY_TIERS` | variable | Durability tiers supported by saga definitions. |
| `SagaDurabilityTier` | type alias | Saga durability tier. |

## Handlers are synchronous

A saga handler is synchronous and returns cascaded messages; it does not `await`. That is what makes
replay deterministic and what keeps the compensation path a pure function of the transcript. Work
that must happen outside the handler — enqueueing a worker job, calling a service — is expressed as a
cascaded message the runtime dispatches, or through the explicit
`@netscript/plugin-sagas-core/integration/workers` helpers.

`spawn()` is present in the surface but **rejects**: child-saga spawn cascades are unsupported, and
calling it raises rather than silently succeeding. Its return type is `never`, so a handler that
returns `spawn(...)` does not type-check into the cascade union by accident.

## Composing a runtime

`@netscript/plugin-sagas-core/runtime` exposes `createSagaRuntime`, which takes explicit ports rather
than reaching for globals. The store, transport, clock, and idempotency edges are all injected, so
the same definitions run against Redis or Garnet in production
(`@netscript/plugin-sagas-core/transports`) and against in-memory doubles in tests
(`@netscript/plugin-sagas-core/testing`).

`@netscript/plugin-sagas-core/presets` collapses the common case: `startSagas` composes a runtime and
starts it, and `startSagaHandlers` binds a definition set to an already-composed runtime.

## Related pages

- [`@netscript/plugin-sagas`](/reference/sagas/) — the deployable plugin that binds this core to a
  NetScript host.
- [`@netscript/plugin-workers-core`](/reference/plugin-workers-core/) — the worker primitives the
  `integration/workers` helpers dispatch to.
- [`@netscript/plugin-streams-core`](/reference/plugin-streams-core/) — the producer behind the
  projected instance stream.

---

Back to the [reference overview](/reference/).

## Atomic worker-command effects

| Symbol | Kind | Description |
| --- | --- | --- |
| `WORKER_COMMAND_EFFECT_KINDS` | constant | Finite distinct `worker-job` and `worker-task` effect tags. |
| `WorkerCommandEffect` | type alias | Pure intent privately bound to a selected worker definition and detached payload. |
| `SagaTransitionEffect` | type alias | Ordinary transition ledger union of existing cascades and explicit worker commands. |
| `SagaTransitionHandler` | type alias | Synchronous typed transition projection. |
| `workerJobEffect` | function | Binds a selected schema-backed job to its required payload before persistence. |
| `workerTaskEffect` | function | Binds a selected runtime-schema task to its required payload. |
| `WorkerCommandEffectOptions` | type alias | Host-owned destination/topic routing. |
| `WorkerJobEffectDefinition` | type alias | Selected branded job plus its runtime payload schema. |
| `WorkerTaskEffectDefinition` | type alias | Selected branded task plus its runtime payload schema. |
| `SagaTransitionCommitPort` | interface | Explicit atomic optimistic transition, replay and outbox boundary. |
| `SagaTransitionCommitRequest` | type alias | Expected version and detached complete local row set. |
| `SagaTransitionCommitResult` | type alias | Commit result; false means already committed inbound replay with no new writes. |
| `SagaTransitionStore` | type alias | Existing saga store with the explicit atomic capability. |
| `createPrismaSagaTransitionStore` | function | Named first-party true-callback PostgreSQL store from `./stores`. |
| `PrismaSagaTransitionStore` | interface | Atomic store with detached diagnostic state/history reads. |
| `PrismaSagaTransitionStoreOptions` | type alias | Required finite physical transaction timeout. |
| `SAGA_RUNTIME_CORRELATION_SELECTOR` | constant | Existing shipped Prisma correlation selector, curated through stores. |

Select `.durableWorkerCommands()` on the saga definition. Registration refuses KV and the legacy
unbound Prisma store before any handler/storage work; the test memory store and named bound
PostgreSQL store satisfy the capability. `send()` stays an internal saga-message cascade. Worker
effects are valid only in ordinary top-level transitions; compensation and nested scheduled
cascades retain their existing ledger.

Selected schema validation and bounded canonical I-JSON encoding precede all transition writes.
Non-JSON prototypes/accessors and schema transformations changing canonical identity are refused.
Stable versioned SHA-256 command identities include saga id, instance id, next version and original
effect ordinal. State CAS, correlation, history, outbound intents and hashed inbound marker share
one commit. Failed work retains retry eligibility; committed replay writes nothing. The marker is
limited to this protocol and does not close general Prisma idempotency parity debt.

Migrate the shipped saga runtime/replay models and command outbox before selecting PostgreSQL.
The host supplies the real generated interactive callback and owns resources; the database bound
writer reuses the reviewed append SQL. No runtime DDL or new relay is added. Configure C5's worker
sink topic map with the same selected definition id; routing is explicit host policy. C5 handles
leases, bounded retries, drain, checked receipts and settlement. Delivery is at least once; one
effective application additionally requires durable worker idempotency.

The generated-client consumer example is
`packages/plugin-sagas-core/tests/fixtures/transition-store/saga-relay-cohort.ts.template`. It uses
the actual C5 relay/sink source pin with the current producer, native worker dispatcher, persisted
Deno KV execution/applied state, first-party worker stream producer and file-backed Durable Streams
server. Progress survives storage/server restart; completion uses `publishSagaOrThrow()`. No
progress event is mirrored into command outbox rows. The reviewed fixture pin proves integration
and is not a released cohort: C5 must land before publishing the producer capability.
