# Independent row-pointer refinement review

PASS (slice 9c-b2 pointer refinement design)

The proposed refinement fixes the measured text-selection failure without giving up native semantics. It's a sound, minimal approach, and you may write the helper.

**Why it holds up:**
- Turning off pointer events on the stretched `::after` removes the overlay that ate the drag-selection, and it keeps the focus outline. The real browser text-drag failure you recorded (`table9cb2-initial-browser.log`) is exactly the right negative test to drive this.
- **Keyboard stays fully native:** the real button or link in the first cell does activation, with no row key handler, global bus, listener or state engine. Pointer activation is a row-local `onClick`/`onAuxClick` that only forwards to that same native element.
- **The forwarding is correctly guarded:**
  - it skips events whose default was already prevented;
  - it skips events from independent controls (links, buttons, form fields, `summary`, `label`, tabindex and contenteditable elements, and common interactive roles);
  - it skips events whose nearest `tr` isn't this row, which handles nested tables;
  - it skips clicks while a non-collapsed text selection exists inside this row.
- Dispatching a click with the copied `MouseEvent` init on the *real* anchor or button keeps Fresh's anchor navigation and the default href behavior. Because it happens inside a trusted user click, it carries transient user activation, so modified-click new tabs aren't treated as popups.

**Implementation requirements and advice (not blockers):**

1. **No recursion.** The forwarded click bubbles back up to the row. Make sure the native activation element itself always matches the independent-control filter, or check `event.target === activation`, so the row handler ignores its own forwarded event. Add a unit or browser test proving one click gives exactly one `onSelect` or navigation.
2. **Trusted input and correct buttons only.**
   - Forward only when `event.isTrusted`, so a consumer's or framework's synthetic clicks aren't re-dispatched.
   - Use `click` only for `button === 0`. Use `auxclick` only for `button === 1`. Never forward right-click (`button === 2`, which also fires `auxclick` in Chromium).
   - Don't `preventDefault()` the original event.
3. **Prove middle-click, or drop it.** Forward `auxclick` as a middle click only if a real browser test shows a new tab opening (for example Playwright's `context.waitForEvent('page')` on a middle click in the row body). Otherwise don't forward `auxclick` at all, and document that middle-click works directly on the activation link. Prove Ctrl/Cmd-click the same way.
4. **Focus.** `focus({ preventScroll: true })` on the activation before dispatching is fine. Don't move focus when the click came from inside an independent control.
5. **Selection edge cases.**
   - A double click selects a word, so the second click must not activate.
   - A selection elsewhere on the page must not block activation of this row, since you scope it to this row's own range.
   - Clicking inside an existing in-row selection that then collapses should be tested once.
6. **Tests to update.** Rewrite the old DOM-shape unit tests around the preserved caller behavior and the corrected native semantics, not around the old `role=grid` structure. Keep the reproduced child Space/Enter negative in the record.
7. **Simpler fallback, if one is needed.** If forwarding to anchors turns out unreliable in a particular engine, keep the forwarding for button rows and, for link rows, only make the link's own text and row cells without independent controls clickable. Don't build a custom navigation path.
