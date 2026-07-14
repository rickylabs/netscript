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

## Pass V6 — Streams

Streams was rebuilt from a fan-out delivery inspector into a **durable-stream / topic console**
(Kafka/Conduktor mental model, refs 11/12/13) with a live-throughput identity (ref 04) and a
lag-heat treatment (ref 10). Every section is bespoke and stream-native; it shares no signature
component with Sagas (canvas), Workers (registry), or Triggers (`ns-tmetric`/`ns-tdlt`). Only
`prototype.dc.html` + `assets/ns-ext.css` changed; `support.js`/`_ds`/`_ns_styles` untouched.

### New components
- `ns-strhealth` — **streams-health composite header strip** (4 tiles, each with a micro-viz):
  throughput + `ns-trend` sparkline, consumer-lag + backpressure dot, partition **pips**
  (per-partition in-sync colour), retention + replication. Replaces plain number cards. (ref 11/13
  stat strip.)
- `ns-strhero` — **live throughput hero**: a JS-measured teal area chart (`drawStreamsHero()`,
  post-mount, no SVG holes) with a **hover crosshair + floating value tip** (`x msgs/s · −Ns`) that
  snaps to the nearest sample on `pointermove`, a peak/avg/floor/window **OHLC footer**, and a
  pulsing **backpressure pill**. (ref 04 stock-tracker line + crosshair + OHLC.)
- `ns-strtopo` — **producer → log → consumer topology** in div/CSS: producer nodes (copper edge) →
  dashed lead → partitioned-`log` node (with lag-tinted partition bars) → a **fan bus** that taps
  each consumer group node (teal/amber/red edge by lag). No canvas. (ref 21 flow feel.)
- `ns-strledger` — **partition & offset ledger**: Part(idx+in-sync ◆)/Leader/Head/Committed/**inline
  lag heat-bar + value**/Group, monospace; row `data-tone` from lag; horizontal scroll on mobile.
  (ref 11/12 record table re-cast to partition rows.)
- `ns-strheat` — **partition × time lag heatmap**: 6 rows × 8 window cells, `data-v` 0–4 tint from
  `--ns-warning`→`--ns-destructive` via `color-mix`, plus a lag legend. On Consume + Partitions
  tabs. (ref 10 retention heat-triangle.)
- `ns-strgroup` — **consumer-group lag cards**: a shared `ns-gauge` **radial lag gauge** + status
  badge + members/partitions/guarantee KV + a lag progress bar; red left edge when lagging.
- `ns-strtail` — **live event tail**: offset·part·key·value·age, monospace, dense, tone-marked, with
  a live-pulse header. (Consume-tab record stream.)
- `ns-strdrawer` — **stream detail drawer** (desktop right rail): message picker + fan-out delivery
  `ns-step-timeline` + Open-run / View-trace actions.
- `ns-strschema` — **line-numbered Avro record schema** on the Config tab (ref 13 schema view).
- `ns-strlive` — reusable live-pulse pill (teal dot, `ns-strpulse` keyframe, respects
  `prefers-reduced-motion`).

### New tokens
- None. All surfaces reuse `--ns-primary` / `--ns-teal-5` / `--ns-copper-6` / `--ns-warning` /
  `--ns-destructive` / `--ns-muted` / subtle variants via `color-mix`. Theme-blind, no hex.

### New variants / data-attributes
- `ns-strhealth__tile[data-tone]`, `ns-strhealth__pip[data-tone]`, `ns-strhealth__bp[data-tone]`;
  `ns-strhero__chart[data-crosshair][data-marker]` (drives `drawStreamsHero`), hero svg parts
  `[data-part='hero-cross'|'hero-dot']`; `ns-strtopo__node[data-role][data-tone]`,
  `ns-strtopo__spine--fan`; `ns-strledger__row[data-tone]`, `ns-strledger__lagbar[data-tone]`;
  `ns-strheat__cell[data-v='0..4']`; `ns-strgroup[data-tone]`, `ns-strgroup__lagbar-fill[data-tone]`;
  `ns-strtail__row[data-tone]`.
