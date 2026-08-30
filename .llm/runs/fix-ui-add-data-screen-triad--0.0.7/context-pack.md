# Context Pack: #1357 `ui:add` data-screen triad

## Run Metadata

| Field          | Value                                 |
| -------------- | ------------------------------------- |
| Run ID         | `fix-ui-add-data-screen-triad--0.0.7` |
| Branch         | `fix/ui-add-data-screen-triad`        |
| Current phase  | `plan-eval` cycle 2 handoff           |
| Archetype      | `6 — CLI / Tooling`                   |
| Scope overlays | `frontend`                            |

## Current State

S1 research/design remains at locked base `de57fab0`; no product/test code exists. PLAN-EVAL cycle 1
returned `FAIL_PLAN` at `402c552f` with verdict `1a1a0d53`. The bounded repair keeps a 12-path
ceiling by replacing the generated-corpus how-to with the missing `scaffold.runtime` selector,
preserves D17, and prepares the final cycle-2 handoff. A separate evaluator must issue PLAN-EVAL
`PASS` before S2.

## Completed

- Verified issue #1357 citations and live dependency issues #1354/#1355/#1356/#1360.
- Completed doctrine/archetype/frontend checkpoint and public `deno doc` inspection.
- Answered all six owner questions and locked product boundary/compatibility semantics.
- Measured base gates, including red-at-base lint/fmt commands and deliberate NOT_RUN gates.
- Derived shared-carrier impact from all four named checks.
- Incorporated the cycle-1 selector/corpus correction without revisiting the design areas the
  evaluator passed.
- Recorded all deferred known-stale docs and corrected the optional `initialDataUpdatedAt` wording.

## In Progress

- Commit/push/PR-comment handoff for the cycle-1 repair; owner dispatches final PLAN-EVAL cycle 2.

## Next Steps

1. Owner dispatches separate PLAN-EVAL cycle 2 at the repair head.
2. Evaluator checks the final 12-path ceiling, no-corpus cascade invariant, and bounded wording
   corrections, then records `PASS` or `FAIL_PLAN` without implementation.
3. Only on PASS, implementation author resumes S2A inside the 12-path ceiling. Cycle 2 is the final
   plan cycle.

## Key Decisions

| Decision                                   | Source       | Notes                                                                                                      |
| ------------------------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------- |
| Prioritized one conventional query binding | plan D2–D4   | One explicit client wins; otherwise one init example; peer ambiguity/unsupported/zero fails before writes. |
| #1360 not landing dependency               | plan D10–D12 | API exists; showcase/migration remain #1360.                                                               |
| Route-tree `(_islands)` convention         | plan D8–D9   | Existing files untouched; future standalone output moves.                                                  |
| Semantic role contract                     | plan D13–D14 | Couples help and planned files.                                                                            |
| Runtime author NOT_RUN                     | plan D16     | Required supervisor lease/host.                                                                            |
| Final 12-path ceiling                      | plan ceiling | Adds `capability-suites.ts`; removes the generated-corpus how-to.                                          |
| No docs/carrier mutation                   | plan D17     | Four cascade checks stay stable because this leaf writes no corpus member; docs are deferred.              |
| Real help-surface assertion                | plan D13     | Render real Cliffy help and compare it independently with planned emission roles.                          |
| Plain page registration                    | plan D7      | Non-island pages use `router.ts`/`appRoutes` but do not require a data binding.                            |

## Files Changed

| Path                                                            | Status   | Notes                                         |
| --------------------------------------------------------------- | -------- | --------------------------------------------- |
| `.llm/runs/fix-ui-add-data-screen-triad--0.0.7/plan.md`         | modified | Corrected ceiling, cascade, gates, and seams. |
| `.llm/runs/fix-ui-add-data-screen-triad--0.0.7/worklog.md`      | modified | Recorded cycle-1 repair and advisories.       |
| `.llm/runs/fix-ui-add-data-screen-triad--0.0.7/drift.md`        | modified | Appended selector/corpus and API drift.       |
| `.llm/runs/fix-ui-add-data-screen-triad--0.0.7/context-pack.md` | modified | Prepared final plan-eval handoff.             |

## Gates

| Gate family | Current status                  | Evidence                                                                                                       |
| ----------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Static      | mixed measured base             | CLI/E2E check+test pass; lint/fmt base tooling failures recorded.                                              |
| Fitness     | PASS at base                    | quality, doctrine, docs, JSR, publish checks exit 0.                                                           |
| Runtime     | REQUIRED / NOT_RUN              | supervisor-coordinated `scaffold.runtime`; author prohibited.                                                  |
| Consumer    | PASS except intentional NOT_RUN | No corpus member is touched: three read-only checks stay green; writing assets-barrel remains supervisor-only. |

## Open Questions

- Final PLAN-EVAL cycle-2 verdict only; no implementation-forcing author question remains open.

## Drift and Debt

- Drift: citation/option reality, missing `rtk`, doctrine legacy mismatch, base-red lint/fmt
  tooling, owner PR/evaluator override, and the cycle-1 selector/corpus contradiction are recorded
  in `drift.md`. The how-to plus three known-stale public descriptions are explicitly deferred.
- Debt: no new debt proposed; existing CLI spine/layer-2 and task-path debt stays out of scope.

## Commits

- S1 harness-only PLAN-EVAL cycle-1 subject: `402c552f`.
- Cycle-1 repair is the next harness-only commit; exact SHA is reported after commit/push and in the
  PR #1781 summary comment.
