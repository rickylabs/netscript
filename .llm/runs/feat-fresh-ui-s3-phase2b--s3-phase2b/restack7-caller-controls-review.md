**PASS**: the bounded caller-control contrast batch and its evidence plan are approved. I found no blockers, and the failure streak stays at 0.

**Why it holds**
- **The failure is fixture paint, confirmed in source.** Each failing control is a bare `<button>` that takes the native widget paint in dark-scheme WebKit, white on #c0c0c0 at 1.81:1:
  - DataGrid: the Keyboard `Cell action` and `Row action` (`gap-data-table-fixture.tsx:45-47, 78`). Rendered per row, they're the four failing instances.
  - Stats: `Before metrics`, `Inspect metrics` and `After metrics` (`gap-stats-grid-fixture.tsx:104, 110-115, 124`).
  - Dynamic Shell: `Workspace settings`, `Account` and `Send` (`gap-shell-fixture.tsx:120, 131, 151`).

  Layout components don't paint arbitrary caller children. That's the right contract, so no framework change is justified.
- **The shipped `Button` keeps every semantic the tests depend on.**
  - It spreads the remaining props onto a native `<button>` and defaults `type='button'`, also accepting `submit` (`button.tsx:169-197`). So `onClick`, `data-before-stats` and `data-after-stats`, the labels and `Send`'s `type='submit'` all carry over.
  - Its children sit inside a `span`. DataGrid's row guard uses `closest(ROW_CONTROL_SELECTOR)` (`data-grid.tsx:341-344`), so clicks on that inner span still count as control clicks, and the caller-control stacking rule still matches `button`.
  - I checked the affected specs. No locator uses a bare `[data-part='root']` or `[data-part='label']` that the Button's own markers could now match. Stats' inert loop only targets the sparkline, ticks and blockbars parts (`stats-grid.spec.ts:27-30`).
- **Leaving the rest bare is consistent with the strict axe scopes, not an exclusion.**
  - The axe scopes are `#data-table-examples` (`data-table.spec.ts:295`), `#table-track-examples` (line 679), `#stats-examples` (`stats-grid.spec.ts:181`) and `#shell-example` with its open modal dialog (`shell.spec.ts:77, 147, 195`).
  - The shell host-driver controls are a sibling outside `#shell-example`. `StaticShell` is `#static-shell`.
  - The decorative Stats controls are `inert`, and the inert-and-hidden assertions remain.
  - `Sort orders` already uses `ns-btn` roles. The message input showed no failure.

**Conditions you must meet**
1. **Change exactly these call sites to `<Button variant='ghost' size='sm'>`:** the two DataGrid expressions, the three Stats ones and the three dynamic Shell ones. Keep the same text, handlers, `type`, `data-*` markers and position.
   - Record a mechanical diff limited to those sites across the three fixture files.
   - Leave untouched the host drivers, `StaticShell`, the inert controls, the message input and every axe `include`.
2. **Every assertion stays unchanged:**
   - Tab order through `data-before-stats`, `Inspect metrics`, the link and `data-after-stats`;
   - Enter and Space counts;
   - DataGrid's row-action, cell-action, rows-opened and observed-click counts;
   - Shell focus, inert and modal assertions;
   - geometry and selection.
3. **Audit before the full runs.** Run every axe-bearing test in the targeted set in WebKit across all four projects, light and dark at 390 and 1280, before the full matrices. That's the DataGrid states, including selection, bulk, loading and empty, Stats, and Shell closed, modal and chat. Report the counts.
   - If the ghost `Button` fails anywhere, stop. It becomes a separate Button framework review. Don't add fixture CSS or an allowance.
4. **Frozen-source finals.**
   1. Rebuild canonically.
   2. Run fixture and spec check, lint and format, 0 dropped.
   3. Run the fresh full 667 Chromium and the full targeted Firefox/WebKit 320 on the same frozen bytes, each to a terminal result with 0 retries and 0 flaky.

   Archive the 251/1/68 cross run and the interrupted Chromium run (exit 130) publicly as failed or stopped, never green. The earlier focused 36 stays historical proof for its own scope only. The 765 package proof stays valid because framework bytes are unchanged.

**Next**
1. Edit the three fixture files.
2. Run the WebKit axe audit, then the full 667 and 320, plus the wrappers.
3. Come back to me for the same source and evidence reviews.
4. Commit, run all four carriers and the quality/publish refresh at the actual head, then the public audit.
5. Force-push the child with an exact lease against `d0d8d922…` and update #2538.

Still required after that:
- **11b:** Toc, AnchorNav, RuledGrid, Hero, the Desktop audit and the original Shell Toc integration.
- **12:** the declared x-extensions and the all-style harness.
- **13:** the final runtime run, the whole-phase IMPL-EVAL and green CI at the exact head.

No READY, labels or early promotions of the 19 future items.
