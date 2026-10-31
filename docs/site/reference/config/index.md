---
layout: layouts/base.vto
title: "@netscript/config"
---

# `@netscript/config`

Typed NetScript project configuration: schemas, loaders, environment helpers, workspace discovery,
diagnostics and scaffold constants. Define a project config once with `defineConfig` in
`netscript.config.ts`, load it at startup with `initConfig`, and read the validated
`NetScriptConfig` synchronously with `getConfig`.

## Sub-path exports

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/config` | `./mod.ts` | Core surface: [authoring](#authoring), [loading](#loading-and-runtime-cache), [environment](#environment), [workspace discovery](#workspace-discovery), [diagnostics](#diagnostics) and [types](#types). |
| `@netscript/config/merge` | `./src/merge/mod.ts` | [Merge plugin-contributed partial config fragments](#sub-path-config-merge). |
| `@netscript/config/paths` | `./src/paths/mod.ts` | [Scaffold directory, file, and permission constants](#sub-path-config-paths). |
| `@netscript/config/schema/plugins` | `./src/schema/plugins/mod.ts` | [Appsettings plugin-entry validation schemas](#sub-path-config-schema-plugins). |

Schema-only APIs live on sub-paths, so the root surface does not expose Zod internals.

## Authoring

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `defineConfig` | function | `function defineConfig(config: NetScriptConfigInput): NetScriptConfig` | Type-safe configuration definition with validation. |
| `defineConfigAsync` | function | `function defineConfigAsync(configFn): () => Promise<NetScriptConfig>` | Configuration definition for async/environment-based configs. |
| `defineSagas` | function | `function defineSagas(config: SagasConfigInput): SagasConfigInput` | Define a split saga config module. |

## Loading and runtime cache

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `loadConfig` | function | `async function loadConfig(options?: LoadConfigOptions): Promise<NetScriptConfig>` | Load and validate a NetScript configuration file. |
| `initConfig` | function | `async function initConfig(options?: LoadConfigOptions): Promise<NetScriptConfig>` | Initialize and cache the configuration. |
| `getConfig` | function | `function getConfig(): NetScriptConfig` | Get the cached configuration synchronously after initialization. |
| `isConfigLoaded` | function | `function isConfigLoaded(): boolean` | Check whether configuration has been loaded. |
| `clearConfigCache` | function | `function clearConfigCache(): void` | Clear the cached configuration. |

## Environment

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `getEnv` | function | `function getEnv<T extends EnvDef>(name: string, options?: T): ResolvedEnvType<T>` | Get a single environment variable with type coercion. |
| `resolveEnv` | function | `function resolveEnv<T extends Record<string, EnvDef>>(schema: T)` | Resolve environment variables with type coercion and defaults. |
| `hasEnv` | function | `function hasEnv(name: string): boolean` | Check if an environment variable is set. |
| `getMode` | function | `function getMode(): "development" \| "production" \| "test"` | Get the current environment mode. |
| `isDev` | function | `function isDev(): boolean` | Check if running in development mode. |
| `isProd` | function | `function isProd(): boolean` | Check if running in production mode. |
| `isTest` | function | `function isTest(): boolean` | Check if running in test mode. |

## Workspace discovery

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `discoverWorkspace` | function | `async function discoverWorkspace(rootDir?: string): Promise<WorkspaceMap>` | Discover and classify Deno workspace members. |
| `findWorkspaceRoot` | function | `async function findWorkspaceRoot(startDir: string): Promise<string>` | Find the nearest Deno workspace root from a starting directory. |
| `findMember` | function | `function findMember(workspace: WorkspaceMap, memberName: string): WorkspaceMember \| undefined` | Find a workspace member by package name or relative path. |
| `getMemberEntrypoint` | function | `function getMemberEntrypoint(member: WorkspaceMember): string` | Resolve the default entrypoint for a workspace member. |

## Diagnostics

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `inspectConfig` | function | `function inspectConfig(target): InspectionReport` | Inspect a config target and return a JSON-stable diagnostic report. |

## Types

The authoring and validation contract and the per-section configuration shapes.

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
| `DeployTargetBase` | interface | Fields shared by every `deploy.targets.*` deployment target. |
| `WindowsDeployTarget` | interface | Windows Services deployment target (`deploy.targets.windows`). |
| `DockerComposeDeployTarget` | interface | Docker / Compose deployment target (`deploy.targets.docker` and `deploy.targets.compose`). |
| `LinuxDeployTarget` | interface | Linux systemd deployment target (`deploy.targets.linux`). |
| `DenoDeployTarget` | interface | Deno Deploy cloud deployment target (`deploy.targets['deno-deploy']`). |
| `AspireAppHostDeployTarget` | interface | Aspire AppHost cloud deployment target (`deploy.targets.kubernetes`, `deploy.targets['azure-aca']`, etc.). |
| `CloudRunDeployTarget` | interface | Google Cloud Run Docker-image provider target (`deploy.targets['cloud-run']`). |
| `AspireCloudDeployTarget` | type alias | Back-compat alias for the AppHost-backed S10 cloud targets. |
| `WebhookConfig` | interface | Webhook configuration type. |
| `PermissionConfig` | interface | Permission flags for jobs and task execution. |
| `PermissionValue` | type alias | Permission value accepted by Deno-style runtime permission fields. |
| `RuntimeConfigSection` | interface | Runtime schema/config section type. |
| `RuntimeConfigPathEntry` | interface | Runtime schema/config output path entry type. |
| `WorkspaceMap` | interface | Classified snapshot of a Deno workspace. |
| `WorkspaceMember` | interface | Deno workspace member discovered from a member deno.json file. |
| `WorkspaceMemberType` | type alias | Workspace member category inferred from its relative path. |

### Sagas and triggers section types

Validated and authoring-form types for the `sagas` and `triggers` configuration sections.

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

## `@netscript/config/merge` {#sub-path-config-merge}

Folds a plugin-contributed partial config fragment into a validated project config.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `mergePartialConfig` | function | `function mergePartialConfig(base: NetScriptConfig, contribution: PartialConfig): NetScriptConfig` | Merge a plugin-contributed partial config into a validated NetScript config. |

| Symbol | Kind | Description |
| --- | --- | --- |
| `PartialConfig` | interface | Partial NetScript config fragment contributed by a plugin manifest. |
| `AppContributionEntry` | type alias | Application config entry accepted in plugin contribution fragments. |
| `ServiceContributionEntry` | type alias | Service config entry accepted in plugin contribution fragments. |
| `DatabaseEntry` | type alias | Database config entry accepted in plugin contribution fragments. |

This entrypoint also re-exports the shared section types (`NetScriptConfig`, `ServiceConfig`,
`DatabaseConfig`, the saga/trigger config types, and related shapes) listed under [Types](#types).

## `@netscript/config/paths` {#sub-path-config-paths}

Scaffold constants consumed by NetScript generators and CLI commands.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `PERMISSIONS` | const | `const PERMISSIONS: PermissionGroups` | Standard Deno permission flags grouped by intent. |
| `SCAFFOLD_DIRS` | const | `const SCAFFOLD_DIRS: ScaffoldDirs` | Standard scaffold directory names. |
| `SCAFFOLD_FILES` | const | `const SCAFFOLD_FILES: ScaffoldFiles` | Standard scaffold file names. |

| Symbol | Kind | Description |
| --- | --- | --- |
| `PermissionGroups` | interface | Standard Deno permission groups used by generated package commands. |
| `ScaffoldDirs` | interface | Standard scaffold directory names used by NetScript generators. |
| `ScaffoldFiles` | interface | Standard scaffold file names used by NetScript generators. |

## `@netscript/config/schema/plugins` {#sub-path-config-schema-plugins}

Validation schemas for plugin-backed entries written into the generated `appsettings.json`.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `pluginEntrySchema` | const | `const pluginEntrySchema: PluginSettingsSchema<PluginEntry>` | Validates a NetScript.Plugins.<key> appsettings entry. |
| `backgroundProcessorEntrySchema` | const | `const backgroundProcessorEntrySchema: PluginSettingsSchema<BackgroundProcessorEntry>` | Validates a NetScript.BackgroundProcessors.<key> appsettings entry. |
| `installedVersionSchema` | const | `const installedVersionSchema: PluginSettingsSchema<InstalledVersionFields>` | Validates installed plugin version metadata stored on appsettings entries. |

| Symbol | Kind | Description |
| --- | --- | --- |
| `PluginEntry` | interface | Configuration for a plugin-backed HTTP service in appsettings.json. |
| `BackgroundProcessorEntry` | interface | Configuration for a plugin-backed background processor in appsettings.json. |
| `InstalledVersionFields` | interface | Installed plugin version fields stored in appsettings.json. |
| `PluginSettingsSchema` | interface | Minimal public validation contract for plugin appsettings schemas. |
