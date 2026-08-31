# Supervisor Identity — fix-sdk-cli-key-normalization-residuals--1833

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Codex (current owner-dispatched session; exact runtime model ID is not exposed to the checkout) |
| Session | Current Codex implementation thread; session ID unavailable |
| Host | Linux workspace (`/home/agent`) |
| Checkout | `/home/agent/projects/netscript/worktrees/007-leaf-1833` |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1833` |
| Branch | `fix/sdk-cli-key-normalization-residuals` |
| Baseline | `ee0e626bb945e2d9af58e49bd7bbdf714d0785c3` (`origin/main`, 2026-08-31) |
| Run ID | `fix-sdk-cli-key-normalization-residuals--1833` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `light_implementation` | Canonical route: Codex · OpenAI · GPT-5.6 Sol · low; observed exact identity unavailable | Mechanical implementation for #1833 |
| `formal_impl_evaluation` | Supervisor-dispatched fresh native opposite-family evaluator | Pending after implementation; this session must not dispatch or self-certify |

## Recorded lane/eval overrides

- Owner directive: do not self-dispatch an evaluator. The supervisor will dispatch IMPL-EVAL after
  this implementation handoff.

