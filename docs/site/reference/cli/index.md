---
layout: layouts/base.vto
title: "@netscript/cli"
---

# `@netscript/cli`

Public and maintainer command-line tooling for NetScript workspaces. This page is generated
from the package's public surface with `deno doc` (US-2). For the full index of packages and
plugins return to the [reference overview](/reference/).

The root entrypoint (`@netscript/cli`) exposes the embeddable, programmatic CLI surface — the
helpers a host binary uses to build and run the NetScript command tree, resolve and dispatch
plugin verbs, and scaffold plugin packages. Two sub-path exports carry the lower-level scaffold
engine and the test fixtures:

- [`@netscript/cli/scaffolding`](#sub-path-exports) — the template/scaffold engine and filesystem ports.
- [`@netscript/cli/testing`](#sub-path-exports) — in-memory ports and fixture builders for tests.

## CLI composition

| Symbol | Signature | Description |
| --- | --- | --- |
| `createPublicCli` | `function createPublicCli(host: PublicCliHost): PublicCliCommand` | Create the public NetScript CLI command tree. |
| `runPublicCli` | `async function runPublicCli(runtime: PublicCliRuntime): Promise<void>` | Run the public CLI with consistent error formatting. |
| `inspectCli` | `function inspectCli(target: CliInspectionTarget): CliInspectionReport` | Inspect an embeddable CLI target for diagnostics. |

## Plugin host loading

| Symbol | Signature | Description |
| --- | --- | --- |
| `createPluginHostLoader` | `function createPluginHostLoader(options: PluginHostLoaderOptions): PluginHostLoaderPort` | Create a plugin host loader from structural public ports. |
| `resolvePluginManifest` | `function resolvePluginManifest(spec: string, options: ResolvePluginManifestOptions): Promise<PluginHostManifest>` | Resolve a plugin manifest by package spec. |
| `resolvePluginCliSpecifier` | `function resolvePluginCliSpecifier(pkg: string): string` | Resolve the JSR CLI specifier for a plugin package. |

## Plugin verb dispatch

| Symbol | Signature | Description |
| --- | --- | --- |
| `dispatchPluginVerb` | `function dispatchPluginVerb(verb: FrameworkVerb, pkg: string, args: readonly string[], options: DispatchPluginVerbOptions): Promise<PluginDispatchProcessResult>` | Dispatch a framework plugin verb through `deno dx jsr:<pkg>/cli`. |
| `isFrameworkVerb` | `function isFrameworkVerb(value: string): value is FrameworkVerb` | Return whether a value is a framework-owned plugin verb. |
| `FRAMEWORK_VERBS` | `const FRAMEWORK_VERBS: readonly FrameworkVerb[]` | Framework-owned plugin verb constants. |
| `FrameworkVerb` | `type FrameworkVerb = "add" \| "remove" \| "enable" \| "disable" \| "sync" \| "setup" \| "update" \| "doctor" \| "info"` | Framework-owned plugin verbs. |

## Plugin scaffolding

| Symbol | Signature | Description |
| --- | --- | --- |
| `scaffoldPluginPackage` | `function scaffoldPluginPackage(options: PluginScaffoldOptions, dependencies: PluginScaffoldDependencies): Promise<PluginScaffoldResult>` | Scaffold a plugin package from skeleton templates. |

## Types

| Symbol | Kind | Description |
| --- | --- | --- |
| `PublicCliHost` | interface | Host services supplied by the binary edge. |
| `PublicCliCommand` | interface | Public command tree returned by `createPublicCli`. |
| `PublicCliRuntime` | interface | Runtime hooks supplied by the public CLI binary. |
| `PluginHostManifest` | interface | Plugin manifest value returned by public host loader contracts. |
| `PluginHostLoaderOptions` | interface | Plugin host loader contracts. |
| `PluginHostState` | interface | Resolved plugin host state. |
| `PluginHostLoaderPort` | interface | Public host loader port. |
| `ResolvePluginManifestOptions` | interface | Options for resolving a plugin manifest. |
| `PluginDispatchProcessResult` | interface | Result of a public process dispatch. |
| `DispatchPluginVerbOptions` | interface | Options for dispatching a plugin verb. |
| `PluginScaffoldOptions` | interface | Options for scaffolding a plugin package. |
| `PluginScaffoldResult` | interface | Result returned after plugin package scaffolding. |
| `PluginScaffoldDependencies` | interface | Dependencies for plugin package scaffolding. |
| `CliInspectionTarget` | interface | Target accepted by `inspectCli`. |
| `CliInspectionReport` | interface | Diagnostic summary for an embeddable CLI target. |

## Sub-path exports

The following entrypoints are published alongside the root export. Their reference surface is
generated separately from their own `deno doc` output.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/cli` | `./mod.ts` | Embeddable CLI composition, plugin dispatch, and scaffold helpers (documented above). |
| `@netscript/cli/scaffolding` | `./scaffolding.ts` | Plugin scaffold engine. |
| `@netscript/cli/testing` | `./testing.ts` | Test fixtures and in-memory ports. |

### `@netscript/cli/scaffolding`

The scaffold engine that walks template directories, renders `{{var | pipe}}` templates, and
writes plugin-owned scaffold definitions.

| Symbol | Signature | Description |
| --- | --- | --- |
| `createPluginScaffoldContext` | `function createPluginScaffoldContext(options: PluginScaffoldContextOptions): PluginScaffoldContext` | Create a normalized plugin scaffold context. |
| `planPluginScaffoldFiles` | `async function planPluginScaffoldFiles(definition, context, dependencies): Promise<readonly PlannedPluginScaffoldFile[]>` | Render all files in a plugin scaffold definition without writing them. |
| `writePluginScaffoldFiles` | `async function writePluginScaffoldFiles(definition, context, dependencies): Promise<ScaffoldResult>` | Render and write a plugin scaffold definition. |
| `renderTemplate` | `function renderTemplate(template: string, context: Record): string` | Render a template string by replacing `{{var}}` / `{{var \| pipe}}`. |
| `Scaffolder` | class | Core scaffold engine that walks template directories and renders templates. |
| `DenoFileSystem` | class | Filesystem adapter backed by Deno APIs and `@std/fs`. |
| `MemoryFileSystemAdapter` | class | In-memory filesystem adapter for tests. |
| `StringTemplateAdapter` | class | Template adapter that uses simple `{{var \| pipe}}` string replacement. |
| `FileSystemPort` | interface | Abstraction over filesystem operations. |
| `ScaffolderPort` | interface | Core scaffolding service. |
| `TemplatePort` | interface | Abstraction over template rendering. |
| `PluginScaffoldDefinition` | interface | Plugin-owned scaffold definition. |
| `PluginScaffoldContext` | interface | Runtime context for a plugin scaffold operation. |
| `PluginScaffoldContextOptions` | interface | Options for creating a plugin scaffold context. |
| `PluginScaffoldTemplate` | interface | One template owned by a plugin package. |
| `PluginScaffoldDirectory` | interface | One directory a plugin scaffold should create. |
| `PlannedPluginScaffoldFile` | interface | Rendered file planned by a plugin scaffold operation. |
| `PluginScaffoldDependencies` | interface | Dependencies needed by plugin scaffold helpers. |
| `ScaffoldOptions` | interface | Options for a single scaffold operation. |
| `ScaffoldResult` | interface | Result of a scaffold operation. |
| `DirEntry` | interface | Entry returned by non-recursive directory reads. |
| `WalkEntry` | interface | Entry yielded by recursive directory walks. |
| `FileInfo` | interface | Metadata returned by filesystem stat operations. |

### `@netscript/cli/testing`

In-memory ports and fixture builders for exercising the CLI and scaffold pipelines in tests.

| Symbol | Signature | Description |
| --- | --- | --- |
| `createInMemoryFileSystem` | `function createInMemoryFileSystem(): MemoryFileSystemAdapter` | Create an in-memory filesystem adapter. |
| `createInMemoryProcess` | `function createInMemoryProcess(): InMemoryProcess` | Create an in-memory process port with queued results. |
| `createInMemoryPrompt` | `function createInMemoryPrompt(): PromptPort` | Create a scripted prompt port for non-interactive tests. |
| `createSilentLogger` | `function createSilentLogger(): LoggerPort` | Create a no-op logger. |
| `buildMinimalScaffoldPlan` | `function buildMinimalScaffoldPlan(): ScaffoldPlan` | Build a minimal scaffold plan fixture for tests. |
| `buildMinimalInitResult` | `function buildMinimalInitResult(): InitResult` | Build a minimal init result fixture for tests. |
| `buildMinimalPromptAnswers` | `function buildMinimalPromptAnswers(): InitPromptAnswers` | Build a minimal prompt-answer fixture for tests. |
| `buildEmptyScaffoldResult` | `function buildEmptyScaffoldResult(): ScaffoldResult` | Build an empty scaffold result fixture for tests. |
| `MemoryFileSystemAdapter` | class | In-memory filesystem adapter for tests. |
| `DbEngine` | type alias | Database engines that have scaffolded workspace support (`"postgres" \| "mysql" \| "mssql" \| "sqlite"`). |
| `DbEngineChoice` | type alias | Database engine selection accepted by init, including the no-database option (`DbEngine \| "none"`). |
| `EditorChoice` | type alias | Optional editor config scaffolded into the workspace root (`"none" \| "zed" \| "vscode"`). |
| `InitPromptAnswers` | interface | Answers collected from interactive prompts during `init`. |
| `InitResult` | interface | Aggregated result of the full `init` pipeline execution. |
| `ScaffoldPlan` | interface | Public scaffold plan derived from validated init options. |
| `ScaffoldServicePlan` | interface | Example service requested for the generated workspace. |
| `LoggerPort` | interface | Structured logger abstraction. |
| `ProcessPort` | interface | Process execution abstraction. |
| `ProcessResult` | interface | Result of an external process invocation. |
| `PromptPort` | interface | User prompt abstraction. |
| `InMemoryProcess` | interface | In-memory process port with deterministic queued results. |
| `RecordedProcessCall` | interface | One recorded in-memory process invocation. |
| `PromptScript` | interface | Scripted answers used by the in-memory prompt port. |

---

Back to the [reference overview](/reference/).