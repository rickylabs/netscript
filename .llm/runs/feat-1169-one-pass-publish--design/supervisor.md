# Supervisor identity — feat-1169-one-pass-publish--design

- **Model / session**: Claude · Anthropic · Fable 5 · low (Claude Code, session 2026-08-03)
- **Host**: WSL2 linux, /home/codex/repos/ns004-onepass (worktree)
- **Branch**: `feat/1169-one-pass-publish`, baseline `origin/main` @ `442f1f7b8`
- **Milestone**: 0.0.5 · Epic #1169
- **Scope**: design + slicing proposal FIRST (commented on #1169), then per-slice implementation PRs.

## Lane table (per `.llm/harness/workflow/lane-policy.md`)

| Lane | Route |
| --- | --- |
| Orchestrator / design (`planning_decisions`) | Claude · Fable 5 · low (this session) |
| Mechanical implementation (`light_implementation`) | Codex · GPT-5.6 Sol · low, app-server-attached via `deno task agentic:launch-codex-slice` (per brief) |
| Slice review of Codex work (`review_codex_light`) | Opus 4.8 · high (or supervisor substantive review per A1) |
| Formal PLAN-EVAL / IMPL-EVAL (`formal_evaluation`) | Claude + OpenRouter, open-model Qwen preset (`qwen/qwen3.7-max`), separate session |

## Constraints (from BRIEF.md)

- Do NOT touch PR #1159, its branch, `.llm/tools/release/`, or the canary surface.
- Every new gate/predicate needs its negative case demonstrated.
- Verify artefacts, never exit codes; read actual error text.
- One expensive suite at a time; prove ownership before killing anything.
