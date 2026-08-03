# Context Pack: Canary label surface (#1121)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-canary-label-surface--1121` |
| Branch | `feat/canary-label-surface` |
| Current phase | `implement` (Plan-Gate explicitly waived) |
| Archetype | N/A — internal release tooling |
| Scope overlays | none |

## Current State

Research and Design are complete against clean `origin/main` at `0b05217cc`. The canonical
separate-session PLAN-EVAL route could not start. The owner explicitly waived that gate under
#1087's safety precedent and authorized immediate implementation; no PLAN-EVAL PASS is claimed.

## Completed

- Read the five user-named skills plus required harness/evaluator/handoff references.
- Read issues #1121/#1120 and the observed 0.0.4 trace in full.
- Verified current workflow, release resolver, historical tags/registry versions, and GitHub labels.
- Locked the two-slice plan and explicit result contract.

## In Progress

- Slice 1: machine-readable canary identity.

## Next Steps

1. Implement slice 1 under the recorded owner waiver.
2. Run opposite-family review, supervisor sign-off, push, and PR evidence comment.
3. Implement and independently review slice 2.

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

- Live canary evidence remains an operational prerequisite for final close-gate readiness.

## Drift and Debt

- Drift: sibling-checkout trace location; Codex entry supervisor route; formal evaluator credential
  unavailable and owner-waived under #1087.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
