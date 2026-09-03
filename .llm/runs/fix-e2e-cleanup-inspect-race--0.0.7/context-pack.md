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

The live issue, exact remote baseline, cleanup code, test conventions, Aspire teardown semantics,
and doctrine gates are researched. The design is locked and `PLAN-EVAL: N/A` is justified. No
implementation change has started.

## Completed

- Harness activation, research, doctrine/archetype selection, and design checkpoint.
- Exact decisions for error matching, receipt compatibility, and aggregation.

## In Progress

- Draft PR bootstrap, followed by S1 RED.

## Next Steps

1. Commit/push bootstrap artifacts and open the draft PR with requested metadata.
2. Add the runner seam and failing regression; capture RED.
3. Implement classification and additive receipt evidence; capture GREEN.
4. Run S3 gates and hand off to the separate native Fable evaluator.

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

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pending | S3 |
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
