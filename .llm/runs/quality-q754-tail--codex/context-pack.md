# Context Pack: #754 deeper type-erasure elimination tail

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `quality-q754-tail--codex` |
| Branch | `quality/q754-tail-h` |
| Current phase | implement |
| Archetype | 1/2/4/6 by package |
| Scope overlays | frontend for fresh-ui |

## Current State

The mandated hard reset is complete at `3b3d615b`. Research and design are locked. Baseline is 16
findings/0 allowances; the rejected pass used 6 allowances. Independent PLAN-EVAL passed. Slice 1
is reviewed green and reduces the scanner to 6 findings with 0 allowances.

## Completed

- Skills/doctrine/harness reads, reset preflight, baseline scanner, upstream type inspection, plan.

## In Progress

- Slice 2 SDK and Fresh UI typed boundaries.

## Next Steps

1. Implement slices 2-4 with per-slice gates and supervisor review.
2. Run full acceptance and separate IMPL-EVAL, then force-push with lease.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| No suppression strategy | owner directive | target allowCount 0 |
| Guards/public upstream types at boundaries | plan L2-L6 | no generic post-hoc erasure |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/quality-q754-tail--codex/*` | new | harness research/design state |
| `packages/telemetry/**` | changed | dynamic-module and oRPC callback typing |
| `packages/{aspire,sdk,bench}/**` | changed | prose-only lexical scanner hits |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | slice 1 green | scanner 6 residual findings / allowCount 0; telemetry gates green |
| Fitness | plan PASS | `plan-eval.md` |
| Runtime | N/A | typing-only plan |
| Consumer | pending | implementation not started |

## Open Questions

- None blocking; evaluator may return plan fixes.

## Drift and Debt

- Drift: remote branch absent; owner forbids PR creation.
- Debt: no new or deepened entry planned.

## Commits

- No PR by owner directive; use local commit history, pushed branch, and evaluator artifacts.
