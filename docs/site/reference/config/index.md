---
layout: layouts/base.vto
title: "@netscript/config"
---

# `@netscript/config`

Typed NetScript project configuration: schemas, loaders, environment helpers, workspace discovery, diagnostics, and scaffold constants. This page is generated from the package public surface with `deno doc` (US-2). For the full index of packages and plugins return to the [reference overview](/reference/).

The root entrypoint (`@netscript/config`) exposes the authoring, loading, environment, workspace, and diagnostic contract. The usual path is to define a project config once with `defineConfig` in `netscript.config.ts`, load it at process startup with `initConfig`, and read the validated `NetScriptConfig` synchronously with `getConfig`. Schema-only APIs live on sub-paths so the public root surface does not leak Zod internals:

- [`@netscript/config/merge`](#sub-path-config-merge) merges plugin-contributed partial config fragments.
- [`@netscript/config/paths`](#sub-path-config-paths) exposes scaffold directory, file, and permission constants.
- [`@netscript/config/schema/plugins`](#sub-path-config-schema-plugins) exposes appsettings plugin-entry validation schemas.

## Authoring

| Symbol | Signature | Description |
| --- | --- | --- |
| `defineConfig` | `function defineConfig(config: NetScriptConfigInput): NetScriptConfig` | Type-safe configuration definition with validation. |
| `defineConfigAsync` | `function defineConfigAsync(configFn): () => Promise<NetScriptConfig>` | Configuration definition for async/environment-based configs. |
| `defineSagas` | `function defineSagas(config: SagasConfigInput): SagasConfigInput` | Define a split saga config module. |

## Loading and runtime cache

| Symbol | Signature | Description |
| --- | --- | --- |
| `loadConfig` | `async function loadConfig(options?: LoadConfigOptions): Promise<NetScriptConfig>` | Load and validate a NetScript configuration file. |
| `initConfig` | `async function initConfig(options?: LoadConfigOptions): Promise<NetScriptConfig>` | Initialize and cache the configuration. |
| `getConfig` | `function getConfig(): NetScriptConfig` | Get the cached configuration synchronously after initialization. |
| `isConfigLoaded` | `function isConfigLoaded(): boolean` | Check whether configuration has been loaded. |
| `clearConfigCache` | `function clearConfigCache(): void` | Clear the cached configuration. |

## Environment

| Symbol | Signature | Description |
| --- | --- | --- |
| `getEnv` | `function getEnv<T extends EnvDef>(name: string, options?: T): ResolvedEnvType<T>` | Get a single environment variable with type coercion. |
| `resolveEnv` | `function resolveEnv<T extends Record<string, EnvDef>>(schema: T)` | Resolve environment variables with type coercion and defaults. |
| `hasEnv` | `function hasEnv(name: string): boolean` | Check if an environment variable is set. |
| `getMode` | `function getMode(): "development" \| "production" \| "test"` | Get the current environment mode. |
| `isDev` | `function isDev(): boolean` | Check if running in development mode. |
| `isProd` | `function isProd(): boolean` | Check if running in production mode. |
| `isTest` | `function isTest(): boolean` | Check if running in test mode. |

## Workspace discovery

| Symbol | Signature | Description |
| --- | --- | --- |
| `discoverWorkspace` | `async function discoverWorkspace(rootDir?: string): Promise<WorkspaceMap>` | Discover and classify Deno workspace members. |
| `findWorkspaceRoot` | `async function findWorkspaceRoot(startDir: string): Promise<string>` | Find the nearest Deno workspace root from a starting directory. |
| `findMember` | `function findMember(workspace: WorkspaceMap, memberName: string): WorkspaceMember \| undefined` | Find a workspace member by package name or relative path. |
| `getMemberEntrypoint` | `function getMemberEntrypoint(member: WorkspaceMember): string` | Resolve the default entrypoint for a workspace member. |

## Diagnostics

| Symbol | Signature | Description |
| --- | --- | --- |
| `inspectConfig` | `function inspectConfig(target): InspectionReport` | Inspect a config target and return a JSON-stable diagnostic report. |

## Types

Core authoring/validation contract and per-section configuration shapes exported from the root.

| Symbol | Kind | Description |
| --- | --- | --- |
| `NetScriptConfig` | interface | Fully validated NetScript configuration. |
| `NetScriptConfigInput` | interface | Authoring form accepted by `defineConfig` and `loadConfig`. |
| `ConfigEnv` | interface | Environment context provided to async config functions. |
| `LoadConfigOptions` | interface | Options for loading configuration files. |
| `InspectionReport` | interface | JSON-stable diagnostic report returned by config inspectors. |
| `EnvDef` | interface | Environment variable definition for `resolveEnv`. |
| `ResolvedEnvType` | type alias | Resolved environment variable type based on an `EnvDef`. |
| `ServiceConfig` | interface | Service configuration definition. |
| `AppConfig` | interface | Frontend application configuration definition. |
| `DatabaseConfig` | interface | Database configuration definition. |
| `DatabasesConfig` | interface | Database section with optional active provider selector. |
| `DatabaseProvider` | type alias | Database provider accepted by project configuration. |
| `GatewayConfig` | interface | Gateway configuration section. |
| `LoggingConfig` | interface | Logging configuration used by runtime and CLI entrypoints. |
| `PathsConfig` | interface | Workspace-aware path conventions used by CLI and generators. |
| `SdkConfig` | interface | SDK generation configuration section. |
| `AspireConfig` | interface | Aspire orchestration settings for generated AppHost projects. |
| `DeployConfig` | interface | Top-level deployment configuration type. |
| `WindowsDeployConfig` | interface | Windows-specific deployment configuration type. |
| `WebhookConfig` | interface | Webhook configuration type. |
| `PermissionConfig` | interface | Permission flags for jobs and task execution. |
| `PermissionValue` | type alias | Permission value accepted by Deno-style runtime permission fields. |
| `RuntimeConfigSection` | interface | Runtime schema/config section type. |
| `RuntimeConfigPathEntry` | interface | Runtime schema/config output path entry type. |
| `WorkspaceMap` | interface | Classified snapshot of a Deno workspace. |
| `WorkspaceMember` | interface | Deno workspace member discovered from a member deno.json file. |
| `WorkspaceMemberType` | type alias | Workspace member category inferred from its relative path. |

### Sagas and triggers section types

The `sagas` and `triggers` configuration sections have dedicated validated and authoring-form types exported from the root.

| Symbol | Kind | Description |
| --- | --- | --- |
| `SagasConfig` | interface | Sagas configuration section. |
| `SagasConfigInput` | interface | Authoring form for split saga config files. |
| `SagaGroup` | interface | Saga group configuration for a topic. |
| `SagaGroupInput` | interface | Authoring form for a saga group. |
| `SagaDefinition` | interface | Saga definition configuration. |
| `SagaDefinitionInput` | interface | Authoring form for a saga definition. |
| `SagaRetryConfig` | interface | Saga retry configuration. |
| `SagaTimeoutConfig` | interface | Saga timeout configuration. |
| `SagaScalingConfig` | interface | Per-topic saga scaling configuration. |
| `SagaRetentionConfig` | interface | Per-topic saga retention configuration. |
| `SagaStoreProvider` | type alias | Saga store backend provider selector. |
| `SagaTransportProvider` | type alias | Saga transport backend provider selector. |
| `TriggersConfig` | interface | Triggers configuration section. |
| `TriggersConfigInput` | interface | Authoring form for trigger config. |
| `TriggerGroup` | interface | Trigger group type. |
| `TriggerGroupInput` | type alias | Authoring form for a trigger group. |
| `TriggerDefinitionConfig` | interface | Trigger definition config type. |
| `TriggerDefinitionConfigInput` | type alias | Authoring form for a trigger definition. |
| `TriggerScalingConfig` | interface | Trigger group scaling configuration. |
| `TriggerRetentionConfig` | interface | Trigger group retention configuration. |

## Sub-path exports

The following entrypoints are published alongside the root export.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/config` | `./mod.ts` | Core configuration surface (documented above). |
| `@netscript/config/merge` | `./src/merge/mod.ts` | Merge plugin-contributed partial config fragments. |
| `@netscript/config/paths` | `./src/paths/mod.ts` | Scaffold directory, file, and permission constants. |
| `@netscript/config/schema/plugins` | `./src/schema/plugins/mod.ts` | Appsettings plugin-entry validation schemas. |

<h3 id="sub-path-config-merge"><code>@netscript/config/merge</code></h3>

Folds a plugin-contributed partial config fragment into an already-validated project config.

| Symbol | Signature | Description |
| --- | --- | --- |
| `mergePartialConfig` | `function mergePartialConfig(base: NetScriptConfig, contribution: PartialConfig): NetScriptConfig` | Merge a plugin-contributed partial config into a validated NetScript config. |

| Symbol | Kind | Description |
| --- | --- | --- |
| `PartialConfig` | interface | Partial NetScript config fragment contributed by a plugin manifest. |
| `AppContributionEntry` | type alias | Application config entry accepted in plugin contribution fragments. |
| `ServiceContributionEntry` | type alias | Service config entry accepted in plugin contribution fragments. |
| `DatabaseEntry` | type alias | Database config entry accepted in plugin contribution fragments. |

This entrypoint also re-exports the shared section types (`NetScriptConfig`, `ServiceConfig`, `DatabaseConfig`, the saga/trigger config types, and related shapes) documented under the root [Types](#types) section.

<h3 id="sub-path-config-paths"><code>@netscript/config/paths</code></h3>

Standard scaffold constants consumed by NetScript generators and CLI commands.

| Symbol | Signature | Description |
| --- | --- | --- |
| `PERMISSIONS` | `const PERMISSIONS: PermissionGroups` | Standard Deno permission flags grouped by intent. |
| `SCAFFOLD_DIRS` | `const SCAFFOLD_DIRS: ScaffoldDirs` | Standard scaffold directory names. |
| `SCAFFOLD_FILES` | `const SCAFFOLD_FILES: ScaffoldFiles` | Standard scaffold file names. |

| Symbol | Kind | Description |
| --- | --- | --- |
| `PermissionGroups` | interface | Standard Deno permission groups used by generated package commands. |
| `ScaffoldDirs` | interface | Standard scaffold directory names used by NetScript generators. |
| `ScaffoldFiles` | interface | Standard scaffold file names used by NetScript generators. |

<h3 id="sub-path-config-schema-plugins"><code>@netscript/config/schema/plugins</code></h3>

Validation schemas for plugin-backed entries written into generated appsettings.json.

| Symbol | Signature | Description |
| --- | --- | --- |
| `pluginEntrySchema` | `const pluginEntrySchema: PluginSettingsSchema<PluginEntry>` | Validates a NetScript.Plugins.<key> appsettings entry. |
| `backgroundProcessorEntrySchema` | `const backgroundProcessorEntrySchema: PluginSettingsSchema<BackgroundProcessorEntry>` | Validates a NetScript.BackgroundProcessors.<key> appsettings entry. |
| `installedVersionSchema` | `const installedVersionSchema: PluginSettingsSchema<InstalledVersionFields>` | Validates installed plugin version metadata stored on appsettings entries. |

| Symbol | Kind | Description |
| --- | --- | --- |
| `PluginEntry` | interface | Configuration for a plugin-backed HTTP service in appsettings.json. |
| `BackgroundProcessorEntry` | interface | Configuration for a plugin-backed background processor in appsettings.json. |
| `InstalledVersionFields` | interface | Installed plugin version fields stored in appsettings.json. |
| `PluginSettingsSchema` | interface | Minimal public validation contract for plugin appsettings schemas. |

---

Back to the [reference overview](/reference/).
