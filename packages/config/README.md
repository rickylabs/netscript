# @netscript/config

Typed project configuration for NetScript applications.

[![JSR](https://jsr.io/badges/@netscript/config)](https://jsr.io/@netscript/config)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./README.md#license)

## Overview

`@netscript/config` is the public configuration boundary for NetScript projects.

It validates `netscript.config.ts`, exposes environment helpers, discovers Deno workspace members,
and provides small subpath exports for plugin-platform configuration.

The package is intentionally Deno-first. It uses Zod for runtime validation, Web Platform primitives
for loading, and explicit public types so downstream packages can depend on a stable shape.

Config is authored by application developers, read by the CLI, and consumed by framework packages
such as `@netscript/plugin`, `@netscript/aspire`, and `@netscript/telemetry`.

## Quickstart

Create a `netscript.config.ts` file:

```ts
import { defineConfig } from '@netscript/config';

export default defineConfig({
  name: 'orders',
  version: '1.0.0',
  databases: {
    active: 'postgres',
    config: [{ provider: 'postgres', schema: 'database/postgres/schema' }],
  },
  services: {
    api: { port: 3000 },
  },
});
```

Load it at runtime:

```ts
import { initConfig, inspectConfig } from '@netscript/config';

const config = await initConfig();
const report = inspectConfig(config);
console.log(report.summary);
```

## Mental Model

NetScript config has three layers.

```
netscript.config.ts
  -> defineConfig()
  -> NetScriptConfigSchema
  -> validated NetScriptConfig
```

The authored file is application code. The schema is the package-owned contract. The validated
object is what every runtime and generator receives.

Subpaths expose narrower contracts. `@netscript/config/paths` owns scaffold constants.
`@netscript/config/schema/plugins` owns appsettings fragments. `@netscript/config/merge` owns
contribution merging.

## API At A Glance

| Export                  | Purpose                                           |
| ----------------------- | ------------------------------------------------- |
| `defineConfig`          | Validate a literal project config.                |
| `defineConfigAsync`     | Validate a config resolved from mode and command. |
| `loadConfig`            | Load a config file from disk.                     |
| `initConfig`            | Load and cache config for runtime access.         |
| `getConfig`             | Read the cached config.                           |
| `resolveEnv`            | Resolve typed environment variables.              |
| `discoverWorkspace`     | Inspect Deno workspace members.                   |
| `inspectConfig`         | Return a JSON-stable diagnostic report.           |
| `NetScriptConfigSchema` | Root Zod schema.                                  |
| `NetScriptConfig`       | Validated config type.                            |

Subpath exports:

| Subpath                            | Purpose                                       |
| ---------------------------------- | --------------------------------------------- |
| `@netscript/config/paths`          | Scaffold directories, files, and permissions. |
| `@netscript/config/schema/plugins` | Plugin appsettings schema fragments.          |
| `@netscript/config/merge`          | Merge plugin contribution fragments.          |

## Common Recipes

### Define Services

```ts
import { defineConfig } from '@netscript/config';

export default defineConfig({
  name: 'api',
  databases: { active: 'postgres', config: [] },
  services: {
    users: { port: 3001, workdir: 'services/users' },
    billing: { port: 3002, workdir: 'services/billing' },
  },
});
```

### Resolve Env

```ts
import { resolveEnv } from '@netscript/config';

const env = resolveEnv({
  PORT: { type: 'number', default: 3000 },
  DEBUG: { type: 'boolean', default: false },
});
```

### Merge Plugin Contributions

```ts
import { mergePartialConfig } from '@netscript/config/merge';

const next = mergePartialConfig(config, {
  services: { 'workers-api': { port: 8091 } },
});
```

### Use Scaffold Constants

```ts
import { PERMISSIONS, SCAFFOLD_DIRS } from '@netscript/config/paths';

const workerDir = SCAFFOLD_DIRS.WORKERS;
const flags = PERMISSIONS.workerDefault;
```

### Validate Plugin Appsettings

```ts
import { pluginEntrySchema } from '@netscript/config/schema/plugins';

const plugin = pluginEntrySchema.parse({
  Port: 8091,
  InstalledVersion: '0.0.1-alpha.0',
  InstalledFrom: 'jsr:@netscript/plugin-workers',
});
```

## Configuration

The root config requires `name` and `databases`.

`version` defaults to `1.0.0`.

`paths` defaults to the conventional NetScript workspace folders.

`services` and `apps` are records keyed by resource name.

`workers`, `sagas`, and `triggers` remain backward-compatible while the plugin platform migrates
those capabilities into plugin-owned manifests.

`deploy` contains CLI deployment overrides.

`runtimeConfig` records generated schema and operator config paths.

## Testing

Run the package tests with:

```bash
deno test --allow-all packages/config/tests/
```

README examples are mirrored by `tests/_fixtures/readme-examples_test.ts`.

Domain tests cover schema fragments and merge behavior.

Workspace discovery tests use temporary directories and do not depend on a global checkout layout.

## Observability

This package does not emit spans directly.

Callers can use `inspectConfig` to produce diagnostic data for CLIs, logs, and future dashboard
views.

Recommended log field names:

| Field       | Meaning                                  |
| ----------- | ---------------------------------------- |
| `package`   | Always `@netscript/config`.              |
| `target`    | Config file path or inline config label. |
| `services`  | Number of service entries.               |
| `apps`      | Number of app entries.                   |
| `databases` | Number of database entries.              |

## Architecture

This package follows Archetype 2 for the plugin-platform foundation run because it exposes
integration-facing config surfaces used by `@netscript/plugin`.

The long-term doctrine classification remains small-contract oriented.

Source is split into domain schemas, merge application code, diagnostics, paths constants, and a
curated public barrel.

See [docs/architecture.md](./docs/architecture.md).

## Stability & Versioning

Current version: `0.0.1-alpha.0`.

Alpha releases may adjust names before beta, but exported config shapes are kept backward-compatible
when downstream packages already depend on them.

Breaking changes require coordinated updates across the framework workspace.

## Compatibility Matrix

| Runtime   | Status          |
| --------- | --------------- |
| Deno 2.5+ | Supported.      |
| Node.js   | Not a target.   |
| Browser   | Not a target.   |
| JSR       | Publish target. |

## Migration Notes

Prefer the root package exports for stable application code.

Use `@netscript/config/paths` when scaffolding code needs constants without loading the full schema
surface.

Use `@netscript/config/schema/plugins` when a plugin package contributes config fragments without
owning the host merge policy.

## Contributing

Use role-named folders under `src/`.

Keep public exports documented with examples.

Run:

```bash
deno check --unstable-kv packages/config/mod.ts
deno test --allow-all packages/config/tests/
deno publish --dry-run --allow-dirty
```

## License

MIT.
