PASS (slice 7a: Item, Kbd and Collapsible)

I found no blockers in these three components.

- **Collapsible (`collapsible.tsx`):**
  - **No duplicate requests.** Once hydrated, the summary's `onClick` blocks the native toggle and sends a single `onOpenChange`. The `open` prop then updates the DOM, and the `toggle` event that follows already matches the expected state, so it doesn't send a second request.
  - **Controlled refusal:** the DOM never changes, and the browser test checks the request count and the `open` attribute both ways.
  - **Changes the browser makes itself** (setting `open` from code, find-in-page, an exclusive `name` group) go through `onToggle`. That sends one request, puts the DOM back when the component is controlled or disabled, and can't loop because the restored state matches.
  - **Disabled:** the summary is out of the tab order (`tabIndex=-1`), has `aria-disabled`, and clicks are blocked.
  - **Native behavior:** Enter and Space come from the native summary, and without JavaScript the disclosure still works through native `details`/`summary`. The contract axes `data-open` and `data-state` (rest/disabled) match.
- **Item (`item.tsx`):**
  - It's a plain presentation `div` with no tab stop (the test checks this). Child links and buttons keep their native Tab/Enter/Space behavior.
  - Optional parts (`media`, `content` > `title`/`description`, `actions`, `chevron`, and `header`/`footer` as full-width rows) appear only when supplied.
  - `variant`/`size` match D6's 3×3 sets, and `Item.Group` adds the `separators` boolean.
- **Kbd (`kbd.tsx`):**
  - It renders a native `<kbd>` with root and label parts and the `size`/`variant` axes from D7.
  - `Kbd.Group` adds only decorative `aria-hidden` "+" separators, can drop them with `separator={false}`, and adds no tab stops or key handlers. The test checks both.
- **Registry:**
  - All three are in `registry.json`, the `style-utility` map, a collection and `POST_V1_COMPONENTS`.
  - Their `ns-keycap`, `ns-item` and `ns-collapsible` class names don't collide with existing CSS.
  - Every CSS custom property they use exists.

Non-blocking:

1. **Item token bindings.** D6 binds the radius to `radius/input` and the gap to `space/stack/gap` (with `sm` padding `space/stack/gap` and `xs` 8 px). `item.css` uses `--ns-radius-control` and `--ns-space-3`. Confirm these resolve to the same values in Utility, or switch to the specified roles.
2. **Item hover and focus.** A non-interactive row gets a hover background (`.ns-item:hover`) and a whole-row focus ring (`:has(:focus-visible)`) on top of the child's own ring. Check this against the review PNG; it can look like the row itself is an action.
3. **Collapsible contract.** D13 lists `open`, `defaultOpen` and `disabled` under `booleans`, which the type defines as part-visibility props from the design spec. They're state props.
4. **Collapsible test gap.** No browser test covers the native-update path in `onToggle`. One case would do: set `details.open` from code on a controlled instance and check it sends a request and the DOM is restored.
5. **Collapsible without JavaScript.** A disabled Collapsible can still be toggled natively before hydration. Document that, or render it closed with no content.
