# Context Pack: package-gate-honesty

## Run Metadata

| Field          | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| Run ID         | `release-0.0.7-internals--orchestration/slices/package-gate-honesty` |
| Branch         | `fix/package-gate-honesty`                                           |
| Current phase  | twelve-path plan repaired; hard stop pending Tier-A/cycle 2 PASS     |
| Archetype      | `6 — CLI / Tooling` (supporting MCP member A2)                       |
| Scope overlays | `docs`                                                               |

## Current state

PLAN-EVAL cycle 1 correctly returned `FAIL_PLAN` at evaluator commit `be2b18728`: root exclusion
cannot affect the optimized wrappers' explicit argv. The coordinator granted child-only marker
semantics plus nearest-config batching in both wrappers, then granted the exact formatting-only
twelfth path exposed by the honest 114-file finding. Both exact no-extra-flag prototypes are now
green at 114; all four healthy files remain selected, parsed meaning is equal, doctor is 4/4, and
the malformed hash is unchanged. No checkout product/config implementation exists.

## Completed

- Bootstrap commit `25c29575c` pushed with explicit refspec.
- Draft PR #1663 opened with exact closing keywords, checkable DoD, `type:fix`, `area:tooling`,
  `status:research`, milestone `0.0.7`; no acceptance-evidence blocks.
- All three issues re-read live.
- Three cwd failures and MCP fmt config crash reproduced through structured wrappers.
- `closeScoreGap` definition, consumption, and decorative test behavior traced.
- Twelve-path repaired plan and per-member JSR audit plan locked; no thirteenth path.
- Exact no-extra-flag lint prototype green at 114; fmt reports exactly one genuine healthy-fixture
  finding at 114; separate fmt/lint negative controls red with real findings; doctor 4/4; all
  negative-control source files restored byte-exactly.
- Scratch-only formatting of the granted twelfth path makes exact fmt green at 114 while lint and
  doctor remain green; original/formatted exports are equal.
- All four healthy TS files were individually named selected by genuine or controlled fmt findings,
  and every controlled probe was restored byte-exactly.

## In progress

- Awaiting fresh Tier-A review and separate-session PLAN-EVAL cycle 2.

## Next steps

1. Topic supervisor reviews the reachable twelve-path plan and launches PLAN-EVAL cycle 2 in a fresh
   separate evaluator session.
2. If and only if Tier-A and PLAN-EVAL cycle 2 both return `PASS`, coordinator grants implementation
   authority.
3. Future implementation follows S1-S4; `scaffold.runtime` remains waived `n/a` and must not run.

## Key decisions

| Decision                                     | Source         | Notes                                                          |
| -------------------------------------------- | -------------- | -------------------------------------------------------------- |
| Child marker + config batching owns boundary | plan L3/L4     | Both green at 114 after granted formatting-only normalization. |
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

Everything else in the frozen outer bound is read-only, especially both docs sources and the broken
fixture config. A thirteenth path is rescope.

## Gates

| Gate family | Current status                       | Evidence                                       |
| ----------- | ------------------------------------ | ---------------------------------------------- |
| Plan-Gate   | cycle 1 `FAIL_PLAN`; cycle 2 pending | `plan-eval.md`; repaired `plan.md`.            |
| Static      | NOT_RUN                              | No implementation.                             |
| Fitness/JSR | planned                              | `research.md` and `plan.md` per-member tables. |
| Runtime     | N/A                                  | Explicit coordinator waiver; must not run.     |
| Consumer    | baseline failures reproduced         | `worklog.md` research diagnostics.             |

## Open questions

- None that change implementation shape; implementation authority still depends on fresh Tier-A and
  cycle-2 `PASS`.

## Drift and debt

- Drift: R8 falsified by execution; rejected parent-family false exclusion; corrected 114-file
  proof; authorized formatting-only twelfth path.
- Debt: no new/closed entry; named CLI/MCP baseline debt remains unchanged.

## Commits

- Draft PR commit list + phase comments are authoritative; no `commits.md`.
