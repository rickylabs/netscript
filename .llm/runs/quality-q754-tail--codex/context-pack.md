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
findings/0 allowances; the rejected pass used 6 allowances. Independent PLAN-EVAL passed. Slices
1-3 are reviewed green; the exact seven-root scanner now has 0 findings and allowCount 0.

## Completed

- Skills/doctrine/harness reads, reset preflight, baseline scanner, upstream type inspection, plan.
- Slice 1 telemetry and lexical typing fixes, gates, review, and sign-off commit.
- Slice 2 SDK/Fresh UI typing fixes, regression tests, FAIL_FIX correction, and PASS review.
- Slice 3 plugin error-map adapters, success/rejection tests, package gates, and PASS review.

## In Progress

- Full seven-package acceptance matrix and final IMPL-EVAL.

## Next Steps

1. Run every required seven-package gate and reconcile final worklog evidence.
2. Run separate IMPL-EVAL, sign off artifacts, then force-push with lease.

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
| `packages/fresh-ui/**` | changed | truthful primitive/style/summary types and focused render test |
| `packages/sdk/**` | changed | validated oRPC router boundary and regression test |
| `packages/plugin-{ai,auth}-core/**` | changed | Standard Schema adapters and contract-map tests |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | slices 1-3 green | scanner 0 findings / allowCount 0; scoped gates green |
| Fitness | plan + slice reviews PASS | plan evaluation and all three review artifacts |
| Runtime | slice 2 green | SDK link guard and Fresh SSR summary regression tests |
| Consumer | slice 2 green | SDK 16 tests; Fresh UI 134 tests |

## Open Questions

- None blocking; final evaluator may return implementation fixes.

## Drift and Debt

- Drift: remote branch absent; owner forbids PR creation; Fresh test task gained the minimal existing-test read permission.
- Debt: no new or deepened entry planned.

## Commits

- No PR by owner directive; use local commit history, pushed branch, and evaluator artifacts.
