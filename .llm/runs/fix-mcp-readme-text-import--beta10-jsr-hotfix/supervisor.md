# Supervisor Identity — fix-mcp-readme-text-import--beta10-jsr-hotfix

| Field | Value |
| --- | --- |
| Model | Codex root session (API model identity not exposed) |
| Session | current `/root` session |
| Host | Linux / `/home/codex` |
| Checkout | `/home/codex/repos/b10-textimport` |
| Worktree | `/home/codex/repos/b10-textimport` |
| Branch | `fix/mcp-readme-text-import` |
| Baseline | `a5adb706` (`origin/main`, 2026-07-17) |
| Run ID | `fix-mcp-readme-text-import--beta10-jsr-hotfix` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `light_implementation` | current Codex root implementation session | Scoped hotfix implementation |
| `formal_evaluation` | Claude Code + OpenRouter / Qwen 3.7 Max / high | Separate-session PLAN-EVAL and IMPL-EVAL; PLAN-EVAL session `f03ae1dd-da69-406a-b725-f3bf391255a8` |
| `review_codex_light` | Claude opposite-family review route | Slice-review gate after automated evidence |

Reference `.llm/harness/workflow/lane-policy.md`. The configured OpenRouter environment was loaded for the canonical local formal-evaluator transport.
