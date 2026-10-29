---
layout: layouts/base.vto
title: "@netscript/plugin-sagas"
---

# `@netscript/plugin-sagas`

The deployable NetScript plugin for durable sagas: the plugin manifest, the saga runtime and
supervisor, the HTTP publisher, the versioned API contract and the browser-safe stream surface. Use
it to run sagas in a workspace. The saga DSL (`defineSaga` and the cascaded-message constructors) is
authored against [`@netscript/plugin-sagas-core`](/reference/plugin-sagas-core/), which has its own
reference page, and re-exported through the runtime entrypoint.

## Sub-path exports

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/plugin-sagas` | `./mod.ts` | [Plugin manifest, identifiers, and inspection helper](#plugin-manifest-netscriptplugin-sagas). |
| `@netscript/plugin-sagas/adapter-cli` | `./cli.ts` | Executable plugin-adapter CLI entrypoint and its shared CLI protocol types. |
| `@netscript/plugin-sagas/public` | `./src/public/mod.ts` | Curated public manifest surface for host integration. |
| `@netscript/plugin-sagas/plugin` | `./src/public/mod.ts` | Plugin manifest and contribution types (alias of the public surface). |
| `@netscript/plugin-sagas/runtime` | `./src/runtime/mod.ts` | [Executable saga runtime, engine, scheduler, publisher, and supervisor](#runtime-netscriptplugin-sagasruntime). |
| `@netscript/plugin-sagas/contracts` | `./contracts/v1/mod.ts` | [Versioned API contract](#api-contract-netscriptplugin-sagascontracts) (`sagasContract`) and router types. |
| `@netscript/plugin-sagas/streams` | `./streams/mod.ts` | [Browser-safe saga stream schema and collection](#streams-netscriptplugin-sagasstreams). |
| `@netscript/plugin-sagas/cli` | `./src/cli/mod.ts` | [Plugin CLI commands](#cli-and-aspire) (inspect, codemod, generate registry). |
| `@netscript/plugin-sagas/scaffold` | `./scaffold.ts` | Executable plugin scaffolder entrypoint and its shared scaffolding protocol types. |
| `@netscript/plugin-sagas/aspire` | `./src/aspire/mod.ts` | [Aspire contribution](#cli-and-aspire) for the sagas API service. |
| `@netscript/plugin-sagas/doctor` | `./doctor.ts` | Static sagas adapter used by plugin doctor. |
| `@netscript/plugin-sagas/services` | `./services/src/main.ts` | Saga API service entrypoint. |
| `@netscript/plugin-sagas/e2e` | `./src/e2e/mod.ts` | End-to-end test contributions. |
| `@netscript/plugin-sagas/streams/server` | `./streams/server.ts` | Server-side stream wiring. |

## Plugin manifest (`@netscript/plugin-sagas`)

The plugin manifest and stable identifiers. Inspect the manifest with `inspectPlugin` from
`@netscript/plugin`.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `sagasPlugin` | const | `PluginManifest` | Plugin manifest for NetScript sagas. |
| `SAGAS_PLUGIN_ID` | const | `"sagas"` | Stable plugin identifier used by manifests, scaffolding, and runtime ownership checks. |
| `SAGAS_PLUGIN_VERSION` | const | `"1.0.0"` | Plugin manifest version advertised to the NetScript host. |
| `SAGAS_API_SERVICE_NAME` | const | `"sagas-api"` | Service contribution name for the sagas API process. |
| `SAGAS_API_DEFAULT_PORT` | const | `8092` | Deprecated compatibility metadata; endpoint resolution does not use this value as an HTTP fallback. |

## Runtime (`@netscript/plugin-sagas/runtime`)

The executable saga runtime and the building blocks a composition root wires together. It also
re-exports the userland DSL types and cascaded-message vocabulary from
[`@netscript/plugin-sagas-core`](/reference/plugin-sagas-core/).

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
| `publishSagaOrThrow` | function | `publishSagaOrThrow(publisher, message, options?): Promise<SagaPublisherReceipt>` | Publish one message and throw a structured `SagasError` when the non-throwing port rejects it. |
| `HttpSagaPublisher` | class | - | HTTP implementation of the saga publisher port. |
| `loadSagaRegistryModule` | function | `loadSagaRegistryModule(specifier, importer): Promise` | Load saga definitions from the generated static registry module. |
| `SagaIdempotencyDedupTable` | class | - | In-memory idempotency table for local development and tests; use a durable port in production. |

### Runtime ports and facade

| Symbol | Kind | Description |
| --- | --- | --- |
| `SagaRuntime` | interface | Runtime facade returned by the composition root. |
| `SagaRuntimeAdapter` | type alias | Adapter selected by the saga runtime composition root. |
| `SagaBusPort` | interface | Replaceable bus contract implemented by the native saga adapter. |
| `SagaStorePort` | interface | Persistent boundary for saga state, transitions, and correlation indexes. |
| `SagaPublisherPort` | interface | Non-throwing publisher boundary; callers must discriminate every receipt or use `publishSagaOrThrow` for one message. |
| `SagaIdempotencyPort` | interface | Durable idempotency boundary for saga publish and cascade deduplication. |
| `CreateSagaRuntimeOptions` | type alias | Options accepted by `createSagaRuntime()`. |
| `SagaEngineOptions` | type alias | Options for the native saga engine. |

### Durability and lifecycle vocabulary

| Symbol | Kind | Description |
| --- | --- | --- |
| `SAGA_DURABILITY_TIERS` | const | Durability tiers supported by saga definitions. |
| `SAGA_INSTANCE_STATUSES` | const | Saga instance lifecycle statuses. |
| `CASCADED_MESSAGE_KINDS` | const | Cascaded message kinds emitted by saga handlers. |
| `SagaDurabilityTier` | type alias | Saga durability tier. |
| `SagaInstanceStatus` | type alias | Saga instance lifecycle status. |
| `SagaDefinition` | type alias | Frozen saga definition produced by the fluent DSL. |
| `SagaContext` | type alias | Handler context passed to pure saga projections. |
| `SagaMessage` | type alias | Base event or command delivered to a saga handler. |
| `SagaSignal` | type alias | External signal delivered to a running saga instance. |
| `CascadedMessage` | type alias | Message emitted by a saga handler as its only side-effect ledger. |
| `SagaStateEnvelope` | type alias | Persisted saga state envelope. |
| `RetryPolicy` | type alias | Retry policy for saga handlers and cascaded messages. |

> [!NOTE]
> The tables list the primary runtime surface. Branded id aliases (`SagaId`, `SagaInstanceId`,
> `SagaMessageId`, `SagaCorrelationKey`), scheduler records and publisher receipt/JSON types are
> also published; `deno doc` on the runtime entrypoint lists them.

## API contract (`@netscript/plugin-sagas/contracts`)

Version 1 of the sagas plugin API contract, its Zod schemas, and the router types.

| Symbol | Kind | Description |
| --- | --- | --- |
| `sagasContract` / `sagasContractV1` | const | The versioned sagas API contract definition. |
| `SagasContractDefinition` / `SagasContractV1` | type alias | Contract shape for the sagas API. |
| `SagasRouter` | interface | Router type derived from the sagas contract. |
| `SagaDefinitionResponse` / `SagaDefinitionResponseSchema` | type alias / const | Saga definition response payload and its Zod schema. |
| `SagaInstanceResponse` / `SagaInstanceResponseSchema` | type alias / const | Saga instance response payload and its Zod schema. |
| `PublishMessageInput` / `PublishMessageInputSchema` | type alias / const | Publish-message request payload and its Zod schema. |
| `SagaSSEEvent` / `SagaSSEEventSchema` | type alias / const | Server-sent event payload streamed to subscribers. |
| `SagaFilters` / `InstanceFilters` | type alias | List/query filters for sagas and instances. |

## Streams (`@netscript/plugin-sagas/streams`)

Browser-safe stream exports for the sagas plugin.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `createSagasStreamDB` | function | `createSagasStreamDB(...): SagasStreamDB` | Create the saga instance stream database. |
| `SagasStreamDB` | type alias | - | Stream database type for saga instances. |
| `SagaInstance` | type alias | - | Saga instance row materialized into the stream. |
| `SagaInstanceSchema` | const | - | Zod schema for a saga instance stream row. |
| `sagasStreamSchema` | const | - | Stream schema describing the saga collections. |
| `SAGA_INSTANCE_STATUSES` | const | - | Saga instance lifecycle statuses. |

## CLI and Aspire

| Entrypoint | Primary exports |
| --- | --- |
| `@netscript/plugin-sagas/cli` | `SagasCli`, `SAGAS_CLI_COMMANDS`, `generateSagaRegistry`, `codemodSagaImports`, `inspectSagasProject` |
| `@netscript/plugin-sagas/aspire` | `SagasAspireContribution`, `SagasAspireBuilder`, `SagasAspireResource` |

## Atomic worker commands with query projection

For `.durableWorkerCommands()` sagas, inject the store returned by `createPrismaSagaTransitionStore`
from `@netscript/plugin-sagas-core/stores` into `createDurableSagaRuntime({ store, projection })`.
Use `PrismaSagaInstanceProjection` from `@netscript/plugin-sagas/runtime` for the Prisma query
model. For the complete background runner, pass `runtimeOptions: { native: { store } }` and
`projection` to `startSagaRunner`; configure the same canonical store and projection in both API and
background compositions. Selecting `backend: 'prisma'` alone constructs the granular legacy store
and does not enable atomic worker commands.

Apply the PostgreSQL migrations for `saga_runtime_state`, `saga_runtime_transition`,
`saga_runtime_correlation`, `saga_runtime_command_applied_key`, and `netscript_command_outbox`, plus
`saga_instances` for the Prisma projection. The store uses the host's real interactive Prisma
transaction callback. State, history, correlation, inbound replay marker, and worker command intents
commit together. Query projection runs afterward and propagates errors, matching the legacy
projection path. `createProjectingSagaStore` retains this capability for custom compositions;
`ProjectingSagaStore` remains the legacy granular decorator.

A failed projection leaves the canonical transition and command intent committed. Redelivery is
replay: it adds no worker command and performs no projection write. Recover the view explicitly in a
host-owned background repair task: load the canonical envelope and its matching latest transition
from the original atomic store, resolve the saga and correlation identity, and pass them to
`projection.upsert`.

> [!CAUTION]
> Don't replay business effects to rebuild a view.

Prisma projection is not joined to the canonical transaction; this composition keeps post-commit
behavior.

The generic PostgreSQL command-outbox relay keeps its claim leases, retry attempts, and settlement
metadata with the PostgreSQL outbox rows; those fields cannot be moved to an unrelated KV store
while retaining this relay's contract. Worker execution/idempotency state and progress streams may
use separate durable stores. Delivery remains at least once, with effective deduplication supplied
by the worker's durable idempotency store. All processing and repair run under a service identity
and need no phone, web app, or owner session.

## Core package

[`@netscript/plugin-sagas-core`](/reference/plugin-sagas-core/) is canonical for the saga DSL,
runtime ports, adapters, telemetry, configuration and testing exports.

> [!WARNING]
> The core `spawn(child, input, options?: SpawnOptions): never` contract is unsupported: it throws
> immediately rather than starting a child saga.

## Examples

### Test a saga deterministically

`createTestSagaRuntime` from `@netscript/plugin-sagas-core/testing` provides an in-memory bus, store
and controllable clock, so you can assert on emitted side effects without an external message bus or
database.

```ts
import { assertEquals } from "@std/assert";
import { defineSaga, send, type SagaState } from "@netscript/plugin-sagas-core";
import { createTestSagaRuntime } from "@netscript/plugin-sagas-core/testing";

