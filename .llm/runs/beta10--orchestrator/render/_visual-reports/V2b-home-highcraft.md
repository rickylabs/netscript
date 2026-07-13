# V2b — Home + chrome, high-craft pass

**Scope:** Home screen (`isHome`) + app chrome (sidebar `ns-sidenav*` + topbar `ns-topbar2*`) +
mobile bottom sheets. Visual + layout only — no route/logic/data/copy-meaning change. NS One identity
throughout (warm-cream light + dark, hard-offset press shadow, copper/teal/amber, `--ns-*` tokens
only — **no raw hex**, `ns-*` markup that round-trips to Fresh, DM Sans/Mono). Complementary-satellite
doctrine held (no owned waterfall/log-tail/metrics/resource-start-stop).

**Files touched:** `render/prototype.dc.html` (Home markup + shell markup + data model + post-mount
chart drawers + detail-sheet wiring), `render/assets/ns-ext.css` (all new component CSS). `proto.css`,
`_ns_styles.css`, `support.js` untouched.

**Verify status (every iteration, both themes + both viewports 1440×900 / 390×844):**
zero `{{ }}` holes in the DOM, zero console errors, zero horizontal overflow. All 16 nav screens
regression-checked clean (shared file) after the shell/data changes. Mobile detail bottom sheet +
cmdk bottom sheet verified open with zero errors.

Baseline (what this replaces): the KPIs were thin single-layer sparkline tiles, the analysis cards
were flat (bar/donut with no hero, no column-aligned table, no footer button), the "where to look"
tiles had dead space, the command palette was an ungrouped list with no ⌘ chips, "just happened" was a
plain teaser strip, and there were no mobile detail bottom sheets. That was the "thousand miles
behind" state. This pass rebuilds each widget as a bespoke multi-layer composition matched to its
reference archetype.

---

## Per-widget: archetype match, layers, contracts

### 1. Throughput hero + sibling stat tiles — *Conversion-Rate* archetype (`03-analytics-cards`)
The lead KPI (executions/hr) is promoted from a thin sparkline tile to a full hero card; the other
three become richer filled-area stat tiles.

- **Hero card `.ns-throughput`** layers: header (eyebrow `EXECUTIONS / HR` + hero value `270` +
  `/hr` unit + green delta pill `↑ 12%` + top-right `Details` action) → **funnel breakdown table**
  `.ns-funnel` (Dispatched / Completed / Compensated, each = label + mono metric + **colored trend
  arrow+%**, column-aligned, clickable rows) → **filled area chart with baseline grid + hour axis**
  `.ns-areachart` (3 horizontal + 5 vertical grid rules, a dimmer dashed **comparison under-area**
  = prior window, the copper filled area + line, and a `−5h…now` mono axis strip).
- **Sibling tiles `.ns-kpi`** (now buttons, deep-linking): label + `→` reveal-on-hover, hero value +
  delta pill, a one-line context foot (e.g. `webhook · polling · schedule`), and a **filled micro-area
  chart that stretches to fill the tile** (`grid-template-rows: … minmax(40px,1fr)` + `spark height:
  100%`) — no dead space; each tile is a real area chart, not a hairline.
- Before: 4 equal thin sparkline tiles. After: 1 dense hero + 3 filled-area deep-link tiles.

### 2. Wiring health — *Time-Off* archetype (`05-timeoff-workhour-cards`)
Reused + kept the existing `.ns-gaugecard`: radial semi-donut gauge (`16/20 NODES WIRED`, conic-gradient
set imperatively from `data-value`), an `ATTENTION` verdict badge top-right, a divider, then a 3-tile
breakdown row (healthy / degraded / unbound, each = colored dot + mono count + label, clickable).
This already matched the archetype; left as the reference-grade version rather than rebuilt.

