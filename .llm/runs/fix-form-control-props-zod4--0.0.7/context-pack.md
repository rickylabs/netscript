# Context Pack: #1249 form control props and Zod 4 constraints

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-form-control-props-zod4--0.0.7` |
| Branch | `fix/form-control-props-zod4` |
| Current phase | `plan` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` (consumer type contract) |

## Current State

S1 is GREEN. S2 RED is independently reproduced against locked npm Zod 4.4.3: the exact full-map test lacks `slug.pattern` and `quantity.min/max/step`, while all other expected fields match. S2 is therefore admitted for 0.0.7. Mandatory IMPL-EVAL remains assigned to a separate native opposite-family session.

## Completed

- Re-baselined branch, public form surface, doctrine verdict, locked Zod family, and lock identity.
- Selected Archetype 4 and the frontend contract overlay.
- Locked role derivation, Zod mappings, exclusive-bound behavior, slices, gates, and ceiling.
- Opened draft PR #1960 with requested labels and 0.0.7 milestone.
- Added and ran the independent S1 RED probe.
- Implemented and validated S1 GREEN; 82 scoped tests pass.
- Added and ran S2 RED; focused result is 16 passed/1 failed and full scoped result is 82 passed/1 failed.

## In Progress

- S2 GREEN Zod 4 check decoding.

## Next Steps

1. Land S2 GREEN for regex plus inclusive numeric constraints.
2. Run S3/full gates and hand off to the separate evaluator without self-certification.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Intrinsic-derived role type | `plan.md` D1 | No `unknown`, no duplicated role union. |
| Inclusive numeric mapping only | `plan.md` D2 | Exclusive bounds omitted from native attributes. |
| Conditional S2 admission | Issue #1249 / brief | Unexpected green defers Zod half to 0.0.8. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-form-control-props-zod4--0.0.7/*` | new | Harness activation, research, plan, worklog, context, drift. |
| `packages/fresh/src/application/form/control-props-element-assignability_test.tsx` | new | S1 TSX consumer RED probe. |
| `packages/fresh/src/application/form/_internal/prop-types.ts` | changed | Intrinsic-derived `role` property type. |
| `packages/fresh/src/application/form/schema-adapter/schema-adapter.test.ts` | changed | Exact five-field S2 RED map. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | Expected S2 RED | Check/lint/fmt exit 0; tests exit 1 with 82 passed/1 expected failure. |
| Fitness | PASS at S2 RED | `quality:gate` exit 0; final JSR/doc gates remain planned. |
| Runtime | N/A | No runtime/browser workflow change. |
| Consumer | PASS | Input/select/textarea spreads compile without casts after RED proof. |

## Open Questions

- None; S2 admission is an explicit probe outcome, not an open design choice.

## Drift and Debt

- Drift: none yet.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
