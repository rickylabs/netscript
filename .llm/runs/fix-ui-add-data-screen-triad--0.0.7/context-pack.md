# Context Pack: #1357 `ui:add` data-screen triad

## Run Metadata

| Field          | Value                                 |
| -------------- | ------------------------------------- |
| Run ID         | `fix-ui-add-data-screen-triad--0.0.7` |
| Branch         | `fix/ui-add-data-screen-triad`        |
| Current phase  | `plan-eval` handoff                   |
| Archetype      | `6 — CLI / Tooling`                   |
| Scope overlays | `frontend`                            |

## Current State

S1 research/design is complete at locked base `de57fab0`. No product/test code exists. The plan
locks a 12-path product ceiling, a full precondition/no-write design, one route-tree island
convention, and baseline-aware gates. A separate evaluator must issue PLAN-EVAL `PASS` before S2.

## Completed

- Verified issue #1357 citations and live dependency issues #1354/#1355/#1356/#1360.
- Completed doctrine/archetype/frontend checkpoint and public `deno doc` inspection.
- Answered all six owner questions and locked product boundary/compatibility semantics.
- Measured base gates, including red-at-base lint/fmt commands and deliberate NOT_RUN gates.
- Derived shared-carrier impact from all four named checks.

## In Progress

- Owner-managed commit/push handoff and separate PLAN-EVAL dispatch.

## Next Steps

1. Separate evaluator reads `research.md`, `plan.md`, `worklog.md`, `drift.md`, and exact base tree.
2. Evaluator records `PASS` or `FAIL_PLAN` in `plan-eval.md` without implementation.
3. Only on PASS, implementation author resumes S2A inside the 12-path ceiling.

## Key Decisions

| Decision                                   | Source       | Notes                                                                                                      |
| ------------------------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------- |
| Prioritized one conventional query binding | plan D2–D4   | One explicit client wins; otherwise one init example; peer ambiguity/unsupported/zero fails before writes. |
| #1360 not landing dependency               | plan D10–D12 | API exists; showcase/migration remain #1360.                                                               |
| Route-tree `(_islands)` convention         | plan D8–D9   | Existing files untouched; future standalone output moves.                                                  |
| Semantic role contract                     | plan D13–D14 | Couples help and planned files.                                                                            |
| Runtime author NOT_RUN                     | plan D16     | Required supervisor lease/host.                                                                            |

## Files Changed

| Path                                             | Status | Notes                   |
| ------------------------------------------------ | ------ | ----------------------- |
| `.llm/runs/fix-ui-add-data-screen-triad--0.0.7/` | new    | Harness artifacts only. |

## Gates

| Gate family | Current status                  | Evidence                                                          |
| ----------- | ------------------------------- | ----------------------------------------------------------------- |
| Static      | mixed measured base             | CLI/E2E check+test pass; lint/fmt base tooling failures recorded. |
| Fitness     | PASS at base                    | quality, doctrine, docs, JSR, publish checks exit 0.              |
| Runtime     | REQUIRED / NOT_RUN              | supervisor-coordinated `scaffold.runtime`; author prohibited.     |
| Consumer    | PASS except intentional NOT_RUN | three read-only checks pass; writing assets-barrel not run.       |

## Open Questions

- PLAN-EVAL verdict only; no implementation-forcing author question remains open.

## Drift and Debt

- Drift: citation/option reality, missing `rtk`, doctrine legacy mismatch, base-red lint/fmt
  tooling, and owner PR/evaluator override are recorded in `drift.md`.
- Debt: no new debt proposed; existing CLI spine/layer-2 and task-path debt stays out of scope.

## Commits

- S1 harness-only commit is the PLAN-EVAL subject; exact SHA is reported after commit/push.
