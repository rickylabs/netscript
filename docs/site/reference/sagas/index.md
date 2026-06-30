---
layout: layouts/base.vto
title: "@netscript/plugin-sagas"
---

# `@netscript/plugin-sagas`

NetScript plugin for durable saga orchestration, workflow APIs, and saga runtime metadata.
This page is generated from the package's public surface with `deno doc` (US-2). For the full
index of packages and plugins return to the [reference overview](/reference/).

The published plugin exposes the host-facing plugin manifest, the executable saga runtime and
supervisor, the HTTP publisher, the versioned API contract, and the browser-safe stream surface.
The userland saga DSL (`defineSaga`, the cascaded-message constructors) is authored against
[`@netscript/plugin-sagas-core`](#internals) and re-exported through the runtime entrypoint; the
core package is documented as an [Internals](#internals) subsection below.

## Entrypoints

The plugin publishes the following entrypoints. Each is generated from its own `deno doc` surface.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/plugin-sagas` | `./mod.ts` | Plugin manifest, identifiers, and inspection helper (documented below). |
| `@netscript/plugin-sagas/public` | `./src/public/mod.ts` | Curated public manifest surface for host integration. |
| `@netscript/plugin-sagas/plugin` | `./src/public/mod.ts` | Plugin manifest and contribution types (alias of the public surface). |
| `@netscript/plugin-sagas/runtime` | `./src/runtime/mod.ts` | Executable saga runtime, engine, scheduler, publisher, and supervisor. |
| `@netscript/plugin-sagas/contracts` | `./contracts/v1/mod.ts` | Versioned API contract (`sagasContract`) and router types. |
| `@netscript/plugin-sagas/streams` | `./streams/mod.ts` | Browser-safe saga stream schema and collection. |
| `@netscript/plugin-sagas/cli` | `./src/cli/mod.ts` | Plugin CLI commands (inspect, codemod, generate registry). |
| `@netscript/plugin-sagas/scaffolding` | `./src/scaffolding/mod.ts` | Saga item scaffolders and runtime scaffold manifest. |
| `@netscript/plugin-sagas/aspire` | `./src/aspire/mod.ts` | Aspire contribution for the sagas API service. |
| `@netscript/plugin-sagas/services` | `./services/src/main.ts` | Saga API service entrypoint. |
| `@netscript/plugin-sagas/e2e` | `./src/e2e/mod.ts` | End-to-end test contributions. |
| `@netscript/plugin-sagas/streams/server` | `./streams/server.ts` | Server-side stream wiring. |

## Plugin manifest (`@netscript/plugin-sagas`)

The root entrypoint exposes the plugin manifest and stable identifiers. Shared manifest inspection
is provided by `inspectPlugin` from `@netscript/plugin`.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `sagasPlugin` | variable | `PluginManifest` | Plugin manifest for NetScript sagas. |
| `SAGAS_PLUGIN_ID` | variable | `"sagas"` | Stable plugin identifier used by manifests, scaffolding, and runtime ownership checks. |
| `SAGAS_PLUGIN_VERSION` | variable | `"1.0.0"` | Plugin manifest version advertised to the NetScript host. |
| `SAGAS_API_SERVICE_NAME` | variable | `"sagas-api"` | Service contribution name for the sagas API process. |
| `SAGAS_API_DEFAULT_PORT` | variable | `8092` | Default HTTP port for the sagas API process. |


## Runtime (`@netscript/plugin-sagas/runtime`)

The runtime entrypoint provides the executable saga runtime and the building blocks a composition
root wires together. It also re-exports the userland DSL types and cascaded-message vocabulary from
[`@netscript/plugin-sagas-core`](#internals).

### Runtime entry functions and classes

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `startSagaRunner` | function | `startSagaRunner(options: StartSagaRunnerOptions): Promise<SagaRuntimeSupervisor>` | Start the saga runner process and return its supervisor. |
| `runSagaRunner` | function | `runSagaRunner(options: RunSagaRunnerOptions): Promise<void>` | Run the saga runner until a shutdown signal is received. |
| `SagaRuntimeSupervisor` | class | - | Owns one saga runtime process lifecycle. |
| `SagaEngine` | class | - | Native saga engine with indexed dispatch and per-key concurrency throttling. |
| `SagaScheduler` | class | - | Durable timer scheduler for `schedule()` cascaded messages. |
| `SagaCompensator` | class | - | Runtime primitive for `sagaFail()` and `sagaCompensate()` cascades. |
| `createSagaPublisher` | function | `createSagaPublisher(options: HttpSagaPublisherOptions): SagaPublisherPort` | Create a plugin-layer HTTP publisher for sagas API publish endpoints. |
| `HttpSagaPublisher` | class | - | HTTP implementation of the saga publisher port. |
| `loadSagaRegistryModule` | function | `loadSagaRegistryModule(specifier, importer): Promise` | Load saga definitions from the generated static registry module. |
| `SagaIdempotencyDedupTable` | class | - | In-memory idempotency table for local development and tests; use a durable port in production. |

### Runtime ports and facade

| Symbol | Kind | Description |
| --- | --- | --- |
| `SagaRuntime` | interface | Runtime facade returned by the composition root. |
| `SagaRuntimeAdapter` | type alias | Adapter selected by the saga runtime composition root. |
| `SagaBusPort` | interface | Replaceable bus contract implemented by the native saga adapter. |
| `SagaStorePort` | interface | Persistent state store boundary for T1 saga runtime guarantees. |
| `SagaPublisherPort` | interface | Explicit publisher boundary implemented by plugin-layer HTTP clients. |
| `SagaIdempotencyPort` | interface | Durable idempotency boundary for saga publish and cascade deduplication. |
| `CreateSagaRuntimeOptions` | type alias | Options accepted by `createSagaRuntime()`. |
| `SagaEngineOptions` | type alias | Options for the native saga engine. |

### Durability and lifecycle vocabulary

| Symbol | Kind | Description |
| --- | --- | --- |
| `SAGA_DURABILITY_TIERS` | variable | Durability tiers supported by saga definitions. |
| `SAGA_INSTANCE_STATUSES` | variable | Saga instance lifecycle statuses. |
| `CASCADED_MESSAGE_KINDS` | variable | Cascaded message kinds emitted by saga handlers. |
| `SagaDurabilityTier` | type alias | Saga durability tier. |
| `SagaInstanceStatus` | type alias | Saga instance lifecycle status. |
| `SagaDefinition` | type alias | Frozen saga definition produced by the fluent DSL. |
| `SagaContext` | type alias | Handler context passed to pure saga projections. |
| `SagaMessage` | type alias | Base event or command delivered to a saga handler. |
| `SagaSignal` | type alias | External signal delivered to a running saga instance. |
| `CascadedMessage` | type alias | Message emitted by a saga handler as its only side-effect ledger. |
| `SagaStateEnvelope` | type alias | Persisted saga state envelope. |
| `RetryPolicy` | type alias | Retry policy for saga handlers and cascaded messages. |

> The runtime entrypoint exports 95 symbols in total. The tables above list the primary surface.
> Branded id aliases (`SagaId`, `SagaInstanceId`, `SagaMessageId`, `SagaCorrelationKey`), scheduler
> records and publisher receipt/JSON types are part of the published surface
> and resolve through `deno doc plugins/sagas/src/runtime/mod.ts`.

## API contract (`@netscript/plugin-sagas/contracts`)

Version 1 of the sagas plugin API contract, its Zod schemas, and the router types.

| Symbol | Kind | Description |
| --- | --- | --- |
| `sagasContract` / `sagasContractV1` | variable | The versioned sagas API contract definition. |
| `SagasContractDefinition` / `SagasContractV1` | type alias | Contract shape for the sagas API. |
| `SagasRouter` | interface | Router type derived from the sagas contract. |
| `SagaDefinitionResponse` / `SagaDefinitionResponseSchema` | type / schema | Saga definition response payload and its Zod schema. |
| `SagaInstanceResponse` / `SagaInstanceResponseSchema` | type / schema | Saga instance response payload and its Zod schema. |
| `PublishMessageInput` / `PublishMessageInputSchema` | type / schema | Publish-message request payload and its Zod schema. |
| `SagaSSEEvent` / `SagaSSEEventSchema` | type / schema | Server-sent event payload streamed to subscribers. |
| `SagaFilters` / `InstanceFilters` | type | List/query filters for sagas and instances. |
| `ListSagasInput` / `ListSagasOutput` | type | List-sagas request and response. |
| `ListInstancesInput` / `ListInstancesOutput` | type | List-instances request and response. |
| `GetInstanceHistoryInput` / `GetInstanceHistoryOutput` | type | Instance-history request and response. |

## Streams (`@netscript/plugin-sagas/streams`)

Browser-safe stream exports for the sagas plugin.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `createSagasStreamDB` | function | `createSagasStreamDB(...): SagasStreamDB` | Create the saga instance stream database. |
| `SagasStreamDB` | type alias | - | Stream database type for saga instances. |
| `SagaInstance` | type alias | - | Saga instance row materialized into the stream. |
| `SagaInstanceSchema` | variable | - | Zod schema for a saga instance stream row. |
| `sagasStreamSchema` | variable | - | Stream schema describing the saga collections. |
| `SAGA_INSTANCE_STATUSES` | variable | - | Saga instance lifecycle statuses. |

## CLI, scaffolding, and Aspire

| Entrypoint | Primary exports |
| --- | --- |
| `@netscript/plugin-sagas/cli` | `SagasCli`, `SAGAS_CLI_COMMANDS`, `generateSagaRegistry`, `codemodSagaImports`, `inspectSagasProject` |
| `@netscript/plugin-sagas/scaffolding` | `createSagasItemScaffolders`, `SAGAS_RUNTIME_SCAFFOLD_MANIFEST`, `SagaDefinitionScaffolder`, `SagaConfigScaffolder` |
| `@netscript/plugin-sagas/aspire` | `SagasAspireContribution`, `SagasAspireBuilder`, `SagasAspireResource`, `SagasHealthCheckSpec` |

---

## Internals

> The following surface belongs to `@netscript/plugin-sagas-core`, the framework-internal package
> that implements the saga DSL, runtime ports, adapters, telemetry, config, and testing primitives.
> Application authors normally import these symbols through `@netscript/plugin-sagas`; the core
> package is documented here for completeness (US-8). It is not a separate top-level reference entry.

### `@netscript/plugin-sagas-core`

Saga DSL, runtime ports, adapters, telemetry, config, and testing primitives for NetScript sagas
plugins. Its root entrypoint (`./mod.ts`) is the authoring surface for saga definitions.

#### DSL constructors (root export)

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `defineSaga` | function | `defineSaga(id: TId): SagaBuilder` | Start a userland saga definition chain. |
| `defineQuery` | function | `defineQuery(name: TName): QueryDefinition` | Define a synchronous read-only query for a running saga instance. |
| `defineSignal` | function | `defineSignal(name: TName): SignalDefinition` | Define a signal that can be sent to a running saga instance. |
| `send` | function | `send(target, payload: unknown, options?: SendOptions): CascadedMessage` | Create a cascaded send message. |
| `spawn` | function | `spawn(child, input: unknown, options?: SpawnOptions): CascadedMessage` | Create a cascaded child-saga spawn message. |
| `schedule` | function | `schedule(message, delay: SagaScheduleDelay): CascadedMessage` | Create a cascaded scheduled message. |
| `sagaComplete` | function | `sagaComplete(result: unknown): CascadedMessage` | Create a terminal saga completion message. |
| `sagaFail` | function | `sagaFail(reason): CascadedMessage` | Create a terminal saga failure message. |
| `sagaCompensate` | function | `sagaCompensate(message, reason: string): CascadedMessage` | Create a cascaded compensation message. |

#### DSL types (root export)

| Symbol | Kind | Description |
| --- | --- | --- |
| `SagaBuilder` | interface | Userland fluent saga builder. |
| `SagaBuilderPhase` | type alias | Typestate phase for the userland saga builder. |
| `SagaEvent` | type alias | Event shape inferred by `defineSaga().on(type, handler)`. |
| `SagaHandler` | type alias | Synchronous saga handler that returns cascaded messages. |
| `SagaState` | type alias | Base state shape accepted by saga definitions. |
| `SagaConcurrencyOptions` / `SagaConcurrencyPolicy` | type alias | Concurrency options/policy for a saga definition. |
| `CascadedMessage` / `CascadedMessageKind` / `CascadedMessageTarget` | type alias | Cascaded-message side-effect ledger vocabulary. |
| `QueryDefinition` / `SignalDefinition` | type alias | Query/signal definitions reserved by the public DSL. |
| `SendOptions` / `SpawnOptions` / `SagaScheduleDelay` | type alias | Options for the `send()`, `spawn()`, and `schedule()` constructors. |

#### Core sub-path entrypoints

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/plugin-sagas-core` | `./mod.ts` | DSL constructors and types (documented above). |
| `@netscript/plugin-sagas-core/builders` | `./src/builders/mod.ts` | Fluent `defineSaga` builder and DSL constructors. |
| `@netscript/plugin-sagas-core/domain` | `./src/domain/mod.ts` | Domain primitives, `SagasError`, defaults, and branded ids. |
| `@netscript/plugin-sagas-core/ports` | `./src/ports/mod.ts` | Runtime port interfaces (`SagaBusPort`, `SagaStorePort`, idempotency). |
| `@netscript/plugin-sagas-core/runtime` | `./src/runtime/mod.ts` | Native runtime engine wiring consumed by the plugin runtime. |
| `@netscript/plugin-sagas-core/adapters` | `./src/adapters/mod.ts` | Bus/store adapters. |
| `@netscript/plugin-sagas-core/transports` | `./src/transports/mod.ts` | Transport implementations. |
| `@netscript/plugin-sagas-core/stores` | `./src/stores/mod.ts` | State store implementations. |
| `@netscript/plugin-sagas-core/middleware` | `./src/middleware/mod.ts` | Saga middleware primitives. |
| `@netscript/plugin-sagas-core/telemetry` | `./src/telemetry/mod.ts` | Saga telemetry instrumentation. |
| `@netscript/plugin-sagas-core/config` | `./src/config/mod.ts` | Saga runtime configuration. |
| `@netscript/plugin-sagas-core/contracts/v1` | `./src/contracts/v1/mod.ts` | Core contract primitives. |
| `@netscript/plugin-sagas-core/streams` | `./src/streams/mod.ts` | Core stream schema primitives. |
| `@netscript/plugin-sagas-core/presets` | `./src/presets/mod.ts` | Runtime presets. |
| `@netscript/plugin-sagas-core/abstracts` | `./src/abstracts/mod.ts` | Abstract base primitives. |
| `@netscript/plugin-sagas-core/testing` | `./src/testing/mod.ts` | Deterministic saga test helpers. |
| `@netscript/plugin-sagas-core/agent` | `./src/agent/mod.ts` | Agent-integration primitives. |
| `@netscript/plugin-sagas-core/integration/workers` | `./src/integration/workers/mod.ts` | Workers integration seam. |
| `@netscript/plugin-sagas-core/integration/publisher` | `./src/integration/publisher/mod.ts` | Publisher integration seam. |

#### Domain primitives (`@netscript/plugin-sagas-core/domain`)

| Symbol | Kind | Description |
| --- | --- | --- |
| `SagasError` | class | Structured error thrown by sagas core APIs. |
| `SAGAS_ERROR_CODES` / `SagasErrorCode` | variable / type | Error codes produced by `SagasError`. |
| `DEFAULT_RETRY_POLICY` | variable | Default retry policy used when a saga does not override retry behavior. |
| `DEFAULT_SAGA_DURABILITY_TIER` | variable | Default durability tier for saga definitions. |
| `DEFAULT_RETRY_MAX_ATTEMPTS` | variable | Default maximum retry attempts for cascaded messages. |
| `DEFAULT_IDEMPOTENCY_WINDOW_MS` | variable | Default idempotency deduplication window in milliseconds. |
| `SAGA_ADAPTER_KINDS` / `SagaAdapterKind` | variable / type | Runtime adapter kinds supported by `createSagaRuntime`. |
| `SagaMessageType` | type alias | Extracts the message type discriminator from a saga message. |

---

Back to the [reference overview](/reference/).