- S10 model gained topic facts (partitions/inSync/replication/retention/backend), a 24-pt throughput
  series (+ peak/avg/floor/marker/spark), `s10Groups` (lag/status/gauge %), `s10Parts` (head/
  committed/lag/tone), `s10Heat` (6×8), `s10Records`, `s10Producers`/`s10Consumers`, `s10Schema`,
  and a `s10Tab` (`consume`/`partitions`/`consumers`/`config`) deep-linked via `?tab=`. The prior
  message/fan-out/feed data is preserved and now feeds the drawer.

### Mobile optimizations
- `ns-strhealth` folds 4→2 (<720); `ns-contab` wraps; `ns-strhero` + `ns-strtopo` collapse to one
  column (<1024 / <720, topology spine rotates); `ns-strledger` scrolls horizontally inside its
  panel so the body never scrolls sideways; heatmap cells shrink; gauges + tail + drawer stack.
  Verified 0 holes / 0 overflow / 0 non-404 errors at 1440 + 390, both themes; 16-route desktop +
  7-route mobile regression clean.

### Known follow-ups
- Topology is a div/CSS flow, not a measured-connector horizontal graph (log node + consumer bus not
  perfectly colinear at desktop width).
- Throughput/heatmap/records are a data-driven snapshot, not wired to the live `tick()` sim yet.
- Consumers tab left column slightly shorter than the right rail (mild whitespace).

## Pass V7 — Config Resolution

Replaced the S2 topology stackmap (`ns-stackmap` node-canvas + tree-nav — a wiring view, not a config
view) with a bespoke **layered-precedence resolution** screen centered on a **precedence waterfall**
metaphor no other screen has. Deliberately distinct from all four capability consoles (no
`ns-contable` / `ns-sgc` / `ns-tbuild` / `ns-strhero`/`ns-strtopo` reuse).

### New components (all `--ns-*` tokens, `ns-*` classes, hard `3px 3px 0` press shadow, DM Sans/Mono)
- **`ns-cfghero`** — header composite: title + inline **stat slab** (one pressed slab split into 4
  divider cells: keys resolved / overrides active / values shadowed / profile) + an ordered
  **precedence legend** of numbered layer chips (ref 19 stat-bar; ref 13 stat strip).
- **`ns-cfglayerchip`** (+ `--sm`) — the atomic tone-driven "which layer" token (ordinal badge +
  glyph + label), reused across header / ledger / diff / trail for consistent layer identity.
- **`ns-cfgtable` / `ns-cfgrow` / `ns-cfgnschip`** — effective-config **ledger** (ref 11 KV table):
  key + ns eyebrow · effective value · winning-layer chip · override ◆ · shadow count; namespace
  filter chips; selected row gets copper left-accent + tint; header cols align at ≥480px, stack
  below.
- **`ns-cfgwater`** (+ `--sheet`) — **HERO precedence waterfall**: numbered rail + dashed spine,
  per-layer card w/ `from source·line` provenance, **winner elevated w/ hard press shadow + "wins"
  pill**, **shadowed values struck through** (destructive-red) + dimmed card, **silent layers**
  dashed "— not set", and **connector labels** ("shadowed by"/"inherits"/"passes through") floating
  between layers (ref 21).
- **`ns-cfgdiff`** — ref-13 **override diff**: per-side layer chips (`shadowed → override`), per-pane
  `source·line` label, **line-numbered red/green** (`−`/red base line vs `+`/green effective line);
  renders **only** when the winner is a runtime override that shadows a base value.
- **`ns-cfgtrail`** — **resolution trail / provenance**: every contributing layer as
  `glyph · layer · value · source·line`, shadowed struck, winning row tinted + "winning" pill, footer
  actions.
- **Mobile bottom sheet** — tap a key < 1080px opens the shared `#ns-sheet-dialog` (right drawer
  641–1079, **bottom sheet ≤640**) carrying the compact waterfall + actions.

