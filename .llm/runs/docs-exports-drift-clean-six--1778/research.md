# Research — docs-exports-drift-clean-six--1778

## Re-baseline

- Carried-in source: issue #1778, umbrella #1777, and the slice brief.
- Re-derived against `origin/main` / branch baseline
  `de57fab0e220203567367b6852f918dc71f296a6` on 2026-08-30.
- The branch, `HEAD`, and merge-base all resolve to the stated baseline; the branch intentionally
  has no upstream.
- The brief's entrypoint result was reproduced: a six-package `entrypoints-only` probe exits 0.
- The stronger per-package probes show that only `cron` exits 0 under `complete`; `aspire`, `cli`,
  `database`, `kv`, and `logger` report symbol omissions under that mode.

## Findings

| # | Finding | How to verify |
| - | - | - |
| 1 | The existing authoritative mapping contains eight packages and uses both `complete` and `entrypoints-only` policies. | Read `AUTHORITATIVE_MAPPING` in `.llm/tools/docs/check-exports-drift.ts`. |
| 2 | All six candidate pages exactly match their package export maps under `entrypoints-only`. | Run the custom six-package `checkDrift` probe recorded in `worklog.md`; exit 0. |
| 3 | `cron` is the only candidate whose documented symbol tables also match all symbols emitted by `deno doc`. | Run each candidate through `checkDrift` with `mode: 'complete'`; `cron` exits 0 and the other five exit 1 with concrete omissions. |
| 4 | Existing `plugin` policy proves that wording such as “written against the public surface” and subpath summaries does not by itself promise complete symbol inventory. | Compare `docs/site/reference/plugin/index.md` with its existing `entrypoints-only` mapping. |
| 5 | The agent-docs prose builder consumes an external bundle or rendered `docs/site/_site` files; it does not scan `.llm/tools/**`. | `.llm/tools/docs/build-agent-docs-bundle.ts`: `buildAgentDocsProse` and `buildAgentDocsProseFromSite`. |
| 6 | Publish-asset generation consumes checked-in agent-docs assets and package/version sources through explicit generators; the export-drift checker is neither an input nor an output. | `.llm/tools/generate-publish-assets.ts`: `PUBLISH_ASSET_OUTPUTS` and `generatePublishAssets`. |

## jsr-audit surface scan (package/plugin waves)

- N/A. This is a docs-tool policy adoption and does not change any package/plugin export or
  published implementation surface.

## Open questions

- None. Each coverage mode is resolved by the page's stated scope plus the live complete probe.
