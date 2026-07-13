# NS One design-system uplift backlog — accumulated from the dashboard visual passes

**Purpose.** The dashboard visual redesign is deliberately **NOT constrained** to the current NS One
component set — it treats the design pass as the opportunity to **raise the design system's bar**.
Every new/refined component, token, variant, option, and mobile optimization the dashboard needs is
captured here. We do **not** uplift the design system now — we validate the dashboard prototype first.
Once the prototype is signed off, **this ledger drives a design-system uplift** (raising
`@netscript/fresh-ui` / NS One quality, variety, configurability, variants, new components) **before**
the real product is built.

**Standing rule for EVERY visual pass** (put this in every brief):
- Do not limit yourself to existing NS One components. Invent the richer / more refined / more
  configurable component the reference craft demands.
- Keep NS One identity so it round-trips + is liftable: `--ns-*` tokens only (no raw hex), `ns-*`
  class contracts (`ns-<block>` / `ns-<block>--<variant>` / `ns-<block>__<part>`), warm-cream light +
  dark, hard-offset press shadow, copper/teal/amber, DM Sans / DM Mono.
- At the end of the pass, **append** your uplift items to the ledger below.

---

## Ledger (append one block per pass, newest last)

Each pass appends under these headings:

- **New components** — name · class contract · what it does · screens using it
- **Refinements to existing components** — component · what changed · why
- **New tokens** — `--ns-*` · value/intent · why
- **New variants** — `component--variant` · when to use
- **New options / props / data-attributes** — component · option · values · behavior
- **Mobile optimizations** — pattern (bottom sheet / drawer / stacked masonry / breakpoint) · where

<!-- passes append below this line -->

## Pass V3 — Investigation spine (Live Flow S13 + Run Inspector S6)

Refs mined: 04-finance (arc gauge, breakdown tiles, outcome split), 05-timeoff (data-point line +
value tooltip, arc + status list, segmented time), 01-synergy (KV split-panel, left-accent cards),
03-analytics (funnel/step table, channel split + legend), 11/13-devconsole (stat strip, sortable
console table, right drawer, altitude picker), 21-flow-builder (node-graph: node cards + captions +
edge branch-labels + selected ring + properties panel).

### New components
- **`ns-flowhero`** · `.ns-flowhero` / `__gauge` / `__spine` / `__spine-dot[data-tone][data-prim]` /
  `__body` / `__top` / `__route` · flow-summary band (chain-progress arc + mini spine + correlation
  KV split + seam-outcome split) · Live Flow.
- **`ns-fanout`** · `.ns-fanout` / `__leg[data-state]` / `__dot` · subscriber-level delivery fan-out
  (per-sink ok/failed pills) · Live Flow stream node; reusable on Streams.
- **`ns-statstrip`** · `.ns-statstrip` / `__tile` / `__label` / `__value[data-tone]` · console stat
  strip (eyebrow micro-cap + big tone value tiles) · Run Inspector; reusable on all console screens.
- **`ns-runtable`** · `.ns-runtable` / `__head` / `__title` / `__count` / `__cols` / `__col[--sorted]`
  / `__sort` · console-table wrapper (titled head + sortable column header) around an entity rail ·
  Run Inspector; reusable for any entity list wanting a console-table read.
- **`ns-runhero`** + **`ns-runstat`** · `.ns-runhero` / `__gauge` / `__body` / `__top` / `__name` /
  `__corr-note`; `.ns-runstat` / `__tile` / `__val[data-tone]` / `__of` / `__label` · run-summary
  hero (step arc + correlation KV split + attempt/compensation breakdown) · Run Inspector; reusable
  on Sagas/Workers detail.
- **`ns-runrow`** · `.ns-runrow` / `__glyph[data-prim]` / `__body` · entity-rail row with a primitive
  glyph tile · Run Inspector; reusable on any capability rail.
- **`ns-seamrail`** (composed, not a single class) · desktop seam-detail properties rail (KV +
  deep-links + grounded assist) that folds to a bottom sheet on mobile · Live Flow.

### Refinements to existing components
- **`ns-journey`** → `--rich` variant · card-row nodes, tinted glyph tiles, right seam-value chip
  (`ns-journey__val`, tinted by `[data-state]`), semantic caption pill (`__sub`/`__caption`),
  connector edge branch-labels (`__edge`), selected copper accent + ring, `__spawn` hint, `__legend`
  · because the journey must read as a composed causal node-graph, not stacked text (ref 21).
