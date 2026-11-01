**PASS**: Restack 7 source review, round 2. These are the same 14 uncommitted files on local `707e08db`, replayed onto parent `426c5d09` and main `f4aa307b`. My one round-1 blocker is resolved by the right mechanism, I found no new blockers, and the failure streak resets to 0.

**The round-1 blocker is resolved**
- **The floor is now set only by tracks that can't shrink** (`packages/fresh-ui/registry/components/ui/data-table.css:321-329`).
  - The wide table uses `min-width: min-content`, so fluid `minmax(0, …)` tracks contribute 0 and can wrap again.
  - Fixed tracks and the selection track still set the floor.
  - The intrinsic actions cell gets `min-width: max-content` in wide mode only. That fixes the min-content failure your probe isolated, where the action shrank to 24px and its button spilled. Caller actions stay on one line, and when their sum with fixed tracks exceeds the container, the table scrolls as designed.
  - Rejecting the `100cqw` option, which broke the status span, was correct.
- **The second problem was found and fixed before review.** Your captures showed WebKit sizing the implicit rows before the subgrid columns had wrapped their content, so wrapped text overlapped the next row by up to 160px.
  - `grid-auto-rows: max-content` on the wide head and body groups (lines 330–337) sizes each row to its wrapped content.
  - It keeps the Utility minimum row height, because a max-content track respects the item's `min-height`. Rejecting a `min-height: auto` override was correct.
  - It's one rule for every engine: no JS measurement, token, API or engine branch.
- **The test closes both gaps** (`tools/fresh-ui-browser/gap-tests/data-table.spec.ts:839-914`).
  - The real fixture (`gap-data-table-fixture.tsx:121-154`) has a default track and a bare `2fr` track. The email has no spaces, so it tests both `minmax(0, 1fr)` and `minmax(auto, 2fr)` together with `overflow-wrap: anywhere`.
  - It runs at 641, 900 and the natural width within 1280, LTR and RTL, after the native wide-mode and grid preconditions.
  - It asserts that the root has no horizontal overflow, that each long span wraps to more than one line, and that header and body x and width match within 0.75.
  - It also asserts that every line box stays inside its cell and its row on both axes within 0.75. That's the vertical check the earlier focused runs lacked.
  - Both problems were proven red first:
    - Chromium failed `scrollWidth <= clientWidth` after the preconditions passed;
    - WebKit at 1280 had a line bottom of 2240.16 against a row bottom of 2234.91;
    - the unmodified baseline overflowed in 18 of 18 measurements with 72 unwrapped spans.

    The candidate has 0 misaligned, 0 overflow and 0 spilled (`restack7-fluid-control.json`). The first precondition failure was archived and isn't counted as the red result.
- **Fixed-overflow coverage got stronger, not weaker.** It keeps root scrolling and `[420, 380]`, and every row box now matches the table's scroll width within 0.75, with the selected background, solid rule and control containment.

**The rest of the combined correction still holds as reviewed in round 1**
- Preservation is intact:
  - 6,175 parent paths exact with 0 unexpected, and topic lock delta 0;
  - CodeBlock runtime and highlight.js CSS fidelity alongside Direction and the AI and Docs consumer cases;
  - the deduplicated highlight.js and SSR map dependencies.
- StatsGrid joined seams under main's roles.
- Sidebar-owned native dialog inset, collapsed accessible names and RTL containment.
- The three unchanged native-close bodies with file-level `snapshots: false`.
- The physical precondition that dismisses the double-click selection range.
- The independent native query partition.
- The inset logical rail with real pixel checks, red at 121.25, with the missing and opposite-edge negatives at a channel difference of 208 against tolerance 1.
- Selected-row labels at 80% muted / 20% foreground, the three outline fixture variants, and the README disclosure with drift recorded against #2450.

**Evidence is sufficient and honestly labelled** (`restack7-validation.json` `fluidCorrectionFinal`)
- **Fresh on frozen source and build:**
  - focused 72 and the 24 axe-bearing WebKit cases;
  - the full 765 package suite;
  - full Chromium 675 including touch;
  - Firefox/WebKit 336 across the complete data-table, stats-grid, shell and native-close files.
- All have 0 retries, 0 flaky, 0 allowances and 0 page or console errors.
- Wrappers selected 3 source, 3 fixture, 4 spec and 7 lint/format files, with 0 dropped.
- Quality, preflight, docs accuracy and export drift pass, and native publish has 0 slow types.
- The 124 doc-lint diagnostics stay attributed to #2531 with 0 new and 0 removed.
- **The package-run environment problem is disclosed correctly.** The 763/2 run inherited the browser-only library path. The restricted formatter subprocesses in the two permission controls were right to reject it. Nothing was changed: the full suite was rerun under the original environment and passed 765, and the failed log is kept.
- Every selected-surface run, every run before the row-track fix and every interrupted run is historical only.

**Authorized next steps, in order**
1. The source commit with its run context, and no AI attribution footer.
2. All four canonical committed-source carriers, with the actual generated delta inspected.
3. Quality and native publish at the actual head.
4. The same evidence review, with no push before it.
5. The approved docs-only parent and child rebase onto `6a1d84a6`, each head with its own byte comparison, gates and the same reviews.
6. The public audit and exact-lease pushes against `426c5d09…` and `d0d8d922…`, re-checking the remotes first, then the #2538 comment, referencing #2416 only.

No new feature work before the terminal restack push and comment.

Still required after that:
- **11b:** Toc, AnchorNav, RuledGrid, Hero, the Desktop audit and the original Shell Toc integration.
- **12:** the production declared x-extensions, the all-style provider and the browser harness.
- **13:** the final runtime run, the whole-phase IMPL-EVAL and green CI at the exact head.

No READY, labels, closing keywords, early promotions of the 19 future items or merge.
