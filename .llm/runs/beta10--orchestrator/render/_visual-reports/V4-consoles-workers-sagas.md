# V4 — Workers + Sagas capability consoles at the high-craft bar

**Screens:** S7 Workers (polyglot job/task registry console) and S8 Sagas (compensation
state-machine console), plus their leaf/detail states and mobile bottom sheets.
**Files touched:** `render/prototype.dc.html` (markup + view-model derivations — routes/logic/data
unchanged), `render/assets/ns-ext.css` (all new component CSS). `_ns_styles.css`, `support.js`, and
`proto.css` were **not** edited.
**Final screenshots:** `_visual-reports/V4-shots/` (Workers + Sagas × desktop 1440 + mobile 390 ×
light + dark, a Workers mobile bottom-sheet, a Sagas instance with **no** compensation lane, and two
state-machine crops, plus BEFORE references).

---

## The design question — answered per console, THEN designed around

> *What tailored components, layout, composition, data visualization, and data structure best
> showcase THIS capability — and how do they compose?*

The two consoles share the **dev-console anatomy** (refs 11/12/13: breadcrumb → tab row → stat strip
→ dense data view → right detail drawer) as a common *frame*, but their **hero and grid rhythm are
deliberately opposite** so the two routes never read as the same template with different data:

### Workers — a REGISTRY, so the screen is TABLE-FORWARD
The Workers story is *"which of my polyglot units exist, in what runtime, on what schedule, and did
they run?"* — a registry question. So the **hero is a full-width, dense, sortable console table**
(name · kind · **runtime badge** · schedule · last status · 24h trend · Run-now), sitting directly
under a **runtime-mix stacked bar** and a `?runtime=` **filter-chip** row. Everything else —
execution feed, worker-pool liveness, scheduler-vs-config drift — is a **supporting panel** in an
auto-fit grid below. There is **no arc gauge**; the dominant element is the table. Selecting a row
opens a **detail drawer** (right sheet on desktop, bottom sheet on mobile) with the unit's KV +
recent-executions mini-timeline + Run-now.

The data structure that makes the table earn its density: every unit carries a normalized
`rtKey` (`deno|python|shell|dotnet|pwsh`) that drives the runtime-badge dot, the `?runtime=` filter,
and the stacked runtime-mix bar — one field, three visualizations, so the *polyglot* nature is the
thing you see first.

### Sagas — a STATE MACHINE, so the screen is DIAGRAM/TIMELINE-FORWARD
The Sagas story is *"this instance ran forward, then something failed, so it is compensating —
show me the rollback."* `COMPENSATING` is a status no other tool models, so the **hero is the
compensation state machine, rendered**: a compact state gauge + correlation KV, then a **bespoke
state-machine mini-diagram** (`ns-smd`) — a forward lane of pill-nodes joined by edge-labelled
connectors, then a **visibly distinct rollback lane** returning through compensation pairs — followed
by an **assist that explains WHY compensation triggered** (grounded in the failed step), and the
elevated **data-point step timeline** with a bold indented compensation lane. The definitions/
instances rail and the transitions feed are the *supporting* left/right columns.

The data structure that makes this work: each instance carries a `machine` model
(`forward[]` + `comp[]` with per-node `state`/`glyph`/`cap`/`edge`), a `hero` (states-settled /
total, tone by status), and an `assist` (or `null` when nothing compensated). Because `hasComp` is
per-instance, some instances render the rollback lane and the "why" assist, and others (e.g. the
ACTIVE at-most-once export) render **only the forward lane with no rollback** — the composition is
genuinely data-driven, not a static template (see shots 10 vs 11 vs 12).

**How the frame composes both:** the shared kit (`ns-conhead` breadcrumb + `ns-contab` tab row +
`ns-statstrip` + `ns-runtable`/entity-rail + status pills + `ns-step-timeline--data` + `ns-assist` +
the generic right/bottom sheet) keeps the product feeling like one console family; each console then
adds its own **dominant** component (`ns-contable` for Workers, `ns-smd` for Sagas) so the two are
unmistakably different screens.

---

## References mined this pass (new patterns, per ref)

