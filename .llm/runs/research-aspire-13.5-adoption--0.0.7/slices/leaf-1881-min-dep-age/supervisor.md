# Supervisor Identity — leaf-1881-min-dep-age

| Field | Value |
| --- | --- |
| Model | Codex (GPT-5 family; exact deployment id is not exposed) |
| Session | API session; stable session id not exposed |
| Host | Linux / `/home/agent` |
| Checkout | `/home/agent/projects/netscript/worktrees/007-aspire-leaf-1881-fix` |
| Worktree | `/home/agent/projects/netscript/worktrees/007-aspire-leaf-1881-fix` |
| Branch | `fix/aspire-1881-readme-min-dep-age` |
| Baseline | `3149d18e18fdd7cfbd0fac5a06f48f781d3a391a` (`main`) |
| Run ID | `research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-min-dep-age` |

## Routes in force

| Task lane | Provider / model / effort | Role |
| --- | --- | --- |
| `light_implementation` | OpenAI / Codex GPT-5 family / session default | Contract-first RED/GREEN docs slice |
| `formal_impl_evaluation` | Anthropic / Claude Fable 5.1 / medium; session `b67d4969-52f8-4250-a60d-12f95d855ad9` | Mandatory final evaluation; initial `FAIL_FIX` identified stale manifest evidence |

The owner supplied the exact red, command text, file set, ordering, assertions, gates, and PR
metadata. `PLAN-EVAL` is `N/A` under the small/mechanical exception; no lane override is in force.
