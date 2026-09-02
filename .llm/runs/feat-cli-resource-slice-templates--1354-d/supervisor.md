# Supervisor Identity — feat-cli-resource-slice-templates--1354-d

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Codex / GPT-5 family (exact runtime model id not exposed to this session) |
| Session | `/root` workspace session |
| Host | Linux container, user `agent` |
| Checkout | `/home/agent/projects/netscript/worktrees/007-leaf-1354-d` |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1354-d` |
| Branch | `feat/cli-resource-slice-templates` |
| Baseline | `f2696ea88700b7f8e9db3a77a307719e802bc7f9` (`origin/feat/cli-resource-slice-contract`) |
| Run ID | `feat-cli-resource-slice-templates--1354-d` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `complex_implementation` | Codex / GPT-5 family / session effort | Slice D generator |
| `formal_impl_evaluation` | Native Claude Fable 5 / medium | Separate mandatory IMPL-EVAL session; identity recorded when launched |

## Recorded lane/eval overrides

- The owner requires the PR to be opened non-draft with `status:impl` in the opening action. This
  overrides the generic draft-on-bootstrap convention without waiving separate-session IMPL-EVAL.
- The exact runtime model id and effort are not exposed to this session, so this record does not
  invent them.
- `PLAN-EVAL: N/A`: the master #1354 plan already passed its separate Plan-Gate and this leaf is
  explicitly constrained to its locked Slice D.

