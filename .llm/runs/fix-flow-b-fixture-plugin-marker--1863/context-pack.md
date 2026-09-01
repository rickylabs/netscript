# Context Pack: Flow-B fixture workers anchor

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-flow-b-fixture-plugin-marker--1863` |
| Branch | `fix/flow-b-fixture-plugin-marker` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` (nested E2E workspace) |
| Scope overlays | `none` |

## Current State

The branch is clean at the `origin/main` baseline. Research and design are locked for a two-anchor
semantic locator; PLAN-EVAL is N/A. No implementation exists yet.

## Completed

- Re-baselined the brief against current main.
- Proposed and locked the minimal product ceiling.
- Deferred generator-family marker consistency without crossing scope.

## In Progress

- RED test slice.

## Next Steps

1. Commit focused RED tests alone and record the failing counts.
2. Implement and integrate the semantic range locator.
3. Run scoped static gates, preserve `deno.lock`, push, and stop for separate evaluation.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Locate workers by unique create + register code anchors. | plan D1–D3 | Independent of comments and plugin order; malformed/ambiguous output throws. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-flow-b-fixture-plugin-marker--1863/` | new | Harness state and evidence. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | NOT_RUN | Implementation not started. |
| Fitness | NOT_RUN | Implementation not started. |
| Runtime | N/A locally | Owner forbids runtime commands without a lease. |
| Consumer | N/A | No published surface change. |

## Open Questions

- None.

## Drift and Debt

- Drift: source marker-family guard deferred at the locked product ceiling.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
