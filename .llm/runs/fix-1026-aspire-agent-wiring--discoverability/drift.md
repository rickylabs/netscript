# Drift

## D-1 — PLAN-EVAL transport blocked (2026-08-01)

- Severity: process blocker; no product-scope drift.
- Expected: local `claude-openrouter` evaluator using the bound open-model Qwen preset.
- Observed: `claude-print` reached Claude Code but returned `model_not_found`; the live provider canary returned `status: blocked`, `credential: absent`, diagnostic `auth_required`.
- Constraint: the harness and OpenHands handoff rules prohibit a closed-model formal evaluator and prohibit cloud OpenHands for this local run.
- Action: implementation remains paused. The supervisor requires restored OpenRouter credentials or an explicit owner waiver of the Plan-Gate before proceeding.
