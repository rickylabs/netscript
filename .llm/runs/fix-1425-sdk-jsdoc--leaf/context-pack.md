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

The query JSDoc example is self-contained, uses `@app/lib/orders.ts`, and preserves the helper-specific
`queryOptions({ input })` shape. The approved sibling desktop example now uses `@my-app/contracts`.
All requested gates and widened audits pass.

## Completed

- S1–S2 plus independent adversarial review PASS.
- S3 evidence corrections, self-contained query example, desktop scope extension, and gates.

## In Progress

- S3 commit, explicit push, PR comment/body update, and corrected issue evidence.

## Next Steps

1. Commit and explicitly push S3.
2. Correct PR/issue acceptance evidence without claiming a nonexistent JSDoc compile gate.
3. Stop without changing PR ready state or merging.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| `PLAN-EVAL: N/A` | harness run loop | Fully specified mechanical issue. |
| `queryOptions({ input })` retained | SDK reference page | No invented call-shape change. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/fix-1425-sdk-jsdoc--leaf/*` | new | Run evidence only. |
| `packages/sdk/src/query-client/create-service-query-utils.ts` | changed | JSDoc-only self-containment, path, and canonical input edits. |
| `packages/sdk/src/desktop/mod.ts` | changed | Approved sibling JSDoc import correction. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | PASS | doc-lint + scoped check/lint/fmt; exit 0 |
| Fitness | PASS | `quality:gate` exit 0; repo-wide variant JSDoc census 1→0 |
| Runtime | N/A | no behavior change |
| Consumer | PASS by construction/inspection | self-contained query block; canonical app and contract aliases; no JSDoc compile gate exists |

## Open Questions

- None.

## Drift and Debt

- Drift: orchestrator-approved desktop JSDoc sibling fix, recorded in `drift.md`.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
