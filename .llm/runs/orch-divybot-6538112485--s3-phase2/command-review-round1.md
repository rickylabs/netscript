FAIL_FIX (slice 7c3a: CommandPalette, not the final IMPL-EVAL)

**Blocker: highlighting matches in an excerpt depends on `RegExp.escape`, a 2025 API with no fallback, so the palette crashes in browsers that lack it.**

- **Where:** `packages/fresh-ui/registry/components/ui/command-palette.tsx:78`, inside `queryExcerpt`, which runs for every visible item with an `excerpt` once the query isn't blank (line 283).
- **Why it's a blocker:**
  - `RegExp.escape` only arrived in Chromium 136, Firefox 134 and Safari 18.2. In older browsers still in use, such as iOS 17 Safari, the call throws a `TypeError` during render.
  - The hydrated palette therefore breaks as soon as the user types a query that leaves any result with an excerpt.
  - SSR under Deno, and the Chromium-only browser matrix, can't show this.
  - It's the only browser-side use of the API in the package; the other uses in the repo are server-side Deno. Fresh UI elsewhere deliberately ships fallbacks for newer platform features, such as anchor positioning and popover.
- **Required fix:**
  - Don't depend on `RegExp.escape` in copied browser code. The simplest option is a tiny local escape (`s.replace(/[\\^$.*+?()[\]{}|\/-]/g, '\\$&')`). Better, find matches with `indexOf` on lower-cased text, which also matches the filter's `toLowerCase().includes(...)` behavior exactly.
  - Add a unit test that renders an excerpt match with `RegExp.escape` temporarily undefined (or that asserts the helper never references it). Include a query full of special characters, such as `a.b(c)`, so escaping is proven.
  - Rerun the CommandPalette focused tests.

The rest of the slice is sound:

- **One activation path:** pointer and Enter both go through Combobox `selectValue` → `onValueChange`, which checks the item is known and visible, then calls `onSelect`, then requests close.
  - The controlled `value=''` makes repeated Enter on the same item fire every time.
  - Disabled rows are plain `role=option` `aria-disabled` divs that never register, so navigation and activation skip them.
- **Combobox runtime (`src/runtime/combobox/use-combobox.ts`):**
  - Composition keys are ignored, so an IME's Enter commit doesn't activate anything.
  - Editing the query clears the highlight, and an effect clears it when the highlighted option disappears or the list closes.
  - A refused controlled close keeps the highlight.
  - Pressing an option with the mouse keeps DOM focus on the input, using the active-descendant pattern.
  - Item order is rebuilt in DOM order on each render, because the composed refs re-register.
- **Dismissal:**
  - Escape in the input blocks the native close and sends one request. Native `cancel` is likewise blocked before the parent is asked, so a refusal leaves the dialog open.
  - A duplicate `native-close` while already controlled-closed is ignored.
  - Inline mode (`scrim={false}`) clears the query on Escape and doesn't capture focus.
- **Structure:**
  - Empty and loading states sit outside the listbox, in `role=status`. Groups are labelled through `aria-labelledby`.
  - Item IDs are URI-encoded and must be unique and non-blank.
  - Excerpts stay escaped plain text, with matches in `<strong>`.
- **Registry and contract:**
  - The Kbd and Spinner copies are declared as registry dependencies, and the runtime dependency repair is named exactly.
  - O10 records the metadata correction (`src/contracts/catalog/overlays/4.ts:311`, and line 61 of `command-palette.README.md`).

Non-blocking: when `scrim` is true, reopening resets the internal query to `''` without calling `onQueryChange('')`. A caller that mirrors the query for async search can end up holding a stale value. Calling `onQueryChange('')` there, or documenting it, would avoid that.
