# Research — docs-adopt-plugin-pages-a--1857

## Re-baseline

- Carried-in source: issue #1857 step 3, slice A assignment brief.
- Re-derived against `origin/main` at `3b6386e14`, then rechecked after main advanced to
  `b66e52cbc` on 2026-09-01.
- The incoming #1860 change touched the triggers/workers pages and generated assets but added no
  `AUTHORITATIVE_MAPPING` rows; all 29 upstream mapping names remain present in this branch.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `plugins/sagas`, `plugins/streams`, and `plugins/ai` publish 14, 7, and 7 entrypoints respectively. | Read each plugin's `deno.json` export map directly. |
| 2 | The sagas and plugin-ai export rows are hidden from `parseDocContent()` by the unrecognized `## Entrypoints` heading. | Compare both pages with the recognized-heading checks in `.llm/tools/docs/check-exports-drift.ts`. |
| 3 | Streams has a recognized `## Sub-path exports` heading but no export/path table under it; only symbol subsections follow, so no row matches the package/path regex. | Inspect the streams page around the heading and the parser's row expression. |
| 4 | Sagas' existing table has 12 rows, including nonexistent `/scaffolding`; the real map additionally requires `/adapter-cli`, `/scaffold`, and `/doctor`. | Diff the table against `plugins/sagas/deno.json`. |
| 5 | `deno doc --json` unions contain 236 sagas symbols, 55 streams symbols, and 88 plugin-ai symbols, excluding `default`. Their current symbol tables document 56, 33, and 24 real exports. | Run `deno doc --json` for every real export target and compare the union with `parseDocContent().docSymbols`. |
| 6 | All three pages omit real exported symbols, so `mode: 'complete'` would be false. | Measured omissions are 180 sagas, 22 streams, and 64 plugin-ai symbols. |

## jsr-audit surface scan

- N/A: this is documentation-only adoption of unchanged export maps; no plugin/package source,
  dependency, publish shape, or JSR configuration changes.

## Open questions

- None. The export maps, parser contract, measured coverage, and required gates determine the edit.
