# Drift Log: plugin doctor runtime truth

## 2026-08-01 — evaluator route owner override

- **What:** Opus 5 supervisor supplies PLAN-EVAL and IMPL-EVAL for the 0.0.3 fix train.
- **Expected:** Default harness formal evaluator uses the bound open-model route.
- **Actual:** Owner explicitly selected a separate Opus 5 session and pre-approved this plan.
- **Severity:** minor
- **Action:** accept
- **Evidence:** owner instruction in task thread; `plan-eval.md`.

## 2026-08-01 — config validation issues are flattened

- **What:** The doctor use case can expand structured validation issues, but the production child
  config loader throws a plain `Error` containing raw stderr.
- **Expected:** A `ZodError` might cross the loader boundary for per-field rendering.
- **Actual:** `project-config-loader.ts` discards the structured error shape at the process edge.
- **Severity:** significant
- **Action:** defer
- **Evidence:** `packages/cli/src/kernel/adapters/config/project-config-loader.ts`; acceptance box 5
  remains unticked in PR #1045.
