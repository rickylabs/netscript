# Supervisor Identity — chore-agentic-open-evaluator-routing

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Codex · OpenAI · `gpt-5.6-sol` · high |
| Session | `01a05481-a2ff-7632-809a-e478889e626e` |
| Host | Linux/WSL · `/home/agent` |
| Checkout | `/home/agent/projects/netscript/worktrees/007-leaf-routing` |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-routing` |
| Branch | `chore/agentic-open-evaluator-routing` |
| Baseline | `a3ddcbb598f81180437e06f743e24d6ef137b101` (`main`, 2026-08-30) |
| Run ID | `chore-agentic-open-evaluator-routing` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `complex_implementation` | OpenAI / `gpt-5.6-sol` / high | Generator thread for the cross-cutting routing/config/workflow slice |
| `review_codex_complex` | Anthropic / Fable 5 / medium | Required opposite-family slice review when available; supervisor performs the substantive sign-off review |
| `formal_impl_evaluation` | OpenRouter / `z-ai/glm-5.3-flash` / max | Mandatory fresh separate-session IMPL-EVAL after gates and both canaries; dogfoods this leaf's new route |

Reference `.llm/harness/workflow/lane-policy.md`; the implementation changes that policy under the
owner directive in issue #1791.

## Recorded lane/eval overrides

- PLAN-EVAL is N/A by explicit owner decision: this is prospective infrastructure/config work with
  a complete issue contract, locked IDs, scope, hazards, and gates.
- Native Fable 5 evaluation is quota/spend-limited for this milestone. The owner authorized the new
  GLM 5.3 Flash/max OpenRouter route for this leaf's separate-session IMPL-EVAL after its live
  canary passes. This is deliberate self-dogfooding of the product being changed, not an
  independently established default.
