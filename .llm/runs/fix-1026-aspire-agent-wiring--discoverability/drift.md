# Drift

## D-1 — PLAN-EVAL transport blocked (2026-08-01)

- Severity: process blocker; no product-scope drift.
- Expected: local `claude-openrouter` evaluator using the bound open-model Qwen preset.
- Observed: `claude-print` reached Claude Code but returned `model_not_found`; the live provider canary returned `status: blocked`, `credential: absent`, diagnostic `auth_required`.
- Constraint: the harness and OpenHands handoff rules prohibit a closed-model formal evaluator and prohibit cloud OpenHands for this local run.
- Resolution: owner instruction waived the open-model lane for the 0.0.3 fix train. Opus supervisor commit `31adeb936` supplied `plan-eval.md` with verdict `PASS`. The missing credential is not a blocker for this slice, and the prohibited evaluator commands will not be retried.
- Binding corrections: missing-binary warning, delegation product idempotence, three-link discoverability evidence, and explicit #1023 overlap in the PR body.