### Tokens / variants
- One `[data-tone]` → `--cfg/--cfg-fg/--cfg-subtle/--cfg-border` custom-prop set colours every layer
  (framework=muted, package=copper/primary, profile=teal/success, override=amber/warning);
  theme-blind, recolours from one place.
- Winning-layer highlight uses the canonical NS press shadow keyed to the layer tone:
  `3px 3px 0 color-mix(in srgb, var(--cfg) 55%, var(--ns-gray-12))`.

### Data model
- New `s2ConfigDefs()` (9 keys across flags/jobs/tasks/workers/streams/telemetry/triggers/database/
  sagas) + `s2LayerDefs()` (4 ordered layers). Each key declares its per-layer contribution (or
  `null` = silent); a `resolve()` helper computes winner + shadow flags — resolution is **computed,
  not hand-set**, so every edge state (no override, multi-shadow, silent, echo) is truthful.
- Repurposed `s2Sel` from a node id to a config **key**; `/config/nodes/:nodeId` now deep-links a key.
  Old `s2NodeDefs`/`s2EdgeDefs`/`scheduleEdgeMeasure` neutralized (edge-measure is now a guarded
  no-op — no spinning interval, no SVG geometry).

### Mobile optimizations
- Header stat slab folds 4→1 (<720); ledger row goes 3-col→2-row (<480); resolution key-head stacks
  (<640); diff panes stack 2→1 (<620); trail src truncates to its own row (<640); waterfall stays
  single-column. Body never scrolls sideways. **Mobile h-overflow fixed 20px → 0** vs. old stackmap.
- Verified 0 holes / 0 overflow / 0 non-404 console errors at 1440 + 390, both themes; 16-route
  regression clean; `ns-cfgwater` confirmed loaded from `ns-ext.css`.

### Known follow-ups
- Waterfall connector-label logic is heuristic (correct for all 9 seeded keys; worth a truth-table
  pass if unusual silent/present patterns are added).
- Override diff is single-line/value-level (right for scalars); nested-object override would want a
  multi-line diff — deferred until such data exists.
- Some desktop whitespace below the left ledger when the right stack is taller (key with a diff);
  a compact "layer coverage" mini-viz could fill it later.
- Tablet 641–1079 uses the right-drawer sheet, not a 2-col inline; intentional, revisitable.

## Pass V7-fix — Config Resolution

Adversarial vision gate (`_evals/V7-config-adversarial-vision.md`) scored the screen **68/100**:
metaphor is bespoke, but a few sections carried real dead space / generic chrome. Four surgical
visual/layout fixes — no route/logic/data/copy-meaning change; the waterfall metaphor, namespace
filter chips, per-key data adaptation, winning-layer chips, and trail structure are left intact.
Report: `render/_visual-reports/V7-config-fix.md`. Shots:
`render/_visual-reports/V7-config-shots/after-config-*`.

### 1 (TOP) Collapse non-contributing waterfall layers
Silent (`— not set`) layers were full-height padded rows eating ~30% of the waterfall in
partial-resolution states. `cfgWater` now flags `collapsed`/`pipNote`; silent layers render a slim
one-line `.ns-cfgwater__pip` with a hollow dashed rail tick, so contributing layers snap together.
**Measured (package-wins key, desktop 1440):** silent row 47px→24px (−49%), silent dead-space
94px→48px (−49%), waterfall 320px→268px (−16%). Pip ≈33% of a contributing card. Applied to both
the desktop panel and the mobile sheet waterfall.

### 2 KPI header micro-viz
Four bare number boxes → denser cells (padding + value size down) each with a supporting micro-viz:
namespace-spread ticks (keys resolved), one pip per active override (overrides active),
shadowed/total meter + "N of M contributions outranked" sub (values shadowed), precedence-position
diamonds (profile). Legend row unchanged.

