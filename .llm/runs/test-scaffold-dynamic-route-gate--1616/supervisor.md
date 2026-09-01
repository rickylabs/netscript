# Supervisor Identity — test-scaffold-dynamic-route-gate--1616

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | OpenAI GPT-5.6 Sol |
| Session | `01a05306-dccf-7043-b81f-a10c5dd797d7` |
| Host | `ai-agents` · Linux x86_64 · `agent` |
| Checkout | `/home/agent/projects/netscript/repo` |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1616` |
| Branch | `test/scaffold-dynamic-route-gate` |
| Baseline | `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c` · live `main` · 2026-08-30 |
| Run ID | `test-scaffold-dynamic-route-gate--1616` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `normal_implementation` | OpenAI · GPT-5.6 Sol · medium | Bootstrap, research, and plan generator; implementation remains blocked at PLAN-EVAL. |
| `formal_plan_evaluation` | Native opposite-family · Fable 5 · medium | Future PLAN-EVAL in a separate supervisor-dispatched session; not launched by this run. |
| `formal_impl_evaluation` | Native opposite-family · Fable 5 · medium | Future IMPL-EVAL in a separate supervisor-dispatched session; not launched by this run. |

No lane or evaluator override is active.
