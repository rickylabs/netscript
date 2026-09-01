# Research — docs-fresh-exports-table--1817

## Re-baseline

- Carried-in source: issue #1817 and `implement.md`.
- Re-derived against `origin/main` at `5197e70b716eafb82fbb12ddb9a910c248ddb86a` on 2026-08-31.
- The issue facts remain current: `packages/fresh/deno.json` publishes sixteen entrypoints, while
  the reference page's unheaded summary table contains twelve rows and is not recognized by the
  export-drift parser.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | The export map contains root plus fifteen subpaths, including `desktop`, `defer/island`, `ai`, and `ai/sandbox`. | `packages/fresh/deno.json`; `deno doc --json` over each mapped module. |
| 2 | `desktop` exports a Desktop-gated oRPC window binder and lifecycle/capability contracts. | `deno doc --json packages/fresh/src/runtime/desktop/mod.ts` |
| 3 | `defer/island` exports the client defer coordinator component plus defer-policy contracts. | `deno doc --json packages/fresh/src/application/defer/island.ts` |
| 4 | `ai` exports durable-chat connection, projection, snapshot, response, and proxy helpers/contracts. | `deno doc --json packages/fresh/src/runtime/ai/mod.ts` |
| 5 | `ai/sandbox` exports Fresh-compatible MCP sandbox and widget-call handlers plus their contracts. | `deno doc --json packages/fresh/src/runtime/ai/sandbox.ts` |
| 6 | Root, defer, error, interactive, and testing sections cover all current symbols; server, builders, route, form, streams, query, and Vite omit real symbols; the other four entrypoints have no per-symbol sections. | Read-only comparison of all sixteen `deno doc --json` symbol sets with each existing Markdown section. |

## jsr-audit surface scan

- N/A: this is a docs/tooling adoption slice and does not change `packages/fresh` source, its
  `deno.json`, or its published API.

## Open questions

- None. The complete/incomplete comparisons require `symbolCoverage.mode: 'entrypoints-only'`.

