# Independent supporting9c0 source review

PASS (supporting slice 9c0 source review: native modal Escape ownership in Dialog and Sheet)

The uncommitted source implements the round-2 checkpoint exactly, with no new engine, API or Escape clone. It can be committed.

- **Escape handling** (`src/runtime/dialog/use-dialog.ts:88-96` and `src/runtime/sheet/use-sheet.ts:96-104`, identical):
  - A non-cancelable `cancel` returns immediately, so the platform close stands and only the later `close` event reports `native-close`. The false `escape-key` report is gone.
  - A cancelable `cancel` calls `preventDefault()` and then proposes `false` with `escape-key` only when `closeOnEscape` allows it. With `closeOnEscape={false}` the native close is still blocked.
  - The consumer's `onCancel` runs first through `composeEventHandlers`, so a veto still wins. The copied DatePicker, AlertDialog and CommandPalette handlers keep working: their `preventDefault()` simply has no effect on the platform-forced close.
- **Sync** (`src/runtime/_internal/native-dialog.ts:93-118`):
  - The layout effect has no dependency list, so it checks the dialog on every render. `syncNativeDialog` only acts when the element's real `open` and modal state disagree with the requested state.
  - So a parent that keeps `open={true}` after a forced close gets a real reopen on its next render, and nothing in a close handler re-shows the dialog or schedules a render on its own.
  - Attachment still uses the element's identity, with the unused value dropped from the tuple, so attaching new content triggers a sync without a re-attach loop.
  - The existing `onClose` → `native-close` path and stale-close guard (`isNativeDialogClosed`) are unchanged.
- **Proof:**
  - The real negatives were captured before any production edit: the first Escape refusal physically closed the dialog; the forced double Escape gave `[true, false]` with exactly one close, previously wrongly labelled `escape-key`; and ParentRefresh failed to reopen.
  - The 32 new browser cases (Dialog and Sheet × 4 tests × 4 projects) cover refusal through Escape and the Close button, accepted close with focus return, uncontrolled behavior, `closeOnEscape={false}`, the consumer veto, a real adjacent double Escape with no evaluations in between, and an unchanged-prop reopen with focus inside.
  - The known order of close reports is pinned exactly.
  - All 117 related browser cases pass, including calendar/date-picker, CommandPalette, overlays and touch, with zero serious or critical axe findings. The 42 runtime and 357 adapter and contract tests also pass.
- **Docs:** the README and the Dialog/Sheet catalog notes explain that `native-close` can't be refused, with no new prop, enum or public symbol.
- **Gates:** scoped wrappers, quality/architecture, preflight, docs accuracy, export drift and the native publish dry-run all pass. The publication audit keeps the inherited 124-diagnostic failure under #2531 visible: 123 matching diagnostics, 0 new, 0 removed. Inventory stays 104/91/13/119, with no token, dependency, lock or schema change.

Next, commit the source, run all four carrier checks afterwards, and then do the evidence review and privacy audit before the push and PR comment. The shell family (9c-a) stays research-only until its own design checkpoint passes.
