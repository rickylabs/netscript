# Context Pack: Fresh query hydration readonly/mutable type correction

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-fresh-query-hydration-readonly-state--1734` |
| Branch | `fix/fresh-query-hydration-readonly-state` |
| Current phase | `implement` (cycle-4 owner-approved total private reviver) |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` (contract-only) |

## Current State

All three prior evaluator artifacts are preserved unchanged. Cycle 4 is owner-authorized and bounded
to replacing the private rejection-value allowlist in `reviveSerializedError` with a total,
non-throwing reviver. S9 captured an 11-pass / 3-fail RED through the real transport: JSON-omitted
mutation and query error fields reject the whole state, while hostile coercion escapes through
`String(value)`. Public types, exports, and dependency range remain untouched.

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
- Cycle-4 owner ruling, required skills, doctrine, all prior verdicts, drift, and worklog reviewed.
- S9 real-transport RED reproduced for omitted mutation state, query error twins, and hostile
  coercion; production source is still untouched.

## In Progress

- S9 RED is ready to commit as a standalone slice before the private implementation changes.

## Next Steps

1. Commit the S9 RED slice.
2. Implement the total private reviver and prove both the supported-value and guard-attack
   directions.
3. Rebase onto owner-pinned `24f6642f040617de573c7cef1140eed1ac0efd6d`, run the complete static and
   leased one-pass runtime gates at the immutable head, then push by explicit refspec and update the
   draft PR without dispatching IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Keep `^5.101.0` | plan D1 | Support entire range. |
| Keep public `DehydratedState` unchanged | plan D2 | No mutable widening or upstream leak. |
| Revive serialized error records | plan D5 | Restore real `Error` values; retain string fields where present. |
| Preserve JSON rejection values | cycle-3 amendment | Wrap them in `Error` and retain the original value in `cause`; no public widening. |
| Make the private reviver total | cycle-4 owner ruling | Every non-null state value becomes an `Error`; safe message selection cannot invoke hostile object coercion. |

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
