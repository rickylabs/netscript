# Context pack: GLM 5.3 Flash / Qwen 3.8 Flash default open-model routing

Run ID: `chore-agentic-open-evaluator-routing`. Branch `chore/agentic-open-evaluator-routing`.
Issue #1791. Base `main` at `a3ddcbb598f81180437e06f743e24d6ef137b101` (immediately after #1774/#1775
merged). PLAN-EVAL: N/A per owner decision — infrastructure/config work, not a design decision.

## Why now

#1774's IMPL-EVAL required three transport attempts across two models before delivering a qualifying
verdict (native Fable 5 spend-limited; DeepSeek V4 Flash 0731 via Claude-print transport twice ended
with an empty completion; the hybrid/OpenCode transport eventually delivered PASS at effort `high`,
promoted by owner override since the binding required `max`). The owner has selected a new default
open-model pairing to replace this fragile chain, verified live against the OpenRouter catalog before
this leaf was authorized:

- `z-ai/glm-5.3-flash` — EXISTS in the live catalog. New default for `formal_impl_evaluation` and the
  hybrid delegation default, at effort `max`.
- `qwen/qwen3.8-flash` — EXISTS in the live catalog. New conditional PLAN-EVAL OpenRouter route, at
  effort `max`. No `-next`-suffixed variant exists; that wording resolves to this plain id.

**A specific known hazard for the new default model:** GLM-family models are reasoning models that
can return HTTP 200 with **empty content** if `max_tokens`/output budget is too low — the reasoning
tokens consume the entire budget before any visible output. Any canary or live probe for
`z-ai/glm-5.3-flash` MUST request a generous output budget (>=300 tokens) or it will look like a
silent success when it produced nothing.
