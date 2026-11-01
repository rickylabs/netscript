# Restack7 native selection precondition — independent design review

**PASS**: the selection-precondition refinement and the evidence composition are approved, with the conditions below. Don't edit the spec until the live Chromium 667 run has finished. I found no blockers, and the failure streak stays at 0.

**Why it holds**
- **This is the case's first measured WebKit run, not a restack regression.** The run records show the double-click case wasn't in the earlier focused Firefox/WebKit selections. The 9c-b2 Firefox/WebKit scope lists text selection, activation, modifiers and similar cases, but not double-click.
- **The guard is behaving as designed.**
  - `activateRowFromPointer` returns early whenever the row holds an uncollapsed selection at click dispatch (`data-grid.tsx:345-349`). That's the approved native-first rule that row activation never overrides active text selection.
  - Your diagnostic shows WebKit still exposes the double-click range during the next single click (a fresh click, not a triple-click) and only collapses it afterwards. Chromium and Firefox have already collapsed it.
  - So the WebKit result of 1 follows from a premise the original test never stated. No product bug is shown, and leaving the guard alone is correct.
- **The precondition makes the test say what it means.**
  - The original body stays: the double-click at `data-table.spec.ts:346`, the selected text containing "First", "Rows opened" at 1, then `cell.click()` and 2.
  - In between go a physical click on the existing "Data table examples" heading, which is outside the grid and not interactive, then `isCollapsed === true` and "Rows opened" still 1.
  - The test now checks both halves: clearing a selection outside the grid never activates a row, and an ordinary click afterwards activates exactly once.
  - It uses no engine branch, sleep, retry, `removeAllRanges`, synthetic event or runtime change.
  - The 12 direct controls (3 engines × 2 schemes × 2 widths) all pass this exact sequence.
- **The evidence composition is acceptable for this restack checkpoint.**
  - Production, CSS and fixture bytes are unchanged, the file-level hooks (`data-table.spec.ts:7-22`) are unchanged, and only this one test body changes.
  - Proof for the changed case comes from the focused 12 under the checked-in config, including all four Chromium projects, plus the full Firefox/WebKit 320 rerun.
  - Slice 13's fresh full matrix is still mandatory, so I won't require another full 667 run now.

**Conditions you must meet**
1. **Only a terminal pass counts.** The 667 must finish all 667 cases with 0 failed, 0 retries and 0 flaky. Record:
   - the spec file's hash at run start;
   - the production and fixture bytes at run start;
   - a mechanical diff showing that the only change between that spec and the final spec is inside this one test body.

   Label the run in the public record as "predecessor spec, identical rendered source" and never as a run after the change. If anything in it fails or it stops early, the composition doesn't apply. Fix the cause and run 667 again.
2. **The edit itself:**
   - make the heading click with a real pointer (`click()` on the heading locator) and check that the clicked point isn't inside `#table-keyboard`;
   - read `isCollapsed` only after the click has completed;
   - leave every original line and its order unchanged.

   Add a comment explaining that the click clears the selection: WebKit still exposes the previous range during the next click, and the row guard deliberately respects it.
3. **Be honest about engine differences.**
   - In WebKit, a body click that only dismisses an earlier selection inside the row doesn't activate, and the next click does.
   - Record this as known native behavior in the run evidence. Don't assert it with an engine branch, and don't call it uniform across engines.
   - The existing drag-selection case (`text-selection-is-native`, lines 46–67) stays the guard's direct negative test.
4. **Gates:**
   - scoped check, lint and format on `data-table.spec.ts`, 0 dropped;
   - the focused 12 under the checked-in gap config, all three engines × four projects, 0 retries and 0 flaky;
   - the full targeted Firefox/WebKit 320, run to a terminal result after the change.

   The 765 package and broader gates stay valid while production bytes are unchanged.

**Non-blocking**: a one-line note in the DataGrid README about WebKit's dismiss-click behavior would help consumers. Only add it if you accept the docs-carrier regeneration it brings.

**Next**
1. Let the 667 finish.
2. Edit the one test, then run the focused 12 and the full 320, plus the wrappers.
3. Come back to me for the same source and evidence reviews.
4. Commit, run the carriers and the quality/publish refresh at the actual head, then the public audit.
5. Force-push the child with an exact lease against `d0d8d922…` and update #2538.

Still required after that:
- **11b:** Toc, AnchorNav, RuledGrid, Hero, the Desktop audit and the original Shell Toc integration.
- **12:** the declared x-extensions and the all-style harness.
- **13:** the final runtime run, the whole-phase IMPL-EVAL and green CI at the exact head.

No READY, labels or early promotions of the 19 future items.
