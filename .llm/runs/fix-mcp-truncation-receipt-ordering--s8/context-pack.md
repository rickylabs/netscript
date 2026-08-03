# Context Pack: OMB S8 existing-machinery correctness fixes

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-mcp-truncation-receipt-ordering--s8` |
| Branch | `fix/mcp-truncation-receipt-ordering` |
| Current phase | `implement` |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Current State

Clean worktree baseline equals `origin/main` at `fb75cf6f`. Research and design are locked, and a
separate local open-model PLAN-EVAL returned `PASS`. No package source has changed yet.

## Completed

- Read issue #1134 and RFC #1123 §4 plus seed S-13/S-15 findings.
- Read required harness, PR, doctrine, JSR, tooling, and Archetype-2 authorities.
- Re-baselined actual MCP receipt/truncation code and adjacent debt.
- Ran baseline full-export doc lint: 0 diagnostics across `mod.ts` and `cli.ts`.
- Obtained tracked PLAN-EVAL `PASS` from Claude Code + OpenRouter Qwen.

## In Progress

- Slice 1: receipt settlement after validation and failed-attempt fixture.

## Next Steps

1. Implement and gate receipt settlement after validation.
2. Perform opposite-family slice review, commit, push, and comment.
3. Implement and gate truncation metadata + byte ceiling.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| No public export change | user contract / plan D1-D4 | Internal callback and fixed byte ceiling only |
| Full Archetype-2 column | RFC S-20 | quality gate + scoped wrappers + targeted runtime fixtures |
| Adjacent MCP v2 debt untouched | issue/user contract | `MCP-A6-V2-SHAPE` remains open |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-mcp-truncation-receipt-ordering--s8/*` | new | Harness bootstrap/plan artifacts only |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | baseline PASS | package doc lint 0 diagnostics |
| Fitness | plan-gate PASS | full Archetype-2 matrix selected and approved |
| Runtime | planned | two required fixtures |
| Consumer | N/A unless drift | exports locked unchanged |

## Open Questions

- None blocking PLAN-EVAL.

## Drift and Debt

- Drift: minor file-location clarification logged.
- Debt: adjacent `MCP-A6-V2-SHAPE` unchanged; no new debt expected.

## Commits

- See the draft PR's commit list + per-slice PR comments.
