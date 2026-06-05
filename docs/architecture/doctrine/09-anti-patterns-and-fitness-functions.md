# Anti-Patterns and Fitness Functions

Axioms governed: A14 (and the negative form of every other axiom).

The doctrine survives only if it is enforced by something other than goodwill. This page does two
things:

1. Names the anti-patterns the doctrine forbids, with concrete examples from this repo.
2. Describes the fitness functions — executable gates — that turn each prohibition into a check that
   runs on every PR.

The phrase _fitness function_ is from Neal Ford, Rebecca Parsons, and Patrick Kua's _Building
Evolutionary Architectures_ (2017): an objective integrity assessment of an architectural
characteristic. Tests are architecture, not just verification.

## Anti-pattern catalog

### AP-1. Monolithic file

A single `.ts` file beyond two screenfuls (≈300 LOC) without a genuine reason — typically a long but
conceptually simple case-statement.

Examples in this repo:

| File                                                    | LOC   | Likely cause                                       |
| ------------------------------------------------------- | ----- | -------------------------------------------------- |
| `cli/src/commands/init/pipeline.ts`                     | 1,869 | Pipeline orchestration + IO + telemetry + dispatch |
| `cli/src/templates/aspire/helpers/generators_test.ts`   | 1,472 | A god test file                                    |
| `workers/executor/task-executor.ts`                     | 1,287 | Executor class accumulating concerns               |
| `cli/src/capabilities/plugin/official-plugin-copier.ts` | 1,203 | Procedural copy logic with branching               |
| `shared/utils/datetime.ts`                              | 1,112 | Reinvention of `@std/datetime`                     |
| `fresh/builders/mod.ts`                                 | 1,110 | All builders in one file                           |
| `kv/tests/bridge_test.ts`                               | 1,039 | God test file                                      |
| `plugin/types.ts`                                       | 1,005 | Bag of unrelated types                             |
| `config/schema.ts`                                      | 945   | Bag of schemas                                     |
| `sagas/transports/list-transport.ts`                    | 847   | One transport with all concerns inline             |

Remediation: every file above is on the active remediation list in
[`10-codebase-verdict-and-handoff.md`](./10-codebase-verdict-and-handoff.md).

### AP-2. Helper that renames a platform primitive

A function or class that wraps `Deno.*`, Web Platform, or `@std/*` without adding a real seam. (See
[`04-modules-and-helpers.md`](./04-modules-and-helpers.md).)

### AP-3. God interface

An interface with more than three or four methods that is "the contract for everything our adapter
does." Gradually accretes optional methods that not all adapters implement.

Remediation: split by behavior. Most god interfaces fragment naturally into `Reader`, `Writer`,
`Walker`, `Watcher`.

### AP-4. Cross-package implementation inheritance

`extends BaseFromAnotherPackage`. Forbidden. Use registration against an extension axis instead.
(See [`07-composition-and-extension.md`](./07-composition-and-extension.md).)

### AP-5. Multi-level base lattice without subtype distinction

`AbstractFooBase → FooBase → AbstractFoo → Foo`. Each layer must name a real distinction; otherwise
collapse.

### AP-6. Base class with concrete methods

A "convenience" `run()` that orchestrates abstract methods is the gateway drug. Belongs on the
runner, not the base.

### AP-7. Telescoping factory

Functions with eight positional arguments. Use a typed options object, or split into a builder.
(Bloch Item 2.)

### AP-8. Premature DI container

A container introduced "for testability" when the package has six collaborators wired by one
factory. Replace with constructor injection; tests use direct replacement.

### AP-9. Premature abstraction (the Wet Codebase failure)

Two callers with similar shapes deduped behind one helper that grows flags as a third caller
diverges. Replace with two clearly- named sibling implementations.

### AP-10. Defensive `try/catch` inside handlers

A handler that swallows or remaps every error has hidden the supervisor's job. Throw rich errors;
let the supervisor decide.

