PASS (slice 7c2a: Label, Card and Pagination docs gaps G4/G9/G15, not the final IMPL-EVAL)

I found no blockers in these three components.

- **Label (`label.tsx`/`label.css`):**
  - It has the F1 `variant` (default/eyebrow) × `state` (rest/disabled/invalid) axes, and `state` is presentation only.
  - Required takes precedence over optional (the hint is hidden when both are set), and the optional hint can be localized through `optionalText`.
  - Native `for`/`htmlFor` pass through.
  - `srOnly` hides the label with its own clipping rule (`.sr-only[data-sr-only='true']`), so it doesn't rely on Tailwind.
  - The required mark is a `destructive/text` pseudo-element, and the eyebrow and invalid styles bind to the specified roles.
- **Card (`card.tsx`/`card.css`):**
  - The existing default surface and its sections still work.
  - It adds the `variant` default/rule, `size` md/sm and visual `state` axes, plus `Card.Action` in the header grid.
  - Interactive cards add only `focus-within` and hover styling, with no tab stop or handlers on the container.
  - **Rule cards** have no fill, radius or shadow and only a top `border/subtle` line, outranking the theme-scoped radius rule. They use the heading and small type roles, and native children keep their own focus and activation.
- **Pagination (`pagination.tsx`/`pagination.css`):**
  - `Meta` and `Actions` are kept, and `Link`, `Previous`, `Next` and `Ellipsis` are added.
  - **Disabled links** drop `href` and the tab stop, take `aria-disabled`, and block clicks before the caller's handler runs. An enabled link without `href` throws.
  - **Current links** get `aria-current="page"`.
  - Previous/next tiles carry native `rel=prev/next` and use the new arrow glyphs (mirrored in right-to-left layouts), while page keys keep the existing chevrons.
  - The pager stacks to one column below 40 rem.
  - Every CSS property it uses (`--ns-control-h-sm`, `--ns-border-control`, `--ns-border-subtle`, the type roles) exists.
- **Registry and tests:**
  - Pagination's root runtime dependency goes through the exact named historical repair, and the frozen fixture is unchanged.
  - The audited baseline list and the installed-copy test now cover CodeBlock, Label, Card and Pagination.
  - The new `FRESH_UI_GAP_PORT` override is validated, rejects invalid values like `0`, and keeps server reuse off.

Non-blocking:

1. `Pagination.Ellipsis` is fully `aria-hidden`, so screen-reader users get no hint that pages were skipped. A visually hidden "More pages" label is a common pattern.
2. The rule card's selected state changes only the top border colour and the background, which is subtle. Check it against the review render if selection matters in docs grids.
