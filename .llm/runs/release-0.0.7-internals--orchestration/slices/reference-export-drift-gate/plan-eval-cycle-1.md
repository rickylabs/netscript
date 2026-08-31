# PLAN-EVAL — release-0.0.7-internals--orchestration/slices/reference-export-drift-gate

## Verdict block

| Field               | Value                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evaluated head      | `a3f6b87b599e778db950daf6ccaecd847c088d19` (asserted via `git rev-parse HEAD`, match)                                                                   |
| Base                | `baf1cdf67a4e931af17b4772ddf6101f36152184`                                                                                                              |
| PR / issue          | #1666 (draft) / closes #1296                                                                                                                            |
| Cycle               | **1 of 2**                                                                                                                                              |
| Evaluator session   | Claude Code session `68c31fcc-f93b-496f-8c0b-10e6736dded7` (background job `68c31fcc`)                                                                  |
| Route               | native Claude **Fable 5** / effort **medium** (`formal_plan_evaluation`, opposite family)                                                               |
| Artifacts evaluated | `plan.md` (as amended), `scope-amendment.md` (SA-1, governs on conflict), `research.md`, `implement.md`, frozen `leaf-contracts.json` entry (read-only) |
| Surface / archetype | frozen `6 — CLI / Tooling`; overlays `frontend`, `docs`                                                                                                 |
| **Verdict**         | **`FAIL_PLAN`**                                                                                                                                         |

One blocking finding (B1). Everything else re-derived below holds. Nothing outside this file was
written; no gate other than the read-only checks listed here was fired; `fresh-browser` stays
`NOT_RUN`.

## Blocking finding

### B1 — acceptance row 1 is materially less satisfied than research/plan/SA-1 state; three more shipped Contracts JSDoc examples import from a non-exporting root, all outside the frozen surface