| Ref | Pattern taken | Applied to |
|-----|---------------|-----------|
| **11 devconsole-a (Conduktor Consume)** | breadcrumb (`Topics ›`) + **compact stat strip** (RECORDS/PARTITIONS…) + **dense sortable data table** with sort-arrow column headers + a **right slide-out drawer** with its own docs tabs | Both consoles' `ns-conhead` breadcrumb + `ns-statstrip`; Workers' `ns-contable` sortable registry; the selected-row **detail drawer** (`ns-drawer` / generic sheet) |
| **12 devconsole-b (Conduktor Produce)** | the **tab row** (Consume / Produce / Configuration / Schema / …) with an underlined active tab; a left-panel + right-table split | Workers/Sagas **`ns-contab`** tab row (Registry/Executions/Pools/Drift · Instances/State machine/Transitions); the toolbar (`ns-contoolbar` search + filter chips) |
| **13 devconsole-c (Schema diff)** | a stat strip whose value can be a **full text string** (`Backward transitive`) not just a number; the breadcrumb → stat-strip → content rhythm | Workers' drift-cause naming (`override v43`); Sagas' `compensation: refund issued · settling` as a text KV value |
| **19 pm-dashboard (Mondays)** | the projects **table with a status-pill column** (icon + name + inline meta + **status pill**); tinted category cells | Workers' registry table (kind badge + runtime badge + **status pill** column); the `ns-driftrow` tinted-by-state rows |
| **21 flow-builder (outamate node-graph)** | **pill-shaped nodes** (icon-tile + title) joined by **connectors with floating branch labels** ("Get 30% Off"), a start→branch flow, a selected-node ring | The **bespoke saga state-machine** (`ns-smd`): forward pill-nodes + edge branch-labels (`enqueue job` / `reserve failed`) + semantic captions + a `data-current` copper ring + a **distinct dashed reverse rollback lane** |
| **09 analytics (Catalyst)** | the **stacked category bar** (segments filling to a %) + dot legend | Workers' **runtime-mix** stacked bar + legend (`Deno 9 · Python 3 · Shell 2 · .NET 1 · PowerShell 1`) |

---

## Per-console composition

### Workers (S7) — table-forward registry
1. **`ns-conhead`** (new) — in-content **breadcrumb** (`Capabilities › Workers`) + dogfood
   provenance chip + a **`ns-contab` tab row** (Registry active · Executions · Pools · Drift, each
   with a live count; siblings smooth-scroll to their section via `scrollToSection`, presentational).
2. **`ns-statstrip--5`** (new variant) — a 5-across console stat strip (jobs / tasks / running /
   failed / success), tone-colored, denser tiles than S6's default.
3. **`ns-runtimemix`** (new, bespoke) — a **stacked polyglot-runtime bar** + dot legend, the one
   viz that says "this is polyglot" at a glance (ref 09).
4. **`ns-contoolbar` + `ns-rtchips`** (new) — search box + `?runtime=` **filter chips** (all/deno/
   python/shell/.net/pwsh); the chips actually filter the table (`s7Runtime` state).
5. **`ns-contable`** (new, **HERO**) — a dense, sortable console table with sort-arrow headers, a
   **`ns-rtbadge` runtime column** (colored dot + label), a schedule cell (cron + human cadence), a
   status pill, a 24h `ns-trend` sparkline, and a Run-now action. Rows are selectable
   (`data-state='selected'` copper inset rail) → open the detail drawer.
