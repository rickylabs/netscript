# Context Pack: properly type `@netscript/contracts`

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `quality-q750-contracts--codex` |
| Branch | `quality/q750-contracts-h` |
| Current phase | `implement` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `none` |

## Current State

The owner-mandated reset is complete at `3b3d615b`. Research and Design are written. The fresh
scanner baseline is 50 findings / 0 allowances; the rejected prior pass used 41 allowances. The
load-bearing design decision is to replace the lossy output-only schema facade at composition
boundaries with native Zod input/output/object generics. Slice 1 is implemented and green.

## Completed

- Preflight, skill/doctrine/harness loading, scanner and JSR baselines.
- Recovery and verification of the rejected pass's allowance count.
- Research, plan, supervisor identity, Design checkpoint, and drift artifacts.
- PLAN-EVAL PASS before implementation.
- Slice 1 implementation and automated gates: scanner 50 → 41, allowances 0; scoped wrappers and
  five package tests green.

## In Progress

- Slice 1 separate review and sign-off commit, then Slice 2 native Zod typing.

## Next Steps

1. Implement the three locked slices with per-slice gates and substantive review.
2. Run final scanner, package, consumer, doctrine, lock, and IMPL-EVAL gates.
3. Commit and force-push with lease; do not open a PR.

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
| `packages/contracts/src/application/paginated-query.ts` | changed | Prisma argument bags use `unknown` |
| `packages/contracts/src/application/transform-helpers.ts` | changed | typed omit construction and heterogeneous transformer accumulator |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | slice 1 PASS | scoped check/lint/fmt and five tests green |
| Fitness | improving | scanner 41 findings / 0 allowances after slice 1 |
| Runtime | N/A | no runtime behavior |
| Consumer | pending | planned after implementation |

## Open Questions

- None blocking Plan-Gate.

PLAN-EVAL passed in separate Claude Opus 4.8 session
`b2f5d950-e468-4fde-8177-0460ffada95e` before package implementation began.

## Drift and Debt

- Drift: no PR/comment trail by owner directive; no mobile visibility claim.
- Debt: accepted root `crud/` layout unchanged; closed slow-type debt stays closed.

## Commits

- See branch history; owner forbids a PR for this run.
