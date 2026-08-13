# Supervisor — NetScript 0.0.7 features lane

| Field | Value |
| --- | --- |
| Run id | `release-0.0.7-features--orchestration` |
| Profile | `.llm/harness/workflow/milestone-run.md` (topic lane) |
| Topic orchestrator | `topic-features-0.0.7` |
| Orchestrator route | Codex · OpenAI · GPT-5.6 Sol · high (approved `planning_decisions` fallback) |
| Orchestrator thread | `019ffcc0-e1d2-7850-a308-354b670c6f3d` |
| Checkout | `/home/codex/repos/netscript-007-features` |
| Control branch | `orchestrator/release-0.0.7-features` (no upstream) |
| Immutable dispatch base | `01e0960494c95ce56eb35892c211a095eb13e6ed` |
| Approved plan head | `331f7c664` |
| Coordinator control head at dispatch | `5330285f65242eff639cfc5c7ed68a80740de910` |
| Merge/release authority | coordinator only (`codex-root-0.0.7`) |

## Exclusive scope

This lane owns only #1293, #1348, #1349, #1352, #1354, #1355, #1360, #1451, #1452, #1455,
#1458, #1466, #1467, #1502, #1590, #1591, and #1592. The control branch records orchestration
evidence only; content lands through fresh leaf PRs targeting `main`.

## Wave 0

- `rfc-a-stage0-ratification-board` (#1348) is a coordinator checkpoint. It receives no leaf PR and
  remains open until the coordinator verifies all implementation children.
- `rfc-plugin-cli-contribution` (#1502) is the sole implementation leaf. It delivers an RFC and a
  proposed later implementation epic, not the CLI seam itself.

## Lane bindings and ceilings

| Purpose | Route / constraint |
| --- | --- |
| #1502 research, plan, and RFC authoring | Codex · OpenAI · GPT-5.6 Sol · high (`complex_implementation`) |
| #1502 PLAN-EVAL | fresh native opposite-family Claude · Fable 5 · medium; bounded and mandatory |
| Codex slice review | Claude · Fable 5 · medium (`review_codex_complex`), plus topic Tier-A substantive review |
| #1502 IMPL-EVAL | fresh native opposite-family Claude · Fable 5 · medium; mandatory |
| WIP | at most two implementers and one evaluator in this topic; Wave 0 uses one implementer |
| Expensive gate | global singleton; #1502 must not start `scaffold.runtime` and has no approved need for it |

Generator and evaluators must be different sessions. The topic orchestrator does not merge,
publish, change milestone scope, or mutate the central cluster state.
