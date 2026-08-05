# Drift Log: Claude Remote Control split model gateway

## 2026-08-05 — Additional owner-selected adversarial lane

- **What:** Add OpenCode + OpenRouter Grok 4.5 high as a post-implementation adversarial check.
- **Source:** owner instruction in the active session.
- **Expected:** formal Qwen PLAN-EVAL/IMPL-EVAL under the default local harness policy.
- **Actual:** formal Qwen gates remain, plus the owner-selected Grok review.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` route table and `plan.md` validation order.

## 2026-08-05 — Cloud evaluator excluded

- **What:** Do not dispatch PLAN-EVAL or IMPL-EVAL to OpenHands.
- **Source:** owner instruction in the active session.
- **Expected:** harness permits either a local OpenRouter evaluator or OpenHands cloud evaluator.
- **Actual:** only separate local OpenRouter evaluator sessions are authorized for this run because
  the cloud surface cannot reproduce its WSL/tmux/OAuth/runtime dependencies.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` recorded lane constraint.
