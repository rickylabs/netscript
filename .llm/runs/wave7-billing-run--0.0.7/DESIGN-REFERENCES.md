# Owner-supplied design references — widget/card patterns to match

**The source images are on disk** at `design-references/finance-3.png` and
`design-references/marketing-3.png` (1600x1200 each). If your model can read images, open them —
they are the authority. This transcription exists because a text-only model cannot.


The owner supplied two reference sheets of fintech and analytics dashboard widgets. They are the
**quality bar for composed widgets**. Transcribed here in precise detail because you cannot see
images. Match the *anatomy and density*, not the colours — your palette stays Ledgerline's.

## Sheet A — fintech widgets (blue accent, light ground, four cards)

**1. "Stock Market Tracker"**
- Header row: small line-chart glyph + bold title on the left; on the right a **pill dropdown**
  reading `ACME ⌄` with a hairline border and generous horizontal padding.
- **Segmented range control** directly under the header, full card width, five equal cells
  `1D 1W 1M 3M 1Y`. The selected cell is a filled light-grey pill; the others are transparent. Thin
  dividers between cells.
- **Hero metric**: `$440,364.20` set very large and bold, with a **delta chip** beside it — rounded
  pill, pale-green fill, small ↗ glyph, `0.48%`. Chip is vertically centred on the number's optical
  middle, not its box.
- Sub-label under the hero in small grey caps: `ACME TECH INC. (ACME)`.
- **Line chart** with an interactive readout: a **vertical dashed crosshair** at the hovered x, a
  filled dot on the series, and a **dark rounded tooltip with a downward pointer** showing the exact
  value. No axis chrome at all — the chart is pure line on white.
- **Footer strip**: three label+value pairs, `Open 439,59 · High 442,23 · Low 438,21`, separated by
  middots, inside a hairline-bordered rounded box that spans the card.

**2. "Spending Summary"**
- Header: pie glyph + title; right side pill dropdown `Last Week ⌄`.
- **Semicircular gauge**: thick rounded-cap arc, **two-tone fill** (deep accent for the first
  segment, light accent for the second) over a light-grey remainder track. Centre carries a small
  grey caps label `SPEND` above a large bold `$1,800.00`.
- **Three category columns** below, separated by full-height hairline dividers: each is a
  rounded-square tinted icon tile, a grey label (`Shopping`, `Utilities`, `Others`), and a bold
  amount. Equal widths.
- **Footer note bar**: hairline rounded box, left-aligned sentence `Your weekly spending limit is
  $2000.`, with a small info glyph pinned right.

**3. "Exchange"** — a swap row: `🇺🇸 USD ⌄` and `🇪🇺 EUR ⌄` as two bordered selector cells with a
circular swap glyph centred between them; then a very large amount and a small grey
`Available : $16,058.94` beneath.

**4. "Quick Transfer"** — `MY CONTACTS (12)` as a grey caps label with **left/right pager chevrons**
on the right; a horizontally scrollable row of **avatar chips** (round avatar + name in a bordered
pill); then a card selector row showing a payment-brand mark and `My Physical Card ⌄`.

## Sheet B — analytics widgets (orange accent, four cards)

**1. "Conversion Rate"** — label, then hero `16.9%` with a pale-green `+2.1%` delta chip; an outline
`Details` button top-right. A **three-row metric list**, each row `label … value ↑ +1.8%` with the
arrow and delta coloured green up / red down, right-aligned and column-aligned. Then an **area chart
with a faint grid**, two layers: a solid accent area for the current period and a **translucent pale
overlay for the comparison period**, with month labels on the x-axis.

**2. "Marketing Channels"** — title with an info glyph; hero `82%` with `+2.1% vs last week` inline.
A **segmented share bar**: one full-width rounded track split into three coloured segments with
rounded caps and small gaps between them. Below it an inline **legend** of coloured dots + labels.
Then a **three-column table** (`Channels / Metric / Total`) with a leading glyph per row and a delta
arrow column. A full-width outline `View reports` button closes the card.

**3. "Total Sales"** and **4. "Product Performance"** — same header grammar (label, hero, delta chip,
outline action button), a segmented range control, then a line chart and a **bar chart with the value
printed inside the top of each bar** respectively.

## The transferable grammar — this is what to build

1. **Card anatomy is consistent**: header (glyph + title + optional info) · action affordance
   top-right (pill dropdown **or** outline button) · hero metric + delta chip · body visualisation ·
   footer strip or full-width CTA. Every card in a sheet obeys it, which is why the sheet reads as
   one system.
2. **The hero number dominates** — roughly 3× the label, bold, tabular. Everything else is quiet.
3. **Delta chips** are a component: rounded pill, tinted background, directional glyph, signed value,
   semantic colour. One component, used everywhere.
4. **Segmented controls** for range selection; selected state is a filled pill, not a border change.
5. **Charts carry an interactive readout**: crosshair + point marker + dark tooltip with a pointer.
6. **Comparison is a translucent second layer**, never a second axis.
7. **Equal-width footer columns separated by hairline dividers**, each label + value.
8. **Legends are inline dot + label**, never a boxed key.
9. Chart chrome is minimal: no borders, faint or absent gridlines, axis labels only where they earn
   their place.
10. Generous padding, large radii, soft shadow, hairline borders. Density comes from typography
    hierarchy, not from cramming.

## Map it to Ledgerline

- **Run progress** → the semicircular gauge: issued / failed / remaining as a two-tone arc, centre
  showing amount issued, three equal footer columns for approved / excepted / excluded.
- **Billed vs collected** → the two-layer area chart, collected solid, billed as the translucent
  comparison layer.
- **Revenue by plan** → the segmented share bar plus inline dot legend.
- **Collection rate** → hero percentage + delta chip versus last period.
- **MRR / invoice totals** → hero metric card with a segmented range control and a line chart with
  crosshair tooltip.
- **Dunning funnel** → the three-row metric list with directional deltas (issued → attempted →
  collected).
- **Webhook deliveries** → the three-column table grammar with a leading status glyph and a
  full-width `View log` CTA.
- **Period selector** → the pill dropdown.

Every value in these widgets is money or a rate, so the money rules still bind: tabular numerals,
explicit currency, an em dash for not-measured, and never a fabricated zero.