The plan (F3/F4, D8, "Explicit deferrals") and PR body assert that #1296 row 1
(_"`packages/contracts` JSDoc examples import from the subpath that actually exports the symbols; a
reader copying them gets code that compiles"_) is baseline-earned except for `paginated-query.ts:6`.
I enumerated **every** `from '@netscript/contracts…'` line in shipped Contracts sources and checked
each imported symbol against the root with `deno doc --filter` (exit 1 = `Node … was not found!`):

```text
grep -rnoE "from '@netscript/contracts[^']*'" packages/contracts --include=*.ts --include=*.tsx | grep -v _test
  packages/contracts/crud/create-crud-contract.ts:6,250      -> '@netscript/contracts/crud'   (correct)
  packages/contracts/src/application/contract-primitives.ts:72,112,144 -> '@netscript/contracts' (correct; baseContract/BaseContractRoute/BaseContractOutputRoute all root EXIT=0)
  packages/contracts/src/application/paginated-query.ts:6    -> '@netscript/contracts'        (WRONG — plan already covers)
  packages/contracts/src/application/transform-helpers.ts:6  -> '@netscript/contracts'        (WRONG — NOT in plan)
  packages/contracts/schemas/filters.ts:6                    -> '@netscript/contracts'        (WRONG — NOT in plan)
  packages/contracts/schemas/pagination.ts:6                 -> '@netscript/contracts'        (WRONG — NOT in plan)

deno doc --no-lock --filter createTransformer     packages/contracts/mod.ts        -> EXIT=1 ; on transform.ts -> EXIT=0
deno doc --no-lock --filter FilterConditionSchema packages/contracts/mod.ts        -> EXIT=1 ; on query.ts     -> EXIT=0
deno doc --no-lock --filter buildPrismaWhere      packages/contracts/mod.ts        -> EXIT=1 ; on query.ts     -> EXIT=0
deno doc --no-lock --filter PaginationInputSchema packages/contracts/mod.ts        -> EXIT=1 ; on query.ts     -> EXIT=0
deno doc --no-lock --filter createPaginatedOutput packages/contracts/mod.ts        -> EXIT=1 ; on query.ts     -> EXIT=0
deno doc --no-lock --filter paginatedQuery        packages/contracts/mod.ts        -> EXIT=1 ; on query.ts     -> EXIT=0
```

All three additional files are in the publish set (`packages/contracts/deno.json` `publish.include`
has `src/**/*.ts` and `schemas/**/*.ts`), so they ship JSDoc a reader cannot copy — the same class
of defect as `paginated-query.ts:6`, in three more places.

Why this blocks the plan rather than the implementation:

1. `research.md` F3/F4 and `plan.md` D8 / "Explicit deferrals and non-scope" record row 1 as
   already-correct apart from one file. That statement is false, so the "reconcile row 1 honestly
   and visibly" obligation from the brief cannot be met by the plan as written.
2. `plan.md` locks `Closes #1296`. Merging under this plan would auto-close an issue whose row 1 is
   still unmet in three shipped files.
3. The three files are **outside the frozen nine (+1) paths**. Fixing them needs a coordinator
   rescope; declining to fix them needs a coordinator decision on closure. Either way this is not a
   decision the author may take alone, and it is not "safe to defer" — it changes what the PR may
   honestly claim to close. That is an unflagged open decision under `gates/plan-gate.md`
   ("Open-decision sweep" / "Deferred scope explicit").
4. SA-1 A4's sequencing rationale ("#1533's example-compile gate would go red on
   `paginated-query.ts:6` — the very JSDoc import this leaf corrects") is incomplete: #1533 would go
   red on the three files above as well, so landing #1666 first does not prevent that red.

**Required fix (author, then coordinator decision):**

- Update `research.md` (F3/F4) with the full nine-line import inventory above and its `deno doc`
  evidence; correct `plan.md` D8, the row-1 statement in the "Live acceptance contract" table, and
  the deferrals section so that row 1 is recorded as **partially** satisfied at baseline with the
  residual named file-by-file.
- Resolve, in `plan.md`, one of:
  - (a) request from the coordinator a **JSDoc-only** scope amendment for
    `packages/contracts/src/application/transform-helpers.ts`,
    `packages/contracts/schemas/filters.ts`, `packages/contracts/schemas/pagination.ts` (edit
    surface: the `@example` import line only; same publish-delta treatment as `paginated-query.ts`
    in the JSR table), and add them to S1 and to validation row 11's path audit; **or**
  - (b) keep the frozen surface, state explicitly that row 1 remains **unmet** for those three files
    after this leaf, and have the coordinator decide whether `Closes #1296` stands (it should not
    without (a) or a follow-up issue that the PR references without a closing keyword).
- Update the SA-1 A4 rationale (or add an SA-2 note) so the #1533 sequencing argument reflects all
  four affected files, not one.

I did not perform any of this. It is a coordinator scope decision.

## Verified claims (re-derived, not trusted)

| #        | Claim                                                         | Result                               | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------- | ------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1       | Checker real and passing                                      | **holds**                            | `deno run --no-lock --allow-read --allow-env --allow-run .llm/tools/docs/check-exports-drift.ts` → `DRIFT_RAW_EXIT=0`, `Exports & Symbols drift check: PASS`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| A1       | "wired to nothing"                                            | **false, as research says**          | `grep -rnE 'check-exports-drift\|exports-drift' deno.json .github/workflows/` → `EXIT=1` (no hits). But `.llm/tools/docs/check-accuracy-and-discoverability.ts:292-301` spawns `deno run --allow-all .llm/tools/docs/check-exports-drift.ts`, throws on nonzero child code; `deno.json:85` `docs:accuracy` runs that script (`--allow-run=deno`), `deno.json:90` `docs:maintenance` includes `docs:accuracy`; `.llm/tools/gates/catalog.ts:59` maps `docs-accuracy` → `deno task docs:accuracy`. `deno task docs:accuracy` → `ACCURACY_RAW_EXIT=0`, terminal `docs accuracy: PASS`. No workflow runs `docs:accuracy`/`docs:maintenance`/`docs-accuracy` (`grep … .github/workflows/` → `EXIT=1`). Research F1 is accurate; the missing pieces (named task, workflow step, runbook) are correctly identified. |
| A3       | Row 1 baseline-satisfied for the four Step-0 symbols          | **holds for those four**, but see B1 | `deno doc --filter` on `packages/contracts/mod.ts`: `baseContract`, `BaseContractRoute`, `BaseContractOutputRoute`, `OffsetPaginationQuerySchema` all `EXIT=0`; `contract-primitives.ts:72,112,144` import from root.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| F4       | `paginatedQuery` absent from root, present on `/query`        | **holds**                            | root filter `EXIT=1` (`Node paginatedQuery was not found!`); `query.ts` filter `EXIT=0`, its own JSDoc uses `@netscript/contracts/query`. `paginated-query.ts:6` still imports from root at head.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| F5       | Six Fresh UI entrypoints, 28/11/35/82/16/7 symbols, 168 union | **holds exactly**                    | scratch `.llm/tmp/pe-count.ts` (outside measured roots) using `deno doc --no-lock --json` per `deno.json.exports` entry → `{".":28,"./ai/render-ui":11,"./desktop":35,"./interactive":82,"./primitives":16,"./registry":7} UNION 168`, zero `declarationKind: 'private'` nodes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| F6       | Forcing symbol checking today: 168 / 78 / 162                 | **holds exactly**                    | scratch `.llm/tmp/pe-f6.ts` importing the checker's own `parseDocContent`/`checkSymbolsDrift` → `EXPECTED 168 DOCUMENTED_PARSE 78 ERRORS 162` = 126 OMITS + 36 INVENTS. The 36 invented names are the prop/field/generic artifacts research lists (`columns, rows, label, class, [attribute: string], key, header, width, cell, render, DataGridColumn<T>, DataGridProps<T>, DataGridRow<T>, hint, icon, active, accept, multiple, onFile, onFiles, onReject, onDrop, onDragOver, onPaste, children, DROPZONE_*, Dropzone*, ShowProps<T>, layout, viz, data`). Parser at `check-exports-drift.ts:270-283` does take the first backticked cell of every table row.                                                                                                                                            |
| D5       | `Symbol`-header boundary safe for already-complete pages      | **holds**                            | Header cells in `docs/site/reference/{config,contracts,telemetry,fresh-ui}/index.md`: config 13×`Symbol`+1×`Export`; contracts 12×`Symbol`+1×`Export`; telemetry 9×`Symbol` (padded, trims to `Symbol`)+1×`Export`; fresh-ui 10×`Symbol` plus `Prop`/`Shape`/`Field`/`Category`/… tables (the false-positive sources). Restricting to `Symbol`-headed tables will not create false reds on Config/Contracts/Telemetry — provided the header match is applied after `trim()`.                                                                                                                                                                                                                                                                                                                                 |
| D4       | Dropzone types are in a `Symbol`-headed table                 | **holds**                            | `fresh-ui/index.md:153-161`; prose at 125-126 labels Dropzone copy-source / not a package export.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| F2       | `docs/exports` absent, no history                             | **holds**                            | `test -e docs/exports` → `EXIT=1`; `git ls-tree -r --name-only baf1cdf67 -- docs/exports` → 0 paths.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| F8       | Pages triggers already cover the edit surface                 | **holds**                            | `pages.yml:6-22,25-41` include `docs/site/**`, `packages/**`, `plugins/**`, `.llm/tools/docs/**`, `deno.json`. Note the `classify` job can skip the build by policy (`ci-classify-changes.ts`); root `deno.json` **tasks-only** changes → `pages:false`, package source/`packages/*/deno.json` changes → `pages:true`, `.llm/tools/docs/**` → `pages:true`. So a drift step in the build job fires for every input that can change export truth.                                                                                                                                                                                                                                                                                                                                                             |
| SA-1 T4  | Existing test passes                                          | **holds**                            | `deno test --no-lock --allow-all .llm/tools/docs/check-exports-drift_test.ts` → `TEST_RAW_EXIT=0`, `1 passed \| 0 failed`. The single test exercises pure functions (`deriveExpectedExports`/`parseDocContent`/`checkExportsDrift`), not process exit.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Contract | Nine `fileSurfaces`, `fresh-browser` in `provingGates`        | **holds**                            | `leaf-contracts.json` entry `reference-export-drift-gate` lines 1129-1149. Divergence from SA-1 is real and is upstream's.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Head     | Branch diff vs base                                           | **plan-only**                        | `git diff --name-status baf1cdf67 a3f6b87b5` → four added `.llm/runs/...` files only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

## Judgement on the eight questions

1. **A1** — see table. Not "wired to nothing"; wired indirectly and fail-closed via `docs:accuracy`.
   Nothing missed beyond what research F1 records; no workflow runs it. Plan's S2 is the right
   remediation and does not claim prior work.
2. **A3** — the four Step-0 symbols hold; `paginatedQuery` is real; **three further files were
   missed** (B1).
3. **`paginated-query.ts:6`** — confirmed with `deno doc`.
4. **D5 / D2-D4** — false positives are real and reproduced to the digit. The discriminated policy
   makes a skipped symbol gate a config-level machine-readable fact (mode + mandatory nonempty
   reason, refusal on empty/unknown). D5 fixes the parser first; D4's `documentedNonExports` is a
   reason-bearing allow-list for a table the page itself labels non-export — it does not compensate
   for a parser defect and does not weaken invented-symbol detection globally. Acceptable. Two
   non-blocking gaps: N2 (report), N3 (test seam).
5. **D11** — executable. Real reds surface as `OMITS`/`INVENTS`; the legitimate outlets are
   documenting the symbol or an audited reason-bearing omission group, and Tier-A reviews every
   group. But S1's proof line reads "direct drift command raw exit 0 only after … reconcile", which
   pressures toward green; N1 asks the plan to state that an honest residual red at S1 is reported
   red, not tuned away.
6. **SA-1 justification** — a persistent test is required: the refusal paths are the load-bearing
   semantics and a one-off probe cannot fail CI. The path is bounded to assertions. It is sufficient
   for the four named refusal cases only if the checker exposes a seam the test can drive without
   editing product code (N3).
7. **`fresh-browser` waiver** — correct. `catalog.ts:55` maps it to `deno task test:browser` =
   `packages/fresh/deno.json:26` → `packages/fresh/tests/form-navigation_browser.ts`, a browser test
   of `@netscript/fresh` form navigation. Nothing in the ten paths touches `packages/fresh`, any
   route/island/component/CSS. Tier-A's caveat (the rewritten page is Lume-rendered) is about the
   docs build, which Pages already covers via `deno task build` (`check:source-format` → lume →
   `check:rendered-output`), not about `fresh-browser`. Not run; remains `NOT_RUN`.
8. **Four live rows** — rows 2, 3, 4 (Fresh UI repair, machine-readable omissions, runbook + wiring)
   are closed by S1/S2 as designed. Row "Contracts inventory advertises no non-exports" (issue row
   2) is closed by the JSDoc fix plus the already-green reference page. Issue row 1 is **not**
   honestly reconciled — B1.

## Plan-Gate checklist

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                             |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | FAIL   | `research.md` re-baselined at head, load-bearing findings F1/F4/F5/F6 reproduce; but F3/F4's row-1 inventory is incomplete (B1).                                                                                |
| Decisions locked                        | PASS   | D1-D11 with rationale; SA-1 leaves them intact.                                                                                                                                                                 |
| Open-decision sweep                     | FAIL   | The three out-of-surface JSDoc files (B1) are an unflagged decision that changes what the PR may close; not safe to defer.                                                                                      |
| Commit slices (< 30, gate + files each) | PASS   | S1-S3 ordered, files and proofs named.                                                                                                                                                                          |
| Risk register                           | PASS   | present; "exclusion list becomes a hiding place" mitigated by review.                                                                                                                                           |
| Gate set selected                       | PASS   | frozen gates minus waived `fresh-browser` (SA-1 A2), plus JSR audit; validation table rows 1-11.                                                                                                                |
| Deferred scope explicit                 | FAIL   | "The already-correct Contracts root exports and `contract-primitives.ts` JSDoc" is explicit, but the deferral list silently omits three shipped Contracts JSDoc defects that row 1 requires (B1).               |
| jsr-audit surface scan (pkg/plugin)     | PASS   | Contracts publish delta named honestly; Fresh UI no member delta; baseline doc-lint reds recorded as red; pins verified. Under fix (a) the JSR table gains three more prose-only files in the same publish set. |

## Open-decision sweep (evaluator-run)

- **B1** (blocking) — fix path (a) or (b) above; coordinator's call.
- No other decision would force checker/doc rework if deferred.

## Non-blocking findings (address in the same cycle; not required for PASS)

- **N1 — S1 proof wording vs D11.** State in S1 that if honest reconciliation leaves a residual red,
  S1 commits with the residual reported red (per implement.md "wiring a gate that then fails on
  baseline is a legitimate outcome") rather than requiring exit 0 as its commit condition.
- **N2 — visible coverage report.** The policy is machine-readable in config, but the checker's
  terminal `PASS` line would still be silent about which packages ran in `entrypoints-only` mode.
  Have the checker print, per package, the coverage mode, reason, and omission-group counts on every
  run so a green never hides five entrypoint-only packages.
- **N3 — test seam.** Name how `check-exports-drift_test.ts` will assert the four refusal cases:
  export a policy validator (or make `checkDrift(mapping)` injectable) and bind `Deno.exit(1)` to it
  in `main`. `AUTHORITATIVE_MAPPING` is a hardcoded const, so a subprocess test cannot inject a
  malformed policy without a seam; SA-1's "asserted nonzero" needs this to be satisfiable without
  touching product code beyond the in-scope checker.
- **N4 — Pages step cwd.** The checker uses `Deno.cwd()` and repo-relative paths; the
  build/links/caveats steps use `working-directory: docs/site` (`docs:snippets` runs from root). The
  new step must run from repo root (`deno task docs:exports-drift` with no `working-directory`), and
  it must sit behind the same `if: env.RUN == 'true'` guard as the other build steps.
- **N5 — `docs:accuracy` calling the named task.** With `--allow-run=deno` the child
  `deno task docs:exports-drift` is permitted; keep the child's stdout/stderr surfaced on failure as
  today (`check-accuracy-and-discoverability.ts:296-300`).

## Commands fired (all read-only; raw exits unpiped)

```text
git rev-parse HEAD                                              -> a3f6b87b599e778db950daf6ccaecd847c088d19
deno run --no-lock --allow-read --allow-env --allow-run .llm/tools/docs/check-exports-drift.ts   -> 0 (PASS)
grep -rnE 'check-exports-drift|exports-drift' deno.json .github/workflows/                       -> 1
grep -rn 'docs-accuracy\|docs:maintenance\|docs:accuracy' .github/workflows/                     -> 1
deno task docs:accuracy                                                                          -> 0 (PASS)
deno test --no-lock --allow-all .llm/tools/docs/check-exports-drift_test.ts                      -> 0 (1 passed)
deno doc --no-lock --filter <sym> packages/contracts/{mod,query,transform}.ts (see B1 / A3)      -> as tabulated
deno run --no-lock --allow-read --allow-run .llm/tmp/pe-count.ts                                 -> 0 (168)
deno run --no-lock --allow-read --allow-run .llm/tmp/pe-f6.ts                                    -> 0 (168/78/162)
test -e docs/exports                                                                             -> 1
fresh-browser                                                                                    -> NOT_RUN (waived, not restated)
```

Scratch: `.llm/tmp/pe-*.{ts,out,json}` only. No implementation, product, config, generated, plan,
research, amendment, lock, doctrine, debt, or central-state file was modified.
