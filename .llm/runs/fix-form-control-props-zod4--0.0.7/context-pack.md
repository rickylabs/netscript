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

Research and design are locked on the owner-pinned base. No implementation file has changed. PLAN-EVAL is justified N/A for this mechanical, fully specified fix; mandatory IMPL-EVAL remains assigned to a separate native opposite-family session. Bootstrap pre-push gates are green (check/test/lint/fmt/quality all exit 0; 81 tests).

## Completed

- Re-baselined branch, public form surface, doctrine verdict, locked Zod family, and lock identity.
- Selected Archetype 4 and the frontend contract overlay.
- Locked role derivation, Zod mappings, exclusive-bound behavior, slices, gates, and ceiling.

## In Progress

- Bootstrap commit and draft PR opening.

## Next Steps

1. Commit/push the activated run artifacts and open the draft PR.
2. Land S1 RED, record TS2322, then S1 GREEN.
3. Land S2 RED; proceed only if the exact locked family fails as expected, then S2 GREEN.
4. Run S3/full gates and hand off to the separate evaluator without self-certification.

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

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS at bootstrap | Scoped check/test/lint/fmt exit 0; lock SHA-256 matches pinned base. |
| Fitness | PASS at bootstrap | `quality:gate` exit 0; final JSR/doc gates remain planned. |
| Runtime | N/A | No runtime/browser workflow change. |
| Consumer | Pending | S1 TSX RED/GREEN. |

## Open Questions

- None; S2 admission is an explicit probe outcome, not an open design choice.

## Drift and Debt

- Drift: none yet.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
