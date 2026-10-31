# Slice 3 repair review

**Verdict: PASS** (slice 3 repair)

The `fileTree` blocker is fixed, and the other repairs hold up. I found no new blockers.

### B1 resolved
- **Old argument accepted again:** `fileTree` now takes either `items` or a single root `tree` (`docs/site/_components/fileTree.vto:2`, `{{ set nodes = items || (tree ? [tree] : []) }}`). Nested levels still pass `items`, so the runtime-config call renders `runtime`, `current`, `features` and so on.
- **Build now fails on an empty tree:** a post-render check throws if any top-level file tree has no items (`docs/site/_config.ts:160-162`). This kind of silent loss now fails the build instead of shipping.

### Other repairs confirmed
- **Diagram guard:**
  - The filter now returns synchronously (`_config.ts:81-87`).
  - The build checks every `.ns-diagram` for a hidden, lazy `<img>` and an inline `svg[role="img"]` whose `aria-label` matches the image's `alt`, and fails if either is missing (`_config.ts:163-172`). The B3 conditions are now enforced on every built page, on top of the browser evidence.
- **Current learning step:** it's marked with `aria-current="step"` in the built HTML, matching either the plain or the `/netscript/`-prefixed URL (`_config.ts:151-156`).
- **Scrollable regions:** code blocks and tables are keyboard-focusable in the built HTML (`_config.ts:157-159`), not just after JavaScript runs.
- **API row ids:** a row's id is dropped if a heading or an earlier row already uses it (`_config.ts:173-179`).
- **Line numbers:** `codeBlock` drops one trailing newline before counting (`docs/site/_components/codeBlock.vto:8`).
- **Heading permalinks:** they're added in a listener registered after the Markdown twin tool, so twins keep clean headings (`_config.ts:186-206`). The links are empty, carry `data-pagefind-ignore`, and add no text, so the TOC labels (built from heading text) and the homepage `main h2` check stay clean.
- **Favicon:** it's generated from the same Figma context, using brand red and the primary foreground for Light and Dark. Its fills use those named roles and its embedded declarations come from the generated values. `--check` covers it as well as `tokens.css` (`tools/docs-site/generate-tokens.ts:114-158`, `docs/site/favicon.svg`). The copper favicon is gone, and red only appears on the logo square.

### Not blocking
1. **Headings will be read twice.** Each permalink has `aria-label="Link to <heading text>"` and sits inside its heading. The heading's accessible name therefore becomes "<text> Link to <text>", which screen readers repeat in heading lists. axe won't flag it. Either put the anchor next to the heading instead of inside it, or give it a short name like "Permalink".
2. **The favicon's dark variant follows the OS setting** (`prefers-color-scheme`), not the site's own toggle. Browsers render favicons outside the page, so nothing more can be done here.
