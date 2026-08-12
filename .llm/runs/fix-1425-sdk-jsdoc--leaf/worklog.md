# Worklog: #1425 SDK JSDoc API-client path

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-1425-sdk-jsdoc--leaf` |
| Branch | `fix/1425-sdk-jsdoc-api-clients` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `docs` |

## Design

### Public Surface

- Existing `createServiceQueryUtils` JSR-rendered JSDoc example; no export or signature changes.

### Domain Vocabulary

- `ordersClient` — service-specific client exported from the app's `orders.ts` data-layer module.
- `ordersQueryUtils` — TanStack query utilities derived from that client.

### Ports

- None introduced or changed.

### Constants

- None introduced or changed.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Harness bootstrap and locked design | artifact review | run-dir Markdown files |
| 2 | Replace the sole stale JSDoc import and prove the 1→0 census | all six requested gates | one SDK source comment plus run evidence |

### Deferred Scope

- #1374 and #1377 concerns — explicitly separate issues.
- `docs/site/**` — already corrected by #1373.

### Contributor Path

Future example corrections start at the public JSDoc, verify the matching `docs/site/reference/sdk/index.md`
call shape, then use full-export-map doc-lint and a package-wide census.

### PLAN-EVAL

N/A — fully specified mechanical documentation correction; no material design decision remains.

## Progress Log

| Date | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-08-12 | 1 | research and design | Live issue read; initial census is 1. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Preserve `queryOptions({ input })` | This is the helper-specific call shape. | `docs/site/reference/sdk/index.md` |
| Replace catch-all module with per-service module | The shipped layout is `apps/<app>/lib/<service>.ts`. | issue #1425 |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| None | N/A | yes |

## Census

- Found before implementation: **1** occurrence of `api-clients` in `packages/sdk/**`.
- Fixed: pending implementation.
- Remaining: pending implementation.

## Gate Results

Pending implementation.

## Handoff Notes

- Orchestrator/evaluator should first confirm the package diff changes only the JSDoc comment body.
