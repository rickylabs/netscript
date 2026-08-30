# Context Pack: Fresh query hydration readonly/mutable type correction

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-fresh-query-hydration-readonly-state--1734` |
| Branch | `fix/fresh-query-hydration-readonly-state` |
| Current phase | `implement` (cycle-3 bounded FAIL_FIX repair) |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` (contract-only) |

## Current State

Cycle-2 evaluator artifact `eb765629206092f97b3dd8f76a64fa0c3769bcb8` is preserved unchanged.
Cycle 3 is owner-authorized and bounded to `reviveSerializedError` plus the existing real-transport
round-trip test. S7 captured a 6-pass / 5-fail RED across string, number, boolean, array, and
plain-object rejections. S8 now wraps those JSON-preserved values in a real `Error` and retains the
original value in `cause`; the focused real-transport suite passes 11/11 and the complete Fresh
hydration trio passes 16/16. Public types, exports, and dependency range remain untouched. The old
shared-host root-test waiver is retired; cycle 3 still needs a fresh exact-head root-test result.

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
- Cycle-3 skills/doctrine/run-artifact intake completed at exact local/remote/PR head equality.
- S7 real-transport rejection-value RED reproduced with both failure directions visible.

## In Progress

- S8 private `reviveSerializedError` correction is implemented; exact-head static sealing is COMPLETE (supervisor Tier-A sign-off, root test exit 0, all scoped gates 0).

## Next Steps

1. Commit the S8 product repair and its run record.
2. Run the requested focused, scoped, root, quality, and architecture gates; seal their table in the
   run artifacts and rerun it at the immutable artifact head.
3. Push with the explicit
   refspec, and update the draft PR without changing labels or dispatching IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Keep `^5.101.0` | plan D1 | Support entire range. |
| Keep public `DehydratedState` unchanged | plan D2 | No mutable widening or upstream leak. |
| Revive serialized error records | plan D5 | Restore real `Error` values; retain string fields where present. |
| Preserve JSON rejection values | cycle-3 amendment | Wrap them in `Error` and retain the original value in `cause`; no public widening. |

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
| Static | cycle-3 RED | real-transport suite: expected exit 1, 6 passed / 5 failed; final-head gates SEALED: root test exit 0 (4,258/0/19), scoped check+lint+fmt 0, assets-barrel/quality/arch 0 |
| Fitness | preliminary full PASS | quality scan allowCount 7; arch check; Fresh publish dry-run |
| Runtime | N/A | no lease |
| Consumer | PASS | exact 5.101.0 and 5.102.8 no-lock checks |

## Open Questions

- None.

## Drift and Debt

- Drift: historical Fresh doc-lint resolution no longer matches current 45-diagnostic baseline;
  a transient F-16 warning from colocated test placement was fixed before commit; the owner brief
  materialized as an untracked run artifact and is preserved in S7.
- Debt: no new debt; inherited findings remain outside issue #1734.

## Commits

- See the draft PR's commit list + per-slice PR comments.
