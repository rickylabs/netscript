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

S1 RED is complete: the cleanup probe accepts an injected command runner, and the new colocated
regression fails only because the listed id returns same-id `No such object` during inspect. The
durable receipt is retained. The classification fix has not started.

## Completed

- Harness activation, research, doctrine/archetype selection, and design checkpoint.
- Exact decisions for error matching, receipt compatibility, and aggregation.
- S1 deterministic regression and expected-failure receipt.

## In Progress

- S2 GREEN classification and receipt evidence.

## Next Steps

1. Implement classification and additive receipt evidence; capture GREEN.
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
| `packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/cleanup.ts` | changed | Injectable runner seam only in S1. |
| `packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/cleanup_test.ts` | new | RED listed-then-removed regression. |
| `.llm/runs/fix-e2e-cleanup-inspect-race--0.0.7/receipts/s1-red.json` | new | Expected failing gate receipt. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | RED as planned | `receipts/s1-red.json` |
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
