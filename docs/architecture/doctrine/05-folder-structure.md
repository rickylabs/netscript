# Folder and File Structure

Axioms governed: A8.

A package's folder tree is a public document. A reader who runs `tree packages/<x> -L 2` should be
able to predict where any behavior lives in under thirty seconds. The shape below is the
_vocabulary_; not every package needs every folder, and the [archetypes](./06-archetypes.md) page
lists the minimum viable shapes. This page defines what the folders mean and what they forbid.

## The canonical role vocabulary

| Folder              | Role and rule                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| `mod.ts`            | The public surface. Re-exports only. No logic.                                                           |
| `cli.ts`            | A standalone CLI entry, when the package ships a binary. Calls `presentation/cli/`. No logic.            |
| `src/`              | All source. Anything outside `src/` is metadata, tests, or generated artifacts.                          |
| `src/domain/`       | Pure types and small invariants. No IO imports. Where the _vocabulary_ of the bounded context lives.     |
| `src/ports/`        | Interfaces the package _needs from the outside_ (consumed contracts). One verb per port; small.          |
| `src/application/`  | Orchestration: builders, flows, runners, gates, planners. Depends on domain + ports, never on adapters.  |
| `src/adapters/`     | Implementations of ports for a named technology. One adapter per file. Class name = `<Tech><Port>`.      |
| `src/runtime/`      | Per-request / per-instance context, lifecycle objects, scoped collaborators.                             |
| `src/state/`        | State shapes for stateful packages (saga state, worker job state). Plain types; no methods.              |
| `src/middleware/`   | Composable cross-cutting handlers (telemetry, retry, validation).                                        |
| `src/presets/`      | `start*`/`create*` factories that wire defaults for common scenarios.                                    |
| `src/registry/`     | Plugin / handler registration tables, with explicit duplicate-name guards.                               |
| `src/diagnostics/`  | Error normalization, structured incident records, evidence capture utilities.                            |
| `src/presentation/` | CLI / HTTP / RPC surface that maps external input to application requests. Thin.                         |
| `src/testing/`      | Public testing helpers (fakes, in-memory adapters, builders for fixtures). Re-exported via subpath.      |
| `src/internal/`     | Implementation-only utilities not exported. Never appears in `mod.ts` or any subpath export.             |
| `tests/`            | Cross-cutting test suites that span multiple modules. Single-module tests live colocated as `*_test.ts`. |
| `examples/`         | Compilable example programs the README links to. Each has its own `deno.json` task.                      |

## Layering rules

The dependency direction is strict, top to bottom:

```
presentation  →  application  →  ports  →  domain
                                                 ↑
adapters  ─────────────────────────────────────────
                       ↘
                       infrastructure (external clients)
```

Operationalized:

- `domain/` imports nothing from elsewhere in the package.
- `ports/` may import from `domain/` only.
- `application/` may import from `domain/` and `ports/`. Never from `adapters/`.
- `adapters/` import from `domain/` and `ports/`. They may import external clients (`Deno.Kv`, `pg`,
  `redis`). They do **not** import from `application/`.
- `runtime/`, `middleware/`, `presets/`, `registry/`, `diagnostics/` follow the same rule as
  `application/`.
- `presentation/` may import from `application/` and `domain/`. Never directly from `adapters/`.
- `testing/` imports the package's own surface and may import in-memory adapters; it never imports
  tech-specific adapters.

A static fitness test enforces the direction
([`09-anti-patterns-and-fitness-functions.md`](./09-anti-patterns-and-fitness-functions.md)).

## Naming conventions for filenames

- Lowercase, hyphenated: `worker-store.ts`, `postgres-database-flow.ts`.
- The filename equals the dominant exported name in `kebab-case`. A file exporting `WorkerStore` is
  `worker-store.ts`.
- Tests are colocated as `<subject>_test.ts` (or `<subject>.test.ts`, consistent across the package;
  we prefer `_test.ts` to match Deno conventions).
- Type-only files end in `-types.ts` only when the file truly contains no runtime export. We prefer
  to colocate types with the primary class/function unless types are shared by multiple sibling
  files.
- Builder fragments use the suffix that names their role: `*-builder.ts`, `*-builder-state.ts`,
  `*-builder-validation.ts`, `*-definition-factory.ts`. The pattern is consistent across packages.

## Subpath exports mirror the folder structure

The `exports` map in `deno.json` is the curated subset of the folder tree that callers may import:

