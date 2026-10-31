# Gate recipes

Use the structured test wrapper with `--cwd packages/fresh-ui -- --allow-all --lock=deno.lock --frozen --unstable-kv tests/tokens tests/publish-size.test.ts`. The native publish-size test measures real Deno publish file bytes; keep five MB and six KB Web gzip limits unchanged. Empty JSON exclusion arrays infer never[] in direct imports: test against the domain interface when inspecting entries, and replace the obsolete S0 exclusion test with zero-active-failure acceptance.

The corpus generator needs a clean committed read set. `gen:mcp-export-corpus --allow-dirty` is preview only; rerun without that flag after the source checkpoint. Generate prose, corpus, assets barrel, then publish carriers. check:assets-barrel compares regenerated files to the Git index, so stage synchronized outputs before that gate. Revert docs/site/deno.lock churn if generated.

scaffold.runtime cannot run on this host: Docker daemon unavailable; report UNPROVEN. Store raw runtime/resource/evaluator output outside Git and publish only resource verdict/counts.

Chromium/axe real-browser evidence: npm ci --ignore-scripts in tools/fresh-ui-browser, scaffold a db-none/no-Aspire gallery with theme-previews, and run the existing Playwright matrix with an owned free port. This host's pinned browser is already cached; use project-managed Chromium libraries for local runs. Compare and narrow exact axe allowances using record-axe-baseline.ts; S1c removes 12 proven stale color-contrast entries, never adds/raises an allowance. Canonical browser receipt uses fresh-ui-browser with a fresh child results.json; contract gate is fresh-ui-browser-contract.
