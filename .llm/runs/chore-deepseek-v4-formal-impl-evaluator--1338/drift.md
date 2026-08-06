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

## D-4 — Launch-owned lock resolution churn

- Date: 2026-08-06
- Corrected observation: this worktree was clean before launcher execution. The app-server launch
  subprocess caused `deno.lock` resolution churn; it was not pre-existing foreign state.
- Resolution: after the supervisor turn, the milestone orchestrator verified the churn was unstaged
  and restored only this worktree lock to exact HEAD blob
  `ef28b1b056705b456a66601ceeb46eede9def7b0`. Root and T1-B protected lock states were untouched.
  The launcher-owned `codex-thread-ids.md` is now included as planning evidence. Future commands
  still compare lock identity and stop on any new delta.

## D-5 — Phone attachment failed; safe runtime repair refused

- Date: 2026-08-06
- Observation: the first launch explicitly emitted Remote Control status `disabled`. Thread
  `019fd897-cf69-75d3-9e46-bb87cc62c226` was phone-not-attached. The milestone orchestrator ran the
  supported agentic runtime repair dry-run; it returned status `blocked`, state `disconnected`, and
  diagnostic `active_session` because foreign/other active sessions made repair unsafe.
- Resolution: preserve the failed/not-attached state and safe repair refusal; do not claim phone
  attachment and do not disrupt active sessions. This correction continues the same thread through
  repository `codex-resume` and actual Codex CLI in tmux session `ns1338-deepseek-supervisor`.
  Attach with `tmux attach-session -t ns1338-deepseek-supervisor`. Cost remains `unavailable`, not
  zero.
