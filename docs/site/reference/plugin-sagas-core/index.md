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

## Entrypoints

The package publishes nineteen entrypoints. The root path carries the userland DSL; the remaining
subpaths expose the layers a host, adapter author, or test harness composes.

| Export specifier | Module | Exports | Purpose |
| --- | --- | --- | --- |
| `@netscript/plugin-sagas-core` | `./mod.ts` | 41 | The userland saga DSL — `defineSaga`, the cascaded-message constructors, signals, queries, and the definition types they produce (documented below). |
| `@netscript/plugin-sagas-core/builders` | `./src/builders/mod.ts` | 27 | The builder layer behind the DSL, for tooling that constructs definitions programmatically. |
| `@netscript/plugin-sagas-core/domain` | `./src/domain/mod.ts` | 44 | Saga domain vocabulary and policy defaults (`DEFAULT_RETRY_POLICY`, `DEFAULT_IDEMPOTENCY_WINDOW_MS`, `DEFAULT_RETRY_MAX_ATTEMPTS`). |
| `@netscript/plugin-sagas-core/ports` | `./src/ports/mod.ts` | 61 | The port interfaces the runtime depends on — store, bus, transport, clock, idempotency, telemetry. |
| `@netscript/plugin-sagas-core/runtime` | `./src/runtime/mod.ts` | 83 | The engine: `createSagaRuntime`, `createSagaEngine`, `createSagaCompensator`, `createSagaScheduler`, and the idempotency-key helpers. |
| `@netscript/plugin-sagas-core/adapters` | `./src/adapters/mod.ts` | 68 | Concrete port adapters, including `createSagaBusBridge`. |
| `@netscript/plugin-sagas-core/transports` | `./src/transports/mod.ts` | 49 | Saga bus transports (`createNetScriptRedisTransport`, `createGarnetListTransport`) with their message and delayed-entry codecs. |
| `@netscript/plugin-sagas-core/stores` | `./src/stores/mod.ts` | 56 | KV-backed instance and applied-key stores, `openSagaRuntimeKv`, and `resolveSagaStoreBackend`. |
| `@netscript/plugin-sagas-core/middleware` | `./src/middleware/mod.ts` | 30 | Host middleware — `createSagaMiddleware`, `createSSEEventsMiddleware`, `emitSagaEvent`. |
| `@netscript/plugin-sagas-core/integration/workers` | `./src/integration/workers/mod.ts` | 14 | Explicit workers-port helpers (`triggerJob`, `triggerTask`, `createWorkerTriggers`) that dispatch work **outside** synchronous saga handlers. |
| `@netscript/plugin-sagas-core/integration/publisher` | `./src/integration/publisher/mod.ts` | 10 | Publisher port contracts for submitting saga messages from plugin surfaces. |
| `@netscript/plugin-sagas-core/telemetry` | `./src/telemetry/mod.ts` | 43 | Telemetry attributes and instrumentation helpers, including an OpenTelemetry tracer factory. |
| `@netscript/plugin-sagas-core/config` | `./src/config/mod.ts` | 24 | `defineSagaConfig` and the saga runtime configuration schemas. |
| `@netscript/plugin-sagas-core/contracts/v1` | `./src/contracts/v1/mod.ts` | 29 | Version 1 saga API schemas and contract route types (`sagasContract`, `sagasContractV1`). |
| `@netscript/plugin-sagas-core/streams` | `./src/streams/mod.ts` | 17 | Durable stream schemas for projected saga instance records (`sagasStreamSchema`). |
| `@netscript/plugin-sagas-core/presets` | `./src/presets/mod.ts` | 9 | Preset composition helpers — `startSagas`, `startSagaHandlers`. |
| `@netscript/plugin-sagas-core/abstracts` | `./src/abstracts/mod.ts` | 58 | Abstract runtime contracts and reserved extension-point base classes. |
| `@netscript/plugin-sagas-core/testing` | `./src/testing/mod.ts` | 59 | `createTestSagaRuntime` plus in-memory bus and store doubles for deterministic verification. |
| `@netscript/plugin-sagas-core/agent` | `./src/agent/mod.ts` | 2 | `defineAgent` — the agent-shaped builder over the same saga definition. |

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
constructors are the only side-effect ledger a handler produces.

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
