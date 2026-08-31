---
layout: layouts/base.vto
title: "@netscript/plugin"
---

# `@netscript/plugin`

Plugin manifest, validation, discovery, and host-context contracts for NetScript. This page is
written against the package's public surface reported by `deno doc`. For the full index of
packages and plugins return to the [reference overview](/reference/).

The root entrypoint (`@netscript/plugin`) is the plugin authoring contract: the
`definePlugin` builder DSL, the manifest and contribution types, the plugin error classes,
the contribution base class, and the `inspectPlugin` diagnostic. Host tooling, CLI
integration, SDK discovery, abstract contribution bases, runtime loaders, testing fixtures,
and template assets live on the sub-path exports listed at the end of this page.

## Plugin definition

| Symbol | Signature | Description |
| --- | --- | --- |
| `definePlugin` | `function definePlugin<TName, TVersion>(name: TName, version: TVersion): PluginBuilder` | Start a new plugin manifest builder chain. |
| `PluginBuilder` | `class PluginBuilder` | Fluent builder for assembling plugin manifests. |
| `PluginBuilderState` | `interface PluginBuilderState` | Immutable state accumulated by the plugin builder chain. |
| `PLUGIN_TYPES` | `variable PLUGIN_TYPES` | Supported plugin categories. |

## Diagnostics

| Symbol | Signature | Description |
| --- | --- | --- |
| `inspectPlugin` | `function inspectPlugin(target): InspectionReport` | Inspect a plugin manifest, registry, or path-like target. |
| `InspectionReport` | `interface InspectionReport` | JSON-stable diagnostic report returned by plugin inspectors. |
| `InspectablePluginManifest` | `interface InspectablePluginManifest` | Minimal plugin manifest shape accepted by the plugin inspector. |
| `InspectablePluginRegistry` | `interface InspectablePluginRegistry` | Minimal registry shape accepted by the plugin inspector. |

## Errors

| Symbol | Kind | Description |
| --- | --- | --- |
| `PluginError` | class | Base error for plugin package failures. |
| `PluginValidationError` | class | Error thrown when a plugin definition is invalid. |
| `DuplicatePluginError` | class | Error thrown when a plugin name is registered more than once. |

## Contributions

| Symbol | Kind | Description |
| --- | --- | --- |
| `PluginContribution` | class | Base class for plugin contribution extension axes. |
| `ContributionAxis` | type alias | Supported plugin contribution axes. |
| `ContributionInput` | type alias | Contribution value or callback resolved by the plugin builder. |
| `PluginContributions` | interface | Contribution groups supported by plugin manifests. |
| `BackgroundProcessorContribution` | interface | Background processor contributed by a plugin. |
| `ContractVersionContribution` | interface | Contract version contributed by a plugin. |
| `DbSchemaContribution` | interface | Database schema file contributed by a plugin. |
| `E2eContribution` | interface | End-to-end test contribution. |
| `MigrationContribution` | interface | Data or schema migration contribution. |
| `RuntimeConfigTopicContribution` | interface | Runtime config topic contributed by a plugin. |
| `ServiceContribution` | interface | Service contributed by a plugin. |
| `StreamTopicContribution` | interface | Stream topic contributed by a plugin. |
| `TelemetryContribution` | interface | Telemetry instrumentation contribution. |

## Manifest types

| Symbol | Kind | Description |
| --- | --- | --- |
| `PluginManifest` | interface | Plugin manifest consumed by NetScript hosts and tooling. |
| `PluginManifestParser` | interface | Minimal parser shape for manifest validators exposed by this package. |
| `PluginMetadata` | type alias | Metadata attached to plugin manifests. |
| `PluginMetadataValue` | type alias | Runtime-safe metadata values. |
| `PluginType` | type alias | Supported plugin categories. |
| `PluginDependencies` | type alias | Typed plugin dependency record keyed by caller-chosen aliases. |
| `DependencyContext` | type alias | Dependency context supplied to contribution callback inputs. |

## Lifecycle and context

| Symbol | Kind | Description |
| --- | --- | --- |
| `PluginLifecycleHooks` | interface | Lifecycle hooks supported by plugin definitions. |
| `PluginContext` | interface | Context supplied to plugin lifecycle hooks. |
| `PluginLogger` | interface | Logger shape supplied to plugin lifecycle hooks. |

