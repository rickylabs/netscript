# Archetype 6 — CLI / Tooling (v2)

> v2 amendment supersedes v1. v1 was a generic "thin presentation, fat application, infra adapters"
> rule and proved too permissive in practice (flat 30-file presentation folders, inline command
> bodies in composition, base classes that orchestrated lifecycle). v2 names the structural rules
> that prevent each failure mode and binds them to executable fitness gates.

## Doctrine Reference

- Axioms: A1, A2, A4, A5, A6, A7, A8, A9, A10, A11, A13, A14.
- Primary sections:
  - `docs/architecture/doctrine/02-public-surface.md`
  - `docs/architecture/doctrine/03-base-and-derived-classes.md` (incl. R-BASE-L2)
  - `docs/architecture/doctrine/05-folder-structure.md` (incl. R-FOLD-CARD, R-FOLD-LAYERING-MODE, R-FOLD-AD-COLOC)
  - `docs/architecture/doctrine/06-archetypes.md#archetype-6--cli--tooling-package`
  - `docs/architecture/doctrine/07-composition-and-extension.md` (incl. R-COMP-DECL, R-COMP-EXT-MANIFEST)
  - `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md`
- Anti-patterns: AP-1, AP-2, AP-3, AP-4, AP-5, AP-6, AP-7, AP-8, AP-9, AP-11, AP-13, AP-14, AP-15,
  AP-16, AP-18, AP-19, AP-20, AP-21, AP-22, AP-23, AP-24, AP-25.
- Universal fitness functions: F-1, F-2, F-3, F-4, F-5, F-6, F-7, F-8, F-9, F-10, F-11, F-12, F-15,
  F-16, F-17, F-18. F-14 excludes allowed CLI presentation output.
- Archetype-specific fitness functions: F-CLI-1 … F-CLI-30 (see §"Fitness Gates").

## When This Archetype Applies

Use this profile for packages that ship a binary, command flows, scaffolding, deployment tooling, or
other user-run automation. The CLI may also expose a library surface (`mod.ts`), but only when
consumers legitimately call the flow programmatically; otherwise the only public artifact is the
binary.

## Layering modes (R-FOLD-LAYERING-MODE)

Archetype 6 mixes both layering modes:

- **Kernel** is _horizontal_: pure types, ports, application abstracts
  - registries, adapters, presentation abstracts, output renderers, assets. Each folder names a
    technical role.
- **Surfaces** (`public/`, `maintainer/`) are _vertical_: each feature is a folder that contains the
  command, the use case, the input shape, optionally a pipeline + steps, optionally per-feature
  adapters.
- The kernel-surface boundary is enforced by F-CLI-3 (no surface ↔ surface imports) and F-CLI-4
  (kernel never imports from surfaces).

## Greenfield Folder Shape

```
packages/<cli-pkg>/
├── deno.json
├── mod.ts                                  # JSR public surface
├── maintainer.ts                           # gated; never published
├── testing.ts                              # in-memory adapters, fixtures
├── bin/
│   ├── <cli>.ts                            # public binary
│   └── <cli>-dev.ts                        # maintainer binary
└── src/
    ├── kernel/                             # horizontal core
    │   ├── domain/
    │   │   ├── errors/                     # CliError + concretes
    │   │   ├── values/                     # value types, ids, paths
    │   │   └── <axis-plural>/              # one folder per polymorphic family
    │   ├── ports/                          # *-port.ts only
    │   ├── application/
    │   │   ├── abstracts/                  # spine + layer-2 abstracts
    │   │   └── registries/                 # one Registry concrete per axis
    │   ├── adapters/
    │   │   ├── file-system/
    │   │   ├── logger/
    │   │   ├── process/
    │   │   ├── workspace-resolvers/
    │   │   ├── scaffolders/
    │   │   ├── templates/
    │   │   └── <other-port>/               # one folder per port
    │   ├── presentation/
    │   │   ├── abstracts/                  # CliCommand, CliCommandGroup,
    │   │   │                               # CliRoot, ScaffoldCommand,
    │   │   │                               # ListCommand, DeployStepCommand
    │   │   └── output/                     # OutputEvent + renderers
    │   ├── assets/                         # all .template files; typed registry
    │   │   ├── manifest.ts
    │   │   ├── template-registry.ts
    │   │   └── <group>/                    # contracts, plugins, services, …
    │   └── extension-points.ts             # R-COMP-EXT-MANIFEST
    ├── public/                             # vertical features
    │   ├── composition.ts                  # declarative; R-COMP-DECL
    │   ├── deps.ts                         # imports of jsr:@netscript/* only
    │   ├── adapters/                       # public-only adapters (e.g. JSR)
    │   └── features/
    │       └── <feature>/
    │           ├── <feature>-group.ts      # if multi-sub-feature
    │           ├── <sub-feature>/
    │           │   ├── <verb>-<noun>-command.ts
    │           │   ├── <verb>-<noun>.ts            # use case
    │           │   ├── <verb>-<noun>-input.ts
    │           │   └── steps/                       # if pipeline
    │           │       └── <verb>-step.ts
    │           └── …
    └── maintainer/                          # same shape; monorepo deps
        ├── composition.ts
        ├── deps.ts
        ├── adapters/                        # maintainer-only adapters
        └── features/
            └── <feature>/…
```

