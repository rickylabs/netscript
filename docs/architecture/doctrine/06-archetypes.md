# Package Archetypes

Axioms governed: A9.

One folder layout for every package is wrong. A 200-line schema
package does not need a `presentation/` layer. A runtime behavior
package cannot survive without one. This page defines seven
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
`plugins/streams`.

**Thinness law.** Convention-bearing primitives — contracts, base
services, schema/runtime conventions, and event/kind vocabularies —
live in the sibling `@netscript/plugin-<kind>-core` package. A
first-party `plugins/*` package is **thin userland glue**: it wires
and composes those core-owned primitives into a concrete integration
and re-exports sibling contracts; it does not redefine contracts or
re-implement a core convention. The reference shape is
`@netscript/plugin-auth-core` + its thin adapters — the core package
carries the convention, the plugin is the minimal wiring that binds it
to a provider. The harness archetype profile
`.llm/harness/archetypes/ARCHETYPE-5-plugin.md` states the same law for
harness runs.

Minimum shape — the contribution folders sit at the package root as
siblings of `src/`, not nested under it. This is the observed
first-party layout (`plugins/workers`, `plugins/sagas`,
`plugins/triggers`, `plugins/streams`) and it is authoritative:

```
mod.ts                              ← small package-root surface
README.md
deno.json
verify-plugin.ts                    ← package-owned validation gate
contracts/                          ← public schemas re-exported from the sibling -core package
services/                           ← service entrypoints
database/                           ← Prisma schema contributions (optional)
jobs/ | sagas/ | triggers/          ← per-runtime declarations (optional)
streams/                            ← event-bus declarations (optional)
src/                                ← internal wiring / composition
tests/
```

A scaffolded plugin also carries integration/tooling edge files at the
root (`cli.ts`, `scaffold.ts`, `scaffold.plugin.json`,
`scaffold.runtime.json`, `package.json`). These are edges, not doctrine
contribution axes, and do not change the archetype's shape.

Doctrine for this archetype:

- The plugin re-exports the contract types from its sibling
  `@netscript/plugin-<kind>-core` package
  (`@netscript/plugin-workers-core`, `@netscript/plugin-sagas-core`) —
  it does not redefine them.
- Convention-bearing logic — loading/registration/schema/runtime
  conventions and event/kind vocabularies — is imported from the
  sibling `-core` package, never re-implemented in the plugin.
- Schema contributions are plain `*.prisma` files referenced from
  `database/`. They do not contain a private workspace.
- Service/background entrypoints are explicit named exports.
- A `verify-plugin.ts` runs the plugin-owned validation gate.
- The plugin's `mod.ts` is small. Most code lives in services and
  runtime declarations that wire core primitives.

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

## Archetype 7 — Deployment Target Adapter

For the deployment feature: a **composite** archetype that ships one
uniform way to deploy a NetScript app to many *targets* (bare-metal
Windows/Linux, Docker/Compose, Deno Deploy, Aspire-driven cloud
runtimes). It is *not* a new package *shape* a single package picks
over its true archetype; it is a **named cross-package pattern** that
composes two existing archetypes and folds neither:

- **Archetype 2 (Integration)** supplies the port/adapter core: a
  package-owned `OsServicePort` (bare-metal — servy + systemd adapters)
  plus cloud adapters (docker/compose/aca wrapping `aspire publish` /
  `aspire deploy`; deno-deploy wrapping `deno deploy`). Each *target*
  is one adapter behind the stable port — the target is the named
  extension axis (A11), not a new abstraction layer.
- **Archetype 6 (CLI / Tooling)** supplies the presentation: `netscript
  deploy <target> <verb>` parses input and routes to an adapter. The
  command surface is a **thin router** — no target-specific business
  logic lives in it.

A9's "pick the larger, fold the smaller" applies: Archetype 7 is the
larger, named pattern that folds A2 and A6 for the deployment domain,
giving every adapter one conformance target. A deploy flow that is
*only* a CLI command with no port and a single target stays Archetype
6; Archetype 7 applies once the port/adapter seam *and* multi-target
routing exist.

Minimum shape (a package-agnostic seam, not a fixed folder tree — the
core is Archetype 2, the router is Archetype 6):

