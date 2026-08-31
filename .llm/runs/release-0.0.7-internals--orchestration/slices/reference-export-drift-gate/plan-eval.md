# PLAN-EVAL — release-0.0.7-internals--orchestration/slices/reference-export-drift-gate

## Verdict block

| Field               | Value                                                                                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evaluated head      | `80046696e6b192c5448aba6b3b0b619faeabac21` — local `git rev-parse HEAD`, `git ls-remote origin`, and `gh pr view 1666 headRefOid` all equal; no mismatch                     |
| Base                | `baf1cdf67a4e931af17b4772ddf6101f36152184` (`git merge-base HEAD origin/main`)                                                                                              |
| PR / issue          | #1666 (draft, base `main`) / `Closes #1296`                                                                                                                                 |
| Cycle               | **2 of 2** (cycle 1 = `FAIL_PLAN` at `5d229e0f3`, preserved as `plan-eval-cycle-1.md`)                                                                                      |
| Prior heads         | plan `9d0b4bf12`, SA-1 `a3f6b87b5`, cycle-1 verdict `5d229e0f3`, SA-1a `cb91b225d`, SA-2 `80046696e`                                                                        |
| Evaluator session   | Claude Code session `580832d7-53e8-4828-ad41-e2f9219c9340` (background job `0e2d1e57`), fresh and separate from Codex author thread `01a005d2-7c9d-7dd1-b6fc-531b72dc14e4` |
| Route               | native Claude **Fable 5**, formal PLAN-EVAL, opposite family to the GPT-5.6 Sol author                                                                                       |
| Artifacts evaluated | `plan.md` (SA-2 amended), `scope-amendment.md` (SA-1/SA-1a/SA-2), `research.md`, `implement.md` (historical, unedited), issue #1296, frozen `leaf-contracts.json` entry     |
| Surface / archetype | frozen `6 — CLI / Tooling`; overlays `frontend`, `docs`                                                                                                                     |
| **Verdict**         | **`PASS`**                                                                                                                                                                  |

Artifact-only. No product, config, generated, lock, doctrine, debt, or central-state file was
modified. `fresh-browser` stays `NOT_RUN` (N/A / waived, SA-1 A2); no Aspire/Docker/browser/`e2e:cli`
was fired. At exit the four Contracts JSDoc examples are **still unfixed** in the tree
(`grep -c "from '@netscript/contracts';"` → 1 each in `paginated-query.ts`, `transform-helpers.ts`,
`schemas/filters.ts`, `schemas/pagination.ts`); `git status` is clean apart from this artifact.

## Premise corrections — verified, not inherited

- `implement.md:43,47` ("wired to nothing" / "guards nothing") is a **known-stale supervisor
  premise**, deliberately left unedited as history. It is not reported as a contradiction.
