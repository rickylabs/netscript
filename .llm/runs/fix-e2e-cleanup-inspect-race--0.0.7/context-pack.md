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

S1–S3 are locally complete. Same-id `No such object` produces a vanished id, generic inspect
failures still throw, and `stopAndProbe` aggregates vanished ids across observations into additive
`docker.vanishedContainerIds` receipt evidence. Final durable gates at `63282ffcc` pass: tests 9/9,
Aspire parity 946/0 failures, and quality/doctrine exit 0. Scoped check/lint/fmt are clean.

## Completed

- Harness activation, research, doctrine/archetype selection, and design checkpoint.
- Exact decisions for error matching, receipt compatibility, and aggregation.
- S1 deterministic regression and expected-failure receipt.
- S2 same-id classification, negative failure regression, receipt aggregation, and focused GREEN.
- S3 scoped static gates, exact-head durable receipts, quality/doctrine, Aspire parity, and
  prohibited-delta guards.

## In Progress

- Hosted CI tiers and separate-session native Fable IMPL-EVAL.

## Next Steps

1. Commit/push the S3 evidence record.
2. Verify both hosted runtime tiers at the fix head.
3. Run the separate native Fable IMPL-EVAL and apply any findings.
4. Complete close-gate evidence and mark the PR ready only when permitted by the lifecycle.

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
| `.llm/runs/fix-e2e-cleanup-inspect-race--0.0.7/receipts/s2-green.json` | new | Exact-head focused GREEN receipt. |
| `.llm/runs/fix-e2e-cleanup-inspect-race--0.0.7/receipts/s3-*.json` | new | Final-head test, Aspire parity, and quality/doctrine receipts. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | Scoped check/lint/fmt; `receipts/s3-test.json` |
| Fitness | PASS/PENDING_SCRIPT as specified | `receipts/s3-quality-gate.json`; manual F-CLI review |
| Runtime | pending hosted CI | No local Aspire runtime |
| Consumer | N/A | No public/generated change |

## Open Questions

- None.

## Drift and Debt

- Drift: owner-selected generator effort and unrelated `main` advance recorded; no scope drift.
- Debt: no new or deepened debt.

## Commits

- See the draft PR's commit list + per-slice PR comments.
