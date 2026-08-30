# Supervisor Identity — feat-service-principal-procedure-policy--1387

Written at run start per `workflow/lane-policy.md` § Supervisor identity. This committed record
omits chat/session identifiers as required by the owner boundary for this leaf.

| Field    | Value                                                                                         |
| -------- | --------------------------------------------------------------------------------------------- |
| Model    | OpenAI Codex, GPT-5 family; the exact volatile runtime model ID is not exposed to this thread |
| Session  | Fresh research/planning thread; identifier intentionally not committed                        |
| Host     | Linux workspace, `agent` user                                                                 |
| Checkout | NetScript repository workspace                                                                |
| Worktree | `007-leaf-1387`                                                                               |
| Branch   | `feat/service-principal-procedure-policy`                                                     |
| Baseline | `625447f1b521e7fb0208fcfcc4ad3ea86cf52e21` (`origin/main`, 2026-08-30)                        |
| Run ID   | `feat-service-principal-procedure-policy--1387`                                               |

## Routes in force

| Task lane       | Provider / model / effort                                          | Role in this run                                          |
| --------------- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| `research-plan` | OpenAI Codex, current fresh thread                                 | Research author and locked-plan author                    |
| `plan-eval`     | Anthropic Claude / Fable 5 / medium, fresh opposite-family session | Required next gate; not dispatched in this planning slice |

The implementation route is intentionally unset. It may be selected from the then-current lane
policy only after the separate PLAN-EVAL returns `PASS` and dependency #1466 has landed.
