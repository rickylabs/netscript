# Context Pack: properly type `@netscript/contracts`

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `quality-q750-contracts--codex` |
| Branch | `quality/q750-contracts-h` |
| Current phase | `plan-eval` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `none` |

## Current State

The owner-mandated reset is complete at `3b3d615b`. Research and Design are written. The fresh
scanner baseline is 50 findings / 0 allowances; the rejected prior pass used 41 allowances. The
load-bearing design decision is to replace the lossy output-only schema facade at composition
boundaries with native Zod input/output/object generics. No package implementation has started.

## Completed

- Preflight, skill/doctrine/harness loading, scanner and JSR baselines.
- Recovery and verification of the rejected pass's allowance count.
- Research, plan, supervisor identity, Design checkpoint, and drift artifacts.

## In Progress

- Separate opposite-family PLAN-EVAL.

## Next Steps

1. Obtain PLAN-EVAL `PASS` or repair the plan within the two-cycle limit.
2. Implement the three locked slices with per-slice gates and substantive review.
3. Run final scanner, package, consumer, doctrine, lock, and IMPL-EVAL gates.
4. Commit and force-push with lease; do not open a PR.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Archetype 4 / Keep | doctrine file 10 | Existing builder/DSL surface, no restructure |
| Native Zod generics | plan L1-L5 | Preserve real input/output/shape variance |
| Allowances are last resort | owner directive / plan L6 | target zero, ceiling eight |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/quality-q750-contracts--codex/*` | new | Harness plan artifacts only |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | baseline only | publish PASS; doc lint recorded |
| Fitness | failing baseline | scanner 50 findings / 0 allowances |
| Runtime | N/A | no runtime behavior |
| Consumer | pending | planned after implementation |

## Open Questions

- None blocking Plan-Gate.

## Drift and Debt

- Drift: no PR/comment trail by owner directive; no mobile visibility claim.
- Debt: accepted root `crud/` layout unchanged; closed slow-type debt stays closed.

## Commits

- See branch history; owner forbids a PR for this run.

