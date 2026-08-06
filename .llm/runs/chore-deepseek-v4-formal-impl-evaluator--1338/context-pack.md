# Context Pack — DeepSeek formal IMPL-EVAL default

## Run metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-deepseek-v4-formal-impl-evaluator--1338` |
| Issue | #1338 |
| Branch | `chore/deepseek-v4-formal-impl-evaluator-1338` |
| Base | `canary/0.0.5-canary.14` @ `2508eb8c99c9cfc55e0c9f1d7ab72fea745db492` |
| Phase | S1 implemented and gated; review/sign-off pending |
| Archetype | N/A — maintainer agentic tooling |
| Overlay | docs / generated skills |

## Objective

Make pending/future formal IMPL-EVAL resolve `deepseek/deepseek-v4-flash-0731` at max effort while formal PLAN-EVAL remains `minimax/minimax-m3` at high effort. Preserve valid completed Qwen PASS evidence; never reinterpret an unexecuted CI retry as green.

## Current evidence

- The DeepSeek model literal already exists centrally for hybrid delegation, but the formal evaluator allowlist, evaluator preset, canonical route, tests, harness docs, and skills still bind Qwen 3.8 high.
- Generated `.claude/skills` mirrors are owned by `agentic:sync-claude`; consumer output is owned by `agentic:dogfood-skills`.
- Historical #1331/Qwen artifacts remain immutable.
- Draft PR #1339 targets exact canary.14 base; pushed planning head before this evidence correction
  is `8bcf4cb8033b2722f431e30e0c93043e6075e198`.
- Active 0.0.5 orchestration artifacts live on `orchestrator/0.0.5-continuation`, observed at
  `81d32354d55cf5e814a3a326ab84415e308d76d8`, rather than this prerequisite branch.
- T1-B's sole admissible Qwen high session `abe31571-0fa1-4ea4-9085-1c36ea14a5c7` PASS is completed
  valid history and remains accepted. Actions run `31121552268` did not execute a complete green
  current-head rollup; this route change neither upgrades nor reruns it.
- T1-A's pending formal evaluator must become a fresh DeepSeek max session against its exact clean
  target after this prerequisite lands and the exact live DeepSeek canary passes. Prior Qwen
  attempts are not resumed or relabelled.
- The first launch emitted Remote Control `disabled`, so supervisor thread
  `019fd897-cf69-75d3-9e46-bb87cc62c226` is phone-not-attached. Runtime repair dry-run safely
  refused mutation with status `blocked`, state `disconnected`, diagnostic `active_session` because
  foreign/other sessions were active. No phone attachment is claimed.
- This correction continues that same thread through repository `codex-resume` and actual Codex CLI
  in tmux `ns1338-deepseek-supervisor`; attach with
  `tmux attach-session -t ns1338-deepseek-supervisor`. Cost is `unavailable`, not zero.
- The worktree was clean before launcher execution. The app-server launch subprocess caused lock
  resolution churn; the milestone orchestrator restored only this worktree `deno.lock` to exact
  HEAD blob `ef28b1b056705b456a66601ceeb46eede9def7b0`. Root and T1-B protected lock states were
  untouched. The lock is now clean and must stay omitted from staging.
- S1 now resolves formal PLAN to Minimax M3 high and formal IMPL to DeepSeek V4 Flash 0731 max,
  removes Qwen from the formal allowlist/active preset registry, and rejects retired Qwen 3.8 in a
  focused regression. Qwen's central id remains for generic non-formal OpenHands consumers; all S1
  retained occurrences are rejection coverage.
- Focused tests passed 46/46. Corrected lockless scoped check passed 149 files/2 batches; scoped lint
  passed 149 files/0 findings; scoped fmt passed after one mechanical owned repair.
- The first scoped check produced launch-subprocess-style lock resolution churn because child
  `deno check` lacked `--no-lock`. The supervisor stopped. The milestone orchestrator attributed
  and restored only this worktree lock; root and T1-B locks were untouched. The corrected wrapper
  invocation uses `--deno-arg --no-lock`, and HEAD/index/worktree lock identity is again
  `ef28b1b056705b456a66601ceeb46eede9def7b0`.

## Next gate

Formal PLAN-EVAL passed in fresh separate Minimax M3 high session
`a583f0da-69b3-4717-8271-bca95d9cd2db` against exact clean planning head
`258034b1f9842bae781ca7e5eecffc2c61af13e4`; its complete verdict is `plan-eval.md`.
S1 awaits separate ordinary review and supervisor sign-off under orchestrator control; this S1 turn
did not launch them and does not self-certify. S2 canary schema/live proof remains wholly pending.
Do not begin S2/S3, formal IMPL-EVAL, merge, publish, or touch `deno.lock` in this handoff.
