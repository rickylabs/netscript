# @netscript/cli

[![JSR](https://jsr.io/badges/@netscript/cli)](https://jsr.io/@netscript/cli)
[![Deno](https://img.shields.io/badge/deno-2.x-000?logo=deno)](https://deno.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

`@netscript/cli` is the command-line and embeddable tooling package for NetScript workspaces. It
creates projects, adds contracts, databases, services, and plugins, regenerates generated helpers,
and builds Windows Service deployment artifacts.

## Overview

The CLI is the public automation layer for a NetScript project. It owns project creation,
workspace mutation, generated helper refreshes, plugin host dispatch, and deployment packaging.
Every command runs through a small public command tree so binaries, tests, and embedding hosts use
the same flow.

The package exposes a small public API for application hosts and tests:

- `@netscript/cli`
- `@netscript/cli/scaffolding`
- `@netscript/cli/testing`

The repository also contains a workspace-only maintainer binary for NetScript contributors. That
binary is not part of the published API.

## Requirements

- Deno 2.x
- Windows deployment commands require Windows and the Servy CLI
- Project scaffolding commands need read/write access to the target workspace
- Commands that invoke Deno, Prisma, or deployment tooling need process execution permission

## Quickstart

Run the public binary from the repository:

```bash
deno run -A packages/cli/bin/netscript.ts --help
```

Install it locally from the package directory:

```bash
deno task install
```

Common workflows:

```bash
netscript init
netscript contract add --name users
netscript db add --engine postgres
netscript service add --name users
netscript plugin add --kind worker --name email-worker
netscript service generate
netscript generate runtime-schemas
netscript deploy build
```

## Command Line

The public binary is `netscript`. It groups commands by the project surface they modify:

- `init` creates a project.
- `contract`, `db`, and `service` add framework resources.
- `plugin` manages plugin host flows.
- `generate` refreshes generated config and runtime assets.
- `deploy` builds and manages deployment artifacts.

See [docs/commands.md](./docs/commands.md) for the full command reference and
[docs/permissions.md](./docs/permissions.md) for the permission model.

## Mental Model

The CLI is a thin presentation layer over injected ports. Command files parse arguments and call
feature use cases. Filesystem, process, template, and deployment effects are kept behind kernel
adapters. Public plugin commands follow the same rule: framework verbs dispatch to the plugin's
published JSR CLI subpath, while host-side commands load project configuration and trigger the
plugin walker through SDK ports.

## Library Use

Embed the public command tree in another runtime:

```ts
import { createPublicCli } from '@netscript/cli';

const cli = createPublicCli({
  cwd: () => Deno.cwd(),
  resolvePath: (path = '.') => new URL(path, `file://${Deno.cwd()}/`).pathname,
});

await cli.parse(['--help']);
```

Use the testing entrypoint for deterministic filesystem, process, prompt, and scaffold fixtures:

```ts
import {
  buildMinimalScaffoldPlan,
  createInMemoryFileSystem,
  createInMemoryProcess,
} from '@netscript/cli/testing';

const fs = createInMemoryFileSystem();
const process = createInMemoryProcess();
const plan = buildMinimalScaffoldPlan();
```

See [docs/library-api.md](./docs/library-api.md) for exported APIs.

## API

The default export surface is intentionally small. Use `createPublicCli()` when embedding the CLI
in another host, `runPublicCli()` when building a binary edge, and the exported feature use cases
when testing application behavior with in-memory ports. Plugin-platform hosts can call
`createPluginHostLoader()`, `resolvePluginManifest()`, and `dispatchPluginVerb()` directly when
they need to compose plugin operations outside the binary.

## Recipes

Install a plugin from JSR:

```bash
netscript plugin add @netscript/plugin-workers
```

Run a plugin health check through the plugin's own CLI:

```bash
netscript plugin doctor @netscript/plugin-workers
```

Regenerate host-side plugin registries:

```bash
netscript plugin sync
```

Keep the legacy local plugin workspace flow out of user-facing automation. Maintainer workflows use
the maintainer binary and are documented separately.

## Configuration

Project commands resolve the nearest NetScript project root and read `netscript.config.ts`.
Plugin host loading expects plugin manifests to come from the config's `plugins` array. Deployment
and runtime-schema commands also read `appsettings.json` when they need installed service metadata.
All path resolution is supplied by host adapters so tests can run without process globals.

## Testing

Use `deno task check` inside `packages/cli/` for the package entrypoints. Use focused root tasks for
workspace validation:

```bash
deno task check:packages
deno task arch:check
deno doc --lint packages/cli/mod.ts
```

Feature tests live beside the feature they prove. Generated output tests should assert parsed
structure and file presence rather than large string snapshots.

## Observability

Commands emit through the CLI output renderer rather than calling `console.*` directly. Process and
deployment adapters return structured results with exit codes, standard output, and standard error.
Plugin dispatch preserves the plugin CLI's process status by converting failures into typed CLI
errors that the binary edge can render consistently.

## Architecture

`@netscript/cli` follows the NetScript Archetype 6 layout. The kernel contains horizontal ports,
adapters, registries, and presentation abstractions. Public and maintainer commands are vertical
feature slices under their own surfaces. The public composition root creates the command tree and
the dependency graph for one invocation; feature code receives dependencies through constructors or
typed options.

## Plugin Scaffolding

NetScript plugins can reuse CLI scaffolding primitives instead of copying project-generation code.
The public scaffolding contract is exported from `@netscript/cli/scaffolding` and documented in
[docs/scaffolding-primitives.md](./docs/scaffolding-primitives.md). Plugin packages should provide
their own scaffold definition and use the CLI filesystem/template abstractions at the boundary.

## Stability

The public CLI package is versioned as a stable package, while the plugin-platform flows are still
landing in slices. New plugin APIs are documented in the exported TypeScript surface and may be
expanded by later plugin-platform groups as walker, lifecycle, and marketplace work lands.

## Compatibility

The package targets Deno 2.x and JSR. Published code is ESM-only, uses Deno-native permissions, and
does not require Node package installation for normal CLI use. Windows deployment commands require
Windows service tooling, while project and plugin commands run on any platform supported by Deno.

## Maintainer Tools

Contributors working in the NetScript repository can use:

```bash
deno run -A packages/cli/bin/netscript-dev.ts --help
```

Maintainer commands synchronize local package sources, copy official plugin templates, and run
scaffold validation suites. They are intentionally separate from the published command surface.
`netscript-dev` proves the local-source maintainer workflow; public release CI must also prove the
JSR-backed `netscript` workflow once dependent packages are published. See
[docs/maintainer-cli.md](./docs/maintainer-cli.md).

## Documentation

- [Command reference](./docs/commands.md)
- [Library API](./docs/library-api.md)
- [Plugin scaffolding primitives](./docs/scaffolding-primitives.md)
- [Public CLI usage](./docs/public-cli.md)
- [Maintainer CLI](./docs/maintainer-cli.md)
- [Permissions](./docs/permissions.md)
- [Architecture](./docs/architecture.md)
- [JSR publishing](./docs/jsr-publishing.md)
- [Troubleshooting](./docs/troubleshooting.md)

## License

MIT. See the repository [LICENSE](../../LICENSE).