### 3. Execution outcomes — *Marketing-Channels* archetype (`03-analytics-cards`)
Rebuilt into the fullest reference card. Layers: header (title + sub + `Runs →` card-action) →
**hero** `.ns-outcomes__hero` (`91.2%` + `↑ +2.1% completed · 287 runs`) → **stacked segmented
channel bar** `.ns-channelbar` (completed/retried/failed, rounded segments w/ gaps) → **dot legend**
`.ns-legend` → **column-aligned data table** `.ns-datatable` with a real header row
(`Primitive / Instances / 24H`), each row = circular icon + label + mono metric + colored trend
arrow → **full-width secondary button** `.ns-fullbtn` (`View run inspector`, mirrors the ref
"View reports"). Before: flat bar + legend + un-headered rows.

### 4. Capability mix — donut + share-table
Donut `.ns-donut` (6 plugins, segmented conic-gradient) + a compact key/value summary `.ns-mixstat`
(busiest Workers / idle Sagas) beside it, then an **aligned share-bar list** `.ns-sharelist`: each
row = colored dot + label + **mini share bar** (`.ns-shareitem__bar/__fill`, width+color token-driven)
+ mono %. Before: a floating unaligned legend list.

### 5. Wiring signals — segmented control + two-line signal rows
Kept the `1H/24H/7D` segmented control `.ns-seg`. Rows rebuilt as `.ns-siglist`/`.ns-sigrow`:
tone-tinted icon tile + **two-line main** (label + mono detail, e.g. `triggers: DLQ port degraded`) +
status pill + trailing chevron `→`. Column-aligned, denser, deep-linking. Before: one-line rows with a
pill and no detail/affordance.

### 6. Incident summary — kept anatomy, copper left-accent
`.ns-incident` retained: `✦` eyebrow + title, causal paragraph, **grounding chips** (`grounded in`
+ `job_4183 / ch_3QK9dR2eZ / override v43`), **action-chip row**, and a mono provenance/model footer.
Already had the copper left-accent border. Dense, not airy — left as reference-grade.

### 7. Where to look — enriched deep-link stat grid
`.ns-statlink` rebuilt: **top row** = tone-tinted icon chip + hero value + status pill; bold label;
2-line clamped detail with `→`; plus a **tone-keyed left accent tick** (`::before`). Before: value +
bare dot + one-line foot with large dead space between. On mobile a tap opens the **detail bottom
sheet** (see §Mobile).

### 8. Just happened — compact live activity feed
`.ns-home__teaser` rebuilt from a horizontal strip into a feed card: head (mini-label + `live` dot +
`Activity log →`) then feed rows `.ns-feedrow` = colored primitive marker dot + event text +
**entity tag** `.ns-tag` + **relative-time pill** `.ns-timepill` (with `◷` glyph) + chevron. Before:
a flat inline teaser with just dot + text + time.

### 9. Command palette + Contributed panels — composed bottom band
- **Command palette `.ns-palettecard`**: a search-bar affordance (`⌕` + placeholder + `⌘K`) then
  **grouped action rows** — `Navigate` / `Act` / `Recent` (`.ns-palettegroup`), each row `.ns-cmdrow`
  = icon + label + kind label + **⌘-shortcut chip** (`G R`, `⌘⇧D`, `⌘O`, `⌘K`). Before: an ungrouped
  4-item list with no shortcuts.
- **Contributed panels**: rebuilt as `.ns-contribtable` — header row (`Plugin / Panel / Mount target`)
  + clickable rows = plugin badge + panel icon + panel name + mono mount + chevron. Tighter row rhythm
  balances the two cards' heights. Before: an airy 3-col grid with big row gaps.

### Chrome — sidebar (ref 01 FAVS/⌘ sidebar)
Kept the existing signature (brand mark + wordmark; grouped nav Overview/Capabilities/Data/System with
icon-tiles + derived badges + active pill + left-accent rail + chevron; rail collapse; workspace card +
profile card pinned at bottom). **Added a PINNED group** `.ns-sidenav__group--pinned`: mono `pinned`
label + `⌘·` hint, then pin rows `.ns-sidenav__pin` = tone dot + label + **⌘-shortcut chip** (Run
Inspector ⌘1, ch_3QK9dR2eZ ⌘2, Runtime overrides ⌘3). Hidden in rail-collapse mode.

