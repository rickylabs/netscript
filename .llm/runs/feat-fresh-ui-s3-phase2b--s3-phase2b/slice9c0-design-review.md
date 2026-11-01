# Independent native modal checkpoint review

PASS (supporting slice 9c0 checkpoint, round 2: native Dialog and Sheet Escape ownership)

The corrected checkpoint (`.llm/runs/feat-fresh-ui-s3-phase2b--s3-phase2b/slice9c0-checkpoint.md`) handles the platform-forced close I flagged in round 1. The proposed implementation meets the requirement without adding a separate close counter. Implementation may start inside the declared write boundary.

- **Reproduced, not assumed:**
  - Real back-to-back Escapes produced `cancelable` values of `[true, false]`, a physical close and exactly one `native-close`. They also showed that the current code wrongly reports `escape-key` for the forced close.
  - Your earlier reading of `[true, true]` came from Playwright evaluations running with a user gesture. You fixed the test protocol rather than weakening the assertions.
- **Escape handling:**
  - When the event is cancelable, `preventDefault()` runs, and a close is proposed only if `closeOnEscape` allows it. A consumer `onCancel` veto still wins through `composeEventHandlers`.
  - When it isn't cancelable, the handler returns and the platform closes. Only `native-close` is reported, and no handler calls `showModal()` or schedules a controlled re-render. That respects the browser's anti-trap rule.
- **Reconciliation without a counter:** running `useNativeDialogSync`'s layout effect on every render works because `syncNativeDialog` already checks the element's actual `open` state and whether it's modal, and does nothing when they're already right (`src/runtime/_internal/native-dialog.ts:24-82`).
  - The native DOM is the source of truth.
  - A parent that leaves `open === true` gets the dialog reopened on its next render, which is the "no stuck desync" behavior I required.
  - Uncontrolled state still follows the close.
  - Keeping identity-based attachment state avoids re-attach loops.
- **Scope:** Dialog and Sheet share the synchronizer (`src/runtime/dialog/use-dialog.ts:54, 88`; `src/runtime/sheet/use-sheet.ts:61, 96`), so the checkpoint correctly covers both hooks with the same guard and real browser test fixtures. There's no new API, prop, key mapping, observer or layout change, and the slice stays under 30 files.

**Advice, not blockers:**

1. **Document the reopen behavior.** A parent that silently refuses `native-close` will see the dialog reappear on its *next* render, for whatever reason that render happens. Recommend in the README that controlled parents accept `false` for `native-close` unless they want that reopen.
2. **Test the reopen.** The new "ParentRefresh" negative should check that an unrelated parent re-render, with `open` unchanged, reopens the dialog *and* that focus moves into the dialog correctly.
3. **Duplicate close reports (known, unchanged).** An accepted `escape-key` close is still followed by a `native-close` report from the queued `close` event. You've kept callback de-duplication out of scope, so assert the exact order in the fixture so the behavior is at least pinned. Consumers like CommandPalette already ignore the second report.
4. **Keep using real key presses with no evaluations in between** for the back-to-back Escape cases, and record that protocol note in the public counts so later slices don't reintroduce the `[true, true]` artifact.
