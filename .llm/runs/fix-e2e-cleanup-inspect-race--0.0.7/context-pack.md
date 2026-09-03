# Context Pack: cleanup container-inspect removal race

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-e2e-cleanup-inspect-race--0.0.7` |
| Branch | `fix/e2e-cleanup-inspect-race` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` (parent package) |
| Scope overlays | `none` |

## Current State

S1 RED and S2 GREEN behavior are complete. Same-id `No such object` now produces a vanished id,
generic inspect failures still throw, and `stopAndProbe` aggregates vanished ids across observations
into additive `docker.vanishedContainerIds` receipt evidence. Focused cleanup tests pass 9/9.

## Completed

- Harness activation, research, doctrine/archetype selection, and design checkpoint.
- Exact decisions for error matching, receipt compatibility, and aggregation.
- S1 deterministic regression and expected-failure receipt.
- S2 same-id classification, negative failure regression, receipt aggregation, and focused GREEN.

## In Progress

- S2 commit/push and exact-head GREEN receipt, followed by S3 gates.

## Next Steps

1. Commit/push S2 and capture an exact-head GREEN receipt.
2. Run S3 gates and hand off to the separate native Fable evaluator.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Same-id `No such object` is the only nonfatal inspect failure. | plan D1 | All other failures throw. |
| Add `docker.vanishedContainerIds`. | plan D2 | Existing receipt fields remain. |
| Aggregate across every probe. | plan D3 | Ordered de-duplication. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-e2e-cleanup-inspect-race--0.0.7/*` | new | Harness bootstrap artifacts. |
| `packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/cleanup.ts` | changed | Runner seam, vanished classification, aggregation, additive receipt field. |
| `packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/cleanup_test.ts` | new | Vanished-container and generic-failure regressions. |
| `.llm/runs/fix-e2e-cleanup-inspect-race--0.0.7/receipts/s1-red.json` | new | Expected failing gate receipt. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | focused GREEN; full S3 pending | 9/9 cleanup tests |
| Fitness | design-reviewed; automated pending | S3 |
| Runtime | pending hosted CI | No local Aspire runtime |
| Consumer | N/A | No public/generated change |

## Open Questions

- None.

## Drift and Debt

- Drift: owner-selected generator effort recorded; no scope drift.
- Debt: no new or deepened debt.

## Commits

- See the draft PR's commit list + per-slice PR comments.