### Chrome — topbar (ref 01 greeting header)
Kept the two-line context (eyebrow `netscript · my-app` / title, or breadcrumb + title on inner
routes), the `local · my-app · aspire` env pill (dot state-keyed), the prominent search/⌘K, Open
Aspire ↗, and theme toggle. **Added a primary action button `.ns-topbar2__ask`** (copper `Ask ✦`,
styled like the refs' "Create Request") that jumps to the AI ask box. Open Aspire hides below 1120px so
the primary action always survives.

### Mobile — dedicated bottom sheets (ref `06-mobile-sheets`, REQUIRED)
- **Detail bottom sheet `.ns-detailsheet`** (`dialog[data-part=content][data-side=bottom]`, native DS
  grab-handle + backdrop): a stat/card tap on ≤640px opens it via `openStat()` (desktop deep-links
  straight through). Layers: eyebrow + close, hero (icon chip + value + title + status pill),
  description, a bordered key/value table (`signal / status / jumps to`), and full-width
  `Open <dest> →` + `Dismiss` actions. Wired through `state.detailSheet` + `componentDidUpdate`
  `showModal()/close()`, same pattern as the existing right sheet.
- **Command palette → bottom sheet on mobile**: `.ns-cmdk__backdrop` is pinned to the bottom
  (`inset:auto 0 0 0`), rounded top corners, a `::before` grab handle, and the DS
  `ns-sheet-enter-bottom` animation — reusing the existing cmdk dialog, no new dialog.
- Dense single-column masonry: KPI band → hero full-width then 2-up filled tiles (1-up ≤360px);
  analysis/bottom cards stack; feed rows drop the entity tag; contributed table collapses mount under
  the panel; no horizontal body scroll at any width.

### New chart component types built (token-driven, no SVG `{{ }}` holes)
All geometry is created imperatively in `drawSparks()` → `drawAreaCharts()` / `drawLineCharts()` /
`drawBarCharts()` (called each update via `requestAnimationFrame`; each `querySelectorAll` no-ops when
its element is absent, so they are safe as ready DS primitives):
- **Filled area chart w/ grid + axis + comparison** `.ns-areachart` — *in use* (throughput hero).
- **Line chart w/ crosshair + marker dot + floating value tooltip** `.ns-linechart` — built + CSS
  ready (Stock-Tracker archetype); not yet placed on Home (documented for DS uplift / future leaf
  detail use). Honest note: this component is verified to draw but is not exercised by a Home widget in
  this pass.
- **Bar chart w/ value labels** `.ns-barchart` — same status as the line chart (Product-Performance
  archetype); ready but not placed on Home.

---

## Honest bar assessment
- **At the reference bar:** throughput hero (Conversion-Rate), execution outcomes (Marketing-Channels),
  where-to-look tiles, wiring signals, capability-mix share list, command palette, contributed table,
  just-happened feed, sidebar (incl. pinned ⌘ group), topbar (incl. Ask ✦), both mobile bottom sheets.
- **Kept as already-reference-grade (not rebuilt):** wiring-health gauge (Time-Off) and incident
  summary — both already multi-layer and on-archetype; rebuilding would have been churn.
- **Built but not yet placed on Home:** the line chart (with tooltip) and bar chart (with value
  labels). They are complete, token-driven, and render correctly the moment an element is present —
  but no Home widget's archetype called for them, so forcing them on would read as bolted-on. They are
  captured in the DS ledger below and are ready for the roll-out to leaf/detail screens.

---

## Design-system uplift ledger
Everything a later DS uplift should absorb. All contracts are `ns-*` classes, `--ns-*` tokens only,
NS One identity (round-trips to Fresh, liftable later).

### NEW components (name · `ns-*` class contract · what it does)
- **Throughput hero card** — `.ns-throughput` (`__head`, `__title-wrap`, `__eyebrow`, `__value`,
  `__unit`, `__delta`). Conversion-Rate hero: eyebrow + big value + unit + delta pill + card-action,
  designed to stack a funnel table + area chart beneath. `data-tone` themes the value/chart.
- **Funnel breakdown table** — `.ns-funnel` / `.ns-funnel__row` (`__label`, `__metric`). 3-column
  (label · metric · trend) clickable mini-table for a card's mid layer.
- **Filled area chart** — `.ns-areachart` (`__svg`, `__grid`, `__axis`). Baseline grid + optional
  dimmer dashed comparison under-area + filled area + line + mono axis strip. Props via attributes:
  `data-series` (comma nums), `data-compare` (comma nums), `data-tone`. Shared min/max scale across
  both series. JS: `drawAreaCharts()`.
- **Line chart w/ tooltip** — `.ns-linechart` (`__svg`, `__tip`, `__foot`, `__foot-sep`). Crosshair +
  marker dot + floating value tooltip positioned over the marker; optional open/high/low foot row.
  Props: `data-series`, `data-marker` (index; defaults to peak). JS: `drawLineCharts()`.
- **Bar chart w/ value labels** — `.ns-barchart` (`__bar`, `__fill`, `__val`, `__label`). Vertical bars
  with per-bar value label above and mono axis label below; `data-series` drives fill heights via
  `drawBarCharts()`; `data-tone="muted"` per bar.
- **Column-aligned data table** — `.ns-datatable` (`__head`, `__h`, `__h--num`, `__row`, `__cell--lead`,
  `__cell--num`, `__icon`, `__label`). Header row + circular-icon rows + right-aligned numeric/trend
  columns. Reusable across any "primitive · metric · trend" table.
- **Card-action pill** — `.ns-cardaction`. The reference `Details`/`See All`/`Runs →` top-right
  affordance; lighter than a full `ns-btn`.
- **Full-width secondary button** — `.ns-fullbtn`. The reference bottom-of-card "View reports" button.
- **Outcomes hero** — `.ns-outcomes__hero` (`__value`, `__hero-meta`). Hero % + `vs last week` meta.
- **Share-bar list** — `.ns-sharelist` / `.ns-shareitem` (`__dot`, `__label`, `__bar`, `__fill`,
  `__val`). Aligned dot + label + mini proportional bar + %. `__fill` width/color set inline from data.
- **Mix summary** — `.ns-mixstat` (`__k`, `__v`). Compact key/value block to sit beside a donut.
- **Two-line signal row** — `.ns-siglist` / `.ns-sigrow` (`__icon`, `__main`, `__label`, `__detail`,
  `__pill`, `__chevron`). Icon tile + label/detail + status pill + chevron; `data-tone` on row + icon.
- **Palette group + command row** — `.ns-palettecard__body`, `.ns-palettecard__search`,
  `.ns-palettegroup` (`__label`, `__items`), `.ns-cmdrow` (`__icon`, `__label`, `__kind`, `__kbd`).
  Grouped command list with kind labels + ⌘-shortcut chips + an inline search affordance.
- **Contributed table** — `.ns-contribtable` (`__head`, `__row`, `__plugin`, `__panel`, `__icon`,
  `__mount`, `__chevron`). Plugin-badge + icon + name + mono mount + chevron table.
- **Activity feed row** — `.ns-feedrow` (`__marker`, `__text`, `__chevron`). Colored primitive marker +
  text + trailing chevron; pairs with `ns-tag` + `ns-timepill`.
- **Entity/provenance tag** — `.ns-tag` (`data-tone`). Small mono chip for an entity/provenance label.
- **Time pill** — `.ns-timepill`. Relative/absolute time with a `◷` clock glyph.
- **Detail bottom sheet** — `.ns-detailsheet` (`__inner`, `__head`, `__eyebrow`, `__hero`, `__icon`,
  `__hero-main`, `__value`, `__title`, `__desc`, `__kv`, `__kv-row`, `__kv-key`, `__kv-val`,
  `__actions`). A generic mobile detail sheet body for `dialog[data-side=bottom]`; drive it from a
  `{eyebrow,icon,tone,value,title,pill,pillClass,desc,rows[],cta,go}` payload.
- **Sidebar pinned group** — `.ns-sidenav__group--pinned`, `.ns-sidenav__pinned-label`,
  `.ns-sidenav__pinned-hint`, `.ns-sidenav__pin` (`__pin-dot`, `__pin-label`, `__pin-kbd`). A
  PINNED/RECENT group with tone dots + ⌘-shortcut chips.
- **Topbar primary action** — `.ns-topbar2__ask` (`__ask-glyph`). A primary "Ask ✦" header action slot.

### REFINEMENTS to existing components
- `.ns-kpi` is now a clickable deep-link (button semantics, `__arrow` reveal-on-hover, `__foot` context
  line) and supports a **fill-to-height sparkline** variant (grid-template-rows + `spark height:100%`).
- `.ns-statlink` gained a `__top` row (icon chip + value + pill), a `__detail` 2-line clamp, and a
  tone-keyed `::before` left-accent tick.
- `.ns-trendarrow` gained a `__glyph` inner span so the arrow can be sized independently of the %.
- `.ns-home__kpis` layout changed from `repeat(4,1fr)` to a `1.2fr / 1fr` hero+tiles split, with a
  nested `.ns-home__kpi-tiles` 3-up.

### NEW tokens
None invented — everything reuses existing `--ns-*` (spacing, radius, color-mix on `--ns-primary`
/`--ns-success`/`--ns-warning`/`--ns-destructive`/`--ns-fg`/`--ns-border*`/`--ns-muted*`, fonts,
shadows). A DS uplift *could* promote a few repeated `color-mix(... transparent 82/88/93%)` chart-fill
tints to named tokens (e.g. `--ns-chart-fill`, `--ns-chart-fill-compare`, `--ns-chart-grid`) and a
`--ns-icon-tile-bg` (the repeated `color-mix(in oklab, var(--ns-fg) 5-6%, transparent)`), but none are
required for correctness today.

### NEW variants
- `.ns-panelcard__body--flush` (zero-padding body so an embedded table draws its own edge padding).
- `.ns-areachart[data-tone='success']` (teal area/line variant); extendable to warning/destructive.
- `.ns-barchart__bar[data-tone='muted']`, `.ns-tag[data-tone=...]` tinted variants.

### NEW options / props / data-attributes
- `.ns-areachart` — `data-series`, `data-compare`, `data-tone`.
- `.ns-linechart` — `data-series`, `data-marker`.
- `.ns-barchart` — `data-series` (+ per-bar `data-tone`).
- Detail sheet driven by a structured payload object (see component list) via `state.detailSheet`.
- `openStat(item, navFn)` helper: `matchMedia('(max-width:640px)')` → bottom sheet on mobile, deep-link
  on desktop. A DS could formalise this "tap = sheet on mobile, navigate on desktop" affordance.

### MOBILE optimizations
- Command palette (`.ns-cmdk__backdrop`) transforms into a bottom sheet ≤640px (bottom-pinned, rounded
  top, `::before` grab handle, `ns-sheet-enter-bottom`). Reusable pattern: any centered `ns-cmdk`-style
  dialog can adopt this.
- Generic mobile detail bottom sheet (`.ns-detailsheet` on `data-side=bottom`) — the reusable "tap a
  card for detail" surface.
- KPI band: hero full-width, tiles 2-up (first full-width) then 1-up ≤360px; area-chart hero and
  filled tiles keep their layers on mobile.
- `.ns-feedrow` drops its entity `.ns-tag` on mobile; `.ns-contribtable` collapses the mount cell under
  the panel name and hides the third header.
- `.ns-statlink__value` steps down a size on mobile; all cards single-column with no horizontal scroll.

---

## Screenshots
Final set: `scratchpad/shots-V2b-FINAL/` — `home--{desktop,mobile}--{light,dark}--s{0,1,2}.png`,
`sidebar--{light,dark}.png`, `detailsheet--{light,dark}.png`, `cmdksheet--{light,dark}.png`,
`home--mobile--{light,dark}--drawer.png`.
