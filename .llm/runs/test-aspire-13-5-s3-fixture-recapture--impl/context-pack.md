# Context Pack: Aspire 13.5 S3 fixture re-capture

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-aspire-13-5-s3-fixture-recapture--impl` |
| Branch | `test/aspire-13-5-s3-fixture-recapture` |
| Current phase | `implement` |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Current State

Phase A is initialized from baseline `13878a80a`. Required issue, research, S2 shape evidence, current
fixtures, harness, doctrine, tools, PR, JSR, and Aspire instructions have been read. Slice 1's
intentional RED parity gate fails on exactly the four required phase-A rows; no runtime has started.

## Completed

- Re-baseline, research, plan, Design checkpoint, and justified `PLAN-EVAL: N/A`.
- Slice 1 RED receipt at `receipts/01-parity-red.json`.

## In Progress

- Slice 1 RED receipt, first commit/push, and draft PR creation.

## Next Steps

1. Commit/push slice 1 and open the metadata-complete draft PR.
2. Implement S2-derived fixtures in order.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Five-row expectation table | D-13 manifest | Four required now; telemetry pending lease. |
| No self-certification | harness lane policy | Fable supervisor owns review/evaluation. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/tools/validation/check-compat-fixtures_test.ts` | new | Phase-A parity gate. |
| `.llm/runs/test-aspire-13-5-s3-fixture-recapture--impl/` | new | Harness state. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | expected RED recorded | `receipts/01-parity-red.json` |
| Fitness | pending | slice 5 |
| Runtime | N/A phase A | lease boundary |
| Consumer | pending | export corpus gate |

## Open Questions

- None for phase A.

## Drift and Debt

- Drift: dashboard telemetry unavailable until phase B (minor, expected).
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
