# Design Critic — Vision Pass on Ledgerline

> **Mode:** Read-Only Audit.  
> **Authority Source Images:** [`finance-3.png`](file:///home/agent/projects/netscript/wave7-design/design-references/finance-3.png) & [`marketing-3.png`](file:///home/agent/projects/netscript/wave7-design/design-references/marketing-3.png) (1600×1200 rendered canvas).  
> **Brief File Under Review:** [`DESIGN-REFERENCES.md`](file:///home/agent/projects/netscript/wave7-design/DESIGN-REFERENCES.md).  
> **Codebases Inspected:** `/home/agent/projects/netscript/wave7-design` and `/home/agent/projects/netscript/wave7-billing`.

---

## 1. Corrections to `DESIGN-REFERENCES.md` (The Written Brief)

Because the design agent runs on a text-only model, every discrepancy in [`DESIGN-REFERENCES.md`](file:///home/agent/projects/netscript/wave7-design/DESIGN-REFERENCES.md) is an active defect in the specification it is building against. Having inspected the rendered reference images with visual eyes, here are the corrections:

### Sheet A — [`finance-3.png`](file:///home/agent/projects/netscript/wave7-design/design-references/finance-3.png)

1. **Card 2 "Spending Summary" — Arc Terminal Geometry (Critical Defect):**
   - *The brief claims (line 32):* "thick rounded-cap arc".
   - *What the image actually shows:* **The arc terminates with flat, horizontal square cuts flush with the baseline.** There are **no rounded stroke caps**. The junction between the cobalt blue and bright cyan segments is a crisp radial divider cut. If an agent implements `stroke-linecap="round"`, the arcs will bulge awkwardly below the baseline and bleed over the segment junction.
   - *Missed element:* There is an explicit, full-width hairline horizontal divider line directly beneath the gauge arc, separating the hero graphic from the three category columns.

2. **Card 3 "Exchange" — Missing Card Header & Architecture:**
   - *The brief claims (line 41):* Transcribed only as a loose "swap row" with amounts.
   - *What the image actually shows:* It follows the exact same top card header grammar: left has a **circular refresh glyph + bold title "Exchange"**; right has a **hairline pill button labeled `Currencies`**. Below the header sits an enclosed, rounded hairline frame containing two sub-decks: the top deck contains `🇺🇸 USD ⌄ | ⇄ | 🇪🇺 EUR ⌄` separated by vertical hairline dividers; the bottom deck contains the hero `$100.00` and `Available : $16,058.94`.

3. **Card 4 "Quick Transfer" — Missing Primary Header:**
   - *The brief claims (line 45):* Omits the card header, starting with `MY CONTACTS (12)`.
   - *What the image actually shows:* The card has a standard header row: **horizontal opposing transfer arrows glyph + bold title "Quick Transfer"**, with a hairline pill button on the right containing a gear icon and text: **`⚙ Advanced`**. `MY CONTACTS (12)` is a secondary sub-section label.
   - *Avatar pills:* Each pill is a full pill capsule with a 1px border enclosing a circular illustrated face avatar and a first name (`Natalia`, `James`, `Laura`).

4. **Card 1 "Stock Market Tracker" — Selected Cell & Crosshair:**
   - *The brief claims (line 18):* Selected cell in `1D 1W 1M 3M 1Y` is a filled light-grey pill.
   - *Correction:* In the rendered card, **`1Y` is the active cell** (subtle grey pill fill), while unselected cells have transparent backgrounds and vertical hairline dividers between them.
   - *Crosshair:* The dashed crosshair drops **vertically downward from the filled point marker** to the baseline of the chart area; it does not shoot upward. The tooltip is a dark charcoal rounded bubble with a distinct **downward-pointing triangular arrow** centered over the hovered node.

---

### Sheet B — [`marketing-3.png`](file:///home/agent/projects/netscript/wave7-design/design-references/marketing-3.png)

1. **Card 1 "Conversion Rate" — Delta Chip Arrow & Frame:**
   - *The brief claims (line 51, 74):* Delta chip has a "directional glyph".
   - *Correction:* In Card 1, the pale-green pill chip reads **`+2.1%` with NO arrow glyph**. The arrow glyphs appear exclusively on the metric list rows below (`↑ +1.8%`, `↓ -1.2%`).
   - *Area chart container:* The area chart sits inside an explicit **rounded-corner hairline boundary box** containing subtle horizontal and vertical gridlines. The month tick labels (`FEB MAR APR MAY JUN JUL`) sit **below and outside** this bounded chart box.

2. **Card 2 "Marketing Channels" — Missing Header Action & Inline Delta:**
   - *The brief claims (line 57):* Mentions title and hero, but omits the header action.
   - *Correction:* Top right carries an outline pill button: **`Details`**.
   - *Hero Delta:* Next to `82%`, the delta is **raw inline green text** (`+2.1% vs last week`), **not a tinted pill chip**.
   - *Missed divider:* Beneath the inline dot legend (`● Organic Search  ● Social Media  ● Direct`), there is a distinct **horizontal dotted/dashed separator line** before the table rows begin.
   - *Table icons:* Each row in the table (`Acquisition`, `Conversion`, `ROI`) has a leading circular outline glyph (user avatar, clock timer, target bullseye).

3. **Card 3 "Total Sales" & Card 4 "Product Performance" — Actions and Scales:**
   - Card 3 has a pill button labeled **`Report`** (not `Details`). Its selected range tab is **`1W`**.
   - Card 4's segmented range control has options **`1D  1W  1M  6M  1Y`** (it uses `6M`, not `3M`). Its selected range tab is **`1W`**.
   - In Card 4, the bar chart has solid orange vertical bars with **pill-rounded top corners**, and the percentages (`80%`, `100%`) are rendered in **crisp white text directly inside the top of the bars**.

---

## 2. Evaluation Against the Build

### 1. Does the Token Identity Hold Up Next to the References?
**Verdict: It reads as a recoloured scaffold with conflicting aesthetic impulses.**

- **Corner Radii (Major Failure):**
  The references derive their modern, high-end feel from **large, confident outer radii and pill interiors**. The reference cards have ~`24px–28px` corner radii. Segmented controls, delta chips, top-right buttons, avatar containers, and footer CTAs are all **full pills (`border-radius: 9999px`)**.
  In Ledgerline, the radius scale in [`tokens.css:198-203`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/assets/tokens.css#L198-L203) stops at `--ns-radius-2xl: 16px`. Card surfaces in [`surface-styles.css:3`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/assets/ui/surface-styles.css#L3) use `--ns-radius-xl` (`12px`). Buttons in [`button.css:11`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/assets/ui/button.css#L11) use `--ns-radius-md` (`6px`). Badges in [`badge.css:12`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/assets/ui/badge.css#L12) use `--ns-radius-sm` (`4px`). The rendered UI looks boxy, dated, and cramped.
- **Shadow Treatment (Severe Clash):**
  The references use soft, diffused, multi-stop ambient shadows (`box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04)`). Ledgerline's tokens declare soft shadows ([`tokens.css:205-209`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/assets/tokens.css#L205-L209)), but [`button.css:54,73,104,124`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/assets/ui/button.css#L54) hardcodes **retro-brutalist 3D offset box-shadows**:
  ```css
  box-shadow: 3px 3px 0 color-mix(in srgb, var(--ns-primary) 55%, var(--ns-paper-12));
  ```
  This creates an aggressive, toy-like tactile button aesthetic that directly contradicts the clean, premium Stripe/fintech references.
- **Ramp Structure & Contrast:**
  The `paper` ramp ([`tokens.css:7-18`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/assets/tokens.css#L7-L18)) has a distinct warm-olive hue (OKLCH hue 95). While intentional for the "paper ledger" metaphor, `--ns-paper-6` (`59.5%` lightness) and `--ns-paper-7` (`47%` lightness) lack sufficient contrast when used for labels and axis ticks on `--ns-paper-1` or `--ns-card`.

---

### 2. Card Anatomy
**Verdict: Each surface is improvising; the 5-band grammar does not exist.**

In the references, every single card strictly obeys a 5-band architecture:
1. **Header Row:** Icon + Title left; Pill Action right (`ACME ⌄` or `Details`).
2. **Range Control (optional):** Full-width segmented pill (`1D 1W 1M 3M 1Y`).
3. **Hero Metric Row:** Massive bold tabular value + inline tinted delta chip, with quiet sub-label below.
4. **Body Visualisation:** Hand-drawn SVG chart, metric funnel list, or category columns.
5. **Footer Anchor:** Equal-width hairline columns or full-width outline CTA button (`View reports`).

**What Ledgerline actually has:**
- In [`surface-styles.css:8-13`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/assets/ui/surface-styles.css#L8-L13), `.ns-card__header` is hardcoded as:
  ```css
  display: flex;
  flex-direction: column;
  gap: var(--ns-space-2);
  ```
  It is a **vertical column** designed for a title and a description paragraph. It has no slot for a leading glyph, no right-pinned action affordance, and no concept of an inline hero band.
- In [`routes/runs/(_components)/run-summary.tsx:81-124`](file:///home/agent/projects/netscript/wave7-billing/apps/ledgerline-web/routes/runs/(_components)/run-summary.tsx#L81-L124), the billing run overview splits the view into a generic metadata card and a separate 4-box `StatsGrid`. The page is a collection of disconnected rectangular tiles rather than cohesive dashboard widget cards.

---

### 3. The Widget Vocabulary
**Audit of the 8 reference patterns against Ledgerline:**

| Reference Pattern | Exists in Ledgerline? | Current Implementation / Gap | Value for Billing |
| :--- | :--- | :--- | :--- |
| **1. Delta Chip** | **Missing** | Only `Badge` exists ([`badge.tsx`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/components/ui/badge.tsx)). It renders as a 4px-radius box with uppercase monospace text. Sits in header corners, never inline with hero numbers. | **Critical** (MRR deltas, collection rate shifts, failure count deltas). |
| **2. Segmented Range Control** | **Missing** | Only `<Select>` and `<FilterForm>` exist. No inline segmented pill control (`1D 1W 1M 1Y`). | **High** (Switching billing run inspection windows: Day / Week / Month / Year). |
| **3. Semicircular Two-Tone Gauge** | **Missing** | Only `Donut` exists ([`donut.tsx`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/components/ui/donut.tsx)), which is a full 360° SVG circle with a vertical legend list. | **Critical** (Run completion: Issued vs. Computed vs. Remaining; Plan quota usage). |
| **4. Segmented Share Bar + Dot Legend** | **Missing** | Only `Progress` (single bar) and `ChartBlock` (vertical list of horizontal bars) exist. No segmented bar with rounded gaps or inline dot legend. | **Critical** (Revenue by plan, invoice payment method distribution: Card / ACH / Wire). |
| **5. Metric List with Directional Deltas** | **Missing** | Tables exist, but the compact 3-row card-body list (`Label … Value … Arrow+Delta`) does not. | **Critical** (Dunning funnel: Invoiced → Attempted → Collected; Run pipeline). |
| **6. Crosshair + Dark Pointer Tooltip** | **Missing** | Zero charts in Ledgerline implement CSS `:hover` crosshairs or pointer tooltips. | **High** (Exact point-in-time revenue inspection). |
| **7. Equal Footer Columns w/ Hairlines** | **Missing** | `Card.Footer` ([`card.css:25-29`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/assets/ui/card.css#L25-L29)) is just a grey padded bar. No multi-column hairline divider component exists. | **High** (Run footer: Approved $X \| Excepted $Y \| Excluded $Z). |
| **8. Avatar-Chip Row with Pager** | **Missing** | `Avatar` exists only as a standalone circle. No pill chips or pager chevrons. | **Medium** (Operator attribution on billing run approvals). |

---

### 4. Charts
**Verdict: The current chart implementation violates its own architecture rules and cannot render the references.**

- **Violation of Rule H1 (Hand-authored SVG):**
  [`chart-block.tsx:78-85`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/components/ui/chart-block.tsx#L78-L85) does not emit SVG. It renders plain HTML `<div>` columns and `<span>` bars using inline CSS percentages (`style={{ height: ... }}`).
- **Violation of Rule H2 (Charts never format values):**
  [`chart-block.tsx:49-52`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/components/ui/chart-block.tsx#L49-L52) takes numeric values and formats them with JavaScript floats:
  ```ts
  function formatTick(n: number): string {
    if (n >= 1000) return `${Math.round(n / 100) / 10}k`;
    return `${Math.round(n * 100) / 100}`;
  }
  ```
  This is a direct violation of Rule H2: *"A chart component takes `label: string`, never a number it would have to format."*
- **What is completely missing:**
  - **No Area Chart:** No SVG area geometry, and zero ability to render a translucent comparison overlay (e.g. Billed vs. Collected).
  - **No Line Chart:** No SVG polyline/path generator with hover interaction.
  - **No Gauge:** `Donut` cannot render a 180° gauge with a central hero readout and baseline cuts.

---

### 5. Density and Hierarchy
**Verdict: Hierarchy is weak; numbers do not dominate.**

- In [`stats-grid.tsx:45-51`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/components/ui/stats-grid.tsx#L45-L51), the metric card layout places the badge in the top-right header beside the tiny uppercase label, while the number sits below alone. The eye is drawn to the top corners rather than the number.
- In [`surface-styles.css:15-20`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/assets/ui/surface-styles.css#L15-L20), `.ns-card__title` is set to `var(--ns-text-sm)` (`14px`), exactly the same size as `.ns-card__description` (`14px`). The titles have no presence.
- On actual product screens (e.g. [`run-summary.tsx`](file:///home/agent/projects/netscript/wave7-billing/apps/ledgerline-web/routes/runs/(_components)/run-summary.tsx)), four stats cards ("Computed", "Issued", "Pending items", "Failed items") are displayed in a uniform grid of identical visual weight. There is no large hero number that commands the page.

---

### 6. Money Rendering
**Verdict: Two conflicting implementations; the product codebase breaks the core money contract.**

- **The Good:** [`wave7-design/apps/ledgerline-web/lib/money.ts`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/lib/money.ts) is cleanly implemented. It uses digit string arithmetic, rounds half-up without `Number.toFixed`, respects precision, and produces em dashes (`—`) on absence.
- **The Defect in Product:** [`wave7-billing/apps/ledgerline-web/components/product/money-text.tsx`](file:///home/agent/projects/netscript/wave7-billing/apps/ledgerline-web/components/product/money-text.tsx) **completely ignores `lib/money.ts`** and reimplements its own float-based formatter:
  ```ts
  // money-text.tsx lines 23-29
  const parsed = Number(text); // VIOLATION OF RULE M2: float conversion!
  const decimals = text.includes('.') ? text.split('.')[1]!.length : 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: Math.min(decimals, 6),
    maximumFractionDigits: Math.min(Math.max(decimals, 2), 6),
  }).format(parsed);
  ```
  - If given an integer like `"100"`, `decimals` is `0`, so `minimumFractionDigits` is `0`. It prints `$100` instead of `$100.00`, violating Rule M3.
  - In line 48, it re-derives direction via `amount > 0 ? 'money-pos' : amount < 0 ? 'money-neg' : 'money-flat'`, violating Rule M5.
  - In line 57, it renders `{currency && <span class='ns-money-text__currency'>{currency}</span>}` directly after the amount, printing `100.00USD` with no spacing.

---

### 7. Dark Mode
**Verdict: Genuine token foundation, but broken by component-level CSS.**

- **The Token Foundation is Solid:**
  In [`tokens.css:224-316`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/assets/tokens.css#L224-L316), `[data-theme='dark']` is not an automatic color inversion. It uses deep ink and warm paper tones (`--ns-paper-1: oklch(13.5% 0.008 95)`), remaps `--ns-card` to `--ns-paper-3`, and adjusts status ramps to brighter steps (e.g. `--ns-ledger-4` instead of `--ns-ledger-6`) so contrast is maintained against the dark ground.
- **Component Breakages:**
  1. [`button.css:54,73,104,124`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/assets/ui/button.css#L54): Button box-shadows mix with `var(--ns-paper-12)`. In dark mode, `--ns-paper-12` is near-white (`97.5%` lightness). The button shadow becomes a **stark white brutalist halo** on a dark surface.
  2. [`exception-badge.tsx:40-42`](file:///home/agent/projects/netscript/wave7-billing/apps/ledgerline-web/components/product/exception-badge.tsx#L40-L42): Hardcodes `var(--ns-rust-6)` (`45.5%` lightness). On dark cards (`--ns-paper-3`, `21.5%` lightness), this dark red badge becomes unreadable. It must use the semantic `--ns-money-neg` or `--ns-destructive` token.
  3. [`components-view.tsx`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/routes/(design)/design/(_components)/components-view.tsx): The design gallery still displays hardcoded generic cloud/DevOps scaffold strings ("api-gateway", "eu-west", "v2.4.1"), failing Rule 8 of `DESIGN.md`.

---

## 3. Prioritised Critique

### Ranked Item 1: Eliminate Brutalist 3D Button Shadows; Establish Soft Elevation & Pill Actions
- **What Reference Does:** All action buttons and dropdowns are soft, hairline-bordered pills (`border-radius: 9999px`) with zero offset shadow or subtle ambient elevation.
- **What Ledgerline Does ([`button.css:54,73,104,124`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/assets/ui/button.css#L54)):** Hardcodes `box-shadow: 3px 3px 0 ...` and `transform: translate(1px, 1px)`, creating a heavy retro-brutalist aesthetic that damages dark mode and clashes with the design references.
- **Specific Change:** Remove all `3px 3px 0` box-shadows and active transforms from `button.css`. Add a `.ns-btn--pill` variant (or update standard control styles) with `border-radius: var(--ns-radius-full)`, hairline border `1px solid var(--ns-border)`, and subtle background hover tint.

### Ranked Item 2: Build the Delta Chip Component and Mount Inline with Hero Metrics
- **What Reference Does:** Delta chips are rounded pills (`border-radius: 9999px`) with soft green/red tinted backgrounds (`color-mix`), crisp signed text (`+2.1%` or `0.48%`), and an optional directional arrow (`↗`, `↑`, `↓`), vertically aligned to the optical center of the hero number.
- **What Ledgerline Does ([`stats-grid.tsx:45-48`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/components/ui/stats-grid.tsx#L45-L48), [`badge.css:12`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/assets/ui/badge.css#L12)):** Uses generic `Badge`, which is a 4px rectangular box with uppercase monospace font. Sits in the top-right header, decoupled from the value.
- **Specific Change:** Create `components/ui/delta-chip.tsx` emitting `.ns-delta-chip`. Use `border-radius: var(--ns-radius-full)`, font size `0.75rem`, font weight `600`, sans-serif. In `StatsGrid` and composed cards, render the delta chip in a flex row directly beside the hero value.

### Ranked Item 3: Establish the 5-Band Composed Widget Card Architecture
- **What Reference Does:** All widget cards follow a strict 5-band vertical anatomy: Header row (glyph + title left, pill action right) → Segmented range control → Hero metric row → Body visualization → Hairline footer columns or full-width CTA.
- **What Ledgerline Does ([`surface-styles.css:8-13`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/assets/ui/surface-styles.css#L8-L13)):** `.ns-card__header` is hardcoded as `flex-direction: column`. Outer card radius is only 12px. There is no unified composed widget container.
- **Specific Change:** Update `.ns-card` radius to `24px` (`--ns-radius-3xl`). Create a `WidgetCard` component (or compound extensions on `Card`) with dedicated sub-components: `WidgetCard.Header` (flex row, space-between), `WidgetCard.Hero` (hero amount + delta chip), `WidgetCard.Body`, and `WidgetCard.FooterColumns`.

### Ranked Item 4: Fix Money Formatting in Product Code to Use `lib/money.ts`
- **What Reference Does:** Renders exact currency amounts with clean tabular numbers, guaranteed 2-digit minimum decimals, and em dashes for missing data.
- **What Ledgerline Does ([`money-text.tsx:23-29, 47-48`](file:///home/agent/projects/netscript/wave7-billing/apps/ledgerline-web/components/product/money-text.tsx#L23-L29)):** Calls `Number(text)` and `Intl.NumberFormat` with dynamic fraction digits (causing `$100` instead of `$100.00`), manually re-derives direction, and appends raw currency without spacing.
- **Specific Change:** Delete the custom formatting logic in `money-text.tsx` and import `moneyParts` from `lib/money.ts`. Ensure `font-variant-numeric: tabular-nums` is applied via class rather than inline style.

### Ranked Item 5: Replace HTML-Div Charts with Real SVG Charts & Implement the Two-Tone Gauge
- **What Reference Does:** Two-tone 180° semicircular gauge with flat baseline cuts and center total; two-layer area chart with translucent comparison fill.
- **What Ledgerline Does ([`chart-block.tsx:75-85`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/components/ui/chart-block.tsx#L75-L85), [`donut.tsx:47-69`](file:///home/agent/projects/netscript/wave7-design/apps/ledgerline-web/components/ui/donut.tsx#L47-L69)):** `ChartBlock` renders HTML divs with float-formatted tick labels. `Donut` only renders a 360° circle.
- **Specific Change:** Build an SVG-based `SemicircularGauge` taking pre-calculated percentages and pre-formatted string labels. Add `stroke-linecap="butt"` with flat baseline terminals. Build an SVG `AreaChart` that accepts a primary series path and a comparison series path rendered with `fill="color-mix(in srgb, var(--ns-primary) 15%, transparent)"`.

### Ranked Item 6: Build Segmented Range Control & Hairline Footer Columns
- **What Reference Does:** Range selector `1D 1W 1M 3M 1Y` is a single full-width pill with filled pill active state. Footers have 3 equal columns divided by vertical 1px hairlines.
- **What Ledgerline Does:** No segmented control exists. Footers are unpartitioned blocks.
- **Specific Change:** Implement `SegmentedControl` using `<div role="tablist" class="ns-segmented-control">` with filled active pill styling. Implement `CardFooterColumns` with CSS `grid-template-columns: repeat(N, 1fr)` and `border-right: 1px solid var(--ns-border)` between cells.

---

## 4. The Five Components to Build Next

Argued directly from the owner-supplied references and mapped to Ledgerline's billing domain:

### 1. `DeltaChip` (`components/ui/delta-chip.tsx`)
- **Visual Spec:** A full pill capsule (`border-radius: 9999px`), padding `2px 8px`, font size `0.75rem`, font weight `600`. Background is `color-mix(in srgb, var(--ns-money-pos) 12%, transparent)`, text is `var(--ns-money-pos)`. For negative, uses `--ns-money-neg`. Supports optional directional glyph (`↑`, `↓`, `↗`). Vertically centered with adjacent text.
- **Billing Surface:** 
  - **Run Console & Summary:** Month-over-month billing run totals delta (`+14.2% vs prior run`).
  - **Invoice Ledger:** Real-time collection rate delta chip beside the headline percentage.

### 2. `SemicircularGauge` (`components/ui/semicircular-gauge.tsx`)
- **Visual Spec:** 180° SVG arc (viewBox `0 0 200 110`), radius 80, stroke width 18, `stroke-linecap="butt"`. Baseline ends are flat horizontal cuts flush with the bottom. Emits two colored segments (primary ledger green for Issued, cyan/brass for In-Review) over an unallocated grey track (`--ns-paper-3`). Center content carries a quiet uppercase label (`ISSUED`) above a large bold tabular metric (`$1,240,500.00`).
- **Billing Surface:**
  - **Live Run Console:** The central hero widget of `routes/runs/[id].tsx`, visually reporting the exact proportion of draft invoices that have been successfully finalized and charged vs. exceptions requiring review.

### 3. `SegmentedRangeControl` (`components/ui/segmented-control.tsx`)
- **Visual Spec:** Full-width rounded capsule container with light-ground fill (`--ns-paper-2`) and subtle border. Contains N equal-width cells (`1D`, `1W`, `1M`, `3M`, `1Y`). The active item is a raised white pill (or dark surface in dark mode) with a subtle shadow (`var(--ns-shadow-xs)`); inactive items are transparent, separated by faint vertical 1px hairline dividers.
- **Billing Surface:**
  - **Revenue & Invoicing Analytics:** Timeframe selector on the overview dashboard and customer spend timeline to toggle between 30-day, quarterly, and annual billing run comparisons without full page reloads.

### 4. `ComparisonAreaChart` (`components/ui/comparison-area-chart.tsx`)
- **Visual Spec:** Pure SVG chart enclosed in a hairline rounded frame (`border-radius: 12px`, border `1px solid var(--ns-border)`). Faint horizontal dashed grid lines (`--ns-chart-grid`). Two layered area paths: the background layer is the prior comparison period rendered with `color-mix(in srgb, var(--ns-ledger-6) 18%, transparent)`; the foreground layer is the current period with a solid stroke (`2px var(--ns-ledger-6)`) and a soft gradient fill. X-axis text ticks sit neatly below the bordered container.
- **Billing Surface:**
  - **Billed vs. Collected Cashflow:** Invoiced amount (the comparison shadow) vs. Collected cash (the solid foreground curve) on the finance overview page.

### 5. `FooterColumns` (`components/ui/footer-columns.tsx`)
- **Visual Spec:** An enclosed rounded container spanning the base of a card, divided into 3 equal columns by 1px vertical hairline dividers (`1px solid var(--ns-border)`). Each column is center-aligned, containing an optional tinted icon badge, a quiet 11px uppercase label (`APPROVED`, `EXCEPTED`, `EXCLUDED`), and a bold tabular amount (`$842,000.00`, `$12,400.00`, `$0.00`).
- **Billing Surface:**
  - **Run Summary & Dunning Funnels:** Directly anchors the bottom of the `SemicircularGauge` run widget, breaking down terminal saga outcomes across all run items.
