# Supervisor identity — 0.0.7 internals topic

| Field | Value |
| --- | --- |
| Role | `topic-internals-0.0.7` |
| Profile | milestone-cluster topic orchestrator |
| Topic branch | `orchestrator/release-0.0.7-internals` |
| Dispatch base | `01e0960494c95ce56eb35892c211a095eb13e6ed` |
| Live `origin/main` at reconciliation | `01e0960494c95ce56eb35892c211a095eb13e6ed` |
| Coordinator plan head | `331f7c664` (`PLAN-EVAL` approved) |
| Coordinator control head at dispatch | `5330285f65242eff639cfc5c7ed68a80740de910` |
| Authority | Internals lane only; no merge, release, publication, scope, or central-state authority |
| WIP | At most two implementers, one evaluator, and no overlap of the global expensive gate |

## Wave 0 route table

| Leaf | Requested implementation route | Opposite-family review/evaluation |
| --- | --- | --- |
| `quality-scan-allowance-rail` | `complex_implementation`: OpenAI Codex GPT-5.6 Sol, high | Claude Fable 5 medium for PLAN-EVAL/formal evaluation and effort-paired substantive review, serialized within the topic evaluator slot |
| `harness-evidence-and-verdict-tooling` | `normal_implementation`: OpenAI Codex GPT-5.6 Sol, medium | Claude Fable 5 low substantive review; formal IMPL-EVAL uses the canonical opposite-family evaluator route, serialized within the topic evaluator slot |

The coordinator remains the sole merge and release authority. Leaf PRs target `main` and remain
draft until coordinator review.
