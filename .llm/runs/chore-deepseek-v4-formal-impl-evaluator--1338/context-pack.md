# Context Pack — DeepSeek formal IMPL-EVAL default

## Run metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-deepseek-v4-formal-impl-evaluator--1338` |
| Issue | #1338 |
| Branch | `chore/deepseek-v4-formal-impl-evaluator-1338` |
| Base | `canary/0.0.5-canary.14` @ `2508eb8c99c9cfc55e0c9f1d7ab72fea745db492` |
| Phase | plan locked; awaiting independent PLAN-EVAL |
| Archetype | N/A — maintainer agentic tooling |
| Overlay | docs / generated skills |

## Objective

Make pending/future formal IMPL-EVAL resolve `deepseek/deepseek-v4-flash-0731` at max effort while formal PLAN-EVAL remains `minimax/minimax-m3` at high effort. Preserve valid completed Qwen PASS evidence; never reinterpret an unexecuted CI retry as green.

## Current evidence

- The DeepSeek model literal already exists centrally for hybrid delegation, but the formal evaluator allowlist, evaluator preset, canonical route, tests, harness docs, and skills still bind Qwen 3.8 high.
- Generated `.claude/skills` mirrors are owned by `agentic:sync-claude`; consumer output is owned by `agentic:dogfood-skills`.
- Historical #1331/Qwen artifacts remain immutable.
- Draft PR #1339 targets exact canary.14 base and currently has bootstrap head
  `cd3dc77cea5d9053d0b0a17b1d08121a67a36fa1`.
- Active 0.0.5 orchestration artifacts live on `orchestrator/0.0.5-continuation`, observed at
  `81d32354d55cf5e814a3a326ab84415e308d76d8`, rather than this prerequisite branch.
- T1-B's sole admissible Qwen high session `abe31571-0fa1-4ea4-9085-1c36ea14a5c7` PASS is completed
  valid history and remains accepted. Actions run `31121552268` did not execute a complete green
  current-head rollup; this route change neither upgrades nor reruns it.
- T1-A's pending formal evaluator must become a fresh DeepSeek max session against its exact clean
  target after this prerequisite lands and the exact live DeepSeek canary passes. Prior Qwen
  attempts are not resumed or relabelled.
- The worktree has a pre-existing foreign `deno.lock` diff. It remains unstaged and untouched; any
  further delta is a hard stop.
- Research and the three-slice locked plan are complete. No route implementation exists on this
  branch yet.

## Next gate

The milestone orchestrator launches a fresh separate Minimax M3 high PLAN-EVAL against the exact
pushed planning head using `plan-eval-prompt.md`. No implementation before `PASS`; this generator
does not self-certify.