- Cycle 1's claim "No workflow runs `docs:accuracy`/`docs:maintenance`/`docs-accuracy`" was
  **false**. Re-derived chain at head:
  `ci.yml:364-367` step *Docs accuracy check* (`if: env.RUN == 'true'`, quality job `:282`, guard
  `:287` `draft == false`, `RUN = classify-failed || needs_deno || needs_docs` at `:291`) →
  `run-gate.ts --gate docs-accuracy` → `catalog.ts:59` `'docs-accuracy' → ['deno','task','docs:accuracy']`
  → `deno.json:85` → `check-accuracy-and-discoverability.ts:292-301` spawns
  `deno run --allow-all .llm/tools/docs/check-exports-drift.ts`, prints child stdout/stderr and
  throws on nonzero. **Enforcement already exists fail-closed for qualifying non-draft CI; the row-5
  residual is discoverability** (no `docs:exports-drift` task, no named workflow step, no runbook).
  `research.md` F1 and `plan.md` (goal, live-acceptance row 4, D9, S2, risk "gate-catalog
  indirection") state exactly this — neither overstated nor understated. `grep -rn docs-accuracy
  .github/workflows/` → `ci.yml:285,366,367`, `EXIT=0`.

## Judgement on the eight questions (re-derived)

1. **B1 closure — full inventory.** Every `from '@netscript/contracts…'` in the package (`*.ts`,
   `*.tsx`, `*.md`, tests excluded): 14 lines. Publish set (`deno.json` `publish.include`):
   `README.md`, `mod.ts`, `crud.ts`, `query.ts`, `transform.ts`, `src/**`, `crud/**`, `schemas/**`.

   | Line                                          | Symbols → entrypoint                                                        | `deno doc --no-lock --filter` |
   | --------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------- |
   | `README.md:52`                                | `baseContract`, `OffsetPaginationMetaSchema`, `OffsetPaginationQuerySchema` → root | root `0/0/0` — correct |
   | `mod.ts:10`                                   | `baseContract`, `OffsetPaginationQuerySchema` → root                        | root `0/0` — correct          |
   | `query.ts:6`                                  | `paginatedQuery` → `/query`                                                 | query `0` — correct           |
   | `crud.ts:6`, `crud/create-crud-contract.ts:6,250` | `createCrudContract` → `/crud`                                          | crud `0` — correct            |
   | `transform.ts:6`                              | `createTransformer` → `/transform`                                          | transform `0` — correct       |
   | `src/application/contract-primitives.ts:72,112,144` | `baseContract`, `BaseContractRoute`, `BaseContractOutputRoute` → root | root `0/0/0` — correct        |
   | `src/application/paginated-query.ts:6`        | `paginatedQuery` → root                                                     | root `1`, query `0` — **wrong (in plan)** |
   | `src/application/transform-helpers.ts:6`      | `createTransformer` → root                                                  | root `1`, transform `0` — **wrong (SA-2)** |
   | `schemas/filters.ts:6`                        | `FilterConditionSchema`, `buildPrismaWhere` → root                          | root `1/1`, query `0/0` — **wrong (SA-2)** |
   | `schemas/pagination.ts:6`                     | `PaginationInputSchema`, `createPaginatedOutput` → root                     | root `1/1`, query `0/0` — **wrong (SA-2)** |

   Exactly four wrong-root lines, all covered by D8/SA-2 with the correct ruled entrypoints. **No
   fifth wrong-root example exists in the publish set.** Cross-package check: no `packages/**` or
   `plugins/**` file outside `packages/contracts` imports any of the six symbols from the root
   (`grep … EXIT=1`). F3/F4 are complete and accurate.
2. **`Closes #1296` honesty.** Row 1: all four residual lines in S1 → met at merge. Row 2:
   `contracts` mapping is `checkSymbols: true`, checker `PASS` (`DRIFT_RAW_EXIT=0`) → baseline-met,
   preserved. Row 3/4: S1 (six-entrypoint page repair, discriminated reason-bearing coverage, D2-D7).
   Row 5: runbook (S1, D10) + named task/Pages step (S2, D9) over the already-enforced chain. The
   closing keyword is earned by the plan as amended; no row is left unmet at merge. The plan and PR
   body both say honesty comes from SA-2's rescope, not from the baseline — correct.
3. **Thirteen-path discipline.** Enumerated: frozen nine (six edit + `docs/exports`,
   `contract-primitives.ts`, `src/public/mod.ts` do-not-touch) + SA-1 test path + SA-2 three JSDoc
   paths = 13. S1 lists 7 implementation paths, S2 lists 3, do-not-touch 3 → 13, one-for-one. Every
   operational count in `plan.md` reads **thirteen** (`:7,46,178,202,266`) and every refusal reads
   **fourteenth** (`:79,179,202`); S3, validation row 11, and the risk guard are all bound to 13.
   The remaining "nine" mentions are the frozen-contract count and the unrelated `doc:lint`
   baseline, both correctly labelled. `leaf-contracts.json` still freezes nine — SA-1 A5 records that
   as coordinator-owed upstream reconciliation.
4. **N3 seam.** At head `checkDrift()` takes no argument, iterates the hardcoded
   `AUTHORITATIVE_MAPPING`, and calls `Deno.exit(1)` internally (`check-exports-drift.ts:376-467`);
   the only test exercises the pure functions. SA-2's `checkDrift(mapping): Promise<number>` +
   `if (import.meta.main) Deno.exit(await checkDrift(AUTHORITATIVE_MAPPING))` makes the four refusal
   cases assertable inside the authorized surface: empty/malformed reason and unknown mode are
   mapping-validation refusals that need no files; invented and omitted symbol need a mapping whose
   `packagePath`/`docPath` resolve under `Deno.cwd()` — achievable from the test file alone via
   `Deno.makeTempDir()` fixtures with cwd-relative paths (or `Deno.chdir`), because the test task
   runs `--allow-all`. Moving the exit out of `checkDrift` is what makes this testable at all; the
   plan does exactly that. Validation row 1 is bound to this seam. SA-1's persistence promise is
   satisfiable.
5. **N1 vs D11.** S1 "Proves" no longer requires raw exit 0; the N1 bullet states an honest
   residual red is committed red with omissions/inventions and raw exit; validation row 2 says "A
   residual red is preserved under N1 rather than blocking the S1 commit". D11 forbids tuning quiet.
   The plan cannot be satisfied by silencing the checker.
6. **N2.** S1 introduces an unconditional per-package mode/reason/omission-count report before the
   terminal verdict; validation row 2 requires it every run. A terminal `PASS` cannot hide
   `entrypoints-only` packages (`plugin`, `queue`, `sdk`, `service` today; `fresh-ui` promoted to
   complete).
7. **N4/N5.** `pages.yml:143-157`: build steps carry `if: env.RUN == 'true'`; snippets runs from
   root, build/links/caveats use `working-directory: docs/site`. Plan S2/N4 puts the new step at
   repo root with no `working-directory` behind the same guard — correct for a checker that joins
   `Deno.cwd()`. `pages-workflow_test.ts` asserts snippets < lume order and lume cwd only; a new
   step does not break it (risk row covers refusal if it did). N5: `deno.json:85` already grants
   `--allow-run=deno`, so `deno task docs:exports-drift` is spawnable; the plan keeps the existing
   decode-print-throw at `:296-300`.
8. **JSR proportionality.** Contracts is published; publish set includes all four files (`src/**`,
   `schemas/**`); the JSR table names the delta as shipped JSDoc prose only, no export/API/schema
   change; export map `. ./crud ./query ./transform` unchanged; zero `@netscript/*` pins (verified);
   Fresh UI pins `jsr:@netscript/sdk@0.0.6/{auto-update,desktop}` exact (`fresh-ui/deno.json:16-17`);
   root `isolatedDeclarations: true` (`deno.json:174`) → canonical `publish:dry-run` required and
   planned; baseline doc-lint reds recorded as red. Proportionate.

## Plan-Gate checklist

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                       |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` re-baselined at `baf1cdf67`; F1 chain, F3/F4 nine-line inventory + six-symbol table, F5 six entrypoints, F8 triggers all reproduce at head.                |
| Decisions locked                        | PASS   | D1-D11 with rationale; D8 widened to four files by SA-2; SA-2 governs on conflict.                                                                                        |
| Open-decision sweep                     | PASS   | Sweep table resolves the three PLAN-EVAL-discovered files (SA-2), `docs/exports`, policy format, parser boundary, wiring, `fresh-browser`; evaluator sweep found none.    |
| Commit slices (< 30, gate + files each) | PASS   | S1-S3 ordered, 13 paths accounted for one-for-one, each names files and proof.                                                                                            |
| Risk register                           | PASS   | Present; guards bound to thirteen; exclusion-as-hiding-place, parser, duplicate-execution, lock churn covered.                                                            |
| Gate set selected                       | PASS   | Frozen gates minus waived `fresh-browser` (`NOT_RUN` preserved), plus JSR audit; validation rows 1-11.                                                                    |
| Deferred scope explicit                 | PASS   | Explicit deferrals list; four incorrect imports now in S1, not deferred; doc-lint debt, MySQL, Fresh UI source, other packages' prose deferred with reasons.              |
| jsr-audit surface scan (pkg/plugin)     | PASS   | Contracts prose-only publish delta named honestly; pins/exports/isolated-declarations verified; baseline reds reported red.                                               |

## Open-decision sweep (evaluator-run)

None. No decision the plan leaves open would force checker/doc/JSDoc rework if deferred.

## Non-blocking observations (implementation lane; not required for PASS)

- **O1 — `schemas/pagination.ts` example free identifiers.** Its `@example` uses `baseContract` and
  `UserSchema` without importing/declaring them. The SA-2 import-subpath-only edit corrects the
  export truth (row 1's operative test) but cannot make that fragment compile standalone. SA-1 A4's
  "clears all four known example-compile failures" therefore holds for import resolution only; if
  #1533's compiler resolves free identifiers, this file may still be red there. Not this leaf's
  scope; record it for #1533, not as a fourteenth path.
- **O2 — N3 fixture mechanics.** For the invented/omitted cases, `checkDrift(mapping)` reads
  `join(Deno.cwd(), packagePath|docPath)` and runs `deno doc`; the test will need temp fixtures with
  cwd-relative paths (or an optional `root` parameter on `checkDrift`, which stays inside the
  authorized checker path). Either is within the thirteen; the plan need not change.
- **O3 — live acceptance table labels.** `plan.md` folds issue rows 1 and 2 into one row labelled
  "Contracts reference inventory advertises no non-exports"; `research.md` keeps them separate.
  Cosmetic; the underlying claims are correct in both.

## Commands fired (read-only; raw exits unpiped)

```text
git rev-parse HEAD / git ls-remote origin / gh pr view 1666           -> 80046696e x3, draft=true
git merge-base HEAD origin/main                                       -> baf1cdf67
git diff --name-status baf1cdf67 HEAD                                 -> 6 added .llm/runs/... files only
grep -rn 'docs-accuracy|docs:accuracy|docs:maintenance|exports-drift' .github/workflows/  -> 0 (ci.yml:285,366,367)
sed ci.yml:280-290,360-370 ; catalog.ts:55,59 ; deno.json:85,90 ; check-accuracy…ts:285-305
grep -rnoE "from ['\"]@netscript/contracts[^'\"]*['\"]" packages/contracts (ts/tsx/md, no tests) -> 14 lines
deno doc --no-lock --filter <12 symbols> packages/contracts/{mod,query,transform,crud}.ts     -> as tabulated
grep six symbols from root outside packages/contracts                 -> 1 (none)
deno run --no-lock --allow-read --allow-env --allow-run .llm/tools/docs/check-exports-drift.ts -> 0 (PASS)
deno test --no-lock --allow-all .llm/tools/docs/check-exports-drift_test.ts                    -> 0 (1 passed)
grep pages.yml guards/cwd ; pages-workflow_test.ts assertions ; fresh-ui deno.json exports/pins ; deno.json:174
grep -c "from '@netscript/contracts';" <four JSDoc files>              -> 1 each (unfixed at exit)
fresh-browser                                                          -> NOT_RUN (waived, not restated)
```

No scratch was written under measured roots. Only this artifact and the `plan-eval-cycle-1.md`
rename were produced.
