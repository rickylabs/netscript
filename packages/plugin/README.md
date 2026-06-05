# @netscript/plugin

Plugin manifest DSL, contribution vocabulary, dependency contracts, CLI contracts, SDK discovery
ports, scaffolding ports, and diagnostics for NetScript plugin packages.

## 1. Package Role

`@netscript/plugin` is the Tier 0 plugin platform package. It is an Arch-4 DSL/builder package:
plugin authors use the builder, and hosts consume the resulting `PluginManifest`.

The package does not depend on runtime infrastructure packages. It is intended to be safe for JSR
publication and reusable by plugin packages, CLI tooling, generated host code, and tests.

## 2. Install

```bash
deno add jsr:@netscript/plugin
```

## 3. Quick Start

```ts
import { definePlugin, inspectPlugin } from '@netscript/plugin';

const plugin = definePlugin('@example/plugin', '0.0.1-alpha.0')
  .withDescription('Example plugin.')
  .withService({
    name: 'example-api',
    entrypoint: 'services/api/main.ts',
  })
  .build();

console.log(inspectPlugin(plugin).summary);
```

`definePlugin(name, version)` is the only authoring shape. Object-literal `definePlugin({...})` and
`PluginDefinition` are not compatibility APIs.

## 4. Manifest Model

A `PluginManifest` describes what a plugin contributes. It has a name, version, metadata, typed
dependencies, contribution groups, and lifecycle hooks. The host decides how those contributions
become files, runtime services, generated registries, or AppHost resources.

Contribution groups are plain data. Runtime execution belongs to host packages and plugin runtime
packages, not to this manifest DSL.

## 5. Contribution Axes

The canonical contribution axes are:

- `services`
- `backgroundProcessors`
- `streamTopics`
- `databaseSchemas`
- `runtimeConfigTopics`
- `contractVersions`
- `e2e`
- `telemetry`
- `migrations`
- `aspire`

There is no `cli` contribution axis. CLI extensions use the `@netscript/plugin/cli` subpath and the
`PluginCli` base contract.

## 6. Dependencies

Plugin dependencies are named aliases to other plugin manifests.

```ts
import { definePlugin } from '@netscript/plugin';

const streams = definePlugin('@netscript/plugin-streams', '0.0.1-alpha.0')
  .withStreamTopics([{ name: 'events', subject: 'events.*' }])
  .build();

const plugin = definePlugin('@example/worker-tools', '0.0.1-alpha.0')
  .withDependencies({ streams })
  .withStreamTopics(({ deps }) => [{
    name: 'worker.events',
    subject: `${deps.streams.contributions.streamTopics?.[0]?.subject ?? 'events'}.worker`,
  }])
  .build();
```

Hosts validate that dependency targets are installed before using dependency-aware contribution
callbacks.

## 7. Public Surface

The root entrypoint exports the authoring API, canonical manifest types, plugin-domain errors,
`PluginContribution`, and diagnostics. Host tooling, CLI integration, SDK discovery, adapters,
testing helpers, and fixtures live on subpaths.

The root barrel is intentionally small. Import implementation-specific contracts from their subpaths
instead of relying on root-surface leakage.

## 8. CLI

Plugin CLIs extend `PluginCli` from the CLI subpath and return mounted commands. Hosts can mount
many plugin CLIs with `mountPluginCli`, then dispatch commands with `runMountedCommand` or
`routeVerb`.

## 9. SDK Discovery

The SDK scaffold includes four ports: `WalkerPort`, `ExtractorPort`, `EmitterPort`, and
`ManifestResolverPort`. Alpha implementations are stubs designed to establish contracts before
deeper source analysis lands.

## 10. Scaffolding And Templates

Scaffolding uses `FileSystemPort`, `TemplatePort`, and `ScaffolderPort`. The alpha skeleton template
generates a named builder manifest export and does not generate legacy flat manifest keys.

Template internals are not part of the root public API. Supervisor-merge work must keep scaffolding
behind a narrow subpath or a CLI-owned adapter.

## 11. Diagnostics And Testing

`PluginRegistry` rejects duplicate plugin names and preserves registration order. `inspectPlugin`
accepts a `PluginManifest`, `PluginRegistry`, or path-like string and returns a JSON-stable report
for doctor commands.

Tests use Deno test APIs and cover CLI contracts, SDK ports, registry behavior, scaffolding, and
README examples.

## 12. Architecture And Stability

`@netscript/plugin` follows the Arch-4 DSL/builder archetype. Public exports are curated; role-named
implementation folders keep config, domain, CLI, SDK, adapters, testing, and diagnostics separate.

This package is `0.0.1-alpha.0`. The alpha surface is focused on builder-only manifest authoring and
stable contracts. Deprecated compatibility layers retained by host-v2 implementation are tracked in
the harness drift ledger and must be removed before the supervisor branch is merged.

## License

MIT