```jsonc
{
  "name": "@netscript/sagas",
  "exports": {
    ".": "./mod.ts",
    "./builders": "./src/application/builders/mod.ts",
    "./testing": "./src/testing/mod.ts",
    "./adapters/postgres": "./src/adapters/postgres-saga-store.ts",
    "./adapters/kv": "./src/adapters/kv-saga-store.ts"
  }
}
```

Rules:

- A folder gets a subpath export only if callers may legitimately import it directly. `domain/`,
  `ports/`, `runtime/` are usually _not_ exported — they are internal to the package.
- Subpath export keys use lowercase, kebab-case, and group by role (`./adapters/<tech>`,
  `./presets/<scenario>`).
- Adding or removing a subpath is a _breaking change_ for the package's semver. The audit gate flags
  it.

## Tests — colocated and cross-cutting

Two patterns coexist:

1. **Colocated tests** — for a unit whose tests are scoped to its own public exports:
   `worker-store.ts` ↔ `worker-store_test.ts` in the same folder.
2. **Cross-cutting tests** — for behavior that spans modules: `tests/scaffold-flow_test.ts`,
   `tests/integration/postgres_test.ts`.

Anti-patterns:

- A _single_ test file covering many subjects (e.g. `bridge_test.ts` at 1,039 LOC). Split into
  per-subject files.
- A test file imported as a helper by other tests. Use `testing/` for shared fixtures; tests should
  not import other tests.

## Per-package convention defaults

Each `packages/*` package owns:

- `deno.json` — name, version, exports, tasks. The package's tasks are local; root tasks orchestrate
  the workspace.
- `README.md` — the public face. Must include: installation, quick-start, the verb table for the
  public surface, links to subpath exports, and a "see also" pointing to other `@netscript/*`
  packages it composes with.
- `CHANGELOG.md` — semver-aligned. Edits to `mod.ts` or `exports` imply a CHANGELOG entry.

Packages may include `examples/` and `docs/` subfolders. Both are optional.

## What does _not_ belong inside a package

- Generated artifacts (lock files for sub-deps, build outputs). Use `.gitignore` and CI artifacts.
- Top-level `utils/` or `helpers/` folders. Helpers earn names matching their _role_, not their
  genericity.
- A `common/` folder. "Common" is a synonym for "we did not name it."
- A `core/` folder unless the package genuinely has a kernel versus extensions split (rare).
- An `interfaces/` folder. Interfaces live with their consumers (`ports/`) or with their concrete
  implementation when there is no consumer/implementer split.

## Mapping the rules onto the current repo

The inventory revealed the following structural states:

| Package             | Verdict                                                                               |
| ------------------- | ------------------------------------------------------------------------------------- |
| `packages/streams`  | OK — small contract, flat shape appropriate.                                          |
| `packages/aspire`   | OK shape, minor — `helpers/` should be renamed by role.                               |
| `packages/config`   | Refactor — `schema.ts` (945 LOC) splits per concern.                                  |
| `packages/cron`     | OK shape — `adapters/`, `interfaces/` already named. Rename `interfaces/` → `ports/`. |
| `packages/database` | OK shape — same `interfaces/` → `ports/` rename.                                      |
| `packages/fresh`    | Restructure — `builders/mod.ts` (1,110) splits per builder concern with subpaths.     |
| `packages/fresh-ui` | OK — small.                                                                           |
| `packages/kv`       | Refactor — `bridge_test.ts` (1,039) splits per scenario.                              |
| `packages/plugin`   | Restructure — `types.ts` (1,005) splits per concept; introduce `domain/`, `ports/`.   |
| `packages/queue`    | OK shape.                                                                             |
| `packages/sagas`    | Mostly OK — `transports/list-transport.ts` (847) splits.                              |
| `packages/sdk`      | OK shape; high cohesion already.                                                      |
| `packages/shared`   | Major refactor — `utils/datetime.ts` (1,112) replaced by `@std/datetime`/`Temporal`.  |
| `packages/triggers` | Refactor — flat top-level files lift into `application/`, `state/`, `runtime/`.       |
| `packages/workers`  | Refactor — `executor/task-executor.ts` (1,287) splits per concern.                    |
| `packages/cli`      | Major refactor — `pipeline.ts` (1,869), `official-plugin-copier.ts` (1,203) split.    |

`plugins/*` largely follow the plugin archetype: the contribution folders (`contracts/`,
`services/`, `database/`, `streams/`, `jobs/`) sit at the package root as siblings of `src/`, not
nested under it (see `06-archetypes.md#archetype-5--plugin-package`). The convergence is the desired
outcome.

