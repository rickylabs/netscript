# Context Pack: `plugin install --no-samples`

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1017-plugin-install-no-samples--codex` |
| Branch | `fix/1017-plugin-install-no-samples` |
| Current phase | `plan-eval` |
| Archetype | `6 — CLI / Tooling` with Archetype 5 connectors |
| Scope overlays | `none` |

## Current State

Research and design are complete. The reported subprocess/adapter cause holds. Every official
plugin barrel references samples, so the plan includes generic no-samples structural fallback input.
No implementation has started. The canonical local PLAN-EVAL launch is blocked because this host
has no `OPENROUTER_API_KEY`; cloud OpenHands is prohibited for a local-machine run.

## Completed

- Required skill/doctrine/harness reads.
- Cause re-baseline and caller/resource inspection.
- Plan and Design checkpoint.

## In Progress

- Plan-stage commit and draft PR are complete; PLAN-EVAL is blocked before session creation.

## Next Steps

1. Restore the local OpenRouter credential and rerun separate-session PLAN-EVAL, or obtain an
   explicit written owner waiver of the Plan-Gate.
2. Implement only after `PASS` or that explicit waiver.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Additive samples policy supports omit or fallback input | plan D2 | Default remains emit-all. |
| Empty barrels remain structural | plan D3 | Runtime glue remains unchanged and sample-independent. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1017-plugin-install-no-samples--codex/*` | new | Harness plan artifacts only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | blocked before evaluator launch | launcher exit 4; drift log |
| Static/Fitness/Runtime/Consumer | not run | implementation prohibited before PLAN-EVAL |

## Open Questions

- None.

## Drift and Debt

- Drift: all four barrels were confirmed sample-dependent; local evaluator launch is blocked.
- Debt: no new debt expected.

## Commits

- See the draft PR commit list + per-slice comments.
