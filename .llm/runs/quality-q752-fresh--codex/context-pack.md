# Context Pack: properly type `packages/fresh`

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `quality-q752-fresh--codex` |
| Branch | `quality/q752-fresh-h` |
| Current phase | `implement` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Current State

Clean base `3b3d615b`; 25 baseline scanner findings / 0 allowances. Rejected pass `cb538f4` used 25
allowances. Research, plan, Design checkpoint, and separate PLAN-EVAL PASS are complete; no source
implementation has begun.

## Completed

- Required skills/doctrine/harness material read.
- Owner reset performed and verified.
- Scanner, doc-lint, publish, lock, public-surface, and rejected-pass baselines captured.

## In Progress

- Slice 4 StreamDB typing and complete gates.

## Next Steps

1. Implement the four ordered type slices without pre-authorized allowances.
2. Run all acceptance gates and obtain separate IMPL-EVAL.
3. Commit and force-push the final branch.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Archetype 4 + frontend | doctrine verdict / archetype docs | Overrides an initial integration-shaped read. |
| Zero allowances assumed | owner directive / plan D6 | Any survivor requires member-level proof. |
| No PR | owner directive | Local verdict artifacts and pushed commits are the trail. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/quality-q752-fresh--codex/*` | new | harness bootstrap/plan artifacts only |
| `packages/fresh/src/application/{builders,route}/**` | changed | Actual generic factories and compatibility aliases replace facade erasure. |
| `packages/fresh/src/application/form/**` | changed | Typed mutable error map and guarded Zod internals. |
| `packages/fresh/src/application/query/**` | changed | Upstream-derived query generics and honest infinite data. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | baseline captured | scanner 25/0; docs and publish green |
| Fitness | PLAN-EVAL PASS | `plan-eval.md` |
| Runtime | pending | no implementation |
| Consumer | pending | no implementation |

## Open Questions

- None before implementation.

## Drift and Debt

- Drift: no PR trail due to explicit owner directive; classification corrected to Archetype 4.
- Debt: existing Fresh restructure debt unchanged.

## Commits

- No implementation commit yet; PR trail intentionally unavailable by owner directive.
