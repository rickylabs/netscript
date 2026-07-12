# Dashboard Prototype — Pass 1 Decisions

Design-lane record for `screens/01–04` + `screens/proto.css`. Companion to
`CLAUDE-DESIGN-BRIEF.md` and `PROPOSED-COMPONENTS.md` (§ references below point there).

## 1. DDX-0 promote-set verdicts

| Block | Exercised on | Verdict | Amendments |
| --- | --- | --- | --- |
| breadcrumbs | all four screens (SidebarShell `topbarStart`) | validated | None. `Breadcrumb({items})` composes into the topbar slot with no friction. |
| context-rail (`.ns-content-rail`) | all four screens | validated | None to the block itself. It nests cleanly as the *inner* grid of `ns-rail-grid` (02/03/04) — three-zone console layouts fall out of composing the two. |
| plugin-gated-view | 03 (crons group) | validated | Contract as proposed (`__title/__desc/__cmd`, `data-state='not-installed'`). One usage note: the gated view replaces the whole main area (table **and** explorer rail), not a single panel — it needs to be legal as a full-region swap. |
| activity-feed | 02 (span events), 04 (run events) | validated | Added `data-tone='success\|warning\|destructive\|primary'` on `__item` to color the marker; parts are `__item/__marker/__body/__text/__time` with the rail line drawn by `__item::before`. |
| connector | 01 (in-node probe + rail health), 02 (timing rows, service legend), 04 (context key/values) | validated | Broader than proposed: `__probe/__result` double as a generic label/value row pair, so the block serves as the console's key-value list primitive. `data-state='ok\|degraded\|failed'` on `__row` colors `__dot`. Keep the wider reading when syncing back. |
| entity-rail | 02 (trace list), 04 (run list) | validated | Selection is expressed twice by design: `data-state='selected'` (styling contract) **and** `aria-selected` on `role='option'` buttons inside a `role='listbox'` container (semantics). Item parts: `__item/__title/__meta`; `__title` carries an inline status Badge. |
| tree-nav | 03 (contract tree) | validated | Built on native `<details>` per DS law: `__group` = details, summary hosts label + `__count` (or an `available` Badge), `__items` = indented button list, `__item[data-state='selected']`. Gated plugins use `data-state='gated'` on `__group`; their summary click routes to the gated view instead of toggling. |

## 2. Net-new component verdicts + contract deltas

### `ns-waterfall` (§3.1) — works; two deltas

- **Delta 1 — selection out of `data-state`.** §3.1 put `selected` in the same `data-state` enum
  as status. A span can be *selected and failed* at once, so `data-state` now carries **status
  only** (`completed|running|failed|retrying`) and selection is `aria-selected` on
  `role='option'` rows inside a `role='listbox'` container. Selected row = primary-subtle bg +
  2px inset primary edge.
- **Delta 2 — axis parts added.** Proportional axis needed parts §3.1 didn't name:
  `__axis` (label-col + track grid), `__axis-track`, `__tick` (absolutely positioned at
  `left: N%`; last tick anchors `translateX(-100%)`). Label column width is a per-instance
  custom property `--waterfall-label-col` (19rem default).
- Geometry (bar `left/width` percentages, bar/dot `background`) is inline style computed from
  `startOffsetMs/durationMs/totalMs`; the background value is always a token expression, never a
  literal. Duration label flips to the left side of the bar when the bar ends past 80% of the
  track. Depth indentation via `data-depth='0..3'` → padding steps. `running` bars pulse
  (`ns-waterfall-pulse`), disabled under `prefers-reduced-motion`.

### `ns-stackmap` (§3.2) — works; two deltas

- **Delta 1 — `aria-pressed`, not `aria-selected`.** Nodes are standalone toggle buttons, not
  options in a listbox; `aria-selected` is invalid ARIA there. Contract: node =
  `<button aria-pressed>` with `data-state` (status) + `data-kind`
  (`service|worker|database|cache|container`).
- **Delta 2 — edge layer is measured, not declared.** `__edge-layer` is an absolutely
  positioned SVG sized to `__canvas`; paths are computed post-mount from `[data-node-id]`
  bounding rects (horizontal cubic bezier, vertical line for same-column), recomputed on window
  resize, and hidden ≤860px where the canvas stacks to one column. Edges touching the pressed
  node get `data-state='active'` (border-strong → primary stroke).
- Node parts: `__node-title/__node-icon/__node-state/__node-meta` plus one embedded
  `ns-connector` row for the primary probe. `data-kind='database|cache|container'` renders on
  surface bg (infra vs. app distinction).

### `ns-step-timeline` (§3.3) — works; one delta

