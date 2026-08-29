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

S1 RED is present and independently pinned to query-core 5.102.8. Its structured focused test exits
1 with only the expected TS2345 at the untouched production hydration call. The public readonly
contract and open range remain locked unchanged.

## Completed

- Required skills, harness workflow, static gates, doctrine, archetype, overlay, and issue read.
- Exact 5.102.8 failure reproduced and declared range restored.
- Dependency latest/why evidence and JSR/doc-lint baselines captured.
- S0 pushed and draft PR #1736 opened with required metadata.
- S1 RED fixture/test added and proven failing before implementation.

## In Progress

- S1 RED commit and push.

## Next Steps

1. Implement the private validated mutable conversion.
2. Run exact dual-version and requested static gates.
3. Push exact head and leave the PR draft for external Tier-A/IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Keep `^5.101.0` | plan D1 | Support entire range. |
| Keep public `DehydratedState` unchanged | plan D2 | No mutable widening or upstream leak. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-fresh-query-hydration-readonly-state--1734/*` | new | Harness evidence only. |
| `packages/fresh/tests/query-hydration-version-compat_test.ts` | new | RED child-check regression. |
| `packages/fresh/tests/type-fixtures/query-hydration-5.102-deno.json` | new | Exact 5.102.8 no-lock config. |

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
