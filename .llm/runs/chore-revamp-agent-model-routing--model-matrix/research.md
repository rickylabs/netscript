# Research — chore-revamp-agent-model-routing--model-matrix

## Re-baseline

- Carried-in source: owner-authored `/home/agent/tmp/Harness Agents models matrix.md`.
- Re-derived against `main` @ `a2d7f5f6f686115b5c31bab085692df6e1582aa7` on 2026-09-04.
- Current status: source matrix read in full; repository bindings and provider/quota contracts are
  being re-derived before the plan is locked.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The owner matrix replaces all prior agent-delegation policy rather than amending it. | Read the matrix preamble and complete table. |
| 2 | It requires subscription-first routing in this order: Claude, Codex, Google, OpenCode Go, Ollama, then OpenRouter. | Read the matrix `Cli provider priority` section. |
| 3 | Generator and evaluator must never share a model family, including fallback composition. | Read the matrix final invariant. |
| 4 | Official OpenAI documentation identifies Astra as `gpt-6-astra`, with `low` through `max` reasoning, and describes account access as a rollout. | `https://developers.openai.com/api/docs/models/gpt-6-astra` |

## jsr-audit surface scan

- N/A: this run changes internal harness and agentic tooling, not a published package/plugin surface.

## Open questions

- Which exact OpenCode and Ollama model IDs and quota windows are exposed to the subscribed accounts?
- Which existing lane names remain compatibility aliases, and which should be replaced by explicit
  role/complexity identities?
- How should the expense watcher represent subscription windows while preserving existing API-credit
  accounting and failing closed when provider telemetry is unavailable?

