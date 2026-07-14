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

## Pass V4b — Sagas canvas

The V4 Sagas screen was rejected: the state machine was a mini-diagram (`ns-smd`) *inside* the shared
3-column console template (list → hero card → transitions rail), so it read as the same screen as
every other console. V4b promotes the state machine to a **full-bleed n8n / flow-builder node-graph
canvas** (ref 21) with a **click-to-open properties sidebar**, making Sagas a fundamentally different
*kind* of screen. The `ns-smd` mini-diagram remains in the ledger as the reusable small inline
variant; `ns-sgc` is the new canvas-scale primitive.

### New components
- **`ns-sgc`** · `.ns-sgc` (frame: canvas + docked properties sidebar; stacks < 1024px) · the
  **saga-graph-canvas screen frame** — a dominant canvas column + a 21–23rem properties sidebar. ·
  Sagas; the reusable canvas-forward screen shell for any node-graph route (Config topology at
  screen scale, a Trigger composite builder, a Journey composition).
- **`ns-sgc__canvas` / `__stagewrap` / `__grid` / `__edges`** · dotted-grid full-bleed **canvas
  stage** (two radial-gradient dot layers, theme-blind) with an absolute SVG **edge layer** drawn
  post-mount from `getBoundingClientRect()` (no SVG `{{ }}` holes). · Sagas; the canvas substrate for
  any spatial graph.
- **`ns-sgc__node[data-lane][data-state][data-current][data-selected]`** · `__node-head` / `__tile`
  / `__name` / `__dot` / `__cap` / `__foot` / `__metric` · a **state-node card** (icon tile + name +
  live state dot + capability + timing/attempt foot), state-tinted, with a copper **selected ring**,
  a dashed **current ring**, a **pulsing** live dot (running/retrying), and a warning left-rail for
  compensation-lane nodes. · Sagas; the reusable graph-node card.
- **`ns-sgc__switcher` / `__inst[data-state]` / `__inst-dot[data-tone]` / `__inst-corr`** · a slim
  horizontal **instance switcher strip** (status-dot chips, selected = copper ring) that replaces the
  fat left instance column. · Sagas; reusable wherever "which instance/run am I viewing" needs a
  compact top control instead of a rail.
- **`ns-sgc__toolbar` / `__tool[data-variant]` / `__tool-zoom` / `__tool-sep`** · a floating **canvas
  toolbar** (zoom −/%/+, ⤢ fit, ✦ assist) pinned bottom-center (ref 21 bottom bar). · Sagas; reusable
  on any canvas.
- **`ns-sgc__props` / `__props-head` / `__props-eyebrow` / `__props-title` / `__props-tile` /
  `__props-name` / `__props-section[-label]` / `__props-clear` / `__props-payload`** · the
  **properties sidebar** — instance summary by default (gauge + KV + why-assist + instance actions),
  node detail when a node is picked (status badge + KV of timing/attempt/lane + transitions + payload
  + node action). · Sagas; the reusable "click node → configure" inspector, folds to a bottom sheet
  < 1024px.
- **`ns-sgc__trans` / `__trans-row[data-lane]` / `__trans-dir`** · in/out/compensation **transition
  rows** (directional glyph `←`/`→`/`⇢`, warning-toned for the compensation edge). · Sagas; reusable
  node-transition list.
