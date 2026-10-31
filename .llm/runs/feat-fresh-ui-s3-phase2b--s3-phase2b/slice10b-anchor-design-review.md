# Independent native anchoring refinement review

PASS (slice 10b native scroll-anchoring refinement)

The refinement correctly fixes the measured WebKit race without dropping native scroll anchoring or adding a global engine. You may implement it.

- **The finding** (from the real probe): with the reader pinned, an append grew the content by 111 px, but native anchoring moved the scroll position by −51 px in a single native `scroll` event. The current `onScroll` treated that as the reader leaving the end and unpinned *before* the observer's follow could run.
- **The fix:**
  - Cache the last scroll and client heights locally.
  - A native scroll that arrives while pinned, with changed geometry and no reader intent, keeps the pin for the pending frame, and the observer's follow completes.
  - Reader intent is a one-measurement flag set only by viewport-scoped `wheel`, `pointerdown`, `touchstart` and scrolling-key `keydown`. It never calls `preventDefault()` or synthesizes events, and it's cleaned up.
  - Setting it always schedules a frame, so an input that doesn't actually scroll can't leave the flag stuck.
  - A frame with intent suppresses the follow and derives the real pin. A scroll caused only by geometry keeps the previous pin. An ordinary scroll with unchanged geometry unpins as before.
  - Native anchoring, the existing latest button and its focus behavior are all kept, with no new API, keymap, animation or pointer manager.
- **Classification looks right:**
  - Screen-reader or virtual-cursor scrolling, Tab focus scrolling, find-in-page and host-programmatic scrolling all happen without growth, so they unpin normally.
  - Real reader input during growth is honored.
  - Scrollbar thumb clicks or drags arrive as `pointerdown` on the scroll container.

**Advice, not blockers:**

1. **A possible simpler path, to evaluate.** Setting `overflow-anchor: none` on the viewport *only while pinned* (as an inline style or class, not an undeclared `data-*`) would stop the browser's adjustment exactly when the component does its own follow, while keeping native anchoring for unpinned readers.
   - It's platform-only and might make the input-intent flag unnecessary.
   - Support for `overflow-anchor` varies across engines, though, so if you adopt it, keep your intent logic as the fallback, or prove it works in WebKit and Firefox before relying on it alone.
2. **Race tests in all three engines:**
   - growth while pinned with no input stays pinned;
   - reader wheel, touch or key input during growth unpins and isn't pulled back;
   - inert input (a wheel at the boundary that doesn't scroll) leaves no stuck intent;
   - growth while unpinned keeps the reader's position through native anchoring;
   - a scrollbar drag;
   - cleanup removes all four viewport listeners and cancels any pending frame.
3. **Keydown from child controls.** A `keydown` bubbling from a child control (for example arrow keys in an input inside a message) sets intent for one measurement. That's harmless, but include it in one test.
