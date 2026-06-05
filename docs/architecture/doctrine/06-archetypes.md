# Package Archetypes

Axioms governed: A9.

One folder layout for every package is wrong. A 200-line schema
package does not need a `presentation/` layer. A runtime behavior
package cannot survive without one. This page defines six
archetypes; every `packages/*` and `plugins/*` package picks the
smallest archetype that fits, and the [folder structure
doctrine](./05-folder-structure.md) governs how each archetype is
organized.

## Archetype 1 — Small Contract

For packages that publish *types and small invariants* and almost
no runtime. Examples in this repo: `@netscript/streams`,
`@netscript/runtime-config`, `@netscript/config` (after refactor).

Minimum shape:

```
mod.ts
README.md
deno.json
src/
  types.ts            (or split per concept)
  schema.ts           (Zod / contract definitions)
  validation.ts       (parse + invariant helpers, only if needed)
tests/
  schema_test.ts
```

Doctrine for this archetype:

- No base classes. No DI. No adapters.
- The README is mostly the type table.
- Subpath exports are unnecessary unless the package crosses ~15
  exports.
- The package's value is *clarity of types*, not behavior.

## Archetype 2 — Integration

For packages that wrap an external system behind a small port and
provide one or more adapters. Examples: `@netscript/database`,
`@netscript/queue`, `@netscript/kv`, `@netscript/aspire`,
`@netscript/cron`.

Minimum shape:

```
mod.ts
README.md
deno.json
src/
  domain/
  ports/                            ← consumed contracts
  adapters/                         ← one file per technology
    deno-kv-store.ts
    postgres-store.ts
  application/
    create-runtime.ts               ← composition root factory
  testing/                          ← in-memory adapters
tests/
  integration/                      ← spins up real backends
```

Doctrine for this archetype:

- The *port* belongs to the package, not the adapter.
- A `createX(options)` factory wires the default adapter.
- Tech-specific adapters expose their own subpath
  (`./adapters/postgres`).
- Testing helpers expose `./testing` with in-memory adapters.
- A package with one adapter and no foreseeable second adapter does
  *not* introduce a port; just expose the class. (Premature port =
  Wet Codebase failure on the abstraction side.)

## Archetype 3 — Runtime/Behavior

For packages that own long-running behavior with state, lifecycle,
and supervised execution. Examples: `@netscript/workers`,
`@netscript/triggers`, future `@netscript/streams` runtime layer.
*Not* `@netscript/sagas`, which is its own archetype below.

Minimum shape:

```
mod.ts
README.md
deno.json
src/
  domain/                           ← types: Job, Task, Trigger
  ports/                            ← stores, transports, clocks
  state/                            ← per-instance state shapes
  application/
    builders/                       ← defineX builders
    runtime/                        ← JobRuntime, TaskExecutor
    runner/                         ← lifecycle dispatch
  adapters/
  middleware/
  registry/
  presets/                          ← startCombined, startWorkers
  diagnostics/                      ← error normalization
tests/
```

Doctrine for this archetype:

- The runtime class owns lifecycle and is constructor-injected with
  collaborators (store, queue, telemetry).
- A `defineX()` builder returns a frozen definition consumed by the
  runtime.
- Long-running tasks return small `{ stop(): Promise<void> }`
  handles. They do not rely on global state.
- `AbortSignal` is plumbed through every async path.
- Crash boundaries are explicit; a supervisor decides restart vs.
  escalate. (See [`08-runtime-state-failure.md`](./08-runtime-state-failure.md).)

## Archetype 4 — Public DSL / Builder

For packages whose primary product is a fluent builder API.
Examples: `@netscript/fresh`, `@netscript/sdk`, the future
CLI E2E suite, future `@netscript/contracts` design DSL.

Minimum shape:

```
mod.ts                              ← thin re-export
README.md
deno.json
src/
  domain/                           ← definition objects
  application/
    builders/                       ← per-concern builder file groups
      define-x.ts                   ← entry function
      x-builder.ts                  ← class
      x-builder-state.ts            ← typestate / accumulator
      x-builder-validation.ts       ← invariants
      x-definition-factory.ts       ← finalize/freeze
    runtime/                        ← (only if the DSL has runtime)
  testing/                          ← builder-fixture helpers
tests/
```

Doctrine for this archetype:

- One file per builder concern. No 1,000-line builder mod.
- `defineX()` is the only entry; everything else is reachable via
  builder methods.
- The materialized definition is a frozen plain object.
- Typestate is used where omitting a step silently produces a
  broken runtime (see Rust as source).
