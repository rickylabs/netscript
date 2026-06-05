# @netscript/plugin-streams

`@netscript/plugin-streams` declares the Durable Streams plugin manifest and public extension
subpaths for NetScript.

## 1. Package Role

This package is the Tier 2 streams plugin. It is an Archetype 5 plugin package. It owns manifest
metadata, service contribution data, CLI command wiring, Aspire contribution wiring, E2E gate
metadata, and scaffolding metadata.

It does not own stream schema, producer, or consumer runtime primitives. Those primitives live in
`@netscript/plugin-streams-core`.

## 2. Install

Use the local plugin path in this workspace. Use the JSR package name after publishing.

```ts
import { streamsPlugin } from '@netscript/plugin-streams';
```

## 3. Configure

Add the plugin path to `netscript.config.ts`.

```ts
plugins: ['./plugins/streams/mod.ts'];
```

The host loader resolves explicit plugin paths. The plugin exports a named `streamsPlugin` manifest
and has no package-load side effects.

## 4. Manifest API

The manifest is authored with `definePlugin(name, version)` from `@netscript/plugin`.

```ts
import { streamsPlugin } from '@netscript/plugin-streams';

console.log(streamsPlugin.contributions.services?.[0]?.name);
```

The package does not export a default plugin definition and does not keep legacy top-level service
metadata in the manifest.

## 5. Stream Helpers

The public surface includes manifest-layer helper definitions:

- `defineStreamTopic`
- `defineStreamProducer`
- `defineStreamConsumer`
- `StreamTopicDefinition`
- `StreamProducerHandle`
- `StreamConsumerHandle`

`StreamTopicDefinition.schema` uses `StandardSchemaV1`. Runtime producers and consumers still belong
to `@netscript/plugin-streams-core`.

## 6. Public Surface

The root entrypoint exports `streamsPlugin`, stream helper definitions, and manifest-related types.
The `./cli` subpath exports `StreamsCli`. The `./aspire` subpath exports
`StreamsAspireContribution`. The `./e2e` subpath exports `getStreamsE2eGates`. The `./scaffolding`
subpath exports `streamsScaffolder`.

## 7. Contribution Axes

The plugin declares these contribution axes:

- `services`
- `streamTopics`
- `e2e`
- `telemetry`
- `aspire`

The plugin does not import from `plugins/registry.ts`. Registry compatibility helpers remain a
supervisor-merge removal item outside this package README.

## 8. Service

The service starts `DurableStreamTestServer`, proxies requests with Hono, exposes `/health`,
`/health/live`, and `/health/ready`, and shuts down through the `Deno.serve()` server handle.

The default public port is `4437`. Set `STREAMS_PORT` or `PORT` to override it. Set
`STREAMS_DATA_DIR` for file-backed storage. Omit `STREAMS_DATA_DIR` for in-memory development
storage.

## 9. CLI

`StreamsCli` exposes five verbs. `list-topics` returns an explicit walker-not-implemented result.
`subscribe`, `publish`, `stats`, and `clear` are reserved for runtime CLI wiring until the walker
exists.

## 10. Aspire And E2E

`StreamsAspireContribution` registers a Deno service resource, declares the streams health check,
and exposes the default durable streams URL. The E2E subpath declares health, publish, and subscribe
gate metadata as data for the full greenlight runner.

## 11. Required Permissions

The service needs `--allow-net`, `--allow-env`, and `--allow-read`. It may need `--allow-write` for
file-backed storage. The durable-streams server currently needs `--allow-sys` and `--allow-ffi`.

## 12. Core Package Boundary

Do not import runtime stream primitives from this plugin. Import `defineStreamSchema`,
`createDurableStream`, test producers, and telemetry constants from `@netscript/plugin-streams-core`
and its subpaths.

## 13. Migration

Replace `@netscript/streams` imports with `@netscript/plugin-streams-core`. Add
`./plugins/streams/mod.ts` to `netscript.config.ts`. Run package and plugin checks, then run plugin
publish dry-run.

## 14. Deferred Scope

Typed consumer SDK, full topic walker integration, runtime CLI publish and subscribe behavior,
production Caddy integration, and cross-plugin stream parity are deferred.

## 15. See Also

Read `docs/architecture.md`, `docs/concepts.md`, `docs/getting-started.md`,
`docs/recipes/README.md`, and `docs/advanced/extending.md`.
