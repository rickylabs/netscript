# Context Pack: #754 deeper type-erasure elimination tail

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `quality-q754-tail--codex` |
| Branch | `quality/q754-tail-h` |
| Current phase | plan-eval |
| Archetype | 1/2/4/6 by package |
| Scope overlays | frontend for fresh-ui |

## Current State

The mandated hard reset is complete at `3b3d615b`. Research and design are locked. Baseline is 16
findings/0 allowances; the rejected pass used 6 allowances. No implementation has begun.

## Completed

- Skills/doctrine/harness reads, reset preflight, baseline scanner, upstream type inspection, plan.

## In Progress

- Separate opposite-family PLAN-EVAL.

## Next Steps

1. Obtain PLAN-EVAL PASS.
2. Implement the four designed slices with per-slice gates and supervisor review.
3. Run full acceptance and separate IMPL-EVAL, then force-push with lease.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| No suppression strategy | owner directive | target allowCount 0 |
| Guards/public upstream types at boundaries | plan L2-L6 | no generic post-hoc erasure |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/quality-q754-tail--codex/*` | new | harness research/design state |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | baseline red | scanner 16 findings |
| Fitness | plan pending | PLAN-EVAL not yet run |
| Runtime | N/A | typing-only plan |
| Consumer | pending | implementation not started |

## Open Questions

- None blocking; evaluator may return plan fixes.

## Drift and Debt

- Drift: remote branch absent; owner forbids PR creation.
- Debt: no new or deepened entry planned.

## Commits

- No PR by owner directive; use local commit history, pushed branch, and evaluator artifacts.

