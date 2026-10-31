# Independent slice9a design review

PASS (slice 9a design checkpoint: ScrollArea, AspectRatio, Direction and the strict checker seam)

The proposed API, strict checker and Direction boundary all fit the approved plan (decisions 2 and 10), and I found no contract blocker. Implementation may start. The advice below covers the concrete risks.

**What I checked against the draft:**
- **ScrollArea:**
  - It takes a required string `label` and has one focusable native viewport (`tabIndex=0`, with the label as its accessible name).
  - `orientation` is vertical/horizontal/both, defaulting to vertical, and matches L9's `data-orientation` axis.
  - The scrollbar, thumb and corner stay `native` parts with no fake DOM, and the root size belongs to the caller.
- **AspectRatio:** a closed ratio set (`16:9`/`4:3`/`1:1`/`21:9`, default `16:9`) on native CSS `aspect-ratio`, plus a media wrapper. That matches L11.
- **Direction:**
  - It applies native `dir` to exactly one existing native-element child via `cloneElement`, with no wrapper, no context and no global mutation.
  - It rejects fragments, arrays, custom components and children that are already scoped.
  - Changing L12 from a `context` root to the real element boundary (carrying `data-dir`) is a legitimate correction to an unshipped contract, and it closes the `contextOnly` bypass.
- **Ports and constants:** native and Preact only, no new dependency family, no new token values. The 10/6/8 px track and thumb sizes are documented ledger literals.

**Advice for implementation, not blockers:**

1. **Scrollbar CSS conflict.**
   - Chromium ignores `::-webkit-scrollbar*` rules on any element where `scrollbar-width` or `scrollbar-color` is set.
   - Use one approach per engine: standard `scrollbar-color`/`scrollbar-width: thin` as the portable baseline, and put webkit geometry only behind `@supports not (scrollbar-color: auto)`. Alternatively, accept the standard-property limits and document them.
   - Exact 6 → 8 px thumb growth on hover isn't achievable with standard properties. Record that as a native limitation rather than adding DOM.
2. **Direction edge cases.**
   - Decide what happens when the child already has `dir`, and lock it in the contract notes: reject a conflicting value, or overwrite and document.
   - Test that `key`, `ref`, `class`, `style` and handlers survive the clone.
   - Test that nested Direction stays local: the inner boundary wins and the document `dir` never changes.
   - Validate on the server too, so SSR throws the same errors as the client.
3. **Strict checker seam.**
   - Define the "new identity" set explicitly, for example from a 2b list beside `POST_V1_COMPONENTS`, not from a heuristic such as the `shipped` flag. That way 12b extends the same table instead of redefining it.
   - Within an element scoped to the component, allow only:
     - `data-scope` and `data-part`;
     - contract axes on their allowed parts, with valid values;
     - classification entries keyed by component + part + attribute + purpose.
   - Elements of nested base components are checked under their own scope.
   - Include negative tests for each rejection: an unknown attribute, any `data-x-*`, an axis on the wrong part, and an invalid value.
4. **Meaningful keyboard tests, even for presentation components:**
   - **ScrollArea:** Tab reaches the viewport; arrow keys and PageDown scroll vertically; arrows scroll horizontally, including inside an RTL Direction where `scrollLeft` is non-positive in Chromium; a focusable child inside keeps native Tab order.
   - **AspectRatio:** the root adds no tab stop, and Tab goes straight to a focusable media child.
   - **Direction:** wrap a real roving component, such as an existing ToggleGroup or Tabs inside a native boundary, and check that the horizontal arrows reverse while the document `dir` is untouched.
5. **ScrollArea tab stop.** The viewport is a tab stop even when nothing overflows. That's acceptable and passes axe's scrollable-region rule. Document it, or consider only adding `tabIndex` when the content can actually scroll, as long as SSR and hydration stay stable.
6. **Registry and proof:**
   - Add all three components to `POST_V1_COMPONENTS`, the style map, collections and the installed-consumer test (`ui:add` → type-check, lint, SSR against the contracts).
   - Run committed-source checks on all four carriers.
   - Keep strict axe at zero serious or critical findings with no allowances.
   - Keep the split rule: if the strict seam plus three components goes past 30 files, land and review the checker first.
