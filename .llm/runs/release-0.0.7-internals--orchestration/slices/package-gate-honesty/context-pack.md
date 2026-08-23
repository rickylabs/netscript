# Context Pack: package-gate-honesty

## Run Metadata

| Field          | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| Run ID         | `release-0.0.7-internals--orchestration/slices/package-gate-honesty` |
| Branch         | `fix/package-gate-honesty`                                           |
| Current phase  | S1 implemented; pending fresh Tier-A slice review                    |
| Archetype      | `6 — CLI / Tooling` (supporting MCP member A2)                       |
| Scope overlays | `docs`                                                               |

## Current state

PLAN-EVAL cycle 1 correctly returned `FAIL_PLAN` at evaluator commit `be2b18728`: root exclusion
cannot affect the optimized wrappers' explicit argv. The coordinator granted child-only marker
semantics plus nearest-config batching in both wrappers, then granted the exact formatting-only
twelfth path exposed by the honest 114-file finding. Both exact no-extra-flag prototypes are now
green at 114; all four healthy files remain selected, parsed meaning is equal, doctor is 4/4, and
the malformed hash is unchanged. Cycle 2 correctly returned `FAIL_PLAN` at evaluator commit
`c415daad2`: the lint wrapper is embedded in published CLI source. The coordinator granted the exact
generated barrel as path thirteen and ruled on root task selection, fixture-style wording, and
nearest-config memoization. The owner-authorized final cycle 3 then returned `FAIL_PLAN` at
`65c5e1ac4`: the planned top-level exclusion preserved fmt/lint acceptance but silently removed all
five doctor TS files from `deno check`. The owner granted the in-path correction to the existing
`fmt.exclude` list. The topic supervisor then returned Tier-A PASS at amended plan head `62811a9dd`,
discharging the plan gate under the owner exception. S1 is implemented over exactly its eight
authorized paths and awaits fresh Tier-A slice review; S2–S4 have not started.

## Completed

- Bootstrap commit `25c29575c` pushed with explicit refspec.
- Draft PR #1663 opened with exact closing keywords, checkable DoD, `type:fix`, `area:tooling`,
  `status:research`, milestone `0.0.7`; no acceptance-evidence blocks.
- All three issues re-read live.
- Three cwd failures and MCP fmt config crash reproduced through structured wrappers.
- `closeScoreGap` definition, consumption, and decorative test behavior traced.
- Thirteen-path repaired plan and per-member JSR audit plan locked; no fourteenth path.
- Exact no-extra-flag lint prototype green at 114; fmt reports exactly one genuine healthy-fixture
  finding at 114; separate fmt/lint negative controls red with real findings; doctor 4/4; all
  negative-control source files restored byte-exactly.
- Scratch-only formatting of the granted twelfth path makes exact fmt green at 114 while lint and
  doctor remain green; original/formatted exports are equal.
- All four healthy TS files were individually named selected by genuine or controlled fmt findings,
  and every controlled probe was restored byte-exactly.
- Cycle-2 archive proof established that canonical lint-wrapper regeneration changes only
  `agent-tools.generated.ts` among generated assets, including its embedded tool text and bundle
  hash; `check:assets-barrel` is now planned.
- Cycle 3 independently re-proved the prior repair at 114/2 and exposed the top-level-exclude check
  regression. Its executed `fmt.exclude` alternative preserves raw-walk protection, exact fmt/lint
  acceptance, root `fmt:check`, and scoped doctor check coverage at 5 selected / 0 failed batches.
- Tier-A passed the owner-amended plan at `62811a9dd`; the plan gate is discharged.
- S1 implements child-only marker selection, memoized nearest-config batching in both wrappers,
  bidirectional/group-membership tests, exact root formatter configuration, formatting-only healthy
  normalization, and canonical CLI asset regeneration.
- Exact MCP fmt and lint are green at 114 selected / 2 config batches / 0 failed batches; all four
  healthy TS files remain individually selected through both wrappers.
- Scoped doctor check is green at exactly 5 selected / 0 failed; wrapper plus doctor tests are
  24/24; doctor behavior remains 4/4; the malformed fixture hash is unchanged.
