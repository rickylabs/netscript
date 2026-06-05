# Library API

`@netscript/cli` can be embedded by tools that want to provide the NetScript public command tree,
call public application services directly, or reuse scaffold primitives.

## Public Command Tree

```ts
import { createPublicCli } from '@netscript/cli';

const cli = createPublicCli({
  cwd: () => Deno.cwd(),
  resolvePath: (path = '.') => new URL(path, `file://${Deno.cwd()}/`).pathname,
});

await cli.parse(['db', 'status']);
```

`createPublicCli()` expects host-provided `cwd()` and `resolvePath()` functions so embedders can
control path behavior in tests, alternate runtimes, or wrapped CLIs.

## Runner

```ts
import { runPublicCli } from '@netscript/cli';

await runPublicCli({
  args: Deno.args,
  cwd: () => Deno.cwd(),
  resolvePath: (path = '.') => new URL(path, `file://${Deno.cwd()}/`).pathname,
  error: (message) => console.error(message),
});
```

`runPublicCli()` applies the package's standard error formatting and exit-code behavior through the
runtime contract supplied by the caller.

## Application Services

The package exports public workflow functions and their dependency types, including:

- `addDb`
- `addPlugin`
- `addService`
- `buildDeploy`
- `installServiceDeploy`
- `uninstallServiceDeploy`
- `generateAspire`
- `generateConfigSchema`
- `planConfigSchemaWrites`

Use these when a host already has command parsing and wants to reuse the CLI workflow layer.

## Testing Helpers

`@netscript/cli/testing` exports:

- `createInMemoryFileSystem`
- `createInMemoryProcess`
- `createInMemoryPrompt`
- `createSilentLogger`
- `buildMinimalScaffoldPlan`
- `buildMinimalInitResult`
- `buildMinimalPromptAnswers`
- `buildEmptyScaffoldResult`

These helpers are deterministic and do not touch the real filesystem or spawn child processes.

## Scaffolding Helpers

`@netscript/cli/scaffolding` exports:

- `createPluginScaffoldContext`
- `planPluginScaffoldFiles`
- `writePluginScaffoldFiles`
- `StringTemplateAdapter`
- `Scaffolder`
- `DenoFileSystem`
- `MemoryFileSystemAdapter`
- scaffold, filesystem, and template port types

Use this subpath when a plugin package owns its templates but wants the same rendering, filesystem,
and result-reporting contracts as the NetScript CLI.
