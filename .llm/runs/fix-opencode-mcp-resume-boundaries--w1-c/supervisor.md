# Supervisor Identity — fix-opencode-mcp-resume-boundaries--w1-c

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field    | Value                                                                             |
| -------- | --------------------------------------------------------------------------------- |
| Model    | OpenAI / `gpt-5.6-sol` / high                                                     |
| Session  | Repo-native managed app-server thread `019fdc4e-476f-7ae2-bfdc-48772775ce70`      |
| Host     | YogaBook9i / WSL2 Linux / user `codex`                                            |
| Checkout | `/home/codex/repos/ns005-c15-w1c-opencode-host`                                   |
| Worktree | `/home/codex/repos/ns005-c15-w1c-opencode-host`                                   |
| Branch   | `fix/opencode-mcp-resume-boundaries`                                              |
| Baseline | `origin/main` at `1455231b0b7700c515e6226538cb12ec251f943c` (verified 2026-08-07) |
| Run ID   | `fix-opencode-mcp-resume-boundaries--w1-c`                                        |

## Routes in force

| Task lane                 | Provider / model / effort                                                 | Role in this run                                                    |
| ------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `complex_implementation`  | OpenAI / `gpt-5.6-sol` / high                                             | Sole implementation writer through the repo-native app-server route |
| `formal_plan_evaluation`  | Claude transport / OpenRouter / `minimax/minimax-m3` / high               | Separate PLAN-EVAL session                                          |
| `formal_impl_evaluation`  | Claude transport / OpenRouter / `deepseek/deepseek-v4-flash-0731` / max   | Mandatory separate IMPL-EVAL session                                |
| `adversarial_design_eval` | OpenCode / OpenRouter / configured `OPENCODE_MODEL_IDS.visionEval` / high | Only current OpenCode route requiring live resume evidence          |

## Recorded lane/eval overrides

- The checked-in launcher receipt identifies the already-running sole implementation writer as the
  repo-native managed app-server thread `019fdc4e-476f-7ae2-bfdc-48772775ce70`, using OpenAI
  `gpt-5.6-sol` at high effort. A read-only runtime-status query did not surface that identity, but
  the transient inventory miss did not invalidate the launcher receipt; no rival writer was
  launched.
- Prepared coordination notes named an obsolete Sol-low implementation route and Qwen evaluator. The
  live owner prompt and checked-in lane policy instead require the current writer, conditional
  Minimax PLAN-EVAL, and DeepSeek V4 Flash 0731 max IMPL-EVAL. The change is mirrored in `drift.md`.
