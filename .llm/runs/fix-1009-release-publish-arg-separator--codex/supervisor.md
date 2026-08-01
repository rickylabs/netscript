# Supervisor Identity — fix-1009-release-publish-arg-separator--codex

| Field | Value |
| --- | --- |
| Model | OpenAI Codex · GPT-5 |
| Session | `/root` API workspace session |
| Host | Linux workspace · `/home/codex/repos/fix-1009` |
| Checkout | `/home/codex/repos/fix-1009` |
| Worktree | `/home/codex/repos/fix-1009` |
| Branch | `fix/1009-release-publish-arg-separator` |
| Baseline | `3ab64720ffe06dedc80f12e8f7bb9fa281de37b9` · `origin/main` · 2026-08-01 |
| Run ID | `fix-1009-release-publish-arg-separator--codex` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `planning_decisions` fallback | OpenAI · GPT-5 · current session | Supervisor; Fable supervisor surface is not the active host session. |
| `light_implementation` | OpenAI Codex · GPT-5 · low-equivalent | Two focused parser/test slices after PLAN-EVAL PASS. |
| `review_codex_light` | Claude-family local session · high | Ordinary slice review before sign-off commits. |
| `formal_evaluation` | Claude Code + OpenRouter · `qwen/qwen3.7-max` | Separate PLAN-EVAL and IMPL-EVAL sessions. |

## Recorded lane/eval overrides

- The owner opened this task in the current Codex workspace, so the supervisor uses the canonical
  orchestrator fallback instead of moving the run to a new Fable session. Formal evaluation remains
  on the canonical open-model route and is not waived.
