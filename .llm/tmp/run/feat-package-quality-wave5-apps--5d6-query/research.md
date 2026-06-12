# 5d6 PLAN-phase research — `./query` + `./server` + final package surface

Run: `openhands/pr-39/run-27445693854-1` · Branch: `feat/package-quality-wave5-apps-5d6-query`
Scope: RESEARCH ONLY · Design/plan artifacts follow after supervisor review.

## Reuse statement (prior trace)

- Source trace: `.llm/tmp/run/openhands/pr-39/run-27442118991-1/`
- Prior run hit 500-iteration limit and produced **no research/design/plan artifacts** (only `drift.md`, `commits.md`, `worklog.md` skeletons).
- Its summary claims are therefore not treated as committed deliverables, but its distilled findings are reused as the starting baseline:
  - `./query/mod.ts`: 88 doc-lint errors (64 `privateTypeRef`, 23 `missingJSDoc`, 1 other).
  - `./server.ts`: 13 doc-lint errors (8 `privateTypeRef`, 5 `missingJSDoc`).
  - `./streams/mod.ts`: 32 doc-lint errors (24 `privateTypeRef`, 8 `missingJSDoc`).
  - `deno publish --dry-run`: `excluded-module` errors because `packages/fresh/` is excluded from the root workspace.

TODO: re-measure all numbers on this run and replace the reused baseline with current data.

## MEASURE-FIRST

### 1. Combined `deno doc --lint` — `./query`, `./server`, `.`

TODO: command + output summary

### 2. Whole-package baseline across all entrypoints

Umbrella plan F-16 surface lists 13 entrypoints:
`.` · `./server` · `./builders` · `./route` · `./defer` · `./form` · `./error` · `./utils` · `./streams` · `./query` · `./interactive` · `./vite` · `./testing`.

TODO: table of entrypoint · file · doc-lint errors · privateTypeRefs · missingJSDoc · notes

### 3. `deno check --unstable-kv`

TODO: command + output summary

### 4. Private-type refs package-wide

TODO: list of private-type-ref clusters per entrypoint

### 5. `deno publish --dry-run` for `packages/fresh`

TODO: command + output summary (root dry-run vs package dry-run)

## Inventory

### `query/`

TODO: list hooks, hydration, query-client, query-island; sizes; public exports; upstream dependencies

### `server/define-fresh-app.ts` + `server.ts` export surface

TODO: list defineFreshApp inputs/outputs, extension points, current exports

## RFC 17 island query bridge research

### 5b SDK backing surface

TODO: `createQueryFactories`, `createServiceClient` Transport seam, `@netscript/sdk/query-client`

### Dehydrate / hydrate chain as it exists today

TODO: trace from server loader → island props → client hook

### Gaps vs target

TODO: what is missing for typed island query bridge

### Market bar: TanStack Start server-function + Query integration

TODO: summary with sources

## RFC 14 seam audit inputs

### Extension points `defineFreshApp` must protect

TODO: adapter seam list and alpha-surface protection rationale

## Drift ledger

See `drift.md` for append-only `D-5d6-n` entries.

## Questions / blockers for supervisor

TODO
