# Context Pack: cross-attempt PR-check supersession

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-pr-checks-cross-attempt--w3` |
| Branch | `fix/pr-checks-cross-attempt` |
| Current phase | impl-eval handoff |
| Archetype | N/A — repository tooling |
| Scope overlays | none |

## Current State

The implementation and all scoped gates are complete. Latest-attempt Actions jobs are merged into
the commit check-run candidates using `check_run_url` identity and explicit precedence; queued jobs
remain pending and genuinely failing latest attempts exit 1.

## Completed

- Read issue evidence and the currently exposed evidence comment.
- Verified clean branch and fast-forwarded to current `origin/main`.
- Recorded the milestone D6 composed-evaluation waiver for local formal PLAN-EVAL.
- Demonstrated baseline RED and corrected GREEN (12 tests).
- Passed scoped check/lint/format, live PR verification, and opposite-family re-review.
- Reconciled the CI volatile-value guard by sourcing the fixture API base from canonical config.

## In Progress

- Composed GitHub evaluator/reviewer handoff on draft PR #1205.

## Next Steps

1. Commit and explicitly push S1.
2. Update PR evidence/checklists and post the implementation phase comment.
3. Trigger composed evaluation and reconcile findings.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Jobs API `filter=latest` is truth | issue #1187 + plan D1 | Correlate by parsed `check_run_url`, not job id or name alone. |
| No local formal PLAN-EVAL | owner directive / milestone D6 | Marked composed, not self-certified. |

## Files Changed

- `.llm/tools/agentic/github/pr-checks.ts` — latest-attempt reconciliation.
- `.llm/tools/agentic/github/pr-checks_test.ts` — 6 new attempt/collision/pending fixtures.
- Run artifacts — evidence and handoff state.

## Gates

Static gates and focused tests PASS; runtime and consumer gates are N/A for internal read-only tooling.

## Drift and Debt

- Drift: recurrence five→six; one exposed comment; issue run/check provenance mismatch; canonical
  Fable review model unavailable, approved Opus fallback used.
- Debt: none.

## Commits

- See the draft PR's commit list and per-slice comments.