### AP-11. Hidden globals

Module-load-time `Deno.openKv()`, `new Logger()`, or `process.env`-reading singletons. Composition
root only.

### AP-12. `Date.now()` and `setTimeout` in handlers

The clock is a port. Schedule via the clock; read time via the clock. Exception: trace timestamps
captured for diagnostics, where monotonic reads are local.

### AP-13. `console.log` in published code

Published packages emit structured events through a telemetry port or a normalized error reporter.
`console.*` is reserved for the CLI's presentation layer or for `examples/` scripts.

### AP-14. Re-exporting upstream packages

`export { z } from 'zod';`. Consumers import Zod. We do not become a vendor for upstream surface.

### AP-15. `interface IFoo` / `type FooT`

Hungarian or .NET-style prefixes on TypeScript names. Forbidden. Names use the noun for the thing.

### AP-16. `utils/`, `helpers/`, `common/`, `lib/` folders

Generic folder names hide unnamed concerns. Rename for the role or move into the appropriate
`application/`, `adapters/`, or `diagnostics/` folder.

### AP-17. `interfaces/` folder for the package's own interfaces

Interfaces are _ports_ (consumed contracts, in `ports/`) or _type declarations_ (colocated with the
things they describe). The folder name `interfaces/` blurs the distinction.

### AP-18. Test snapshots of giant generated strings

The CLI E2E prompt called these out specifically. Tests assert _semantics_ — parsed structure, file
existence, command exit code, event counts — not entire generated strings. Snapshot tests are
allowed only where the literal text _is_ the public contract (stable CLI help banner,
intentionally-stable error code text).

### AP-19. Permissions assumed silently

A package that calls `fetch` without declaring its network requirement, or `Deno.openKv()` without
declaring KV. The README documents required permissions and the package may check them at startup
with a clear error.

### AP-20. Workspace `compilerOptions.lib` override missing `deno.unstable`

A workspace member that overrides `compilerOptions.lib` must include `"deno.unstable"` or transitive
imports of unstable APIs (`Deno.Kv`) produce type errors. (See `CLAUDE.md`.) The doctrine elevates
this from gotcha to lint.

### AP-21. Flat command-surface folder

A `presentation/`, `routes/`, or `handlers/` folder with more than 12 immediate children is a flat
list with a path prefix. Vertical slicing (R-FOLD-LAYERING-MODE) groups by feature. The cardinality
cap (R-FOLD-CARD) enforces the split. Examples in this repo at audit time include any CLI
presentation folder with 30+ command files.

### AP-22. Useless re-export barrel

A `mod.ts` inside `src/` whose only purpose is `export * from './x.ts'` for files in the same
folder. Sub-directory barrels duplicate information (the file system already lists the folder),
force a second source of truth for naming, and hide which symbols are actually used by the importer.
Allowed barrels: package root `mod.ts`, declared subpath-export entry files, the package's
`testing.ts`. All other `mod.ts` / `index.ts` under `src/` are violations unless the file genuinely
contains aggregation logic (constructing one symbol from many).

### AP-23. Inline command body in composition

A composition root that contains `.command(...)`, `.option(...)`, `.action(...)`, route registration
chains, or message handler inline definitions has buried application code in wiring code. The
composition becomes the largest file in the package and the hardest to refactor. Composition
declarativity (R-COMP-DECL) requires the composition body to be wiring only; presentation is defined
elsewhere and _referenced_ by the composition.

### AP-24. Switch-over-tagged-union instead of registry

```ts
// AP-24
function getEngineAdapter(engine: DbEngine): DbAdapter {
  switch (engine) {
    case 'postgres':
      return new PostgresAdapter();
    case 'mysql':
      return new MySqlAdapter();
    case 'sqlite':
      return new SqliteAdapter();
  }
}
```

Every new variant requires editing the switch. Replace with a typed registry (`DbEngineRegistry`)
populated at composition. Switch is acceptable only when the union is closed by domain constraint
(e.g. `'left' | 'right'`) and the cases are not implementations.

