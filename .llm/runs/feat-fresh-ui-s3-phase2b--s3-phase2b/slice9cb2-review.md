# Independent DataTable/DataGrid source review

PASS (slice 9c-b2 source review: DataTable and DataGrid baseline audit)

The uncommitted DataTable/DataGrid unit implements all three reviewed checkpoints with safe native event handling. I found no blockers.

- **Native structure:** a real table with explicit `role` values next to the display overrides (`columnheader`, `cell`, `row`). The first cell carries a real sibling button or link for activation and never wraps the caller's renderer (`packages/fresh-ui/src/presentation/data-grid.tsx:276-310, 370+`). Zero-column rows still get a real activation cell, and there's no row key manager or ARIA grid.
- **Pointer delegation** (`activateRowFromPointer`, lines 335-368):
  - It only acts on a trusted, not-yet-prevented primary `click`.
  - Shift, Alt, and Ctrl+Meta together are rejected.
  - It ignores targets outside its own `tr` (nested tables) and any independent control (`ROW_CONTROL_SELECTOR`).
  - It skips while a text selection exists inside this row.
  - It focuses the activation only for an unmodified click.
  - **Ctrl/Meta on an owned anchor:** it temporarily sets `target="_blank"`, calls the real `.click()`, and restores the exact original value in a `finally`, removing the attribute if there was none.
  - **Everything else:** it dispatches a copied click. That click is untrusted, so the row handler ignores it when it bubbles back, which rules out recursion.
  - Stopping the original's propagation after a successful forward gives observers exactly one activation.
- **Selection** (lines 216-275):
  - The controlled checkbox resets its native `checked` and `indeterminate` *properties* before reporting the change, so a refusal holds physically.
  - Select-all derives its mixed state from the visible selection, stale IDs are ignored, and there's no internal selection state.
  - Static rows keep the visual `data-state` without `aria-selected`.
- **API:** every old callback and data prop is kept. `header` is now Renderable, with `headerLabel` (mobile labels are `aria-hidden` text, so controls aren't duplicated) and `aria-sort` from the host-owned `sort`. `DataGridState` gets derived defaults and host-owned empty/loading content. The DataTable frame owns its `state` with a merged style. D5 and the JSON contract are scoped, and the README and reference correct the old DOM claims.
- **Dependencies:** a static DataTable install correctly gets no root package mapping, which the two-way closure test proves. The README tells DataGrid users to add the package.
- **Evidence** (`slice9cb2-validation.json`):
  - 76 Chromium cases with zero serious or critical axe findings, allowances or errors.
  - 44 focused Firefox and WebKit cases, explicitly not full certification.
  - Two real `ui:add` Fresh production cases: new tabs with all three `target` values, the parent URL kept, one observer event, and plain-click partial navigation.
  - 399 contract and API tests, 10 installed, unit and closure tests, and 14 catalog tests.
  - Scoped wrappers, quality/architecture, preflight, docs accuracy, export drift, the docs prose build and native publish all pass. The 124 doc-lint failure stays explicit under #2531.

**Non-blocking:**

1. **Redundant `aria-checked`.** The native checkbox sets both `indeterminate` and `aria-checked` (lines 239-241). Native `indeterminate` already exposes "mixed", and ARIA-in-HTML discourages `aria-checked` on `input[type=checkbox]`. Consider dropping it so the two can't disagree.
2. **Unneeded `stopPropagation`.** The selection cell (line 243) and the actions cell (line 317) stop every click from propagating. The row handler already ignores clicks from controls, so these calls aren't needed, and they hide clicks from consumer handlers delegated on ancestors. Consider removing them, or document it if they're kept for compatibility.
3. **Ctrl/Meta on button rows.** A modified click on a row driven by `onSelect` is forwarded as an ordinary button activation, which is reasonable. Say so in the README next to the link-row new-tab behavior.

Before the source commit, the canonical asset generation must finish. Then run all four carriers after the commit, refresh quality and native publish, and do the evidence review, privacy audit, push and comment before AI slice 10a. 104/91/13/120. The full goal stays active, and the final runtime and CI are unproven. No READY.

## Non-blocking compatibility decisions

Retain serialized aria-checked and selection/action-cell click isolation from the existing public surface. Native checked/indeterminate properties remain authoritative and are reconciled before proposals; compatibility attributes update with the same accepted render. Descendant control isolation and these preserved propagation boundaries are documented. Control/Meta body clicks on callback rows remain ordinary button activation; link rows use native new-tab activation. No runtime source changes follow this PASS.
