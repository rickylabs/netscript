# V3 — Investigation spine (Live Flow + Run Inspector) at the high-craft bar

**Screens:** S13 Live Flow (causal journey / seam chain) and S6 Run Inspector (run step-timeline
with a compensation branch), plus their selected/detail states and mobile bottom sheets.
**Files touched:** `render/prototype.dc.html` (markup + view-model derivations — routes/logic/data
unchanged), `render/assets/ns-ext.css` (all new component CSS). `_ns_styles.css`, `support.js`,
and `proto.css` component bases were **not** edited.
**Final screenshots:** `_visual-reports/V3-shots/` (desktop + mobile, light + dark, halted variant,
node-selected desktop, seam-detail bottom sheet, plus BEFORE references).

---

## The design question — answered first, then designed around

> *What tailored components, layout, composition, data visualization, and data structure best
> showcase (a) a single request's causal journey through the stack and (b) a run's step timeline
> with a compensation branch — and how do they compose together?*

The journey and the run are **two altitudes of one correlation** (`ch_3QK9dR2eZ`). They are not the
same view repeated:

- The **journey** answers *"where in the stack did causation flow, and where did it break?"* — a
  **spatial, causal map**, never time-proportional (doctrine: a seam chain, not a waterfall). It
  needs strong per-node design, a **fan-out** where one seam spawns many subscribers, a **severed**
  variant, edge relationships between hops, and a flow-level verdict summary.
- The **run** answers *"inside one primitive, what happened step by step — including the rollback?"*
  — a **vertical timeline** with a visibly distinct **compensation lane**, per-step **data points**,
  and attempt/retry markers.

They **compose** through: (1) the shared **Journey | Inspector** segmented switch, (2) a shared
**correlation KV split-panel** header on both (the same `ch_…` id and `tr_…` trace), and (3)
reciprocal deep-links (journey seam → "Run Inspector →"; run → "View originating flow →"). The
journey is the **map**; the inspector is the **street view** of one pin on that map.

The data structure that makes this work: every node/step carries a **seam datum** — the one value
that matters at that hop (`200`, `evt_2210`, `step 2 of 4`, `2/3`, `208ms`) — surfaced as a
right-aligned, tone-tinted chip so the chain is scannable at a glance without opening payloads.

---

## References mined this pass (new patterns, per ref)

| Ref | Pattern taken | Applied to |
|-----|---------------|-----------|
| **04 finance-cards** | **Arc gauge** with centered value + `SPEND`-style label; **OHLC/breakdown stat footer** (3 tiles); **stacked outcome split** | Flow-hero chain-progress arc (`2/5 seams`); Run-hero step arc (`2/4 steps`); the seam-outcome splitbar; the 3-tile attempt/compensation footer |
| **05 timeoff-workhour** | **Data-point line with a floating value tooltip** ("Monday, 6h"); **radial arc + status list**; **segmented time control** | Step-timeline **data-point steps** — the active step floats a `retrying`/`attempt` value bubble over its datum chip; the arc gauges; the All/Compact/JSON altitude segmented |
| **01 synergy-hr** | **KV split-panel** (Current Project: name/manager/lead/timeline); **left-accent tinted cards** | The **correlation split-panel** header on both screens; the selected journey node's copper left-accent |
| **03 analytics** | **Funnel/step table** with count + colored trend; **channel split + dot legend** | The journey as a causal step list with seam-value cells; the seam-outcome split + legend |
| **11 devconsole (Conduktor Consume)** | **Compact stat strip** (RECORDS/PARTITIONS…); **dense sortable data table** with column headers + sort arrows; **right slide-out drawer** | Run Inspector **console stat strip** (runs/retrying/compensating/failed); the run list as a **console table** ("Correlated runs · 4" with a `RUN ↓ / STATUS` sortable header); the right rail reads as the detail drawer, and folds to a bottom sheet on mobile |
| **13 devconsole (Schema diff)** | breadcrumb → stat strip → altitude picker → code region | The Run Inspector's stat-strip → hero → altitude-segmented → step/JSON region rhythm |
| **21 flow-builder (outamate node-graph)** | **Node cards** with icon-tile + title + semantic **caption** beneath; **branch/edge labels floating on connectors**; **selected-node ring**; **right properties panel** | The journey's node-graph feel: per-node **caption pills** (INGRESS / EVENT ROUTER / ORCHESTRATION / EXECUTION / FAN-OUT DELIVERY); **edge branch-labels** on the causal connectors (routes to / publishes + enqueues / runs job / emits event); selected-node copper accent + ring; the desktop **seam-detail rail** = the properties panel |

