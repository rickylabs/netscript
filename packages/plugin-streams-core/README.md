# @netscript/plugin-streams-core

`@netscript/plugin-streams-core` provides the shared stream contract surface for NetScript.

## 1. Package Role

This package is the Tier 1 core for stream-aware plugins.
It is an Archetype 1 small-contract package.
It keeps the public stream API out of the runtime plugin.
It exposes schema, producer, configuration, telemetry, diagnostics, and tests.
It does not start a server.
It does not depend on non-core plugin packages.
It is the lowest core in the extraction graph.

## 2. Install

Use the workspace import during local development.
Use the JSR package name once published.

```ts
import { defineStreamSchema } from "@netscript/plugin-streams-core";
```

## 3. Quick Start

Define a stream schema.
Create a durable producer.
Publish entity changes.
Flush the producer before shutdown.

```ts
import {
  createDurableStream,
  defineStreamSchema,
} from "@netscript/plugin-streams-core";

const schema = defineStreamSchema({});
const producer = createDurableStream({
  streamPath: "/workers/executions",
  schema,
  producerId: "workers-service",
});

await producer.flush();
```

## 4. Public Surface

The root entrypoint exports only the stable production contract.
Testing helpers are exported from `./testing`.
Telemetry helpers are exported from `./telemetry`.
The old `@netscript/streams` package is replaced by this package.
The public surface follows the actual schema/producer-centric runtime.
It does not invent a topic-centric API.

## 5. Schema DSL

`defineStreamSchema` wraps `createStateSchema` from `@durable-streams/state`.
Each collection defines a validator.
Each collection defines a durable stream event type.
Each collection defines a primary key.
Consumers share the same schema between producers and stream database clients.
The schema is a contract, not a running process.

## 6. Producer

`DurableStreamProducer` wraps `IdempotentProducer` from `@durable-streams/client`.
`createDurableStream` returns a singleton producer per stream path.
`upsert` writes a State Protocol upsert event.
`delete` writes a State Protocol delete event.
`flush` drains pending writes.
`close` flushes and closes the producer.

## 7. Configuration

`getStreamsUrl` resolves the durable streams server URL.
It checks `DURABLE_STREAMS_URL`.
It checks Aspire service discovery for the `streams` HTTP endpoint.
`getStreamsAuth` returns bearer auth headers when a stream secret is present.
`buildStreamUrl` appends the durable-streams State Protocol path.

## 8. Telemetry

The telemetry subpath exports `streamsInstrumentation`.
It also exports stream span names.
It also exports stream attribute keys.
The planned span names are `stream.publish`, `stream.consume`, and `stream.subscribe`.
The registration uses the NetScript telemetry registration shape without importing
the telemetry package at runtime.

## 9. Diagnostics

`inspectStreamTopic` reports schema collection names and optional producer metadata.
The name keeps compatibility with the plan vocabulary.
The function inspects the real schema object.
It does not require a runtime stream server.
It returns a JSON-stable report.

## 10. Testing

The testing subpath exports `MemoryStreamProducer`.
It records upsert and delete events.
It never opens a network connection.
It is useful for workers, sagas, and triggers tests.
The testing subpath also exports `createStreamTopicFixture`.

## 11. Required Permissions

Schema-only usage requires no runtime permissions.
Producer usage may require `--allow-net`.
URL resolution may require `--allow-env`.
Tests that use `MemoryStreamProducer` require no network permission.
Publish dry-run requires normal Deno registry checks.

## 12. Package Boundaries

Tier 1 owns schemas and producers.
Tier 2 owns the service process.
Tier 2 owns CLI commands.
Tier 2 owns Aspire contribution wiring.
Tier 2 owns E2E gates.
Consumers import `@netscript/plugin-streams-core`, not `@netscript/plugin-streams`.

## 13. Dependency Edges

Allowed dependencies include `@durable-streams/state`.
Allowed dependencies include `@durable-streams/client`.
The telemetry entrypoint exposes NetScript-owned registration metadata without
importing `@netscript/telemetry`.
Aspire service discovery is resolved from server env vars or Vite-injected
browser env vars without importing `@netscript/sdk/discovery`.
Forbidden dependencies include any non-core plugin package.
Forbidden dependencies include other `*-core` packages.

## 14. Migration From @netscript/streams

Replace imports from `@netscript/streams` with `@netscript/plugin-streams-core`.
Keep `defineStreamSchema` call sites unchanged.
Keep `createDurableStream` call sites unchanged.
Keep `DurableStreamProducer` call sites unchanged.
Keep URL helper call sites unchanged.
Remove old import-map entries after source imports are updated.

## 15. Contributor Path

Add schema vocabulary under `src/domain`.
Add small factories under `src/application`.
Add externally consumed test fakes under `src/testing`.
Expose only stable contracts through `mod.ts`.
Add focused tests under `tests`.
Run the narrow slice gate first.
Run publish dry-run before release.

## 16. Deferred Scope

`defineStreamTopic` is deferred.
A typed consumer SDK is deferred.
Full walker integration is deferred.
Production Caddy integration is deferred.
Cross-plugin stream E2E parity is deferred.

## 17. See Also

Read `docs/architecture.md`.
Read `docs/concepts.md`.
Read `docs/getting-started.md`.
Read `docs/recipes/defining-a-schema.md`.
Read `docs/recipes/publishing-events.md`.
Read `docs/recipes/testing-with-memory-producer.md`.
