# Supervisor Identity — fix-opencode-mcp-resume-boundaries--w1-c

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Codex / GPT-5 family; exact backend model id is not exposed to this session |
| Session | Current Codex Desktop/API session; no agentic-runtime session identity was observed |
| Host | YogaBook9i / WSL2 Linux / user `codex` |
| Checkout | `/home/codex/repos/ns005-c15-w1c-opencode-host` |
| Worktree | `/home/codex/repos/ns005-c15-w1c-opencode-host` |
| Branch | `fix/opencode-mcp-resume-boundaries` |
| Baseline | `origin/main` at `1455231b0b7700c515e6226538cb12ec251f943c` (verified 2026-08-07) |
| Run ID | `fix-opencode-mcp-resume-boundaries--w1-c` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `complex_implementation` | Current owner-directed Codex session; observed exact model/effort unavailable | Sole implementation writer |
| `formal_plan_evaluation` | Claude transport / OpenRouter / `minimax/minimax-m3` / high | Separate PLAN-EVAL session |
| `formal_impl_evaluation` | Claude transport / OpenRouter / `deepseek/deepseek-v4-flash-0731` / max | Mandatory separate IMPL-EVAL session |
| `adversarial_design_eval` | OpenCode / OpenRouter / configured `OPENCODE_MODEL_IDS.visionEval` / high | Only current OpenCode route requiring live resume evidence |

## Recorded lane/eval overrides

- The user directly assigned the already-running Codex session as the sole implementation writer,
  so no new Tier-D/app-server sender is launched. The runtime controller reported zero sessions and
  no runtime identity for this worktree; worktree status was clean and no rival writer was found.
- Prepared coordination notes named an obsolete Sol-low implementation route and Qwen evaluator.
  The live owner prompt and checked-in lane policy instead require the current writer, conditional
  Minimax PLAN-EVAL, and DeepSeek V4 Flash 0731 max IMPL-EVAL. The change is mirrored in `drift.md`.
