# @netscript/aspire

> SDK-agnostic configuration parsing, type exports, and helper functions for the Aspire TypeScript
> AppHost.

[![JSR](https://jsr.io/badges/@netscript/aspire)](https://jsr.io/@netscript/aspire)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

## Overview

`@netscript/aspire` is **Layer 1** of the three-layer TypeScript AppHost architecture. It provides
everything needed to parse, validate, and work with Aspire `appsettings.json` configuration —
without ever importing the Aspire SDK.

```
Layer 1: @netscript/aspire  ← this package (JSR, reusable, zero SDK dependency)
   ├── Zod config schemas for appsettings.json (PascalCase keys)
   ├── Type exports with generic resource name inference
   ├── Helper functions (OTEL, VITE, permissions, paths, references)
   └── Constants ported from the C# NuGet

Layer 2: CLI-generated .helpers/  (per-project, imports BOTH this package AND SDK)
   └── registerServices(), registerApps(), registerPlugins(), etc.

Layer 3: Bridge NuGet  (slim [AspireExport] for prebuild lifecycle + external resources)
```

### Why Three Layers?

A single JSR package **cannot** import the generated Aspire TS SDK — the SDK's transitive Node.js
dependencies (`net`, `vscode-jsonrpc`) don't resolve in Deno's type checker for files outside the
SDK's import map scope. This architecture cleanly separates SDK-agnostic logic (reusable) from
SDK-specific glue (generated per-project).

### Design Principle

**Every function in this package takes plain data and returns plain data.** No Aspire SDK types
appear in any signature. The CLI-generated helpers bridge the gap between plain data and real SDK
calls.

## Installation

```bash
deno add jsr:@netscript/aspire
```

## Subpath Exports

| Import Path                   | Contents                                      |
| ----------------------------- | --------------------------------------------- |
| `@netscript/aspire`           | Everything (barrel)                           |
| `@netscript/aspire/config`    | Zod schemas + parser                          |
| `@netscript/aspire/types`     | `z.infer<>` derived types + generic utilities |
| `@netscript/aspire/schema`    | JSON Schema generation via `z.toJSONSchema()` |
| `@netscript/aspire/constants` | OTEL maps, permissions, config keys           |
| `@netscript/aspire/helpers`   | SDK-agnostic helper functions                 |

## Quick Start

### Parse `appsettings.json`

```typescript
import { parseAppSettings } from '@netscript/aspire';

const { config, warnings } = await parseAppSettings('dotnet/AppHost/appsettings.json');

console.log(config.Name); // "my-app"
console.log(config.Version); // "1.0.0"
console.log(Object.keys(config.Services)); // ["users", "products", "orders"]
console.log(config.Databases.postgres.Engine); // "Postgres"

// Cross-reference warnings (non-fatal by default)
if (warnings.length > 0) {
  console.warn('Config warnings:', warnings);
}
```

### Strict Mode

```typescript
// Throws on cross-reference issues instead of returning warnings
const { config } = await parseAppSettings('appsettings.json', { strict: true });
```

### Build OTEL Environment Variables

```typescript
import { buildOtelEnvVars } from '@netscript/aspire';

// For addDenoApp with WithDenoDefaults() — SDK sets 7 vars, only 3 needed from us
const denoAppVars = buildOtelEnvVars('users', '1.0.0', 'denoApp');
// → { OTEL_DENO: "true", OTEL_SERVICE_NAME: "users", OTEL_RESOURCE_ATTRIBUTES: "service.version=1.0.0" }

// For addExecutable — all 10 OTEL vars needed with the configured collector endpoint
const executableVars = buildOtelEnvVars('users', '1.0.0', 'executable', 'http://localhost:4318');
// → { OTEL_DENO: "true", OTEL_EXPORTER_OTLP_ENDPOINT: "http://localhost:4318", ... (10 total) }
```

### Generate VITE Environment Variable Names

```typescript
import { buildViteEnvVarName } from '@netscript/aspire';

const vite = buildViteEnvVarName('orders');
// vite.full      → "VITE_services__orders__http__0"    (isomorphic, mirrors server-side)
// vite.shorthand → "VITE_ORDERS_URL"                   (convenient alias)

const vitePlugin = buildViteEnvVarName('workers-api');
// vitePlugin.full      → "VITE_services__workers-api__http__0"
// vitePlugin.shorthand → "VITE_WORKERS_API_URL"
```

### Resolve Permissions

```typescript
import { DEFAULT_PERMISSIONS, resolvePermissions } from '@netscript/aspire';

// Entry-level overrides replace global defaults
resolvePermissions(['--allow-all'], DEFAULT_PERMISSIONS);
// → ['--allow-all']

// Global defaults + watch mode flag
resolvePermissions(undefined, DEFAULT_PERMISSIONS, true, '--watch-hmr');
// → ['--allow-net', '--allow-env', '--allow-read', '--allow-sys', '--watch-hmr']
```

### Path Resolution

```typescript
import { resolveDataPath, resolveWorkdir, resolveWorkspacePath } from '@netscript/aspire';

// Navigate up 2 levels from AppHost to workspace root, then resolve
resolveWorkspacePath('/project/dotnet/AppHost', 'services/users');
// → '/project/services/users'

// Default workdir from section + key
resolveWorkdir('services', 'users');
// → 'services/users'

// Data path with fallback
resolveDataPath('/project/dotnet/AppHost', 'data/postgres', 'postgres');
// → '/project/data/postgres'

resolveDataPath('/project/dotnet/AppHost', undefined, 'garnet');
// → '/project/.data/garnet'
```

### Generate JSON Schema

```typescript
import { generateAppSettingsJsonSchema } from '@netscript/aspire';

const schema = generateAppSettingsJsonSchema();
await Deno.writeTextFile('appsettings.schema.json', JSON.stringify(schema, null, 2));
// Produces JSON Schema draft-7 with ASP.NET Core schema inheritance via allOf
```

## Generic Type Inference

The package exports generic utility types that enable type-safe resource name access when used with
a narrowed config schema (typically produced by CLI-generated code):

```typescript
import { z } from 'zod';
import { NetScriptConfigSchema, ServiceEntrySchema } from '@netscript/aspire';
import type { KnownServices } from '@netscript/aspire';

// Narrowed schema with literal keys (CLI-generated)
const ProjectConfigSchema = NetScriptConfigSchema.extend({
  Services: z.object({
    users: ServiceEntrySchema,
    products: ServiceEntrySchema,
    orders: ServiceEntrySchema,
  }),
});

type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

// KnownServices<ProjectConfig> → "users" | "products" | "orders"
type MyServices = KnownServices<ProjectConfig>;

// Typed access — no `| undefined`, full autocompletion
const config: ProjectConfig = ProjectConfigSchema.parse(rawConfig);
config.Services.users.Port; // ✅ number
config.Services.typo; // ❌ TS error!
```

### Available Generic Utilities

| Type                           | Extracts                                |
| ------------------------------ | --------------------------------------- |
| `KnownServices<T>`             | Service name literal union              |
| `KnownPlugins<T>`              | Plugin name literal union               |
| `KnownDatabases<T>`            | Database name literal union             |
| `KnownApps<T>`                 | App name literal union                  |
| `KnownBackgroundProcessors<T>` | Background processor name literal union |
| `KnownCaches<T>`               | Cache name literal union                |
| `ServiceEntryOf<T, K>`         | Typed entry for a specific service      |
| `AppEntryOf<T, K>`             | Typed entry for a specific app          |
| `PluginEntryOf<T, K>`          | Typed entry for a specific plugin       |
| `DatabaseEntryOf<T, K>`        | Typed entry for a specific database     |

## Config Schema Structure

The Zod schemas model the full `appsettings.json` with PascalCase keys matching ASP.NET Core's
`IConfiguration` convention:

```
AppSettings
├── $schema (optional)
├── Logging (ASP.NET Core standard)
└── NetScript
    ├── Name (required), Version (default "1.0.0"), AspireProject
    ├── PrimaryDatabase, PrimaryCache
    ├── Otel { HttpEndpoint, Protocol }
    ├── Defaults.Deno { Permissions[], WatchMode }
    ├── Services    { [name]: ServiceEntry }
    ├── Apps        { [name]: AppEntry }
    ├── Plugins     { [name]: PluginEntry }
    ├── BackgroundProcessors { [name]: BackgroundProcessorEntry }
    ├── Databases   { [name]: DatabaseEntry }
    ├── Cache       { [name]: CacheEntry }
    └── Tools       { [name]: ToolEntry }
```

All record-type entries support: `Enabled` (default `true`), `Description`, `Permissions[]`,
`ServiceReferences[]`, `PluginReferences[]`.

### Parser Features

- **Default resolution:** Injects `Workdir` defaults from section + key, merges legacy `DependsOn`
  into `ServiceReferences`, generates `ConcurrencyEnvVar` from key name
- **Cross-reference validation:** Checks `PrimaryDatabase`/`PrimaryCache` against actual keys,
  validates all `ServiceReferences`/`PluginReferences` across all sections
- **Strict mode:** Option to throw on validation issues instead of returning warnings

## Constants

All constants are `as const` frozen objects ported from the C# NuGet:

| Constant              | Source                          | Purpose                                |
| --------------------- | ------------------------------- | -------------------------------------- |
| `OTEL_ENV_VARS`       | `DenoTelemetryDefaults`         | OTEL environment variable names        |
| `OTEL_DEFAULTS`       | `DenoTelemetryDefaults`         | Default values for OTEL configuration  |
| `DASHBOARD_ENV_VARS`  | `ConfigureAspireDashboard`      | Aspire dashboard OTLP env names        |
| `DEFAULT_PERMISSIONS` | `DenoHostingDefaults`           | Default Deno permission flags          |
| `CONFIG_SECTIONS`     | `NetScriptHostingConfiguration` | ASP.NET `IConfiguration` section paths |
| `RESOURCE_DEFAULTS`   | `DenoHostingDefaults`           | Runtime, entrypoint, watch flags       |
| `CONFIG_KEYS`         | `DenoHostingDefaults`           | Configuration key paths                |

## Mental Model

The package is a contract layer, not an AppHost runtime. Plugins describe what they need by
extending `AspireNSPluginContribution`; hosts decide how those resources become real Aspire SDK
calls by implementing `AspireBuilder`.

`composeAppHost` is the composition root. It instantiates each plugin contribution, registers it in
`ContributionRegistry`, and collects the SDK-neutral `AspireResource` descriptors returned by the
builder.

## API

The root export contains the public path for consumers:

- `parseAppSettings` validates `appsettings.json`.
- `composeAppHost` runs plugin Aspire contributions.
- `AspireNSPluginContribution` is the plugin base class.
- `AspireBuilder` is the host adapter port.
- `MemoryAspireBuilder` is the public testing adapter.
- `inspectAspire` returns a JSON-stable diagnostic report.

## Recipes

To register a plugin service, extend `AspireNSPluginContribution`, add a Deno service through the
supplied builder, and return the created resource. The service can then reference host resources
with `builder.reference` or `builder.waitFor`.

To test a plugin contribution, compose it with `MemoryAspireBuilder` and assert the recorded
resources and references. This keeps tests independent of the generated Aspire SDK.

## Configuration

`parseAppSettings` expects ASP.NET-style PascalCase keys because the source file is also consumed by
.NET configuration binding. Defaults are resolved after Zod validation so generated AppHosts receive
stable paths, permissions, and concurrency variable names.

## Testing

The package uses Deno tests only. Unit tests cover pure configuration and helper functions,
application tests cover `composeAppHost`, adapter tests verify the SDK-neutral builder adapter, and
README examples are exercised through `tests/_fixtures/readme-examples_test.ts`.

## Observability

`buildOtelEnvVars` mirrors the C# defaults used by the AppHost bridge. Plugin contributions should
declare resource metadata and environment sources, while the host adapter resolves concrete
environment values at the boundary.

## Architecture Context

This package is part of the NetScript TypeScript AppHost effort that replaces the C# AppHost with a
TypeScript equivalent. The three-layer architecture was chosen after a research phase proved that a
single JSR package cannot import the generated Aspire TS SDK types.

### What Lives Where

| Concern                    | Location                  | Why                                          |
| -------------------------- | ------------------------- | -------------------------------------------- |
| Config schema + parsing    | **This package**          | Generic, no SDK needed                       |
| OTEL env var generation    | **This package**          | String computation                           |
| VITE naming logic          | **This package**          | String computation                           |
| Permission resolution      | **This package**          | Config → `string[]`                          |
| `registerServices()`       | CLI-generated `.helpers/` | Calls `builder.addExecutable()` — needs SDK  |
| `registerInfrastructure()` | CLI-generated `.helpers/` | Calls `builder.addPostgres()` — needs SDK    |
| Prebuild lifecycle         | Bridge NuGet              | `OnBeforeResourceStarted` — no TS equivalent |
| External resource metadata | Bridge NuGet              | `WithInitialState` — no TS equivalent        |

### Related Documents

- Architecture: `.resources/deps-docs/netscript-internals/ts-apphost-helpers-architecture.md`
- Bridge NuGet: `.resources/deps-docs/netscript-internals/ts-apphost-bridge-nuget.md`
- Plan: `.llm/prompts/cli-scaffolding/plan-4-ts-apphost-three-layer.md`

## Known Limitations

1. **No runtime SDK interaction** — this package cannot register resources, create endpoints, or
   call SDK methods. That's by design.
2. **Parser reads files** — `parseAppSettings()` uses `Deno.readTextFile()`, requiring
   `--allow-read` permission.
3. **Path separators** — `resolveWorkdir()` uses OS-native separators via `@std/path`. On Windows,
   paths contain `\`.
4. **JSON Schema generation** — `z.toJSONSchema()` (Zod v4) output may differ slightly from the
   hand-written schema. Both validate the same config correctly.

## Stability

This package is `0.0.1-alpha.0`. Public names are intended to stabilize during the alpha cadence,
but generated AppHost adapters may still evolve as Aspire's TypeScript SDK matures.

## Compatibility

The package targets Deno and JSR. It intentionally avoids Node-only Aspire SDK dependencies so
downstream packages can type-check without a generated AppHost import map.

## Development

```bash
# Type check
deno check packages/aspire/mod.ts

# Run tests
deno test --allow-all packages/aspire/tests/

# Lint
deno lint packages/aspire/

# Format
deno fmt packages/aspire/

# Doc lint
deno doc --lint packages/aspire/mod.ts

# JSR dry run
deno publish --dry-run --allow-dirty
```

## License

MIT
