# Context Pack: same-semver canary republish

## Run Metadata

| Field          | Value                                    |
| -------------- | ---------------------------------------- |
| Run ID         | `fix-1004-canary-republish--same-semver` |
| Branch         | `fix/1004-canary-republish`              |
| Current phase  | `gate`                                   |
| Archetype      | N/A                                      |
| Scope overlays | none                                     |

## Current State

Slice 2 is implemented and all authoritative scoped gates pass. The owner-waived Opus PLAN-EVAL's
sole finding was incorporated: republish now requires both a clean working tree and equal tag/HEAD
committed trees.

## Completed

- Requested skills and harness routing read.
- Clean baseline verified.
- All three causal claims verified.
- Plan and Design checkpoint recorded.
- Owner-waived PLAN-EVAL completed with one scoped correction and no required second cycle.
- Republish workflow, fail-closed guard, tests, and release doctrine implemented.
- Scoped format, lint, check, and permission-corrected tests pass.

## In Progress

- Commit/push slice 2 and hand off to owner-routed Opus IMPL-EVAL.

## Next Steps

1. Commit and push slice 2 with explicit refspec.
2. Update draft PR evidence and lifecycle label.
3. Owner-routed Opus supervisor runs IMPL-EVAL.

## Drift and Debt

- Drift: missing local evaluator route superseded by owner waiver; working-tree cleanliness added
  from PLAN-EVAL.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
