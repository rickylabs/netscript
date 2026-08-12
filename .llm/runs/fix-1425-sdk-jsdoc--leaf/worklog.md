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

- Existing `createServiceQueryUtils` and `@netscript/sdk/desktop` JSR-rendered JSDoc examples; no
  export, signature, or runtime changes.

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
| 2 | Replace the sole stale JSDoc import and prove the 1→0 package census | all six requested gates | one SDK source comment plus run evidence |
| 3 | Correct acceptance evidence, make the query example self-contained, and repair the approved sibling desktop import | original gates plus repo-wide variant census and SDK JSDoc import audit | two SDK JSDoc comments plus run evidence |

### Deferred Scope

- #1374 and #1377 concerns — explicitly separate issues.
- `docs/site/**` — already corrected by #1373.
- Generated corpus refresh for `packages/mcp/src/publish-assets.generated.ts` — tracked by #1531.

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
| 2026-08-12 | 3 | review intake | Independent adversarial review returned PASS with no blocking findings and requested evidence corrections plus one approved sibling fix. |
| 2026-08-12 | 3 | implementation | Added the missing query hook import, aligned list input to `{ offset, limit }`, and replaced the desktop relative contract import. |
| 2026-08-12 | 3 | gate | Original gates and both widened audits pass; package source diff remains JSDoc-only. |
| 2026-08-12 | 3 | reconcile | Scope extension recorded; #1531 remains owner of generated MCP corpus refresh. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Preserve `queryOptions({ input })` | This is the helper-specific call shape. | `docs/site/reference/sdk/index.md` |
| Replace catch-all module with per-service module | The shipped layout is `apps/<app>/lib/<service>.ts`. | issue #1425 |
| Add the missing `useQuery` import | Acceptance says the example compiles; the existing block was not self-contained. | independent adversarial review |
| Repair the sibling desktop contract import | Orchestrator explicitly approved the same-surface scope extension. | user instruction; scaffold generator; `docs/site` |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Concrete import selected from #1373's established consumer examples after bootstrap | minor | no — resolved in plan before implementation |
| Desktop JSDoc relative contract import added to scope | significant | yes — orchestrator-approved extension |

## Census

- Found before implementation: **1** occurrence of `api-clients` in `packages/sdk/**`.
- Fixed: **1** JSDoc occurrence.
- Repo-wide final JSDoc sweep: **0** across `packages/` and `plugins/` using case-insensitive
  pattern `api[-_]?clients`, covering `api-clients`, `api_clients`, `apiClients`, and case variants.
- Broad non-JSDoc hit: `packages/mcp/src/publish-assets.generated.ts`, a generated string corpus
  tracked by #1531 and intentionally out of scope.

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| Doc-lint | `deno task doc:lint --root packages/sdk --pretty` | PASS (exit 0) | 1 package / 12 entrypoints; 0 missing JSDoc and 0 other diagnostics. Runner reports 3 private-type-ref diagnostics confirmed pre-existing on base `01aa12b67`. |
| Type-check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/sdk --ext ts,tsx` | PASS (exit 0) | 78 files; 1 batch; 0 failed batches; 0 diagnostics. |
| Lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/sdk --ext ts,tsx` | PASS (exit 0) | 78 files; 0 findings. |
| Format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/sdk --ext ts,tsx` | PASS (exit 0) | 78 files; 0 failed batches; 0 findings. |
| Stale-name census | `rtk grep -rn "api-clients" packages/sdk/` | PASS (zero matches; exit 1) | Initial 1; fixed 1; remaining 0. |
| Repo-wide variant JSDoc census | Deno classifier over `packages/` + `plugins/`, pattern `api[-_]?clients` case-insensitive | PASS (exit 0) | 0 JSDoc occurrences; sole broad hit is generated MCP corpus tracked by #1531. |
| SDK relative JSDoc import audit | `rtk grep -rnE "^\\s*\\*.*import .* from ['\"]\\.\\.?/" packages/sdk/` | PASS (zero matches; exit 1) | No SDK JSDoc example imports an app-level module relatively. |

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
| Scaffold runtime/static | SKIPPED by policy | independent review reports SUCCESS in 9 seconds | `ci:skip-e2e` / `ci:skip-scaffold` ratified for the comment-only diff; this is not runtime or scaffold coverage. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| JSR reader | PASS by construction and inspection | scaffold generator + `docs/site/reference/sdk/index.md:111` + source diff | Query example imports `useQuery`, uses shipped `@app/lib/orders.ts`, and retains `queryOptions({ input })`; no repo gate compiles JSDoc examples today. |
| Desktop JSR reader | PASS by construction and inspection | scaffold generator line 63 + docs examples + source diff | Contract import is the generated generic alias `@my-app/contracts`. This extension is not #1425 acceptance evidence. |

## Handoff Notes

- Orchestrator/evaluator should first confirm the package diff changes only the JSDoc comment body.
- No repository gate currently extracts and compiles JSDoc examples; do not attribute example
  compilation to doc-lint or the scoped source type-check.
- IMPL-EVAL and merge authority remain with the separate orchestrator-selected session.
