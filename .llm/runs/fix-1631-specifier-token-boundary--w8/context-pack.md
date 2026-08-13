# Context Pack: JSR specifier token boundary

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1631-specifier-token-boundary--w8` |
| Branch | `fix/1631-specifier-token-boundary` |
| Current phase | plan |
| Archetype | N/A |
| Scope overlays | none |

## Current State

Clean exact-base worktree re-baselined against issue #1631; plan is locked for one shared-parser implementation slice.

## Completed

- Authority loading, issue acceptance inspection, seam/predecessor inspection, and plan/design checkpoint.

## In Progress

- Draft-PR bootstrap.

## Next Steps

1. Open the draft PR, add RED tests, capture pre-fix evidence, implement, and run gates.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Shared parser vocabulary | issue #1631 / plan D1 | All three call sites reuse one definition. |

## Drift and Debt

- Drift: none.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
