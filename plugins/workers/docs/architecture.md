# Workers Plugin Architecture

`@netscript/plugin-workers` is a Tier 2 plugin package. It composes host-facing contributions around
the Tier 1 `@netscript/plugin-workers-core` package.

## Boundaries

The plugin root exports the manifest and inspection surface. Non-root capabilities are published as
subpaths:

- `./cli`
- `./aspire`
- `./contracts`
- `./scaffolding`
- `./services`
- `./streams`
- `./streams/server`

The root does not expose the full implementation tree. Host integrations import the subpath that
matches the axis being mounted.

## Composition

The manifest is created with the plugin builder:

```ts
definePlugin('@netscript/plugin-workers', '0.1.0')
  .withDependencies({ streams: streamsPlugin })
  .withService({ name: 'workers-api', entrypoint: './services/src/main.ts', port: 8091 })
  .withBackgroundProcessor({ name: 'workers-worker', entrypoint: './bin/worker.ts' })
  .build();
```

Typed dependencies allow the workers manifest to define stream topics against the streams plugin
without stringly dependency lookups.

## Runtime Ownership

Core owns definitions, contracts, ports, executors, runtime composition, telemetry names, and test
adapters. The plugin owns launchable service and background entrypoints, CLI behavior, scaffolding,
database schema contribution, Aspire contribution, and stream mirror integration.

## Package Tree

```text
plugins/workers/
  bin/                 process entrypoints consumed by supervisors and Aspire
  contracts/           contract v1 entrypoint
  database/            database schema contribution
  services/            HTTP service process
  src/aspire/          Aspire contribution data
  src/cli/             CLI command model and local backend
  src/public/          manifest composition
  src/scaffolding/     scaffolders and templates
  streams/             stream publication and mirror bridge
  tests/               plugin-specific tests
  worker/              worker and scheduler process classes
```

## Migration Note

The plugin still carries a temporary bridge to legacy workers runtime files until consumer migration
is complete. The bridge is not part of the intended long-term boundary.
