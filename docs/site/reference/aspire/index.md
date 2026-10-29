---
layout: layouts/base.vto
title: "@netscript/aspire"
---

# `@netscript/aspire`

SDK-neutral Aspire diagnostics, config parsing, contribution ports and TypeScript AppHost
generation for NetScript plugin packages. Use it to compose an AppHost from `appsettings.json`, to
write a plugin's Aspire contribution, or to test that contribution in memory.

## Sub-path exports

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/aspire` | `./mod.ts` | [Diagnostic contract](#diagnostics-root-export) (`inspectAspire`). |
| `@netscript/aspire/config` | `./config.ts` | [`appsettings.json` parsing, Zod schemas, and entry interfaces](#config-parsing-netscriptaspireconfig). |
| `@netscript/aspire/schema` | `./schema.ts` | [JSON Schema generation](#schema-generation-netscriptaspireschema) from the Zod config schema. |
| `@netscript/aspire/types` | `./types.ts` | [Inferred config types and known-name extractors](#config-types-netscriptaspiretypes). |
| `@netscript/aspire/constants` | `./constants.ts` | [Config keys, sections, and runtime defaults](#constants-netscriptaspireconstants). |
| `@netscript/aspire/application` | `./src/application/mod.ts` | [AppHost composition, contribution registry, and resolvers](#composition-netscriptaspireapplication). |
| `@netscript/aspire/adapters` | `./src/adapters/mod.ts` | [SDK-neutral TypeScript builder adapter](#adapters-netscriptaspireadapters). |
| `@netscript/aspire/testing` | `./src/testing/mod.ts` | [In-memory builder, contribution base class, and fixtures](#testing-netscriptaspiretesting). |
| `@netscript/aspire/public` | `./src/public/mod.ts` | [Production aggregate](#production-aggregate-netscriptaspirepublic) plus domain contracts and the runtime lifecycle port not published through separate sub-paths. |

## Diagnostics (root export)

The root entrypoint exposes only the diagnostic contract.

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

| Symbol | Kind | Description |
| --- | --- | --- |
| `AppSettings` | type alias | Top-level `appsettings.json` structure. |
| `NetScriptConfig` | type alias | Root NetScript configuration section. |
| `BaseEntry` | interface | Common fields shared by resource entries. |
| `ReferenceEntry` | interface | Reference fields for resources that depend on services or plugins. |
| `ServiceEntry` | type alias | Backend service resource entry. |
| `PluginEntry` | type alias | Plugin service resource entry. |
| `DatabaseEntry` | type alias | Database resource entry. |
| `CacheEntry` | type alias | Cache resource entry. |
| `BackgroundProcessorEntry` | type alias | Background processor resource entry. |
| `AppEntry` | type alias | Frontend, desktop, or task application entry. |
| `ToolEntry` | type alias | Development tool entry. |
| `DefaultsConfig` | interface | Defaults section wrapper. |
| `DenoDefaults` | type alias | Global Deno runtime defaults. |
| `LoggingConfig` | interface | ASP.NET Core logging configuration. |
| `OtelConfig` | type alias | OpenTelemetry endpoint configuration. |
| `ParseOptions` | interface | Options for controlling parser behavior. |
| `ParseResult` | interface | Result of parsing `appsettings.json`. |
| `AspireSchema` | interface | Public parser contract exposed by Aspire schema constants. |
| `AspireSafeParseSuccess` | interface | Successful result from `AspireSchema.safeParse`. |
| `AspireSafeParseFailure` | interface | Failed result from `AspireSchema.safeParse`. |

### Config type aliases

| Symbol | Kind | Description |
| --- | --- | --- |
| `AppType` | type alias | Application entry variants supported by the AppHost config. |
| `CacheEngine` | type alias | Cache engine variants supported by Aspire hosting integrations. |
| `DatabaseEngine` | type alias | Database engine variants supported by Aspire hosting integrations. |
| `ResourceMode` | type alias | Resource provisioning mode for managed resources. |
| `AspireSafeParseResult` | type alias | Result from `AspireSchema.safeParse`. |

### Config Zod schemas

The Zod schema values behind the config contract.

| Symbol | Kind | Description |
| --- | --- | --- |
| `AppSettingsSchema` | const | Top-level `appsettings.json` schema. |
| `NetScriptConfigSchema` | const | Root NetScript configuration schema. |
| `ServiceEntrySchema` | const | Service entry schema. |
| `PluginEntrySchema` | const | Plugin entry schema. |
| `DatabaseEntrySchema` | const | Database entry schema. |
| `CacheEntrySchema` | const | Cache entry schema. |
| `BackgroundProcessorEntrySchema` | const | Background processor entry schema. |
| `AppEntrySchema` | const | Application entry schema. |
| `ToolEntrySchema` | const | Development tool entry schema. |
| `DefaultsSchema` | const | Defaults section schema. |
| `DenoDefaultsSchema` | const | Global Deno runtime defaults schema. |
| `OtelConfigSchema` | const | OpenTelemetry endpoint configuration schema. |
| `AppTypeSchema` | const | Application type schema. |
| `CacheEngineSchema` | const | Cache engine schema. |
| `DatabaseEngineSchema` | const | Database engine schema. |
| `ResourceModeSchema` | const | Resource provisioning mode schema. |

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

In-memory builder, the plugin contribution base class, and deterministic fixtures for testing a
plugin's Aspire composition.

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
| `MemoryAspireReference` | interface | — | Recorded relationship between two in-memory Aspire resources. |
| `AspireResourceKind` | type alias | — | Aspire resource kinds produced by plugin contributions. |

## Production aggregate (`@netscript/aspire/public`)

One import path for the public config, schema, types, constants, application composition, adapters,
diagnostics and testing surfaces, plus the domain errors, contracts and runtime lifecycle port that
have no separate sub-path. Use it when you prefer one import over individual sub-paths; the root
entrypoint stays reserved for diagnostics (`inspectAspire`).

These symbols are published only through `@netscript/aspire/public`:

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `AspireError` | class | `class AspireError extends Error` | Base error consumers can catch when handling an Aspire package failure. |
| `DuplicateContributionError` | class | `class DuplicateContributionError extends AspireError` | Error a consumer meets when `ContributionRegistry` receives a second contribution for the same plugin name. |
| `AspireRuntime` | interface | — | Lifecycle port (`start`, `stop`, and `status`) implemented by adapters that control an Aspire AppHost runtime. |
| `ReferenceSpec` | interface | — | Resource relationship contract carrying the source, target, and whether startup waits for the target. |

## Generated AppHost

The TypeScript AppHost this package generates emits **ephemeral ports** (`0`) for the dashboard,
OTLP and resource-service endpoints, so `aspire start --isolated` (an upstream Aspire CLI flag)
configures randomized ports and isolated user secrets.

> [!NOTE]
> The host ports of container resources are not guaranteed unique across isolated starts without
> explicit port configuration.

The scaffold always pins the `Aspire.Hosting.Browsers` package, and generated frontend **app**
resources always configure `withBrowserLogs()`, forwarding browser console output into the Aspire
dashboard.

### Aspire 13.5 configuration contracts

| Contract | Generated behavior |
| --- | --- |
| Listener-readiness health checks (`addHealthCheck` / `withHealthCheck`) | Backing-infrastructure contracts define credential-free listener-readiness probes: a TCP socket connect for Postgres/MySQL/MSSQL, and a RESP `PING` → `+PONG` exchange for Redis/Garnet over `node:net` with a 2000 ms timeout. Container PostgreSQL also gets a `<name>_auth` [credential check](#credential-readiness-postgresql). |
| Typed resource commands (`CommandOptions.Arguments`) | `<db>-cli` resources define typed command shapes in the generated TypeScript AppHost: `migrate` (with `--timeout <seconds>`), `seed`, and `reset` (guarded by `--confirm true`). |
| MCP tool exposure control (`excludeFromMcp`) | `<db>-cli` helper executables call `excludeFromMcp()`, so they are omitted from the Aspire MCP server's tool surface. |

## Generated Garnet version

The CLI scaffold pins both the `ghcr.io/microsoft/garnet:2.2.1` container and the Docker-less
`garnet-server` dotnet tool to Garnet **2.2.1**. The shared cache-image definition derives its tag
from `SCAFFOLD_VERSIONS.GARNET_TOOL`, and the same default applies in `Container`, `Executable`, and
both branches of `Auto` mode. Explicit `ImageTag` and `ToolVersion` configuration override those
defaults independently.

NetScript registers Garnet through the generic `builder.addContainer(...)` and
`builder.addExecutable(...)` paths. It does not call Aspire's `AddGarnet`, whose default image tag
is **1.0** in `Aspire.Hosting.Garnet 13.5.3`. That package remains in the generated Aspire package
list, but its default does not select NetScript's image.

## Readiness contract

`healthStatus` for backing infrastructure answers one question: **is this resource reachable at the
endpoint its consumers will use?** The listener-readiness probe is a bounded TCP connect (or a RESP
`PING`) to the resource's *published* endpoint, so `Healthy` means "something accepted a connection
there", and `Unhealthy` means "nothing did, within the timeout".

**A container log is not the readiness authority.** A database announcing
`database system is ready to accept connections` is reporting that its own process finished starting,
observed *inside* the container's network namespace. That is a different question, and the two can
disagree legitimately: a published port that is not yet mapped, or that resolves somewhere nothing is
listening, makes the log true while the probe is false. Aspire's DCP binds published ports to the
Docker host's loopback rather than `0.0.0.0`, so a database that is ready in-container can be
unreachable from another namespace while its log says otherwise.

> [!IMPORTANT]
> `Healthy` is not proof of a working resource, and `Unhealthy` is not disproof that the database is
> up: it is proof the database is not reachable where you will connect.

### What to wait on

Wait on the health check, not on log text: `aspire wait <resource>` blocks on the evaluated health
state, and `aspire describe --format Json` exposes `healthReports` per resource. Scraping a container
log for a readiness phrase reports success before the endpoint is usable, which is the failure this
contract prevents. Treat `healthReports: {}` (no check registered) as *unknown*, not healthy.

### Credential readiness (PostgreSQL)

A listener accepts the socket before the server accepts a login, so `<name>_listener` cannot tell a
wrong password from a ready database. For each container PostgreSQL resource the generated helper
registers a second check, `<name>_auth`, beside the listener check. Each
evaluation makes one authenticated `SELECT 1` through the [`pg`](https://node-postgres.com/)
client, bounded at 2000 ms. The scaffold adds `pg` to the AppHost's `package.json`, and
mutation-flow regeneration (`netscript service generate`, database changes, and plugin and service
mutations) adds it to an existing AppHost that lacks it, keeping project-owned entries. Plain
`netscript generate aspire` and `--check` leave this project-owned manifest unchanged; use
`netscript service generate` to repair a legacy AppHost's missing runtime dependencies.

- **Healthy** reads `postgres credentials accepted on <host>:<port>`.
- **Unhealthy** reads `postgres credential check failed: <class> <code> at <host>:<port> after <n> ms`,
  with `data` holding only `class`, `code`, `host`, `port` and `elapsedMs`. The `class` is derived
  from SQLSTATE and socket codes only: `auth` (`28P01` wrong password, `28000` unknown role),
  `database` (`3D000`), `starting` (`57P03`), `server`, `listener`, `timeout` or `client` (no `pg`
  installed).
- **No credential bytes.** The check never reports the password, the role or any server or driver
  message text. It takes the same in-memory value as the resource's secret password parameter,
  so the generated helper contains no literal credential.

Aspire's PostgreSQL integration also attaches its own `<name>_check` (an Npgsql `SELECT 1`), whose
description is the driver's raw message. `<name>_auth` is the classified, credential-free signal to
build on. MySQL and SQL Server have listener readiness only.
