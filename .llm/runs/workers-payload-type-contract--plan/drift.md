# Drift Log: workers payload type contract

Drift is append-only.

## 2026-09-02 — native Fable evaluator unavailable

- **What:** The preferred native PLAN-EVAL route could not start an evaluation.
- **Source:** Native Claude session `ece26f81-5475-4026-9d25-34b5826028e0`.
- **Expected:** Claude/Anthropic Fable 5 at medium effort.
- **Actual:** Claude Code observed requested model `fable-5`, then returned
  `unrecognized_model` before reading/evaluating the plan.
- **Severity:** minor
- **Action:** the owner accepted `f655c3405` and explicitly waived PLAN-EVAL before the fallback
  launched; proceed to implementation.
- **Evidence:** evaluator launch exit 1; no `plan-eval.md` was created by the failed session.
