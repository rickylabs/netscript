# Context Pack: Canary label surface (#1121)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-canary-label-surface--1121` |
| Branch | `feat/canary-label-surface` |
| Current phase | `plan` |
| Archetype | N/A — internal release tooling |
| Scope overlays | none |

## Current State

Research and Design are complete against clean `origin/main` at `0b05217cc`. No implementation has
started. The next hard stop is separate-session PLAN-EVAL.

## Completed

- Read the five user-named skills plus required harness/evaluator/handoff references.
- Read issues #1121/#1120 and the observed 0.0.4 trace in full.
- Verified current workflow, release resolver, historical tags/registry versions, and GitHub labels.
- Locked the two-slice plan and explicit result contract.

## In Progress

- Commit/push the Plan & Design artifacts and open the draft PR.

## Next Steps

1. Run PLAN-EVAL in a separate bound Qwen session.
2. On PASS only, launch slice 1 in the tracked Codex implementation thread.
3. Review, sign off, push, and comment before slice 2.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| JSON resolver output owns identity | plan L1 | Workflow must not reread root version. |
| Payload uses git + GitHub relations | plan L5/L6 | No plan/wave membership input exists. |
| Drift is target scoped | plan L4 | Prevents unrelated historical pre-surface failure. |
| Live cuts remain external | user close-gate instruction | No pre-ticking or override. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/feat-canary-label-surface--1121/*` | new | Plan/design bootstrap only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | NOT_RUN | implementation not authorized until PLAN-EVAL |
| Fitness | NOT_RUN | focused proof planned |
| Runtime | NOT_RUN | live canaries external |
| Consumer | NOT_RUN | workflow test planned |

## Open Questions

- None that would force implementation rework. Live canary evidence remains an operational
  prerequisite for final close-gate readiness.

## Drift and Debt

- Drift: sibling-checkout trace location; Codex entry supervisor route.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
