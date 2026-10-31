PASS

The two-thumb Slider pointer trap is fixed, and I found no new blockers in the correction.

- **The fix in `slider.tsx`:** when the two thumbs sit on the same value in the upper half of the range, the lower thumb is stacked on top. Otherwise, including when they meet at or below the midpoint, the upper thumb stays on top. This is done with an inline `z-index` derived from the values. There's no new prop, token, contract attribute or custom drag handling; native range input still handles dragging, keyboard and form values.
- **The regression test (`slider/pointer-range-escapes-both-endpoints`) uses real mouse drags at the actual thumb positions:**
  - At the top end it stacks both thumbs at 100, drags the lower one left and checks it drops below 100 while the upper stays at 100.
  - After a reload it does the same at 0: the upper thumb is dragged right and leaves 0 while the lower stays at 0.
  - You report it failed against the old source and passes now, which is the right failing-then-passing evidence. I couldn't see the final focused 121-case run, so its result still needs to land in the slice evidence.
- **Invalid-state relationships:**
  - RadioGroup now puts `aria-invalid` and the caller's `aria-describedby` on every native radio.
  - InputGroup's JSDoc and its contract note in both `forms/3.ts` and `contracts.json` say callers must put `aria-invalid`/`aria-describedby` on the control itself.
  - The fixture renders both invalid examples, `forms/invalid-relationships` checks the attributes, and the strict axe pass now covers those examples.
- Controlled radio, OTP and slider behaviour, the parts and the props are unchanged from what I passed earlier.

Non-blocking:

1. RadioGroup still spreads `aria-describedby` and `aria-invalid` onto the `fieldset` as well as each radio, so some screen readers may read the error twice. Consider dropping them from the `fieldset` once each radio carries them.
2. The RadioGroup contract notes could repeat the per-radio invalid/describedby rule, as InputGroup's now does.