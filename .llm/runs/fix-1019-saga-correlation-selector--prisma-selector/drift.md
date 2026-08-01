# Drift Log: Prisma saga correlation selector

## 2026-08-01 — local PLAN-EVAL credential unavailable

- **What:** The canonical local formal-evaluator route could not launch.
- **Source:** `deno task agentic:provider-canary --live --profile claude-openrouter ...`
- **Expected:** Claude Code + OpenRouter Qwen PLAN-EVAL writes `plan-eval.md` in a separate session.
- **Actual:** Provider canary returned `status: blocked`, `credential: absent`, and `auth_required`;
  the earlier unbound attempt returned `model_not_found` before inference. An unauthorized stray
  Opus/owner-waiver artifact was rejected and removed.
- **Severity:** significant
- **Action:** defer pending owner authorization or credential availability; do not implement.
- **Evidence:** terminal output in supervisor session; PR #1032 Plan-Gate comment.