- **`ns-sgc__lane-tag[data-lane]`** · floating **lane rails** ("forward path" / "⟲ compensation ·
  rollback lane") pinned to the canvas edge (JS-positioned above the rollback row); hidden on mobile.
  · Sagas; reusable lane annotation for any multi-lane canvas.
- **`ns-sgc__edge[data-lane][data-state]` / `__edge-arrow` / `__edge-label[-bg]`** · JS-measured
  bezier **connectors** — forward (solid, arrow →), a **cross-edge** (dashed warning, arrow ↓, drops
  the failed forward state into the rollback lane), a **reverse rollback lane** (dashed warning), each
  with a floating branch **label + backing chip**; edges touching the selected node recolor copper. ·
  Sagas; the reusable measured-connector layer (companion to `ns-stackmap`'s `measureEdges`).

### Refinements to existing components
- **generic right sheet** → now also serves the **Sagas node bottom sheet** on mobile (`sheet: 's8'`,
  `sheetIsS8`): tapping a canvas node < 1024px opens the same properties content as a bottom sheet
  (in addition to S2/S7/S13 reuse). One dialog, four screens.
- **`ns-durabar`** → relocated into the Sagas page-header toolbar (durability tier as a header chip)
  now that the left instance rail is gone; unchanged contract.
- **`ns-sagahero` gauge / `ns-kv--split` / `ns-assist`** → recomposed **inside** the properties
  sidebar (instance-summary mode) rather than as a standalone hero band, proving they compose in a
  narrow inspector column, not just a wide hero.
- **`measureEdges` pattern** → generalized into a second measured-geometry drawer
  (`measureSagaEdges` / `scheduleSagaEdges`), wired to resize + route-enter + instance-switch +
  node-select, and suppressed < 640px (single-column stack) exactly like the stackmap. Establishes
  the measured-connector approach as a repeatable primitive, not a one-off.

### New tokens
- None. The dotted grid uses `radial-gradient(color-mix(in oklab, var(--ns-fg), transparent 88%) …)`;
  node/edge tints reuse the existing success/warning/destructive/primary subtle + border families and
  `color-mix`. Fully theme-blind, no raw hex.

### New variants
- `ns-sgc__node[data-lane='comp']` (warning-railed rollback node), `ns-sgc__edge[data-lane='comp']`
  (dashed reverse) + `[data-lane='cross']` (dashed drop-in), `ns-sgc__inst[data-state='selected']`,
  `ns-sgc__tool[data-variant='assist']`, properties sidebar `mode: 'summary' | 'node'`.

### New options / data-attributes
- `ns-sgc__node[data-col][data-row]` (grid placement → measured connector endpoints),
  `[data-state]` (completed/running/retrying/failed/queued), `[data-current]`, `[data-selected]`,
  `[data-lane]`; `ns-sgc__inst-dot[data-tone]`; `ns-sgc__edge[data-lane][data-state]` +
  `ns-sgc__edge-arrow` / `ns-sgc__edge-label` mirrors; `ns-sgc__trans-row[data-lane]`;
  `ns-sgc__lane-tag[data-lane]`. The saga node model gained `col`/`lane`/`timing`/`attempt`/`payload`/
  `trans`/`action` fields (data-driven; no-compensation instances render only the forward lane).

### Mobile optimizations
- The canvas **stacks to a single readable column < 640px** (JS suppresses edge geometry, matching
  the stackmap); comp nodes keep their warning left-rail so the rollback lane stays distinct without
  the floating lane tags (which are hidden on mobile).
- **Tapping a node opens a dedicated bottom sheet** (properties content) via the viewport-branched
  generic sheet — the mobile equivalent of the desktop docked sidebar.
- The instance switcher strip **scrolls horizontally** (body never scrolls); the properties sidebar
  reflows to a full-width block under the canvas < 1024px.
- Canvas toolbar stays pinned bottom-center at every width.

## Pass V4b-fix — Sagas canvas density + bespoke surrounding sections

Density pass answering the adversarial-vision gate (canvas was ~75–80% empty grid). Fills the void
with tailored, data-driven, JS-measured content and elevates the surrounding sections from generic
chrome into bespoke saga components. Visual + layout only; NS One tokens only (no raw hex); no SVG
`{{ }}` holes. Canvas cell-coverage 29% → 47% (desktop 1440).

### New components
- `ns-sgc__minimap` / `ns-sgc__mm-*` — a **definition mini-map**: ~204×112 topology thumbnail docked
  bottom-right, drawn post-mount by `drawSagaMinimap` from `machine.def`, with the current instance
  path overlaid in teal (forward) / amber (rollback) and the selected node ringed copper. Reusable
  bird's-eye navigator for any node-graph route.
- `ns-sgc__lanestat` / `ns-sgc__lanestat-cell` — a **per-lane compensation-health stat strip** (ref-11
  stat bar adapted to saga lanes): slim single-line `label:value` pill beside each lane tag, per
  instance; the comp strip is JS-pinned above the rollback row and absent on no-rollback instances.
- `ns-sgc__rail` / `ns-sgc__rail-pip` — a **step-execution rail**: left-edge pips (pending → … →
  terminal), state-tinted, current step enlarged with a copper halo. Reusable playhead/scrub rail.
- `ns-sgc__anno` (`annoCard`) — a **rich on-wire edge annotation card**: error badge + branch label +
  payload snippet on the failing→compensating cross-wire (ref-21 labeled connectors).
- `ns-sgc__legend` — a **canvas node-identity legend** (forward/compensation/terminal/ghost), balances
  the mini-map bottom-left.
- `ns-sghealth` / `ns-sghealth__*` — a **saga-health composite band** (replaces four plain number
  cards): compensation-rate radial meter (conic `--v`), in-flight vs terminal split, instances-by-state
  stacked channel bar + legend, forward↔rollback edge ratio.
- `ns-sgtable` / `ns-sgtable__*` — a **dense sortable columnar step table** (ref-11): sortable headers
  with caret, inline error badge, comp rows `↩`-marked + tinted. Replaces the airy step timeline.
- `ns-sgc__tabs` / `ns-sgc__tab` / `ns-sgc__tabpanel` — a **tabbed node inspector** (State /
  Transitions / Evidence / Actions; ref-11 drawer tabs, active = copper text + 2px underline). Drives
  the desktop sidebar and the mobile bottom sheet.
- `ns-sgstream` / `ns-sgstream__*` — a **typed transition stream** grouped by instance: rows are typed
  transitions (advance `→` / compensate `↩` / terminal `◼` / fault `✕`), glyph-blocked + tone-coded +
  timestamped, with a legend key. Replaces the generic activity-feed Transitions panel.

### Refinements to existing components
- `measureSagaEdges` gained an `annoCard` helper and a `drawSagaMinimap` call (drawn at any width, so
  the mini-map folds into the mobile stack while edge geometry is suppressed).
- `ns-sgc__node` gained a `[data-role]` chromatic-identity accent (teal/copper/neutral top strip) and a
  `[data-ghost]` ~30%-opacity wireframe treatment for queued scope states — layered over the existing
  state tints (the live dot still reads state).
- `ns-sgc__canvas` firm `min-height` + larger bottom padding reserve a clean bottom band so the
  mini-map never collides with a row-2 rollback node on short instances; grid `row-gap` widened so the
  comp lane tag + health strip band fits between forward and rollback rows.

### New tokens
- None. All new tints are `color-mix` over existing `--ns-teal-*` / `--ns-copper-*` / `--ns-amber-*` /
  success/warning/destructive/primary families. Theme-blind, no raw hex.

### New variants / data-attributes
- `ns-sgc__node[data-role='fwd'|'comp'|'terminal']`, `[data-ghost='1']`;
  `ns-sgc__lanestat[data-lane]`, `ns-sgc__lanestat-val[data-tone]`;
  `ns-sgc__rail-pip[data-rail][data-tone][data-now]`;
  `ns-sgc__mm-node--{fwd,comp,active,sel}` / `ns-sgc__mm-edge--{comp,active}`;
  `ns-sgc__tab[data-active]`; `ns-sgtable__th[data-active][data-dir]`, `ns-sgtable__row[data-comp]`;
  `ns-sgstream__gl[data-type='advance'|'compensate'|'terminal'|'fault']`;
  `ns-sghealth__seg[data-tone]` / `ns-sghealth__meter` (`--v` conic). Saga machine model gained
  `def` (mini-map topology + current `path`), `laneHealth`, `rail`, `crossAnno` per instance;
  view-model gained `s8Health`, `s8StepTable` (sortable via `s8SortKey`/`s8SortDir`), `s8FeedGroups`,
  `s8Tabs`/`s8TabIs`/`s8Evidence`, `s8Rail`, `s8FwdHealth`/`s8CompHealth`.

### Mobile optimizations
- Mini-map folds to a static full-width block; lane-health strips + saga-health band stack; step rail
  and canvas legend hide on the single-column stack. Step table scrolls inside `overflow-x:auto` (body
  never scrolls). Node tap → the tabbed bottom sheet. All verified 0 holes / 0 overflow / 0 errors at
  390 in both themes.

## Pass V5 — Triggers (S9)

Triggers redesigned as a bespoke **rules-and-firings console** (when→do rules). Distinct from the
Sagas node-canvas and the Workers registry table; shares only the console chrome (breadcrumb /
statstrip / contable shell / sheet-dialog) for family consistency.

### New components
- `ns-tcat` — tinted **category-health band** (schedule=copper · webhook=teal · event=amber ·
  manual=muted). Composite card: glyph tile + count + blurb + 12-bucket aggregate firing **sparkbar**
  (CSS `height:%`) + foot with armed/silenced state pill + 24h fires. Click toggles a category
  filter. Replaces plain number cards as the header treatment. (tinted category cards — ref 19/08.)
- `ns-tbuild` — **rule builder**: `WHEN` node → dashed `ns-tbuild__wire` connector with an
  `if <condition>` chip + ▶ arrow → `DO` node, plus `ns-tbuild__palette` action-type tiles with the
  wired action highlighted. Horizontal rule sentence (deliberately unlike Sagas' vertical canvas).
  (node-graph + component palette — ref 21-flow-builder.)
- `ns-tdaystrip` — **schedule day-strip**: 7 day tiles, discrete cron/schedule pips + a continuous
  **poll band** (`repeating-linear-gradient`) for interval triggers, today tinted. `ns-tnext`
  next-fire countdown cards (imminent = copper accent). (day-strip + timed cards — ref 19-pm-dashboard.)
- `ns-thist` — **firing-history table**: reuses `ns-contable`; sortable headers (JS sort, asc/desc
  arrow via `data-dir`), `ns-tcatbadge` type badges, `ns-trend` 24h sparklines, outcome pill,
  latency mono cell, inline arm switch, strike-through disabled rows. `ns-catfilter` filter pill.
  (sortable dense table — ref 11/13-devconsole.)
- `ns-tdrawer` + `sheet:'s9'` — **per-trigger detail drawer → mobile bottom sheet** on the shared
  `ns-sheet-dialog`: category badge + outcome pill + `when → do` rule summary + KV facts + inner
  tabs (Action chain / Payload / Schedule) + Open-run / Silence actions. (right drawer w/ docs tabs
  — ref 11-devconsole.)
- `ns-tdlq` (dead-letter fill-meters) + `ns-tingress` (verb+path chip over payload editor) — the
  secondary strip.

### New tokens
- None. Category tints are a `[data-cat='…']` variable block (`--tcat` / `--tcat-subtle` /
  `--tcat-border`) mapped via `color-mix` onto existing `--ns-primary` / `--ns-success` /
  `--ns-warning` / `--ns-muted-fg`. Theme-blind, no raw hex.

### New variants / data-attributes
- `ns-tcat__card[data-cat][data-state='selected'][data-tone]`, `ns-tcat__state[data-tone]`;
  `ns-tcatbadge[data-cat]`; `ns-tbuild__node[data-role='when'|'do'][data-cat][data-tone]`,
  `ns-tbuild__chip[data-tone][data-state='active']`, `ns-tbuild__armpill[data-on]`;
  `ns-tdaystrip__day[data-today]`, `ns-tdaystrip__pip[data-tone]`, `ns-tdaystrip__poll`;
  `ns-tnext__card[data-tone]`; `ns-thist__th[data-active='sorted'][data-dir]`,
  `ns-thist__row[data-off]`; `ns-catfilter[data-active]`; `ns-tdlq__row[data-tone]`.
- S9 model gained a `CAT`/`CAT_META` taxonomy + `trigFleet` (src/when/cond/does/last/next/lat/
  fired24/fires per trigger); view-model gained `s9Cats`, `s9StatTiles`, `s9Builder`, `s9Palette`,
  `s9Days`, `s9NextFires`, `s9SortCols`, `s9Hist` (sortable via `s9Sort`/`s9SortDir`), `s9Detail`
  (tabbed via `s9SheetTab`), `s9Cat` filter, `s9Sel` selection. `sheetIsS9` branch added.

### Mobile optimizations
- Category band folds 4→2×2 (<900) then keeps 2-col (<560) with shorter sparkbars; rule-builder flow
  rotates to vertical (<720) with a vertical dashed wire + rotated arrow; day-strip stays 7-col with
  tightened gutters + micro fonts (<560); firing table scrolls inside `overflow-x:auto` (body never
  scrolls); row tap → tabbed bottom sheet. Verified 0 holes / 0 overflow / 0 errors at 390, both
  themes.

## Pass V5-fix — Triggers

Adversarial-gate fix pass (gate 55/100 ACCEPT-WITH-FIXES). Kept the bespoke bones (category band,
WHEN→DO builder, 7-day day-strip, firing-history sparkline table, tabbed drawer); rebuilt the five
sections that still read as generic dashboard chrome. Visual/layout only, NS One identity, no raw
hex, no SVG `{{ }}` holes. All CSS appended under the Pass V5 block in `ns-ext.css`.

### New components / refinements
- `ns-tmetric` — **iconified metric strip** replacing the five plain `ns-statstrip` number boxes.
  Each tile = type-glyph chip + value + a meaningful micro-viz: `ns-tmetric__spark` (12-bar
  sparkline, e.g. fires/flame), `ns-tmetric__meter` (armed/total ratio bar), `ns-tmetric__trend`
  (`↑ +6%` / `↑ +3`, CSS-glyph via `data-dir`), and a quiet `ns-tmetric__sub` label. Neutral-value
  tiles can still carry an accent glyph+spark via `data-spark-tone` (fires stays copper without
  recoloring the number). (ref 19 summary-stats bar.)
- `ns-thquery` — **firing-history inline query toolbar** above the table: `ns-thquery__search`
  (WIRED quick-search, filters rendered rows by trigger/action name, with a clear ×),
  `ns-thquery__select` × 2 (outcome family + show-limit), a dashed `ns-thquery__addfilter`
  ("+ Add JS filter") affordance, and a right-aligned `ns-thquery__count`. (ref 11 records-table
  toolbar.)
- `ns-tdlt` — **dead-letter mini-table** replacing the two `ns-tdlq` progress bars: per-row
  type-colored left bar (`data-tone`), id + queue tag (`ns-tdlt__q`) + age, error snippet, source
  trigger + retry-count, and inline `ns-tdlt__act` Retry/Inspect buttons. `ns-tdlqsum` header pill
  keeps the one-line `redis 14 · memory 3` depth summary; `ns-tdlt__foot` keeps the top-offender
  line + Open-DLQ button. (ref 11 record log.)
- `ns-tcat__idle` + `ns-tcat__spark[data-hollow]` — **hollow-category empty-state**: a 0-fires card
  (Manual) flattens its bars to a dashed baseline and overlays "NO FIRES · 24H"; the foot line reads
  `silenced · CLI-only` / `armed · awaiting invoke` (data-driven `emptyLabel`) so no card is a void.
  Card header padding + gap tightened for density.
- `ns-tnext` schedule cards — **temporal treatment**: `ns-tnext__head` (id + `ns-tnext__kind` pill:
  CRON/INTERVAL/SCHEDULE), a `ns-tnext__prog` **progress-to-next-fire bar** (elapsed vs interval),
  cadence label in the meta line, and a type-colored left bar. (ref 19 schedule blocks.)

### New tokens
- None. New surfaces reuse `--ns-primary` / `--ns-success` / `--ns-warning` / `--ns-destructive` /
  `--ns-muted-fg` and the existing `--tcat` category-tint block via `color-mix`. Theme-blind, no hex.

### New variants / data-attributes
- `ns-tmetric__tile[data-tone][data-spark-tone]`, `ns-tmetric__trend[data-dir]`,
  `ns-tmetric__meter-fill[data-tone]`, `ns-tmetric__bar`; `ns-tcat__spark[data-hollow]`,
  `ns-tcat__card[data-hollow]`; `ns-tnext__kind[data-tone]`, `ns-tnext__prog-fill[data-tone]`;
  `ns-tdlt__row[data-tone]`, `ns-tdlt__q[data-q]`, `ns-tdlqsum[data-tone]`; `ns-thquery__*`.
- S9 model gained `s9DeadLetters` (5 failed firings), `s9Query`/`s9Outcome`/`s9Limit` state +
  wired filtering (`s9HistShown`, `s9HistCount`), plus `hollow`/`emptyLabel` on `s9Cats`,
  `progressPct`/`span`/`kindLabel` on `s9NextFires`, and `glyph`/`spark`/`meter`/`trend`/`sub` on
  `s9StatTiles`.

### Mobile optimizations
- `ns-tmetric` folds 5→3 (<940) →2 (<560) with smaller glyph + value; `ns-thquery` wraps (search
  full-width, count drops its `margin-left:auto`); `ns-tdlt` rows keep their 3-col grid with
  tightened gutters. Verified 0 holes / 0 overflow / 0 errors at 390, both themes; 16-route
  regression clean.
