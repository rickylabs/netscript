# Context Pack: Fresh query hydration readonly/mutable type correction

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-fresh-query-hydration-readonly-state--1734` |
| Branch | `fix/fresh-query-hydration-readonly-state` |
| Current phase | `plan` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` (contract-only) |

## Current State

Clean exact-base branch; issue reproduced against 5.102.8; public readonly contract and open range
are locked unchanged. PLAN-EVAL is N/A for this small mechanical correction.

## Completed

- Required skills, harness workflow, static gates, doctrine, archetype, overlay, and issue read.
- Exact 5.102.8 failure reproduced and declared range restored.
- Dependency latest/why evidence and JSR/doc-lint baselines captured.

## In Progress

- S0 bootstrap commit and draft PR.

## Next Steps

1. Add and commit the exact-version RED regression.
2. Implement the private validated mutable conversion.
3. Run exact dual-version and requested static gates.
4. Push exact head and leave the PR draft for external Tier-A/IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Keep `^5.101.0` | plan D1 | Support entire range. |
| Keep public `DehydratedState` unchanged | plan D2 | No mutable widening or upstream leak. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-fresh-query-hydration-readonly-state--1734/*` | new | Harness evidence only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | baseline RED reproduced | worklog |
| Fitness | inherited baseline captured | JSR/doc-lint commands |
| Runtime | N/A | no lease |
| Consumer | pending | S2 |

## Open Questions

- None.

## Drift and Debt

- Drift: historical Fresh doc-lint resolution no longer matches current 45-diagnostic baseline.
- Debt: no new debt; inherited findings remain outside issue #1734.

## Commits

- See the draft PR's commit list + per-slice PR comments.
