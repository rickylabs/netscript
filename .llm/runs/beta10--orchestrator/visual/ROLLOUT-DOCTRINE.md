# Rollout doctrine — every screen BESPOKE, every pass PUSHES the bar

The V2b Home is the quality floor. The rollout is **NOT** "apply the Home kit uniformly" — that makes
every screen look the same, which is the exact failure to avoid. For EACH screen:

1. **Ask the design question FIRST (before touching CSS):**
   *"What tailored components, layout, composition, data visualization, and data structure best
   showcase THIS feature — and how do they compose together?"* Design the screen around its feature,
   not around a generic template. Write your answer at the top of your report.

2. **Mine a DIFFERENT reference each pass.** Before designing, open reference PNGs in
   `references/` you haven't fully mined yet and extract NEW variants / patterns / visualizations to
   apply here. State what you took and from which ref. The references are rich — there are many
   visualization variants beyond what Home used (data-point / scatter charts, line + crosshair +
   value tooltip, timeline / step charts, radial + arc gauges, sparkbars, calendar/day strips, tinted
   category cards, avatar stacks, KV / split panels, segmented controls, stacked bars, funnel tables,
   status/tag/timer pills, marketplace cards, thread/transcript layouts, etc.). Find the ones that fit.

3. **Invent new visualizations + components** tailored to the feature — do NOT be capped by the
   current DS or the existing kit. Keep NS One identity so it round-trips + is liftable: `--ns-*`
   tokens only (no raw hex), `ns-*` class contracts, warm-cream/dark, hard press shadow, copper/teal/
   amber, DM Sans/Mono. Token-driven, **NO SVG `{{ }}` holes** (div/CSS or post-mount JS geometry).

4. **Reuse the shared kit + chrome** for consistency (sidenav / topbar / gauge / donut / channel-bar /
   data-table / status-pills / segmented / filled-area / delta pill / bottom-sheet), but **each screen
   adds its OWN tailored components** so no two screens read the same.

5. **Match the reference craft:** bespoke, multi-layer, dense, no dead space, strong hierarchy, a
   clear UX story. Responsive / mobile-first with **dedicated bottom sheets** for detail/actions/
   filters. Verify desktop 1440 + mobile 390, both themes; zero `{{ }}` / zero console errors / zero
   h-overflow every iteration; regression-check the other screens (shared file). Compare each widget
   to a reference — if it's flatter/sparser, keep going.

6. **Append to `DS-UPLIFT-BACKLOG.md`** every pass: new components / refinements / tokens / variants /
   options / mobile optimizations.

## Reference assignment (mine fresh patterns per pass — don't reuse the same ref every time)
- **Home (done):** 03-analytics-cards, 01-synergy-desktop.
- **Investigation spine (Live Flow + Run Inspector):** 04-finance-cards (line + crosshair + value
  tooltip + OHLC footer; arc gauge), 05-timeoff-workhour (work-hour line with a data-point tooltip;
  time-range segmented). The causal JOURNEY deserves a bespoke flow/timeline visualization, and the
  inspector a rich step-timeline with data-point tooltips — mine these two refs for that.
- **Capability consoles (Workers/Sagas/Triggers/Streams + leaves):** 02-synergy-mobile-nav, 08/09/10
  (mine list→detail, tables, timelines, tinted cards, avatar/provenance).
- **Control plane (Config/Runtime/Catalog/Migrations/DLQ/Auth):** 06-mobile-sheets (sheets/forms),
  revisit 03/04 for tables/gauges/segmented + the topology graph deserves its own bespoke viz.
- **AI + Extensions + Plugins:** 07-chat-signin (thread/transcript, forms), + any unmined ref.
Each pass MUST look at its assigned refs (and browse the others) fresh and pull NEW patterns.

## NEW references (added 2026-07-13 — dev-console + flow-builder; MORE on-domain, mine heavily)
- **11 / 12 / 13-devconsole-* (Kafka / Conduktor consoles)** — the best patterns for our consoles +
  control plane + inspector:
  - **Console layout:** breadcrumb (`Topics > name`) + a **tab row** (Consume/Produce/Config/Schema/…)
    + a compact **stat strip** (RECORDS / SIZE / PARTITIONS / REPLICATION) + a **dense sortable data
    table** (sortable headers, monospace) + a toolbar (search + dropdowns + "Add filter" + "More
    filters") + a **right-side detail/filter DRAWER** (→ mobile bottom sheet) with its own docs tabs.
    → Workers / Sagas / Triggers / Streams consoles, **Run Inspector**, DLQ, Auth.
  - **Version / code-diff viewer (13):** version dropdowns (v3→v4) + side-by-side **line-numbered code
    with red/green diff highlighting**. → Catalog (contract schema), Runtime **version chain
    v41→v42→v43**, Migrations (schema diff).
  - **Env indicator:** workspace + green "Connected". → topbar.
- **21-flow-builder (outamate node-graph)** — a **node-graph canvas** (nodes + connectors + branch
  labels) + a right **properties panel** + a **component palette** (Text/Image/Gallery/Button). →
  **Config topology** wiring graph, the **Trigger builder** ("Draft with AI" typed form), and the
  causal **Journey** composition.
- **19-pm-dashboard (Mondays)** — greeting header + stat strip + projects **table with status pills**
  + a **schedule day-strip** + a notes checklist. → list/table + day-strip patterns.
- **14–18, 20** — browse for more variants (data-point charts, etc.).

### Updated per-screen reference mapping
- **Investigation spine:** + **11** (console table + right drawer/bottom-sheet → Run Inspector), **21**
  (node-graph feel → the journey). (still + 04/05 for line+data-point tooltip.)
- **Capability consoles:** **11 / 12 / 13** PRIMARY (console layout: breadcrumb + tabs + stat strip +
  sortable table + detail drawer).
- **Control plane:** **13** (version/code diff) → Runtime/Catalog/Migrations; **21** (node graph) →
  Config topology; 06 (sheets/forms) → DLQ/Auth actions.
- **AI + Extensions + trigger builder:** **21** (flow + palette), 07 (thread/transcript).