Deno.test("Saga testing with createTestSagaRuntime and controllable clock", async () => {
  const runtime = createTestSagaRuntime();

  // Define a simple saga using the recommended SagaState type for registration compatibility
  const checkoutSaga = defineSaga("CheckoutSaga")
    .state<SagaState>({ orderId: "", total: 0, status: "pending" })
    .on<string, unknown>("OrderCreated", (saga, event) => {
      const payload = event.payload as { orderId: string; total: number };
      saga.state = {
        ...saga.state,
        orderId: payload.orderId,
        total: payload.total,
        status: "processing",
      };
      return [send("PaymentRequested", { orderId: payload.orderId, total: payload.total })];
    })
    .build();

  // Start the test runtime
  await runtime.start();
  await runtime.register([checkoutSaga]);

  // Publish a starting event
  const event = {
    type: "OrderCreated",
    payload: { orderId: "ord_123", total: 500 },
  };
  await runtime.publish(event);

  // Assert that the message was recorded on the test bus
  const published = runtime.bus.published();
  assertEquals(published.length, 1);
  assertEquals(published[0].message.type, "OrderCreated");
  assertEquals(published[0].message.payload, { orderId: "ord_123", total: 500 });

  // Controllable clock assertion
  // The test saga clock starts at a default time, and sleep advances it.
  assertEquals(runtime.clock.now().toISOString(), "2026-01-01T00:00:00.000Z");
  
  await runtime.clock.sleep(500);
  assertEquals(runtime.clock.now().toISOString(), "2026-01-01T00:00:00.500Z");
  assertEquals(runtime.clock.sleeps(), [500]);

  // Stop the runtime
  await runtime.stop();
});
```
