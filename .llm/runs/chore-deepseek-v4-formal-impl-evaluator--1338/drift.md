# Drift — chore-deepseek-v4-formal-impl-evaluator--1338

## D-1 — Owner-authorized formal IMPL-EVAL route replacement

- Date: 2026-08-06
- Classification: intentional route-policy change, not fallback
- Previous pending/future default: `qwen/qwen3.8-max`, high effort
- New pending/future default: `deepseek/deepseek-v4-flash-0731`, max effort
- Unchanged: formal PLAN-EVAL `minimax/minimax-m3`, high effort
- Evidence rule: valid completed Qwen PASS artifacts remain valid; interrupted/incomplete Qwen work is not resumed under a different model.

## D-2 — Historical evidence boundary

Prior #1331 run artifacts and completed 0.0.5 Qwen evaluator evidence are immutable history. Active canonical policy, forward prompts, and prepared future cluster routes must converge on DeepSeek max after this prerequisite lands.