- **Delta — `data-view='json'` is not a CSS view.** CSS handles `all` (default) and `compact`
  (hides `__body`, tightens rhythm). The JSON toggle renders a `CodeBlock` of the run record via
  the Tabs primitive instead of restyling the list — a stylesheet can't serialize a run. Contract
  should document `data-view` as `all|compact` with JSON as a composition-level swap.
- Parts as proposed: `__step[data-state]` → 15px `__marker` circle (status border/bg; queued
  dashed; running pulses), `__main` > `__title` (+ `__attempts` pill, warning-toned when the step
  is `retrying|failed`), `__meta` (mono duration · offset), `__body` = native `<details>` with
  `▸/▾` summary and `__io` grid of payload/result CodeBlocks.

### `ns-log-stream` (§3.4) — works as proposed

- `__toolbar` (label + Follow `Switch`), `__lines`, `__line` grid
  (`7.5rem 5.5rem 3.5rem minmax(0,1fr)` = ts/resource/severity/msg), `data-severity` on `__line`
  colors `__severity`; `error` lines additionally get a destructive-subtle row background.
  Exercised on 02 as the correlated-logs strip under the waterfall.

### Screen-local glue (in `proto.css`, flagged as such)

- **`ns-tabs__list/__trigger/__content` skin** — the Tabs primitive is headless (emits
  `data-state`/`data-part`, ships no CSS). This segmented-control skin is a sync-back candidate:
  every console surface with Tabs will want it.
- **`ns-page-header--console` variant** — PageHeader's h1 is display-scale (text-4xl); consoles
  need text-2xl + tighter block padding. Proposed as a real PageHeader variant.
- **`ns-envbar`** — topbar environment identity pill (`local · my-app · aspire`,
  `data-part='app'` emphasized, status dot). Small, but it's on every screen; candidate block.
- **`ns-rail-grid` / `--sm`** — left-rail layout object (18rem/15rem + `minmax(0,1fr)` at
  ≥1024px), the mirror of `ns-content-rail`'s right rail. Candidate layout object.
- **`ns-ep-row`** — selectable DataTable row treatment (hover bg, `aria-selected` → inset
  primary edge). If kept, fold into DataTable as an `interactive` row mode rather than a new
  block (respects the data-grid negative verdict — no new table block was needed).

## 3. Composition decisions (one line each)

- Status vocabulary → Badge variants per §3.5: completed→success, running→primary,
  failed→destructive, retrying/degraded→warning, queued→muted; one shared `STATUS_VARIANT` map
  per screen.
- `--ns-accent` aliases `--ns-primary` (both copper-6), so waterfall service hues derive from
  semantic tokens via `color-mix()` (workers = fg/primary 55/45, streams = success/fg 70/30,
  triggers = primary/secondary 55/45); postgres = `--ns-secondary`; `retrying/failed` state
  colors override service color at the JS map level.
- Theme determinism: the first inline script sets `data-theme` from `?theme=` **and** seeds
  `localStorage['ns-theme']` so the ThemeToggle island's mount-time apply agrees with the URL.
- Shell is identical on all four screens: SidebarShell (Console six + four capabilities +
  Plugin Control), Breadcrumb topbarStart, envbar + Search(⌘K) + ThemeToggle topbarEnd,
  version string in the nav footer.
- HTTP method → Badge variant in the catalog: GET→muted, POST→primary, PATCH→warning,
  DELETE→destructive.
- All list selections are native `<button>`s with `listbox/option` roles; the stack map alone
  uses `aria-pressed` toggle semantics.
- DataTable needed no wrapper: rows accept pass-through `role/aria-selected/onClick/onKeyDown`,
  and column templates are the documented `cols` prop shared by header and body rows.
- Explorer forms are typed-rich only where the contract is known (`workers.jobs.enqueue`:
  queue Select, name Input, payload Textarea, dedupe Switch); every other procedure gets a
  generic JSON-body Textarea — mirrors how a generated explorer would degrade.
- Trace/run cross-links (trace ids as `ns-inline-code`, "Open trace"/"Open in Run Inspector"
  ghost buttons) are non-navigating in the prototype; they mark where deep links land.
- Run list filters (status/capability Selects) filter live; Reset clears both; an EmptyState
  covers the zero-match case.
- Job ids render as `job_4183`-style mono ids (never `#4183`) so copy can't collide with the
  no-hex-literal gate.
- Numbers are cross-consistent on purpose: trace `t1`'s 12,412 rows / 72 ms queue wait / 720 ms
  duration / eis-chat retry 2-of-5 reappear in run `job_4183`'s stats, steps, events, and the
  redis degradation shown on the stack map — the screens describe one coherent incident.
