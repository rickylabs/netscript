# Context Pack: Fresh query hydration readonly/mutable type correction

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-fresh-query-hydration-readonly-state--1734` |
| Branch | `fix/fresh-query-hydration-readonly-state` |
| Current phase | `gate` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` (contract-only) |

## Current State

The evaluator-artifact head is preserved and the bounded FAIL_FIX repair is in its RED slice. The
new suite crosses the real `QueryHydrationScript` serializer: the success query passes, while four
paused-mutation cases fail at the current guard. The default prior-failure path independently
reproduces `failureReason: {}` before hydration. Public types, exports, and the `^5.101.0` range
remain unchanged.

## Completed

- Required skills, harness workflow, static gates, doctrine, archetype, overlay, and issue read.
- Exact 5.102.8 failure reproduced and declared range restored.
- Dependency latest/why evidence and JSR/doc-lint baselines captured.
- S0 pushed and draft PR #1736 opened with required metadata.
- S1 RED fixture/test added and proven failing before implementation.
- S2 private boundary correction and behavior tests implemented.
- Focused tests/check/lint/fmt, quality scan (`allowCount: 7`), and arch check pass.
- Root check/test/lint/fmt, quality scan, arch check, and Fresh publish dry-run pass.
- Fresh doc-lint and JSR audit remain at their recorded inherited baselines.

## In Progress

- S4 RED commit for the serialized hydration regression.

## Next Steps

1. Commit the S4 RED slice on top of evaluator artifact `ed8a8e9ca9be2e72da4a00bff830caf260ee94ea`.
2. Implement private JSON-shape normalization and error revival without public-surface changes.
3. Commit final artifacts, rerun exact-head receipts, explicit-refspec push, and update PR #1736.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Keep `^5.101.0` | plan D1 | Support entire range. |
| Keep public `DehydratedState` unchanged | plan D2 | No mutable widening or upstream leak. |
| Revive serialized error records | plan D5 | Restore real `Error` values; retain string fields where present. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-fresh-query-hydration-readonly-state--1734/*` | new | Harness evidence only. |
| `packages/fresh/tests/query-hydration-version-compat_test.ts` | new | RED child-check regression. |
| `packages/fresh/tests/type-fixtures/query-hydration-5.102.8-deno.json` | new | Exact 5.102.8 no-lock config. |
| `packages/fresh/tests/type-fixtures/query-hydration-5.101.0-deno.json` | new | Exact 5.101.0 no-lock config. |
| `packages/fresh/src/application/query/hydration.ts` | changed | Private validated mutable conversion. |
| `packages/fresh/tests/query-hydration_test.ts` | new | Valid readonly hydration and invalid-entry behavior. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | preliminary full PASS | root check; 4,246/0 tests; 2,045-file lint/fmt |
| Fitness | preliminary full PASS | quality scan allowCount 7; arch check; Fresh publish dry-run |
| Runtime | N/A | no lease |
| Consumer | PASS | exact 5.101.0 and 5.102.8 no-lock checks |

## Open Questions

- None.

## Drift and Debt

- Drift: historical Fresh doc-lint resolution no longer matches current 45-diagnostic baseline;
  a transient F-16 warning from colocated test placement was fixed before commit.
- Debt: no new debt; inherited findings remain outside issue #1734.

## Commits

- See the draft PR's commit list + per-slice PR comments.
