PASS (corrective Overlay review only, not the final phase IMPL-EVAL)

The touch blocker is fixed, and I found no regressions in the reviewed overlay sources.

- **Tapping now works.** In `registry/components/ui/hover-card.tsx`:
  - `onPointerEnter`/`onPointerLeave` ignore anything that isn't a mouse (lines 71-84), so a touch tap no longer opens the card before the click.
  - The trigger's `onPointerDown` records the press, and the trigger's `onFocus` won't open the card while that press is active (lines 123-135). That stops focus from opening it separately.
  - The trigger's `onClick` clears the press before the runtime click handler toggles from the real state.
  - `onPointerCancel` and a focus exit from the root also reset the press, so a stale press can't block a later keyboard focus.
  - **Result:** a tap opens a closed card and keeps it open, and a second tap closes it. Keyboard focus still opens it. Escape and the `blocked` guard against reopening are unchanged.
- **Mouse behavior is decided and recorded.** Hovering opens the card, a click on the already-open trigger closes it, and the next click opens it again. The contract notes record this (`overlays/3.ts:158`).
- **Tests:**
  - **Touch:** a new `touch-light-390` project (`hasTouch: true`) runs only the cases tagged `@touch` in `overlays.spec.ts`; the other four projects skip them. The touch case:
    - taps the trigger;
    - waits past the close delay;
    - taps the link inside (navigation happens, the card stays open);
    - taps the trigger again and checks the card closes.

    You report it failed against the old source.
  - **Mouse:** `hover-card/mouse-click-after-hover-closes` covers hover → click → click.
- **AlertDialog hover contrast:** the override in `alert-dialog.css:18` now also covers `:hover`. The global Button's destructive rules sit inside `:where(.ns-btn)…`, so the component's base and `:hover` rules win in every state, including `:active`, and the white-on-destructive pair that fails AA never comes back.
- **Popover `focusOnOpen`** still defaults to `true` (`use-popover.ts:39, 86-92`). Only HoverCard passes `false`.
- AlertDialog and ContextMenu behavior and their tests are unchanged from the first Overlay review.

These conclusions cover the saved snapshot. You're restoring that source into the worktree and rerunning the gates before commit, and the restored files need to match it byte-for-byte.
