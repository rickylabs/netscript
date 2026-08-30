# Context pack: GLM 5.3 Flash / Qwen 3.8 Flash default open-model routing

Run ID: `chore-agentic-open-evaluator-routing`. Branch `chore/agentic-open-evaluator-routing`. Issue
#1791. Base `main` at `a3ddcbb598f81180437e06f743e24d6ef137b101` (immediately after #1774/#1775
merged). PLAN-EVAL: N/A per owner decision — infrastructure/config work, not a design decision.

## Why now

#1774's IMPL-EVAL required three transport attempts across two models before delivering a qualifying
verdict (native Fable 5 spend-limited; DeepSeek V4 Flash 0731 via Claude-print transport twice ended
with an empty completion; the hybrid/OpenCode transport eventually delivered PASS at effort `high`,
promoted by owner override since the binding required `max`). The owner has selected a new default
open-model pairing to replace this fragile chain, verified live against the OpenRouter catalog
before this leaf was authorized:

- `z-ai/glm-5.3-flash` — EXISTS in the live catalog. New default for `formal_impl_evaluation` and
  the hybrid delegation default, at effort `max`.
- `qwen/qwen3.8-flash` — EXISTS in the live catalog. New conditional PLAN-EVAL OpenRouter route, at
  effort `max`. No `-next`-suffixed variant exists; that wording resolves to this plain id.

**A specific known hazard for the new default model:** GLM-family models are reasoning models that
can return HTTP 200 with **empty content** if `max_tokens`/output budget is too low — the reasoning
tokens consume the entire budget before any visible output. Any canary or live probe for
`z-ai/glm-5.3-flash` MUST request a generous output budget (>=300 tokens) or it will look like a
silent success when it produced nothing.

## Current state

- Phase: implementation, generator gates, live canaries, and exact-head IMPL-EVAL complete.
- Generator: Codex/OpenAI `gpt-5.6-sol` high, thread `01a05481-a2ff-7632-809a-e478889e626e`, route
  matched.
- Worktree: `/home/agent/projects/netscript/worktrees/007-leaf-routing`.
- Live catalog re-check at `2026-08-30T21:11:02Z`: both selected IDs present; only the plain Qwen
  Flash ID exists; GLM reports mandatory reasoning with `max` supported/default.
- PLAN-EVAL: N/A by owner decision, recorded in `worklog.md` before implementation.
- Implemented: typed routing/canary contract; OpenHands routing; docs/skills parity; full 165-file
  check/lint/fmt and 491-test gate all green.
- Live canaries: both GLM and Qwen presets passed at matched `max` argv identity with a 1024-token
  budget, non-empty marker, and tools/reasoning/streaming evidence.
- IMPL-EVAL: `PASS` from fresh session `ab4ca47b-00db-49e3-a969-6f779c024a6e` on exact published
  head `d9722b0b17a478af3db5bdafad87391a2ccbfd67`. Requested OpenRouter / GLM / max; observed `Z.AI`
  / `z-ai/glm-5.3-flash` with real reasoning/tool activity and non-empty completion; `max` is
  launcher-argv attested. This deliberately dogfoods the changed route and is not independent.
- Exact-green packet: evaluator artifacts are published in the run-artifact-only branch head
  carrying this record; PR comment `5471524652` contains the redacted structured canary results and
  S1-S4 gate summary. PR/issue are at `status:augment-review` and the PR remains draft/unmerged.
- Remaining: supervisor handoff only; do not merge from this run.
- Publication: the HTTPS PAT lacked workflow scope, so the GitHub connector published tree-identical
  commits without force. Current published evidence head before this record: `9937705b5d`.

## Key locked decisions

- Active and persisted preset-ID vocabularies split: retired presets parse but cannot launch.
- Formal OpenRouter routing has exactly one current row per phase: Qwen Flash/max for PLAN, GLM
  Flash/max for IMPL; no complexity split.
- Live Claude canaries use an explicit `--effort`, a 1024-token output budget, requested-versus-
  observed argv/profile identity, and a required non-empty marker.
- OpenHands defaults to GLM for IMPL/generic and Qwen for PLAN, but explicitly records effort
  attestation as unavailable.
- A new exact policy/doc parity assertion is required because research found none.

## Next steps

1. Leave PR #1792 unmerged and hand the supervisor the exact-green packet, distinguishing the
   evaluated product head from the later artifact-only head.
