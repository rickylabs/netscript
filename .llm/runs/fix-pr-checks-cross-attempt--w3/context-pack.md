# Context Pack: cross-attempt PR-check supersession

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-pr-checks-cross-attempt--w3` |
| Branch | `fix/pr-checks-cross-attempt` |
| Current phase | plan |
| Archetype | N/A — repository tooling |
| Scope overlays | none |

## Current State

Issue #1187 is re-baselined on current main. The defect is the read seam: default commit check-runs
can omit the successful latest rerun attempt. No implementation has started.

## Completed

- Read issue evidence and the currently exposed evidence comment.
- Verified clean branch and fast-forwarded to current `origin/main`.
- Recorded the milestone D6 composed-evaluation waiver for local formal PLAN-EVAL.

## In Progress

- Bootstrap commit and draft PR opening.

## Next Steps

1. Demonstrate the RED fixture on baseline.
2. Implement latest-attempt workflow-job reconciliation.
3. Run scoped gates and immutable-run/live verification.
4. Push, comment, and hand off to composed evaluation.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Jobs API `filter=latest` is truth | issue #1187 + plan D1 | Correlate by check-run ID, not name alone. |
| No local formal PLAN-EVAL | owner directive / milestone D6 | Marked composed, not self-certified. |

## Files Changed

- Run artifacts only at bootstrap.

## Gates

All implementation gates pending.

## Drift and Debt

- Drift: recurrence count five→six; expected two comments but GitHub currently reports one.
- Debt: none.

## Commits

- See the draft PR's commit list and per-slice comments.