### AP-25. Side effect in non-edge file

A non-edge file (any file outside `bin/`, `examples/`, the package's adapters, or a designated edge
folder) that calls `Deno.exit`, `Deno.cwd`, `Deno.env`, `Deno.build`, `Deno.readDir`,
`Deno.readFile`, `Deno.writeFile`, `Deno.Command`, `console.log`, `console.error`, `console.warn`,
`fetch`, `Date.now`, or `setTimeout` outside the cases listed in §"Effects at edges" of the relevant
archetype.

The remedy is constructor injection of the appropriate port. The archetype docs name the exact path
constraints; the doctrine records the universal prohibition.

## Fitness functions — the executable gates

Each anti-pattern above maps to a check. The doctrine declares the check; the next engineering doc
implements it as a script in `.llm/tools/`.

### F-1. File-size lint

Walks `packages/**/*.ts` and `plugins/**/*.ts`. Flags files over 500 LOC; fails over 800. Allows
opt-out via a `// arch:size-ok
<reason>` comment that requires a justification on the PR.

### F-2. Helper-reinvention scan

Static check that compares helper bodies against a known list of `@std/*` and Web Platform
primitives. Flags helpers that wrap them with no extra logic. Implemented as an AST-walking script.

### F-3. Layering check

Static dependency-direction check. For each `packages/*` package:

- Files in `domain/` may import `@std/*`, the package's own `domain/`, and external types only.
- `ports/` may import `domain/` only.
- `application/` may import `domain/` and `ports/` only.
- `adapters/` may import `domain/`, `ports/`, and external clients.
- `presentation/` may import `application/` and `domain/` only.

Implemented via `deno doc` AST traversal or a manual graph walk.

### F-4. Inheritance audit

For each `class X extends Y`:

- Y must live in the same package (no cross-package inheritance).
- Y must be `abstract` and contain _only_ abstract members.
- Inheritance depth ≤ 3.

Implemented via the TypeScript compiler API.

### F-5. Public surface audit

`deno doc --json <package>` runs and the doctrine asserts:

- Every exported symbol has a JSDoc summary.
- Every exported function has `@param` and `@returns`.
- Every exported function has at least one `@example`.
- The total exported symbol count per `mod.ts` is ≤ 20 (or split into subpaths).

This is the single most important fitness function: it is what turns "good docs" from aspiration
into a measurable score.

### F-6. JSR publishability gate

`deno publish --dry-run` runs in CI for every package. Slow types and unportable filenames fail the
build.

### F-7. Doc-score gate

JSR's documentation score must be 100 for stable packages. Below 100 is a failed build for stable;
experimental packages must declare `@experimental` in JSDoc.

### F-8. Workspace `lib` override check

For each member `deno.json` whose `compilerOptions.lib` overrides the root, verify it includes
`"deno.unstable"`.

### F-9. Permission declaration check

Each package's README has a "Required permissions" block. CI parses it and asserts it matches the
actual `Deno.*` calls in the package's source. Mismatch fails the build.

### F-10. Test-shape audit

Static check that no `_test.ts` exceeds 500 LOC. Test files that fail are flagged for splitting.

### F-11. Forbidden-folder lint

Forbids `utils/`, `common/`, `lib/`, `helpers/`, `interfaces/` under `packages/*/src/`. Allows
`application/`, `adapters/`, `domain/`, `ports/`, `runtime/`, `state/`, `middleware/`, `presets/`,
`registry/`, `diagnostics/`, `presentation/`, `testing/`, `internal/` per the role vocabulary.

### F-12. Naming-convention lint

Forbids `interface I*`, `type *_T`, `class *Impl`, `class Abstract*` where the class is not actually
abstract.

### F-13. Saga and runtime invariants

Custom checks for stateful packages:

- Every `defineSaga()` declaration has at least one terminal transition.
- Every `defineWorker()` declares a retry policy.
- Every long-running runtime exposes a `stop()` method.
- Every async public method whose body performs IO accepts an `AbortSignal`.

### F-14. Console-log lint

Forbids `console.*` outside `presentation/` and `examples/`.

### F-15. Re-export-of-upstream lint

Forbids `export * from 'npm:...'` and `export { ... } from 'jsr:...'` when the source is not a
`@netscript/*` package or `@std/*`.

### F-16. Folder-cardinality lint

Walks every directory under `packages/*/src/` and `plugins/*/src/`. Fails any directory with more
than 12 immediate children (combined files + subdirectories) and any path nested more than 4 levels
below `src/`. Maps to AP-21 and R-FOLD-CARD.

Per-archetype overrides may relax the cap (e.g. an `assets/` folder of `.template` files is exempt,
declared in the archetype doc). The override is named, not implicit.

### F-17. Abstract-derived co-location lint

For each `abstract class X` declared under `packages/*/src/`:

- Locate every `class Y extends X` in the same package.
- If the count of concrete subclasses is ≥ 2, assert the abstract and all subclasses live in the
  same folder.
- The folder name is the plural concept (heuristic: matches `<concept-name>s` or
  `<concept-name>-<plural-suffix>`).

Maps to R-FOLD-AD-COLOC. Implemented via the TypeScript compiler API.

### F-18. Sub-barrel lint

Forbids `mod.ts` and `index.ts` files inside `packages/*/src/**` _subdirectories_ (depth ≥ 2 from
the package root). Allowed locations: package-root `mod.ts`, files declared as a subpath export in
the package's `deno.json`, the package's `extension-points.ts`, and `testing.ts`. Maps to AP-22.

A sub-barrel that genuinely aggregates (constructs one symbol from many, not just re-exports) is
allowed via a `// arch:barrel-ok
<reason>` comment, recorded in the audit registry.

## How fitness functions ship

The doctrine prescribes the _checks_; implementation lives in `.llm/tools/`:

- `check-file-sizes.ts`
- `check-helper-reinvention.ts`
- `check-layering.ts`
- `check-inheritance.ts`
- `check-doc-coverage.ts`
- `check-workspace-lib.ts`
- `check-naming.ts`
- `check-saga-invariants.ts`
- `check-console-usage.ts`
- `check-upstream-reexport.ts`
- `check-folder-cardinality.ts`
- `check-abstract-coloc.ts`
- `check-sub-barrels.ts`

Each script:

- runs as `deno task arch:check:<name>`,
- emits structured JSON output (parseable by `.llm/tools/parse-deno-check-errors.ts` style tooling),
- exits non-zero on violation,
- supports a `--allow <package>` opt-out (with mandatory justification recorded in
  `.llm/arch-debt.md`).

A composite task `deno task arch:check` runs all of them.

## Architectural debt as a registry

When a violation is acknowledged but cannot be fixed in the same PR, it is recorded in
`.llm/arch-debt.md`:

```md
## packages/cli/src/commands/init/pipeline.ts — AP-1 (1,869 LOC)

- Reason: pending refactor under refactor/cli-e2e-validation-suite
- Owner: <name>
- Target: split per concern by 2026-Q3
- Linked plan: .llm/tmp/run/refactor-cli-e2e-validation-suite/plan.md
```

The registry is the doctrine's pressure release. Without it, the gates either become noise (silenced
everywhere) or block work (blocking everywhere). With it, debt is _named_, _owned_, and
_time-bounded_.

## Fitness-function checklist for review

- [ ] PR runs `deno task arch:check`. All checks pass or are explicitly opted-out with a
      `arch-debt.md` entry.
- [ ] New code never introduces a new `arch-debt.md` entry without a time-bounded plan.
- [ ] Removed `arch-debt.md` entries match the fix in the PR.
- [ ] New fitness functions added in the same PR as the doctrine change that motivated them (gates
      and rules ship together).