The shape is normative: deviations require an explicit override in the package's README §"Archetype
6 v2 deviations" with rationale, and the deviation is recorded in `arch-debt.md` until resolved.

## Spine and Layer-2 Abstracts

Every Archetype 6 package declares the **five spine abstracts** (stub-only, per §3 doctrine):

| Spine class                 | Role                                                             |
| --------------------------- | ---------------------------------------------------------------- |
| `CliCommand<Input, Result>` | A single user-facing command. Owns one verb.                     |
| `CliCommandGroup`           | A non-leaf node grouping commands by domain (`contracts`, `db`). |
| `CliRoot`                   | The composition entry. Owns the top-level command list.          |
| `UseCase<Input, Result>`    | One application operation. Pure given its ports.                 |
| `Registry<TKey, TValue>`    | One extension axis. Closed-on-key, validated.                    |

A package may add **layer-2 abstracts** when R-BASE-L2 is satisfied. Recommended candidates by
demonstrated repetition:

| Layer-2                         | Spine parent | Captures                                    | Required when                    |
| ------------------------------- | ------------ | ------------------------------------------- | -------------------------------- |
| `ScaffoldCommand`               | `CliCommand` | dry-run/force/yes flags + project root      | ≥ 2 scaffold commands            |
| `ListCommand`                   | `CliCommand` | output format flag + entry-table render     | ≥ 2 list commands                |
| `DeployStepCommand`             | `CliCommand` | shared deploy context + lifecycle phase     | ≥ 2 deploy step commands         |
| `Pipeline<TStep>`               | `UseCase`    | sequenced step iteration + evidence capture | ≥ 1 multi-step user-visible flow |
| `PipelineStep<TInput, TOutput>` | (none)       | step contract: prepare/execute/inspect      | ≥ 2 steps in any pipeline        |
| `Manifest<TKey, TValue>`        | `Registry`   | typed key enum + bidirectional file scan    | ≥ 1 file-backed registry         |
| `OutputRenderer`                | (none)       | render `OutputEvent` to a sink              | ≥ 2 output formats               |

Each layer-2 abstract co-locates with its concretes per R-FOLD-AD-COLOC (folder name = plural
concept).

## Archetype 6 v2 rules (R-A6-N1 … R-A6-N13)

The rules below extend the universal doctrine with CLI-specific constraints. Each is enforced by a
fitness gate.