## Sub-path exports

The following entrypoints are published alongside the root export. The tables below summarize each
sub-path's own `deno doc` surface. Symbols that one sub-path re-exports from another are called out
instead of described twice.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/plugin` | `./mod.ts` | Plugin authoring contract (documented above). |
| `@netscript/plugin/config` | `./src/config/mod.ts` | Builder, manifest schema, and contribution type contracts. |
| `@netscript/plugin/abstracts` | `./src/abstracts/mod.ts` | Abstract contribution base classes per axis. |
| `@netscript/plugin/adapter` | `./src/adapter/mod.ts` | Local host command adapters. |
| `@netscript/plugin/cli` | `./src/cli/mod.ts` | Plugin CLI base classes, command mounting, and doctor reports. |
| `@netscript/plugin/sdk` | `./src/sdk/mod.ts` | Discovery ports, alpha adapters, and runtime host stubs. |
| `@netscript/plugin/loader` | `./loader.ts` | Host-side plugin service bootstrap helpers. |
| `@netscript/plugin/protocol` | `./src/protocol/mod.ts` | Plugin manifest schemas and installer protocol definitions. |
| `@netscript/plugin/scaffold` | `./src/scaffold/mod.ts` | Template generators and registry emitters. |
| `@netscript/plugin/testing` | `./src/testing/mod.ts` | In-memory adapters, fixtures, and the CLI contract harness. |
| `@netscript/plugin/templates` | `./src/templates/mod.ts` | Plugin skeleton template asset paths. |
| `@netscript/plugin/contract-base` | `./src/contract-base/mod.ts` | Standard plugin capability checks. |
| `@netscript/plugin/service` | `./src/service/mod.ts` | Out-of-process plugin service binders. |

### `@netscript/plugin/config`

| Symbol | Signature | Description |
| --- | --- | --- |
| `definePlugin` | `function definePlugin<TName, TVersion>(name, version): PluginBuilder` | Start a new plugin manifest builder chain. |
| `mergeContributions` | `function mergeContributions(base, overrides): PluginContributions` | Merge plugin contribution groups without mutating inputs. |
| `isContributionAxis` | `function isContributionAxis(value: string): boolean` | Check whether a value is a supported contribution axis. |
| `isReservedPluginName` | `function isReservedPluginName(name: string): boolean` | Return true when a plugin name is reserved by NetScript. |
| `PluginManifestSchema` | `variable PluginManifestSchema` | Zod schema for plugin manifests. |
| `CONTRIBUTION_AXES` | `variable CONTRIBUTION_AXES` | Supported plugin contribution axes. |
| `PLUGIN_TYPES` | `variable PLUGIN_TYPES` | Supported plugin categories. |

This entrypoint also re-exports `PluginBuilder`, `ContributionInput`, `DependencyContext`,
`PluginBuilderState`, `BackgroundProcessorContribution`, `ContractVersionContribution`,
`DbSchemaContribution`, `E2eContribution`, `MigrationContribution`, `PluginContributions`,
`PluginDependencies`, `PluginLifecycleHooks`, `ContributionAxis`, `PluginContext`, `PluginLogger`,
`PluginType`, `PluginManifest`, `PluginMetadata`, `PluginMetadataValue`, `PluginManifestParser`,
`RuntimeConfigTopicContribution`, `ServiceContribution`, `StreamTopicContribution`, and
`TelemetryContribution`, documented in the root sections above.

### `@netscript/plugin/abstracts`

| Symbol | Kind | Description |
| --- | --- | --- |
| `PluginContribution` | class | Base class for plugin contribution extension axes. |
| `PluginAspireContribution` | class | Base class for Aspire contribution implementations. |
| `PluginBackgroundProcessorContribution` | class | Base class for background processor contribution implementations. |
| `PluginContractVersionContribution` | class | Base class for contract version contribution implementations. |
| `PluginDbSchemaContribution` | class | Base class for database schema contribution implementations. |
| `PluginE2eContribution` | class | Base class for end-to-end contribution implementations. |
| `PluginMigrationContribution` | class | Base class for migration contribution implementations. |
| `PluginRuntimeConfigTopicContribution` | class | Base class for runtime config topic contribution implementations. |
| `PluginServiceContribution` | class | Base class for service contribution implementations. |
| `PluginStreamTopicContribution` | class | Base class for stream topic contribution implementations. |
| `PluginTelemetryContribution` | class | Base class for telemetry contribution implementations. |
| `PluginPayloadSchema` | interface | Minimal Standard Schema-compatible shape accepted by plugin contribution contracts. |
| `PluginSchemaIssue` | interface | Validation issue reported by package-owned schema contracts. |
| `PluginSchemaResult` | type alias | Validation result returned by package-owned schema contracts. |
| `ContributionAxis` | type alias | Supported plugin contribution axes. |

### `@netscript/plugin/adapter`

| Symbol | Kind | Description |
| --- | --- | --- |
| `DoctorCheckSpec` | interface | Extra doctor check supplied by a plugin seam. |
| `DoctorSpec` | interface | Seam data consumed by the mandatory doctor algorithm. |
| `InfoSpec` | interface | Static capability summary returned by the mandatory info command. |
| `InstallSpec` | interface | Seam data consumed by the mandatory install algorithm. |
| `InstallStarterResource` | interface | Starter resource emitted by the mandatory install command. |
| `InstallStarterSamplesPolicy` | type alias | Behavior for an install starter when the host excludes samples. |
| `NetScriptPlugin` | interface | Plugin adapter contract consumed by core command logic. |
| `PluginAdapter` | interface | Adapter object produced by the plugin adapter factory. |
| `PluginCliEntrypoint` | type alias | CLI entrypoint produced by `createPluginAdapter(plugin).toCli()`. |
| `PluginCommandConfig` | type alias | Readonly command configuration supplied by the host. |
| `PluginCommandContext` | interface | Context shared by adapter command algorithms. |
| `PluginCommandSpec` | interface | Optional plugin-owned command handler. |
| `PluginCommandValue` | type alias | Primitive value accepted in plugin command configuration. |
| `PluginResource` | interface | Optional plugin-owned resource command. |
| `RemoveSpec` | interface | Seam data consumed by the mandatory remove algorithm. |
| `UpdateSpec` | interface | Seam data consumed by the mandatory update algorithm. |
| `createDenoFileSystem` | function | Create the default Deno-backed file-system port for adapter commands. |
| `DEFAULT_PLUGIN_HEALTH_ENDPOINT` | constant | Default health endpoint used by plugin doctor commands. |
| `DEFAULT_PLUGIN_WORKSPACE_ROOT` | constant | Default workspace root used when no explicit root is supplied. |
| `resolveWorkspacePath` | function | Resolve a workspace-relative path against a workspace root. |
| `createPluginAdapter` | function | Create the core adapter for a plugin contract object. |
| `RunInstallCommandOptions` | interface | Input consumed by the mandatory install command. |
| `collectInstallArtifacts` | function | Emit starter artifacts from the plugin's install seams. |
| `createInstallScaffoldEntrypoint` | function | Create a scaffolder protocol entrypoint from the install command. |
| `runInstallCommand` | function | Run the core-owned plugin install algorithm. |
| `RunDoctorCommandOptions` | interface | Input consumed by the mandatory doctor command. |
| `runDoctorCommand` | function | Run the core-owned plugin doctor algorithm. |
| `PluginInfoReport` | interface | Structured report returned by the mandatory info command. |
| `RunInfoCommandOptions` | interface | Input consumed by the mandatory info command. |
| `runInfoCommand` | function | Run the core-owned plugin info algorithm. |
| `RunUpdateCommandOptions` | interface | Input consumed by the mandatory update command. |
| `runUpdateCommand` | function | Run the core-owned plugin update algorithm. |
| `RunRemoveCommandOptions` | interface | Input consumed by the mandatory remove command. |
| `runRemoveCommand` | function | Run the core-owned plugin remove algorithm. |
| `RunPluginCliCommandOptions` | interface | Input consumed by the plugin CLI runner. |
| `runPluginCliCommand` | function | Route a plugin CLI verb to mandatory logic or a plugin-owned handler. |
| `runPluginScaffoldCli` | function | Run a plugin scaffold entrypoint from the host CLI subprocess protocol. |

This entrypoint also re-exports the root and CLI symbols `DoctorCheck`, `DoctorReport`,
`PluginCliArgs`, `PluginCliCommand`, `PluginCliResult`, `PluginLogger`, and `FileSystemPort`; the
protocol symbols `PluginScaffoldEntrypoint`, `ScaffolderContext`, and `ScaffoldResult`; and the
scaffold symbols `ItemScaffolder`, `ScaffoldArtifact`, `ScaffoldArtifactBody`, `artifactText`,
`textArtifact`, `StubSource`, `TokenValues`, `defineStub`, and `substituteTokens`. They are
documented in their owning sections below.

### `@netscript/plugin/cli`

| Symbol | Signature | Description |
| --- | --- | --- |
| `PluginCli` | `class PluginCli` | Abstract base class for plugin-owned CLI command groups. |
| `PluginRuntimeConfigCli` | `class PluginRuntimeConfigCli` | Abstract base for plugin runtime configuration commands. |
| `mountPluginCli` | `function mountPluginCli(clis)` | Mount plugin CLI command groups into a flat command list. |
| `runMountedCommand` | `async function runMountedCommand(commands, args: PluginCliArgs): Promise` | Run a mounted command list without depending on Cliffy at package level. |
| `routeVerb` | `async function routeVerb(commands, args: PluginCliArgs): Promise` | Route a command by verb name. |
| `formatPluginHelp` | `function formatPluginHelp(commands): string` | Format command help text for a mounted plugin CLI. |
| `isDoctorReportPassing` | `function isDoctorReportPassing(report: DoctorReport): boolean` | Return true when every doctor check is passing. |
| `PluginCliArgs` | `interface PluginCliArgs` | Command arguments passed to plugin CLI handlers. |
| `PluginCliCommand` | `interface PluginCliCommand` | A mounted CLI command handler. |
| `PluginCliResult` | `interface PluginCliResult` | Result returned by plugin CLI handlers. |
| `DoctorCheck` | `interface DoctorCheck` | Diagnostic entry produced by plugin doctor commands. |
| `DoctorReport` | `interface DoctorReport` | Aggregate doctor report for a plugin CLI. |
| `LocalProjectFiles` | class | Deno-backed project file adapter for local plugin CLI execution. |
| `resolveProjectRoot` | function | Resolve a URL or path to a local project root. |
| `ProjectFileEntry` | interface | File entry discovered by a plugin CLI filesystem scan. |
| `ProjectFiles` | interface | Project file operations used by plugin CLI commands. |
| `renderRegistryModule` | function | Render a static-registry module from discovered items and plugin specifics. |
| `toRegistryImportSpecifier` | function | Resolve an item's import specifier relative to a generated registry. |
| `RegistryEmitItem` | interface | Discovered registry item with its project-relative source path. |
| `RegistryModuleSpec` | interface | Plugin-supplied details used to render a registry module. |
| `normalizePluginArgv` | function | Normalize raw argv tokens into positional values and simple long flags. |
| `parsePluginCliArgs` | function | Parse plugin command argv into the shared `PluginCliArgs` contract. |
| `NormalizedPluginArgv` | interface | Normalized argv tokens after the caller removes its runtime wrapper. |
| `applyScaffoldPlan` | function | Plan scaffold files and persist them only for a real run. |
| `ScaffoldPlanResult` | interface | Result of planning or applying a plugin-owned scaffold operation. |
| `createBaseMetaCommands` | function | Create the shared `status`, `health`, and `info` command set. |
| `PluginBaseMeta` | interface | Data returned by the shared plugin metadata commands. |
| `findGeneratedProjectRoot` | function | Find a project root through a project file adapter. |
| `loadGeneratedProjectRegistry` | function | Load and validate a generated project registry export. |
| `DefinitionGuard` | type alias | Runtime guard for a generated definition value. |
| `GeneratedProjectRegistryOptions` | interface | Options for loading a generated registry from a project. |

### `@netscript/plugin/sdk`

| Symbol | Signature | Description |
| --- | --- | --- |
| `runWalkerPipeline` | `async function runWalkerPipeline(options: RunWalkerPipelineOptions): Promise` | Run the plugin SDK discovery pipeline. |
| `startWalker` | `function startWalker(root: string): Promise` | Start a one-shot SDK walker with default alpha adapters. |
| `startWatcher` | `function startWatcher(): WatcherHandle` | Start a no-op alpha watcher for plugin SDK discovery. |
| `createSourceGraph` | `function createSourceGraph(files, contributions): SourceGraph` | Create a source graph snapshot from walked files and extracted contributions. |
| `createWatcherHandle` | `function createWatcherHandle(): WatcherHandle` | Create a no-op watcher handle for alpha SDK discovery. |
| `createInstrumentationBridge` | `function createInstrumentationBridge()` | Create a recording instrumentation bridge. |
| `createPluginContext` | `function createPluginContext(projectRoot: string): PluginContext` | Create a minimal plugin context for SDK runtime helpers. |
| `createPluginHostBootstrap` | `function createPluginHostBootstrap(plugins): PluginHostBootstrap` | Create a plugin host bootstrap snapshot. |
| `runDoctorReport` | `function runDoctorReport(plugin: string, checks): DoctorReport` | Run plugin doctor checks and return an aggregate report. |
| `AstExtractor` | class | Extractor for exported plugin contribution builder call sites. |
| `FilesystemWalker` | class | Filesystem walker for plugin source discovery. |
| `MemoryManifestResolver` | class | In-memory manifest resolver used by tests and alpha SDK stubs. |
| `ModuleManifestResolver` | class | Manifest resolver backed by dynamic imports. |
| `RegistryEmitter` | class | Registry emitter that writes one generated TypeScript module per contribution axis. |
| `EmitterPort` | interface | Port for emitting generated plugin registry files. |
| `ExtractorPort` | interface | Port for extracting plugin contributions from walked files. |
| `ManifestResolverPort` | interface | Port for resolving a plugin manifest from a package or module specifier. |
| `WalkerPort` | interface | Port for discovering plugin source files. |
| `WalkedFile` | interface | File discovered by a plugin source walker. |
| `SourceGraph` | interface | Source graph snapshot produced by discovery. |
| `RegistryEmission` | interface | Output emitted by the registry emitter. |
| `ExtractedContribution` | interface | Extracted contribution candidate from source. |
| `WatcherHandle` | interface | Watcher handle returned by SDK watch presets. |
| `ModuleManifestResolverOptions` | interface | Options for resolving manifests from importable module specifiers. |
| `RunWalkerPipelineOptions` | interface | Options for running the SDK walker pipeline. |
| `InstrumentationBridge` | interface | Bridge between plugin runtime and telemetry instrumentation. |
| `PluginHostBootstrap` | interface | Result of bootstrapping plugin host state. |
| `PluginServiceContext` | interface | Context supplied to a plugin service at runtime. |

This entrypoint also re-exports `BackgroundProcessorContribution`, `ContractVersionContribution`,
`DbSchemaContribution`, `E2eContribution`, `MigrationContribution`, `PluginContributions`,
`PluginDependencies`, `PluginLifecycleHooks`, `PluginManifest`, `PluginMetadata`,
`PluginMetadataValue`, `PluginType`, `RuntimeConfigTopicContribution`, `ServiceContribution`,
`StreamTopicContribution`, `TelemetryContribution`, `PluginContext`, and `PluginLogger` from the
root/config surface, plus `DoctorCheck` and `DoctorReport` from the CLI surface.

### `@netscript/plugin/loader`

| Symbol | Signature | Description |
| --- | --- | --- |
| `createPluginLogger` | `function createPluginLogger(pluginName: string): PluginLogger` | Create a logger scoped to a plugin service process. |
| `PluginLogger` | `interface PluginLogger` | Minimal logger shape supplied to plugin service contexts. |

### `@netscript/plugin/protocol`

| Symbol | Kind | Description |
| --- | --- | --- |
| `parsePluginManifest` | function | Parse and validate a plugin manifest without executing plugin code. |
| `PLUGIN_MANIFEST_SCHEMA_VERSION` | constant | Current published schema version for `scaffold.plugin.json`. |
| `PluginInstallerManifestSchema` | constant | Validator for the published plugin installer manifest. |
| `PluginInstallerManifest` | interface | Published `scaffold.plugin.json` contract consumed by installers. |
| `PluginInstallerManifestSchemaIssue` | interface | Validation issue exposed by the installer manifest schema. |
| `PluginInstallerManifestValidator` | interface | Stable validation surface for the installer manifest schema. |
| `PluginManifestCapabilities` | interface | Capability summary statically declared by a plugin manifest. |
| `PluginManifestLinking` | interface | Declarative resource-linking contract for plugins. |
| `PluginManifestLinkingConsumers` | interface | Named host resources that consume a plugin producer. |
| `PluginManifestOfficialSource` | interface | Compatibility metadata for first-party source-copy discovery. |
| `PluginManifestParseError` | interface | Validation failure returned when a manifest cannot be parsed. |
| `PluginManifestParseIssue` | interface | One validation issue returned by manifest parsing. |
| `PluginManifestParseResult` | type alias | Result returned by static plugin manifest parsing. |
| `PluginManifestPostScript` | interface | Script export executed after a plugin-owned scaffold succeeds. |
| `PluginManifestProvider` | interface | Compatibility metadata for plugin-kind provider registration. |
| `PluginManifestScaffolder` | interface | Plugin-owned scaffold entrypoint declared by the manifest. |
| `PluginScaffolderRequiredPermissions` | interface | Deno permissions required by a plugin-owned scaffolder. |
| `PluginScaffoldEntrypoint` | type alias | Signature implemented by plugin-owned `./scaffold` exports. |
| `ScaffolderContext` | interface | Context supplied by an installer to a plugin-owned scaffolder. |
| `ScaffoldResult` | interface | Result returned by a plugin-owned scaffolder. |

This entrypoint also re-exports the root `PluginLogger` type.

### `@netscript/plugin/scaffold`

| Symbol | Kind | Description |
| --- | --- | --- |
| `ItemScaffolder` | interface | Unified generator contract for plugin-owned userland items. |
| `ScaffoldArtifact` | interface | Userland file emitted by a plugin item generator. |
| `ScaffoldArtifactBody` | interface | Text body owned by a scaffold artifact. |
| `artifactText` | function | Read the text body from a scaffold artifact. |
| `textArtifact` | function | Create a text scaffold artifact. |
| `StubSource` | interface | Type-checked source stub with declared named tokens. |
| `TokenValues` | type alias | Token values required by a declared stub source. |
| `defineStub` | function | Declare a type-checked source stub. |
| `substituteTokens` | function | Substitute named `%%TOKEN%%` markers in a declared source stub. |
| `RegistryImport` | interface | Import declaration emitted into a generated registry module. |
| `RegistryModule` | interface | Structured description of a generated registry module. |
| `RuntimeRegistryModule` | interface | Structured description of a generated runtime registry module. |
| `defineRegistryModule` | function | Preserve a registry module definition with literal field types. |
| `defineRuntimeRegistryModule` | function | Preserve a runtime registry definition with literal field types. |
| `renderRegistrySource` | function | Render a deterministic registry module from structured data. |
| `renderRuntimeRegistrySource` | function | Render a deterministic runtime registry module from structured data. |

### `@netscript/plugin/testing`

| Symbol | Signature | Description |
| --- | --- | --- |
| `createPluginManifestFixture` | `function createPluginManifestFixture(overrides?): PluginManifest` | Example plugin manifest fixture. |
| `createWalkedFileFixture` | `function createWalkedFileFixture(overrides?): WalkedFile` | Example walked file fixture. |
| `runPluginCliContract` | `function runPluginCliContract(cli: PluginCli): boolean` | Run the shared plugin CLI contract against a CLI instance. |
| `MemoryManifestResolver` | class | In-memory manifest resolver used by tests and alpha SDK stubs. |
| `MemoryWalker` | class | In-memory walker for plugin source discovery. |
| `MemoryEmitter` | class | In-memory registry emitter for plugin tests. |
| `MemoryFileSystemAdapter` | class | In-memory file system adapter for plugin tests. |
| `FileSystemPort` | interface | Minimal file system port used by plugin scaffolding. |

This entrypoint also re-exports the root/config symbols `BackgroundProcessorContribution`,
`ContractVersionContribution`, `DbSchemaContribution`, `E2eContribution`, `MigrationContribution`,
`PluginContext`, `PluginContributions`, `PluginDependencies`, `PluginLifecycleHooks`, `PluginLogger`,
`PluginManifest`, `PluginMetadata`, `PluginMetadataValue`, `PluginType`,
`RuntimeConfigTopicContribution`, `ServiceContribution`, `StreamTopicContribution`, and
`TelemetryContribution`; the SDK symbols `EmitterPort`, `ExtractedContribution`,
`ManifestResolverPort`, `RegistryEmission`, `WalkedFile`, and `WalkerPort`; and the CLI symbols
`PluginCli`, `PluginCliArgs`, `PluginCliCommand`, and `PluginCliResult`.

### `@netscript/plugin/templates`

| Symbol | Kind | Description |
| --- | --- | --- |
| `PLUGIN_SKELETON_TEMPLATE_CONTENT` | constant | Embedded text for every default plugin skeleton template asset. |
| `PLUGIN_SKELETON_TEMPLATES` | variable | Paths for plugin skeleton template assets. |
| `PluginSkeletonTemplatePath` | type alias | Plugin skeleton template path. |

### `@netscript/plugin/contract-base`

| Symbol | Kind | Description |
| --- | --- | --- |
| `BASE_PLUGIN_ERRORS` | constant | Base oRPC error-map fragment shared by plugin contracts. |
| `BasePluginErrorCode` | type alias | Literal error codes guaranteed by `BASE_PLUGIN_ERRORS`. |
| `BasePluginErrorDefinition` | interface | One entry in a plugin contract's oRPC error map. |
| `InternalErrorData` | interface | Error payload reported for unexpected internal failures. |
| `PluginCapabilities` | interface | Marketplace-discoverable description of a running plugin. |
| `PluginCapabilitiesSchema` | constant | Output schema for the mandatory plugin `describe` route. |
| `PluginCapabilitiesValidator` | interface | Structural validator for plugin capability documents. |
| `BASE_PLUGIN_CONTRACT_ROUTES` | constant | Mandatory route fragment shared by feature plugin contracts. |
| `BasePluginContract` | interface | Minimum route surface every plugin contract must satisfy. |
| `BasePluginDescribeProcedure` | type alias | Mandatory `describe` procedure shape for plugin contracts. |
| `BasePluginDescribeRoute` | type alias | Explicit type of the base contract's `describe` route. |

### `@netscript/plugin/service`

| Symbol | Kind | Description |
| --- | --- | --- |
| `createPluginService` | function | Build a plugin service with the mandated middleware and route chain pre-applied. |
| `PluginDatabaseConfig` | interface | Options forwarded to the service builder's database configuration. |
| `PluginRawRoute` | interface | Raw HTTP route mounted directly on a plugin service. |
| `PluginServiceConfig` | interface | Data-only description of a plugin service. |
| `BoundPluginContract` | interface | Context-bound contract helpers produced by `bindPluginContract`. |
| `PluginContractAssemblyConfig` | interface | Data required to mount a bound contract under `/vN/<plugin>`. |
| `PluginContractBinder` | interface | Contract binder used before selecting a request context. |
| `PluginContractHandlers` | type alias | Handler map derived from a context-bound oRPC contract router. |
| `PluginContractImplementer` | interface | Contract implementer that binds a concrete request context. |
| `PluginContractRouteKey` | type alias | Route keys whose values expose oRPC's handler builder. |
| `PluginContractRouter` | type alias | Route implementer returned by an oRPC contract context binding. |
| `assemblePluginContractRouter` | function | Assemble a context-bound handler map under a versioned namespace. |
| `bindPluginContract` | function | Bind an implemented contract and derive typed handlers and a router. |

This entrypoint also re-exports `ContextFactory`, `CorsOptions`, `DbContext`, `HealthCheck`,
`ServiceConfig`, `ServiceHandler`, `ServiceMiddleware`, `ServiceRouteMethod`, and `ServiceRouter`
from `@netscript/service`.

---

Back to the [reference overview](/reference/).
