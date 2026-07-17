# Pass V5 — Triggers (S9) bespoke redesign

## The design question — answered first

**"What tailored components, layout, composition, data-visualization, and data-structure best
showcase TRIGGERS — event→action activation rules (schedules/cron, webhooks, event patterns,
manual) that fire workers/sagas?"**

A trigger is fundamentally a **rule**: *when* an event source fires, *do* an action. So the screen
is composed as a **rules-and-firings console**, organised top-to-bottom by the three questions an
operator actually asks:

1. **How is the fleet classified & how healthy is each activation mechanism?** →
   a bespoke **tinted category band** (schedule / webhook / event / manual) — each a composite
   health card with an armed/total count, an aggregate firing sparkbar, and an armed/silenced state
   pill. This is the header treatment, *not* four plain number cards. It also acts as a live filter.
2. **What does this rule actually do?** → a **rule builder** (`WHEN <event> → DO <action>`) rendered
   as a left-to-right typed flow strip with a condition chip on the connector and an **action-type
   palette** below. Selecting any trigger repopulates the builder.
3. **When does it fire next, and did the last firing succeed?** → a **schedule day-strip** with
   next-fire countdowns (only time-driven triggers have a next fire), and a **dense sortable
   firing-history table** (trigger · type · last fired · next fire · outcome · latency · 24h spark),
   each row opening a **detail drawer → mobile bottom sheet** with Action-chain / Payload / Schedule
   tabs.

Data structure: one **category taxonomy** (`schedule`=cron/schedule/polling, `webhook`,
`event`=file/kv/composite, `manual`) drives the tint, the WHEN node, the table classification, and
the filter — so the whole screen is coherent from a single model. Everything is derived from the
existing 8-trigger fleet; empty/idle rows (`manual.reindex`, 0 fires) render cleanly.

Deliberately **different from its neighbours**: Sagas is a vertical node-**canvas** with
forward/compensation lanes + a gauge; Workers is a runtime-mix **registry table** + poolmeter +
drift. Triggers is a **horizontal rule-sentence builder + category-health band + schedule
day-strip** — no shared body composition, only the shared console chrome (breadcrumb / stat strip /
sortable table shell / detail sheet) for family consistency.

## What I mined, and from which reference

| Reference | Pattern taken | Where it landed |
|---|---|---|
| **21-flow-builder** | node-graph (Start → branch nodes with branch labels) + right properties panel + bottom **component palette** (Text/Image/Gallery/Button tiles) | The **rule builder**: WHEN node → dashed connector with an `if <condition>` chip → DO node, plus the **action-type palette** (publishSaga / enqueueJob / executeTask / executeBatch) with the wired action highlighted. Rebuilt **horizontal** (rule sentence) instead of Sagas' vertical branching, so the geometry reads different. |
| **19-pm-dashboard** | schedule **day-strip** (Mo15 Tu16 We17… active day tinted) + timed event cards with a colored left-accent bar + status pills; the inline greeting stat pill | The **schedule strip**: next-7-day strip with discrete cron/schedule pips + a distinct continuous **poll band** per day (dotted teal), today tinted copper; and **next-fire countdown cards** with a left-accent bar (copper when imminent). Outcome **status pills** in the table. |
| **11-devconsole-a** | dense sortable data table (sortable header arrows, mono) + right **detail DRAWER** ("Add JS filter" header + × + typed body + tabbed docs sub-panel Basics/Parameters/Functions/Examples) | The **firing-history table** (sortable headers, mono cells, 24h sparkline column) and the **per-trigger detail drawer** with inner tabs **Action chain / Payload / Schedule** (→ mobile bottom sheet). |
| **13-devconsole-c** | breadcrumb (`Schema Registry > name`) + 4-tile stat strip (CURRENT VERSION / TOTAL VERSIONS / FORMAT / COMPATIBILITY) | Console **breadcrumb** (`Capabilities › Triggers`) + the **stat strip** (triggers / armed / silenced / fires·24h / DLQ depth). |

## Bespoke components built (per section)

- **`ns-tcat` category band** — 4 tinted composite cards (schedule=copper, webhook=teal,
  event=amber, manual=muted); each carries a glyph tile, count, blurb, a 12-bucket aggregate firing
  **sparkbar** (pure CSS `height:%`), and a foot row with an armed/silenced state pill + 24h fires.
  Click = filter the table + set category focus. (Replaces the old airy bullet event feed as the
  hero-adjacent classifier.)
