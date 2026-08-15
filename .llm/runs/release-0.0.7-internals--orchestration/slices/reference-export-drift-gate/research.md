# Research — reference-export-drift-gate

## Re-baseline

- Carried-in sources: issue [#1296](https://github.com/rickylabs/netscript/issues/1296), its one
  milestone-rollover comment, issues #1110/#1108/#1293, PR #1292, and the coordinator's frozen leaf
  contract.
- Re-derived on 2026-08-15 from branch bootstrap head `1b6d6d5c289a7b3065ce75e985db5179f89a9b99`,
  whose merge-base with `origin/main` is the frozen baseline
  `baf1cdf67a4e931af17b4772ddf6101f36152184`.
- The branch contains only the coordinator's bootstrap commit beyond baseline. The runtime-created
  untracked `codex-thread-ids.md` is not author-owned and will not be staged.
- Issue #1296 is open on milestone 27, now titled `0.0.7`. Issue #1293 remains open at
  `status:impl`; its MySQL paths are outside this leaf.

The carried-in measurements are partly stale. A1's narrow name search is reproducible, but it missed
a gate-catalog indirection and a `Deno.Command` child edge: the checker is already enforced
fail-closed in non-draft CI. This was an error in the coordinator's dispatch premise, not an author
finding. A3's four named root exports are correct, but the full shipped-example inventory contains
four other source imports from entrypoints that do not export their symbols.

## Live acceptance contract

Issue #1296 has five close-gated boxes. Independent re-baselining classifies them as follows:

| Issue row                                               | Baseline state                                                                                                                                                                                                                                                | Leaf treatment                                                                                                                                             |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contracts examples import from the real exporting path  | **partially satisfied**: five of the nine implementation-example lines are correct (two CRUD, three root); all four specifically briefed root symbols also resolve, but four implementation examples import six symbols from a root that does not export them | Preserve the baseline-earned examples and repair only the four incorrect `@example` import lines under the coordinator's JSDoc-only rescope.               |
| Contracts reference inventory advertises no non-exports | manual reference page/checker pass, but the same four shipped examples advertise six symbols from non-exporting entrypoints                                                                                                                                   | Correct `paginated-query.ts`, `transform-helpers.ts`, `schemas/filters.ts`, and `schemas/pagination.ts`; do not edit the already-green reference page.     |
| Fresh UI reference matches published exports            | not satisfied                                                                                                                                                                                                                                                 | Repair against all six entrypoints and enable an explicit symbol-coverage policy.                                                                          |
| Intentional omissions are machine-readable              | not satisfied                                                                                                                                                                                                                                                 | Replace boolean/silent symbol coverage with a discriminated, reason-bearing policy consumed by the checker.                                                |
| Maintainer regeneration runbook and verification wiring | enforcement is already satisfied fail-closed in non-draft CI; direct discoverability and the runbook are absent                                                                                                                                               | Preserve the enforced `docs:accuracy` chain, add a named task and explicit Pages step, and document the update procedure without claiming new enforcement. |

The four live rows in the frozen brief therefore remain meaningful. Contracts reconciliation is
partly baseline-earned and partly live; the last row is a discoverability/runbook repair over an
already-enforced gate, not new enforcement.

## Findings

### F1 — the checker is already enforced fail-closed; its direct identity is undiscoverable

The exact unpiped baseline checks were:

```text
deno run --no-lock --allow-read --allow-env --allow-run .llm/tools/docs/check-exports-drift.ts
Exports & Symbols drift check: PASS
EXPORT_DRIFT_RAW_EXIT=0

grep -rnE 'check-exports-drift|exports-drift' deno.json .github/workflows/
WIRING_SEARCH_RAW_EXIT=1
```

That search cannot establish enforcement because the workflow calls a gate id and the checker is a
child spawned from source. The independently followed baseline chain is:

```text
.github/workflows/ci.yml:362-367  Docs accuracy check
  -> run-gate.ts --gate docs-accuracy --id quality-docs-accuracy
     (quality job at :282; non-draft PR guard at :287; step guard env.RUN == 'true')
  -> .llm/tools/gates/catalog.ts:59
     'docs-accuracy' -> ['deno', 'task', 'docs:accuracy']
  -> deno.json:85
     docs:accuracy -> check-accuracy-and-discoverability.ts
  -> check-accuracy-and-discoverability.ts:291-301
     spawns check-exports-drift.ts; prints child stdout/stderr and throws on nonzero
```

`deno task docs:accuracy` completed with raw exit 0 and printed its terminal PASS after the awaited
child edge. `docs:maintenance` also invokes `docs:accuracy`. The gate is therefore already enforced
fail-closed for qualifying non-draft CI and through the local accuracy/maintenance aggregates. What
is missing is discoverability:

1. a named `docs:exports-drift` task that maintainers and automation can discover and invoke;
2. an explicitly named Pages step — Pages currently runs snippets/build/links/caveats, while CI
   quality reaches export drift only as the unnamed child of `docs:accuracy`;
3. a runbook that tells maintainers how to derive and reconcile the surface.

### F2 — `docs/exports` is a stale frozen-contract entry, not a generated target

- `test -e docs/exports` returned exit 1.
- `git ls-tree -r --name-only baf1cdf67 -- docs/exports` returned no paths.
- Repository and all-history searches find no producer, consumer, task, checker, or historical
  commit for `docs/exports`; only the frozen briefing names it.
- The live authority already has the correct dependency direction: package `deno.json.exports` plus
  `deno doc --json` are derived in memory and compared directly with
  `docs/site/reference/<package>/index.md`.

Creating `docs/exports` would introduce a third inventory that can itself drift and would violate
the issue requirement not to maintain a second handwritten entrypoint list. The path will remain
absent and will be named as a deliberate non-touch in the plan.

### F3 — full nine-line Contracts implementation-example inventory is only partly correct

The inventory below enumerates every `from '@netscript/contracts…'` line in the shipped
implementation sources under `crud/`, `src/`, and `schemas/` (entrypoint self-documentation in
`mod.ts`, `crud.ts`, `query.ts`, and `transform.ts` is separately correct and is not one of these
nine implementation examples):

|  # | Source line                                  | Imported symbols / entrypoint                              | Baseline verdict                  |
| -: | -------------------------------------------- | ---------------------------------------------------------- | --------------------------------- |
|  1 | `crud/create-crud-contract.ts:6`             | `createCrudContract` from `/crud`                          | correct; `/crud` `EXIT=0`         |
|  2 | `crud/create-crud-contract.ts:250`           | `createCrudContract` from `/crud`                          | correct; `/crud` `EXIT=0`         |
|  3 | `src/application/contract-primitives.ts:72`  | `baseContract` from root                                   | correct; root `EXIT=0`            |
|  4 | `src/application/contract-primitives.ts:112` | `baseContract`, `BaseContractRoute` from root              | correct; root `EXIT=0` per symbol |
|  5 | `src/application/contract-primitives.ts:144` | `baseContract`, `BaseContractOutputRoute` from root        | correct; root `EXIT=0` per symbol |
|  6 | `src/application/paginated-query.ts:6`       | `paginatedQuery` from root                                 | **wrong**; use `/query`           |
|  7 | `src/application/transform-helpers.ts:6`     | `createTransformer` from root                              | **wrong**; use `/transform`       |
|  8 | `schemas/filters.ts:6`                       | `FilterConditionSchema`, `buildPrismaWhere` from root      | **wrong**; use `/query`           |
|  9 | `schemas/pagination.ts:6`                    | `PaginationInputSchema`, `createPaginatedOutput` from root | **wrong**; use `/query`           |

Independent unpiped `deno doc --no-lock --filter` commands also confirmed the specifically briefed
`OffsetPaginationQuerySchema` root example: `baseContract`, `BaseContractRoute`,
`BaseContractOutputRoute`, and `OffsetPaginationQuerySchema` each returned root `EXIT=0`.
`createCrudContract` returned `/crud` `EXIT=0`. These are baseline-earned and remain untouched.

### F4 — six symbols across four shipped examples use the wrong entrypoint

The raw per-symbol exit evidence is:

| Symbol                  | `packages/contracts/mod.ts` | Correct entrypoint      |
| ----------------------- | --------------------------: | ----------------------- |
| `paginatedQuery`        |                    `EXIT=1` | `query.ts` `EXIT=0`     |
| `createTransformer`     |                    `EXIT=1` | `transform.ts` `EXIT=0` |
| `FilterConditionSchema` |                    `EXIT=1` | `query.ts` `EXIT=0`     |
| `buildPrismaWhere`      |                    `EXIT=1` | `query.ts` `EXIT=0`     |
| `PaginationInputSchema` |                    `EXIT=1` | `query.ts` `EXIT=0`     |
| `createPaginatedOutput` |                    `EXIT=1` | `query.ts` `EXIT=0`     |

All four files are included by the Contracts publish set (`src/**/*.ts` or `schemas/**/*.ts`), so
their JSDoc ships. The coordinator granted a JSDoc-only rescope for exactly those four import-line
repairs (the original `paginated-query.ts` plus three additions). No runtime, type, export, or
schema change is planned. This makes `Closes #1296` honest only because the rescope covers the
entire residual inventory; the already-correct reference page, `contract-primitives.ts`, and public
root remain untouched.

### F5 — Fresh UI entrypoints are complete, but symbol coverage is disabled

`packages/fresh-ui/deno.json` publishes exactly six entrypoints:

| Entrypoint            | Target                   | Symbols reported by the checker's current `deno doc` rule |
| --------------------- | ------------------------ | --------------------------------------------------------: |
| `@netscript/fresh-ui` | `./mod.ts`               |                                                        28 |
| `/ai/render-ui`       | `./src/ai/render-ui.tsx` |                                                        11 |
| `/desktop`            | `./desktop.ts`           |                                                        35 |
| `/interactive`        | `./interactive.ts`       |                                                        82 |
| `/primitives`         | `./primitives.tsx`       |                                                        16 |
| `/registry`           | `./registry.ts`          |                                                         7 |

There are 168 unique symbols after cross-entrypoint de-duplication. All six `deno doc --json`
commands returned raw exit 0. The Fresh UI page now lists all six entrypoints, so the original "3 of
6" entrypoint defect has already been repaired by later work. The remaining defect is symbol truth:
its mapping still says `checkSymbols: false`.

Current prose meaningfully documents root helpers, icons, DataGrid, toast helpers, seven older
interactive namespaces, primitives, and render UI. It omits or contradicts newer public surface:

- `ActionMenu` and `Combobox` plus their public namespace/contracts;
- the complete `/desktop` capability/result/menu/window surface;
- the `/registry` manifest/content types;
- several render-UI node/category types and root DataGrid context types;
- the page says interactive `*Namespace` types are package-internal, but they are exported now.

The page also intentionally documents `Dropzone` as a copy-source registry component and explicitly
says it is not a package export. That is valid documentation, but a symbol parser must not confuse
copy-source tables or prop/field tables with a claimed published-symbol inventory.

### F6 — enabling the current symbol checker directly is a false-red trap

An in-memory run using the checker's current algorithms, but forcing Fresh UI symbol checking,
produced:

```text
EXPECTED=168 DOCUMENTED_PARSE=78 ERRORS=162
```

The 162 errors mix real omissions with parser artifacts. `parseDocContent()` currently treats the
first backticked cell of every Markdown table as a symbol, so `columns`, `label`, `class`,
`[attribute: string]`, `layout`, and `viz` become invented exports. Generic display names such as
`DataGridColumn<T>` do not normalize to the real `DataGridColumn`. Copy-source Dropzone types become
invented package exports even though the prose labels them as non-exports.

The checker must first distinguish symbol tables from prop/field/example tables and normalize
display-only generic suffixes. Tuning exclusions until the current 162-error output is quiet would
hide checker defects and is forbidden by the evidence contract.

### F7 — boolean coverage is the silent-incompleteness defect

`PackageMapping` currently exposes independent `checkSymbols?: boolean` and
`excludedSymbols?: string[]` fields. `false` carries no reason and makes every omission invisible.
The checker only builds an exclusion `Set` when the boolean is true. This is precisely the state
that leaves Fresh UI, Plugin, Queue, SDK, and Service silently entrypoint-only.

A discriminated coverage object fits the existing consumer:

- `mode: 'complete'` — carry a nonempty coverage reason, run `deno doc` for every derived
  entrypoint, and flatten explicit reason-bearing omission groups into the exclusion set;
- `mode: 'entrypoints-only'` — skip symbol comparison only when a nonempty reason is present;
- a reason-bearing allow-list for doc-only copy-source symbols where a page explicitly labels them
  as non-package exports.

This retains the current `Set`-based comparison, makes invalid/empty policy a hard refusal, supports
an every-run mode/reason/omission-count report, and avoids a new inventory directory or handwritten
export map.

### F8 — workflow trigger coverage already fits the leaf

`.github/workflows/pages.yml` already triggers on `docs/site/**`, `packages/**`, `plugins/**`,
`.llm/tools/docs/**`, and `deno.json` for pull requests and main pushes. Adding a named export-drift
step to its existing build job therefore covers every implementation path that can change either the
reference or its live authority. No trigger expansion, new workflow, browser, service, Docker, or
Aspire resource is necessary.

### F9 — MySQL is independently owned and must not block this leaf

Issue #1293 is open with `status:impl` and owns the Prisma MySQL exported adapter and remaining
executable-example work. Neither the frozen nine paths nor SA-1/SA-2's four added paths contain a
MySQL package or reference path. This leaf neither reads that work as a prerequisite nor changes it.

## JSR/publication surface scan

JSR audit is applicable because four shipped JSDoc files inside published `@netscript/contracts`
will change and the Fresh UI reference is derived from a published member.

| Member                       | Planned publish delta                                                                                                                                                                                    | Export map                                                            | Exact `@netscript/*` pins                                                                                                                                               | Baseline evidence / risk                                                                                                                                                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@netscript/contracts@0.0.6` | Yes: JSDoc import text changes in `src/application/paginated-query.ts`, `src/application/transform-helpers.ts`, `schemas/filters.ts`, and `schemas/pagination.ts`; no runtime/type/export/schema change. | Four entrypoints: `.`, `./crud`, `./query`, `./transform`; unchanged. | None in member imports. `@orpc/contract@^1.14.6` and root-catalog `zod` are non-NetScript dependencies.                                                                 | `audit-jsr-package` raw exit 0; dry-run OK with one sanctioned oRPC slow-type INFO. Full-export `doc:lint` raw exit 1 with nine pre-existing private-type-ref diagnostics (eight contract primitives, one CRUD), not caused or fixed by these prose-only source edits. |
| `@netscript/fresh-ui@0.0.6`  | No package file changes; reference/checker only. The plan still audits its real published surface rather than claiming "no publish delta" without inspection.                                            | Six entrypoints listed in F5; unchanged.                              | `@netscript/sdk/auto-update` and `@netscript/sdk/desktop` are both exact `jsr:@netscript/sdk@0.0.6/...`; `deps:why @netscript/sdk` raw exit 0 confirms live source use. | `audit-jsr-package` raw exit 0 and dry-run OK, while reporting existing folder/cardinality and slow-type warnings. Full-export `doc:lint` raw exit 1 with 123 existing `/interactive` diagnostics. Source repair is outside the frozen surface.                        |

Root `compilerOptions.isolatedDeclarations` is `true`. The final canonical workspace
`publish:dry-run` remains required because the Contracts JSDoc is part of the publish set. A green
dry-run will prove static packaging/isolated-declaration compatibility, not resolve the separately
reported baseline doc-lint debt or prove a real publish.

## Doctrine and debt state

- Frozen leaf archetype: `6 — CLI / Tooling`, because the changed executable surface is a
  repository-run checker/task/workflow with structured failure semantics.
- Overlays: `frontend` because the reference subject is `@netscript/fresh-ui`, and `docs` because
  the shipped artifact is a manual reference/runbook.
- Package doctrine remains explicit: Contracts is Archetype 1 / Keep; Fresh UI is Archetype 4 /
  Keep. This leaf does not re-archetype either member.
- Axioms: A1/A2 (published truth first), A7 (reuse `deno doc`, `Deno.Command`, and the existing
  checker), A8 (one checker concern), A14 (a green must prove coverage as well as compliance).
- Fitness focus: F-5 public surface, F-6 publishability, F-7 documentation, F-19 scoped verdict
  sources. The relevant existing Contracts root-layout debt is preserved; no debt entry is opened or
  closed by a JSDoc/docs/tooling repair.
- The existing Fresh UI doc-lint and structural findings are baseline observations, not authority to
  enter package source. An honest red remains red in the JSR table.

## Open questions resolved for planning

- **Must resolve now:** Create `docs/exports`? No. It is stale contract scope and duplicative.
- **Must resolve now:** Is export drift enforced? Yes. Non-draft CI already reaches it fail-closed
  through `quality` -> gate catalog -> `docs:accuracy` -> the spawned checker. The plan improves
  direct discoverability and adds an explicit Pages identity without claiming new enforcement.
- **Must resolve now:** How are omissions represented? A reason-bearing discriminated policy in
  `AUTHORITATIVE_MAPPING`, consumed directly by the existing checker.
- **Resolved by SA-1:** Fresh UI browser execution is N/A/waived for this surface. It remains
  `NOT_RUN`; the implementation lane must not request a runtime lease or fire it.
- **Must resolve now:** Are the three additional Contracts examples deferred? No. The coordinator
  granted import-line-only scope for all three, bringing the authorized implementation surface to
  thirteen paths and making closure of #1296 honest once all four residual lines are repaired.
- **Safe to defer:** Existing Fresh UI public-source doc-lint/slow-type remediation and Contracts
  oRPC private-type-ref debt; neither is part of the thirteen authorized paths.
- **Safe to defer:** Broadening symbol-complete coverage for every reference page. This leaf makes
  entrypoints-only policy explicit rather than silently claiming completeness; later leaves can
  promote packages one at a time.
