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
| Topic thread | `019ffcc0-e1ae-7b70-b3b8-8804ebd6f773` (preserved, parked, never resumed as controller) |
| Topic route | requested/observed `openai` · `gpt-5.6-sol` · `high` (parked Codex fallback controller, historical) |
| WIP limit | two implementation leaves; one evaluator |

This topic run owns only the 26 fixes-lane issues frozen by the approved coordinator artifacts. It
does not mutate the central cluster state, merge, publish, or alter milestone scope.

## 2026-08-15 reset — Claude topic-orchestrator replacement

| Field | Value |
| --- | --- |
| Agent id | `topic-fixes-0.0.7` (native Claude replacement) |
| Requested/observed route | native Claude · Sonnet 5 · low |
| Predecessor | parked Codex topic thread `019ffcc0-e1ae-7b70-b3b8-8804ebd6f773` (`TOPIC_CONTROLLER_PARKED`, idle, clean; not resumed) |
| Coordinator dispatch authority | `.llm/runs/release-0.0.7--orchestration/briefs/reset-gates/dispatch.json` |
| Granted dispatch orders | order 2 — leaf #1643 `legacy-port-pin-sweep` fresh IMPL-EVAL at `e6ba15ec6`; order 5 — leaf #1654 `scaffold-generated-output-correctness` fresh PLAN-EVAL cycle 1 at `14d8b38b4` |
| First-turn reconciliation | complete; no drift from coordinator dispatch set; no leaf/evaluator launched pending explicit serial grant |

Same control laws apply: supervise only, never implement in this worktree, preserve historical
Codex evidence, one topic branch/worktree/active controller, implementation stays on
daemon-attached WSL Codex leaves, evaluators are fresh opposite-family sessions per the dispatch
route, and this lane never merges/publishes/relabels/closes issues or touches coordinator state.

## Wave 0 lane assignments

| Leaf | Branch | Implementation route | Formal evaluator |
| --- | --- | --- | --- |
| `legacy-port-pin-sweep` | `fix/legacy-port-pin-sweep` | `light_implementation`: Codex/OpenAI `gpt-5.6-sol` low | fresh native opposite-family session |
| `scaffold-generated-output-correctness` | `fix/scaffold-generated-output-correctness` | `complex_implementation`: Codex/OpenAI `gpt-5.6-sol` high | fresh native opposite-family session |

Neither implementation lane may self-certify. The topic orchestrator performs the Tier-A
substantive slice review after automated gates, and a separate opposite-family IMPL-EVAL remains
mandatory before coordinator handoff.
