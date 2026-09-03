# Context Pack: #1249 form control props and Zod 4 constraints

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-form-control-props-zod4--0.0.7` |
| Branch | `fix/form-control-props-zod4` |
| Current phase | `implementation complete; evaluator handoff` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` (consumer type contract) |

## Current State

S1 and S2 are GREEN after independent RED proofs. The intrinsic consumer compiles; locked npm Zod 4.4.3 now produces the exact five-field map, and exclusive `.gt()`/`.lt()` bounds remain omitted. Final scoped, quality, JSR, publish, form-doc, and lock gates pass. Mandatory IMPL-EVAL remains assigned to a separate native opposite-family session.

## Completed

- Re-baselined branch, public form surface, doctrine verdict, locked Zod family, and lock identity.
- Selected Archetype 4 and the frontend contract overlay.
- Locked role derivation, Zod mappings, exclusive-bound behavior, slices, gates, and ceiling.
- Opened draft PR #1960 with requested labels and 0.0.7 milestone.
- Added and ran the independent S1 RED probe.
- Implemented and validated S1 GREEN; 82 scoped tests pass.
- Added and ran S2 RED; focused result is 16 passed/1 failed and full scoped result is 82 passed/1 failed.
- Implemented S2 GREEN; focused adapter tests are 18/18 and full scoped tests are 84/84.
- Reconciled the Preact role representation after doc lint exposed private dependency references; the exact Preact 10.29.2 role literals are inline and the form entrypoint is doc-clean.
- Proved the package-wide 45 doc diagnostics are identical on pinned base and branch and occur outside the form entrypoint.
- Completed final gates: check/test/lint/fmt/quality/JSR/publish/form-doc/lock all exit 0.

## In Progress

- Draft PR update and separate-session IMPL-EVAL handoff.

## Next Steps

1. Update the draft PR to `Closes #1249` with final evidence.
2. Supervisor triggers the separate opposite-family IMPL-EVAL; generator does not self-certify or mark ready.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Exact intrinsic-compatible role literals | `plan.md` D1 / `drift.md` | Derivation attempts were doc-private; exact Preact role set is inline, with no `unknown` or upstream re-export. |
| Inclusive numeric mapping only | `plan.md` D2 | Exclusive bounds omitted from native attributes. |
| Conditional S2 admission | Issue #1249 / brief | Unexpected green defers Zod half to 0.0.8. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-form-control-props-zod4--0.0.7/*` | new | Harness activation, research, plan, worklog, context, drift. |
| `packages/fresh/src/application/form/control-props-element-assignability_test.tsx` | new | S1 TSX consumer RED probe. |
| `packages/fresh/src/application/form/_internal/prop-types.ts` | changed | Intrinsic-derived `role` property type. |
| `packages/fresh/src/application/form/schema-adapter/schema-adapter.test.ts` | changed | Exact five-field S2 RED map. |
| `packages/fresh/src/application/form/schema-adapter/zod-constraints.ts` | changed | Zod 4 regex and inclusive numeric check decoding. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS final | Check/test/lint/fmt exit 0; 84 tests. |
| Fitness | PASS/BASELINE | Quality, JSR, publish, and form doc lint exit 0; full package docs match pinned-base 45 out-of-scope diagnostics. |
| Runtime | N/A | No runtime/browser workflow change. |
| Consumer | PASS | Input/select/textarea spreads compile without casts after RED proof. |

## Open Questions

- None; S2 admission is an explicit probe outcome, not an open design choice.

## Drift and Debt

- Drift: preferred derived role type was doc-private; full package doc aggregate has verified pinned-base debt.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