- Subpath exports per major builder concern (`./builders/route`,
  `./builders/query`).
- The README's quick-start is one chained call.

## Archetype 5 — Plugin Package

For first-party plugin packages under `plugins/*`. Examples:
`plugins/workers`, `plugins/sagas`, `plugins/triggers`,
`plugins/hello-world`.

Minimum shape:

```
mod.ts
README.md
deno.json
contracts.ts                        ← public schemas used by plugin loader
src/
  services/                         ← service entrypoints
  database/                         ← Prisma schema contributions
  jobs/ | sagas/ | triggers/        ← per-runtime declarations
  streams/                          ← event-bus declarations
  verify-plugin.ts                  ← package-owned validation
tests/
```

Doctrine for this archetype:

- The plugin package re-exports the contract types from a sibling
  package (`@netscript/sagas`, `@netscript/workers`) — it does not
  redefine them.
- Schema contributions are plain `*.prisma` files referenced from
  `database/`. They do not contain a private workspace.
- Service/background entrypoints are explicit named exports.
- A `verify-plugin.ts` runs the plugin-owned validation gate.
- The plugin's `mod.ts` is small. Most code lives in services and
  runtime declarations.

## Archetype 6 — CLI / Tooling Package

For packages that ship a binary the user runs. Examples:
`@netscript/cli`, future `packages/cli/e2e`.

Minimum shape:

```
mod.ts                              ← optional library entry
cli.ts                              ← binary entry (Cliffy program)
README.md
deno.json
src/
  domain/
  application/
    flows/                          ← per-command flows
    runner/
  presentation/
    cli/
      cli-program.ts
      commands/
      options/
      mappers/
      validators/
      factories/
  infrastructure/                   ← process, fs, http adapters
tests/
```

Doctrine for this archetype:

- The presentation layer parses input only. No filesystem, no
  process spawning, no Aspire calls in `presentation/`.
- The application layer owns flows and runners.
- The infrastructure layer owns adapters to external systems.
- The CLI surface uses `<concern>.<flow>` command names
  (`scaffold.project`, `database.postgres`, `deploy.windows`).
- The library entry (`mod.ts`) is optional and exists only if other
  packages legitimately call into the CLI's flows
  programmatically.

## How to choose

Decision order:

1. Does the package only publish *types*? → Archetype 1.
2. Does the package wrap *exactly one* external system? → Archetype 2.
3. Does the package own *long-running behavior with state*? →
   Archetype 3.
4. Is the package's *primary product* a fluent DSL? → Archetype 4.
5. Is the package a *first-party plugin*? → Archetype 5.
6. Does the package ship a *binary* the user runs? → Archetype 6.

If two archetypes apply (e.g. a runtime package that also publishes
a DSL), pick the *larger* archetype. Layers from the smaller one
fold into the larger one. Do not fragment a package across two
archetypes.

## Archetype assignments for current packages

| Package                      | Archetype                  |
| ---------------------------- | -------------------------- |
| `streams`, `runtime-config`, `config` | 1 — Small Contract |
| `database`, `queue`, `kv`, `aspire`, `cron`, `prisma-adapter-mysql`, `logger`, `telemetry` | 2 — Integration |
| `workers`, `triggers`, `watchers` | 3 — Runtime/Behavior |
| `sagas`                      | 3 — Runtime/Behavior with state-machine specialization |
| `fresh`, `fresh-ui`, `sdk`, `service`, `contracts`, `plugin` | 4 — DSL/Builder |
| `cli`                        | 6 — CLI/Tooling            |
| `shared`                     | Special — see below.       |
| `plugins/*`                  | 5 — Plugin Package         |

### About `packages/shared`

A `shared` package is an architectural smell unless every export is
a domain-neutral primitive that genuinely is shared by three or
more sibling packages. Today, `shared/utils/datetime.ts` (1,112
LOC) is the worst offender — it is reinventing `@std/datetime`. The
remediation is to delete or shrink `shared/` until what remains is
either (a) re-exports of `@std/*`/`crypto`/`Temporal` shaped to
NetScript policy, or (b) a single `domain/` with cross-package
identifiers (`CorrelationId`, `RunId`, `EventId`).

## Archetype checklist for review

- [ ] The package's archetype is named in its README ("This is a
      Runtime/Behavior package…").
- [ ] The folder shape matches the archetype's minimum (more is
      OK; fewer is suspicious).
- [ ] No archetype-specific folders in a package that does not
      need them (no `presentation/` in a Small Contract package; no
      `state/` in a Small Contract package).
- [ ] If two archetypes seemed to apply, the package picked the
      larger one and folded the smaller in.
