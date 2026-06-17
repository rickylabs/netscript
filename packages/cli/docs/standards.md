# @netscript/cli Standards

This document is the package-local standard for the Archetype 6 CLI/tooling surface. It turns the
Wave 6 research findings into rules a contributor can apply before opening a change.

## S.1 Command Contract

Every user-facing command is a verb-noun unit owned by one feature folder under
`src/public/features/<feature>/`.

- `*-command.ts` owns Cliffy parsing only: name, description, args, options, and action binding.
- The use-case file owns behavior and has no Cliffy import.
- The input file owns typed parsing/validation data.
- Optional step files own pipeline phases, one phase per file.
- Tests live beside the file under test unless they are true cross-feature e2e suites.

Composition registers command factories. It does not inline `.command()`, `.option()`, or
`.action()` chains. The root program should read as wiring, not as command implementation.

## S.2 Typed Error Model

Commands report user-visible failure through the CLI error taxonomy in `src/kernel/domain/errors/`.

- Command and use-case boundaries throw `CliError` subclasses, not bare `Error`.
- The binary edge is the only place that maps errors to process exit.
- Errors carry machine-readable codes, user messages, and optional hints.
- Domain code returns typed results for expected branch outcomes and throws only for exceptional
  conditions.
- JSON-capable commands render errors as structured objects rather than formatted terminal text.

## S.3 IO And Output Discipline

Output is structured first and terminal-rendered last.

- Production code does not call `console.log`, `console.error`, or `console.warn` outside
  `src/kernel/presentation/output/**` and `src/kernel/adapters/logger/**`.
- `Deno.exit` is limited to `bin/**`.
- `Deno.Command` and direct filesystem/process effects stay in adapters or binaries.
- Use cases return results and events; command/presentation code renders them.
- CI-facing output must have a stable JSON or NDJSON shape when a command supports structured mode.

## S.4 Naming

Names follow the command contract and doctrine folder vocabulary.

- Files are lowercase kebab-case and match the dominant exported symbol.
- Command classes end in `Command`; groups end in `Group`.
- Interfaces are not prefixed with `I`, and types do not use `_T`.
- Avoid `manager`, `controller`, `service`, `handler`, `shared`, `common`, `utils`, and `helpers`
  as generic names.
- Polymorphic families use plural axis folders, such as `plugin-kinds`, `db-engines`,
  `deploy-targets`, and `service-shapes`.

## S.5 Testing Tiers

Use the smallest tier that proves the behavior.

| Tier | Location | Ports | Purpose |
| --- | --- | --- | --- |
| Unit | Colocated `*_test.ts` | In-memory ports | Single file or use case behavior. |
| Integration | Feature or package tests | Real filesystem temp dirs, no network by default | Feature workflow behavior. |
| E2E | `packages/cli/e2e` | Real command process | Full scaffold/runtime flows and command contracts. |

Unit tests should prefer in-memory ports from `testing.ts`. E2E tests own shelling out to the CLI and
asserting stdout, stderr, exit code, generated files, and runtime gates.

## S.6 Public Surface And Documentation

The root `mod.ts`, declared subpath exports, and docs are the published contract.

- Export only stable library helpers that consumers legitimately call.
- Do not add back-compat alias shims for internal moves.
- Each public export has a useful JSDoc summary and explicit types.
- `kernel/extension-points.ts` is the maintainer map for registries and extension axes.
- Command docs explain input shape, output shape, permissions, and expected failure categories.

## S.7 Layers And Imports

The kernel is horizontal; public, maintainer, and local surfaces are vertical feature slices.

| Layer | May Import | Must Not Import |
| --- | --- | --- |
| `src/kernel/domain` | Domain-local types only | Adapters, application, presentation, surfaces |
| `src/kernel/ports` | Domain | Adapters, application, presentation, surfaces |
| `src/kernel/application` | Domain, ports | Adapters, presentation, surfaces |
| `src/kernel/presentation` | Domain, ports, application | Adapters, surfaces |
| `src/kernel/adapters` | Domain, ports, external clients | Application, presentation, surfaces |
| `src/public/**` | Kernel and public-local files | `src/maintainer/**`, `src/local/**` |
| `src/maintainer/**` | Kernel and maintainer-local files | `src/public/**`, `src/local/**` |
| `src/local/**` | Kernel and local-local files | `src/public/**`, `src/maintainer/**` |

