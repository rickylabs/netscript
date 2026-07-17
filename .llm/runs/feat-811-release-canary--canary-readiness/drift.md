# Drift Log: canary publish channel and publish readiness

## 2026-07-17 — invalid evaluator delegation attempt

- **Phase:** PLAN-EVAL
- **Severity:** moderate (routing/cost-protection violation; no product or plan verdict impact)
- **Observed:** the first OpenRouter/Qwen evaluator session invoked Claude Code's `Task` mechanism,
  which routed exploratory subagents to a closed Claude model.
- **Response:** the supervisor interrupted the session immediately and discarded the attempted
  evaluation. It produced no `plan-eval.md` and cannot satisfy the gate.
- **Correction:** retry in a fresh OpenRouter/Qwen session with delegation explicitly prohibited;
  the evaluator must inspect and write its verdict directly.
- **Scope impact:** none. Implementation remains blocked until the corrected PLAN-EVAL returns
  `PASS`.

## 2026-07-17 — Fable review route unavailable

- **Phase:** implementation slice 2 review
- **Severity:** minor (route health only)
- **Observed:** native Claude returned `model_not_found` for the prescribed Fable 5 medium route
  before it read the slice.
- **Response:** use the canonical `review_codex_complex` opposite-family fallback, Claude Opus 4.8
  at medium effort. No review result was accepted from the failed Fable launch.
- **Scope impact:** none.