- **`ns-tbuild` rule builder** — `WHEN` node (tinted by category, source line, category tag) →
  `ns-tbuild__wire` dashed connector carrying an `if <condition>` chip and a ▶ arrow → `DO` node
  (tinted by action tone, target label, "open target →"). Below: `ns-tbuild__palette` action-type
  tiles with the wired action highlighted. Fully responsive — flow rotates to vertical < 720px.
- **`ns-tdaystrip` schedule strip** — 7 day tiles, discrete fire pips (02:00 copper / 07:00 muted) +
  a continuous **poll band** for interval triggers; today tinted. `ns-tnext` countdown cards
  (soonest-first, imminent = copper accent). Section hidden cleanly when no scheduled trigger armed.
- **`ns-thist` firing-history table** — reuses `ns-contable` shell; adds sortable headers
  (name/type/last/next/outcome/latency, JS sort with asc/desc arrow), `ns-tcatbadge` type badges,
  `ns-trend` 24h sparklines (reuses the existing post-mount painter), an outcome status pill, a
  latency mono cell, and an inline arm/disable switch. Disabled rows strike-through + dim. A
  category filter pill in the toolbar clears the focus.
- **`ns-tdrawer` detail sheet (`sheet:'s9'`)** — reuses the shared `ns-sheet-dialog` (right drawer
  desktop → bottom sheet mobile). Category badge + outcome pill + a `when → do` rule summary +
  KV facts (source/condition/last/next/fires/correlation) + **inner tabs** Action chain / Payload /
  Schedule + Open-firing-run / Silence-trigger actions.
- **`ns-tdlq` dead-letter mini-meter** + **`ns-tingress` webhook test** — the secondary strip; DLQ
  depths as tiny fill meters (redis warning-toned), ingress verb+path chip over the payload editor.
- **Stat strip** — reuses `ns-statstrip` for family consistency (same as Workers), sitting *under*
  the bespoke category band which is the true header treatment.

## Identity & constraints

- NS One only: `--ns-*` tokens, `ns-*` classes, no raw hex. New category tints are `color-mix` over
  `--ns-primary` (copper) / `--ns-success` (teal) / `--ns-warning` (amber) / `--ns-muted-fg`, driven
  by a `[data-cat]` variable block — theme-blind, works in light + dark.
- No SVG `{{ }}` holes. All geometry is div/CSS (`height:%` sparkbars, `width:%` meters,
  `repeating-linear-gradient` connectors/poll bands). The 24h sparklines reuse the existing
  post-mount `.ns-trend[data-series]` painter (empty SVG in markup, painted in JS).
- Routes / logic / data / copy-meaning unchanged. The toggle confirm-dialogs, nav targets, webhook
  test, and correlation links all preserved. New CSS appended to `render/assets/ns-ext.css` only.

## Verification

- **Base variants** (desktop 1440 @2x, mobile 390 @2x, light + dark): 0 `{{ }}` holes, 0 console
  errors (one benign favicon 404), 0 horizontal overflow — all four.
- **Interaction states** captured & clean: firing-row → detail drawer (desktop right), category
  filter (Event → table + pill), latency sort, mobile bottom sheet, mobile schedule-tab sheet.
- **Full-route regression** (all 16 nav routes at 1440): **0 console errors, 0 holes, 0 overflow**;
  Workers + Sagas re-shot and unchanged. Shared-file edits broke nothing.

## Shots
`render/_visual-reports/V5-triggers-shots/`
`00-BEFORE-triggers-*` (4) · `triggers-{desktop,mobile}-{light,dark}` (4) ·
`triggers-desktop-light-drawer` · `triggers-desktop-dark-catfilter` ·
`triggers-desktop-light-sorted` · `triggers-mobile-light-sheet` · `triggers-mobile-dark-sheet-sched`.

## Honest gaps

- The stat strip uses the shared plain `ns-statstrip` (like Workers) rather than a fully bespoke
  treatment — intentional for family consistency, since the category band is the bespoke header, but
  a stricter reading of "every section bespoke" could tint those tiles per meaning.
- Category filter and the builder's selected-trigger are independent axes; filtering to a category
  does not auto-switch the builder to a member of that category (selection persists). Deliberate, but
  a first-time viewer might expect them coupled.
- The schedule day-strip repeats the same daily fires across all 7 days (correct for daily crons)
  and does not yet render weekly/monthly-only cadences differently beyond the poll band.
