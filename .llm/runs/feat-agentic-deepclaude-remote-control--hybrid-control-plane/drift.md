# Drift Log: hybrid Claude Remote Control

## 2026-08-05 — transparent DeepClaude mode is outside supported Claude behavior

- **What:** The reference implementation claims Remote Control with `ANTHROPIC_BASE_URL`, but
  current Claude disables exactly that combination and older compatible-gateway builds lack Remote
  Control.
- **Source:** official Claude Code changelog, upstream `aattaran/deepclaude` source, and local
  2.1.91/2.1.222 probes.
- **Expected:** A split proxy alone would enable mobile Remote Control with OpenRouter inference.
- **Actual:** There is no official-version overlap; transparent replacement would need patching or
  TLS interception.
- **Severity:** architectural
- **Action:** rescope
- **Evidence:** `research.md` findings 2–6 and merged PR #1314.

## 2026-08-05 — bound Qwen PLAN-EVAL transport failed twice

- **What:** OpenCode/Qwen emitted unavailable `unknown` tool calls on two formal evaluator launches;
  the no-tool attachment retry returned no verdict.
- **Source:** local `deno task agentic:opencode` PLAN-EVAL attempts.
- **Expected:** Bound Qwen writes `plan-eval.md` through the local OpenCode transport.
- **Actual:** The approved Minimax M3 fallback completed the same separate-session protocol and
  wrote `PASS`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `plan-eval.md`; evaluator model is in `OPEN_EVALUATOR_MODEL_IDS`.
