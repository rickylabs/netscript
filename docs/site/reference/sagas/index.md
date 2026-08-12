---
layout: layouts/base.vto
title: "@netscript/plugin-sagas"
---

# `@netscript/plugin-sagas`

NetScript plugin for durable saga orchestration, workflow APIs, and saga runtime metadata.
This page is written against the package's public surface reported by `deno doc`. For the full
index of packages and plugins return to the [reference overview](/reference/).

The published plugin exposes the host-facing plugin manifest, the executable saga runtime and
supervisor, the HTTP publisher, the versioned API contract, and the browser-safe stream surface.
The userland saga DSL (`defineSaga`, the cascaded-message constructors) is authored against
[`@netscript/plugin-sagas-core`](/reference/plugin-sagas-core/) and re-exported through the runtime
entrypoint. That separately published package has its own canonical reference page.

## Entrypoints

The plugin publishes the following entrypoints. Each is documented against its own `deno doc`
surface.

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
| `SAGAS_API_DEFAULT_PORT` | variable | `8092` | Default HTTP fallback port for the sagas API process (note: your scaffold's port will differ as the scaffolder allocates randomized high-range ports at init/install time). |


## Runtime (`@netscript/plugin-sagas/runtime`)

The runtime entrypoint provides the executable saga runtime and the building blocks a composition
root wires together. It also re-exports the userland DSL types and cascaded-message vocabulary from
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

## Core package

The separately published
[`@netscript/plugin-sagas-core`](/reference/plugin-sagas-core/) page is canonical for the saga DSL,
runtime ports, adapters, telemetry, configuration, and testing exports. This page stays focused on
the deployable plugin's manifest and integration entrypoints. The testing example below uses the core
package intentionally; exhaustive core entrypoint and symbol tables live only on its reference page.

The unsupported `spawn(child, input, options?: SpawnOptions): never` contract is worth calling out:
it throws immediately rather than starting a child saga. Its full description and every other core
symbol live on the canonical core page.

## Deterministic Testing

Durable sagas can be tested without external message buses or databases using `createTestSagaRuntime` from `@netscript/plugin-sagas-core/testing`. This provides an in-memory bus, store, and controllable clock to assert on emitted side-effects.

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

---

Back to the [reference overview](/reference/).
