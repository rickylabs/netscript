# Context Pack: #1425 SDK JSDoc API-client path

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-1425-sdk-jsdoc--leaf` |
| Branch | `fix/1425-sdk-jsdoc-api-clients` |
| Current phase | `plan` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `docs` |

## Current State

The live issue and consistency target have been read. One stale occurrence exists; the design is locked
to a comment-only replacement that preserves `queryOptions({ input })`.

## Completed

- Harness bootstrap, research, plan, Design checkpoint, initial 1-occurrence census.

## In Progress

- Opening the draft PR from the bootstrap commit.

## Next Steps

1. Apply the JSDoc-only edit.
2. Run the six requested gates and record exact evidence.
3. Commit, explicitly push, comment, and update issue acceptance evidence.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| `PLAN-EVAL: N/A` | harness run loop | Fully specified mechanical issue. |
| `queryOptions({ input })` retained | SDK reference page | No invented call-shape change. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/fix-1425-sdk-jsdoc--leaf/*` | new | Run evidence only. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | pending | not yet run |
| Fitness | pending | not yet run |
| Runtime | N/A | no behavior change |
| Consumer | pending | JSDoc example review and census |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
