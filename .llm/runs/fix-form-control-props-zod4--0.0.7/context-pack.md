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

S1 RED is reproduced: the package-configured TSX test reports exactly three TS2322 diagnostics for input/select/textarea, all caused by `ControlProps.role`. PLAN-EVAL is justified N/A; mandatory IMPL-EVAL remains assigned to a separate native opposite-family session.

## Completed

- Re-baselined branch, public form surface, doctrine verdict, locked Zod family, and lock identity.
- Selected Archetype 4 and the frontend contract overlay.
- Locked role derivation, Zod mappings, exclusive-bound behavior, slices, gates, and ceiling.
- Opened draft PR #1960 with requested labels and 0.0.7 milestone.
- Added and ran the independent S1 RED probe.

## In Progress

- S1 GREEN intrinsic-compatible role type.

## Next Steps

1. Land S1 GREEN and prove the TSX consumer compiles.
2. Land S2 RED; proceed only if the exact locked family fails as expected, then S2 GREEN.
3. Run S3/full gates and hand off to the separate evaluator without self-certification.

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

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | Expected RED | Check/test exit 1 on three TS2322 diagnostics; lint/fmt exit 0. |
| Fitness | PASS at S1 RED | `quality:gate` exit 0; final JSR/doc gates remain planned. |
| Runtime | N/A | No runtime/browser workflow change. |
| Consumer | RED reproduced | Input/select/textarea all fail on `role`; GREEN pending. |

## Open Questions

- None; S2 admission is an explicit probe outcome, not an open design choice.

## Drift and Debt

- Drift: none yet.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
