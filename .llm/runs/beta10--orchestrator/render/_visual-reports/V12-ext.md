# Pass V12 — Extensions (contribution-manifest console)

## Design-question answer (first)

> *What tailored components, layout, and visualization best showcase EXTENSIONS — the installed
> add-ons that extend the app/runtime, each with what it CONTRIBUTES (the surfaces/capabilities it
> adds), a version + source, an enabled/disabled status, and config — and how do they compose?*

**Answer: a contribution manifest, not an app-store grid.** An extension here is a *provider* — a
plugin that mounts contributions into named host **surfaces** (UI panels/routes, ⌘K commands, AI
tools). The operator's job is *see who is installed → understand WHAT each one adds and WHERE it
plugs in → judge trust + version/contract compat → drill into one extension's full manifest →
enable/disable it.* So the screen is a **provider roster + contribution manifest**, and the
screen-owning idiom is the **contribution surface**: every extension carries a per-row
**contribution bar** (a stacked mini-bar whose segments are colored by surface kind — copper=panel,
teal=command, amber=tool) plus surface **pips** ("+2 panels · +2 cmds"), and selecting one opens a
**manifest** that groups its contributions by surface, shows a **"plugs into"** mount map, and gates
enable/disable. Three composable views share one header: **Providers** (roster + manifest),
**Surfaces** (the cross-cut — three tinted lanes listing every contribution mounted into
Panels/Commands/AI-tools with provenance), and **Available** (install/quarantine with a
**contract-compatibility meter**).

The idiom nothing else in the app uses: **surface-typed contribution shape** (copper/teal/amber
segments) + a **surface-grouped manifest** + a **"plugs into" mount map** + a **built-for-vs-host
contract meter**. That makes Extensions visually **distinct** from every finished screen — not the
console monitoring gauges, not the Config precedence waterfall, not the Migrations version arc, not
the DLQ error-signature clusters, not the Catalog registry rail, not the Auth TTL/identity roster.

## What I mined, from which reference

| Reference | What I took | How it's adapted here |
|---|---|---|
| **21-flow-builder** (outamate node-graph + **component palette** Text/Image/Gallery/Button) | The idea that nodes CONTRIBUTE into a canvas, plus the tinted **category-tile palette** and the right **properties panel** | The palette became the **surface-kind colour system** (copper/teal/amber per contribution kind) and the **Surfaces lanes**; the right properties panel became the **manifest detail pane**. The "what does this node add" framing is the whole screen's spine. |
| **11-devconsole-a** (Kafka console: stat strip → dense list → right detail DRAWER) | The **stat strip → roster → right-side detail drawer** composition + the filter toolbar | Two-pane **roster + manifest** on desktop; the drawer → shared **bottom sheet** on mobile; the toolbar became the **surface-kind filter chips** (`ns-extbar`). |
| **19-pm-dashboard** (Mondays) | The rounded **stat-pill strip**, **status pills** (In Progress/Pending/Completed), grouped table cards | The pill-strip idea became the **header composite**; status → enabled/disabled **status dots**; the grouped-table rhythm became the **contribution groups** inside the manifest. |
| **07-chat-signin** (card composition) | Clean card head (glyph + title + meta) + a footer action row — **but rejected the raw green/blue buttons** | Provider rows + available cards use a glyph + name + meta head and a gated CTA in **NS copper/teal/amber**, never generic SaaS green/blue (per hard rule). |
| **03-analytics-cards** (wildcard — channel bar + ratio meters) | Segmented **channel bar** + **ratio meters** | Header **surface-distribution channel bar** (click-to-filter) + **enabled-coverage ratio meter**, replacing plain number cards. |
| **04-finance-cards** (wildcard — elapsed/segmented meter w/ marker) | Segmented meter with a value marker | The Available **contract-compatibility meter**: built-for fill (teal if ==host, amber if behind) + a **host "now" marker** at the right edge. |

## Component prescription (built)