| Rule     | Statement                                                                                                                                                                                                      | Gate               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| R-A6-N1  | Folder cardinality ≤ 12 children; depth ≤ 4 from `src/`.                                                                                                                                                       | F-16 / F-CLI-25    |
| R-A6-N2  | Kernel uses horizontal layering; per-surface command code uses vertical (feature) slicing.                                                                                                                     | F-CLI-21           |
| R-A6-N3  | An abstract with ≥ 2 concretes lives in one plural-named folder with all subclasses.                                                                                                                           | F-17 / F-CLI-30    |
| R-A6-N4  | A feature folder splits into sub-feature folders when ≥ 2 sibling sub-features exist; not before.                                                                                                              | F-CLI-21           |
| R-A6-N5  | Composition file body matches the declarative shape: `class XCli extends CliRoot { topLevel() { return [<news>]; } }` plus a single `createXCli(...)` factory. No inline `.command()`/`.option()`/`.action()`. | F-CLI-27           |
| R-A6-N6  | A multi-step user-visible operation delegates to a `Pipeline<Step>` subclass living in the same feature folder under `steps/`.                                                                                 | F-CLI-21           |
| R-A6-N7  | Commands emit `OutputEvent`. `console.log`/`console.error`/`console.warn` is allowed only under `kernel/presentation/output/**` and `kernel/adapters/logger/**`.                                               | F-CLI-26           |
| R-A6-N8  | `Deno.exit` only in `bin/**`. `Deno.cwd`/`Deno.env`/`Deno.build`/`Deno.readDir`/`Deno.readFile`/`Deno.writeFile`/`Deno.Command` only in `kernel/adapters/**` and `bin/**`.                                     | F-CLI-15, F-CLI-16 |
| R-A6-N9  | Per-layer file naming regex passes: presentation `*-command.ts` or `*-group.ts`; application `<verb>-<noun>.ts`; ports `*-port.ts`; adapters `<tech>-<port>.ts` or `<tech>-<role>.ts`.                         | F-CLI-21           |
| R-A6-N10 | A package with ≥ 2 extension axes exports `kernel/extension-points.ts` aggregating every `Registry`.                                                                                                           | F-CLI-31           |
| R-A6-N11 | Barrel files (`mod.ts`/`index.ts`) inside `src/**` subdirectories are forbidden, except declared subpath-export entries and `kernel/extension-points.ts`.                                                      | F-18 / F-CLI-20    |
| R-A6-N12 | `new <X>(Adapter\|Resolver\|Runner\|Scaffolder\|Renderer\|Logger\|Pipeline\|Step\|Registry)\(` only in `composition.ts`, `deps.ts`, `bin/**`, abstract self-reference, or test fixtures.                       | F-CLI-19           |
| R-A6-N13 | Per-layer file size: presentation ≤ 150 LOC; application use cases ≤ 250 LOC; adapters ≤ 350 LOC; abstracts ≤ 200 LOC; assets `.template` exempt.                                                              | F-CLI-1, F-CLI-2   |

## Predict-the-folder table

The structural contract: the auditor opens any folder and predicts its contents from the path alone.

