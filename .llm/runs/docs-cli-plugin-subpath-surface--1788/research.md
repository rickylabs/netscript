# Research — docs-cli-plugin-subpath-surface--1788

## Re-baseline

- Carried-in source: issue #1788 and umbrella #1777.
- Re-derived against `origin/main` at `74e3d451e5dcb9a9cf2fc0a20ca98ee44a9819d9` on
  2026-08-30.
- The branch, local `origin/main`, and requested baseline all resolve to the same commit. The source
  export maps and both reference pages agree with the brief: the subpaths exist and no separate
  generated reference pages exist.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | `@netscript/cli` publishes `./scaffolding` and `./testing`. | `packages/cli/deno.json`; `deno doc --json` for each entrypoint |
| 2 | CLI subpaths expose 46 unique symbols. The page covers 45; only `CacheBackendChoice` is absent. The testing entrypoint also re-exports five symbols described in the scaffolding table. | Compare the two entrypoint JSON symbol arrays with table rows in `docs/site/reference/cli/index.md` |
| 3 | `@netscript/plugin` publishes twelve subpaths. Their union is 221 unique symbols; the page currently covers 95 and omits 126. | `packages/plugin/deno.json`; `deno doc --json` per subpath; page-table comparison |
| 4 | Plugin coverage is not uniformly absent. `config`, `abstracts`, `loader`, `sdk`, and `testing` are substantively covered; `adapter`, `protocol`, `scaffold`, `contract-base`, and `service` are absent; `cli` and `templates` are partial. | Per-entrypoint symbol comparison recorded in the implementation lane output and summarized in `plan.md` |
| 5 | Existing root/config/CLI/SDK symbols recur on several plugin subpaths. They should be called out as re-exports rather than described repeatedly. | Declaration locations in each `deno doc --json` symbol record |
| 6 | `docs/site/**` feeds the rendered site corpus, then the compressed agent-docs assets, the CLI barrel, and MCP publish assets. | `.llm/tools/docs/build-agent-docs-bundle.ts`, `.llm/tools/generate-cli-assets-barrel.ts`, `.llm/tools/generate-publish-assets.ts`, root `deno.json` tasks |

## jsr-audit surface scan

- N/A. This is a docs-only correction: no package export, source, manifest, or publish metadata
  changes. Public surfaces are inspected, not modified.

## Open questions

- None. The source/page comparison resolves the plugin completeness judgment and the split decision.

