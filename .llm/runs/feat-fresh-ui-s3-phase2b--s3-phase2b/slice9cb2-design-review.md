# Independent DataTable/DataGrid design review

PASS (slice 9c-b2 design checkpoint: DataTable and DataGrid baseline audit)

The checkpoint (`.llm/runs/feat-fresh-ui-s3-phase2b--s3-phase2b/slice9cb2-checkpoint.md`) is a coherent, compatible correction inside the approved 9c-b scope, and implementation may start. It removes a `role=grid` that has no grid keyboard behavior, removes whole-button and anchor elements that carry `role=row`, and stops child Space presses from being captured. In their place it uses a static native table with independent native controls, adds no grid engine and removes no callback.

**Accepted:**
- **Surfaces kept:** the DataTable sections, `interactive`, row `cols` (with the native string and object style merge fixed) and an optional root `state`. DataGrid keeps its identity, columns, rows, `onSelect`/`href`, selected snapshots, controlled `selectedIds`/`onSelectionChange`, `renderBulkActions` and `renderRowActions`.
- **Additive changes:**
  - `header` widened to Renderable, with `headerLabel` for mobile;
  - `sort` reflected as `aria-sort`, with sorting itself owned by the host;
  - an exported four-value `DataGridState`, derived when it isn't set;
  - caller-owned `empty`/`loading` content in one spanning cell, with no invented messages.
- **Interaction model:**
  - Row activation is a real button or link in a cell, placed beside the caller's content, never wrapping it. Its stretched pseudo-element covers the row for pointer clicks, while child controls stay above it and independent.
  - Normal Tab, Enter and Space apply, with no row key handler.
  - The checkbox owns its checked and mixed state, and refusal is enforced physically.
  - Stale IDs are ignored, the unsupported `aria-selected` on static rows is dropped, and bulk actions sit in a group outside the table.
- **Card and CSS:** the DataTable frame is a native `ns-card` with the StatsGrid specificity lesson applied, so Card's contract isn't weakened. Adding DataGrid styles to the registered `data-table.css` is documented as a consumer dependency.
- **Contract:** the D5 audit covers the actual ports, qualified slots, part-scoped axes and parts, and makes the nested-root allowance explicit and limited to D5.
- **Gates:** the real Space/Enter negative test first, then native table roles and associations, pointer coverage versus independent controls, selection accept/refuse/mixed/stale, all four states composed from existing components, mobile cards with reachable header controls, RTL, narrow containers, strict axe, installed-copy fidelity, wrappers, quality, publish, no new doc diagnostics, carriers after commit and the same independent review. Under 30 files, with explicit deferrals.

**Implementation risks (advice only):**

1. **Table semantics after layout changes.** Changing `display` on `table`, `tr` or `td` (mobile cards, CSS grid tracks) drops native table semantics in some engines, notably WebKit. Add the explicit `role` values everywhere the display is overridden, and assert the accessibility tree (rows, cells, columnheaders) in the browser at 390 and 1280.
2. **The stretched hit area.**
   - Put `position: relative` on the row's actual box (the grid or display-overridden `tr`, or the cell itself). Relative positioning on a native table-layout `tr` is still unreliable in some engines.
   - Raise the checkbox, row actions and arbitrary child controls (`position: relative; z-index: 1`).
   - Test modified clicks (Ctrl/Cmd/middle click on a Fresh link opens a new tab without firing `onSelect`) and that selecting text inside a cell still works.
3. **Physically enforcing refusal.** After `onChange`, a controlled refusal must reset the native `checked` and `indeterminate` *properties*, not just the attributes. That needs a re-render or reconciliation step like RadioGroup's. Test it in the browser for a row checkbox and for select-all.
4. **Public package type changes.** `DataGrid` is a published runtime export, so `header: string → Renderable` widens a type that consumers might read as a string. The DOM moves from `role=grid` to a native table. Record both as compatibility notes in the README or CHANGELOG, and make sure the new `DataGridState` and props have full JSDoc and add no doc-lint diagnostics.
5. **Styling dependency.** Using DataGrid from the package without installing the `data-table` registry item leaves it unstyled, which is true today as well. Say so explicitly in the DataGrid README section, and prove the real installed frame and carrier as planned.
6. **Activation label.** `Open row <id>` is an English fallback. Show `label` in the README example, and test that a custom label becomes the activation's accessible name.
