# Archetype Gate Matrix

This matrix is the source of truth for required gates per archetype. It mirrors the Phase A plan and
points back to `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md`.

Legend:

- `required`: must pass or have accepted debt.
- `optional`: required only when touched by the run.
- `subtype`: required for archetype subtypes that own the relevant behavior.
- `n/a`: not normally applicable.

Archetype 7 (Deployment Target Adapter) is a **composite**: it folds Archetype 2 (the port/adapter
core) and Archetype 6 (the thin CLI router). Its Arch 7 column is therefore the **union** of the A2
and A6 columns — the core satisfies the Archetype 2 gates, the router satisfies the Archetype 6
gates. Its own archetype-specific gates are `F-DEPLOY-*` (see below).

## Fitness Gates

| Gate                              | Arch 1   | Arch 2   | Arch 3   | Arch 4   | Arch 5   | Arch 6   | Arch 7   |
| --------------------------------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- |
| F-1 File-size lint                | required | required | required | required | required | required | required |
| F-2 Helper-reinvention scan       | n/a      | required | required | required | n/a      | required | required |
| F-3 Layering check                | n/a      | required | required | required | required | required | required |
| F-4 Inheritance audit             | n/a      | required | required | required | n/a      | required | required |
| F-5 Public surface audit          | required | required | required | required | required | required | required |
| F-6 JSR publishability            | required | required | required | required | required | required | required |
| F-7 Doc-score gate                | required | required | required | required | required | required | required |
| F-8 Workspace lib check           | required | required | required | required | required | required | required |
| F-9 Permission decl check         | n/a      | required | required | required | required | required | required |
| F-10 Test-shape audit             | required | required | required | required | required | required | required |
| F-11 Forbidden-folder lint        | required | required | required | required | required | required | required |
| F-12 Naming-convention lint       | required | required | required | required | required | required | required |
| F-13 Saga/runtime invariants      | n/a      | n/a      | required | n/a      | subtype  | n/a      | n/a      |
| F-14 Console-log lint             | required | required | required | required | required | n/a      | required |
| F-15 Re-export-upstream lint      | required | required | required | required | required | required | required |
| F-16 Folder-cardinality lint      | required | required | required | required | required | required | required |
| F-17 Abstract-derived co-location | required | required | required | required | required | required | required |
| F-18 Sub-barrel lint              | required | required | required | required | required | required | required |
| F-19 Scoped source gate runners   | required | required | required | required | required | required | required |

## Archetype-specific Gates

Archetype 6 (CLI / Tooling) v2 introduces archetype-specific gates **F-CLI-1 … F-CLI-31** documented
in `archetypes/ARCHETYPE-6-cli-tooling.md` §"Fitness Gates". These gates extend (do not replace) the
universal F-* family above.

Future archetypes may publish their own gate IDs in the same namespace pattern (e.g. `F-SVC-*`,
`F-PLG-*`).

Archetype 7 (Deployment Target Adapter) introduces archetype-specific gates **F-DEPLOY-1** (each
target adapter implements the uniform 7-op contract) and **F-DEPLOY-2** (no target-specific business
logic in the command surface; conventions live in the core), documented in
`archetypes/ARCHETYPE-7-deploy-target-adapter.md` §"Fitness Gates". They are seeded **`reviewed`**
(not `gated`) until the deployment packages (#339–#343) exist, then promoted to `gated`. They extend
(do not replace) the universal F-* family and the composed A2/A6 gates.

## Other Gate Families

| Gate family                | Arch 1   | Arch 2   | Arch 3   | Arch 4   | Arch 5   | Arch 6   | Arch 7   |
| -------------------------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- |
| Static gates               | required | required | required | required | required | required | required |
| Runtime/Aspire validation  | n/a      | optional | required | optional | required | optional | required |
| Browser validation         | n/a      | n/a      | n/a      | subtype  | n/a      | n/a      | n/a      |
| Consumer import validation | optional | required | required | required | required | required | required |

## Phase A Reporting

Fitness scripts now exist: `deno task arch:check` runs `.llm/tools/fitness/check-doctrine.ts` over
the owned package/plugin roots, and `.llm/tools/fitness/` holds the remaining gate scripts —
`check-doctrine.ts` for anti-pattern coverage (AP-1..AP-30), `audit-jsr-package.ts` for per-package
JSR readiness, and `check-ds-no-raw-hex.ts` / `check-ds-color-utilities.ts` for the design-system
token gates. Where a script does not cover a required gate, evaluators report it as:

- `PASS` with manual evidence,
- `PENDING_SCRIPT` with manual evidence and no detected violation,
- `DEBT_ACCEPTED` with a matching registry entry,
- `FAIL` or `FAIL_DEBT` when a violation is found.

The absence of a script is not permission to omit the gate from the plan or evaluation.
