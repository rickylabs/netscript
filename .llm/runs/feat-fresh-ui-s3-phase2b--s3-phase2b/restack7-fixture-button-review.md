# Restack7 actual fixture controls — independent design review

**PASS**: the fixture contrast correction and the fresh gate plan are approved before you edit. I found no blockers, and the failure streak stays at 0.

**Why it holds**
- **The failure came from paint added by the new fixture, not from the framework.**
  - `SharedTrackExamples` renders bare `<button>` elements: the Sort name header (`gap-data-table-fixture.tsx:366`) and the Edit and long-activity row actions (lines 383–385).
  - In dark-scheme WebKit they take the native widget paint, white text on #c0c0c0 at 1.81:1. Axe is right to fail that against 4.5:1.
  - DataGrid and its CSS don't style caller controls, so no production change is justified.
- **Reusing the shipped `Button` is the correct fix.**
  - It's already imported (line 3) and already used by this module's Orders composition with `variant='ghost' size='sm'` (line 246).
  - It renders a real `<button type="button">` by default, carries the Utility foreground and background roles, and adds no CSS, raw colour, token or dependency.
  - Labels and slot content stay the same, so the geometry intent survives: short "Edit" versus the long action, which is wider than the empty action header, plus the live header control that narrow mode keeps visible through `th:has(button)`.
- **Dropping the 667 composition is right.** Fixture bytes change, so the 667 is now historical only. A fresh full 667, which includes all 88 data-table cases, plus a fresh 320 is stronger than what I accepted before, so a separate 88 isn't needed.

**Conditions you must meet**
1. **Limit the edit.**
   - Change exactly three call sites, `Sort name`, `Edit` and the long action, to `<Button type='button' variant='ghost' size='sm'>` with the same text.
   - The `#table-keyboard` controls, Orders composition, row data, column widths, selection and status fixtures stay byte-exact.
   - Record a mechanical fixture diff limited to those sites.
2. **Don't adapt the geometry assertions to the new control.**
   - Button's own padding, height and wrapping may change intrinsic sizes. The tests already compare relative geometry, so every assertion stays as it is: the 0.75px tolerance, the fixed `[420, 380]`, the overflow and status checks, no narrow overflow, and same-row selection neutrality.
   - If a narrow case now overflows, or the long action no longer exceeds the header, stop and redesign. Don't add fixture CSS, change tolerances or swap content.
3. **If the contrast problem persists, it's a Button problem, not a fixture one.** If the ghost `Button` still fails strict axe in any engine or scheme, for example because native widget appearance survives, it becomes its own framework design review. Don't patch it locally in the fixture and don't add an allowance.
4. **Gate order, every run to a terminal result with 0 retries, 0 flaky and 0 axe allowances:**
   1. canonical rebuild, since the private direct-server config skips the build;
   2. fixture, spec and source check, lint and format, 0 dropped;
   3. the focused 36;
   4. the fresh full 667;
   5. the full targeted Firefox/WebKit 320.

   No stopped run counts as green.
5. **Records.**
   - Archive the stopped 32/1/3 run publicly as a failure with counts.
   - Keep the earlier 667 (380 captures) marked historical.
   - The 765 package and broader proofs stay valid because framework bytes are unchanged. Fixture bytes are outside the package's tests.

**Next**
1. Make the fixture edit.
2. Rebuild, then run the wrappers, the focused 36, the fresh 667 and the fresh 320.
3. Come back to me for the same source and evidence reviews.
4. Commit, run all four carriers and the quality/publish refresh at the actual head, then the public audit.
5. Force-push the child with an exact lease against `d0d8d922…` and update #2538.

Still required after that:
- **11b:** Toc, AnchorNav, RuledGrid, Hero, the Desktop audit and the original Shell Toc integration.
- **12:** the declared x-extensions and the all-style harness.
- **13:** the final runtime run, the whole-phase IMPL-EVAL and green CI at the exact head.

No READY, labels or early promotions of the 19 future items.
