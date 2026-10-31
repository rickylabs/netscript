---
layout: layouts/base.vto
title: "@netscript/plugin-streams"
templateEngine: [vento, md]
---

# `@netscript/plugin-streams`

The deployable Durable Streams plugin for NetScript: the plugin manifest plus CLI, scaffolding,
end-to-end gate and Aspire integration surfaces for an ephemeral change-data stream service. File
storage that survives an orderly process restart is an explicit, startup-probed opt-in. Schemas,
producers, telemetry, testing and diagnostics live in
[`@netscript/plugin-streams-core`](/reference/plugin-streams-core/).

## Sub-path exports

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/plugin-streams` | `./mod.ts` | [Plugin manifest](#plugin-manifest) and [typed topic definitions](#topic-authoring). |
| `@netscript/plugin-streams/scaffold` | `./scaffold.ts` | [Executable plugin scaffolder entrypoint](#sub-path-scaffolding) and its shared scaffolding protocol types. |
| `@netscript/plugin-streams/adapter-cli` | `./cli.ts` | Executable plugin-adapter CLI entrypoint and its shared CLI protocol types. |
| `@netscript/plugin-streams/cli` | `./src/cli/composition/main.ts` | [Plugin CLI command group](#sub-path-cli). |
| `@netscript/plugin-streams/e2e` | `./src/e2e/mod.ts` | [End-to-end gate definitions](#sub-path-e2e). |
| `@netscript/plugin-streams/aspire` | `./src/aspire/mod.ts` | [Aspire AppHost contribution](#sub-path-aspire) for the Durable Streams service. |
| `@netscript/plugin-streams/service` | `./services/mod.ts` | [Inert caller-policy streams factory](#sub-path-service). |
| `@netscript/plugin-streams/services` | `./services/src/main.ts` | Executable Durable Streams proxy service. |

## `@netscript/plugin-streams/service` {#sub-path-service}

| Symbol                  | Kind      | Signature                                                                      | Description                                                                                    |
| ----------------------- | --------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `startStreamsService`   | function  | `startStreamsService(options: StreamsServiceOptions): Promise<RunningService>` | Start the existing storage/proxy runtime with caller-owned native policy and listener options. |
| `StreamsServiceOptions` | interface | `auth: ServiceAuthPolicy; cors?: CorsOptions; serve?: ServeOptions`            | Explicit auth and optional native CORS/listener configuration.                                 |

Import is inert. Auth validation runs before environment, storage or listener access. Explicit
`serve.port`, including zero, wins over `PORT` then `STREAMS_PORT`. `stop()` drains the front
listener and stops the factory-owned upstream. Guard raw stream paths with native `authn.protect`;
omitted CORS origins use the workspace allowlist while protocol methods/headers remain supplied. The
plural `./services` CLI entrypoint keeps its authored public and wildcard policy. See
[Host workers and streams services](/services-sdk/how-to/host-plugin-services/).

Native signature types are re-exported unchanged: `CorsOptions`, `RunningService`,
`RunningServiceAddress`, `ServeOptions`, `ServiceApp`, `ServiceEnvironment`, `ServiceTlsOptions`
from `@netscript/service`; and `AuthenticatorPort`, `AuthnOptions`, `AuthnRequest`, `AuthnResult`,
`AuthorizerPort`, `AuthzDecision`, `AuthzOptions`, `AuthzRequest`, `Principal`, `ServiceAuthPolicy`,
`ServiceGuardedAuthPolicy`, `ServicePublicAuthPolicy` from `@netscript/service/auth`. Application
code can import those native contracts from their owning modules.

## Plugin manifest

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `streamsPlugin` | const | `const streamsPlugin: PluginManifest` | Plugin manifest for the NetScript Durable Streams service. |

## Topic authoring

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `defineStreamTopic` | function | `function defineStreamTopic(name, schema): StreamTopicDefinition` | Define a typed stream topic. |
| `StreamTopicDefinition` | interface | `interface StreamTopicDefinition` | Typed stream topic definition. |
| `StreamPayloadSchema` | interface | `interface StreamPayloadSchema` | Package-owned structural payload schema accepted by stream topic definitions. |

Runtime producers live in [`@netscript/plugin-streams-core`](/reference/plugin-streams-core/): use
`defineStreamSchema` with `createDurableStream` or `createServiceStreamProducer`.

> [!IMPORTANT]
> The former root producer/consumer helpers and their unsupported-operation types were removed in
> 0.0.8. See [the breaking migration](/durable-workflows/streams/#breaking-migration-in-008) for the
> collection model and HTTP/SSE consumption path.

Browsers read a stream over its HTTP/SSE endpoint, for example with `EventSource`; there is no
in-process `subscribe()`.

> [!WARNING]
> The local AppHost serves the generated app over `http://`. Under HTTP/1.1, browsers typically allow
> about six concurrent connections per origin, so several long-lived stream subscriptions from one
> page can starve later requests. Serve over HTTPS (HTTP/2) when a page needs many simultaneous
> stream consumers.

