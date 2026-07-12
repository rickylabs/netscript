# Drift Log: `@netscript/mcp` S1

No drift recorded. This file is append-only.

## 2026-07-12 — PLAN-EVAL route fallback

- **What:** The configured local opposite-family Claude PLAN-EVAL process exited twice without output or the required verdict artifact; a separate evaluator session was used as the available fallback.
- **Source:** `claude -p --model opus ...` process results and missing `plan-eval.md`.
- **Expected:** Opposite-family local session writes `plan-eval.md`.
- **Actual:** Process exit succeeded but produced neither stdout nor an artifact.
- **Severity:** significant
- **Action:** accept for this owner-requested harness continuation; preserve separate-session invariant.
- **Evidence:** `.llm/tmp/s1-plan-eval-prompt.md`; evaluator artifact records its session.
