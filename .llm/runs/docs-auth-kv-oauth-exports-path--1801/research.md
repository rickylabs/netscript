# Research

## Baseline

Re-baselined against `origin/main` `5197e70b716eafb82fbb12ddb9a910c248ddb86a`. The page has all eight entrypoint names but no Path column; the providers Purpose cell contains an embedded code span that prevents the export-row regex from matching it.

## Export and symbol evidence

`packages/auth-kv-oauth/deno.json` publishes eight entrypoints. Independent `deno doc --json` runs over all eight modules produced 80 unique non-default symbols. The page's symbol tables contain 24 of those symbols and no non-exports, leaving 56 undocumented exports. Therefore `symbolCoverage.mode: 'entrypoints-only'` is required; `complete` would be inaccurate.

## Open questions

None. The issue fixes the table/parser contract and explicitly excludes broader symbol documentation.
