FAIL_FIX

**Blocker: tapping the HoverCard trigger on a touch screen opens the preview and immediately closes it again, so touch users can never see it.**

- **Where:** `packages/fresh-ui/registry/components/ui/hover-card.tsx`:
  - `onPointerEnter` (lines 70-73) opens the card for every kind of pointer.
  - The trigger's `onFocus` (lines 118-121) opens it too.
  - The runtime trigger click then toggles from the already-open state: `use-popover.ts` `getTriggerProps` calls `setOpen(!open, 'trigger')`.
- **What happens on a tap:** the browser fires `pointerenter` (card opens), then focus on the tap (still open), then `click`. The click sees `open === true`, so `setOpen(false)` closes the card. HoverCard's `onOpenChange` also sets `blocked = true`. After the touch `pointerleave`, the next tap repeats the same cycle.
- **Why it's a blocker:**
  - The contract and the plan describe the trigger as a native button disclosure (hover, focus *or* activation). On touch, activation is the only way to open it, and it never leaves the card open.
  - Any content inside the card, such as the "View team" link, is unreachable on touch.
  - With a mouse the same order means clicking a card that hovering already opened closes it.
  - The browser spec only uses `focus()`, the keyboard and `hover()` (`gap-tests/overlays.spec.ts:79-112`). It never clicks or taps the trigger, so this isn't covered.
- **Required fix:**
  - Make a pointer activation toggle from the state before that interaction began:
    - Ignore `onPointerEnter` when `event.pointerType !== 'mouse'` (touch and pen have no hover to preview).
    - Don't let the focus caused by a pointer press (track `pointerdown` on the trigger) count as a separate open request.
    - So a tap opens a closed card and a second tap closes it.
  - For mouse, decide whether clicking after hovering pins the card open or closes it, and record that choice in the contract notes.
  - Add browser cases:
    - A touch project (`hasTouch: true`, `trigger.tap()`): the card becomes visible and stays visible, and a second tap closes it.
    - A mouse `hover()` then `click()` on the trigger, asserting the behavior you chose.
  - Rerun the overlays projects.

Everything else holds up:

- **AlertDialog:**
  - It's built on the public native `Dialog`, with `role=alertdialog`, `closeOnInteractOutside={false}` and no close icon.
  - Cancel is the native `autofocus` target.
  - Escape blocks the native close, calls `onCancel` and sends a close request. Cancel and the action both call their own callbacks and then request close, so a controlled parent can refuse.
  - `pending` uses the button's own loading state.
  - The scoped override that swaps the existing destructive text and card colours on the destructive action is recorded in `drift.md` and changes no token values.
- **Popover `focusOnOpen`:** an opt-in option that defaults to `true` (`use-popover.ts:39,86-92`), so existing Popover and ActionMenu users keep their behavior.
- **ContextMenu:**
  - The region is a focusable native group that opens on `contextmenu`, Shift+F10 or the ContextMenu key.
  - The menu sits at a fixed client point, clamped to the viewport in a parent layout effect that runs after the child has shown the popover.
  - Escape, an action or Tab returns focus to the region. Outside light dismiss goes through `onToggle` without moving focus.
  - It reuses `MenuItems`/`ActionMenu` with no new listener or positioning engine.
- **Registry:**
  - `alert-dialog` depends on `button`.
  - `hover-card` depends on `avatar` and `floating-styles`.
  - `context-menu` depends on `menu-items` and `floating-styles`.
  - All three are reachable.

Non-blocking:

1. The AlertDialog's destructive action override sets only the resting colours. If the global Button's destructive `:hover` rule comes later in the cascade, hovering may bring back the failing white-on-destructive pair. Add a matching `:hover` rule, or confirm the order.
2. HoverCard content uses `popover="auto"`, so opening a preview closes any other open auto popover, such as an open ActionMenu. That's acceptable for now; a non-auto hint popover is the long-term fit.
