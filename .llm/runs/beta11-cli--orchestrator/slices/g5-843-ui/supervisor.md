# Supervisor Identity — g5-843-ui

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field    | Value                                                                               |
| -------- | ----------------------------------------------------------------------------------- |
| Model    | Claude Fable 5                                                                      |
| Session  | `86d308d5-c761-4e5d-a41f-8be959bc46d2`                                              |
| Host     | Linux / Codex workspace                                                             |
| Checkout | `/home/codex/repos/wt-g5-843`                                                       |
| Worktree | `/home/codex/repos/wt-g5-843`                                                       |
| Branch   | `feat/desktop-frontend-843-ui`                                                      |
| Baseline | `1709dcbabb689edd8e5c659ca91774600272597c` from `feat/desktop-frontend`, 2026-07-18 |
| Run ID   | `beta11-cli--orchestrator/slices/g5-843-ui`                                         |

## Routes in force

| Task lane               | Provider / model / effort    | Role in this run                                                        |
| ----------------------- | ---------------------------- | ----------------------------------------------------------------------- |
| `planning_decisions`    | Claude Fable 5 / low         | Orchestrator and Plan-Gate owner                                        |
| `normal_implementation` | Codex · GPT-5.6 Sol / medium | G5 research, plan, and—only after PASS—implementation                   |
| `formal_evaluation`     | OpenRouter Qwen 3.7 Max      | Opposite-family evaluator, supervisor-dispatched only                   |
| `review_codex`          | Claude Fable 5 / low         | Tier-A review between implementation slices, supervisor-dispatched only |
