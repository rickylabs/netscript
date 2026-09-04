# Design steer #2 — vision critique is in. Act on it.

A Gemini 3.8 Flash critic **looked at the reference images** (you cannot) and judged your work against
them. Full text attached as `design-critique-1.md`. It is specific and it is right. The headline:
your component library is well-engineered but **stylistically it is not the references** — and one
choice actively fights them.

## The six ranked changes, in order

1. **Kill the brutalist button shadows.** `assets/ui/button.css:54,73,104,124` hardcodes
   `box-shadow: 3px 3px 0` plus an active `translate(1px,1px)` — a retro-brutalist look that clashes
   with every reference card and **breaks dark mode**: the shadow mixes `--ns-paper-12`, which is
   near-white at 97.5% lightness in dark, so the button gets a **stark white halo** on a dark
   surface. The references use soft hairline-bordered pills with `border-radius: 9999px` and no
   offset shadow. Remove the offsets and add a pill variant.
2. **Build `DeltaChip`.** You use the generic `Badge` — a 4px rectangular box with uppercase
   monospace — sitting in the card header, **decoupled from the value**. The references put a rounded
   pill with a tinted `color-mix` background and a directional glyph **directly beside the hero
   number**, optically centred on it. This is the single most repeated element across all eight
   reference widgets.
3. **Establish the 5-band widget card.** Every reference card obeys one anatomy: header row (glyph +
   title left, pill action right) → segmented range control → hero metric row → body visualisation →
   hairline footer columns or full-width CTA. Your `.ns-card__header` is hardcoded
   `flex-direction: column` and the card radius is 12px against the references' ~24px. Build a
   `WidgetCard` compound component with `Header`, `Hero`, `Body`, `FooterColumns`.
4. **Fix money rendering — it is currently wrong.** `money-text.tsx` calls `Number(text)` with
   dynamic fraction digits, so **`$100` renders where `$100.00` is required**, and line 57 appends
   the currency with no spacing, printing **`100.00USD`**. In a billing product that is not a style
   bug. Use `moneyParts` from `lib/money.ts`, guarantee two decimals, and apply
   `font-variant-numeric: tabular-nums` via class, not inline style.
5. **Your charts are not charts.** `chart-block.tsx` renders **HTML divs** with float-formatted tick
   labels, and `donut.tsx` only draws a 360° circle. The references need a **180° two-tone
   semicircular gauge** with flat baseline caps (`stroke-linecap="butt"`) and a centre label, and a
   **two-layer area chart** where the comparison period is a translucent fill under a solid current
   series. Hand-authored SVG over tokens, no library.
6. **Build `SegmentedControl` and `FooterColumns`.** Neither exists. The segmented range control is a
   full-width capsule with a filled active pill; the footer is N equal columns split by 1px vertical
   hairlines.

## Also flagged

- **Dark mode is broken by component CSS even though the token layer is genuinely good.** The critic
  called `[data-theme='dark']` a real second design, not an inversion — deep ink, warm paper, status
  ramps stepped brighter for contrast. But `exception-badge.tsx:40-42` hardcodes `--ns-rust-6` at
  45.5% lightness, which is unreadable on a 21.5% dark card. Use the semantic token.
- **The gallery still shows scaffold strings** — `api-gateway`, `eu-west`, `v2.4.1` in
  `components-view.tsx`. That violates your own `DESIGN.md` rule 8.

## Build these five next, in this order

`DeltaChip` → `SemicircularGauge` → `SegmentedRangeControl` → `ComparisonAreaChart` →
`FooterColumns`. The critique carries a full visual spec for each — radii, stroke widths, viewBox,
`color-mix` values, font weights — and the billing surface each one serves. Follow it literally; it
was written by the only agent in this build that can see the references.

Then register all five in the gallery and render them in your skin.
