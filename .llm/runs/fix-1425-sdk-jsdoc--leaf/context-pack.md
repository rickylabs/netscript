# Context Pack: #1425 SDK JSDoc API-client path

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-1425-sdk-jsdoc--leaf` |
| Branch | `fix/1425-sdk-jsdoc-api-clients` |
| Current phase | `gate` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `docs` |

## Current State

The sole stale JSDoc import is replaced with `@app/lib/orders.ts`; the helper-specific
`queryOptions({ input })` shape is preserved. All requested gates pass and the final census is zero.

## Completed

- Harness bootstrap, research, plan, Design checkpoint, 1→0 census, implementation, and all requested gates.

## In Progress

- Final implementation commit, push, PR evidence comment, and issue acceptance update.

## Next Steps

1. Commit and explicitly push S2.
2. Update draft PR body/comment and issue acceptance evidence.
3. Stop for independent orchestrator evaluation; do not mark ready or merge.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| `PLAN-EVAL: N/A` | harness run loop | Fully specified mechanical issue. |
| `queryOptions({ input })` retained | SDK reference page | No invented call-shape change. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/fix-1425-sdk-jsdoc--leaf/*` | new | Run evidence only. |
| `packages/sdk/src/query-client/create-service-query-utils.ts` | changed | One JSDoc import line only. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | PASS | doc-lint + scoped check/lint/fmt; exit 0 |
| Fitness | PASS | `quality:gate` exit 0; census 1→0 |
| Runtime | N/A | no behavior change |
| Consumer | PASS | `@app/lib/orders.ts` plus `queryOptions({ input })` |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
