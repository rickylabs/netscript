# Slice 3 initial review

**Verdict: FAIL_FIX** (one blocker)

### B1. `fileTree` no longer accepts the existing `tree` argument, and the built page shows an empty box
- `docs/site/orchestration-runtime/runtime-config.md:192-203` still calls `comp.fileTree({ tree: { name: "runtime", comment: …, children: [...] } })`.
- The new component only reads `items` (`docs/site/_components/fileTree.vto:3`, `{{ for node of items || [] }}`).
- The current built page has an empty box where the tree should be: `<ul class="ns-file-tree ns-file-tree--root" … aria-label="Project files">` with no items under the "Runtime override layout" heading (`_site/orchestration-runtime/runtime-config/index.html:750-751`). Nothing fails, so the build and link checks stay green while the content silently disappears. That breaks the plan's rule to keep every existing call signature (`plan.md:11`).
- **Required fix:** accept `tree` as a single root node alongside `items`, for example `{{ set nodes = items || (tree ? [tree] : []) }}`. Then add a check that the built runtime-config page lists `runtime`, `current` and `features`. A rendered-output assertion that no `ns-file-tree--root` is empty would catch any other case.

### Checked
- **Twin conditions for inlined diagrams:**
  - The source `<img>` stays in the figure, hidden and `loading="lazy"`, with a plain `/assets/…` path, so the site's base-path rewrite adds `/netscript/` only once (`docs/site/_components/diagram.vto:3`).
  - The twin tool's `figureMd` picks up that `<img>`.
  - The filter only accepts `/assets/diagrams/*.svg` (`docs/site/_config.ts:81-87`).
  - The generated SVG files aren't touched, and a test confirms the source is byte-identical afterwards.
- **Inline SVG:**
  - It gets `role="img"` and an escaped `aria-label` taken from the alt text, and the renderer's role and label attributes are removed.
  - Every `id`, every `#id` reference and every `aria-*by` reference gets a unique per-instance prefix, applied longest-first. This fixes the shared `#my-svg` style scoping too.
  - Colours become `--ns-fg`, `--ns-surface`, `--ns-bg` or `--ns-muted-fg`, and fonts become `--ns-font-sans` (`tools/docs-site/inline-diagram.ts:29-61`).
  - The tests cover unique IDs across two instances, escaping, no raw colours left, and failing on a missing alt text or bad instance id (`tools/docs-site/inline-diagram_test.ts`).
- **Copying code skips line numbers:** line numbers live in a separate `aria-hidden` block with `user-select: none`. Copy reads `pre code` within its own frame, and every tab panel and comparison entry has its own frame (`docs/site/_components/codeBlock.vto:6-8`, `docs/site/assets/docs/tabs.js:77-133`, `docs/site/styles/components.css:369-377`).
- **Tabs and runtime choice:** choosing a tab with the arrow, Home or End keys also saves the runtime (`tabs.js:21-48`). Saved choices are restored on load without being saved again, and blocked storage falls back to the first tab (`tabs.js:51-59`).
- **No JavaScript:** every panel is visible, and the tab list, comparison picker and copy buttons are hidden. The comparison shows the first competitor in full.
- **API tables:** object rows are two columns, with the name stacked over the type in a 232px column and then the description. They stack on mobile. Tables with explicit `columns` stay generic. The `rows`/`items` and `caption`/`title` aliases are kept (`docs/site/_components/apiTable.vto`, `components.css:447-493,792-812`).
- **Lists:** the file tree is a plain nested list with no tree ARIA, and the learning path is an `<ol>`.
- **Callouts:** note, tip and important are monochrome, and important gets a 2px ink left rule. Warning uses the warning colours. Error uses the destructive colours. Nothing else is red.
- **Signature kit:** eyebrow, kbd, file-path chip with an optional copy button, attribute chip and location marker are all present.
- **Home page order:** hero, lede, three pillars, the quickstart runtime tabs, the ownership tree and code, the four-column grid, the learning path, then the contract flow in a disclosure and "Where to go" (5 links, as the rendered-output check requires).
- **Other existing arguments that still work:** `card`, `cardsGrid`, `featureGrid`, `badge`, `hero`, `learningPath`, `tabbedCode`, `tabbedRuntime` and `comparisonTabs`.

### Not blocking
1. The current-step marker in `learningPath` never shows. It compares `url` to each step, but no call passes `url`, and components don't receive the page's URL (`docs/site/_components/learningPath.vto:3`). Pass `url` at the call sites or have the layout supply it.
2. `apiTable` now gives each object row an `id` made from the row name (`apiTable.vto:14`). That can clash with a heading's id or with a row in another table on the same page. Anchor links would then jump to the first match.
3. When code ends with a newline, `codeBlock` shows one extra line number (`codeBlock.vto:8`), unlike the `trimEnd()` used in `tabs.js:105`.
