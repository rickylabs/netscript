# Context Pack: deterministic guidance ranking

## Run Metadata

| Field          | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| Run ID         | `fix-1615-ranking--leaf`                                    |
| Branch         | `fix/1615-guidance-ranking-determinism`                     |
| Current phase  | `implementation complete; awaiting orchestrator evaluation` |
| Archetype      | `2 — Integration`                                           |
| Scope overlays | none                                                        |

## Current State

S3 review correction is implemented and gated. The fresh direct/plugin absolute score gap is
`0.3019801981861221`; leader-anchored close-score groups restore the unchanged exact golden on both
base and fresh corpora. Confidence again follows the post-order route-priority winner, with any
close-score-induced score movement bounded by `0.5`. Draft PR #1617 remains at `status:impl` for the
orchestrator's separate native Opus 5 read-only evaluation.

## Completed

- Read required harness/tooling/PR/doctrine/JSR skills and relevant authority files.
- Re-baselined live issue #1615, sibling PR #1608, branch/base, doctrine assignment, public surface,
  ranking implementation, fixture, and relevant debt.
- Printed and cross-checked base and fresh candidate scores.
- Recorded PLAN-EVAL N/A; mandatory separate-session IMPL-EVAL remains with the orchestrator.
- Opened draft PR #1617 with `Closes #1615`, exactly `status:impl`, requested labels, milestone
  0.0.6.
- Implemented and focused-tested close-score grouping; fresh 8-case fixture passed twice across two
  independently constructed corpora.
- Proved the evaluation can fail via throwaway commit `5d7ca0f46` (raw exit 1) and restored it via
  revert `c86a4080f` (exit 0).
- Completed the guidance, scoped static/doc, and quality gates. Full repository tests retain only
  the documented pre-existing #1589 failure: 3321 passed, 1 failed, 17 ignored.
- Corrected the review-blocking confidence change and added a route-promoted lower-scorer regression
  test. MCP package tests pass: 136 passed, 0 failed.
- Re-proved the negative control at the follow-up head with raw exit 1 and restored the fixture.

## In Progress

- S3 evidence commit/push and PR body correction.

## Next Steps

1. Commit/push the S3 review correction and update the draft PR body/comment.
2. Stop with the PR still draft and exactly `status:impl`.
3. Orchestrator dispatches mandatory native Opus 5 IMPL-EVAL against the immutable head.

## Key Decisions

| Decision                | Source            | Notes                                                                        |
| ----------------------- | ----------------- | ---------------------------------------------------------------------------- |
| Direction 1             | score measurement | near-tie, not wide semantic preference                                       |
| `closeScoreGap = 0.5`   | plan D2           | covers observed movement; leader-anchored grouping preserves transitivity    |
| No golden edit          | plan D4           | exact ranks remain meaningful after deterministic tie handling               |
| Route-winner confidence | review correction | post-order winner preserves route-promotion behavior; close-band delta ≤ 0.5 |

## Files Changed

| Path                                             | Status  | Notes                                                          |
| ------------------------------------------------ | ------- | -------------------------------------------------------------- |
| `.llm/runs/fix-1615-ranking--leaf/**`            | new     | run identity, research, design, decisions, and resumable state |
| `packages/mcp/src/domain/docs/guidance-index.ts` | changed | measured transitive close-score ordering policy                |
| `packages/mcp/tests/guidance-retrieval_test.ts`  | changed | grouping/no-chaining/same-page ordering proof                  |

## Gates

| Gate family | Current status        | Evidence                                                                                               |
| ----------- | --------------------- | ------------------------------------------------------------------------------------------------------ |
| Measurement | pass                  | base and fresh scores printed; instrumentation cross-check passed                                      |
| Static      | pass                  | S3 check/lint pass; exact touched-file format check passes; package-wide format is a #1618 non-verdict |
| Fitness     | pass                  | `quality:gate` exit 0; MCP doctrine FAIL=0                                                             |
| Runtime     | pass                  | base adapter parity/rerun plus fresh 8 cases × 2 corpora × 2 reruns                                    |
| Consumer    | pass                  | unchanged exact fixture and guidance contract tests                                                    |
| Repository  | expected baseline red | 3321 passed, 1 known #1589 failure, 17 ignored; no guidance failure                                    |

## Open Questions

- None.

## Drift and Debt

- Drift: evaluator override, fresh-head rank detail, expected #1589 base failure, confidence review
  correction, corpus-growth limit, and #1618 formatting non-verdict recorded in `drift.md`.
- Debt: pre-existing `MCP-A6-V2-SHAPE` unchanged; no new debt planned.

## Commits

- `0b73d7333` — S0 measurement/design/run activation.
- `b943392d7` — S1 implementation and focused proof.
- `5d7ca0f46` — negative-control perturbation (intentionally reverted).
- `c86a4080f` — negative-control restoration.
- Final S2 evidence — this handoff commit; use the immutable draft PR head as the authoritative
  hash.
