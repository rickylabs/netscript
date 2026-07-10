# Context Pack: non-agentic `.llm/tools/` cleanup sweep

## Run Metadata

| Field          | Value                                  |
| -------------- | -------------------------------------- |
| Run ID         | `chore-llm-tools-cleanup-sweep--codex` |
| Branch         | `chore/llm-tools-cleanup-sweep`        |
| Current phase  | `implement`                            |
| Archetype      | `6 — CLI / Tooling`                    |
| Scope overlays | docs maintenance                       |

## Current State

Baseline and whole-repo reference matrix are complete. Coordinator PLAN-EVAL passed under the
explicit owner waiver. Implementation is cleared.

## Completed

- Baseline verification, 59-file inventory, authoritative reference scan, baseline gates, research
  and plan.

## In Progress

- Slice 2: approved search deletion and retained-e2e reference correction.

## Next Steps

1. Implement slices in plan order.
2. Run each slice gate, push, and comment on PR #595.

## Drift and Debt

- Drift: stale `origin/main` tracking ref corrected without rebasing; baseline unchanged.
- Debt: none created.
