# Restack7 native query design continuation

**PASS**: your reading of condition 4 is correct. It's a clarification, not new scope, and you may write the code as described. I found no blockers, and the failure streak stays at 0.

**Why it holds**
- **Comparing whole cell rectangles across these rows would test content, not selection.**
  - In narrow mode the body rows deliberately use per-row tracks, `2.5rem minmax(0, 1fr) auto !important` (`data-table.css:183-189`). The caller's action slot is an intrinsic `auto` track.
  - The fixture's selected row has the short "Edit" action and the unselected row has the long activity action, so their data and action widths differ by content in every engine. That difference existed before the subgrid change.
  - Forcing a fixed slot or editing the fixture would break the byte-identical proof. Neither is needed.
- **Measuring the same row before and after selection isolates selection.**
  - The only thing selection adds is the marker, now an absolutely positioned `::before` overlay that takes no layout space (`data-table.css:282-294`), plus the background paint.
  - Measuring one live `#table-keyboard` row, selecting it with its real checkbox and Space through the accepting owner callback, then remeasuring tests that directly. Nothing in the fixture or production changes.
- **The fixtures with different content keep the guarantees that hold across rows.** Each row stacks, header controls stay live, there's no horizontal overflow, and the first logical content start and last logical edge stay aligned. Only the intrinsic action slot's width may vary.
- **The wide branch is unchanged.** Every check across rows stays exact: header and body x, width and start, the fixed `[420, 380]`, the overflow check and the status span.

**Conditions you must meet**
1. **Prove the selected state was actually applied before measuring.**
   - Wait for the row's `data-state='selected'` and a checked checkbox.
   - Assert the marker is rendered: the row's `::before` computed `content` isn't `none` and its width is greater than 0, under the fixture's Utility theme. Otherwise the neutrality check could pass with no marker.
2. **Compare the same quantities on the same row.**
   - Compare x, width and logical content start for every cell, first through last, in both directions, within 0.75px.
   - Leave y out explicitly, because the bulk-action bar that appears above the table moves rows down without affecting columns.
3. **Size and restore the keyboard fixture properly.**
   - Apply each narrow width to the `#table-keyboard` container through the same independent query helper, with the reference and root inline sizes matching within 1/64 px.
   - Confirm the component is in narrow mode before measuring.
   - Restore the original inline width in `finally`.
4. **Reset through the real owner, and prove it.**
   - Press Space again.
   - Assert `data-state` has cleared, the checkbox is unchecked, and remeasured geometry equals the baseline.
   - Assert "Rows opened" stays 0 throughout.
5. **Selected and unselected rows in the five geometry fixtures, narrow branch.** Assert equal logical content starts for data cells across selected and unselected rows. The selection rail is fixed at `2.5rem`, so this must hold whatever the action content.

Every other query-design condition from my last review still applies unchanged.

**Next**
1. Stop the debug server you own.
2. Edit only `data-table.spec.ts`: the selection body, the two geometry bodies and the local helper.
3. Run, all to terminal results with 0 retries and 0 flaky:
   - the focused 36;
   - the whole data-table file in the four Chromium projects (88);
   - the full targeted Firefox/WebKit 320;
   - the wrappers.
4. Come back to me for the same source and evidence reviews.
5. Commit, run the carriers and the quality/publish refresh at the actual head, then the public audit.
6. Force-push the child with an exact lease against `d0d8d922…` and update #2538.

The 667 Chromium run stays labelled "predecessor spec, identical rendered source".

Still required after that:
- **11b:** Toc, AnchorNav, RuledGrid, Hero, the Desktop audit and the original Shell Toc integration.
- **12:** the declared x-extensions and the all-style harness.
- **13:** the final runtime run, the whole-phase IMPL-EVAL and green CI at the exact head.

No READY, labels or early promotions of the 19 future items.
