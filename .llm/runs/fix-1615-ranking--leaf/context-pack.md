# Context Pack: deterministic guidance ranking

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-1615-ranking--leaf` |
| Branch | `fix/1615-guidance-ranking-determinism` |
| Current phase | `plan` |
| Archetype | `2 — Integration` |
| Scope overlays | none |

## Current State

Run activated and measurement/design locked. The fresh direct/plugin absolute score gap is
`0.3019801981861221`, selecting a deterministic close-score tie-break. No product code has changed.

## Completed

- Read required harness/tooling/PR/doctrine/JSR skills and relevant authority files.
- Re-baselined live issue #1615, sibling PR #1608, branch/base, doctrine assignment, public surface,
  ranking implementation, fixture, and relevant debt.
- Printed and cross-checked base and fresh candidate scores.
- Recorded PLAN-EVAL N/A; mandatory separate-session IMPL-EVAL remains with the orchestrator.

## In Progress

- S0 bootstrap commit, explicit push, and draft PR creation.

## Next Steps

1. Commit/push S0 and open the labeled draft PR at `status:impl`.
2. Implement transitive close-score grouping with focused tests.
3. Prove all eight fixtures on base and fresh corpus, then run requested negative/full gates.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Direction 1 | score measurement | near-tie, not wide semantic preference |
| `closeScoreGap = 0.5` | plan D2 | covers observed movement; leader-anchored grouping preserves transitivity |
| No golden edit | plan D4 | exact ranks remain meaningful after deterministic tie handling |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/fix-1615-ranking--leaf/**` | new | run identity, research, design, decisions, and resumable state |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Measurement | pass | base and fresh scores printed; instrumentation cross-check passed |
| Static | pending | S1/S2 |
| Fitness | pending | S2 |
| Runtime | pending | guidance and fresh-corpus tests |
| Consumer | pending | public shape unchanged; behavioral gates remain |

## Open Questions

- None.

## Drift and Debt

- Drift: evaluator override and fresh-head rank detail recorded in `drift.md`.
- Debt: pre-existing `MCP-A6-V2-SHAPE` unchanged; no new debt planned.

## Commits

- See the draft PR's commit list + per-slice PR comments.

