# Context Pack: W2-A #1325 generated trigger KV bootstrap

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.5--orchestration/slices/w2-a-1325` |
| Branch | `fix/triggers-generated-kv-adapter-bootstrap` |
| Current phase | `implement` |
| Archetype | `5 — Plugin Package` |
| Scope overlays | `service` |

## Current State

PLAN-EVAL passed in a separate Claude/Fable session. S1 landed a generated-workspace behavioral
probe and captured the expected pre-fix exit 1 at the core Redis-registration boundary. No runtime
resource has been started.

## Completed

- Skills, issue, harness workflow, doctrine, debt, public API, sibling seam, and current E2E gates read.
- Branch/base verified exactly.
- Provider selection/registration authority identified in `@netscript/kv`.
- Accepted verification-shape and connector-convergence debt recorded without expansion.

## In Progress

- S1 RED behavioral invariant.

## Next Steps

1. Commit/push/comment S1 RED evidence.
2. Add the thin trigger provider bootstrap and turn the focused gate green.
3. Add the shared generated-runtime health enumeration without changing workers bootstrap placement.

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
