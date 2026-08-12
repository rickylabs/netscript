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

PR #1602 correction cycle 3 is active at resynced head `831460b64`. Cycle-2 C1/C4 is accepted. The
remaining task is evidence-only: use #1600's browser harness to prove a generated dynamic Form-C
reference loads through a real `fresh-partial=true` request without 500 and renders its typed path.
The focused browser contract passes on the accepted resolver and fails with actual 500 when only the
reference fallback is removed. All final gates pass; commit, push, and PR comment remain.

## Key Decisions

- Latest explicit builder schema wins; otherwise reference parser; otherwise empty state.
- `definePartial` receives an additive `route` option.
- Shared resolver owns both page and partial failure semantics.
- Complete-reference type constraint plus inferred/resolved key tests form the divergence guard.
- Inline `withRouteContract` schemas win when supplied; otherwise prior path/search schemas are
  retained in both runtime config and the bound reference.
- Routed partials reuse the page builder's route-reference guard and exact validation message.

## Next Steps

1. Commit and push cycle 3 by explicit refspec.
2. Post `[PHASE: IMPL]` with the real partial-request and red-counterfactual evidence.

## Files Changed

- Shared page resolver/handler wiring and parser-bearing route constraint.
- Route-bound partial overload, public types, docs, runtime/type matrices, and surface snapshots.
- Cycle-2 route-contract promotion, partial validation, and regressions.
- Cycle-3 browser test plus isolated generated-route Fresh/Vite fixture.
- Harness run artifacts.

## Gates

- Cycle-3 focused browser test: RED at 500 without the route fallback; PASS after restoration.
- Scoped Fresh check/lint/fmt: PASS (197 selected files; zero findings).
- Fresh package suite: PASS (245 passed, 0 failed).
- Fresh browser suite: PASS (2 passed, 0 failed).
- Exact requested quality task: PASS; includes seven existing non-Fresh allowances because the task
  prepends CLI/plugin/docs roots after #1596.
- Explicit Fresh source quality scan: PASS (zero findings, zero allowances).

## Drift and Debt

- Drift: evaluator defaults overridden by explicit owner prohibition; recorded in `drift.md`.
- Debt: no new architecture debt planned.
- C3 route-inference index-signature behavior remains evaluator advisory/non-scope.
- Orchestrator filed C3 as #1610; #1568 criterion 5 remains non-scope and unclaimed.

## Commits

- See the draft PR's commit list + per-slice PR comments.
