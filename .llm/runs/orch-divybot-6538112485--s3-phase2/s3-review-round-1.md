FAIL_FIX

**Blocker: pointer users can get stuck with the two-thumb Slider.**

- **Where:**
  - `registry/components/ui/slider.tsx` renders the two thumbs as two native range inputs on top of each other (`inset: 0`). Neither input has a `z-index`, so the second one (the upper thumb) always sits on top.
  - With two thumbs, `slider.css` turns off pointer events on the inputs and only the thumbs themselves take pointer input.
  - The upper thumb can't go below the lower thumb (`next[index] = Math.max(points[0], …)`).
- **How it breaks:** a pointer user drags the lower thumb all the way to `max` while the upper thumb is already there. Now both thumbs sit at the same spot and the upper one is on top. Dragging it left gets clamped straight back to `max`, and the lower thumb underneath can't be grabbed. Neither thumb can be moved with a mouse or touch; only Tab plus arrow keys still work.
- **Why the tests miss it:** the browser suite only uses the keyboard (`End`/`Home` on each thumb), so this never comes up.
- **Required fix:**
  - When the thumbs meet at the upper end (for example `points[0] === points[1]` and the value is in the upper half, or simply `points[0] === max`), put the lower thumb on top, e.g. with a root data attribute plus a CSS `z-index` rule.
  - Add a real pointer test with `page.mouse`, not keyboard presses: drag the lower thumb to `max`, then drag a thumb back left and check the values separate. Do the same where the thumbs meet at `min`.
  - Rerun the forms browser suite against the rebuilt bundle.

Everything else holds up for this slice:

- **RadioGroup:**
  - These are native radios with a shared `name`, inside a `fieldset`/`legend`, so arrow keys, disabled skipping, `required` and `FormData` all come from the browser.
  - In controlled mode, the forced re-render puts back the controlled `checked` state while still reporting the requested value. The browser test checks this.
  - The `:checked` + indicator CSS follows the DOM, not React state.
- **InputGroup:**
  - It adds no key handling of its own. The child control and add-on keep their DOM and tab order, and the disabled `fieldset` disables everything inside.
  - There's a focus ring on the whole group via `:focus-within`.
- **InputOTP:**
  - It's one real text input with `one-time-code`, `numeric` input mode, `maxLength` and `pattern`.
  - The visible slots are `aria-hidden` copies of the input.
  - Paste keeps only the digits and replaces the native selection.
  - In controlled mode, typed and pasted text is pushed back to the controlled value. Tests check controlled mode, paste via the real clipboard, Backspace/Delete editing and form submission.
- **Slider, apart from the blocker:**
  - Native range inputs handle arrow keys, `step`, `Home`/`End` and the `disabled` state. Thumbs are clamped so they can't cross, and controlled values are re-applied.
  - Bad `min`/`max`/`step` values throw.
  - The vertical slider uses `writing-mode`.
  - Mapping the `value` prop to "show the value label" is documented in the contract notes.
- **Contracts, CSS and tests:**
  - Contracts match the TSX parts and attributes, and the notes cover the native transient states and the island requirement.
  - Every `--ns-*` variable the new CSS uses exists. No token values or dependencies changed.

Non-blocking:

1. RadioGroup and InputGroup put `aria-invalid` on the `fieldset`, which screen readers don't reliably announce. Tie the error message to the group (e.g. `aria-describedby`) or to the editable control itself, and add an invalid case to the axe pass.
2. When both thumbs sit together mid-track, the top thumb can only be dragged upward until they separate. The stacking fix above should also cover this.