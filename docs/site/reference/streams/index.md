---
layout: layouts/base.vto
title: "@netscript/plugin-streams"
templateEngine: [vento, md]
---

# `@netscript/plugin-streams`

Durable Streams development plugin for NetScript: a plugin manifest plus CLI, scaffolding,
end-to-end gate, and Aspire integration surfaces for a durable, change-data stream service. This
page is written against the plugin public surface reported by `deno doc`. For the full index of
packages and plugins return to the [reference overview](/reference/).

The plugin ships seven published entrypoints. The root export (`@netscript/plugin-streams`) carries
the manifest and the typed topic/producer/consumer authoring helpers; six sub-path exports carry
the framework integrations:

- [`@netscript/plugin-streams/cli`](#sub-path-cli) — plugin CLI command group.
- `@netscript/plugin-streams/adapter-cli` — executable plugin-adapter CLI entrypoint.
- [`@netscript/plugin-streams/scaffold`](#sub-path-scaffolding) — scaffolder protocol entrypoint.
- [`@netscript/plugin-streams/e2e`](#sub-path-e2e) — E2E gate definitions.
- [`@netscript/plugin-streams/aspire`](#sub-path-aspire) — Aspire AppHost contribution.
- `@netscript/plugin-streams/services` — executable Durable Streams service.

The schema, producer, telemetry, testing, and diagnostics primitives that the plugin builds on live
in the separately published
[`@netscript/plugin-streams-core`](/reference/plugin-streams-core/) package, which has its own
canonical reference page.

## Plugin manifest

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `streamsPlugin` | variable | `const streamsPlugin: PluginManifest` | Plugin manifest for the NetScript Durable Streams service. |

## Topic authoring

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `defineStreamTopic` | function | `function defineStreamTopic(name, schema): StreamTopicDefinition` | Define a typed stream topic. |
| `defineStreamProducer` | function | `function defineStreamProducer(topic): StreamProducerHandle` | Return a manifest-layer producer handle. Not wired to a transport: the returned `publish()` **rejects** with `StreamUnsupportedOperationError`. |
| `defineStreamConsumer` | function | `function defineStreamConsumer(topic): StreamConsumerHandle` | Return a manifest-layer consumer handle. Not wired to a transport: the returned `subscribe()` **throws** `StreamUnsupportedOperationError` synchronously. |
| `StreamUnsupportedOperationError` | class | `class StreamUnsupportedOperationError extends Error` | Raised by the manifest topic helpers when asked to perform runtime IO; points callers at `@netscript/plugin-streams-core`. |
| `StreamTopicDefinition` | interface | `interface StreamTopicDefinition` | Typed stream topic definition. |
| `StreamPayloadSchema` | interface | `interface StreamPayloadSchema` | Package-owned structural payload schema accepted by stream topic definitions. |
| `StreamProducerHandle` | interface | `interface StreamProducerHandle` | Stub producer handle for downstream plugin manifests; its `publish()` rejects (see above). |
| `StreamConsumerHandle` | interface | `interface StreamConsumerHandle` | Stub consumer handle for downstream plugin manifests; its `subscribe()` throws (see above). |

> **Not yet wired.** `defineStreamProducer` and `defineStreamConsumer` are manifest-layer stubs.
> A producer's `publish()` returns a rejected promise and a consumer's `subscribe()` throws
> synchronously, both with `StreamUnsupportedOperationError`. For real producer work use
> `createDurableStream` (or the Service-facing `createServiceStreamProducer`) and `defineStreamSchema`
> from [`@netscript/plugin-streams-core`](/reference/plugin-streams-core/). See the
> [durable streams capability page](/capabilities/streams/) for the full producer/consumer model.

> **Browser consumers read over HTTP/SSE.** There is no in-process `subscribe()`; a browser
> consumes a stream by reading its HTTP/SSE endpoint (for example with `EventSource`). The local
> AppHost serves the generated app over `http://`, and under HTTP/1.1 browsers typically allow only
> about **six concurrent connections per origin** — so several long-lived stream subscriptions from
> one page can starve later requests. Serve over HTTPS (HTTP/2) when a page needs many simultaneous
> stream consumers.

### Re-exported plugin framework types

The root export re-exports the shared NetScript plugin-framework contribution types unchanged from
[`@netscript/plugin`](/reference/plugin/). See the [`@netscript/plugin` reference](/reference/plugin/)
for their full definitions.

| Symbol | Kind |
| --- | --- |
| `PluginManifest` | interface |
| `PluginContributions` | interface |
| `PluginContext` | interface |
| `PluginLifecycleHooks` | interface |
| `PluginLogger` | interface |
| `ServiceContribution` | interface |
| `TelemetryContribution` | interface |
| `E2eContribution` | interface |
| `DbSchemaContribution` | interface |
| `MigrationContribution` | interface |
| `BackgroundProcessorContribution` | interface |
| `ContractVersionContribution` | interface |
| `RuntimeConfigTopicContribution` | interface |
| `StreamTopicContribution` | interface |
| `PluginDependencies` | type alias |
| `PluginMetadata` | type alias |
| `PluginMetadataValue` | type alias |
| `PluginType` | type alias |
| `PLUGIN_TYPES` | variable |

## Sub-path exports

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/plugin-streams` | `./mod.ts` | Plugin manifest and typed topic, producer, and consumer authoring helpers. |
| `@netscript/plugin-streams/scaffold` | `./scaffold.ts` | Executable plugin scaffolder entrypoint and its shared scaffolding protocol types. |
| `@netscript/plugin-streams/adapter-cli` | `./cli.ts` | Executable plugin-adapter CLI entrypoint and its shared CLI protocol types. |
| `@netscript/plugin-streams/cli` | `./src/cli/composition/main.ts` | Plugin CLI command group. |
| `@netscript/plugin-streams/e2e` | `./src/e2e/mod.ts` | End-to-end gate definitions. |
| `@netscript/plugin-streams/aspire` | `./src/aspire/mod.ts` | Aspire AppHost contribution for the Durable Streams service. |
| `@netscript/plugin-streams/services` | `./services/src/main.ts` | Executable Durable Streams proxy service. |

### `@netscript/plugin-streams/cli` {#sub-path-cli}

CLI command group for the plugin, mounted under `deno x -A jsr:@netscript/plugin-streams{{ releaseSpecifier }}/cli`.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `streamsCli` | variable | `const streamsCli: StreamsCli` | Default CLI instance for the streams plugin. |
| `StreamsCli` | class | `class StreamsCli` | CLI command group for `@netscript/plugin-streams`. |

The CLI types `PluginCli`, `PluginCliArgs`, `PluginCliCommand`, and `PluginCliResult` are
re-exported from [`@netscript/plugin`](/reference/plugin/) and document the base command contract
`StreamsCli` extends.

### `@netscript/plugin-streams/scaffold` {#sub-path-scaffolding}

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `streamsScaffolder` | variable | `const streamsScaffolder: StreamsScaffolder` | Minimal scaffolder descriptor for streams plugin packages. |
| `StreamsScaffolder` | interface | `interface StreamsScaffolder` | Scaffolding descriptor for the streams plugin package. |

### `@netscript/plugin-streams/e2e` {#sub-path-e2e}

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `getStreamsE2eGates` | function | `function getStreamsE2eGates()` | Return E2E gate definitions owned by the streams plugin. |
| `StreamsE2eGate` | interface | `interface StreamsE2eGate` | E2E gate definition for the streams plugin. |

### `@netscript/plugin-streams/aspire` {#sub-path-aspire}

The Aspire entrypoint contributes the Durable Streams development service to an Aspire AppHost.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `StreamsAspireContribution` | class | `class StreamsAspireContribution` | Aspire contribution for the Durable Streams development service. |

The remaining symbols on this entrypoint (`AspireBuilder`, `AspireResource`, `AspireResourceKind`,
`AspireNSPluginContribution`, `ContributionContext`, `CacheSpec`, `ContainerSpec`, `DatabaseSpec`,
`DenoServiceSpec`, `DenoBackgroundSpec`, `HealthCheckSpec`, `EnvSource`) are re-exported unchanged
from [`@netscript/aspire`](/reference/aspire/); see that reference page for their definitions.

## Core package

The separately published
[`@netscript/plugin-streams-core`](/reference/plugin-streams-core/) page is canonical for stream
schemas, producers, configuration, telemetry, testing, and diagnostics. This page stays focused on
the deployable plugin's manifest and integration entrypoints. The testing example below uses core
APIs intentionally; exhaustive core entrypoint and symbol tables live only on its reference page.

## Socket-Free Testing and Telemetry

Use `MemoryStreamProducer` in unit and integration tests to verify change events are published without opening network sockets or starting a real streams server. Use `createStreamsInstrumentation` (from `./telemetry`) to verify context-propagation headers (like OpenTelemetry `traceparent`) are correctly injected.

```ts
import { assertEquals, assertExists } from "@std/assert";
import { MemoryStreamProducer } from "@netscript/plugin-streams-core/testing";
import { createStreamsInstrumentation } from "@netscript/plugin-streams-core/telemetry";

Deno.test("stream socket-free testing with MemoryStreamProducer and telemetry facade", async () => {
  // 1. Socket-free testing using MemoryStreamProducer
  const producer = new MemoryStreamProducer();

  // Publish some mock events
  producer.upsert("orders", { id: "order_123", total: 100 });
  producer.delete("orders", "order_123");
  await producer.flush();

  // Assert events are recorded synchronously in memory without network sockets
  assertEquals(producer.events(), [
    {
      entityType: "orders",
      operation: "upsert",
      key: "order_123",
      value: { id: "order_123", total: 100 },
    },
    {
      entityType: "orders",
      operation: "delete",
      key: "order_123",
    },
  ]);

  await producer.close();

  // 2. Using the Telemetry Facade to publish and inject trace context
  const telemetry = createStreamsInstrumentation();
  let traceHeaders: Record<string, string> = {};

  telemetry.publish({
    streamPath: "/orders/updates",
    collection: "orders",
    operation: "upsert",
    producerId: "orders-service",
    messageId: "order_123",
    emit: (headers) => {
      traceHeaders = headers;
    },
  });

  // Assert traceparent is generated and injected by the telemetry facade
  assertExists(traceHeaders.traceparent);
});
```

---

Back to the [reference overview](/reference/).
