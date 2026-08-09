# Supervisor Identity — W3-A #1326 durable producer reconnect

Written at run activation per `workflow/lane-policy.md` § Supervisor identity.

| Field    | Value                                                                                                          |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| Model    | OpenAI GPT-5.6 Sol                                                                                             |
| Session  | Current Codex implementation-supervisor thread; product does not expose a stable thread id in this environment |
| Host     | Linux / WSL2, `/home/codex`                                                                                    |
| Checkout | `/home/codex/repos/ns005-w3a`                                                                                  |
| Worktree | `/home/codex/repos/ns005-w3a`                                                                                  |
| Branch   | `fix/streams-durable-producer-reconnect`                                                                       |
| Baseline | `origin/main@aa8e151e65939ecd789c82e45b22b6338a8d8ce8`, verified 2026-08-09                                    |
| Run ID   | `release-0.0.5--orchestration/slices/w3-a-1326`                                                                |

## Routes in force

| Task lane                | Provider / model / effort                                      | Role in this run                                                                   |
| ------------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `normal_implementation`  | Codex · OpenAI · GPT-5.6 Sol · medium                          | Plan and, only after PLAN-EVAL `PASS`, implement the producer contract and runtime |
| `formal_plan_evaluation` | Claude · Anthropic · Fable 5 · medium, separate native session | Mandatory PLAN-EVAL launched by the milestone orchestrator                         |
| `formal_impl_evaluation` | Claude · Anthropic · Fable 5 · medium, separate native session | Mandatory IMPL-EVAL launched by the milestone orchestrator                         |

## Recorded lane/eval overrides

The dispatch brief explicitly selects Fable 5 medium for both formal evaluator passes. That is
stricter than the ordinary effort-paired review row and is owner/orchestrator authority for this
release slice. The earlier preparation note's Qwen evaluator and alternate branch/worktree are
superseded; `drift.md` records the correction.
