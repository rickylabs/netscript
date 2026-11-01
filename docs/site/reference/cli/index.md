---
layout: layouts/base.vto
title: "@netscript/cli"
templateEngine: [vento, md]
---

# `@netscript/cli`

The programmatic surface behind the `netscript` command: build and run the command tree, load and
dispatch plugin verbs, and scaffold plugin packages. Use it to embed the CLI in a host binary or to
test plugin scaffolds; for the commands themselves, see the
[`netscript` command reference](/reference/cli/commands/).

## Sub-path exports

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/cli` | `./mod.ts` | [CLI composition](#cli-composition), [plugin host loading](#plugin-host-loading), [verb dispatch](#plugin-verb-dispatch) and [scaffold helpers](#plugin-scaffolding). |
| `@netscript/cli/scaffolding` | `./scaffolding.ts` | [Plugin scaffold engine](#netscriptcliscaffolding) and filesystem ports. |
| `@netscript/cli/testing` | `./testing.ts` | [Test fixtures and in-memory ports](#netscriptclitesting). |

## CLI composition

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `createPublicCli` | function | `function createPublicCli(host: PublicCliHost): PublicCliCommand` | Create the public NetScript CLI command tree. |
| `runPublicCli` | function | `async function runPublicCli(runtime: PublicCliRuntime): Promise<void>` | Run the public CLI with consistent error formatting. |
| `inspectCli` | function | `function inspectCli(target: CliInspectionTarget): CliInspectionReport` | Inspect an embeddable CLI target for diagnostics. |

## Plugin host loading

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `createPluginHostLoader` | function | `function createPluginHostLoader(options: PluginHostLoaderOptions): PluginHostLoaderPort` | Create a plugin host loader from structural public ports. |
| `resolvePluginManifest` | function | `function resolvePluginManifest(spec: string, options: ResolvePluginManifestOptions): Promise<PluginHostManifest>` | Resolve a plugin manifest by package spec. |
| `resolvePluginCliSpecifier` | function | `function resolvePluginCliSpecifier(pkg: string): string` | Resolve the JSR CLI specifier for a plugin package. |

## Plugin verb dispatch

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `dispatchPluginVerb` | function | `function dispatchPluginVerb(verb: FrameworkVerb, pkg: string, args: readonly string[], options: DispatchPluginVerbOptions): Promise<PluginDispatchProcessResult>` | Dispatch a framework plugin verb through `deno x -A jsr:<pkg>/cli`. |
| `isFrameworkVerb` | function | `function isFrameworkVerb(value: string): value is FrameworkVerb` | Return whether a value is a framework-owned plugin verb. |
| `FRAMEWORK_VERBS` | const | `const FRAMEWORK_VERBS: readonly FrameworkVerb[]` | Framework-owned plugin verb constants. |
| `FrameworkVerb` | type alias | `type FrameworkVerb = "add" \| "remove" \| "enable" \| "disable" \| "sync" \| "setup" \| "update" \| "doctor" \| "info"` | Framework-owned plugin verbs. |

## Plugin scaffolding

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `scaffoldPluginPackage` | function | `function scaffoldPluginPackage(options: PluginScaffoldOptions, dependencies: PluginScaffoldDependencies): Promise<PluginScaffoldResult>` | Scaffold a plugin package from skeleton templates. |

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

## `@netscript/cli/scaffolding`

The scaffold engine that walks template directories, renders `{{ "{" + "{var | pipe}" + "}" }}` templates, and
writes plugin-owned scaffold definitions.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `createPluginScaffoldContext` | function | `function createPluginScaffoldContext(options: PluginScaffoldContextOptions): PluginScaffoldContext` | Create a normalized plugin scaffold context. |
| `planPluginScaffoldFiles` | function | `async function planPluginScaffoldFiles(definition, context, dependencies): Promise<readonly PlannedPluginScaffoldFile[]>` | Render all files in a plugin scaffold definition without writing them. |
| `writePluginScaffoldFiles` | function | `async function writePluginScaffoldFiles(definition, context, dependencies): Promise<ScaffoldResult>` | Render and write a plugin scaffold definition. |
| `renderTemplate` | function | `function renderTemplate(template: string, context: Record): string` | Render a template string by replacing `{{ "{" + "{var}" + "}" }}` / `{{ "{" + "{var " + "\\|" + " pipe}" + "}" }}`. |
| `Scaffolder` | class | class | Core scaffold engine that walks template directories and renders templates. |
| `DenoFileSystem` | class | class | Filesystem adapter backed by Deno APIs and `@std/fs`. |
| `MemoryFileSystemAdapter` | class | class | In-memory filesystem adapter for tests. |
| `StringTemplateAdapter` | class | class | Template adapter that uses simple `{{ "{" + "{var " + "\\|" + " pipe}" + "}" }}` string replacement. |
| `FileSystemPort` | interface | interface | Abstraction over filesystem operations. |
| `ScaffolderPort` | interface | interface | Core scaffolding service. |
| `TemplatePort` | interface | interface | Abstraction over template rendering. |
| `PluginScaffoldDefinition` | interface | interface | Plugin-owned scaffold definition. |
| `PluginScaffoldContext` | interface | interface | Runtime context for a plugin scaffold operation. |
| `PluginScaffoldContextOptions` | interface | interface | Options for creating a plugin scaffold context. |
| `PluginScaffoldTemplate` | interface | interface | One template owned by a plugin package. |
| `PluginScaffoldDirectory` | interface | interface | One directory a plugin scaffold should create. |
| `PlannedPluginScaffoldFile` | interface | interface | Rendered file planned by a plugin scaffold operation. |
| `PluginScaffoldDependencies` | interface | interface | Dependencies needed by plugin scaffold helpers. |
| `ScaffoldOptions` | interface | interface | Options for a single scaffold operation. |
| `ScaffoldResult` | interface | interface | Result of a scaffold operation. |
| `DirEntry` | interface | interface | Entry returned by non-recursive directory reads. |
| `WalkEntry` | interface | interface | Entry yielded by recursive directory walks. |
| `FileInfo` | interface | interface | Metadata returned by filesystem stat operations. |

## `@netscript/cli/testing`

In-memory ports and fixture builders for testing the CLI and scaffold pipelines.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `createInMemoryFileSystem` | function | `function createInMemoryFileSystem(): MemoryFileSystemAdapter` | Create an in-memory filesystem adapter. |
| `createInMemoryProcess` | function | `function createInMemoryProcess(): InMemoryProcess` | Create an in-memory process port with queued results. |
| `createInMemoryPrompt` | function | `function createInMemoryPrompt(): PromptPort` | Create a scripted prompt port for non-interactive tests. |
| `createSilentLogger` | function | `function createSilentLogger(): LoggerPort` | Create a no-op logger. |
| `buildMinimalScaffoldPlan` | function | `function buildMinimalScaffoldPlan(): ScaffoldPlan` | Build a minimal scaffold plan fixture for tests. |
| `buildMinimalInitResult` | function | `function buildMinimalInitResult(): InitResult` | Build a minimal init result fixture for tests. |
| `buildMinimalPromptAnswers` | function | `function buildMinimalPromptAnswers(): InitPromptAnswers` | Build a minimal prompt-answer fixture for tests. |
| `buildEmptyScaffoldResult` | function | `function buildEmptyScaffoldResult(): ScaffoldResult` | Build an empty scaffold result fixture for tests. |
| `MemoryFileSystemAdapter` | class | class | In-memory filesystem adapter for tests. |
| `CacheBackendChoice` | type alias | type alias | Cache backend accepted by init (`"redis" \| "garnet" \| "deno-kv"`). |
| `DbEngine` | type alias | type alias | Database engines that have scaffolded workspace support (`"postgres" \| "mysql" \| "mssql" \| "sqlite"`). |
| `DbEngineChoice` | type alias | type alias | Database engine selection accepted by init, including the no-database option (`DbEngine \| "none"`). |
| `EditorChoice` | type alias | type alias | Optional editor config scaffolded into the workspace root (`"none" \| "zed" \| "vscode"`). |
| `InitPromptAnswers` | interface | interface | Answers collected from interactive prompts during `init`. |
| `InitResult` | interface | interface | Aggregated result of the full `init` pipeline execution. |
| `ScaffoldPlan` | interface | interface | Public scaffold plan derived from validated init options. |
| `ScaffoldServicePlan` | interface | interface | Example service requested for the generated workspace. |
| `LoggerPort` | interface | interface | Structured logger abstraction. |
| `ProcessPort` | interface | interface | Process execution abstraction. |
| `ProcessResult` | interface | interface | Result of an external process invocation. |
| `PromptPort` | interface | interface | User prompt abstraction. |
| `InMemoryProcess` | interface | interface | In-memory process port with deterministic queued results. |
| `RecordedProcessCall` | interface | interface | One recorded in-memory process invocation. |
| `PromptScript` | interface | interface | Scripted answers used by the in-memory prompt port. |

This entrypoint also re-exports `ScaffoldResult`, `DirEntry`, `FileInfo`, `WalkEntry`, and
`FileSystemPort`, documented in the scaffolding table above.
