# Drift Log: registry-safe MCP README embedding

## 2026-07-17 — Local formal evaluator credential unavailable

- **What:** The local Claude Code + OpenRouter Qwen canary could not launch, so formal evaluation moved to the canonical OpenHands cloud route with the same approved open model.
- **Source:** `deno task agentic:provider-canary --live --profile claude-openrouter --model qwen/qwen3.7-max --effort high --worktree /home/codex/repos/b10-textimport`.
- **Expected:** Local formal evaluator route available.
- **Actual:** Structured result `status=blocked`, diagnostic `auth_required`, credential `absent`.
- **Severity:** minor
- **Action:** fix — use the lane policy's canonical OpenHands cloud evaluator route.
- **Evidence:** supervisor route table and provider-canary output in the supervisor session.
