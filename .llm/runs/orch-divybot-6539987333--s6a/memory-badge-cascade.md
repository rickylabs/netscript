# Badge cascade and fallback — 2026-10-31

The shared Utility anatomy selector had the same specificity as the variant selectors and came
later. Its transparent background/currentColor border silently replaced every variant palette.
Keep paint in the variant rules; the shared rule only owns label font and spacing. Info text
falls back to secondary-text, never the solid secondary fill.

Use the actual registry CSS in Chromium with distinct sentinel colors for text/subtle/border.
Compare all computed channels under studio-utility, studio+utility and studio without flavor;
exercise absent info tokens under ns-one/light/dark. Soft assertions collect all variants rather
than stopping at the first mismatch. Real gallery axe tests still cover actual token palettes.
No snapshot or accessibility allowance was changed for these fixes.

The original CSS fails eight cases. Removing the late paint overrides passes four variant cases
while four fallback cases stay red. Fixing the fallback passes all eight. Initial missing-host-lib
browser startup is not a regression proof; use the subsequent assertion-bearing results.
The badge spec declares DOM types for its browser callbacks; scoped Deno checking uses no-config,
no-lock, node-modules-dir=manual from tools/fresh-ui-browser (where npm dependencies live).
The current owned scaffold is .llm/tmp/s6a/code-merge/utility-merged/apps/dashboard; the older
.llm/tmp/s6a/merged scaffold has a stale highlight.js mapping and is correctly rejected.

Owner excludes CSS-size growth and QueryResult duplication from this round. Do not expand scope.
