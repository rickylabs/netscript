# Context Pack: durable OpenRouter agentic lanes

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-agentic-openrouter-lanes--codex` |
| Branch | `fix/agentic-openrouter-lanes` |
| Current phase | `plan-eval` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | none |

## Current State

Research, locked plan, and Design checkpoint are complete. No implementation has begun. A separate opposite-family PLAN-EVAL must pass next.

## Completed

- Re-baseline and focused code research.
- Archetype/gate selection.
- Three ordered commit slices and risk controls.

## In Progress

- Plan-Gate.

## Next Steps

1. Commit/push bootstrap artifacts and open the draft PR.
2. Run separate Claude-family PLAN-EVAL.
3. Begin slice 1 only after PASS.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Responses-only named profile files | plan D1 | No legacy profile table/chat wire. |
| At least one non-empty real GLM turn | plan D5 | Hard acceptance gate. |
| Exhaustive static + opt-in live canaries | plan D4 | CI-safe and spend-safe. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-agentic-openrouter-lanes--codex/` | changed/new | Harness bootstrap and carried-in brief/thread identity. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | pending evaluator | research/plan/worklog Design |
| Static | not run | implementation not started |
| Runtime | not run | live GLM gate pending |
| Consumer | not run | implementation pending |

## Open Questions

- Which of Codex or Claude can currently complete GLM 5.2 through OpenRouter?

## Drift and Debt

- Drift: launcher implementation already moved to a JSONL app-server client versus the carried-in direct-command description; recorded in `drift.md`.
- Debt: none.

## Commits

- See the draft PR commit list + per-slice PR comments.
