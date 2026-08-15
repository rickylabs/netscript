# Supervisor Identity — fix-sdk-typed-error-channel--0.0.7-wave1

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field    | Value                                                        |
| -------- | ------------------------------------------------------------ |
| Model    | Codex · OpenAI · GPT-5.6 Sol · medium                        |
| Session  | `01a006f3-ae2d-7941-bd17-2ac71dd3d0f0`                       |
| Host     | `YogaBook9i` · WSL2 Linux · `codex`                          |
| Checkout | `/home/codex/repos/netscript-007-leaf-typed-error`           |
| Worktree | `/home/codex/repos/netscript-007-leaf-typed-error`           |
| Branch   | `fix/sdk-typed-error-channel`                                |
| Baseline | `main@0ef48c2ec661a7e6d55ec2faf5def6ae7dd2e6eb` · 2026-08-15 |
| Run ID   | `fix-sdk-typed-error-channel--0.0.7-wave1`                   |

## Routes in force

| Task lane               | Provider / model / effort                                       | Role in this run                                                                           |
| ----------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `normal_implementation` | OpenAI / GPT-5.6 Sol / medium                                   | Research and plan generator; implementation is prohibited until external PLAN-EVAL passes. |
| `review_codex`          | Native opposite-family route selected by the topic orchestrator | PLAN-EVAL; not launched by this session.                                                   |

## Owner constraints

- Plan-first. This session must not implement or launch an evaluator.
- The declared product/doc change surface is exactly five files. Any required sixth file is a
  rescope and stops implementation pending a topic-orchestrator ruling.
- No Aspire, Docker, `e2e:cli`, runtime lease, lock deletion, cache deletion, or reload.
