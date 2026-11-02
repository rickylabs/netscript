PASS

The range-middle blocker is fixed, and I found no new blockers in the correction.

- **Range states:**
  - In `calendar.tsx:339-345`, `data-state='selected'` is now set only for the actual endpoints. Middle days get `rest`, `today` or `disabled`, and `data-range='middle'` (line 346) carries the range.
  - Middle cells still have `aria-selected="true"` (lines 317-319 and 330), and range grids declare `aria-multiselectable` (line 280).
  - With that, `calendar.css:11` gives middle days `--ns-selected` with radius 0. They also pick up the normal hover rule (line 14) again, which matches F13 and the Utility review.
- **Regression proof:** `calendar.spec.ts:76-91` checks the computed background in every light and dark project. The middle day must equal the resolved `--ns-selected` and must differ from the endpoint. You report that this check failed against the old source.
- **Controlled open/close:**
  - The DatePicker's `onCancel` (`date-picker.tsx:105-109`) blocks the native close before the runtime's own handler runs (`use-dialog.ts:88-98`), then sends a close request.
  - If the parent refuses, the dialog stays `:modal`. `changeOpen` (lines 61-65) drops requests that don't change anything.
  - `date-picker/controlled-refusal` refuses Escape, a date choice and Cancel, and checks `:modal`, the requested values and that the controlled selected day doesn't change.
- **Reopening:**
  - The `Calendar` is keyed by open state (line 123) and opens on `selected[0] ?? defaultMonth` (line 127), so each opening remounts on the selected month.
  - The spec covers the full browse → cancel → reopen cycle: focus goes to 2024-02-29, PageDown to 03-29, Escape returns focus to the trigger, and reopening focuses 02-29 again (lines 135-143).
- The modal boundary handling, submitting through the hidden input, and the range-picker axe/close flow are unchanged from what I reviewed before and still hold.

Non-blocking:

1. In Chromium, if the user presses Escape twice with no click or key in between, the browser may close the dialog anyway, even though `cancel` was blocked. The runtime's `onClose` then reports a close the parent can refuse, leaving the native dialog closed while `isOpen` is still `true`. This only matters if a parent refuses to close, which is rare. Consider re-opening with `showModal()` when the dialog is closed natively while `open` is still true, or document the limitation.
