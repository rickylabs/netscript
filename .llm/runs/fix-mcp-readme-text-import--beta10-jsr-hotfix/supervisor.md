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
| `formal_evaluation` | OpenHands cloud / OpenRouter Qwen 3.7 Max / xhigh | Separate-session PLAN-EVAL and IMPL-EVAL after local Claude/OpenRouter credential check blocked |
| `review_codex_light` | Claude opposite-family review route | Slice-review gate after automated evidence |

Reference `.llm/harness/workflow/lane-policy.md`. OpenHands is the canonical cloud formal-evaluator transport; the local transport was unavailable, as recorded in `drift.md`.