- **`ns-flowrow`** → `__chain` / `__chaindot[data-tone][data-prim]` mini seam-chain preview + seam
  count · so each correlation previews its shape in the rail.
- **`ns-gauge`** → `__of` (denominator) + `__label` (micro-cap) parts · so the arc gauge reads as a
  fractional progress (`2/5`, `2/4`) not only a percentage. Reuses existing `drawGauges` geometry.
- **`ns-kv`** → `--split` variant (auto-fit split-panel, left-aligned values) · correlation header
  pattern from ref 01.
- **`ns-step-timeline`** → `--data` variant · `__n` step number, right `__datum` chip (tinted by
  `[data-state]`), active-step floating value tooltip (`__tip`, `[data-tip='1']`), and a bolder
  **indented compensation lane** (gutter `⟲` + warning rail) so the rollback branch is unmistakable.
- **`ns-logstrip`** → 2-row line (ts·resource / message) + severity dot · fixes resource/message
  truncation in narrow rails and on mobile.
- **seam-detail bottom sheet** → `ns-seamsheet-hero` badge header (primitive + status).

### New tokens
- None — everything composed from existing `--ns-*` tokens (no raw hex).

### New variants
- `ns-journey--rich`, `ns-kv--split`, `ns-step-timeline--data`.

### New options / data-attributes
- `ns-flowhero__spine-dot[data-tone][data-prim]`, `ns-flowrow__chaindot[data-tone][data-prim]`,
  `ns-fanout__leg[data-state]`, `ns-statstrip__value[data-tone]`, `ns-runstat__val[data-tone]`,
  `ns-runrow__glyph[data-prim]`, `ns-runtable__col--sorted`/`__sort`,
  `ns-step-timeline__datum` (tinted by `[data-state]`), `ns-step-timeline__step[data-tip='1']`.

### Mobile optimizations
- **Live Flow seam-detail = dedicated bottom sheet** (viewport-branched click handler; desktop 3rd
  column `.ns-seamrail` hides < 1440px).
- `ns-flow-grid` responsive: `1fr` → `16rem 1fr` (≥1024) → `16rem 1fr 19rem` (≥1440).
- `ns-statstrip` → 2×2 on mobile; `ns-flowhero`/`ns-runhero` → single column < 720/560px.
- `ns-logstrip` 2-row line stays legible at 390px.

## Pass V4 — Workers + Sagas

Refs mined: 11 devconsole-a (breadcrumb + stat strip + sortable data table + right drawer), 12
devconsole-b (tab row + toolbar), 13 devconsole-c (text-valued stat / cause naming), 19 pm-dashboard
(table with a status-pill column), 21 flow-builder (node-graph: pill nodes + edge branch-labels +
selected ring → the saga state machine), 09 analytics (stacked category bar → runtime-mix).

Deliberate constraint honored: **Workers is table-forward, Sagas is diagram-forward** — different
hero, dominant component, and grid rhythm so the two consoles never read as one template.

### New components
- **`ns-conhead`** · `.ns-conhead` (scopes denser stat tiles) · console-header wrapper (breadcrumb +
  tab row + stat strip). · Workers, Sagas; every console + control-plane screen.
- **`ns-conbread`** · `.ns-conbread` / `__crumb` / `__crumb--here` / `__sep` · in-content breadcrumb.
- **`ns-contab`** · `.ns-contab` / `__btn[data-state='active']` / `__count` · console **tab row**
  (underlined active tab + count pill). · Workers (Registry/Executions/Pools/Drift), Sagas.
- **`ns-contoolbar`** · `.ns-contoolbar` / `__search` / `__search-ico` · table toolbar (search + slots).
- **`ns-rtchips` / `ns-rtchip`** · `.ns-rtchip[data-state]` / `__dot[data-rt]` · `?runtime=` filter
  chips (they filter the registry). · Workers.
- **`ns-rtbadge`** · `.ns-rtbadge` / `__dot[data-rt]` · runtime badge column (deno/python/shell/
  dotnet/pwsh colored dot). · Workers; reusable for any polyglot/kind marker.
- **`ns-runtimemix`** · `.ns-runtimemix` / `__bar` / `__seg[data-rt]` / `__legend` / `__leg` · stacked
  runtime-distribution bar + dot legend (ref 09). · Workers; reusable for any categorical split.