6. **`ns-poolmeter`** (new) — worker-pool **liveness** with a heartbeat **pulse** dot + consumer
   count; the "0 consumers — nothing polling this queue" row is destructive-toned (the silent bug
   Aspire can't see).
7. **`ns-driftpanel` / `ns-driftrow`** (new) — scheduler-vs-config drift that **names the cause**
   (`override v43`) and offers a `override v43 →` assist deep-link to Runtime Config.
8. **Live executions feed** — retained (`ns-activity-feed` + Follow switch + `new` catch-up pill),
   now a supporting column, not the whole right rail.
9. **Detail drawer** (`ns-drawer` idiom via the generic sheet) — selected row → kind + runtime badge
   + status, KV (schedule/cadence/queue/runtime), a **recent-executions mini-timeline**, Run-now +
   Open actions. Right sheet on desktop, **bottom sheet on mobile** (`data-side` viewport branch).

### Sagas (S8) — state-machine-forward
1. **`ns-conhead`** — breadcrumb deepens to the instance (`Capabilities › Sagas › PaymentWebhookSaga`)
   + provenance chip + a 4-tile stat strip (instances / compensating / completed / failed).
2. **Instances rail** — the definitions/instances list, upgraded to a `ns-runtable`-style console
   list (sortable header + status pills) with a **`ns-durabar` durability-tier** viz beneath
   (durable = 3 success pips; at-most-once = 1 warning pip + muted).
3. **`ns-sagahero`** (new) — compensation-state summary band: a **state arc gauge** (states settled
   / total, tone by status) + correlation KV split (forward path / compensation label) + a 3-tile
   breakdown (states settled / compensations / attempts).
4. **`ns-smd`** (new, **HERO viz**) — the bespoke **state-machine mini-diagram**: a forward lane of
   pill-nodes (`charged ✓ → reserving ⚙ → notify`) joined by **edge-labelled connectors**
   (`enqueue job` / `reserve failed`) with semantic captions, the current node ringed in copper;
   then a **`ns-smd__lane--comp` rollback lane** — indented, warning left-rail, **dashed reverse
   connectors (◂)** — showing the compensation pairs (`refund ⟲ → settled`). Instances with no
   rollback render only the forward lane.
5. **Grounded `ns-assist`** — "Why is this compensating?" — a plain-language cause
   (reserve failed twice → refund issued → settling) grounded in clickable failed-step / job chips.
   `null` for instances that never compensated.
6. **`ns-step-timeline--data`** (reused from V3, elevated) — the forward path + the bold indented
   **compensation lane** (gutter `⟲`, warning rail), now with tone-tinted **datum chips**
   (`208ms` / `E_TIMEOUT` / `ref_102`), plus the linked-executions deep-link + the write actions
   (Retry failed step / Force-complete compensation, both confirm+CLI).
7. **Transitions feed** — the history/transitions stream in the right supporting column.

---

## New component class contracts (all `--ns-*` tokens, no raw hex, no SVG `{{ }}` holes)

- `ns-conhead` — console header wrapper (breadcrumb + tab row + stat strip); scopes denser stat tiles.
- `ns-conbread` / `__crumb` / `__crumb--here` / `__sep` — in-content breadcrumb.
- `ns-contab` / `__btn[data-state='active']` / `__count` — the console **tab row** (ref 11/12).
- `ns-contoolbar` / `__search` / `__search-ico` — table toolbar.
- `ns-rtchips` / `ns-rtchip[data-state]` / `__dot[data-rt]` — `?runtime=` filter chips.
- `ns-rtbadge` / `__dot[data-rt]` — runtime badge column (deno/python/shell/dotnet/pwsh dot).
- `ns-runtimemix` / `__bar` / `__seg[data-rt]` / `__legend` / `__leg` — stacked polyglot-runtime bar.
- `ns-contable` / `__scroll` / `__t` / `__th[--sorted][--r]` / `__sort` / `__row[data-state]` /
  `__td` / `__name` / `__sub` / `__sched` — dense sortable console table (Workers hero).
- `ns-drawer` / `__head` / `__title` / `__body` / `__section-label` / `__tabs` / `__tab` — right
  detail drawer contract (rendered via the generic sheet → bottom sheet on mobile).
- `ns-poolmeter` / `__row[data-state]` / `__pulse` / `__q` / `__consumers` / `__cnum` — worker-pool
  liveness with a heartbeat pulse.
- `ns-driftpanel` / `ns-driftrow[data-state]` / `__dot` / `__main` / `__probe` / `__result` /
  `__cause` — scheduler-drift panel that names its cause.
- `ns-sagahero` / `__gauge` / `__body` / `__top` / `__name` — saga compensation-state hero band.
- `ns-durabar[data-tier]` / `__pips` / `__pip` / `__label` — durability-tier pip viz.
- `ns-smd` / `__lane[--comp]` / `__lane-label[data-lane]` / `__node[data-state][data-current]` /
  `__pill` / `__glyph` / `__cap` / `__edge[data-lane]` / `__edge-label` / `__edge-line` — the
  **bespoke saga state-machine mini-diagram** (ref 21 node-graph).
- `ns-statstrip--5` — 5-across stat strip variant (2→3→5 responsive).

Reused unchanged from the shared kit: `ns-statstrip`, `ns-runtable`, `ns-step-timeline--data`,
`ns-runstat`, `ns-gauge` (+ `__of`/`__label`), `ns-kv--split`, `ns-assist`, `ns-activity-feed`,
`ns-trend`, status/badge pills, `ns-seg`, the generic right/bottom sheet, `ns-console-grid`.

---

## Mobile behavior

- **Workers** reflows to one column: breadcrumb/tabs → stat strip (2×2+1) → registry (the
  `ns-contable` **scrolls horizontally inside its own `__scroll` container**, body never scrolls) →
  runtime-mix + chips → executions feed → pool liveness → drift, all stacked. **Tapping a registry
  row opens a bottom sheet** (`data-side='bottom'` via a `matchMedia('(max-width:640px)')` branch)
  with the unit detail + recent-executions timeline + Run-now (shot 05).
- **Sagas** reflows to one column: stat strip → instances rail + durabar → sagahero (single column)
  → **state-machine mini-diagram** (the `ns-smd` lanes wrap gracefully — forward nodes flow to a
  second row, the rollback lane stays railed) → assist → step timeline → transitions.
- `ns-statstrip--5` → 2-col then 3-col before 5-col; `ns-sagahero` → single column < 560px.

---

## Before / after

- **Workers before:** a generic `ns-responsive-table` registry, inline baseline stats, plain
  `ns-connector` rows for drift + pools, a workflow timeline, and a large **dead right column** below
  the feed. No console frame, no runtime viz, no filters, no selectable detail.
  **After:** a full dev-console — breadcrumb + tab row + 5-tile stat strip, a **runtime-mix bar +
  `?runtime=` filter chips**, a **dense sortable console table** with a runtime-badge column and
  selectable rows → detail drawer/bottom-sheet, **worker-pool liveness with heartbeat pulses**, and a
  **drift panel that names the cause (`override v43`)**. No dead space.
- **Sagas before:** a 3-column list→detail→transitions with a basic step timeline and a flat
  "step 3 of 5" notice. No stat strip, no state diagram, no durability viz, no "why".
  **After:** a state-machine-forward console — stat strip, a **compensation-state hero** (state arc +
  correlation split + breakdown tiles), the **bespoke `ns-smd` state-machine mini-diagram** (forward
  lane + a distinct dashed rollback lane, per-instance), a **grounded "why is this compensating?"
  assist**, the elevated data-point step timeline with a bold compensation lane, a **durability-tier
  pip viz**, and the transitions feed.

---

## Verification

- Zero `{{ }}` holes, zero console errors (favicon 404 excluded), zero horizontal overflow across
  **Workers + Sagas × desktop(1440) + mobile(390) × light + dark** (8 states), plus interaction
  states: Workers row-select → mobile bottom sheet; Sagas instance-switch across pw / csv / batch /
  export (the state machine + assist + durabar all re-derive; export shows **no** rollback lane).
- Full **14-screen regression** (Home, Live Flow, Run Inspector, Config, Runtime, Catalog, Plugins,
  Triggers, Streams, Migrations, DLQ, AI, Extensions, Auth) clean: holes=0, ovf=0, errs=0 on every
  route. The extended kit (`ns-statstrip`, `ns-step-timeline--data`, `ns-gauge`) did not regress S6.

## Honesty / not-yet-at-bar

- **Sort arrows on `ns-contable` are presentational** — real column sorting is logic, out of scope
  for a visual-only pass. The runtime **filter chips + text filter** DO filter the table (view-model
  derivation, no data mutation).
- The console **tab row** is presentational: Registry is the live view; Executions/Pools/Drift
  smooth-scroll to their in-page section (`scrollToSection`) rather than swapping panels — a
  no-logic-change affordance. A future pass could make them true panel-swapping tabs if the owner
  wants the exact Conduktor tab behavior.
- The Workers detail drawer reuses the **generic sheet** (right on desktop / bottom on mobile) rather
  than a persistent 3rd column — a deliberate choice to keep Workers **table-forward** and visually
  distinct from Sagas' 3-column console (the "two routes look the same" failure mode).
- `ns-smd` edge labels are compact; on very narrow widths the forward lane wraps to multiple rows
  (verified legible at 390px) rather than horizontally scrolling.

---

## Design-system uplift ledger

(Appended in full to `visual/DS-UPLIFT-BACKLOG.md` under **## Pass V4 — Workers + Sagas**.)

### New components
- `ns-conhead` + `ns-conbread` + `ns-contab` — console header: breadcrumb + underlined tab row with
  live counts. · Workers, Sagas; reusable on every console + control-plane screen.
- `ns-contoolbar` + `ns-rtchips` + `ns-rtbadge` — table toolbar + runtime filter chips + runtime
  badge column. · Workers; the badge/chip pattern is reusable wherever a polyglot/kind dimension
  needs a colored marker.
- `ns-runtimemix` — stacked distribution bar + dot legend (token-colored segments). · Workers;
  reusable for any categorical split (Streams backends, DLQ by-queue, capability mix).
- `ns-contable` — dense sortable console table (sort-arrow headers, selectable rows, sub-cells). ·
  Workers hero; the canonical dense-table for Catalog/DLQ/Auth/Migrations.
- `ns-drawer` — right detail-drawer contract (folds to bottom sheet on mobile). · Workers; reusable
  as the console detail surface everywhere (Run Inspector, DLQ, Auth).
- `ns-poolmeter` — liveness rows with a heartbeat pulse + consumer count + destructive dead-queue
  state. · Workers; reusable on Streams (subscriber liveness) + DLQ (consumer health).
- `ns-driftpanel` / `ns-driftrow` — drift rows tinted by state that **name the cause** + a deep-link
  assist. · Workers; reusable on Runtime (override drift), Config, Migrations.
- `ns-sagahero` — compensation-state summary band (state arc + correlation split + breakdown). ·
  Sagas; reusable on any state-machine primitive detail.
- `ns-durabar` — durability-tier pip viz. · Sagas; reusable for any tier/guarantee dimension
  (Streams delivery guarantee, DLQ backend durability).
- `ns-smd` — **saga state-machine mini-diagram** (forward lane + distinct rollback lane, edge branch
  labels, current-node ring). · Sagas hero; the reusable "small state/flow diagram" primitive (ref
  21) for Config topology, Trigger composite chains, and any compensating/branching flow.

### Refinements to existing components
- `ns-statstrip` → `--5` variant (2→3→5 responsive) + a `ns-conhead`-scoped denser tile
  (shorter padding, `text-xl` value) so console header strips read tighter than the S6 default.
- generic **right sheet** → viewport-branched `data-side` (right on desktop, **bottom on mobile**),
  so the same dialog serves as a desktop detail drawer and a mobile bottom sheet — now used by
  Workers row-detail in addition to S2/S13.
- `ns-step-timeline--data` → reused on Sagas with per-step **datum chips** derived from the saga
  history (`208ms` / `E_TIMEOUT` / `ref_102`), proving the V3 variant generalizes beyond Run Inspector.

### New tokens
- None — everything composed from existing `--ns-*` tokens (tone families, spacing, radius, text
  scale). The `.NET` runtime swatch uses `color-mix(in oklab, var(--ns-fg), var(--ns-card) 25%)` to
  stay theme-correct in both modes without a raw hex.

### New variants
- `ns-statstrip--5`; `ns-smd__lane--comp` (rollback lane); `ns-driftrow[data-state]`;
  `ns-durabar[data-tier]`.

### New options / data-attributes
- `ns-rtchip[data-state]` + `__dot[data-rt]`, `ns-rtbadge__dot[data-rt]`,
  `ns-runtimemix__seg[data-rt]` (deno/python/shell/dotnet/pwsh), `ns-contable__row[data-state]`,
  `ns-contable__th--sorted`, `ns-poolmeter__row[data-state='failed']`,
  `ns-driftrow[data-state]`, `ns-durabar[data-tier]`, `ns-smd__node[data-state][data-current]`,
  `ns-smd__edge[data-lane='comp']`.

### Mobile optimizations
- `ns-contable` scrolls horizontally inside its own `__scroll` container (body never scrolls at 390).
- Workers registry-row → **dedicated bottom sheet** (viewport-branched `data-side`), matching the
  brief's "selected row → detail bottom sheet on mobile".
- `ns-smd` lanes wrap to multiple rows on narrow viewports (no horizontal scroll), the rollback lane
  staying railed and distinct.
- `ns-statstrip--5` steps 2→3→5; `ns-sagahero` collapses to a single column < 560px.
