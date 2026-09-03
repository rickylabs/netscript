# Supervisor Identity — docs-background-reference-preflight--1770

| Field | Value |
| --- | --- |
| Model | OpenAI GPT-5.6 Sol, medium |
| Session | `01a0522a-8eb8-7912-8dbb-526db23d711b` |
| Host | Linux `/home/agent` |
| Checkout | `/home/agent/projects/netscript/worktrees/007-leaf-1770` |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1770` |
| Branch | `docs/background-reference-preflight` (no upstream by design) |
| Baseline | `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c` |
| Run ID | `docs-background-reference-preflight--1770` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `normal_implementation` | OpenAI / GPT-5.6 Sol / medium | Research, placement decision, documentation authoring, and gates |
| `formal_plan_evaluation` | Anthropic / Fable 5 / medium | Fresh opposite-family PLAN-EVAL before documentation implementation |
| `review_codex` | Anthropic / Fable 5 / low | Separate substantive slice review before sign-off |
| `formal_impl_evaluation` | Anthropic / Fable 5 / medium | Fresh opposite-family IMPL-EVAL after implementation |

Reference `.llm/harness/workflow/lane-policy.md`; no route override is planned.
