# V2 — BOLD shell + Home redesign (sets the new quality bar)

Scope: **shell (sidebar + topbar) + Home only**. Visual + layout only — no route, logic, data,
feature, or copy-meaning change. Warm-cream light + dark, hard-offset press shadow, `--ns-*` tokens
only (no raw hex), `ns-*` class markup, DM Sans / DM Mono preserved. Zero `{{ }}` in the rendered
DOM, zero console errors, no horizontal body scroll — verified desktop (1440×900) **and** mobile
(390×844), both themes, plus a rail-collapsed and drawer-open pass.

Reference bar: `references/01-synergy-hr-desktop`, `02-synergy-mobile-nav`, `03-analytics-cards`,
`04-finance-cards`, `05-timeoff-workhour-cards`, `06-mobile-sheets`, `08-ref` (Pulsar, the closest
dev-dashboard analogue), `09-ref`. Adopted their **structure / density / component-variety /
hierarchy / chrome / responsiveness**; kept NS One's **identity** (copper primary, teal/amber/red
state — not the refs' purple/green/soft-rounded).

## Files touched
- `render/prototype.dc.html` — shell markup (sidebar + topbar), Home markup recomposition, S1 data
  builders in the `data-dc-script` logic, two post-mount geometry drawers.
- `render/assets/ns-ext.css` — all net-new component CSS (loads last; overrides DS defaults where
  needed). `proto.css` and the DS `_ns_styles.css` / `support.js` were **not** edited.

## The one collision that mattered (recorded so it doesn't recur)
The DS ships a layout primitive named **`.ns-sidebar`** (Every-Layout "Sidebar": a horizontal
sidebar+content flex row). Adding `ns-sidebar` to the dashboard `<aside>` collided with it and threw
the whole sidebar into a horizontal 3-column blowout. **Fix:** my sidebar block is namespaced
`ns-sidenav*` (NOT `ns-sidebar*`); the DS shell classes `ns-dashboard__sidebar*` and the token
`--ns-sidebar-width` are untouched. Anyone extending the shell must avoid the bare `.ns-sidebar`
class name.

---

## 1. Sidebar — now a signature (`ns-sidenav*`)
- **Brand tile**: copper gradient `n.` mark + "net script / DEV DASHBOARD" wordmark, click → Home.
- **Grouped icon nav** (Overview / Capabilities / Data / System) with per-item **icon tiles**,
  derived count badges (toned only when carrying a live count), and an **active-item treatment**:
  copper left **accent bar** (`ns-sidenav__item-rail`, spring-scaled in) + `primary-subtle` fill +
  filled copper icon tile on `aria-current="page"`.
- **Collapsible icon rail**: header `«/»` toggle drives `ns-sidenav--rail` (state `rail` in the DC
  logic). Desktop `:has(.ns-sidenav--rail)` shrinks the grid column to 4.75rem, hides labels/badges/
  group-labels, centres icons, adds group dividers, and floats an expand affordance. 76px collapsed,
  no overflow.
- **Pinned footer**: a **workspace card** (`my-app` + status dot + `local · aspire · running|degraded`
  + switch key) and a **profile card** (`NS` avatar + `dev@local ✓` + `workspace owner` + chevron) —
  the ref-01/02 bottom-pinned pattern.

### New `ns-sidenav` class contract
`ns-sidenav` (root) · `__header __brand __mark __mark-dot __wordmark __brand-sub`
· `__rail-toggle __close __body __group __group-label`
· `__item __icon __label __badge __item-rail` (state: `[aria-current="page"]`)
· `__footer __workspace __ws-dot[data-state] __ws-main __ws-name __ws-meta __ws-state __ws-switch`
· `__profile __avatar __profile-main __profile-name __profile-verify __profile-role __profile-chevron`
· modifier `ns-sidenav--rail`.

## 2. Topbar — real elegant header (`ns-topbar2*`)
Balanced, not a thin strip: taller header with a **heading block** (contextual eyebrow +
`ns-topbar2__title` = current screen name; breadcrumb trail shows only on deep routes so Home isn't
doubled), and a right cluster: **env pill** (`local · my-app · aspire`, toned by health), a
**prominent search / ⌘K** (`Search routes, runs, correlations…`), an **Open Aspire ↗** action, a
divider, and the theme toggle. Mobile collapses to ☰ + title + mini-search + theme toggle.

### New `ns-topbar2` class contract
`ns-topbar2` · `__start __heading __crumbs __eyebrow __title __end __env __search __search-mini
__aspire __divider __theme`. New bindings: `crumb`, `hasCrumbTrail`, `envEyebrow`, `railClass`,
`railPressed`, `railGlyph`, `toggleRail`, `envLabel`.

## 3. Home — recomposed to reference density + a reusable kit
Layout is now an explicit grid (`ns-home`) with named bands, no dead space:
1. **KPI strip** (`ns-home__kpis`, 4-up) — KPI blocks with big value + **delta chip**
   (`ns-deltachip`, toned pill) + token-colored sparkline (existing post-mount SVG draw).
