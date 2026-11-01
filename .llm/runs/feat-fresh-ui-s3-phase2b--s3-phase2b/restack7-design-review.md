# Restack7 layout refinement — independent design review

**PASS**: the Restack 7 measured-layout refinement is approved as designed, ahead of any source edits. I found no blockers, and the failure streak stays at 0. The conditions below are part of what you implement and what I'll check in the source and evidence reviews. They aren't waivers.

**Why it holds**
- **Root causes are in the code.**
  - Main's Utility selectors in `data-table.css` (lines 226–288) are far more specific than the child's rules. Its row rule repaints every row with `--ns-table-row-bg` and only recognizes `[aria-selected='true']`. The child marks native rows with `data-state='selected'` (`data-grid.tsx:327`), and that's why selected rows go transparent once the pointer leaves.
  - Main's `stats-grid` root gap and default-card border rule (`stats-grid.css:159–169`) override the joined rules (lines 113–133).
- **Recognizing `data-state='selected'` is the right fix.** Adding it next to main's legacy `aria-selected` keeps main's roles and adds no ARIA. The existing assertion that rows have no `aria-selected` (`data-table.spec.ts:112`) must stay.
- **The column misalignment is real and predates main.**
  - Every row is its own grid with the same inline track list (`data-grid.tsx:66–73, 195, 324`), so the `auto` action track is sized separately per row. That's the 16px vs 103px you measured.
  - The fix is to give the existing `gridStyle` to the `TABLE`, which today is `display: block`, so the style does nothing until the wide rule applies. Head, body and rows then use `subgrid`.
  - That fixes the cause with CSS only: no measuring JS, no new prop or data attribute, and native elements and explicit roles stay. Turning rows back into native `table-row` is correctly rejected.
- **Narrow mode stays as it is.** Its rules already override the row tracks with `!important` and keep the live header controls (lines 165–215).

**Conditions you must meet**
1. **No width falls in neither layout.** The wide condition must exactly complement `@container ns-data-grid (max-width: 640px)`, using `(width > 640px)` or `not (max-width: 640px)`, never `min-width: 641px`. Otherwise a fractional width like 640.5px gets neither layout.
2. **Precedence is deterministic.** The wide subgrid rule must win over each row's inline `grid-template-columns` explicitly. The loading/empty status row and its `colSpan` cell must span `1 / -1` across the subgridded body rather than sitting in the first track.
3. **Gaps and padding are consistent.**
   - The table's column gap must equal the gap the rows used, so subgrid items aren't quietly narrowed.
   - Header and body rows must keep identical inline padding. A subgrid's own padding and border are added as margin on its edge items.
4. **The selected marker is measured at the cell, not the track.**
   - Under subgrid, a selected row's `border-inline-start` doesn't move the tracks, but it does push the first cell's content over by the marker width.
   - Assert that selected, unselected and header rows have identical first and last cell boxes, plus content starts, in both LTR and RTL.
   - Either draw the marker without taking layout space, or show the measured offset is zero. Keep main's marker colour and width.
5. **Joined StatsGrid gets every override back, only inside `[data-joined='true']`:**
   - root gap 0;
   - cards keep only `border-inline-start`;
   - card radius 0;
   - the upward-shadow horizontal seam, which main's `box-shadow: none` also removes;
   - the clipped first row.

   Re-measure this after wrapping and in RTL with the existing `joined-wrap-rules-and-rtl` assertions unchanged. Leave main's non-joined roles and typography alone.
6. **Hovering a selected row stays selected.** The selected-plus-hover mix must also accept `data-state='selected'`, so hovering a selected row doesn't fall back to plain hover. Measure it in light and dark.
7. **Geometry tests in all three real engines:**
   - header and body boundaries line up in each column;
   - LTR and RTL;
   - caller fixed widths whose sum exceeds the container, with row background and rule covering the whole track area and the root still scrolling;
   - with and without the selection column and row actions;
   - intrinsic action content wider than the header;
   - the zero-column grid;
   - loading and empty states;
   - narrow stacking with visible header controls;
   - native focus rings;
   - axe.

   Every existing DataGrid and StatsGrid browser assertion stays as it is.
8. **Scope:**
   - at most the roughly six maintained files you listed, plus regenerated derived files;
   - Shell and font fixes only for a failure you've measured;
   - no token values, dependencies, API or keyboard changes.

**Non-blocking**: wrapping the shared-track rule in `@supports (grid-template-columns: subgrid)` would make older engines fall back to today's per-row tracks at very little cost.

**Next**
1. Finish the unchanged full first pass of 655 cases.
2. Make the source edits.
3. Run the focused negatives and full matrices, then come back to me for the same source and evidence reviews.
4. Commit, then run the carriers, quality and publish at the actual head, then the public audit.
5. Force-push the child with an exact lease against `d0d8d922…` and update #2538.

Still required after that:
- **11b:** Toc, AnchorNav, RuledGrid, Hero, the Desktop audit and the original Shell Toc integration.
- **12:** the declared x-extensions and the all-style harness.
- **13:** the final runtime run, the whole-phase IMPL-EVAL and green CI at the exact head.

No READY, labels or early promotions of the 19 future items.
