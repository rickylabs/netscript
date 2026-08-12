# Context Pack: generated route runtime binding

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `fix-1576-form-c-route-path-binding--1576-1568` |
| Branch         | `fix/1576-form-c-route-path-binding`            |
| Current phase  | `implement`                                     |
| Archetype      | `4 — Public DSL / Builder`                      |
| Scope overlays | `frontend`                                      |

## Current State

PR #1602 correction cycle 2 is active at evaluated baseline `f9e924d0b`. The fallback IMPL-EVAL
accepted the original `withRoute` mechanism and returned `FAIL_FIX` for omitted-schema
`withRouteContract` divergence plus malformed partial-reference validation. Both new regressions
were captured red and now pass. All owner-specified gates pass: scoped check/lint/fmt select 189
files with zero findings, the package suite passes 241/241, and the explicit Fresh source quality
scan reports zero findings and zero allowances. Final lock/scope hygiene passes; commit, push, and
PR comment remain.

## Key Decisions

- Latest explicit builder schema wins; otherwise reference parser; otherwise empty state.
- `definePartial` receives an additive `route` option.
- Shared resolver owns both page and partial failure semantics.
- Complete-reference type constraint plus inferred/resolved key tests form the divergence guard.
- Inline `withRouteContract` schemas win when supplied; otherwise prior path/search schemas are
  retained in both runtime config and the bound reference.
- Routed partials reuse the page builder's route-reference guard and exact validation message.

## Next Steps

1. Commit and push cycle 2 by explicit refspec.
2. Post `[PHASE: IMPL]` with red evidence and verbatim gates, leaving re-evaluation automatic.

## Files Changed

- Shared page resolver/handler wiring and parser-bearing route constraint.
- Route-bound partial overload, public types, docs, runtime/type matrices, and surface snapshots.
- Cycle-2 route-contract promotion, partial validation, and regressions.
- Harness run artifacts.

## Gates

- Cycle-2 focused regressions: PASS after captured exit-1 failures on the evaluated head.
- Scoped Fresh check/lint/fmt: PASS (189 selected files; zero findings).
- Fresh package suite: PASS (241 passed, 0 failed).
- Explicit Fresh source quality scan: PASS (zero findings, zero allowances).

## Drift and Debt

- Drift: evaluator defaults overridden by explicit owner prohibition; recorded in `drift.md`.
- Debt: no new architecture debt planned.
- C3 route-inference index-signature behavior remains evaluator advisory/non-scope.
- Orchestrator filed C3 as #1610 and explicitly retained #1576 criterion 5 as unticked pending real
  partial-request evidence.

## Commits

- See the draft PR's commit list + per-slice PR comments.