| Folder pattern                                  | Predicted contents                                                                 |
| ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/kernel/domain/<concept-plural>/`           | one abstract `+` N concretes; no IO; no `Deno.*`                                   |
| `src/kernel/ports/`                             | `*-port.ts` interface files; no implementations                                    |
| `src/kernel/application/abstracts/`             | spine + layer-2 abstracts; no concretes                                            |
| `src/kernel/application/registries/`            | concrete `Registry` subclasses, one per axis                                       |
| `src/kernel/adapters/<port>/`                   | optional `<port>-base.ts` + concrete adapters                                      |
| `src/kernel/presentation/abstracts/`            | command/group/root + scaffold/list/step abstracts                                  |
| `src/kernel/presentation/output/`               | `OutputEvent` types + renderer abstract + concrete renderers                       |
| `src/kernel/assets/<group>/`                    | `.template` files only; no `.ts`                                                   |
| `src/kernel/extension-points.ts`                | re-exports every `Registry` class with documentation                               |
| `src/<surface>/composition.ts`                  | declarative `class extends CliRoot` + `createXCli(...)` factory                    |
| `src/<surface>/deps.ts`                         | only the imports allowed for the surface (JSR for public, monorepo for maintainer) |
| `src/<surface>/adapters/`                       | surface-only adapters; one folder per adapter                                      |
| `src/<surface>/features/<feature>/`             | group file + sub-feature folders, OR command + use case + input                    |
| `src/<surface>/features/<feature>/<sub>/`       | command, use case, input, optional pipeline + `steps/`                             |
| `src/<surface>/features/<feature>/<sub>/steps/` | `<verb>-step.ts` files, all extending `PipelineStep`                               |
| `bin/`                                          | one file per binary; only place `Deno.exit` is called                              |

## Fitness Gates

Universal gates F-1 … F-15, F-16 (folder cardinality), F-17 (abstract co-location), F-18
(sub-barrel) apply per the doctrine matrix. F-14 excludes allowed CLI presentation output (renderers
and logger adapters).

Archetype-specific gates F-CLI-1 … F-CLI-31:

| Gate     | Asserts                                                                                                                                                                                                           | Detection                  |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| F-CLI-1  | per-layer file size: presentation ≤ 150, use cases ≤ 250, adapters ≤ 350, abstracts ≤ 200                                                                                                                         | LOC scan + path classifier |
| F-CLI-2  | hard cap 500 LOC any `.ts` outside `kernel/assets/`                                                                                                                                                               | LOC scan                   |
| F-CLI-3  | `src/public/**` and `src/maintainer/**` do not import each other                                                                                                                                                  | import graph               |
| F-CLI-4  | `src/kernel/**` does not import from `src/public/**` or `src/maintainer/**`                                                                                                                                       | import graph               |
| F-CLI-5  | `**/presentation/**` and `**/features/**` do not call `Deno.*` directly                                                                                                                                           | regex + AST                |
| F-CLI-6  | exactly one `createXCli` factory per binary; binary files ≤ 60 LOC                                                                                                                                                | AST + LOC                  |
| F-CLI-7  | no `interface I[A-Z]` or `type I[A-Z]\w*` exports                                                                                                                                                                 | AST                        |
| F-CLI-8  | `deno doc --html packages/<cli>/mod.ts` reports 100% coverage                                                                                                                                                     | external                   |
| F-CLI-9  | `deno publish --dry-run --allow-slow-types=false` succeeds                                                                                                                                                        | external                   |
| F-CLI-10 | `deno publish --dry-run` exit 0 modulo declared `JSR_DEPS_PENDING`                                                                                                                                                | external                   |
| F-CLI-11 | no monorepo terms (`monorepoRoot`, `--source local`, `LOCAL_PACKAGES`) under `src/public/**` or `src/kernel/**`                                                                                                   | regex                      |
| F-CLI-12 | no `interfaces/` directory anywhere under `src/`                                                                                                                                                                  | file scan                  |
| F-CLI-13 | no `_shared.ts` under `**/presentation/**` or `**/features/**`                                                                                                                                                    | file scan                  |
| F-CLI-14 | `@cliffy/*` imports only under `**/presentation/**`, `bin/**`, and `**/composition.ts`                                                                                                                            | regex                      |
| F-CLI-15 | `Deno.exit` only in `bin/**`                                                                                                                                                                                      | regex                      |
| F-CLI-16 | `Deno.cwd\|Deno.env\|Deno.build\|Deno.readDir\|Deno.readFile\|Deno.writeFile\|Deno.Command\|Deno.openKv` only in `kernel/adapters/**`, `<surface>/adapters/**`, and `bin/**`                                      | regex                      |
| F-CLI-17 | every `**/*-command.ts` exports exactly one class extending `CliCommand` (or a layer-2 sub-abstract)                                                                                                              | AST                        |
| F-CLI-18 | every `**/application/**` non-abstract file exports exactly one class extending `UseCase`, `Pipeline`, or `Registry`                                                                                              | AST                        |
| F-CLI-19 | `new \w+(Adapter\|Resolver\|Runner\|Scaffolder\|Renderer\|Logger\|Pipeline\|Step\|Registry)\(` only in `composition.ts`, `deps.ts`, `bin/**`, abstract self-reference, test fixtures                              | regex + path               |
| F-CLI-20 | barrel files (`mod.ts`, `index.ts`) only at: package root, `testing.ts`, declared subpath-export targets, `kernel/extension-points.ts`                                                                            | file scan                  |
| F-CLI-21 | per-layer file naming regex passes (per R-A6-N9)                                                                                                                                                                  | path scan                  |
| F-CLI-22 | `.template` files only under `kernel/assets/**`                                                                                                                                                                   | file scan                  |
| F-CLI-23 | no backtick string literal ≥ 20 lines outside `kernel/assets/**`                                                                                                                                                  | regex/AST                  |
| F-CLI-24 | `TemplateRegistry` keys ≡ files under `kernel/assets/**` (bidirectional)                                                                                                                                          | runtime check              |
| F-CLI-25 | every directory under `src/**` has ≤ 12 immediate children                                                                                                                                                        | file scan                  |
| F-CLI-26 | `console.log\|console.error\|console.warn` only under `kernel/presentation/output/**` and `kernel/adapters/logger/**`                                                                                             | regex                      |
| F-CLI-27 | `**/composition.ts` body matches the declarative shape (R-A6-N5) — class extending `CliRoot` returning the top-level command list, plus a single factory function; no inline `.command()`/`.option()`/`.action()` | AST                        |
| F-CLI-28 | concrete adapters / use cases / commands receive dependencies via constructor; `application/**` and `presentation/**` never `import` from `adapters/**` outside type-only imports                                 | AST                        |
| F-CLI-29 | folder cardinality ≤ 12 also applies to `src/<surface>/features/<feature>/`; sub-feature emergence (R-A6-N4) enforced                                                                                             | file scan                  |
| F-CLI-30 | abstract + derived co-location (R-A6-N3) under `src/kernel/**`                                                                                                                                                    | AST + path                 |
| F-CLI-31 | `kernel/extension-points.ts` exports every `Registry` subclass declared under `src/**` (or the registry is explicitly marked internal)                                                                            | AST                        |

The F-CLI-* fitness functions have **no dedicated script** — the `check-cli-*.ts` family was deleted
in S9 (see `gates/fitness-gates.md`). In every phase they are recorded as `PENDING_SCRIPT` with
manual/structural evidence, backed by the mechanical `check-doctrine.ts`
(`deno task arch:check`, per-root).

## Required Gates in Order

1. Static gates: package check slice (`deno task check:packages`), `deno task lint`,
   `deno task fmt --check`.
2. Universal fitness gates: F-1, F-3, F-5 (CLI-aware), F-6, F-7, F-8, F-9, F-10, F-11, F-12, F-15,
   F-16, F-17, F-18.
3. Archetype-6 fitness gates: F-CLI-1 … F-CLI-31. These have no dedicated script; report
   `PENDING_SCRIPT` with manual/structural evidence, backed by `check-doctrine.ts`
   (`deno task arch:check`, per-root).
4. Runtime gates: required when a slice changes a command that starts services, scaffolds projects,
   or shells out to Aspire, Docker, or process adapters.
5. Consumer gates: scaffolded-project compile and import smoke tests required when the slice changes
   generated outputs, exported flows, command names, or help output.

## Skills to Activate

- `netscript-doctrine`
- `netscript-harness` (when the run is harnessed)
- `jsr-audit` for any slice touching `mod.ts`, `deno.json` exports, or JSDoc
- domain skills for generated targets (`aspire`, `deno-fresh`) when relevant

## Read First

1. `docs/architecture/doctrine/06-archetypes.md#archetype-6--cli--tooling-package`.
2. `docs/architecture/doctrine/05-folder-structure.md` (incl. R-FOLD-CARD, R-FOLD-LAYERING-MODE, R-FOLD-AD-COLOC).
3. `docs/architecture/doctrine/03-base-and-derived-classes.md` (incl. R-BASE-L2).
4. `docs/architecture/doctrine/07-composition-and-extension.md` (incl. R-COMP-DECL, R-COMP-EXT-MANIFEST).
5. The CLI's `mod.ts`, `maintainer.ts`, both `bin/*.ts`, both `<surface>/composition.ts`, the kernel
   `extension-points.ts`.
6. The current feature most relevant to the slice (one folder under
   `src/<surface>/features/<feature>/`).
7. Relevant debt entries.

## Anti-Patterns to Watch For

- **AP-1** — command pipeline or generated-template monolith.
- **AP-6** — base flow with concrete orchestration. Spine abstracts are stub-only.
- **AP-11** — env, filesystem, process, or network access outside `kernel/adapters/**`,
  `<surface>/adapters/**`, or `bin/**`.
- **AP-18** — giant string snapshots instead of semantic checks on generated output.
- **AP-19** — permissions and external tool requirements absent from the README permissions block.
- **AP-21** — flat command-surface folder. Every `**/presentation/**` or `**/features/**` folder
  respects R-A6-N1 and R-A6-N4.
- **AP-22** — useless re-export barrel. Sub-folder `mod.ts` is forbidden (F-CLI-20).
- **AP-23** — inline command body in composition. Composition is declarative (R-A6-N5, F-CLI-27).
- **AP-24** — switch-over-tagged-union for variants. Use a typed registry from
  `kernel/extension-points.ts`.
- **AP-25** — side effect in non-edge file. Adapters and binaries own all
  `Deno.*`/`console.*`/`fetch`.

## False-Done States

- Files moved without splitting: a 1500-LOC pipeline relocated to
  `src/<surface>/features/.../pipeline.ts` is still AP-1.
- Surface separation declared but not enforced: `F-CLI-3`/`F-CLI-4` reported `PASS` without a script
  run; manual evidence is empty.
- Composition body still calls `.command()` / `.option()` / `.action()` (R-A6-N5 violated).
- Vertical slicing claimed but `presentation/` retains 30 sibling command files; feature folders not
  extracted (R-A6-N1, R-A6-N4 violated).
- Layer-2 abstract introduced with one concrete subclass (R-BASE-L2 violated).
- `console.log` left in command files because "it's just for help output" (F-CLI-26 violated).
- `Deno.exit` called from a command for an early exit (F-CLI-15 violated; throw `CliExitError`
  instead).
- Tests assert string snapshots of generated output without semantic checks (AP-18).
- Generated project compiles were skipped or asserted only by type-check.

## Rescope Triggers

- A slice that requires splitting an existing monolith first.
- A slice that touches the spine abstract API (cascades through every concrete).
- A slice that introduces a new layer-2 abstract (must demonstrate R-BASE-L2 satisfaction with two
  existing concretes).
- A command vocabulary change (verb names, group names).
- Generated project validation reveals template/runtime drift.
- A surface boundary change (kernel ↔ public ↔ maintainer).
- Folder-cardinality violation discovered mid-slice; the structural fix exceeds the slice envelope.

## Design Checkpoint Expectations

The design checkpoint names: command surface, public flow APIs, extension axes (with their registry
classes), generated outputs, adapters, permission requirements, semantic test strategy,
generated-project validation, and consumer impact.

The design section in `worklog.md` must include:

- The five spine abstract names and their type parameters.
- The layer-2 abstracts the package introduces, each with the two existing concretes that justify it
  (R-BASE-L2).
- The vertical-feature catalog: every `<surface>/features/<feature>/` folder, its sub-features, and
  its commands.
- The extension axes: every registry, its key type, its value type, where it is populated, where it
  is consumed.
- Ports for command execution, file system, process, HTTP probing, templates, prompts, output
  rendering.
- Constants for command names, exit codes, output formats.
- Composition declarativity contract: which file owns the top-level command list (R-A6-N5).
- Slice ordering: kernel domain + ports + abstracts first; registries + adapters next; features one
  at a time; surface composition last.
- Contributor path for adding (a) a new variant on an extension axis, (b) a new feature, (c) a new
  sub-feature inside an existing feature, (d) a new template.

## Concept of Done

Beyond the universal slice checklist in `workflow/run-loop.md`:

- the package's `src/` matches the greenfield shape (or every deviation is documented);
- every spine and layer-2 abstract is stub-only / R-BASE-L2 compliant;
- every command file is presentation only and ≤ 150 LOC;
- every composition file passes R-A6-N5 (declarative shape);
- every folder under `src/` passes R-A6-N1 (cardinality ≤ 12, depth ≤ 4);
- every abstract with ≥ 2 concretes passes R-A6-N3 (co-located);
- the kernel `extension-points.ts` lists every `Registry`;
- `bin/*.ts` is the only place that calls `Deno.exit`;
- `kernel/presentation/output/**` + `kernel/adapters/logger/**` are the only files that call
  `console.*`;
- `deno task arch:check` runs all F-CLI-1 … F-CLI-31 (or every one that is `PENDING_SCRIPT` has
  manual evidence);
- `deno doc` reports 100% coverage on `mod.ts`;
- `deno publish --dry-run` succeeds (modulo declared `JSR_DEPS_PENDING`);
- generated projects compile and pass smoke imports;
- the README documents permissions and the `Archetype 6 v2 deviations` section is empty or every
  entry is matched in `arch-debt.md`.

## Historical Notes

- v1 archetype permitted "thin presentation, fat application, infra adapters" without naming the
  failure modes. In practice this produced flat command folders (AP-21), inline composition (AP-23),
  and base classes that orchestrated lifecycle (AP-6).
- v2 names the rules R-A6-N1 … R-A6-N13 and binds each to a fitness gate. Evaluator findings now
  reference rule IDs, not prose.
- Run `refactor-cli-doctrine-rewrite` (Phase 11) is the first application of v2 to `@netscript/cli`
  and is the reference implementation.