---

## Per-widget composition

### Live Flow (S13)

1. **`ns-flowhero`** (new) — fills the former dead-band under the lede. A 2-column band:
   left = **chain-progress arc gauge** (`2/5 seams`, tone = worst node state) + a **mini spine**
   (5 tinted primitive glyph dots showing the whole chain at a glance); right = the **verdict badge +
   route**, the **correlation KV split-panel** (correlation id / trace / seams cleared), and a
   **seam-outcome splitbar** (cleared / in-flight / failed) with a dot legend. Refs 04 + 01 + 03.
2. **`ns-journey--rich`** (uplift) — each seam node is now a **card row**: a tinted primitive glyph
   tile, name + status pill, a **semantic caption pill** (ref 21), a right-aligned **tone-tinted
   seam-value chip** (`200`, `evt_2210`, `step 2 of 4`, `2 of 3`, `2/3`), a `spawns saga + job`
   hint on the trigger node, and a **fan-out delivery visual** on the stream node (receipt ✓ /
   ledger ✓ / analytics ✗ pills). Connectors carry **edge branch-labels**; the selected node gets a
   copper left-accent + primary ring; the halted flow draws a **dashed severed** connector +
   destructive edge label.
3. **`ns-seamrail`** (new, desktop) — a third column showing the **selected node's** properties:
   primitive + name header, KV detail, deep-links (Open entity → / Raw trace ↗ / Run Inspector →),
   and the grounded **`ns-assist`** card. Under 1440px it collapses; the node opens a **bottom
   sheet** instead (`window.matchMedia` branch in the node's click handler).
4. **`ns-flowrow`** (uplift) — rail rows gain a **mini seam-chain dot-strip** (per-hop tone dots) +
   a seam count, so each correlation previews its shape before you open it.

### Run Inspector (S6)

1. **`ns-statstrip`** (new) — a 4-tile **console stat strip** (runs / retrying / compensating /
   failed), tone-colored values. Ref 11.
2. **`ns-runtable`** (new) — the run list is now a **console table**: a titled head ("Correlated
   runs · 4"), a **sortable column header** row (`RUN ↓ / STATUS`), and dense rows with a
   **primitive glyph tile** per run (saga/job/firing/delivery, tone by capability). Ref 11.
3. **`ns-runhero`** (new) — a run-summary hero: a **step-progress arc gauge** (`2/4 steps`, tone by
   run status), the **correlation KV split-panel** (correlation / trace / started / elapsed), and a
   **3-tile breakdown** (steps done / attempts / compensations). Refs 04/05 + 01.
4. **`ns-step-timeline--data`** (uplift) — data-point steps: each carries a right-aligned
   **tone-tinted datum chip** (`12ms`, `208ms`, `queued`), the newest active step **floats a value
   tooltip** above its chip (ref 05), attempts render as a real chip, and the **compensation branch**
   is now a **visibly distinct indented reverse lane** (warning left-rail, a `⟲` reverse marker in
   the gutter, warning-tinted marker). Compact altitude drops the datum chips + tightens rows.
5. **Logstrip** (fix + uplift) — the previously-clipping 4-column grid (`re…`/`po…`) is now a
   **2-row line**: `ts · resource` on row 1 with a **severity dot**, the full message on row 2 —
   never truncates the resource, stays legible in the 19rem rail and on mobile.
6. **Seam-detail bottom sheet** (uplift) — the mobile sheet gains a **badge hero** (primitive +
   status) so it reads as a proper detail card, not a bare KV list.

---

## New component class contracts

- `ns-flow-grid` — Live Flow layout: `1fr` → `16rem 1fr` (≥1024) → `16rem 1fr 19rem` (≥1440); the
  `.ns-seamrail` 3rd column hides < 1440 (node opens a bottom sheet instead).
- `ns-flowhero` / `__gauge` / `__spine` / `__spine-dot[data-tone][data-prim]` / `__body` / `__top` /
  `__route` — flow-summary band.
- `ns-gauge__of`, `ns-gauge__label` — gauge value denominator + micro-cap sub-label (extends the
  existing `ns-gauge`, reusing its post-mount `drawGauges` geometry — no new JS).
- `ns-kv--split` — KV rendered as an auto-fit split-panel (left-aligned values), from ref 01.
- `ns-dot` — inline legend dot.
- `ns-journey--rich`, `ns-journey__hit` (grid: title/seam left, value right), `ns-journey__val`
  (tone-tinted seam-datum chip), `ns-journey__sub` / `__caption` (semantic caption pill),
  `ns-journey__edge` (connector branch-label), `ns-journey__spawn` / `__spawn-tick`,
  `ns-journey__legend*`.
- `ns-fanout` / `__leg[data-state]` / `__dot` — subscriber-level delivery fan-out visual.
- `ns-flowrow__chain` / `__chaindot[data-tone][data-prim]` — mini seam-chain preview strip.
- `ns-statstrip` / `__tile` / `__label` / `__value[data-tone]` — console stat strip.
- `ns-runtable` / `__head` / `__title` / `__count` / `__cols` / `__col[--sorted]` / `__sort` —
  console-style sortable run table wrapper (wraps the existing `ns-entity-rail`).
- `ns-runrow` (grid: glyph + body) / `__glyph[data-prim]` / `__body` — run rail row with a
  primitive glyph tile.
- `ns-runhero` / `__gauge` / `__body` / `__top` / `__name` / `__corr-note`;
  `ns-runstat` / `__tile` / `__val[data-tone]` / `__of` / `__label` — run-summary hero + tiles.
- `ns-step-timeline--data` + `__n` / `__datum` / `__tip` — data-point steps; compensation lane
  restyle via `[data-comp='1']` (indented reverse lane + gutter `⟲`).
- `ns-seamsheet-hero` — mobile seam-sheet badge header.

All token-driven (`--ns-*` only, no raw hex), all geometry via CSS or the existing post-mount
`drawGauges`/`drawSparks` pipeline — **zero SVG `{{ }}` holes**.

## Mobile behavior

- **Live Flow** reflows to one column (rail → hero → journey → seam detail → assist). The seam rail
  is hidden as a 3rd column; **tapping a journey node opens the seam-detail bottom sheet** (verified:
  `sheetOpen=true`). The flow-hero arc + splitbar stack; edge labels + captions persist.
- **Run Inspector** reflows to one column (rail → stat strip → run-hero → step timeline → run events
  → logstrip → assist). The stat strip drops to 2×2; the run-hero to a single column; the logstrip's
  2-row line never clips. The right rail (events/logs/assist) reads as the console detail drawer.

## Before / after

- **Live Flow before:** a large empty band under the lede; a flat vertical text list of nodes; no
  flow verdict; no per-node seam value; no fan-out; seam detail only reachable via a mobile sheet.
  **After:** a flow-hero with an arc gauge + correlation panel + outcome split; node-graph journey
  with captions, edge labels, tone-tinted seam-value chips, delivery fan-out, a severed variant, and
  a **live desktop seam-detail rail**.
- **Run Inspector before:** a thin correlation text line; a plain circle-marker step list with a
  faint compensation rule; a clipping logstrip; flat rail rows. **After:** a console stat strip + a
  sortable console run table with glyph tiles; a run-summary hero (arc + correlation panel + 3
  breakdown tiles); data-point steps with a floating value tooltip, real attempt chips, and a bold
  indented compensation lane; a fixed 2-row logstrip.

## Verification

- Zero `{{ }}` holes, zero console errors, zero horizontal overflow across **flow / flow-halted /
  runs / runs-job × desktop(1440) + mobile(390) × light + dark** (16 states) — plus interaction
  states (desktop node-select updates the rail; mobile node-tap opens the bottom sheet).
- Full **16-screen regression** (Home + all others) clean: holes=0, ovf=0, errs=0 on every route.

## Honesty / not-yet-at-bar

- The run-list console table lives in the ~16rem left rail (kept the existing 3-column console grid
  to avoid re-architecting the shared layout). It reads as a dense console table with a sortable
  header + glyph tiles, but it is a single-metric list, not the full multi-column sortable grid of
  ref 11 (which had a full-width table). A future pass could promote the run list to a full-width
  sortable table above a right detail drawer if the owner wants the exact Conduktor layout.
- Sort arrows on the run-table header are **presentational** (the doctrine bar is visual; wiring real
  sort is logic, out of scope for a visual-only pass).
- The step-timeline "value tooltip" anchors on the active step only (one bubble), matching ref 05's
  single-point tooltip; it is not an interactive hover crosshair across all steps.

---

## Design-system uplift ledger

### New components
- **`ns-flowhero`** — flow-summary band (arc gauge + spine + correlation KV split + seam-outcome
  split). · Live Flow.
- **`ns-seamrail`** (composed) — desktop seam-detail properties rail (KV + deep-links + grounded
  assist); mobile → bottom sheet. · Live Flow.
- **`ns-fanout`** / `__leg[data-state]` — subscriber-level delivery fan-out visual (per-sink
  ok/failed pills). · Live Flow (stream node), reusable on Streams.
- **`ns-runhero`** + **`ns-runstat`** — run-summary hero (step arc + correlation KV split +
  attempt/compensation breakdown tiles). · Run Inspector; reusable on Sagas/Workers detail.
- **`ns-statstrip`** — console stat strip (eyebrow micro-cap + big tone-colored value tiles). · Run
  Inspector; reusable on every console screen (Workers/Sagas/Triggers/Streams/DLQ).
- **`ns-runtable`** — console-table wrapper (titled head + count + sortable column header) around an
  entity rail. · Run Inspector; reusable for any entity list that wants a console-table read.

### Refinements to existing components
- **`ns-journey`** → `--rich` variant: card-row nodes, tinted glyph tiles, right seam-value chip,
  semantic caption pill, connector edge branch-labels, selected copper accent + ring, `spawns`
  hint. Node-graph feel (ref 21).
- **`ns-flowrow`** → mini seam-chain dot-strip + seam count.
- **`ns-gauge`** → `__of` (denominator) + `__label` (micro-cap) parts; usable as a fractional
  progress arc (`2/5`) beyond a single percentage.
- **`ns-kv`** → `--split` variant (auto-fit split-panel, left-aligned values) from ref 01.
- **`ns-step-timeline`** → `--data` variant: right datum chip, active-step floating value tooltip,
  `__n` step number, and a **bolder indented compensation lane** (gutter `⟲` + warning rail).
- **`ns-logstrip`** → 2-row line (ts·resource / message) with a severity dot; no more resource/
  message truncation in narrow rails.
- **`ns-runrow`** → primitive glyph tile on entity-rail items.
- **seam-detail bottom sheet** → badge hero header (primitive + status).

### New tokens
- None. Everything composed from existing `--ns-*` tokens (copper/teal/amber/tone families,
  spacing, radius, text scale). No raw hex.

### New variants
- `ns-journey--rich`, `ns-kv--split`, `ns-step-timeline--data`.

### New options / data-attributes
- `ns-flowhero__spine-dot[data-tone][data-prim]`, `ns-flowrow__chaindot[data-tone][data-prim]`,
  `ns-journey__val` tinted by parent `[data-state]`, `ns-fanout__leg[data-state]`,
  `ns-statstrip__value[data-tone]`, `ns-runstat__val[data-tone]`, `ns-runrow__glyph[data-prim]`,
  `ns-runtable__col--sorted` + `__sort`, `ns-step-timeline__datum` tinted by `[data-state]`,
  `ns-step-timeline__step[data-tip='1']` (active data-point).

### Mobile optimizations
- Live Flow seam-detail as a **dedicated bottom sheet** (viewport-branched click handler; the
  desktop 3rd-column rail hides < 1440px).
- `ns-statstrip` → 2×2 on mobile; `ns-flowhero`/`ns-runhero` → single column < 560/720px.
- `ns-logstrip` 2-row line keeps resource + message legible on 390px.
