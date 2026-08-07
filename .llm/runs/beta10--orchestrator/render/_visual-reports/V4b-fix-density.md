# V4b-fix — Sagas canvas density pass (kill the dead space + elevate the surrounding sections)

**Screen:** S8 Sagas. The V4b redesign turned Sagas into an n8n-style node canvas (approved
direction), but the adversarial vision gate (`visual/_evals/V4b-adversarial-vision.md`, ACCEPT-WITH-
FIXES) flagged one real defect: **~75–80% of the canvas was empty dotted grid** — it failed the
"dense, no dead space" doctrine. This pass FILLS that void with tailored, data-driven content and
raises craft, then (per the coordinator addendum) elevates the surrounding sections from generic
dashboard chrome into bespoke saga components.

**Files touched (visual + layout only — routes/logic/data/copy-meaning unchanged):**
- `render/prototype.dc.html` — Sagas markup + S8 view-model derivations + `measureSagaEdges`
  extensions (rich on-wire annotation card + `drawSagaMinimap`). No other screen's markup touched.
- `render/assets/ns-ext.css` — all new component CSS appended under the `V4b-fix` banner. `proto.css`,
  `_ns_styles.css`, `support.js` NOT edited.

**Screenshots:** `_visual-reports/V4b-shots/` (overwritten) — Sagas × {desktop 1440, mobile 390} ×
{light, dark}, node-selected tabbed sidebar, mobile node-tap bottom sheet, all 4 instances
(`sagas-instance-{pw,csv,batch,export}.png`), the export no-rollback proof, and a
nav-away-and-back edge-redraw check (`sagas-navback.png`). The gate-flagged empty-canvas state is
preserved as `00-BEFORE-density-sagas-{desktop,mobile}-light.png`.

---

## Canvas fill — before → after

Measured with a 60×40 cell-coverage sampler over the identical `.ns-sgc__canvas` (content element
bounding boxes vs. canvas cells), desktop 1440, PaymentWebhookSaga:

| | cell coverage |
|---|---|
| **Before** (V4b: 5 nodes + 2 lane tags + toolbar — the gate-flagged state) | **29%** |
| **After** (+ mini-map, per-lane health strips, step rail, legend, ghost scope, on-wire annotation) | **47%** |

Bounding-box coverage went **29% → 47% (+18 pts)**. The gate's *visual* estimate of the before was
lower (~20%) because three of the five before-nodes were near-white cards reading as empty; the after
adds dense, high-contrast content (a real mini-graph, mono stat strips, a rail, rich edge
annotations), so the *effective* ink density roughly doubled. No large empty region survives at 1440
or 390 — the remaining grid reads as active canvas framed by the rail (left), lane header band (top),
legend (bottom-left) and mini-map (bottom-right).

---

## The 8 gate directives — what shipped

1. **Definition mini-map** (`ns-sgc__minimap` + `drawSagaMinimap`) — ~204×112 thumbnail docked
   bottom-right, drawn post-mount from each instance's `machine.def` topology. The full definition
   (forward + rollback rows) renders as small nodes/edges; the **current instance path** overlays in
   teal (forward) / amber (rollback), the selected node ringed copper. Fully data-driven and
   JS-measured (recomputed on resize / route-enter / instance-switch / node-select). On mobile it
   folds to a static full-width block.
2. **Per-lane compensation-health stat strip** (`ns-sgc__lanestat`) — a slim single-line pill beside
   each lane tag: forward = `avg latency · retry rate · states`; compensation = `comp success ·
   refunds · settling`. Derived per instance (`machine.laneHealth`); the comp strip is JS-pinned above
   the rollback row and is **absent when the instance has no rollback lane** (export).
3. **Rich edge annotations** (`annoCard` in `measureSagaEdges`) — the failing→compensating cross-wire
   now carries a solid card with an **error badge** (`E_TIMEOUT` / `PARTIAL` / `E_SCHEMA`), the branch
   label, and a payload snippet (`job_4183 · attempt 2/3`). The canvas itself explains *why*
   compensation fired.
4. **Step execution rail** (`ns-sgc__rail`) — a left-edge pip rail (pending → charged → reserving →
   refund → settled), tinted by state, the **current step enlarged** with a copper halo. Data-driven
   from `machine.rail`; suppressed on the mobile single-column stack.
5. **Ghost-node outlines** — queued/blocked scope states (`notify`, `settled`) render as ~42%-opacity
   dashed wireframes (`[data-ghost='1']`), so the canvas shows saga **scope**, not just executed
   history.
