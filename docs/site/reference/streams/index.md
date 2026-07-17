---
layout: layouts/base.vto
title: "@netscript/plugin-streams"
---

# `@netscript/plugin-streams`

Durable Streams development plugin for NetScript: a plugin manifest plus CLI, scaffolding,
end-to-end gate, and Aspire integration surfaces for a durable, change-data stream service. This
page is generated from the plugin public surface with `deno doc` (US-2). For the full index of
packages and plugins return to the [reference overview](/reference/).

The plugin ships five published entrypoints. The root export (`@netscript/plugin-streams`) carries
the manifest and the typed topic/producer/consumer authoring helpers; four sub-path exports carry
the framework integrations:

- [`@netscript/plugin-streams/cli`](#sub-path-cli) — plugin CLI command group.
- [`@netscript/plugin-streams/scaffolding`](#sub-path-scaffolding) — scaffolder descriptor.
- [`@netscript/plugin-streams/e2e`](#sub-path-e2e) — E2E gate definitions.
- [`@netscript/plugin-streams/aspire`](#sub-path-aspire) — Aspire AppHost contribution.

The schema, producer, telemetry, testing, and diagnostics primitives that the plugin builds on
live in the internal `@netscript/plugin-streams-core` package, documented in
[Internals](#internals) below.

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
> from [`@netscript/plugin-streams-core`](#internals). See the
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

### `@netscript/plugin-streams/cli` {#sub-path-cli}

CLI command group for the plugin, mounted under `deno x -A jsr:@netscript/plugin-streams{{ releaseSpecifier }}/cli`.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `streamsCli` | variable | `const streamsCli: StreamsCli` | Default CLI instance for the streams plugin. |
| `StreamsCli` | class | `class StreamsCli` | CLI command group for `@netscript/plugin-streams`. |

The CLI types `PluginCli`, `PluginCliArgs`, `PluginCliCommand`, and `PluginCliResult` are
re-exported from [`@netscript/plugin`](/reference/plugin/) and document the base command contract
`StreamsCli` extends.

### `@netscript/plugin-streams/scaffolding` {#sub-path-scaffolding}

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

## Internals

The following surface belongs to the internal **`@netscript/plugin-streams-core`** package. It is a
supporting package — not part of the public plugin contract — and is documented here per the
single-page internals convention (US-8). It provides the schema, producer, configuration,
telemetry, testing, and diagnostics primitives that `@netscript/plugin-streams` builds on. Its root
export is `@netscript/plugin-streams-core` with two sub-path exports (`/telemetry`, `/testing`).

### Schema and producers (`@netscript/plugin-streams-core`)

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `defineStreamSchema` | function | `function defineStreamSchema(collections): StateSchema` | Define a type-safe durable stream schema. |
| `createDurableStream` | function | `function createDurableStream(options): DurableStreamProducer` | Create or reuse a durable stream producer for a stream path. |
| `createServiceStreamProducer` | function | `function createServiceStreamProducer(options): DurableStreamProducer` | Blessed Service-facing producer factory. Wraps `createDurableStream` reusing `getStreamsUrl`/`getStreamsAuth`; eagerly resolves the streams URL and auth (`assertResolvable`, default `true`) so a mis-wired Service **throws at construction** instead of silently dropping writes. |
| `DurableStreamProducer` | class | `class DurableStreamProducer` | Server-side writer for a named durable stream. |
| `DurableStreamProducerOptions` | interface | `interface DurableStreamProducerOptions` | Options accepted by `createDurableStream` / `DurableStreamProducer`. |
| `ServiceStreamProducerOptions` | interface | `interface ServiceStreamProducerOptions extends DurableStreamProducerOptions` | Options for `createServiceStreamProducer`: the `DurableStreamProducerOptions` fields plus the optional `assertResolvable` fail-fast gate (default `true`). |
| `StreamProducerPort` | interface | `interface StreamProducerPort` | Port implemented by stream producers that publish State Protocol changes. |
| `inspectStreamTopic` | function | `function inspectStreamTopic(input): StreamTopicInspectionReport` | Inspect a stream schema and optional producer metadata. |
| `StreamTopicInspectionInput` | interface | `interface StreamTopicInspectionInput` | Input accepted by `inspectStreamTopic`. |
| `StreamTopicInspectionReport` | interface | `interface StreamTopicInspectionReport` | Diagnostic report returned by `inspectStreamTopic`. |

#### Configuration helpers

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `getStreamsUrl` | function | `function getStreamsUrl(): string` | Resolve the base URL of the durable streams server. |
| `getStreamsAuth` | function | `function getStreamsAuth(): Record` | Resolve authentication headers for the durable streams server. |
| `buildStreamUrl` | function | `function buildStreamUrl(path, baseUrl): string` | Build the full stream URL for a NetScript stream path. |

#### Schema and event types

| Symbol | Kind | Description |
| --- | --- | --- |
| `StateSchema` | type alias | Schema map returned by `defineStreamSchema`. |
| `StreamStateDefinition` | type alias | Input map accepted by `defineStreamSchema`. |
| `CollectionDefinition` | interface | A single collection definition inside a durable stream schema. |
| `CollectionWithHelpers` | type alias | Collection definition after durable-streams helper methods are attached. |
| `CollectionEventHelpers` | interface | Helper methods attached to collections by `@durable-streams/state`. |
| `StateEvent` | type alias | Durable stream event union. |
| `ChangeEvent` | interface | Entity change event emitted by durable stream producers. |
| `ControlEvent` | interface | Control event emitted by durable streams for non-entity lifecycle changes. |
| `Operation` | type alias | State Protocol operation names supported by durable streams. |

### Telemetry (`@netscript/plugin-streams-core/telemetry`)

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `streamsInstrumentation` | variable | `const streamsInstrumentation: StreamsInstrumentationRegistration` | Telemetry registration for stream publish, consume, and subscribe spans. |
| `StreamsInstrumentationRegistration` | interface | `interface StreamsInstrumentationRegistration` | Minimal instrumentation contract understood by NetScript telemetry hosts. |
| `STREAMS_SPAN_NAMES` | variable | `const STREAMS_SPAN_NAMES` | Span names emitted by stream producers and consumers. |
| `STREAMS_TELEMETRY_ATTRIBUTES` | variable | `const STREAMS_TELEMETRY_ATTRIBUTES` | Attribute keys used by stream telemetry. |
| `StreamsSpanName` | type alias | Span name emitted by stream instrumentation. |
| `StreamsTelemetryAttributeKey` | type alias | Attribute key used by stream telemetry. |
| `StreamsTelemetryAttributes` | type alias | Attribute bag accepted by stream instrumentation hooks. |

### Testing (`@netscript/plugin-streams-core/testing`)

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `MemoryStreamProducer` | class | `class MemoryStreamProducer` | In-memory stream producer for tests that should not open network sockets. |
| `MemoryStreamEvent` | interface | `interface MemoryStreamEvent` | Event recorded by `MemoryStreamProducer`. |
| `createStreamTopicFixture` | function | `function createStreamTopicFixture(): StreamTopicFixtureSchema` | Create a small stream schema fixture with one `execution` collection. |
| `StreamTopicFixtureSchema` | type alias | Schema shape returned by `createStreamTopicFixture`. |

---

Back to the [reference overview](/reference/).