### 3 Override diff → framed side-by-side hunk
`cfgDiff` now emits a `@@ <key> @@` hunk + 3 lines/pane (context / changed / context), contextual
line numbers, `− SHADOWED`/`+ EFFECTIVE` colored pane tags with source paths. Reuses the existing
pink/green `del`/`add` gutter. Still gated to override-wins keys only (`cfgHasDiff` unchanged).

### 4 Effective-config table density + type color
`cfgValType()` classifier drives DM Mono type colors (number→amber, string/enum→teal,
boolean→copper; dark-mode step-up), reused for waterfall + trail values. Row padding + value size
trimmed. Filter chips + winning-layer chips untouched.

### Verification
0 `{{ }}` holes / 0 real console errors / 0 h-overflow across all 8 Config variants + 2 mobile
sheets; full 16-route regression clean at 1440 + 390. A single pre-existing benign background 404
is unrelated to this markup (absent on clean load). CSS appended to `ns-ext.css`;
`.ns-cfgwater__silent` retired.

### Deliberately deferred
Gate items 5/8 (node-graph rail; inline `<textarea>` quick-override editor + docs accordion) NOT
done — the brief forbids converting the waterfall to a node-graph, and an editable override would
change behavior beyond a visual pass.

## Pass V8 — Migrations

Redesigned S11 (`DB migrations & drift`) from a plain 3-col table + a co-star introspect-diff into a
bespoke migration control plane. Signature = the **version-chain timeline**; the diff is demoted to a
secondary drawer tab (Config Resolution owns diff-as-hero).

### New components (all `--ns-*` tokens, `ns-*` classes, appended to `ns-ext.css`)
- **`ns-migver`** — reusable version glyph (`v1`…`v4`), phase-tinted (applied=teal, pending=dashed
  copper, failed=destructive), `--lg`/`--sm` sizes; dark-mode fg/border step-up for contrast.
- **`ns-mighead`** — header composite: HEAD `v3 → v4` glyphs + `behind` pill + a 4-tile stat strip
  (applied / pending / drift / last-applied) with an accent left-rail tinted by drift tone. Replaces
  four plain number cards (ref-13 stat strip).
- **`ns-migchain` / `ns-mignode`** — the **version-chain timeline** (SIGNATURE): applied spine of
  timed-event cards on a rail (filled teal status dots) → **`ns-mighead-marker`** ringed-diamond
  live-DB HEAD/drift divider → **`ns-migchain__queue`** dashed copper pending nodes. Node card =
  version glyph + title + mono name + timestamp·duration + status badge, selectable (ref-19).
- **`ns-arcgauge`** — pure-CSS conic half-ring drift gauge (teal synced + amber drifted slice,
  masked to a ring), centered value ("N drifted" / "in sync") + object-count caption (ref-04). No
  SVG, no `{{ }}` holes.
- **`ns-driftrow`** — drifted-object row: kind tag (column/table) + mono object + strike-through
  `has → wants` delta + italic note.
- **`ns-migledger`** — dense ledger table (ver / migration / applied-at / duration / rows / status);
  row hover + selected inset-rail; row-click opens the detail drawer (ref-11).
- **`ns-migapply`** — pending-apply card: glyph + "1 migration pending" + "what will change" (+/~ op
  chips) + apply/details actions + dark CLI strip.
- **`ns-migdetail`** rail + **`sheetIsS11`** drawer/bottom-sheet — Summary / DDL-diff **segmented
  tabs** (`ns-seg` reused), stat tiles, tables-touched chips. Desktop right-drawer, mobile bottom
  sheet via the shared `ns-sheet-dialog` (no new dialog).

### Data model (visual metadata only — copy meaning unchanged)
`s11Rows` enriched with `ver / title / dur / rows / tables / summary / ddl`; added `s11Drift`
(drifted objects) and `s11Sel` (selection). All derived state (timeline nodes, ledger, gauge
fractions, header metrics, detail, drawer tab) computed in the S11 view-model builder.

