# Slice 4 — Prototype pass 1: four composed dashboard screens on the canvas

**Commit:** (see this push)

**Lane:** Fable-5 medium sub-agent (design/creativity lane per owner directive); supervisor review + landing.

**Deliverables** (`resources/design/dashboard/`):

- `screens/01-stack-map.html` — shell + `ns-stackmap`: 8 Aspire resources, measured SVG edge layer, redis `degraded` @ mem 92%, node selection (`aria-pressed`) populating a context rail (endpoints, connector probes, stats, restart/stop/logs + `aspire resource restart` CodeBlock).
- `screens/02-flow-trace.html` — trace list (6 real traces) → `ns-waterfall` on the flagship `POST /api/imports` trace (13 spans, 1.12 s, eis-chat delivery `retrying` 2/5); span-detail rail; correlated `ns-log-stream` strip.
- `screens/03-service-catalog.html` — `ns-tree-nav` contract tree (5 plugins / 47 procedures), endpoint DataTable, typed API-explorer rail (`workers.jobs.enqueue`); `crons` → `ns-plugin-gated-view`.
- `screens/04-run-inspector.html` — FilterForm (live filters + zero-match EmptyState), 7-run entity rail covering all six statuses, StatsGrid + Tabs-driven `ns-step-timeline` (All/Compact/JSON), events feed + context rail.
- `screens/proto.css` (~1090 lines) — net-new CSS with sync-back candidates separated from screen glue in the header.
- `DECISIONS.md` — DDX-0 verdict table + net-new contract deltas.

**DDX-0 (promote-set) verdicts:** all 7 blocks validated in composition (breadcrumbs, context-rail, plugin-gated-view, activity-feed, connector, entity-rail, tree-nav). Contract deltas recorded: `ns-waterfall` selection moved to `aria-selected`; `ns-stackmap` uses `aria-pressed` + measured edge layer (hidden ≤860 px); `ns-step-timeline` JSON view is a composition-level CodeBlock swap; glue promoted for consideration (Tabs skin, `ns-page-header--console`, `ns-envbar`, `ns-rail-grid`, DataTable interactive-row mode).

**Narrative coherence:** all four screens narrate one incident — import `job_4183` (12,412 rows, 720 ms, redis degraded, eis-chat retry 2/5) recurs across stack map, trace, logs, and run inspector.

**Supervisor review PASS:** every screen loads `../_ns_runtime.js` + `../_ns_styles.css` (0 `_ds_bundle` refs); hex 0 / `className` 0 / banned voice 0; 55 unique `--ns-*` tokens all defined in the 162-token closure; inline scripts parse-clean; all referenced NSOne exports exist in the runtime.

**Canvas:** `screens/*` (5 files) uploaded via planId `plan_ec262e10d4ad451f_703d39e2ee7c`; remote tree verified.

Owner: pass-1 screens are live on the canvas (`screens/01…04`, `?theme=light|dark` supported). Your review = the slice-5 steering point (re-sync checkpoint, then pass 2: Plugin Control, Logs, Resource Control + capability sections).
