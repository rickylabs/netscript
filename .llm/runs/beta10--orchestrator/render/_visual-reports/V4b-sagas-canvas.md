# V4b — Sagas as a canvas-dominant node graph (n8n / flow-builder)

**Screen:** S8 Sagas — redesigned from a boring 3-column console template into a **full-bleed node-graph
canvas with a click-to-open properties sidebar**. The Workers screen was **not touched**.
**Files touched:** `render/prototype.dc.html` (Sagas markup + view-model derivations + a post-mount
`measureSagaEdges` connector drawer + sheet wiring — routes/logic/data/copy-meaning unchanged),
`render/assets/ns-ext.css` (all new `ns-sgc` component CSS). `_ns_styles.css`, `support.js`, and
`proto.css` were **not** edited.
**Final screenshots:** `_visual-reports/V4b-shots/` — Sagas desktop 1440 + mobile 390 × light + dark,
the **node-selected properties sidebar** (desktop), the **node-tap bottom sheet** (mobile), the
**export instance with NO rollback lane** (data-driven proof), plus BEFORE references and full-page
captures.

---

## The design question — answered FIRST, then designed around

> *What tailored components, layout, composition, data-viz, and data structure best showcase Sagas —
> and how do they compose?*

**The saga state machine IS a node graph, so the SCREEN must be a canvas — not a card inside a
template.** A saga is a spatial object: forward states wired in sequence, and when a step fails, a
*reverse* compensation branch that unwinds side-effects. Every other console in this dashboard answers
a *list/table* question (Workers = "which units exist"); Sagas answers a *topology* question ("how did
this instance flow, and where did it branch into rollback"). The only honest way to render `COMPENSATING`
— a status no other tool models — is to **draw the machine as the dominant surface** and let the
operator **click a node to configure/inspect it**, exactly like an n8n / outamate flow builder.

So the composition is:
1. **A dotted-grid, full-bleed CANVAS** as the dominant element — state-node cards laid out on a
   forward lane (row 1, left→right) and a visually distinct **rollback lane** (row 2), wired by
   **JS-measured connectors** with floating branch labels. This is not squeezed into a center column.
2. **A properties sidebar docked right** (bottom sheet on mobile) — instance summary by default,
   the selected node's full config when you click a node. This is the n8n interaction.
3. **A slim instance switcher strip** on the canvas top edge — NOT a fat left column (which is what
   recreated the 3-col look).
4. A minimal **canvas toolbar** (zoom / fit / ✦ assist), like ref 21's bottom bar.
5. The rich step-timeline + transitions feed demote to a **slim supporting strip below the canvas**,
   so they inform without competing.

---

## Ref 21 (outamate flow-builder) — patterns mined and where they landed

| Ref-21 pattern | What I took | Where it landed in Sagas |
|----------------|-------------|--------------------------|
| **Node-graph on a dotted canvas** | full-bleed dotted-grid stage; nodes are cards, not list rows | `ns-sgc__canvas` (two radial-gradient dot layers, theme-blind) + `ns-sgc__grid` |
| **Nodes wired by connectors with floating branch labels** ("Get 30% Off" / "No Thanks") | measured bezier connectors + a floating label with a backing chip | `ns-sgc__edge*` drawn by `measureSagaEdges` from `getBoundingClientRect()` — branch labels `enqueue job` / `on reserve` / `reserve failed → compensate` / `settle` |
| **A start → branch flow with a divergent path** | a **cross-edge** that drops the failed forward state down into a distinct reverse lane | `ns-sgc__edge[data-lane='cross']` (dashed warning, arrow ↓) + the whole `data-lane='comp'` rollback lane (dashed reverse connectors, warning-railed nodes) |
| **Right-hand PROPERTIES PANEL showing the selected node's config** (Title / Responses / Text / Quick Reply) | click a node → sidebar swaps to that node's detail | `ns-sgc__props` node mode: status badge + KV (capability/timing/attempt/lane) + **transitions** + **payload at state** + **node actions** |
| **A selected-node ring** | copper selected ring + the current node's dashed ring; edges touching the selection recolor copper | `ns-sgc__node[data-selected]` / `[data-current]` + active-edge recolor in `measureSagaEdges` |
| **Bottom canvas toolbar** (zoom −/100%/+, hand, fit, ✦ Ask AI) | a floating pill toolbar pinned bottom-center | `ns-sgc__toolbar` (− / % / + / ⤢ fit / ✦ assist) |
| **Component palette / node identity tiles** | an icon-tile per node (✓/⚙/◷/⟲/◑) reading its capability | `ns-sgc__node-tile` (state-tinted) |

---

## Component contracts (all `--ns-*` tokens, no raw hex, no SVG `{{ }}` holes)

- **Canvas frame** — `ns-sgc` (grid: `1fr` canvas + `21–23rem` sidebar; stacks < 1024px);
  `ns-sgc__switcher` / `__inst[data-state]` / `__inst-dot[data-tone]` (instance switcher strip);
  `ns-sgc__stagewrap` (holds canvas + toolbar); `ns-sgc__canvas` (dotted grid + min-height);
  `ns-sgc__grid` (3 columns × 2 lane-rows via `data-col`/`data-row`); `ns-sgc__edges` (SVG layer).
- **Node** — `ns-sgc__node[data-lane][data-state][data-current][data-selected][data-col][data-row]`
  with `__node-head` (`__tile` icon + `__name` + live `__dot`), `__cap`, `__foot`(`__metric`).
  State tints reuse success/warning/destructive/primary subtle+border families; running/retrying dot
  **pulses**; comp-lane nodes carry a warning left-rail; current node gets a dashed ring; selected
  gets a copper ring. `onClick` → `pick()` sets `s8Node` (+ opens the bottom sheet on mobile).
- **Connectors** — drawn post-mount by `measureSagaEdges()`: forward (`M…C…` bezier, arrow `→`),
  a **cross-edge** (`data-lane='cross'`, dashed warning, arrow `↓`, `crossFrom` forward node →
  first comp node), a **reverse rollback lane** (`data-lane='comp'`, dashed warning). Each edge gets
  a label + `__edge-labelbg` backing rect so text reads over the dots. Edges touching the selected
  node take `data-state='active'` (copper). Suppressed < 640px. `scheduleSagaEdges` polls for node
  readiness (same shape as `scheduleEdgeMeasure`); re-run on resize / route-enter / instance-switch,
  and `measureSagaEdges` alone on node-select (cheap recolor).
- **Properties sidebar** — `ns-sgc__props`. **Summary mode** (default): state gauge + correlation KV
  + the grounded "why is this compensating?" assist + instance actions (Open run / View trace).
  **Node mode** (a node is picked): `__props-eyebrow` (forward/compensation state) + `← summary`
  clear, node title + status badge, KV (capability/timing/attempt/lane), `ns-sgc__trans` in/out/comp
  **transitions** (directional glyphs; comp row warning-toned), `ns-sgc__props-payload` **payload at
  state**, and **node actions** (Retry this step / Force-complete compensation — the existing
  confirm+CLI flows — plus linked-execution + Run-Inspector deep-links).
- **Toolbar / lane tags** — `ns-sgc__toolbar` (`__tool`, `__tool-zoom`, `__tool-sep`);
  `ns-sgc__lane-tag[data-lane]` (JS-positioned above the rollback row; hidden on mobile).

## Data structure that makes it data-driven

Each instance's `machine` gained a graph-ready shape: every node has `id`, `col`, `lane` (`fwd`/`comp`),
`state`, `current`, an outgoing branch `edge` label, plus rich sidebar detail (`timing`, `attempt`,
`payload`, `trans[]` in/out/comp, optional `action`), and the machine carries `crossFrom` / `crossEdge`
for the forward→rollback drop. Because `hasComp` is per-instance, the composition is genuinely
data-driven: **PaymentWebhookSaga** (5 nodes, full rollback), **CsvImportSaga** (compensate-then-
complete), **ProductBatchImportSaga** (compensate-then-fail), and **ProductCatalogExportSaga** — the
ACTIVE at-most-once export — render **only the forward lane, no rollback branch, no comp lane tag**
(`sagas-export-no-rollback.png`), exactly as the current build behaves.

---

## Mobile behavior

- The canvas **stacks to a single readable column** < 640px; `measureSagaEdges` suppresses connector
  geometry (identical to the stackmap ≤ 860px rule) so there is **no horizontal body scroll**. Comp
  nodes keep their warning left-rail, so the rollback lane stays visually distinct without the two
  floating lane tags (hidden on mobile to avoid both pinning to the top of a single column).
- **Tapping a node opens a bottom sheet** (`sheet: 's8'`) with the same properties content — status,
  KV, transitions, payload, node action, linked-execution, and "back to instance summary". This is
  the mobile equivalent of the desktop docked sidebar (the n8n bottom-sheet pattern).
- The instance switcher strip **scrolls horizontally**; the properties sidebar reflows to a full-width
  block under the canvas; the toolbar stays pinned bottom-center.

---

## Before / after

- **Before (rejected):** a `ns-console-grid` 3-column template — a definitions/instances **left rail**,
  a center column stacking a hero card + a small `ns-smd` **mini-diagram card** + a "why" assist + a
  long step timeline, and a **transitions right rail**. The state machine was a footnote inside the
  same skeleton every other console uses. (`00-BEFORE-sagas-desktop-light.png`)
- **After:** a **canvas-dominant screen** — a slim instance switcher strip, a **full-bleed dotted-grid
  node graph** (forward lane + a distinct dashed reverse rollback lane, measured connectors with branch
  labels, a cross-edge dropping the failed state into rollback, current-node ring), a **canvas toolbar**,
  and a **click-to-open properties sidebar** (instance summary → node config). The step timeline +
  transitions demote to a slim supporting strip below. It reads as a different *kind* of screen from
  Workers (table), Live Flow (causal chain), and Run Inspector (timeline). (`sagas-desktop-light.png`,
  `sagas-desktop-light-node-selected.png`)

---

## Verification

- **Zero `{{ }}` holes, zero console errors** (favicon 404 excluded), **zero horizontal overflow**
  across Sagas × desktop(1440) + mobile(390) × light + dark (8 base states), plus interaction states:
  node-select → desktop sidebar swap + active-edge recolor; node-tap → mobile bottom sheet;
  instance-switch across pw / csv / batch / export (nodes, lanes, connectors, gauge, assist all
  re-derive — export shows **2 nodes, 0 comp, 1 edge**; pw shows **5 nodes, 2 comp, 4 edges**).
- Connectors are **measured from `getBoundingClientRect()`** into an SVG layer post-mount and recomputed
  on resize / route-enter / instance-switch / node-select (the `ns-stackmap` / `measureEdges` pattern) —
  no SVG `{{ }}` holes. Verified 4 `path.ns-sgc__edge` + 4 `text.ns-sgc__edge-label` on pw desktop,
  **0** on mobile (correctly suppressed in the single-column stack).
- **Full 16-route regression clean:** Home, Config, Runtime, Catalog, Plugins, Run Inspector, Workers,
  Sagas, Triggers, Streams, Migrations, DLQ, Live Flow, AI, Auth, Extensions — holes=0, ovf=0, errs=0
  on every route. **Workers, Home, and the investigation spine render byte-identical to before** — the
  shared-file edits are scoped to Sagas + additive `ns-sgc` CSS. The `_resize` handler now also calls
  `measureSagaEdges` on the sagas route; Config's stackmap still measures correctly.

## Honesty / not-yet-at-bar

- **Zoom is presentational.** The toolbar `−`/`+` buttons toast "fit-to-view" rather than actually
  scaling the canvas — real pan/zoom is interaction logic beyond a visual-only pass. The `%` readout
  and `⤢ fit` are honest affordances; the graph is already fully visible at 100%.
- **Long node names ellipsize on the canvas** (e.g. `rollback 88` → `rollback …`); the full name always
  shows in the properties sidebar/sheet. Node cards are fixed-width for a tidy grid.
- **A 2-node instance (export) leaves visible empty canvas** below the graph. This is honest for a short
  in-flight saga and reads as canvas real estate (flow builders have pannable empty space); the dotted
  grid + toolbar keep it reading as a stage, not dead space. Equal-height columns mean a tall sidebar
  (rich why-assist) can also extend the canvas below the graph.
- **`ns-smd` (the V4 inline mini-diagram) is retained** in the codebase/kit as the small reusable
  variant, but is no longer used on the Sagas screen — `ns-sgc` supersedes it there.

---

## Design-system uplift ledger

(Appended in full to `visual/DS-UPLIFT-BACKLOG.md` under **## Pass V4b — Sagas canvas**.)

### New components
- `ns-sgc` — saga-graph-canvas **screen frame** (dominant canvas + docked properties sidebar). Reusable
  canvas-forward shell for any node-graph route (Config topology at screen scale, a Trigger composite
  builder, a Journey composition).
- `ns-sgc__canvas` / `__grid` / `__edges` — dotted-grid **canvas stage** + a post-mount SVG **edge
  layer** (measured geometry, no `{{ }}` holes). The reusable spatial-graph substrate.
- `ns-sgc__node` — a state-tinted **graph-node card** (icon tile + name + live/pulsing state dot +
  capability + timing/attempt; selected ring, current dashed ring, comp-lane warning rail).
- `ns-sgc__switcher` / `__inst` — a slim horizontal **instance switcher strip** (replaces the fat left
  rail). Reusable "which instance/run" top control.
- `ns-sgc__toolbar` — a floating **canvas toolbar** (zoom / fit / ✦ assist), ref-21 bottom bar.
- `ns-sgc__props` — the **properties sidebar / inspector** (instance summary ↔ node detail); folds to a
  bottom sheet < 1024px. The reusable "click node → configure" surface.
- `ns-sgc__trans` — directional in/out/compensation **transition rows**.
- `ns-sgc__lane-tag` — floating **lane rails** ("forward path" / "⟲ compensation · rollback lane").
- `ns-sgc__edge*` — JS-measured bezier **connectors** (forward / cross-edge / reverse rollback) with
  floating branch labels + backing chips; active-edge copper recolor on node-select.

### Refinements to existing components
- Generic right sheet → now also the **Sagas node bottom sheet** on mobile (`sheetIsS8`); one dialog
  serves S2/S7/S8/S13.
- `ns-durabar` relocated into the page-header toolbar (the left rail is gone); contract unchanged.
- `ns-sagahero` gauge / `ns-kv--split` / `ns-assist` recomposed **inside** the narrow properties
  sidebar (summary mode), proving they compose in an inspector column, not just a wide hero band.
- `measureEdges` pattern generalized into `measureSagaEdges` / `scheduleSagaEdges` — the
  measured-connector approach is now a repeatable primitive.

### New tokens
- None. Dotted grid + node/edge tints are all `color-mix` over existing token families (theme-blind,
  no raw hex).

### New variants
- `ns-sgc__node[data-lane='comp']`, `ns-sgc__edge[data-lane='comp'|'cross']`,
  `ns-sgc__inst[data-state='selected']`, `ns-sgc__tool[data-variant='assist']`, properties
  `mode: 'summary' | 'node'`.

### New options / data-attributes
- `ns-sgc__node[data-col][data-row][data-state][data-current][data-selected][data-lane]`,
  `ns-sgc__inst-dot[data-tone]`, `ns-sgc__edge[data-lane][data-state]`,
  `ns-sgc__trans-row[data-lane]`, `ns-sgc__lane-tag[data-lane]`. Saga node model gained
  `col`/`lane`/`timing`/`attempt`/`payload`/`trans`/`action` + machine `crossFrom`/`crossEdge`.

### Mobile optimizations
- Canvas stacks to a single column < 640px (edge geometry suppressed, body never scrolls); comp nodes
  keep the warning rail; lane tags hidden.
- Node tap → dedicated bottom sheet (properties content).
- Instance switcher strip scrolls horizontally; sidebar reflows full-width under the canvas; toolbar
  stays pinned.