## Folder cardinality (R-FOLD-CARD)

A folder is a navigation aid. A folder with thirty siblings stops being a folder and becomes a flat
list with a path prefix. The cardinality rule:

- A directory under `src/` has at most **12 immediate children** (files + subfolders combined).
  Beyond 12, the folder must introduce subfolder grouping or split.
- Nesting depth from `src/` to a leaf file is at most **4 levels**. Beyond 4, the structure has lost
  its mapping to the domain and must collapse.
- The rule applies to every directory inside `src/`, not only top level. `src/application/init/`
  with 18 files is a violation; `src/presentation/` with 35 files is a violation.

The numbers are not arbitrary. They are the working-memory budget (7 ± 2) plus a buffer for
`mod.ts`, `README.md`, and one or two test files. A reader who opens a folder with 12 entries can
hold all of them in mind; a reader who opens 30 entries cannot.

The cardinality cap is _not_ a license to over-nest. A folder with two siblings is fine; do not
introduce subfolders before there are siblings to justify them. The rule against over-nesting is
captured by R-FOLD-AD-COLOC and R-A6-N4 (per-archetype emergence rules).

## Horizontal versus vertical layering (R-FOLD-LAYERING-MODE)

The role vocabulary above is _horizontal_ layering: every folder names a technical role, and content
is grouped by role across features. This is correct for **shared kernels** — the parts of a package
consumed by multiple features.

It is wrong for **command-like surfaces** — folders that hold many sibling user-facing entry points
(CLI commands, HTTP routes, message handlers, dashboard pages). Horizontal layering on a command
surface produces flat 30-file `presentation/` folders and hides the domain partition.

For command-like surfaces, use **vertical (feature) layering**: each feature is a folder, and inside
that folder the role-named files coexist (the command, the use case, the input shape, the optional
pipeline, the steps). The feature folder is the unit of navigation; the auditor opens it and sees
the entire feature in one view.

Per-archetype rules name when each layering mode applies. As a default:

- Kernel layers (`domain`, `ports`, `application`, `adapters`, `presentation/abstracts`, `assets`)
  are horizontal.
- Command-side surfaces (CLI features, HTTP route groups, message handler groups) are vertical.
- An archetype's docs make the boundary explicit. See `archetypes/ARCHETYPE-6-cli-tooling.md`
  §Layering modes.

## Abstract-derived co-location (R-FOLD-AD-COLOC)

When a base class has two or more concrete subclasses, the base and all subclasses live in the
**same folder**, named with the _plural concept_:

```
src/domain/plugin-kinds/
├── plugin-kind.ts            ← abstract
├── api-plugin-kind.ts
├── worker-plugin-kind.ts
├── saga-plugin-kind.ts
└── trigger-plugin-kind.ts
```

The rationale:

- A reader scanning the folder sees the polymorphic family at once. The abstract acts as a table of
  contents for the concretes.
- Adding a new variant is a sibling file, not a refactor.
- The folder name is the axis name (`plugin-kinds`, `db-engines`, `deploy-targets`); reading the
  path tells the reader what varies.

Conversely, if a base class has only **one** concrete subclass, do not introduce a folder. Keep the
abstract alongside the concrete in the parent folder. Premature pluralization is a tax.

When a third subclass arrives, the move from "two flat siblings" to "one folder with three siblings"
is a single rename and a folder creation; layering rules survive.

## Folder/file checklist for review

- [ ] Folder names appear in the role vocabulary above (or are explicitly justified).
- [ ] Folder cardinality (R-FOLD-CARD): ≤ 12 immediate children per directory; ≤ 4 levels of nesting
      from `src/`.
- [ ] Layering direction is respected: `presentation → application → ports → domain`,
      `adapters → ports`, no upstream imports.
- [ ] Layering mode (R-FOLD-LAYERING-MODE) matches the surface: horizontal for shared kernels,
      vertical for command-like surfaces, per the active archetype.
- [ ] Abstract-derived co-location (R-FOLD-AD-COLOC): an abstract with ≥ 2 concretes shares a
      plural-named folder with all its concretes.
- [ ] Subpath exports correspond to folders callers genuinely need.
- [ ] No file exceeds two screenfuls; nothing exceeds 500 LOC without a refactor justification on
      the PR.
- [ ] Tests are colocated for unit-scope; cross-cutting tests in `tests/`. No god test file.
- [ ] No `utils/`, `common/`, `interfaces/` folder names.
- [ ] README quick-start uses only public subpaths.
