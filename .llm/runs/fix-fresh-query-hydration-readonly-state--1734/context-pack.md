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

The evaluator-artifact head is preserved beneath committed RED slice `8dac327d0b21d4fcdabea7adce69e785c1b2a4fb`
and product repair `a1dc5fce65058ab47cd49c5af13d91c145f0d1cf`. All 11 focused tests pass:
the real `QueryHydrationScript` serializer, paused mutations with/without variables, a paused retry
with wire `failureReason: {}`, error-field revival, both exact dependency versions, and the
evaluator attack set. Public types, exports, and the `^5.101.0` range remain unchanged. The root
test is host-red on two unrelated `.llm/tools/agentic/**` tests; all other required static gates pass.

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

- S6 run-artifact handoff and exact-head rerun.

## Next Steps

1. Commit final run-state artifacts, then rerun every required gate at that immutable head.
2. Explicit-refspec push and verify exact local/remote/PR equality.
3. Update the PR body and post the single `[PHASE: IMPL]` repair comment; keep draft/labels intact.

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
| `packages/fresh/tests/query-hydration-roundtrip_test.tsx` | new | Real serializer and JSON-boundary regression coverage. |
| `packages/fresh/tests/query-hydration-version-compat_test.ts` | new | RED child-check regression. |
| `packages/fresh/tests/type-fixtures/query-hydration-5.102.8-deno.json` | new | Exact 5.102.8 no-lock config. |
| `packages/fresh/tests/type-fixtures/query-hydration-5.101.0-deno.json` | new | Exact 5.101.0 no-lock config. |
| `packages/fresh/src/application/query/hydration.ts` | changed | Private validated mutable conversion. |
| `packages/fresh/tests/query-hydration_test.ts` | new | Valid readonly hydration and invalid-entry behavior. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | partial | focused/check/lint/fmt pass; root test host-red on 2 unrelated agentic tests |
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
