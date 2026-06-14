# 5d6 PLAN-phase research — `./query` + `./server` + final package surface

Run: `openhands/pr-39/run-27446388320-1` · Branch: `feat/package-quality-wave5-apps-5d6-query`
Scope: RESEARCH ONLY · Design/plan artifacts follow after supervisor review.

## Reuse statement (prior trace)

- Source trace: `.llm/tmp/run/openhands/pr-39/run-27442118991-1/`
- Prior run hit 500-iteration limit and produced **no committed research/design/plan artifacts** (only skeleton `drift.md`/`commits.md`/`worklog.md`).
- Reused findings:
  - `./query/mod.ts`: historically 88 doc-lint errors (64 `privateTypeRef`, 23 `missingJSDoc`, 1 other).
  - `./server.ts`: 13 doc-lint errors (8 `privateTypeRef`, 5 `missingJSDoc`).
  - `./streams/mod.ts`: 32 doc-lint errors (24 `privateTypeRef`, 8 `missingJSDoc`).
  - `deno publish --dry-run` historically reported `excluded-module` + slow-type errors.
- **Re-measured current data below supersedes reused baseline where it differs.**

## MEASURE-FIRST

### 1. Combined `deno doc --lint` — `./query`, `./server`, `.`

TODO: command + current output summary

### 2. Whole-package baseline across all 12/13 entrypoints

Umbrella plan F-16 surface lists 13 entrypoints:
`.` · `./server` · `./builders` · `./route` · `./defer` · `./form` · `./error` · `./utils` · `./streams` · `./query` · `./interactive` · `./vite` · `./testing` (new, 5d1).

TODO: table of entrypoint · file · doc-lint errors · privateTypeRefs · missingJSDoc · notes

### 3. `deno check --unstable-kv`

TODO: command + current output summary

### 4. Private-type refs package-wide

TODO: current list of private-type-ref clusters per entrypoint

### 5. `deno publish --dry-run` for `packages/fresh`

TODO: current command + output summary

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