### Verification
0 `{{ }}` holes / 0 real console errors / 0 h-overflow across desktop 1440 + mobile 390, both themes,
plus selected / drawer / DDL-tab / mobile-sheet / **in-sync** interaction states. Full 16-route
regression clean. Pre-existing benign `/favicon.ico` 404 unrelated (present in `00-BEFORE`). No edits
to `support.js`, `_ns_styles.css`, `_ds/*`, or other screens' markup.

### Deliberately deferred
No ledger-header sort wiring (visual hint only); no horizontal branch/fork viz (migration data is
linear — a fork would be speculative); gauge denominator is a derived constant pending a real
schema-object census; pending rows-affected is a labelled estimate.

## Pass V8-fix — Migrations

Scoped density tighten after the adversarial vision gate (62/100) flagged the one valid hit: the
hero version-chain nodes were under-filled and the header tiles were plain number boxes. VISUAL +
LAYOUT only; no route/logic/data/copy-meaning changes; no other screen touched.

### Refinements
- **`ns-mignode`** — cut internal padding ~35% (`space-2/2.5`, gap `3px`, dot/offset trimmed) and
  added an **inline mono chip row** (`ns-mignode__chip` × 3 + `ns-mignode__at`): `◫ N objs` (from
  `tables.length`), `≡ <rows>`, `◷ <duration>`, with applied-at right-aligned. Chips tint copper on
  pending, neutral on applied — nodes now earn their height with real data instead of whitespace.
  Card height 87→81px; per-node metadata 2 fields → 4.
- **`ns-migstat` micro-viz** — every header tile now carries a supporting mini-viz (all from existing
  data): **`ns-migstat__bar`** applied/total ratio meter, **`ns-migstat__pips` / `ns-migpip`** n-of-8
  drift pips (teal sync / amber drift) + one copper pip per pending, **`ns-migstat__rel`** relative
  time (`7d ago` / `today`) beside the absolute timestamp. Head + tile padding trimmed; big number
  `text-2xl → text-xl`.
- **`ns-mighead-marker`** — reworked from a big dashed ghost box into a **slim one-line marker**
  (mono uppercase label + inline note on a thin tinted strip with a 2px copper/teal left accent).
  Height 52→23px (doctrine rule 4: no orphaned ghost rows).
- **`ns-driftrow`** — padding halved; `has → wants` delta and status note now share one compact row
  (note pulled inline-right via a 3rd grid column) instead of an airy 3-line block.
- **`ns-migsheet__stats`** — Applied / Duration / Rows kept as a **3-across grid at 390px** (was
  collapsing to a 1-col stack at ≤560px); padding tightened so the Summary/DDL tabs sit above the
  fold on a standard phone.

### Data model (visual metadata only)
`nodeOf` now exposes `tablesLabel` / `rowsLabel` / `durLabel` / `atLabel`. `s11Head` gains
`appliedRatioPct`, `appliedRatio`, `pendingPips`, `driftPips` (n-of-8), and `lastAppliedRel`
(relative-time from the `runMigrate` "now" anchor — derived, not invented).

### Verification
0 `{{ }}` / 0 real console errors / 0 h-overflow across desktop 1440 + mobile 390, both themes, plus
selected / detail-drawer / DDL-tab / mobile-sheet / **in-sync** states. In-sync applied-only state
(`4 of 4`, full teal bar, 8 teal pips, teal HEAD marker) confirmed by applying the pending migration
at runtime. Full 16-route regression clean (32 route-visits). No edits to `support.js`,
`_ns_styles.css`, `_ds/*`, or other screens.

### Declined (gold-plating / data-invention, per brief)
Inline per-row DDL expanders in the ledger; tabbed docs accordion for the pending list; code-editor
chrome (file tabs / line numbers) on the DDL diff (stays a secondary drawer tab); author avatars and
a pre-flight-step pipeline (no such data).

---

## Pass V9 — Dead-Letter Queues (S12)

