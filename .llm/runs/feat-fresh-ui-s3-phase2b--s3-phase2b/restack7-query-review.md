# Restack7 native query design continuation

**PASS**: the native query-precision refinement and the extended evidence composition are approved, with the conditions below. I found no blockers, and the failure streak stays at 0.

**Why it holds**
- **The product meets the requirement I set.**
  - The approved complementary pair is in source: `@container ns-data-grid (max-width: 640px)` (`data-table.css:165`) and `(width > 640px)` under `@supports (grid-template-columns: subgrid)` (lines 320–321).
  - Your 21 bare controls (`restack7-query-control.json`) show exactly one query matching in every engine and width, none with neither or both, and the component mode matching the reference in all 21. Waiting extra frames changes nothing.
  - WebKit putting 640.25, 640.5 and 640.75 on the narrow side is native query precision, not a gap with no layout and not a timing race. No production change is justified.
- **The current geometry tests hardcode a wide result at 640.5.** That's `data-table.spec.ts:443` with the `overflow` assertions at lines 475–484, and line 505 `rowBox.width > 640.5` in the status test. They describe Chromium and Firefox, not the contract.
  - Taking the expected mode from an independent native query reference is the right fix. It doesn't branch on the user agent.
  - It's protected on two sides. The fixed anchors (≤640 narrow and ≥641 wide in every engine) don't depend on the reference. The reference must partition exactly once. And the component must match it, so broken component CSS can't pick the easier branch.
- **Coverage gets stronger.** Adding 641 means every engine exercises wide alignment right at the boundary. All three fractionals stay, so each engine runs both branches. The 0.75px limit and the explicit 640 narrow case stay too.

**Conditions you must meet**
1. **The reference must measure the same input as the component.**
   - Before reading the markers, assert that the reference container's measured inline size equals the DataGrid root's measured inline size within 1/64 px. That's the `.ns-data-grid` box that owns `container-type`, not just the nominal fixture width.
   - Then compare modes.
2. **The reference must actually lay out and affect nothing.**
   - Hide it with `visibility: hidden`, `aria-hidden`, `pointer-events: none` and fixed or absolute positioning outside the flow, never `display: none` or the `hidden` attribute. A subtree with `display: none` doesn't evaluate size queries, so neither marker would match.
   - Give it its own container name and selectors, never `ns-data-grid`.
   - It must not add page or fixture horizontal overflow.
   - Remove both the element and its `<style>` in `finally`, including when an assertion fails.
3. **Observe the component mode independently.** Read the table's computed `display` (grid for wide, block for narrow) and the stacking of body cells. Fail if the two signals disagree with each other, not just with the reference.
4. **The narrow branch must be complete.** For every case, the fixed-width `overflow` case included, assert:
   - cells stacked in each row, with equal geometry for selected and unselected rows;
   - live, visible header Sort button and select-all checkbox;
   - `scrollWidth <= clientWidth` on the root.

   For status rows, the cell fills the row's inner width after native padding and its content is visible.

   The wide branch keeps every current boundary, content-start, fixed `[420, 380]`, `scrollWidth > clientWidth` and full status-span assertion unchanged, in LTR and RTL.
5. **Contain the diff.**
   - Only `data-table.spec.ts` changes: the selection body already approved, the two geometry bodies, and one local helper with no load-time side effects.
   - File hooks (lines 5–22), imports apart from any type-only import the helper needs, and every other body stay byte-exact.
   - Record a mechanical diff showing this.
6. **Evidence composition.**
   - The 667 stays labelled "predecessor spec, identical rendered source", with the hash taken before the run.
   - After the refinement, run:
     - the focused 36 (3 changed cases × 3 engines × 2 schemes × 2 widths, default trace settings);
     - the whole `data-table.spec.ts` in the four Chromium projects, which is cheap and proves the edited file's unchanged cases in Chromium;
     - the full targeted Firefox/WebKit 320 to a terminal result;
     - scoped check, lint and format, 0 dropped.
   - All with 0 retries and 0 flaky. If any of these fails, the composition is void until fixed and rerun.
7. **Keep the host-launch problem separate.** The failed diagnostic launch (missing native library under a hand-written environment) isn't an assertion result. The structured browser environment file stays private and out of public records. Caches, dependencies and binaries stay untouched, as you report.

**Non-blocking**: put a short comment beside the helper, stating that the boundary below one pixel is engine-native and that the test takes it from the queries and never from the component.

**Next**
1. Stop the debug server you own before the Playwright runs.
2. Edit the spec, then run the focused 36, the whole file in Chromium and the full 320, plus the wrappers.
3. Come back to me for the same source and evidence reviews.
4. Commit, run the carriers and the quality/publish refresh at the actual head, then the public audit.
5. Force-push the child with an exact lease against `d0d8d922…` and update #2538.

Still required after that:
- **11b:** Toc, AnchorNav, RuledGrid, Hero, the Desktop audit and the original Shell Toc integration.
- **12:** the declared x-extensions and the all-style harness.
- **13:** the final runtime run, the whole-phase IMPL-EVAL and green CI at the exact head.

No READY, labels or early promotions of the 19 future items.
