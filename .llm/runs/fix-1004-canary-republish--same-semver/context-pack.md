# Context Pack: same-semver canary republish

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1004-canary-republish--same-semver` |
| Branch | `fix/1004-canary-republish` |
| Current phase | `plan-eval` |
| Archetype | N/A |
| Scope overlays | none |

## Current State

Research confirms issue #1004's diagnosis against current `origin/main`. The plan and Design checkpoint are ready, but the canonical local PLAN-EVAL route is blocked by a missing OpenRouter credential; no implementation files have changed.

## Completed

- Requested skills and harness routing read.
- Clean baseline verified.
- All three causal claims verified.
- Plan and Design checkpoint recorded.

## In Progress

- Owner direction on the unavailable local evaluator route.

## Next Steps

1. Make the local OpenRouter evaluator credential available, or explicitly authorize a harness route exception/waiver.
2. Run separate PLAN-EVAL.
3. Implement only after PASS or a written owner waiver.

## Drift and Debt

- Drift: canonical local evaluator route blocked by missing credential.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
