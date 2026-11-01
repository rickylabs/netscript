**PASS**: the WebKit selection-marker correction is approved as designed. Replace the selected row's absolutely positioned `::before` with a logical inset box-shadow made from existing tokens, add a test that is proven red first, and run fresh gates. I found no blockers, and the failure streak stays at 0.

**Why it holds**
- **A real regression the existing tests didn't cover.**
  - Selecting a row adds an absolutely positioned pseudo-element directly on a subgridded row (`data-table.css:282-294`). In WebKit only, that misaligns the selected row's cells by up to 144.22px while the computed columns still read `subgrid`.
  - Your 12 controls separate the cause cleanly (`restack7-marker-control.json`):
    - only the WebKit baseline drifts;
    - removing the pseudo restores 0 drift;
    - both the gradient and the inset candidate keep the rail and 0 drift;
    - removing the paint alone also removes the rail, so it's correctly recorded as a negative, not a fix.
  - The terminal 667 and 320 runs passed because no wide test toggled selection live. Treating them as historical is correct.
- **The mechanism is bounded.** An inset `box-shadow` creates no box, so it can't take part in grid placement.
  - It uses the existing `--ns-space-0-5` and `--ns-marker` tokens, and a positive or negative inset under `:dir(rtl)` keeps the logical start edge.
  - Like the pseudo, it paints within the row's padding box, so its height doesn't change.
  - Backgrounds, hover mix, `data-state` / `aria-selected` matching, semantics and the API are untouched.
- **The test plan aims at the real composition.** It uses the actual Orders grid, with the host callback, bulk bar, fractional tracks and ActionMenu, and native Space to select and deselect. It checks all rows and the header cell x/width in wide mode, before/selected/reset neutrality in both modes, and both directions at the real project widths.
  - Replacing the computed-style `::before` check (`data-table.spec.ts:592`) with real screenshot pixels decoded via `createImageBitmap` and Canvas is stronger and adds no dependency.
  - Moving the colour probe out of the `TR` (lines 479–486 currently append a `span` to the row) fixes invalid DOM. You've measured that it doesn't mask the bug.

**Conditions you must meet**
1. **Order of proof.**
   1. Commit nothing yet. Add the strengthened regression and show it fails on the *unmodified* CSS in WebKit wide, with the drift recorded as a count.
   2. Then apply the CSS fix.
   3. Then regenerate the canonical CSS carrier through its generator, never by hand.
2. **Keep the CSS minimal.**
   - Remove the `::before` rule completely.
   - Leave the base row's `position: relative` and `isolation` alone (`data-table.css:55-58`), since the row-action hit area depends on them. The selected-only `position: relative` rule (lines 282–284) may go once nothing relies on it.
   - Don't add a browser branch, `@supports` hack, token or raw colour.
   - Make sure no other row rule sets `box-shadow` and would silently cancel the marker, whether selected, hover or focus.
3. **Make the pixel assertion precise and two-sided.**
   - Resolve `--ns-marker` and the selected background on a valid probe at body level, then remove it.
   - Sample interior rail pixels away from anti-aliased edges, on a device-pixel basis.
   - Declare one fixed channel tolerance in the test and don't change it. The adjacent background pixel must differ from the marker by more than that tolerance.
   - Assert that the *opposite* logical edge is **not** marker-coloured, so a rail on the wrong side in RTL fails.
   - Move the pointer away first so hover doesn't affect the sample.
4. **Negatives to keep:**
   - the red-first WebKit drift above;
   - a private missing-rail control in which removing the paint fails the pixel assertion;
   - the wrong-edge check from condition 3.

   Every earlier background, hover, checkbox, native-child, Keyboard-count and 0.75px geometry assertion stays.
5. **Fresh gates on frozen final bytes.**
   1. The focused selection cases in all three engines, both schemes and both widths, plus the negatives.
   2. Wrappers with 0 dropped files.
   3. The fresh full package suite (765).
   4. The fresh 667 Chromium and fresh 320 Firefox/WebKit, all with 0 retries, 0 flaky and strict axe unchanged.

   Then:
   - all carriers;
   - quality and native publish at the actual head;
   - the same source and evidence reviews;
   - the public audit and exact-lease push.

   Every earlier completed run is historical after this CSS change.

**Non-blocking**: in forced-colors mode, a box-shadow rail is suppressed, as the old pseudo's background effectively was. Selection still shows through the native checkbox. A one-line note in the DataGrid README would record it.

The latest-main docs-only addendum stays a separate review before any base write.

Still required after that:
- **11b:** Toc, AnchorNav, RuledGrid, Hero, the Desktop audit and the original Shell Toc integration.
- **12:** the declared x-extensions and the all-style harness.
- **13:** the final runtime run, the whole-phase IMPL-EVAL and green CI at the exact head.

No READY, labels or early promotions of the 19 future items.
