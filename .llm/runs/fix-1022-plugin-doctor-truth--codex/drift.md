# Drift Log: plugin doctor runtime truth

## 2026-08-01 — evaluator route owner override

- **What:** Opus 5 supervisor supplies PLAN-EVAL and IMPL-EVAL for the 0.0.3 fix train.
- **Expected:** Default harness formal evaluator uses the bound open-model route.
- **Actual:** Owner explicitly selected a separate Opus 5 session and pre-approved this plan.
- **Severity:** minor
- **Action:** accept
- **Evidence:** owner instruction in task thread; `plan-eval.md`.
