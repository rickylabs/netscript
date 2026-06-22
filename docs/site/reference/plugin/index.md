---
layout: layouts/base.vto
title: "@netscript/plugin"
---

# `@netscript/plugin`

Plugin manifest, validation, discovery, and host-context contracts for NetScript. This page
is generated from the package's public surface with `deno doc` (US-2). For the full index of
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

The following entrypoints are published alongside the root export. Their public surfaces are
generated separately from their own `deno doc` output and summarized below.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/plugin` | `./mod.ts` | Plugin authoring contract (documented above). |
| `@netscript/plugin/config` | `./src/config/mod.ts` | Builder, manifest schema, and contribution type contracts. |
| `@netscript/plugin/abstracts` | `./src/abstracts/mod.ts` | Abstract contribution base classes per axis. |
| `@netscript/plugin/cli` | `./src/cli/mod.ts` | Plugin CLI base classes, command mounting, and doctor reports. |
| `@netscript/plugin/sdk` | `./src/sdk/mod.ts` | Discovery ports, alpha adapters, and runtime host stubs. |
| `@netscript/plugin/loader` | `./loader.ts` | Host-side plugin service bootstrap helpers. |
| `@netscript/plugin/testing` | `./src/testing/mod.ts` | In-memory adapters, fixtures, and the CLI contract harness. |
| `@netscript/plugin/templates` | `./src/templates/mod.ts` | Plugin skeleton template asset paths. |

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

This entrypoint also re-exports the manifest, contribution, and builder types documented in
the root sections above.

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

### `@netscript/plugin/cli`

| Symbol | Signature | Description |
| --- | --- | --- |
| `PluginCli` | `class PluginCli` | Abstract base class for plugin-owned CLI command groups. |
| `PluginItemScaffolder` | `class PluginItemScaffolder` | Abstract base for plugin item scaffolders (the `add <item>` command). |
| `PluginRuntimeConfigCli` | `class PluginRuntimeConfigCli` | Abstract base for plugin runtime configuration commands. |
| `mountPluginCli` | `function mountPluginCli(clis)` | Mount plugin CLI command groups into a flat command list. |
| `runMountedCommand` | `async function runMountedCommand(commands, args: PluginCliArgs): Promise` | Run a mounted command list without depending on Cliffy at package level. |
| `routeVerb` | `async function routeVerb(commands, args: PluginCliArgs): Promise` | Route a command by verb name. |
| `formatPluginHelp` | `function formatPluginHelp(commands): string` | Format command help text for a mounted plugin CLI. |
| `isDoctorReportPassing` | `function isDoctorReportPassing(report: DoctorReport): boolean` | Return true when every doctor check is passing. |
| `PluginCliArgs` | `interface PluginCliArgs` | Command arguments passed to plugin CLI handlers. |
| `PluginCliCommand` | `interface PluginCliCommand` | A mounted CLI command handler. |
| `PluginCliResult` | `interface PluginCliResult` | Result returned by plugin CLI handlers. |
| `PluginScaffoldResult` | `interface PluginScaffoldResult` | Result returned by plugin item scaffolders. |
| `DoctorCheck` | `interface DoctorCheck` | Diagnostic entry produced by plugin doctor commands. |
| `DoctorReport` | `interface DoctorReport` | Aggregate doctor report for a plugin CLI. |

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

### `@netscript/plugin/loader`

| Symbol | Signature | Description |
| --- | --- | --- |
| `createPluginLogger` | `function createPluginLogger(pluginName: string): PluginLogger` | Create a logger scoped to a plugin service process. |
| `PluginLogger` | `interface PluginLogger` | Minimal logger shape supplied to plugin service contexts. |

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

### `@netscript/plugin/templates`

| Symbol | Kind | Description |
| --- | --- | --- |
| `PLUGIN_SKELETON_TEMPLATES` | variable | Paths for plugin skeleton template assets. |
| `PluginSkeletonTemplatePath` | type alias | Plugin skeleton template path. |

---

Back to the [reference overview](/reference/).