### Re-exported plugin framework types

Re-exported unchanged from [`@netscript/plugin`](/reference/plugin/), which documents them.

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
| `PLUGIN_TYPES` | const |

## `@netscript/plugin-streams/cli` {#sub-path-cli}

CLI command group for the plugin, mounted under `deno x -A jsr:@netscript/plugin-streams{{ releaseSpecifier }}/cli`.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `streamsCli` | const | `const streamsCli: StreamsCli` | Default CLI instance for the streams plugin. |
| `StreamsCli` | class | `class StreamsCli` | CLI command group for `@netscript/plugin-streams`. |

`PluginCli`, `PluginCliArgs`, `PluginCliCommand`, and `PluginCliResult` are re-exported from
[`@netscript/plugin`](/reference/plugin/); they are the base command contract `StreamsCli` extends.

## `@netscript/plugin-streams/scaffold` {#sub-path-scaffolding}

The default export is the streams adapter scaffold entrypoint, typed `PluginScaffoldEntrypoint`. The
entrypoint also re-exports `PluginLogger`, `PluginScaffoldEntrypoint`, `ScaffolderContext` and
`ScaffoldResult` from [`@netscript/plugin/adapter`](/reference/plugin/#netscriptpluginadapter).

## `@netscript/plugin-streams/e2e` {#sub-path-e2e}

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `getStreamsE2eGates` | function | `function getStreamsE2eGates()` | Return E2E gate definitions owned by the streams plugin. |
| `StreamsE2eGate` | interface | `interface StreamsE2eGate` | E2E gate definition for the streams plugin. |

## `@netscript/plugin-streams/aspire` {#sub-path-aspire}

Contributes the Durable Streams protocol service, ephemeral by default, to an Aspire AppHost. File storage requires an explicit, existing writable directory and a successful
startup write/read probe; invalid opt-ins fail startup.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `StreamsAspireContribution` | class | `class StreamsAspireContribution` | Aspire contribution for the ephemeral-by-default Durable Streams protocol service. |

The remaining symbols on this entrypoint (`AspireBuilder`, `AspireResource`, `AspireResourceKind`,
`AspireNSPluginContribution`, `ContributionContext`, `CacheSpec`, `ContainerSpec`, `DatabaseSpec`,
`DenoServiceSpec`, `DenoBackgroundSpec`, `EnvSource`) are re-exported unchanged
from [`@netscript/aspire`](/reference/aspire/); see that reference page for their definitions.

## Core package

[`@netscript/plugin-streams-core`](/reference/plugin-streams-core/) is canonical for stream schemas,
producers, configuration, telemetry, testing and diagnostics.

## Examples

### Test publishing and telemetry without sockets

`MemoryStreamProducer` verifies that change events are published without opening network sockets or
starting a streams server. `createStreamsInstrumentation` (from `./telemetry`) verifies that
context-propagation headers such as OpenTelemetry `traceparent` are injected.

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