- Honest fmt and lint negative controls produced real findings and were restored byte-exactly; root
  `fmt:check` is green at 2038/36/0 and the quality gate is green.

## In progress

- Finalizing the single S1 commit, post-commit generated-asset freshness receipt, explicit push, and
  `[PHASE: IMPL]` PR comment before stopping for the fresh Tier-A slice review.

## Next steps

1. Topic supervisor performs the fresh Tier-A review of the pushed S1 commit.
2. S2 may begin only when separately dispatched after that review; S3 and S4 remain later slices.
3. `scaffold.runtime` remains waived `n/a` and must not run.

## Key decisions

| Decision                                     | Source         | Notes                                                          |
| -------------------------------------------- | -------------- | -------------------------------------------------------------- |
| Child marker + config batching owns boundary | plan L3/L4     | Both green at 114 after granted formatting-only normalization. |
| Published lint asset regenerated canonically | plan L7/S1     | Embedded tool text/hash change; no export/API-shape change.    |
| Root task parent skip removed                | plan S1/gates  | Existing `fmt.exclude` protects raw fmt walks only.            |
| Doctor check coverage preserved              | plan S1/gate 1 | Scoped doctor check must report 5 selected / 0 failed.         |
| Module-derived CLI paths                     | plan L1/L2     | No ambient cwd and no weakened assertion.                      |
| `0.5` pinned both directions                 | plan L5/L6     | Inside/outside identity conflict makes movement observable.    |
| Formal PLAN-EVAL required                    | plan judgement | This thread cannot self-launch or self-certify.                |

## Authoritative product/config edit surface

1. `deno.json`
2. `packages/cli/e2e/src/application/gates/scaffold/service-env/service-env-gates_test.ts`
3. `packages/cli/e2e/tests/presentation/quickstart-command-drift_test.ts`
4. `packages/cli/e2e/src/application/gates/scaffold/run-documented-stream-example.ts`
5. `packages/mcp/src/domain/docs/guidance-index.ts`
6. `packages/mcp/tests/guidance-retrieval_test.ts`
7. `.llm/tools/run-deno-fmt.ts`
8. `.llm/tools/run-deno-fmt_test.ts`
9. `.llm/tools/run-deno-lint.ts`
10. `.llm/tools/run-deno-lint_test.ts`
11. `packages/mcp/tests/fixtures/doctor/broken/.deno-fmt-lint-ignore`
12. `packages/mcp/tests/fixtures/doctor/healthy/netscript.config.ts`
13. `packages/cli/src/kernel/assets/agent-tools.generated.ts` (canonical regeneration only)

Everything else in the frozen outer bound is read-only, especially both docs sources and the broken
fixture config. A fourteenth path is rescope.

## Gates

| Gate family | Current status                      | Evidence                                          |
| ----------- | ----------------------------------- | ------------------------------------------------- |
| Plan-Gate   | DISCHARGED                          | Tier-A PASS at amended head `62811a9dd`.          |
| Static      | S1 focused gates PASS               | 114/2 fmt+lint; check 5/0; tests 24/24.           |
| Fitness/JSR | quality PASS; full audits remain S4 | No API shape change; published asset regenerated. |
| Runtime     | N/A                                 | Explicit coordinator waiver; must not run.        |
| Consumer    | baseline failures reproduced        | `worklog.md` research diagnostics.                |

## Open questions

- None. Fresh Tier-A S1 review is the required stop point; no cycle 4 or further evaluator exists.

## Drift and debt

- Drift: R8 falsified by execution; rejected parent-family false exclusion; corrected 114-file
  proof; authorized formatting-only twelfth path; cycle-2 published-asset discovery; authorized
  generated thirteenth path; corrected root-vs-fixture formatting semantics; cycle-3 top-level
  exclusion check regression; owner-granted existing-`fmt.exclude` amendment; raw formatter
  non-TypeScript collateral restored during S1 validation.
- Debt: no new/closed entry; named CLI/MCP baseline debt remains unchanged.

## Commits

- Draft PR commit list + phase comments are authoritative; no `commits.md`.
