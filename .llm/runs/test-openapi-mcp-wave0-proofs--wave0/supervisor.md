# Supervisor Identity — test-openapi-mcp-wave0-proofs--wave0

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field    | Value                                                                             |
| -------- | --------------------------------------------------------------------------------- |
| Model    | Codex GPT-5 root session (exact product model id is not exposed to the workspace) |
| Session  | `/root` API session; no external session URL exposed                              |
| Host     | `YogaBook9i` · Linux/WSL · user `codex`                                           |
| Checkout | `/home/codex/repos/ns005-proofs`                                                  |
| Worktree | `/home/codex/repos/ns005-proofs`                                                  |
| Branch   | `test/openapi-mcp-wave0-proofs`                                                   |
| Baseline | `fb75cf6fc5ad02130ada0ac42e6f44035ac03a9b` · `origin/main` · 2026-08-03           |
| Run ID   | `test-openapi-mcp-wave0-proofs--wave0`                                            |

## Routes in force

| Task lane               | Provider / model / effort                             | Role in this run                                                                                    |
| ----------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `planning_decisions`    | OpenAI / current Codex root session / high-equivalent | User-addressed implementation supervisor; research, orchestration, and sign-off commits             |
| `normal_implementation` | OpenAI / `gpt-5.6-sol` / medium                       | Separate daemon-attached Codex implementation thread; experiment execution and draft artifacts only |
| `review_codex`          | Anthropic / `fable-5` / low                           | Opposite-family substantive slice review before supervisor sign-off commits                         |
| `formal_evaluation`     | OpenRouter / `qwen/qwen3.7-max` / high                | Separate local PLAN-EVAL and IMPL-EVAL sessions through `claude-openrouter` / `claude-print`        |

## Recorded lane/eval overrides

- The owner explicitly addressed the current Codex session as the implementation supervisor, so
  `planning_decisions` uses the policy's Codex fallback instead of launching a new Fable supervisor.
  Implementation, ordinary review, and formal evaluation remain separate sessions on their canonical
  routes.
