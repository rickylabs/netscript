**FAIL_FIX**: Restack 7 source review on local child head `707e08db`, replayed onto parent `426c5d09` and main `f4aa307b`. The failure streak is now 1. A second consecutive terminal failure ends this leaf and goes to escalation, with no third attempt and no new evaluator.

There is one material blocker. Everything else in the 14-file correction holds; the list of what holds is below.

**Blocker: the wide table's `min-width: max-content` stops long text in fluid columns from wrapping**

- **Where:** `packages/fresh-ui/registry/components/ui/data-table.css:321-325`. In wide mode the TABLE becomes the shared grid with `min-width: max-content`.
- **Why it matters:**
  - A grid container's max-content width sizes `fr` tracks to their items' max-content contributions. Equal `1fr` columns all grow to the widest item's max-content width.
  - So the table can't get narrower than the max-content width of everything in it.
  - This defeats the default `minmax(0, 1fr)` track (`data-grid.tsx:29`) and the cells' `overflow-wrap: anywhere`.
- **Effect on consumers:** any wide DataGrid whose fluid columns hold long or rich content will scroll sideways instead of wrapping. That covers descriptions, emails, and cells like the Keyboard memo, input and link cell. Containers between 641px and roughly 1100px are the common case: dashboards beside a sidebar. Before the restack, per-row grids inside a full-width block table wrapped.
- **Why no test caught it:**
  - In wide mode the spec only checks overflow for the fixed `overflow` case, expecting it to scroll (`data-table.spec.ts:757-762`).
  - Wide cases with fluid columns never assert `scrollWidth <= clientWidth`.
  - The fixtures' fluid content is short at the measured widths.
- **Not previously approved:** the run records show `max-content` was chosen after a min-content prototype failed on fixed-overflow background coverage (`restack7-negative.json`, `minContentPrototype`). The geometry design I passed required fixed-overflow coverage, not giving up fluid wrapping, and no design review weighed this trade-off.

**Required fix, inside the existing 14-file scope** (CSS, its canonical carrier, the existing fixture and spec)

1. **Red first.**
   - Add a wide case with fluid columns only: default and `fr` tracks with long wrapping text, optionally with selection and actions.
   - Assert all of these at 641, 900 and the actual 1280 project width, in LTR and RTL:
     - the root has no horizontal overflow (`scrollWidth <= clientWidth`);
     - the long text wraps inside its track;
     - header and body cells line up within 0.75px.
   - Prove it fails on the current source in the engines where it applies.
2. **Fix the floor so only tracks that can't shrink set it.** Fluid columns must stay shrinkable while the fixed and intrinsic action tracks keep their width. `min-width: min-content` is the obvious candidate.
   - If the earlier min-content background failure comes back, diagnose that specific case: row and head background or rule coverage across overflowing fixed tracks.
   - Don't fall back to `max-content`.
   - No JS measurement, new API, token or engine branch.
3. **Keep every current assertion,** including:
   - fixed `[420, 380]` overflow scrolling, with row background and rule covering the whole track area;
   - the full status span at both fractional and integer boundaries;
   - the native-query partition, the inset-rail pixels and the negatives;
   - same-row neutrality and the selected-surface axe cases;
   - the narrow branch's assertions.
4. **Fresh gates.** This is a framework CSS change, so every completed run on `707e08db` becomes historical. Rerun:
   1. the focused cases, plus the 24 axe-bearing WebKit cases;
   2. the full 765 package suite;
   3. full Chromium and full Firefox/WebKit with the new case added, recording the new counts, 0 retries, 0 flaky and 0 allowances;
   4. wrappers with 0 dropped;
   5. quality, preflight, docs accuracy and export drift, native publish, and doc-lint attribution;
   6. this same source review.

**Everything else holds, with no other blockers**
- **The replay preserved main and the parent.** CodeBlock runtime installation and CSS fidelity sit alongside Direction and all the AI and Docs consumer cases. The browser map keeps both highlight.js and the SSR renderer. Main's Utility roles combine with the child's native disclosure and modal styles. Derived conflicts were regenerated, and 6,175 parent paths are exact with 0 unexpected differences. Topic lock delta is 0.
- **Selection:**
  - selected rows are matched by `data-state='selected'` alongside the legacy `aria-selected`, with no ARIA added to the row;
  - the logical inset rail (`data-table.css:282-289`) replaces the absolutely positioned pseudo-element that shifted cells. It was proven red at 121.25px against 0.75 first, and the missing-rail and two-edge negatives fail at the fixed tolerance of 1;
  - the contextual ink applies only to DataGrid's own labels (lines 294–297);
  - the README discloses the surface limitation (`packages/fresh-ui/README.md:145-147`), recorded in drift against open #2450;
  - the three fixture variants moved from ghost to outline.
- **StatsGrid joined selectors** (`stats-grid.css:196-204`) restore gap 0, the inline-start rules, radius 0 and the upward seam under main's roles.
- **The native-close move, the double-click precondition and the native query reference** match their approved designs.
- **Evidence is honestly labelled.** Historical, stopped and failed runs are never counted as final, and #2531 is never called green. All of it becomes historical once the fix lands.

**Next**
1. Make the CSS fix and the red-first case.
2. Run the fresh gates.
3. Return to this same source review.

Only after that: the source commit, the carriers, quality and publish at the actual head, the same evidence review, the approved latest-base addendum, and the audited exact-lease pushes against `426c5d09…` and `d0d8d922…`.

Still required after that:
- **11b:** Toc, AnchorNav, RuledGrid, Hero, the Desktop audit and the original Shell Toc integration.
- **12:** the declared x-extensions and the all-style harness.
- **13:** the final runtime run, the whole-phase IMPL-EVAL and green CI at the exact head.

No READY, labels or early promotions of the 19 future items.