```
<deploy-core>/                         ← Archetype 2 core
  ports/
    os-service-port.ts                 ← OsServicePort (bare-metal seam)
  adapters/                            ← one file per target
    servy-os-service.ts                ← bare-metal (Windows)
    systemd-os-service.ts              ← bare-metal (Linux)
    aspire-<runtime>.ts                ← wraps aspire publish/deploy
    deno-deploy.ts                     ← wraps deno deploy
  application/
    deploy-target-registry.ts          ← target → adapter, closed-on-key

<cli>/…/features/deploy/               ← Archetype 6 thin router
  deploy-group.ts                      ← routes <target> <verb>; no target logic
```

Doctrine for this archetype:

- **Uniform adapter contract.** Every target adapter implements the same
  op set — `plan`/`emit`, `up`, `down`, `status`, `logs`, `rollback`,
  `secrets`. A target implements the subset it supports; Aspire-driven
  adapters delegate `up`/`plan` to the Aspire CLI rather than
  reimplementing it (A7 — wrap upstream, do not reinvent).
- **Target config extends the shared base.** Each target's config member
  spreads `DeployTargetBaseSchema` (the `@netscript/config` deployment
  base contract). A target adds only its own fields. No per-target
  config base-class hierarchy (A5 — composition over inheritance).
- **Thin router, core-centralized conventions.** The command surface
  only parses and routes. Convention-bearing primitives — health
  gating, OTEL wiring, secrets handling, rollback — live in the **core**,
  shared across targets, never re-implemented per target (plugin-thinness
  / core-centralization law).
- **Crash boundaries are explicit (A13).** Bare-metal activation is
  health-gated and paired with `rollback`; cloud `rollback` maps to the
  platform-native mechanism — it is not silently a no-op.
- **The port is justified, not premature (A11).** A second adapter is
  foreseeable by construction (servy + systemd + cloud), so the
  `OsServicePort` seam is warranted; do not add a target-specific base
  class where an adapter behind the port suffices.

> **#305 cross-reference.** This entry is durable archetype prose so the
> doctrine revamp (#305) can absorb it verbatim into the revamped
> archetype chapter and lift its `F-DEPLOY-*` gates into the fitness
> registry. It names the LAW (the seam + the op contract), not a concrete
> `deploy-core` package — deploy today lives inside `packages/cli`
> (Archetype 6) and the core is extracted in a later wave (deployment
> epic #327, slices #339–#343).

> **Shipped seed.** A placeholder port already ships on main: the 3-op
> `DeployTargetPort` (`build` / `install` / `uninstall`, all optional)
> and its stub reference adapter `WindowsServiceDeployTarget` (key
> `windows-service`) under `packages/cli` (landed by commit `3137e455`,
> an unrelated command-registry slice — not this epic). It maps into the
> canonical lifecycle above as `build → plan`/`emit`, `install → up`,
> `uninstall → down`; `status`, `logs`, `rollback`, and `secrets` are
> net-new ops the seed does not yet have. The 7-op contract is canonical
> and the seed is a stub the epic expands to the full
> `OsServicePort`/cloud-adapter surface; the final verb vocabulary
> (keep `build`/`install`/`uninstall`, adopt `up`/`down`, or a hybrid)
> locks at the first real adapter (#339/#340).

## How to choose

Decision order:

1. Does the package only publish *types*? → Archetype 1.
2. Does the package wrap *exactly one* external system? → Archetype 2.
3. Does the package own *long-running behavior with state*? →
   Archetype 3.
4. Is the package's *primary product* a fluent DSL? → Archetype 4.
5. Is the package a *first-party plugin*? → Archetype 5.
6. Does the package ship a *binary* the user runs? → Archetype 6.
7. Does it deploy an app to *multiple targets* behind a port/adapter
   seam with a thin CLI router? → Archetype 7 (composite; a single-target
   CLI deploy flow with no port stays Archetype 6).

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
| _future_ `deploy-core` (not yet extracted; deploy today folded in `cli` / A6) | 7 — Deployment Target Adapter (composite) |
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
- [ ] A deployment package that composes A2 + A6 is declared
      Archetype 7, and every target is an adapter behind the shared
      port (not a target base-class hierarchy).
- [ ] The deploy command surface is a thin router — no
      target-specific business logic; health, OTEL, secrets, and
      rollback live in the core.
