# Independent slice9b source review

PASS (slice 9b source review: Resizable)

I found no blockers in the current uncommitted source, assuming the in-flight wrapper and consumer reruns finish green on these exact bytes.

- **Validation** (`packages/fresh-ui/registry/components/ui/resizable.tsx:79-98`):
  - The label and end label must be non-blank.
  - Sizes must be finite and non-negative, and `maxSize` must be finite or `Infinity` and at least `minSize`.
  - `step` must be positive and finite.
  - The L10 contract describes `maxSize` as unbounded and has no `Infinity` default (`layout-blocks/4.ts:136-139`), so the JSON round-trip stays lossless.
- **Bounds** (lines 104-113):
  - Available space is the measured extent minus the computed gap.
  - The end panel is guaranteed `min(endMinSize, available/2)`, the maximum and minimum adapt for tiny containers, and the displayed size is clamped into those bounds.
  - When the container resizes, only the displayed size is clamped. `onSizeChange` isn't called and the requested size is kept, so it comes back when space returns.
- **Hydration and ARIA** (lines 187-202):
  - Before measurement the handle is decorative: `aria-hidden="true"` as an explicit string, no role or values, `tabIndex=-1`.
  - After measurement it becomes a focusable `separator` whose orientation is the inverse of the panels, with `aria-controls` pointing at the primary panel and a label or labelledby matching that panel group. It reports percentage min/max/now and a pixel `aria-valuetext`.
  - Both panels are named groups that can be tabbed to, so text-only panels can be scrolled from the keyboard. I accept this as a fix that axe drove.
- **Keyboard** (lines 203-219): it ignores modifier keys and events from children. Arrow keys follow the visual direction (in RTL, Left grows the start panel; Down grows it vertically), Home/End go to the current bounds, and there's no collapse mode, as documented.
- **Pointer:**
  - Capture is per pointer ID, from a snapshot of the displayed size and coordinate, with the sign flipped in RTL.
  - Up, cancel and lost capture each end only their own gesture.
  - The CSS sets `touch-action: none` and `user-select: none` on the handle.
- **Lifetimes** (lines 116-145):
  - The ResizeObserver is disconnected on cleanup and when the direction changes, and only this handle's active capture is released.
  - A zero extent clears its own capture.
- **Controlled behavior:** `propose` sends bounded proposals and only updates local state when uncontrolled, so a parent refusal keeps the visible size.
- **Strict contract:** the root carries only `data-direction`, and the start size goes through an inline custom property. No `data-state`, `data-dragging` or private attributes.
- **Icon:** `grip-vertical` uses the real Lucide geometry (six radius-1 circles at x 9/15, y 5/12/19, as closed arc paths, `primitives.tsx:86-93`) under the existing notice, and it's listed in the Z1 icon enum.
- **Registry and inventory:** 104 total, 91 shipped, 13 remaining, 119 native items. The item declares the root runtime dependency for its `primitives` import. No token, dependency, lock or schema change.
- **Publication:** `slice9b-publication-audit.json` keeps the inherited 124-diagnostic doc-lint failure (debt #2531) visible: 123 matching diagnostics with 0 new and 0 removed, and 0 for the `primitives` entry point.

**Before the source commit:**
- The 9b source wrappers (check, lint, format) and the 18-test installed-consumer rerun must finish green on the final bytes.
- The browser refresh is already reported at 21/0 with zero axe findings. The `scrollIntoView` before each real `pointerdown` is a legitimate positioning step, not a weakened assertion.
- Then commit the source and run all four carrier checks afterwards, with no READY claim.
