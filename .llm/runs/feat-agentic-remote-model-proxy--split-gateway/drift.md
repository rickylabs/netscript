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

## 2026-08-05 — Remote Control goal rescoped to inference-only

- **What:** Remove Remote Control daemon/attachment modes and rename the task to
  `agentic:claude-openrouter`.
- **Source:** Claude 2.1.222 live daemon exit, missing interactive `bridgeSessionId`, and independent
  OpenCode/Grok 4.5 high `FAIL_RESCOPE`.
- **Expected:** Split loopback gateway would preserve Anthropic control traffic while routing model
  inference to OpenRouter.
- **Actual:** Claude rejects a custom base before daemon startup; interactive mode silently omits
  attachment. Path routing beneath the official hostname requires forbidden TLS interception.
- **Severity:** architectural
- **Action:** rescope
- **Evidence:** `grok-review.md`, live registry comparison, official Remote Control contract.
