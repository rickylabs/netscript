---
layout: layouts/base.vto
title: "@netscript/aspire"
---

# `@netscript/aspire`

SDK-neutral Aspire diagnostics, config parsing, contribution ports, and TypeScript AppHost
generation for NetScript plugin packages. This page is generated from the package's public
surface with `deno doc` (US-2). For the full index of packages and plugins return to the
[reference overview](/reference/).

The root entrypoint (`@netscript/aspire`) exposes the diagnostic contract only. Composition,
config, schema, type, adapter, and testing APIs live on typed sub-path exports:

- [`@netscript/aspire/config`](#sub-path-exports) — `appsettings.json` parsing, Zod schemas, and entry interfaces.
- [`@netscript/aspire/schema`](#sub-path-exports) — JSON Schema generation from the Zod config schema.
- [`@netscript/aspire/types`](#sub-path-exports) — inferred config types and known-name extractors.
- [`@netscript/aspire/constants`](#sub-path-exports) — config keys, sections, and runtime defaults.
- [`@netscript/aspire/application`](#sub-path-exports) — AppHost composition, the contribution registry, and resolver helpers.
- [`@netscript/aspire/adapters`](#sub-path-exports) — the SDK-neutral TypeScript builder adapter.
- [`@netscript/aspire/testing`](#sub-path-exports) — in-memory builder, contribution base class, and test fixtures.

## Diagnostics (root export)

The root `@netscript/aspire` entrypoint exposes the diagnostic contract.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `inspectAspire` | function | `function inspectAspire(target: string \| readonly InspectableAspireResource[] \| InspectableAspireBuilder): InspectionReport` | Inspect an Aspire target and return a JSON-stable diagnostic report. |
| `InspectableAspireBuilder` | interface | — | Minimal builder shape accepted by the Aspire inspector. |
| `InspectableAspireResource` | interface | — | Minimal resource shape accepted by the Aspire inspector. |
| `InspectionReport` | interface | — | JSON-stable diagnostic report returned by Aspire inspectors. |

## Config parsing (`@netscript/aspire/config`)

Parses and validates `appsettings.json` against the Zod schema.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `parseAppSettings` | function | `async function parseAppSettings(filePath: string, options?: ParseOptions): Promise<ParseResult<NetScriptConfig>>` | Parse an `appsettings.json` file and validate it against the Zod schema. |

### Config interfaces

| Symbol | Description |
| --- | --- |
| `AppSettings` | Top-level `appsettings.json` structure. |
| `NetScriptConfig` | Root NetScript configuration section. |
| `BaseEntry` | Common fields shared by resource entries. |
| `ReferenceEntry` | Reference fields for resources that depend on services or plugins. |
| `ServiceEntry` | Backend service resource entry. |
| `PluginEntry` | Plugin service resource entry. |
| `DatabaseEntry` | Database resource entry. |
| `CacheEntry` | Cache resource entry. |
| `BackgroundProcessorEntry` | Background processor resource entry. |
| `AppEntry` | Frontend, desktop, or task application entry. |
| `ToolEntry` | Development tool entry. |
| `DefaultsConfig` | Defaults section wrapper. |
| `DenoDefaults` | Global Deno runtime defaults. |
| `LoggingConfig` | ASP.NET Core logging configuration. |
| `OtelConfig` | OpenTelemetry endpoint configuration. |
| `ParseOptions` | Options for controlling parser behavior. |
| `ParseResult` | Result of parsing `appsettings.json`. |
| `AspireSchema` | Public parser contract exposed by Aspire schema constants. |
| `AspireSafeParseSuccess` | Successful result from `AspireSchema.safeParse`. |
| `AspireSafeParseFailure` | Failed result from `AspireSchema.safeParse`. |

### Config type aliases

| Symbol | Description |
| --- | --- |
| `AppType` | Application entry variants supported by the AppHost config. |
| `CacheEngine` | Cache engine variants supported by Aspire hosting integrations. |
| `DatabaseEngine` | Database engine variants supported by Aspire hosting integrations. |
| `ResourceMode` | Resource provisioning mode for managed resources. |
| `AspireSafeParseResult` | Result from `AspireSchema.safeParse`. |

### Config Zod schemas

These exported Zod schema values back the config contract above.

| Symbol | Description |
| --- | --- |
| `AppSettingsSchema` | Top-level `appsettings.json` schema. |
| `NetScriptConfigSchema` | Root NetScript configuration schema. |
| `ServiceEntrySchema` | Service entry schema. |
| `PluginEntrySchema` | Plugin entry schema. |
| `DatabaseEntrySchema` | Database entry schema. |
| `CacheEntrySchema` | Cache entry schema. |
| `BackgroundProcessorEntrySchema` | Background processor entry schema. |
| `AppEntrySchema` | Application entry schema. |
| `ToolEntrySchema` | Development tool entry schema. |
| `DefaultsSchema` | Defaults section schema. |
| `DenoDefaultsSchema` | Global Deno runtime defaults schema. |
| `OtelConfigSchema` | OpenTelemetry endpoint configuration schema. |
| `AppTypeSchema` | Application type schema. |
| `CacheEngineSchema` | Cache engine schema. |
| `DatabaseEngineSchema` | Database engine schema. |
| `ResourceModeSchema` | Resource provisioning mode schema. |

## Schema generation (`@netscript/aspire/schema`)

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `generateAppSettingsJsonSchema` | function | `function generateAppSettingsJsonSchema(): Record<string, unknown>` | Generate a JSON Schema (draft-7) from the Zod `AppSettingsSchema`. |

## Config types (`@netscript/aspire/types`)

Inferred config types and helpers that extract known resource names as literal unions from a
config type.

| Symbol | Kind | Description |
| --- | --- | --- |
| `AppSettings` | type alias | Full `appsettings.json` structure. |
| `NetScriptConfig` | type alias | Root `NetScript` configuration section. |
| `ServiceEntry` | type alias | A service resource entry. |
| `PluginEntry` | type alias | A plugin resource entry. |
| `DatabaseEntry` | type alias | A database resource entry. |
| `CacheEntry` | type alias | A cache resource entry. |
| `BackgroundProcessorEntry` | type alias | A background processor entry (worker, saga, or trigger). |
| `AppEntry` | type alias | An application resource entry. |
| `ToolEntry` | type alias | A development tool entry. |
| `DenoDefaults` | type alias | Global Deno runtime defaults. |
| `OtelConfig` | type alias | OpenTelemetry exporter configuration. |
| `AppType` | type alias | Application type variant. |
| `CacheEngine` | type alias | Supported cache engine types. |
| `DatabaseEngine` | type alias | Supported database engine types. |
| `ResourceMode` | type alias | Resource provisioning mode. |
| `ResourceDependencies` | interface | Extracted dependency requirements from a resource entry. |
| `AppEntryOf` | type alias | The typed app entry for a known app name. |
| `ServiceEntryOf` | type alias | The typed service entry for a known service name. |
| `PluginEntryOf` | type alias | The typed plugin entry for a known plugin name. |
| `DatabaseEntryOf` | type alias | The typed database entry for a known database name. |
| `CacheEntryOf` | type alias | The typed cache entry for a known cache name. |
| `BackgroundProcessorEntryOf` | type alias | The typed background processor entry for a known processor name. |
| `KnownApps` | type alias | Extract known app names as a literal union from a config type. |
| `KnownServices` | type alias | Extract known service names as a literal union from a config type. |
| `KnownPlugins` | type alias | Extract known plugin names as a literal union from a config type. |
| `KnownDatabases` | type alias | Extract known database names as a literal union from a config type. |
| `KnownCaches` | type alias | Extract known cache names as a literal union from a config type. |
| `KnownBackgroundProcessors` | type alias | Extract known background processor names as a literal union from a config type. |

## Constants (`@netscript/aspire/constants`)

| Symbol | Kind | Description |
| --- | --- | --- |
| `CONFIG_KEYS` | const | Configuration key constants used in `IConfiguration` binding. |
| `CONFIG_SECTIONS` | const | ASP.NET Core `IConfiguration` section paths for NetScript config sections. |
| `DASHBOARD_ENV_VARS` | const | Aspire dashboard environment variable names. |
| `DEFAULT_PERMISSIONS` | const | Default Deno permission flags applied to all resources. |
| `OTEL_DEFAULTS` | const | OpenTelemetry default values. |
| `OTEL_ENV_VARS` | const | OpenTelemetry environment variable names. |
| `RESOURCE_DEFAULTS` | const | Default values for resource configuration. |

## Composition (`@netscript/aspire/application`)

AppHost composition, the plugin contribution registry, and the resolver helpers that turn config
entries into Aspire resources.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `composeAppHost` | function | `function composeAppHost(options: ComposeAppHostOptions): ComposeAppHostResult` | Compose plugin Aspire contributions into a supplied builder. |
| `ContributionRegistry` | class | — | Registry of Aspire plugin contributions for one AppHost composition. |
| `createPortAllocator` | function | `function createPortAllocator(options: PortAllocationOptions): (key: string, fallback?: number) => number` | Create a deterministic port allocator for plugin resources. |
| `buildOtelEnvVars` | function | `function buildOtelEnvVars(serviceName: string, serviceVersion: string, mode: OtelMode, otlpEndpoint: string): Record<string, string>` | Build OpenTelemetry environment variables for a Deno resource. |
| `buildViteEnvVarName` | function | `function buildViteEnvVarName(resourceName: string, endpointName: string): ViteEnvVarNames` | Generate VITE-prefixed environment variable names for a resource. |
| `extractDependencies` | function | `function extractDependencies(entry): ResourceDependencies` | Extract infrastructure dependency flags from a resource entry. |
| `extractPluginReferences` | function | `function extractPluginReferences(entry): string[]` | Extract plugin references from a resource entry. |
| `extractServiceReferences` | function | `function extractServiceReferences(entry): string[]` | Extract and deduplicate service references from a resource entry. |
| `resolveDataPath` | function | `function resolveDataPath(appHostDir: string, dataPath: string \| undefined, resourceName: string): string` | Resolve the data path for a persistent resource (database, cache). |
| `resolvePermissions` | function | `function resolvePermissions(entryPermissions: readonly string[] \| undefined, defaultPermissions: readonly string[], watchMode: boolean, watchFlag: string): string[]` | Resolve the effective Deno permission flags for a resource. |
| `resolveWorkdir` | function | `function resolveWorkdir(section: string, key: string, explicitWorkdir?: string): string` | Resolve the default working directory for a resource entry. |
| `resolveWorkspacePath` | function | `function resolveWorkspacePath(appHostDir: string, relativePath: string): string` | Resolve a workspace-relative path from the AppHost directory. |

### Composition interfaces and type aliases

| Symbol | Kind | Description |
| --- | --- | --- |
| `AspireBuilder` | interface | Port implemented by adapters that emit Aspire AppHost resources. |
| `AspireResource` | interface | Resource descriptor returned by Aspire builder ports. |
| `ComposeAppHostOptions` | interface | Options for composing plugin Aspire contributions into an AppHost builder. |
| `ComposeAppHostResult` | interface | Result of composing an AppHost from plugin Aspire contributions. |
| `ComposePluginManifest` | interface | Minimal manifest shape consumed by Aspire composition. |
| `ContributionContext` | interface | Context passed to plugin Aspire contributions during AppHost composition. |
| `PortAllocationOptions` | interface | Port allocation options for Aspire composition. |
| `ViteEnvVarNames` | interface | Generated VITE environment variable name pair. |
| `AspireResourceKind` | type alias | Aspire resource kinds produced by plugin contributions. |
| `OtelMode` | type alias | Registration mode determining which OTEL env vars are needed. |

## Adapters (`@netscript/aspire/adapters`)

The SDK-neutral TypeScript builder adapter used to compose an AppHost.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `AspireTypeScriptBuilder` | class | `class AspireTypeScriptBuilder extends MemoryAspireBuilder` | SDK-neutral builder adapter for TypeScript AppHost composition tests. |
| `createPortAllocator` | function | `function createPortAllocator(options: PortAllocationOptions): (key: string, fallback?: number) => number` | Create a deterministic port allocator for plugin resources. |
| `resolveEnvSource` | function | `function resolveEnvSource(source: EnvSource \| string, options: ResolveEnvSourceOptions): string` | Resolve an environment source into a concrete string. |
| `AspireResource` | interface | — | Resource descriptor returned by Aspire builder ports. |
| `PortAllocationOptions` | interface | — | Port allocation options for Aspire composition. |
| `ResolveEnvSourceOptions` | interface | — | Options for resolving plugin environment variable sources. |
| `EnvSource` | type alias | — | Source for an environment variable value in an AppHost composition. |

## Testing (`@netscript/aspire/testing`)

In-memory builder, the plugin contribution base class, and deterministic fixtures for plugin
authors writing Aspire composition tests.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `AspireNSPluginContribution` | class | — | Base class plugins extend to contribute Aspire resources to an AppHost. |
| `MemoryAspireBuilder` | class | `class MemoryAspireBuilder implements AspireBuilder` | In-memory Aspire builder used by tests and examples. |
| `ExampleAspireContribution` | class | `class ExampleAspireContribution extends AspireNSPluginContribution` | Example contribution used by public tests and README snippets. |
| `createContributionContextFixture` | function | `function createContributionContextFixture(overrides: Partial<ContributionContext>): ContributionContext` | Create a deterministic contribution context for Aspire tests. |
| `AspireBuilder` | interface | — | Port implemented by adapters that emit Aspire AppHost resources. |
| `AspireResource` | interface | — | Resource descriptor returned by Aspire builder ports. |
| `ContributionContext` | interface | — | Context passed to plugin Aspire contributions during AppHost composition. |
| `CacheSpec` | interface | — | Cache resource spec consumed by `AspireBuilder`. |
| `ContainerSpec` | interface | — | Container resource spec consumed by `AspireBuilder`. |
| `DatabaseSpec` | interface | — | Database resource spec consumed by `AspireBuilder`. |
| `DenoServiceSpec` | interface | — | Deno service resource spec consumed by `AspireBuilder`. |
| `DenoBackgroundSpec` | interface | — | Deno background process spec consumed by `AspireBuilder`. |
| `HealthCheckSpec` | interface | — | Health check expectation declared by a plugin contribution. |
| `MemoryAspireReference` | interface | — | Recorded relationship between two in-memory Aspire resources. |
| `AspireResourceKind` | type alias | — | Aspire resource kinds produced by plugin contributions. |

## Sub-path exports

The following entrypoints are published alongside the root export. Each is generated from its own
`deno doc` surface and documented in the sections above.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/aspire` | `./mod.ts` | Diagnostic contract (`inspectAspire`). |
| `@netscript/aspire/config` | `./config.ts` | `appsettings.json` parsing, Zod schemas, and entry interfaces. |
| `@netscript/aspire/schema` | `./schema.ts` | JSON Schema generation from the Zod config schema. |
| `@netscript/aspire/types` | `./types.ts` | Inferred config types and known-name extractors. |
| `@netscript/aspire/constants` | `./constants.ts` | Config keys, sections, and runtime defaults. |
| `@netscript/aspire/application` | `./src/application/mod.ts` | AppHost composition, contribution registry, and resolvers. |
| `@netscript/aspire/adapters` | `./src/adapters/mod.ts` | SDK-neutral TypeScript builder adapter. |
| `@netscript/aspire/testing` | `./src/testing/mod.ts` | In-memory builder, contribution base class, and fixtures. |

---

Back to the [reference overview](/reference/).