Layer exceptions need an explicit drift or debt entry with the closing gate.

## Migration Checklist

These Wave 6 findings are the closing checklist for the current tree.

| ID | Evidence | Gate | Closing Action |
| --- | --- | --- | --- |
| V-1 | `src/public/features/root/public-command-tree.ts:33` | F-CLI-27 | Replace the hand-wired Cliffy root chain with `CliCommandRegistry`. |
| V-2 | `src/public/features/deploy/build/build-windows-cli.ts:67` | F-CLI-3/F-CLI-4 | Route deploy build behavior through a deploy target port. |
| V-3 | `src/kernel/domain/` has 11 immediate children | F-CLI-30 | Group polymorphic families into plural axis folders. |
| V-4 | `src/kernel/adapters/windows/compile/compile-runner.ts:186` | A6 role folders | Move concrete deploy target behavior behind the deploy target port. |
| V-5 | `src/kernel/templates/aspire/helpers/helpers-generator-pipeline.ts:1` | R-FOLD-CARD/F-CLI-22 | Relocate codegen modules under `src/kernel/codegen/aspire/`. |
| V-6 | `src/kernel/assets/aspire/helpers/_aspire-compat.ts.template:1` | F-CLI-12 | Remove `helpers/` asset paths by moving templates to role-named folders. |
| V-7 | `src/kernel/adapters/scaffold/tests/` | R-FOLD-CARD | Collocate scaffold adapter tests beside subjects. |
| V-8 | `src/kernel/adapters/windows/compile/compile_test.ts:1` | R-FOLD-CARD | Collocate Windows adapter tests beside subjects. |
| V-9 | `src/kernel/application/registries/deploy-target-registry.ts:4` | F-CLI-3 | Replace literal `DeployTargetKey` lock-in with `DeployTargetPort`. |
| V-10 | `src/maintainer/composition/create-maintainer-cli.ts:12` | F-CLI-27 | Keep maintainer wiring isolated and declarative. |
| V-11 | `src/public/features/deploy/build/build-windows-prebuild.ts:60` | F-CLI-5/F-CLI-16 | Move public deploy shell-outs behind process/deploy adapters. |
| V-12 | `src/kernel/adapters/loggers/console-logger.ts:1` | F-CLI-21 | Rename logger adapter folder when the singular port shape lands. |
| V-13 | `src/kernel/application/scaffold/writers/write-app-files.ts:12` | F-CLI-3 | Move scaffold writer codegen into `maintainer/features/codegen/`. |
| V-14 | `src/kernel/adapters/scaffold/editor-config.ts:42` and `:115` | F-6 | Mirror the Deno schema locally under `packages/cli/assets/schema/`. |

## Gate Map

| Rule Area | Primary Gates |
| --- | --- |
| Command contract | F-CLI-13, F-CLI-14, F-CLI-17, F-CLI-21, F-CLI-27 |
| Typed errors | F-CLI-15 plus CLI error taxonomy tests |
| IO and output | F-CLI-5, F-CLI-15, F-CLI-16, F-CLI-26 |
| Naming | F-6, F-7, F-12, F-CLI-7, F-CLI-12, F-CLI-20, F-CLI-30 |
| Testing | F-1, F-10, scaffold/runtime e2e gates |
| Public surface | F-5, F-6, F-7, F-8, F-CLI-8, F-CLI-9, F-CLI-10, F-CLI-31 |
| Layers | F-3, F-CLI-3, F-CLI-4, F-CLI-19, F-CLI-28 |

## Contributor Path

To add or change a command:

1. Pick the feature folder that owns the user-visible verb.
2. Add or update the command, input, use-case, and optional steps in that feature.
3. Inject ports through constructors; do not import adapters into use cases or presentation.
4. Register the command in the command registry or composition point named by the current slice.
5. Add the smallest unit/integration/e2e coverage that proves the behavior.
6. Update command docs and the migration checklist when a V-item closes.
