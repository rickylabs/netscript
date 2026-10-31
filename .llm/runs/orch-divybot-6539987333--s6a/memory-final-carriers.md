# Carrier and generated-app proof

After source slices are committed, regenerate agent-docs prose, MCP export corpus, assets barrel and publish assets. MCP generation guards all package/plugin sources, including already-regenerated prose; use its explicit --allow-dirty only for the reviewed candidate and then run every freshness check. check:assets-barrel compares unstaged content with the index, so stage the reviewed candidate before the repeat-generation check; this proves reproducibility, not a clean worktree.

Token freshness compares registry JSON serialization too. S5 inline dependency-array formatting caused tokens:check to fail; native tokens:build expanded the array and changed no token values or generated token outputs.

A production build alone may tree-shake a copied component. The final scaffold probe adds an app-owned temporary code-proof route importing copied CodeBlock, checks that route/component/layout with the structured checker, builds through Fresh Vite, then verifies HTTP200, syntax spans/colors and original data-clipboard in Chromium. The route is a private validation fixture, never a shipped scaffold route.

JSR audit module-tag checks apply to code, not JSON data exports. Existence checks remain unconditional. The integration regression proves undocumented TypeScript and missing JSON exports still fail.
