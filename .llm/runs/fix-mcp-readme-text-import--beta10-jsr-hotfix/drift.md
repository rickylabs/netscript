# Drift Log: registry-safe MCP README embedding

## 2026-07-17 — Local formal evaluator credential unavailable

- **What:** The local Claude Code + OpenRouter Qwen canary could not launch, so formal evaluation moved to the canonical OpenHands cloud route with the same approved open model.
- **Source:** `deno task agentic:provider-canary --live --profile claude-openrouter --model qwen/qwen3.7-max --effort high --worktree /home/codex/repos/b10-textimport`.
- **Expected:** Local formal evaluator route available.
- **Actual:** Structured result `status=blocked`, diagnostic `auth_required`, credential `absent`.
- **Severity:** minor
- **Action:** fix — load the configured `/home/codex/.config/netscript-agentic/openrouter.env` credential source, re-run the local canary, and use the canonical local evaluator. The interim OpenHands fallback failed before a model turn because its runtime lacked `fastapi` (Actions run `29559553914`); no verdict was produced.
- **Evidence:** local canary then passed with tools/reasoning/streaming supported; PLAN-EVAL session `f03ae1dd-da69-406a-b725-f3bf391255a8` wrote `plan-eval.md` with `PASS`.
