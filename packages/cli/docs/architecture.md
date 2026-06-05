# CLI Architecture

`@netscript/cli` is organized around command ownership, reusable scaffolding services, and explicit
runtime edges. The public command tree is safe for end-user workspaces; maintainer tooling stays in
the repository-only binary.

## Source Layout

| Area           | Location          | Responsibility                                                                                                     |
| -------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| Kernel         | `src/kernel/`     | Shared domain types, ports, errors, registries, template assets, and runtime adapters.                             |
| Public CLI     | `src/public/`     | End-user commands and workflows for projects, contracts, databases, services, plugins, generation, and deployment. |
| Maintainer CLI | `src/maintainer/` | Repository-only commands for local package sync, plugin source sync, monorepo probing, and scaffold validation.    |
| Binaries       | `bin/`            | Deno entrypoints and process exit handling.                                                                        |

Feature folders own their command files, application workflow, and local helper types together.
Shared infrastructure belongs in `src/kernel/` only when it is independent of public and maintainer
mode decisions.

## Command Composition

The public binary is built by `createPublicCli()`. The maintainer binary is built by
`createMaintainerCli()`.

Composition files are intentionally small. They assemble feature groups and pass concrete
dependencies, while command parsing and command behavior live in feature-owned files. This keeps the
root command tree readable and makes each command group testable in isolation.

## Runtime Boundaries

The CLI uses ports for filesystem, process execution, prompts, template rendering, JSR resolution,
and Windows Service management. Concrete Deno and Windows integrations are isolated in adapters and
binary entrypoints.

Public code never depends on maintainer code. Maintainer code may reuse kernel contracts and
adapters, but local repository discovery and local package copying are not available from the public
binary.

## Templates And Assets

Template files are stored under `src/kernel/assets/`. Generators and scaffolders address templates
through registries and template adapters instead of embedding large generated source files in
TypeScript modules.

## Extending The CLI

When adding a command:

1. Put the command under the owning feature folder.
2. Keep Cliffy parsing in the command file.
3. Move business behavior into application functions, pipeline steps, or scaffolders.
4. Add semantic tests for generated files and command behavior.
5. Update the command reference and permission matrix.
