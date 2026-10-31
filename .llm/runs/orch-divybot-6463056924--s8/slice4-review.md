# Slice 4 independent review

**Verdict: PASS** (slice 4: search palette)

I found no blockers.

### Checked
- **Lazy loading, no backend:** Pagefind's own script is imported from `<base>/pagefind/pagefind.js` only when someone first searches. The base comes from the script's own location (`docs/site/assets/docs/search.js:5,29-37`), so `/netscript/` is handled. Lume no longer injects Pagefind's built-in UI (`docs/site/_config.ts:131`).
- **Safe rendering:**
  - Titles, paths, groups and counts are set with `textContent`.
  - Excerpts are parsed with an inert `DOMParser` and rebuilt from text nodes and fresh `<mark>` elements only, so markup from the index can't run (`search.js:46-61,105-141`).
  - Result URLs must resolve to the same origin and sit under the site root, otherwise they're dropped (`search.js:38-45`).
- **Stale and closed responses:** every query, filter change, "Show more" and open bumps a request counter. Results and errors are thrown away if they belong to an older request or the dialog has closed (`search.js:161,214`). Closing also bumps the counter and cancels the debounce timer (`search.js:293-299`).
- **Filters and paging:**
  - Lane counts come from Pagefind's `totalFilters`, with `unfilteredResultCount` for "All". A lane with zero matches is hidden unless it's the active one.
  - Only the visible slice of results is fetched, 20 more per "Show more".
  - At most two section hits are shown per page, and the page's own URL and title are skipped (`search.js:80-104,160-211`).
- **Dialog and keyboard:**
  - It's a native modal `<dialog>`. The input is a combobox using `aria-activedescendant` over a listbox of grouped options. Arrow keys wrap around and keep the selection scrolled into view.
  - Enter opens the selected result, and with nothing selected it doesn't submit the close form. Input during IME composition is left alone.
  - Escape and clicking the backdrop both close it. Cmd/Ctrl+K toggles it, and the trigger link also opens on Space.
  - Focus goes back to whatever opened it, except when closing in order to follow a result (`search.js:225-309`).
- **Same-page fragment results:** clicking a result closes the dialog and lets the link do its normal jump, and Enter uses `location.assign`. Either way the dialog closes and the page scrolls to the target.
- **Honest states:**
  - idle: "Type a term…";
  - loading: "Searching…", with `aria-busy` set;
  - ready: the result count is announced through the `role="status"` line, which is only visually hidden;
  - empty: "No results…";
  - error: an "unavailable" message in error red with a "Reload page" button.

  A failed index load stays failed until the page is reloaded, and the error message says so.
- **Separate fallback:** the standard Pagefind UI loads only when its fallback section is opened, with its own stylesheet and script. If that fails it shows a clear message, and opening it again retries (`docs/site/assets/docs/shell.js:57-91`). It doesn't depend on the palette.
- **Matches the design:** a 640px panel 96px from the top, with no radius or shadow, and the ink marker on the active filter. Matches are shown in medium weight and the main text colour, with no highlight colour. The selected row gets the selection fill, a 2px ink bar and the ↵ icon. The footer has the key hints and the count (`docs/site/styles/search.css`).

### Not blocking
1. **Search box is empty without JavaScript.** With JavaScript off, opening "Search all documentation" shows an empty box (`docs/site/_includes/layouts/base.vto:111`). Pagefind needs JavaScript anyway, but a `<noscript>` line pointing readers to the navigation would make that state honest too.
2. **Slice 4 browser evidence is too thin for IMPL-EVAL.** `slice4-browser-evidence.json` holds only PASS strings. For the final verdict, slice 5's receipts should record the command, routes, viewports and schemes, and the axe totals.
