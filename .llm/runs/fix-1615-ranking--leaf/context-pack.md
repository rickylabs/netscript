# Context Pack: deterministic guidance ranking

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-1615-ranking--leaf` |
| Branch | `fix/1615-guidance-ranking-determinism` |
| Current phase | `implement` |
| Archetype | `2 — Integration` |
| Scope overlays | none |

## Current State

S1 implementation and focused validation are complete. The fresh direct/plugin absolute score gap
is `0.3019801981861221`; leader-anchored close-score groups now restore the unchanged exact golden
on both base and fresh corpora without changing public contracts.

## Completed

- Read required harness/tooling/PR/doctrine/JSR skills and relevant authority files.
- Re-baselined live issue #1615, sibling PR #1608, branch/base, doctrine assignment, public surface,
  ranking implementation, fixture, and relevant debt.
- Printed and cross-checked base and fresh candidate scores.
- Recorded PLAN-EVAL N/A; mandatory separate-session IMPL-EVAL remains with the orchestrator.
- Opened draft PR #1617 with `Closes #1615`, exactly `status:impl`, requested labels, milestone 0.0.6.
- Implemented and focused-tested close-score grouping; fresh 8-case fixture passed twice across two
  independently constructed corpora.

## In Progress

- S1 implementation commit and PR comment.

## Next Steps

1. Commit/push S1 and post its PR phase comment.
2. Run the throwaway-commit negative control and record the raw exit.
3. Run repository, scoped static/doc-lint, and quality gates; finalize S2 evidence.

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
| `packages/mcp/src/domain/docs/guidance-index.ts` | changed | measured transitive close-score ordering policy |
| `packages/mcp/tests/guidance-retrieval_test.ts` | changed | grouping/no-chaining/same-page ordering proof |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Measurement | pass | base and fresh scores printed; instrumentation cross-check passed |
| Static | partial pass | focused guidance test: 7 passed; requested guidance filter: 13 passed |
| Fitness | pending | S2 |
| Runtime | pass | base adapter parity/rerun plus fresh 8 cases × 2 corpora × 2 reruns |
| Consumer | pass | unchanged exact fixture and guidance contract tests |

## Open Questions

- None.

## Drift and Debt

- Drift: evaluator override and fresh-head rank detail recorded in `drift.md`.
- Debt: pre-existing `MCP-A6-V2-SHAPE` unchanged; no new debt planned.

## Commits

- See the draft PR's commit list + per-slice PR comments.
