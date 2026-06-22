# @netscript/cli

Command-line and embeddable tooling for creating, mutating, and deploying NetScript workspaces.

## Install

```sh
deno add jsr:@netscript/cli
```

Two focused sub-path exports carry scaffolding and test fixtures:

```ts
import { planPluginScaffoldFiles } from '@netscript/cli/scaffolding';
import { createInMemoryFileSystem } from '@netscript/cli/testing';
```

## Quick example

Embed the public NetScript command tree in your own runtime:

```ts
import { createPublicCli } from '@netscript/cli';

const cli = createPublicCli({
  cwd: () => Deno.cwd(),
  resolvePath: (path = '.') => new URL(path, `file://${Deno.cwd()}/`).pathname,
});

await cli.parse(['--help']);
```

Use `runPublicCli()` at a binary edge for consistent error formatting, and the
`@netscript/cli/testing` entrypoint for deterministic in-memory filesystem, process, and scaffold
fixtures.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/cli/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