6. **Sortable columnar step table** (`ns-sgtable`) — replaced the airy timeline bullet list with a
   dense table: step / transition / timestamp / duration / error / attempt. Sortable headers with a
   caret (ref-11), inline `E_TIMEOUT` error badge, compensation rows tinted + `↩`-marked.
7. **Tabbed node inspector** (`ns-sgc__tabs`) — the node detail panel is now tabbed **State /
   Transitions / Evidence / Actions** (ref-11 drawer tabs; active = copper text + 2px underline). The
   grounded "why is this compensating?" moved to its own **Evidence** tab and "Retry this step" to
   **Actions**, out of one long scroll. Same tabs drive the mobile bottom sheet.
8. **Chromatic node identity** — forward nodes carry a **teal** top accent, compensation nodes a
   **copper** accent, terminal nodes a **neutral** accent (`[data-role]`), on top of the existing
   state tints (the live dot still reads state). A canvas legend (bottom-left) keys the four roles.
   All `--ns-teal-*` / `--ns-copper-*` tokens, no raw hex.

## Coordinator addendum — surrounding sections elevated

- **Four plain metric cards → a saga-health composite band** (`ns-sghealth`): a compensation-rate
  radial meter (conic, `--v`-driven), an in-flight vs terminal split with a fill bar, an
  instances-by-state stacked channel bar + legend, and a forward↔rollback edge ratio. One saga-native
  strip instead of four indistinguishable numbers.
- **Transitions panel → a typed transition stream** (`ns-sgstream`): grouped by instance with an
  instance header + status badge, each row a **typed transition** — advance `→`, compensate `↩`,
  terminal `◼`, fault `✕` — glyph-blocked and tone-coded, timestamped, with a legend key in the panel
  header.
- The **page intro** already read saga-specific (the `COMPENSATING` lede); left as-is to avoid copy
  drift.

---

## Data-driven proof (4 instances)

Every new component re-derives per instance:
- **PaymentWebhookSaga** (compensating) — full rollback, `E_TIMEOUT` annotation, 2 ghosts.
- **CsvImportSaga** (compensate-then-**complete**) — `PARTIAL` annotation, forward path reaches
  `completed`; mini-map shows recovery.
- **ProductBatchImportSaga** (compensate-then-**fail**) — `E_SCHEMA`, terminal `failed`.
- **ProductCatalogExportSaga** (at-most-once, **no rollback**) — forward-only lane, **no comp lane, no
  comp health strip, no cross-edge annotation**; mini-map/rail/health all adapt to a 2-node forward
  saga. (`sagas-export-no-rollback.png` / `sagas-instance-export.png`.)

## Verification

- **Zero `{{ }}` holes, zero console errors, zero horizontal overflow** on Sagas × desktop(1440) +
  mobile(390) × light + dark, in the default state AND node-selected. Mobile correctly suppresses
  edge geometry (edges=0) while the mini-map still folds in (mm=13); no body h-scroll.
- **Connectors + mini-map are JS-measured** from `getBoundingClientRect()` / `machine.def` and recompute
  on resize / route-enter / instance-switch / node-select. Nav-away-and-back redraws the 4 edges
  (`sagas-navback.png`). **No SVG `{{ }}` template holes** — all geometry is post-mount JS or div/CSS.
- **Full 16-route regression clean** (Home, Config Resolution, Runtime Config, Catalog, Live Flow, Run
  Inspector, Plugins, Workers, Sagas, Triggers, Streams, Migrations, DLQ, Auth Sessions, AI,
  Extensions): holes=0, ovf=0, errs=0 on every route. Shared-file edits are scoped to S8 + additive
  CSS.

## Honest gaps

- **Long node names still ellipsize on the canvas** (`validation` → `validati…`, `rollback 88` →
  `rollback…`); the full name always shows in the sidebar/sheet. Node cards are fixed-width for a tidy
  grid (unchanged from V4b).
- The on-wire annotation card is sized to its wider text line; the cross-edge connector visually
  crosses the payload line at the card center. Payloads were shortened so they fit within the card;
  the crossing is cosmetic (the card fill sits over the wire).
- **Zoom remains presentational** (toolbar −/+/fit toast "fit-to-view") — real pan/zoom is interaction
  logic beyond a visual-only pass (unchanged from V4b).
- The canvas still stretches to the equal-height sidebar; a firm `min-height` now reserves a clean
  bottom band so the mini-map never collides with a row-2 rollback node on short instances, and the
  legend/mini-map/toolbar frame the lower canvas so it reads as stage, not dead space.
