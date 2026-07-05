# Supervisor Identity — beta5-impl--supervisor

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | GPT-5 Codex implementation session |
| Session | WSL Codex implementation slice launched from issue #305 prompt |
| Host | WSL / Linux / `/home/codex` |
| Checkout | `/home/codex/repos/netscript-305-quickwin` |
| Worktree | `/home/codex/repos/netscript-305-quickwin` |
| Branch | `chore/305-doctrine-quickwin` |
| Baseline | `origin/main` `1c1759908e99c68a3bb0cccfd7a35aeafd8d40e0` on 2026-07-06 |
| Run ID | `beta5-impl--supervisor` |

## Lane table in force

| Tier | Binding | Role in this run |
| --- | --- | --- |
| A | Owner/supervisor harness | Scope directive, final slice review, PR lifecycle |
| D | WSL Codex | Quick-win implementation slice on `chore/305-doctrine-quickwin` |
| E | Separate evaluator session | PLAN-EVAL before implementation and IMPL-EVAL after implementation |

## Recorded lane/eval overrides

- The user explicitly launched this as a WSL Codex implementation slice for issue #305's early
  quick-win only. The full doctrine v2 rewrite remains out of scope.
