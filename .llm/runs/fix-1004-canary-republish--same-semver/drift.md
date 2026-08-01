# Drift Log: same-semver canary republish

## 2026-08-01 — Local formal evaluator unavailable

- **What:** The canonical local Claude Code + OpenRouter Qwen PLAN-EVAL launch could not start because `OPENROUTER_API_KEY` is unavailable in this environment.
- **Source:** `claude-print` preflight exited 4 before launch; no evaluator session was created and no model spend occurred.
- **Expected:** A separate local open-model session writes `plan-eval.md` before implementation.
- **Actual:** The local credential is absent. OpenHands is prohibited for a local-machine run unless the owner explicitly changes the run route; native closed-model Claude cannot substitute for formal evaluation.
- **Severity:** significant
- **Action:** defer pending owner direction; implementation remains blocked.
- **Evidence:** `.llm/tmp/1004-plan-eval.md`; current environment credential preflight.
