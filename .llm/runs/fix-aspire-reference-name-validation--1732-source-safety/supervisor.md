# Supervisor Identity — fix-aspire-reference-name-validation--1732-source-safety

| Field    | Value                                                           |
| -------- | --------------------------------------------------------------- |
| Model    | Codex (current API session; exact runtime model id unavailable) |
| Session  | Current user-visible session; no separate session id exposed    |
| Host     | `ai-agents` / Linux 6.18.34+ x86_64                             |
| Checkout | `/home/agent/projects/netscript/worktrees/007-leaf-1732`        |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1732`        |
| Branch   | `fix/aspire-reference-name-validation`                          |
| Baseline | `13878a80a50c55b9662099fed64555f2310ae4a3` (`main`, 2026-08-30) |
| Run ID   | `fix-aspire-reference-name-validation--1732-source-safety`      |

## Routes in force

| Task lane                | Provider / model / effort                                    | Role in this run                                                                             |
| ------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `planning_decisions`     | Current Codex session (owner-dispatched fallback supervisor) | Research, compatibility recommendation, delivery coordination                                |
| `formal_plan_evaluation` | Separate owner-dispatched opposite-family session            | Mandatory PLAN-EVAL; pending while #1734 holds the single-gate evaluator queue               |
| `light_implementation`   | Codex / current session                                      | Blocked until separately certified PLAN-EVAL returns `PASS`                                  |
| `formal_impl_evaluation` | Repository draft-to-ready automation; separate session       | Mandatory IMPL-EVAL after the draft is explicitly marked ready; this run must leave it draft |

## Recorded lane/eval overrides

- The owner directly dispatched this Codex session into the prepared leaf worktree, so it is the run
  supervisor/generator rather than the canonical Claude orchestrator route.
- The owner, not this lane, dispatches PLAN-EVAL. This session must not launch, simulate, or
  self-certify it.
- The delivery contract requires leaving the PR draft; therefore IMPL-EVAL is not fired by this run.
