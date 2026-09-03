# Context Pack: Canary 9 README service-readiness repair

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-readiness` |
| Branch | `fix/canary-readme-service-readiness` |
| Current phase | `plan` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | docs |

## Current State

Canary 9 production run `33712927776` passed README commands 1–10, then hung 900 seconds on the unbounded health curl. This leaf owns only the printed users-readiness, bounded curl, honest runner alignment, and missing cleanup artifact upload.

## Completed

- Exact main/run/issue re-baseline.
- Architecture/gate selection and `PLAN-EVAL: N/A` recorded before implementation.

## In Progress

- Bootstrap commit, push, and draft PR.

## Next Steps

1. Implement the two command-contract changes and regressions.
2. Add exact cleanup receipt upload coverage.
3. Run focused/static/quality gates, push, and request separate-session IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Await `users` explicitly | production incident | endpoint allocation is not readiness |
| Curl max 15s; outer gate 20s | incident bound | actionable failure instead of 900-second hang |
| Do not close issues | #1881 | hosted acceptance remains pending |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.../leaf-1881-readiness/` | new | harness activation records |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | NOT_RUN | implementation pending |
| Fitness | NOT_RUN | implementation pending |
| Runtime | deferred | fresh hosted published-version run |
| Consumer | NOT_RUN | implementation pending |

## Open Questions

- None.

## Drift and Debt

- Drift: Canary 9 exposed a readiness assumption not caught by the initial implementation evaluation.
- Debt: none planned.

## Commits

- See the draft PR's commit list + per-slice PR comments.

