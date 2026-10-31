# Independent native reset refinement review

PASS (slice 10b native-reset refinement)

The refinement correctly fixes the measured reset failure using native form semantics alone, with no change to public API, ports, dependencies or tokens. You may implement it.

- **The finding:** a native form reset restores each control from its *default* state (`defaultChecked` and `defaultValue`, which reflect the `checked` attribute and the textarea's text), not from the current property values Preact sets. Since a queued microtask can run before the browser's default reset action, reconciling afterwards can't be relied on. The reset itself has to land on the right values.
- **The fix:** on every render, the layout reconciliation sets the owned inputs' defaults *first*:
  - `defaultChecked` from accepted membership when controlled, or from the initial `defaultValue` when uncontrolled (the first value for single mode, membership for multiple);
  - `textarea.defaultValue` from the accepted text when controlled, or from the initial `defaultText` when uncontrolled.

  Then it assigns the current `checked`/`value` *last*. Ordering it that way is right, because setting a default can change the current value on a control the user hasn't edited yet.
- **Why it works:** the native reset now lands on the accepted state (controlled) or the initial state (uncontrolled) whenever it runs, so it no longer matters when the microtask runs. The existing guarded microtask is reduced to resetting local state to the same values, with no change or submit callbacks.
- **Scope kept:**
  - The owner's `onReset` still runs first, and prevention returns early.
  - Supplied native fields that aren't owned keep their own defaults and native reset.
  - The SSR `checked` attributes and default textarea text already make reset correct before JavaScript.
  - No new engine, timer or listener.

**Advice:**

1. **Fix the uncontrolled baseline.** Capture the initial `defaultValue`/`defaultText` once (a ref at mount), so a later change to the `default*` props doesn't silently move the reset baseline. That matches native uncontrolled semantics. Document it.
2. **Tests to add:**
   - uncontrolled single and multiple reset after changes;
   - controlled reset after both an accepted and a refused change;
   - reset with a supplied host field that isn't owned keeps its own default;
   - a reset prevented through `onReset`;
   - freeform text reset in both modes.

   Run the new reset cases in Firefox and WebKit too, since their timing for default actions differs.
3. Keep all the original reset, refusal, FormData, no-JS and Firefox/WebKit gates, as stated. Leave the failing prototype case in the record as the negative test that drove this.
