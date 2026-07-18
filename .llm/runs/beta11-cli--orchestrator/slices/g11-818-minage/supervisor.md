# Supervisor Identity — g11-818-minage

| Field | Value |
| --- | --- |
| Model | Codex · GPT-5.6 Sol · medium |
| Session | G11 implementation session; supervised by Fable 5 orchestrator `86d308d5-c761-4e5d-a41f-8be959bc46d2` |
| Host | `YogaBook9i` · WSL2 Linux · `codex` |
| Checkout | `/home/codex/repos/wt-g11-818` |
| Worktree | `/home/codex/repos/wt-g11-818` |
| Branch | `fix/818-min-dep-age-lockstep` |
| Baseline | `56cf84b5` (`origin/main`, 2026-07-18) |
| Run ID | `beta11-cli--orchestrator/slices/g11-818-minage` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `normal_implementation` | Codex · OpenAI · GPT-5.6 Sol · medium | Research, plan, and implementation slices |
| `review_codex` | Claude · Anthropic · Fable 5 · low | Tier-A opposite-family slice review |
| `formal_evaluation` | Claude Code + OpenRouter · Qwen 3.7 Max · open-model preset | Separate PLAN-EVAL / IMPL-EVAL, supervisor-dispatched only |

No lane override is active. This implementation agent does not dispatch evaluators or reviews.
