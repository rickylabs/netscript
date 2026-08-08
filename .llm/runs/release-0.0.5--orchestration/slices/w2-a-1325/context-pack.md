# Context Pack: W2-A #1325 generated trigger KV bootstrap

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.5--orchestration/slices/w2-a-1325` |
| Branch | `fix/triggers-generated-kv-adapter-bootstrap` |
| Current phase | `plan-eval` |
| Archetype | `5 — Plugin Package` |
| Scope overlays | `service` |

## Current State

Issue #1325 remains reproducible at source. The plan/design is complete and implementation is
blocked on separate-session PLAN-EVAL. No product source has changed and no runtime resource has
been started.

## Completed

- Skills, issue, harness workflow, doctrine, debt, public API, sibling seam, and current E2E gates read.
- Branch/base verified exactly.
- Provider selection/registration authority identified in `@netscript/kv`.
- Accepted verification-shape and connector-convergence debt recorded without expansion.

## In Progress

- Orchestrator handoff for native Claude/Fable 5 medium PLAN-EVAL.

## Next Steps

1. Open the draft plan PR after committing/pushing these artifacts (without `Closes #1325` yet).
2. Ask the orchestrator to launch separate PLAN-EVAL.
3. On PASS, implement RED-first slices. On FAIL_PLAN, repair the plan before source edits.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Core owns provider selection/registration | `packages/kv` + doctrine A5/A10 | Plugin stays thin. |
| Behavioral generated-output proof | issue acceptance + AP-18 | Text-only import assertions are insufficient. |
| Shared enumerated runtime invariant | issue acceptance | Prevents saga/trigger sibling drift. |

## Files Changed

Only this slice's harness artifacts are changed during plan bootstrap.

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | pending separate PLAN-EVAL | `research.md`, `plan.md`, `worklog.md` Design |
| Static/Fitness/Runtime/Consumer | NOT_RUN | implementation has not begun |

## Open Questions

- PLAN-EVAL must confirm the exact runtime enumeration and behavioral RED strategy.

## Drift and Debt

- Drift: stale prepared supervisor identity/evaluator and missing shared-contract file path.
- Debt: existing triggers verification-shape and connector convergence accepted; neither deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
