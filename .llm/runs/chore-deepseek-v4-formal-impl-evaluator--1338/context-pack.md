# Context Pack — DeepSeek formal IMPL-EVAL default

## Run metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-deepseek-v4-formal-impl-evaluator--1338` |
| Issue | #1338 |
| Branch | `chore/deepseek-v4-formal-impl-evaluator-1338` |
| Base | `canary/0.0.5-canary.14` @ `2508eb8c99c9cfc55e0c9f1d7ab72fea745db492` |
| Phase | research / plan |
| Archetype | N/A — maintainer agentic tooling |
| Overlay | docs / generated skills |

## Objective

Make pending/future formal IMPL-EVAL resolve `deepseek/deepseek-v4-flash-0731` at max effort while formal PLAN-EVAL remains `minimax/minimax-m3` at high effort. Preserve valid completed Qwen PASS evidence; never reinterpret an unexecuted CI retry as green.

## Current evidence

- The DeepSeek model literal already exists centrally for hybrid delegation, but the formal evaluator allowlist, evaluator preset, canonical route, tests, harness docs, and skills still bind Qwen 3.8 high.
- Generated `.claude/skills` mirrors are owned by `agentic:sync-claude`; consumer output is owned by `agentic:dogfood-skills`.
- Historical #1331/Qwen artifacts remain immutable.
- Milestone T1-B Actions run `31121552268` was queued with zero jobs at the orchestrator re-baseline; it is not current-head green evidence.

## Next gate

Dedicated supervisor research/plan, then a fresh separate Minimax M3 PLAN-EVAL. No implementation before PASS.

