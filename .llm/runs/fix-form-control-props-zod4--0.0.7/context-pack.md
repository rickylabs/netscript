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

S1 is GREEN: after the three-diagnostic RED proof, `ControlProps.role` derives from Preact's intrinsic HTML role type and the input/select/textarea consumer compiles. All scoped S1 GREEN gates exit 0. Mandatory IMPL-EVAL remains assigned to a separate native opposite-family session.

## Completed

- Re-baselined branch, public form surface, doctrine verdict, locked Zod family, and lock identity.
- Selected Archetype 4 and the frontend contract overlay.
- Locked role derivation, Zod mappings, exclusive-bound behavior, slices, gates, and ceiling.
- Opened draft PR #1960 with requested labels and 0.0.7 milestone.
- Added and ran the independent S1 RED probe.
- Implemented and validated S1 GREEN; 82 scoped tests pass.

## In Progress

- S2 RED exact locked-family five-field constraint probe.

## Next Steps

1. Land S2 RED; proceed only if the exact locked family fails as expected, then S2 GREEN.
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

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS at S1 GREEN | Focused check plus scoped check/test/lint/fmt exit 0; 82 tests. |
| Fitness | PASS at S1 GREEN | `quality:gate` exit 0; final JSR/doc gates remain planned. |
| Runtime | N/A | No runtime/browser workflow change. |
| Consumer | PASS | Input/select/textarea spreads compile without casts after RED proof. |

## Open Questions

- None; S2 admission is an explicit probe outcome, not an open design choice.

## Drift and Debt

- Drift: none yet.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
