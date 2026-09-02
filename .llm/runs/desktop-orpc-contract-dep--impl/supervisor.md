# Supervisor Identity — desktop-orpc-contract-dep--impl

| Field | Value |
| --- | --- |
| Model | GPT-5.6 Sol (`gpt-5.6-sol`) |
| Session | `01a0620a-eb3b-7e62-a4b4-695fe496e670` |
| Host | Linux / Codex agent |
| Checkout | `/home/agent/projects/netscript/worktrees/007-leaf-1926` |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1926` |
| Branch | `fix/desktop-fixture-orpc-contract-dep` |
| Baseline | `37452f11f5045f0f5a98e07d802bcc2a2e94333b` (`origin/main`, 2026-09-02) |
| Run ID | `desktop-orpc-contract-dep--impl` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `normal_implementation` | OpenAI / GPT-5.6 Sol / medium | Fixture repair and ordinary-PR guard |
| `formal_impl_evaluation` | OpenHands / approved open model / effort not attestable | Separate-session evaluation triggered by draft-to-ready |

## Recorded lane/eval overrides

The owner explicitly requires the labelled, main-facing PR run to exercise `desktop-native-linux`.
The ready-for-review transition therefore uses the repository's cloud evaluator automation alongside
the `ci:full` runtime gate; OpenHands cannot attest reasoning effort.
