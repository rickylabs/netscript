# Context Pack: `plugin install --no-samples`

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1017-plugin-install-no-samples--codex` |
| Branch | `fix/1017-plugin-install-no-samples` |
| Current phase | `plan` |
| Archetype | `6 — CLI / Tooling` with Archetype 5 connectors |
| Scope overlays | `none` |

## Current State

Research and design are complete. The reported subprocess/adapter cause holds. Every official
plugin barrel references samples, so the plan includes generic no-samples structural fallback input.
No implementation has started; PLAN-EVAL is the hard next step.

## Completed

- Required skill/doctrine/harness reads.
- Cause re-baseline and caller/resource inspection.
- Plan and Design checkpoint.

## In Progress

- Plan-stage commit, draft PR, and separate-session PLAN-EVAL.

## Next Steps

1. Commit and push plan artifacts; open the draft PR with `Closes #1017` and milestone 0.0.3.
2. Run separate-session PLAN-EVAL.
3. Implement only after `PASS`.

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
| Plan | pending evaluator | plan/research/worklog |
| Static/Fitness/Runtime/Consumer | not run | implementation prohibited before PLAN-EVAL |

## Open Questions

- None.

## Drift and Debt

- Drift: all four barrels were confirmed sample-dependent; recorded as minor.
- Debt: no new debt expected.

## Commits

- See the draft PR commit list + per-slice comments.

