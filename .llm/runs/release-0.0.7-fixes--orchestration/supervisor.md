# Supervisor identity — release 0.0.7 fixes topic

| Field | Value |
| --- | --- |
| Profile | `milestone-cluster/topic-orchestrator` |
| Run id | `release-0.0.7-fixes--orchestration` |
| Agent id | `topic-fixes-0.0.7` |
| Coordinator | `codex-root-0.0.7` (sole merge/release authority) |
| Control branch | `orchestrator/release-0.0.7-fixes` |
| Control worktree | `/home/codex/repos/netscript-007-fixes` |
| Immutable dispatch base | `01e0960494c95ce56eb35892c211a095eb13e6ed` |
| Approved plan head | `331f7c664` |
| Coordinator control head at dispatch | `5330285f65242eff639cfc5c7ed68a80740de910` |
| Topic thread | `019ffcc0-e1ae-7b70-b3b8-8804ebd6f773` |
| Topic route | requested/observed `openai` · `gpt-5.6-sol` · `high` |
| WIP limit | two implementation leaves; one evaluator |

This topic run owns only the 26 fixes-lane issues frozen by the approved coordinator artifacts. It
does not mutate the central cluster state, merge, publish, or alter milestone scope.

## Wave 0 lane assignments

| Leaf | Branch | Implementation route | Formal evaluator |
| --- | --- | --- | --- |
| `legacy-port-pin-sweep` | `fix/legacy-port-pin-sweep` | `light_implementation`: Codex/OpenAI `gpt-5.6-sol` low | fresh native opposite-family session |
| `scaffold-generated-output-correctness` | `fix/scaffold-generated-output-correctness` | `complex_implementation`: Codex/OpenAI `gpt-5.6-sol` high | fresh native opposite-family session |

Neither implementation lane may self-certify. The topic orchestrator performs the Tier-A
substantive slice review after automated gates, and a separate opposite-family IMPL-EVAL remains
mandatory before coordinator handoff.
