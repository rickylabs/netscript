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
| 2026-08-12 | 2 | implementation | Replaced only the JSDoc import with `@app/lib/orders.ts`; retained `queryOptions({ input })`. |
| 2026-08-12 | 2 | gate | All five executable gates exited 0; final census has zero matches. |
| 2026-08-12 | 2 | reconcile | Issue #1425 remains the sole owned issue; no new comments, rescope, or related-issue action required. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Preserve `queryOptions({ input })` | This is the helper-specific call shape. | `docs/site/reference/sdk/index.md` |
| Replace catch-all module with per-service module | The shipped layout is `apps/<app>/lib/<service>.ts`. | issue #1425 |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Concrete import selected from #1373's established consumer examples after bootstrap | minor | no — resolved in plan before implementation |

## Census

- Found before implementation: **1** occurrence of `api-clients` in `packages/sdk/**`.
- Fixed: **1** JSDoc occurrence.
- Remaining: **0** (`rtk grep` produced no output and exit code 1).

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| Doc-lint | `deno task doc:lint --root packages/sdk --pretty` | PASS (exit 0) | 1 package / 12 entrypoints; 0 missing JSDoc and 0 other diagnostics. Runner reports 3 existing private-type-ref diagnostics while preserving exit 0. |
| Type-check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/sdk --ext ts,tsx` | PASS (exit 0) | 78 files; 1 batch; 0 failed batches; 0 diagnostics. |
| Lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/sdk --ext ts,tsx` | PASS (exit 0) | 78 files; 0 findings. |
| Format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/sdk --ext ts,tsx` | PASS (exit 0) | 78 files; 0 failed batches; 0 findings. |
| Stale-name census | `rtk grep -rn "api-clients" packages/sdk/` | PASS (zero matches; exit 1) | Initial 1; fixed 1; remaining 0. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| F-5 / F-6 / F-7 | PASS | doc-lint plus source diff and census | Public example uses the shipped alias and helper-specific call shape. |
| F-19 | PASS | scoped check/lint/fmt wrappers | 78 SDK TS/TSX files selected by each wrapper. |
| Code quality / architecture | PASS (exit 0) | `rtk proxy deno task quality:gate` | `quality:scan` found 0 violations; `arch:check` completed with repository warnings only. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Runtime behavior | N/A | package diff | Only a JSDoc comment body changed. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| JSR reader | PASS | full-export-map doc-lint and source diff | Import is `@app/lib/orders.ts`; call is `queryOptions({ input })`. |

## Handoff Notes

- Orchestrator/evaluator should first confirm the package diff changes only the JSDoc comment body.
- IMPL-EVAL and merge authority remain with the separate orchestrator-selected session.
