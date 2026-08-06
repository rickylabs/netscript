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

## D-3 — Active milestone artifacts are on the orchestrator branch

- Date: 2026-08-06
- Observation: `.llm/runs/release-0.0.5--orchestration/**` is absent from this prerequisite base and
  present on `orchestrator/0.0.5-continuation` at observed head `81d32354d...`.
- Resolution: do not cross-edit another worktree/branch. Land canonical policy first, record an
  exact prospective convergence ledger in S3, and leave application plus evaluator launch to the
  milestone orchestrator.

## D-4 — Foreign worktree state at planning start

- Date: 2026-08-06
- Observation: `deno.lock` was already modified when the supervisor began; launcher-owned
  `codex-thread-ids.md` was untracked.
- Resolution: neither is owned by this planning slice. Do not modify, restore, delete, regenerate,
  or stage the lock; compare its exact diff before/after commands and stop on any delta. Preserve
  the launcher evidence file unstaged unless its owner explicitly incorporates it.

## D-5 — Observable supervisor session, no fabricated attachment

- Date: 2026-08-06
- Observation: agentic launch recorded Codex thread `019fd897-cf69-75d3-9e46-bb87cc62c226`, exact
  requested/observed Sol-low route, bypass runtime, rollout, and same-thread steering command. No
  tmux attachment evidence was supplied; formal Claude OpenRouter evaluation is non-Remote-Control.
- Resolution: record observable facts and `unavailable` cost/attachment fields; do not infer or
  claim mobile/tmux evidence.