- **`ns-contable`** · `.ns-contable` / `__scroll` / `__t` / `__th[--sorted][--r]` / `__sort` /
  `__row[data-state]` / `__td` / `__name` / `__sub` / `__sched` · dense sortable console table
  (Workers hero). · The canonical dense table for Catalog/DLQ/Auth/Migrations.
- **`ns-drawer`** · `.ns-drawer` / `__head` / `__title` / `__body` / `__section-label` / `__tabs` /
  `__tab` · right detail drawer (folds to bottom sheet on mobile). · Workers; reusable console detail
  surface (Run Inspector, DLQ, Auth).
- **`ns-poolmeter`** · `.ns-poolmeter` / `__row[data-state]` / `__pulse` / `__q` / `__consumers` /
  `__cnum` · liveness rows with a heartbeat **pulse** + destructive dead-queue state. · Workers;
  reusable on Streams (subscriber liveness) + DLQ.
- **`ns-driftpanel` / `ns-driftrow`** · `.ns-driftrow[data-state]` / `__dot` / `__main` / `__probe` /
  `__result` / `__cause` · drift rows that **name the cause** (`override v43`) + deep-link assist. ·
  Workers; reusable on Runtime/Config/Migrations.
- **`ns-sagahero`** · `.ns-sagahero` / `__gauge` / `__body` / `__top` / `__name` · compensation-state
  summary band (state arc + correlation split + breakdown). · Sagas; any state-machine primitive.
- **`ns-durabar`** · `.ns-durabar[data-tier]` / `__pips` / `__pip` / `__label` · durability-tier pip
  viz. · Sagas; reusable for any guarantee/tier dimension (Streams delivery, DLQ backend).
- **`ns-smd`** · `.ns-smd` / `__lane[--comp]` / `__lane-label[data-lane]` /
  `__node[data-state][data-current]` / `__pill` / `__glyph` / `__cap` / `__edge[data-lane]` /
  `__edge-label` / `__edge-line` · **saga state-machine mini-diagram** — forward pill-nodes + edge
  branch-labels + a distinct dashed rollback lane + current-node ring (ref 21). · Sagas hero; the
  reusable small state/flow diagram for Config topology, Trigger composite chains, any branching flow.

### Refinements to existing components
- **`ns-statstrip`** → `--5` variant (2→3→5 responsive) + a `ns-conhead`-scoped denser tile (shorter
  padding, `text-xl` value) so console-header strips read tighter than the S6 default.
- **generic right sheet** → viewport-branched `data-side` (right on desktop, **bottom on mobile**),
  so one dialog is both a desktop detail drawer and a mobile bottom sheet (now used by Workers
  row-detail in addition to S2/S13).
- **`ns-step-timeline--data`** → reused on Sagas with per-step **datum chips** from the saga history
  (`208ms` / `E_TIMEOUT` / `ref_102`); proves the V3 variant generalizes beyond Run Inspector.

### New tokens
- None. `.NET` runtime swatch uses `color-mix(in oklab, var(--ns-fg), var(--ns-card) 25%)` (theme-
  correct in both modes, no raw hex).

### New variants
- `ns-statstrip--5`, `ns-smd__lane--comp`, `ns-driftrow[data-state]`, `ns-durabar[data-tier]`.

### New options / data-attributes
- `ns-rtchip[data-state]` + `__dot[data-rt]`, `ns-rtbadge__dot[data-rt]`,
  `ns-runtimemix__seg[data-rt]` (deno/python/shell/dotnet/pwsh), `ns-contable__row[data-state]`,
  `ns-contable__th--sorted`, `ns-poolmeter__row[data-state='failed']`, `ns-driftrow[data-state]`,
  `ns-durabar[data-tier]`, `ns-smd__node[data-state][data-current]`, `ns-smd__edge[data-lane='comp']`,
  `ns-contab__btn[data-state='active']` + `__count`.

### Mobile optimizations
- `ns-contable` scrolls horizontally inside its own `__scroll` container (body never scrolls at 390).
- Workers registry-row → **dedicated bottom sheet** (viewport-branched `data-side` = bottom < 640px).
- `ns-smd` lanes wrap to multiple rows on narrow viewports (no h-scroll); rollback lane stays railed.
- `ns-statstrip--5` steps 2→3→5; `ns-sagahero` → single column < 560px.
