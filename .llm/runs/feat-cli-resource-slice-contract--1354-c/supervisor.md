# Supervisor Identity — feat-cli-resource-slice-contract--1354-c

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Codex / GPT-5 family (exact runtime model id not exposed to this session) |
| Session | `/root` workspace session |
| Host | Linux container, user `agent` |
| Checkout | `/home/agent/projects/netscript/worktrees/007-leaf-1354-c` |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1354-c` |
| Branch | `feat/cli-resource-slice-contract` |
| Baseline | `850cc7757d11d420b9061dbe6a61536357ab77fe` (`origin/main`, 2026-09-02) |
| Run ID | `feat-cli-resource-slice-contract--1354-c` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `complex_implementation` | Codex / GPT-5 family / session effort | Slice C generator |
| `formal_impl_evaluation` | Separate evaluator session; identity recorded when launched | Mandatory IMPL-EVAL |

## Recorded lane/eval overrides

- The owner requires the PR to be opened non-draft with `status:impl` in the opening action. This
  overrides the generic draft-on-bootstrap convention without waiving the separate-session
  IMPL-EVAL.
- The exact runtime model id and effort are not exposed to this session, so this record does not
  invent them.