| # | Component | Element in reference | Adaptation |
|---|---|---|---|
| 1 | `ns-exthead` header composite | 19 stat-strip + 03 channel/meters | glyph+count hero + surface channel bar + enabled ratio meter + tier chips + **compat alert** — no plain number cards |
| 2 | `ns-extchan` surface channel bar | 03 segmented channel bar | panels/commands/tools segments (copper/teal/amber), width ∝ count, **click-to-filter** the roster |
| 3 | `ns-extratio` enabled meter | 03 ratio meter | enabled-coverage fill; turns copper when any disabled, with a live count foot |
| 4 | `ns-extcompat` compat alert | 11 "Connected" env pill (inverted → warning) | quarantine/held summary + host-contract chip |
| 5 | `ns-extbar` surface filter chips | 11 search + filters | all / Panels / Commands / AI-tools chips (tinted-active), provider count |
| 6 | `ns-extprov` provider row | 21 node "what it adds" + 07 card head | glyph (tier) + name + version + status dot + **contribution bar** + surface **pips** + source; left status rail; the roster unit |
| 7 | `ns-extprov__contribbar` contribution bar | 21 palette-tinted segments | the **signature** per-row viz: stacked segments colored by surface kind, width ∝ count |
| 8 | `ns-extmanifest` manifest pane | 21 properties panel / 11 drawer | identity head + KV (source/version/tier/contract/contributes) + **contribution groups** + **plugs-into** + gated toggle; sticky desktop → bottom sheet mobile |
| 9 | `ns-extgroup` contribution group | 19 grouped table + 21 palette | contributions grouped by surface kind, tinted header + per-item mount target + perm |
| 10 | `ns-extmounts` "plugs into" map | 21 canvas mount points | tinted chips (capabilities/* · data/* · ⌘K palette · AI runtime) — the mount surfaces this ext touches |
| 11 | `ns-extlane` surface lane | 21 palette columns / 11 lanes | Surfaces view: 3 tinted lanes (Panels/Commands/AI-tools) each listing every contribution + provenance chip + perm |
| 12 | `ns-extmount-card` mount card | 11 dense list row | per-contribution card inside a lane: icon + title + **provider chip (tier)** + mount + perm |
| 13 | `ns-extcompatbar` contract meter | 04 elapsed/marker meter | built-for fill (teal ok / amber behind) + host "now" marker; the version-drift story |
| 14 | `sheetIsS16` bottom sheet | 11 drawer → 06 mobile sheet | reuses shared `#ns-sheet-dialog`: full manifest (identity + KV + groups + plugs-into + toggle) on mobile |

## Layout & composition

Desktop 1440: `header (title + lede + Providers/Surfaces/Available segmented)` → **`ns-exthead`**
composite (count hero + surface channel bar + enabled meter + tier chips + compat alert). Then per
view: **Providers** = `ns-extbar` filter chips → **`ns-extgrid`** two-pane (roster of `ns-extprov`
rows + sticky `ns-extmanifest`); **Surfaces** = **`ns-extlanes`** three tinted lanes; **Available** =
**`ns-extavail`** cards with the contract meter.

Responsive: ≤1180 the header composite goes 2-col; ≤1023 the grid collapses to the roster only and
the manifest hides — tapping a provider opens the shared **bottom sheet** (`sheetIsS16`) with the
full manifest; ≤720 the header stacks single-column, lanes/available go single-column, rows reflow.
No horizontal body scroll at any width.

## Distinctness from finished screens

- **Not a monitoring console** (Workers/Sagas/Triggers/Streams): no runtime gauges or status stream.
- **Not** the Config waterfall, Migrations version arc, DLQ clusters, Catalog rail, or Auth
  TTL/identity roster. The idioms unique to Extensions — a **surface-typed contribution bar**, a
  **surface-grouped manifest**, a **"plugs into" mount map**, and a **built-for-vs-host contract
  meter** — appear on no other screen.
- Header micro-viz (surface channel bar + enabled ratio meter + tier chips + compat alert) replaces
  the old airy 3-column KV grid; per density doctrine, zero plain number-card rows and no dead region.

## Density notes (per ROLLOUT-DOCTRINE density defaults)

- **No plain number-card stat row** — the header is a composite (count hero + click-to-filter channel
  bar + ratio meter + tier chips + compat alert).
- **Compact rows** — each `ns-extprov` earns its height with glyph + name + version + status +
  contribution bar + pips + source (no padded 3-line card).
- **Dense manifest** — alternating-tint KV, tinted contribution groups with per-item mount+perm, and
  a compact mount-chip map, not an airy scroll.
- **No ghost rows** — the old huge empty region below the 6 cards is gone; the two-pane grid + lanes
  fill the viewport. Disabled providers dim + carry a gray rail, not an empty gap.

## Data model (visual metadata only — no route/logic/copy-meaning change)

The original `extPanels` / `extActions` arrays (ids, mounts, slots, tiers, perms, toggle flows, CLIs,
copy) are **preserved verbatim**. Derived on top: `extContribs` tags every panel/action with a
surface **kind** (panel/command/tool); `extProviders` **groups contributions by plugin** (the
extension) and derives the contribution bar (`extWCls` width buckets), pips, byKind counts, and an
enabled flag (a provider is disabled only when all its panels are disabled — driven by the existing
`extDisabled` map). `EXTMETA` adds illustrative **version + source** per plugin (consistent with
first-party tier); `buildManifest` assembles the KV, surface-grouped contribution list, and the
"plugs into" mount set. `extHead` derives the header aggregates; `extSurfChips` the roster filter;
`extLanes` the Surfaces cross-cut; `extAvailable` enriches the two available entries with a
contract-compat fraction + adds-pips (copy/CLIs untouched). New state: `extSel` (selected provider),
`extSurf` (surface-kind roster filter). The segmented tabs reuse the existing `extTab` query param
(Providers=panels / Surfaces=actions / Available=available), so routing + deep-links are unchanged.
`sheetIsS16` reuses the shared `#ns-sheet-dialog` (right drawer desktop / bottom sheet mobile via
`matchMedia(900px)`). Enable/disable + install/quarantine reuse the shared `askConfirm` →
`#ns-confirm-dialog` flow with the correct `netscript plugin …` CLIs. Geometry uses shared
`--w0..--w20` width-bucket classes (`--wpct`/`--wnum`) — **no SVG `{{ }}` holes**.

## Verification

0 `{{ }}` holes / 0 real console errors (only the benign favicon/resource 404) / 0 horizontal
overflow across: **Providers** (desktop 1440 light+dark, mobile 390 light), **Surfaces** (desktop
light+dark, mobile), **Available** (desktop light+dark, mobile), plus interaction states — provider
**selected** (triggers manifest: 2 panels + 2 commands grouped, plugs-into capabilities/* · data/* ·
⌘K), **surface-kind filter** (Commands chip → roster narrows to triggers, teal-active, count
updates), tool-only provider (runtime-config manifest), the **disable confirm** (light+dark, correct
`sagas.console = enabled → disabled` + `netscript plugin disable sagas`), the resulting **disabled
state** (row dims + gray rail, header meter → "5 enabled · 1 disabled", manifest → Enable, toast),
and the **mobile bottom sheet** (light+dark). **Full 16-route regression clean** in **both themes**
(every nav item: 0 holes / 0 overflow / 0 errors — no other screen changed). Edits limited to the
S16 Extensions markup, the S16 derivation/bindings, the `sheetIsS16` sheet body + `sheetTitle`/sheet
wiring, and appended `render/assets/ns-ext.css` — no edits to `support.js`, `proto.css`, `_ds/*`, or
any other screen's markup.

## Self-assessment

- **Bespoke:** 9/10 — the contribution-manifest idiom (surface-typed contribution bar +
  surface-grouped manifest + plugs-into mount map + built-for-vs-host contract meter + tinted
  Surfaces lanes) is unlike any finished screen. Only the confirm dialog + bottom-sheet chrome reuse
  the shared kit (intentionally, for consistency).
- **Density:** 8.5/10 — composite header micro-viz, compact multi-metadata rows, dense grouped
  manifest, tinted lanes, click-to-filter; the old dead region is gone. The single small soft spot is
  the transient filtered state where the roster narrows to one provider (left column shorter than the
  tall manifest) — acceptable for a filter view; the default "all" state fills both columns.

## Honest gaps / declined

- **Version + source** (`v2.4.0`, `netscript`) are illustrative visual metadata consistent with each
  plugin's first-party tier — not read from a real registry (static prototype). The **contract "v2 ·
  compatible"** line and the Available built-for-v1/v2 values likewise dramatize the quarantine story
  the original copy already told.
- The extension **detail route** `/extensions/:extensionId` still exists and is wired via the
  original per-panel `open`; the manifest's primary drill is the in-page pane / bottom sheet
  (`extSel`). The panel `nav('/extensions/…')` deep-link is preserved but not the primary affordance.
- Provider "**config**" is represented by the manifest KV + slots/perm metadata and the enable/disable
  toggle — there is no free-form config editor (the prototype exposes none; inventing one would exceed
  "visual metadata only").
- In the **filtered** Providers view, if the currently-selected provider is filtered out the manifest
  falls back to the first visible provider — correct, but means the manifest can change when you
  toggle a filter chip. Intentional (keeps the pane populated), noted for transparency.
