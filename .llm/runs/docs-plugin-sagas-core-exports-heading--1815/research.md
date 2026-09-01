# Research — docs-plugin-sagas-core-exports-heading--1815

## Re-baseline

- Re-derived against `origin/main` at `5197e70b7` on 2026-08-31.
- The nineteen export-table rows match `packages/plugin-sagas-core/deno.json` exactly; only the
  `## Entrypoints` heading prevents parser recognition.

## Findings

- `deno doc --json` completed for all nineteen entrypoint modules with 724 symbol occurrences.
- The root entrypoint's 41 symbols and the agent entrypoint's 2 symbols are documented.
- Sixteen subpaths have genuine omissions after checking for each symbol anywhere on the page.
  Representative gaps include transport codecs, store adapters, telemetry contracts, and config
  schemas, so `symbolCoverage.mode: 'entrypoints-only'` is required.
- The command emitted cached `@types/node` resolution warnings but exited 0 and returned all
  nineteen requested nodes.

## Open questions

- None. `PLAN-EVAL: N/A` because the issue fixes one heading and adopts one evidence-selected
  mapping policy without changing package code or documentation tables.
