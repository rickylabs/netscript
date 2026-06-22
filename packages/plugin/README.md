# @netscript/plugin

Plugin manifest DSL, contribution vocabulary, dependency contracts, CLI contracts, SDK discovery ports, and diagnostics for NetScript plugin packages.

## Install

```sh
deno add jsr:@netscript/plugin
```

Focused subpath imports are available for host tooling, CLI integration, SDK discovery, and tests:

```ts
import { PluginRegistry } from '@netscript/plugin/config';
import { PluginCli } from '@netscript/plugin/cli';
```

## Quick example

Author a plugin manifest with the builder, then inspect it for diagnostics:

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

`definePlugin(name, version)` is the only authoring shape; it returns a fluent `PluginBuilder`.
Contribution groups (services, background processors, stream topics, database schemas, and more) are
plain data — hosts decide how those contributions become files, runtime services, or AppHost
resources. Use `.withDependencies({...})` to reference other plugin manifests by alias.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/plugin/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
