# Supervisor Identity — fix-790-md-hydration-ci--codex

| Field | Value |
| --- | --- |
| Model | Codex (current session; exact runtime model id is not exposed to the checkout) |
| Session | current owner-launched Codex session |
| Host | native WSL2 Linux · user `codex` |
| Checkout | `/home/codex/repos/b10-790ci` |
| Worktree | `/home/codex/repos/b10-790ci` |
| Branch | `fix/790-md-hydration-ci` |
| Baseline | `3265b516` from `origin/feat/beta10-integration` on 2026-07-17 |
| Run ID | `fix-790-md-hydration-ci--codex` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| Small fix / fast iteration | Current Codex session under the canonical `fast_iteration` route | Diagnose and implement the CI-only Fresh build fix |
| PLAN-EVAL / IMPL-EVAL | Supervisor-selected opposite-family sessions | Explicitly not dispatched by this implementation lane |

## Recorded lane/eval overrides

- Owner directive: this lane writes the normal plan and implementation evidence but does not
  dispatch either evaluator pass. It does not create evaluator verdicts or self-certify.
- The owner supplied the exact branch, baseline, worktree, PR base, and terminal acceptance gate.