2. **Hero band** (`ns-home__hero`) — AI **Incident summary** (left) + **Wiring-health radial gauge**
   card (`ns-gaugecard` / `ns-gauge`): a masked conic-gradient semi-donut ("16/20 nodes wired") with
   a verdict badge and a healthy/degraded/unbound **stat trio**.
3. **Analysis band** (`ns-home__analysis`, 3-up):
   - **Execution outcomes** — stacked **channel bar** (`ns-channelbar`) + **legend** (`ns-legend`) +
     **data rows** (`ns-datarow` = icon-tile + label + metric + **trend arrow** `ns-trendarrow`).
   - **Capability mix** — segmented **donut** (`ns-donut`, conic-gradient ring + centre hole) +
     clickable legend, colored from the copper/teal/amber palette.
   - **Wiring signals** — declared-vs-running **data rows** with **status pills** and a **segmented
     time control** (`ns-segtime`, reuses `ns-seg`).
4. **Where-to-look** — section header with rule + the 6 deep-linking `ns-statlink` health cards
   (6-up desktop → 3 → 2 → 1).
5. **Just-happened** teaser strip (`ns-teaser-item`).
6. **Bottom band** — Command palette (`ns-quickcmd` list) + Contributed panels (`ns-contribgrid`).

### Geometry — no SVG `{{ }}` holes
Two new post-mount drawers alongside `drawSparks`, following the sanctioned imperative pattern
(read a `data-*` attribute, set style; never interpolate into a path):
- `drawGauges()` — sets `.ns-gauge__ring` to a masked `conic-gradient(from -90deg, …)` from
  `data-value`.
- `drawDonuts()` — builds a gapped multi-stop `conic-gradient` on `.ns-donut__ring` from
  `data-segments`.
Both are re-run on every update (theme flip, sim tick) and are `prefers-reduced-motion`-safe.

### New Home kit class contract (reusable across screens)
`ns-deltachip[data-tone]` · `ns-panelcard(__head __title-wrap __sub __body __list)` ·
`ns-gaugecard(__head __stats __stat __stat-dot[data-tone] __stat-val __stat-label)` ·
`ns-gauge[data-tone][data-value](__ring __center __value __caption)` ·
`ns-channelbar __seg[data-tone]` · `ns-legend __item __dot[data-tone]` ·
`ns-datarow[data-tone](__icon[data-tone] __label __metric __pill)` · `ns-trendarrow[data-dir]` ·
`ns-donut[data-segments](__ring __hole __total __total-label __legend __legend-item __legend-label
__legend-val)` · `ns-segtime` · `ns-teaser-item(__text __time)` ·
`ns-contribgrid(--head __row __panel __mount)`.

## 4. Responsive / mobile-first (was entirely missing)
Mobile-first breakpoints on both shell and Home:
- **≥1440** 6-up stat grid; **≥1025** full sidebar + multi-column bands.
- **≤1024** sidebar → drawer (DS behavior, now with a **dimmed + blurred backdrop** and drawer
  shadow), hero/analysis/bottom collapse to single column, KPIs 2-up.
- **≤640** KPIs & stat grid 2-up (compacted), donut stacks with a 2-col legend, teaser stacks,
  contributed-panels drops the mount target under the panel name.
- **≤360** KPIs / stat grid go 1-up.
Root cause of the two overflow regressions found and fixed: an implicit-grid `.ns-home` column
sizing to `max-content`, and `1fr` grid tracks not allowing shrink — both resolved with
`grid-template-columns: minmax(0,1fr)` / `minmax(0,…)` and `min-width:0`. Final: **0px horizontal
overflow** at every tested width.

## Verification
- 4 primary combos (Home desktop+mobile × light+dark): **0 `{{ }}` holes, 0 console errors, 0
  horizontal overflow**.
- Regression sweep: clicked through **all 16 nav screens** after the shell change — every one still
  0 holes / 0 overflow / 0 errors, and the new contextual topbar title resolves per route.
- Rail-collapse (76px, clean) and mobile drawer (backdrop + close) both verified.

## Deferred (next rollout waves, not this pass)
- Roll the same kit + density + responsiveness across the other 15 screens (investigation spine,
  capability consoles + detail/leaf, control plane incl. topology, AI, extensions).
- Rail-collapse state is session-local (not persisted) and the segmented time control on "Wiring
  signals" is presentational (no data re-slice) — intentional for this visual pass.
- Final dark-mode + motion + empty/loading/error polish pass once the kit is applied everywhere.

## Screenshots (final)
`/tmp/claude-1000/-home-codex-repos-netscript-beta10/cd2ee104-ed45-4ed4-bcca-f960c60a1d84/scratchpad/shots-V2-FINAL/`
— `01/02` desktop (full + viewport) light/dark, `03` mobile full light/dark, `04` mobile drawer
light/dark. Sidebar-signature + rail-collapse stills in `../scratchpad/shots-v6-side/`.