Replaced the generic S12 screen (three plain "DEPTH / big-number" cards + a 2-row table with
inline `<details>` payload expanders + dead space below) with a bespoke **operational triage
console**. Only `render/prototype.dc.html` (S12 markup + JS model + a `sheetIsS12` inspector body)
and `render/assets/ns-ext.css` (appended `ns-dlq*` block) were touched.

### New components / tokens
- **`ns-dlqstrip` / `ns-dlqstat`** — composite triage-strip tiles (accent-bar + glyph + value +
  micro-viz + sub-label), replacing plain number cards. Includes **`ns-dlqsplit`** (by-queue split
  micro-bar that sums to total parked), **`ns-dlqpips`** (retry-exhausted filled/empty pips), and a
  reused **`ns-spark`** red arrival strip. Signatures tile is a click-to-clear button.
- **`ns-dlqcluster` / `ns-dlqclusterlist`** — the screen's signature: **error-signature cluster
  rows** (severity glyph + signature/message + ×count + source chips + `ns-spark` death sparkbar +
  age range + per-cluster **Retry all / Purge**). Click filters the table (`data-sel='active'` ring).
  This grouped-failure component is net-new to the kit.
- **`ns-dlqtable` / `ns-dlqrow`** — dense triage grid: kind glyph, **`ns-dlqsig`** signature badge
  (destructive/warning tones), inline retry pips (`ns-dlqpips` w/ `data-exh`), exhausted left-rail,
  inline Inspect. Responsive collapse to per-message stacks < 720px.
- **`ns-dlqbulk`** — sticky bulk-action bar (count + inline CLI hint + gated Purge/Reprocess).
- **`ns-dlqfleet` / `ns-dlqqueue`** — queue-health cards: depth + **`ns-dlqmeter`** depth-vs-capacity
  fill meter + trend sparkbar + oldest-age + severity pill (clear/low/elevated/critical);
  click-to-filter non-empty queues. Horizontal fill meters chosen to stay distinct from the
  Migrations arc gauge.
- **`sheetIsS12` / `ns-dlqinsp`** — message inspector plugged into the shared `ns-sheet-dialog`
  (auto right-drawer on desktop, bottom-sheet on mobile): signature+reason hero, KV panel, payload
  JSON block, **retry-history step-timeline** (reuses `ns-step-timeline--data`), gated actions.
- **`ns-dlqclear`** — all-clear empty state (success-toned press-shadow card).
- Generic helpers added: **`ns-panel__head`** (horizontal panel head; DS `ns-panel__header` is a
  vertical stack) + **`ns-panel__flex`** (spacer). Reusable across future screens.
- Spark zero-buckets muted via `.ns-dlq .ns-spark__col[data-z='true']` (opacity 0.28).

### Data model (visual metadata only, fully derived)
`dlqCorpus` per scope (queue/trigger) carries `src/kind/sig/reason/q/ageMin/retry/max/corr/payload/
hist`. Clusters derived by grouping on `sig`; queue-health derived from `queueDefs` (depth/cap/
trend/oldest); triage strip derived (total, by-queue split, oldest, exhausted pips, arrival spark);
`s12Detail` derived from the selected id. Sparkbar heights bucketed into the shared `--h1..--h20`
classes (no `{{ }}` in geometry). New state: `s12Sel`, `s12Filter` (type sig/queue/src). Removed the
old `s12Depths` plain-number-card binding.

### Verification
0 `{{ }}` / 0 real console errors / 0 h-overflow across desktop 1440 + mobile 390, both themes, plus
cluster-filter+bulk-select, inspector drawer (light+dark), mobile bottom-sheet (light+dark), and the
Trigger DLQ single-message scope. Full 16-route regression clean. No edits to `support.js`,
`_ns_styles.css`, `_ds/*`, or other screens' markup.

### Declined (gold-plating / data-invention, per brief)
Real reprocess/purge execution (stays askConfirm→toast per satellite doctrine); in-place expandable
cluster member lists (filter-the-table is the chosen affordance); a top-sources mini-list to fill the
shorter right rail (candidate for a future pass); source avatars / SLA countdown timers (no such data).
