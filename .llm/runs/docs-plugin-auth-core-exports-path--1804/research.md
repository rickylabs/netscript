# Research

## Baseline

Re-baselined against `origin/main` `5197e70b716eafb82fbb12ddb9a910c248ddb86a`. The page has all nine entrypoint names but no Path column, so the drift parser reads each Purpose cell as its module path.

## Export and symbol evidence

`packages/plugin-auth-core/deno.json` publishes nine entrypoints. Separate `deno doc --json` runs over all nine modules produced 139 unique non-default symbols. The page's symbol tables contain 42 of those symbols and no non-exports, leaving 97 undocumented exports. Therefore `symbolCoverage.mode: 'entrypoints-only'` is required; `complete` would be inaccurate.

## Open questions

None. The issue fixes the table/parser contract and explicitly excludes broader symbol documentation.
