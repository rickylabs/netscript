# Supervisor Identity — fix-1016-scaffold-tsconfig--project-boundary

| Field | Value |
| --- | --- |
| Model | OpenAI Codex (current API session) |
| Session | current `/root` session; no externally visible id exposed |
| Host | Linux / WSL, user `codex` |
| Checkout | `/home/codex/repos/fix-1016` |
| Worktree | `/home/codex/repos/fix-1016` |
| Branch | `fix/1016-scaffold-tsconfig` |
| Baseline | `3ab64720f` (`main`, 2026-08-01) |
| Run ID | `fix-1016-scaffold-tsconfig--project-boundary` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| planning_decisions | OpenAI / Codex current session | Supervisor, research, plan, slice sign-off |
| light_implementation | OpenAI / Codex current session | One narrow scaffold writer/test slice |
| formal_evaluation | OpenRouter / `qwen/qwen3.7-max` / policy-bound effort | Separate PLAN-EVAL and IMPL-EVAL sessions |
| review_codex_light | Claude / opposite-family policy route | Ordinary slice review if available |

The formal evaluator must be a separate session and may not use a closed model.
