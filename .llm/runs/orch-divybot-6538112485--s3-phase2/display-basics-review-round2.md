PASS (slice 7a re-review, not the final phase IMPL-EVAL)

All five non-blocking items are addressed, and the corrections add no blockers.

1. **Item token bindings:**
   - `item.css` now uses `--ns-radius-input` for the radius and `--ns-stack-gap` for the gap and `sm` padding, matching D6. Both properties exist in the token output.
   - `xs` keeps `--ns-space-2`, the specified 8 px literal.
2. **Item hover and focus decoration:** you kept it on purpose because the handoff review draws those states. It adds no tab stop or click target.
   - The title link inherits the ink colour.
   - `header`/`footer` use the muted caption treatment.
3. **D13 `booleans`:** now empty. `open`, `defaultOpen` and `disabled` stay typed as state props.
4. **Collapsible native updates** (`display-basics.spec.ts:66-78`):
   - Uncontrolled: setting `open` from code is followed (`data-open="true"`).
   - Controlled: it sends exactly one request (count goes from 2 to 3) and the refused state is restored.
   - Disabled: the change is undone.
5. **Before hydration:** the D13 notes, the package README and the public reference all say that refusing a controlled change and blocking a disabled summary only work after hydration, and that the native summary can still toggle before then.

The updated browser and focused test runs were still in flight, so they need to pass before commit.

Non-blocking: in the README sentence on line 273, "After" follows a semicolon, so it should be lowercase.
