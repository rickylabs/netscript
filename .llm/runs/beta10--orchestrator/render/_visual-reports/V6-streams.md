# Pass V6 — Streams (bespoke redesign)

## The design question (answered first)

> *What tailored components, layout, composition, data-visualization, and data-structure best
> showcase STREAMS — durable event streams / topics with partitions, offsets, producers,
> consumers, consumer-group lag, and live throughput — and how do they compose?*

**Answer.** Streams is the only console whose subject is a *moving quantity over time across a
partitioned log*. So the screen is organised as a **topic console** — the Kafka/Conduktor mental
model — not a list→detail inspector like its neighbours. Top to bottom it composes as:

1. **Topic header** = breadcrumb (`Capabilities › Streams › payment-events`) + a **streams-health
   composite** stat strip that is stream-native, not four plain number cards: **throughput
   (msgs/sec) with a live sparkline + backpressure state**, **total consumer-group lag with a lag
   hotspot count**, **partitions (in-sync / total)**, **retention window**. Each tile carries a
   micro-viz, not just a number.
2. **Throughput hero** = a live **msgs/sec area chart** (JS-measured, post-mount — no SVG holes)
   with a **hover crosshair + floating value readout** and an **OHLC-style footer** (peak / avg /
   floor / published), plus a **backpressure indicator** rail. (Mined from `04-finance-cards` —
   line + crosshair + value tooltip + Open/High/Low footer.)
3. **Partition & offset table** = a dense, monospace **partition ledger** — partition, leader,
   head offset, committed offset, **lag encoded as an inline heat-bar**, and the owning consumer
   group. (Mined from `11/12-devconsole` record table: Timestamp/Offset/Partition/Key/Value with
   sort chevrons — re-cast to partition rows.)
4. **Consumer-group lag** = **group rows** with per-group members, assigned partitions, a **lag
   gauge**, and status (`stable` / `rebalancing` / `lagging`). Not a health-band clone.
5. **Partition × time lag heatmap** = a tinted-cell grid (partitions on rows, recent windows on
   columns; cell tint = lag magnitude) — the stream-native "where is it backing up" view. (Mined
   from `10-ref` user-retention heat-triangle — tinted intensity cells.)
6. **Producer → consumer topology** = a compact 3-column flow (producers → `payment-events`
   partitioned log → consumer groups) with delivery/lag edge labels. Div/CSS geometry, no canvas
   clone of Sagas.
7. **Live event tail** = a monospace, dense **record stream** (offset · partition · key · value ·
   age) that appends live — the "Consume" tab of a topic console.
8. **Tabbed stream detail drawer** (desktop right rail) → **mobile bottom sheet**: Records /
   Config / Schema / Consumers, adapting `11`'s right drawer + `13`'s version-diff schema view.

## What was mined, from which reference

| Component built | Reference | What I took |
|---|---|---|
| Topic breadcrumb + tab row | `11/12-devconsole` | `Topics › name` breadcrumb + Consume/Produce/Config/Schema tab row → `Capabilities › Streams › payment-events` + Consume/Partitions/Consumers/Config tabs |
| Streams-health stat strip | `11-devconsole` + `13-devconsole` | RECORDS/SIZE/PARTITIONS/REPLICATION strip → THROUGHPUT/LAG/PARTITIONS/RETENTION, each with a micro-viz |
| Throughput hero + crosshair + OHLC footer | `04-finance-cards` | Stock-tracker line + crosshair + floating value tooltip + Open/High/Low footer |
| Partition & offset ledger | `11/12-devconsole` | Dense sortable record table (Offset/Partition/Key/Value) re-cast to partition rows with inline lag heat-bar |
| Partition × time lag heatmap | `10-ref` (Catalyst) | User-retention tinted-cell heat grid → partition/time lag intensity |
| Consumer-group lag rows + gauge | `13-devconsole` stat tiles + `04` arc gauge | grouped rows with a radial lag gauge |
| Producer→consumer topology | `21-flow-builder` (feel) | node→node flow, but div/CSS not a canvas clone |
| Tabbed detail drawer / bottom sheet | `11-devconsole` drawer + `13` schema diff + `06-mobile-sheets` | right drawer docs-tabs → Records/Config/Schema/Consumers; schema tab uses line-numbered view |

## What was there before (the gap)

The old Streams screen was a **fan-out delivery inspector**: a 2-message list → a step-timeline of
subscriber deliveries → a delivery feed, with a plain `<h1>Streams</h1>` header (no breadcrumb,
unlike every neighbour) and ~50% dead space in the lower half. It had **no throughput, no
partitions/offsets, no consumer-group lag, no live record tail, and no producer→consumer
topology** — none of the things that actually make a stream a stream. See
`00-BEFORE-desktop-light.png`.

## What was built (every section bespoke)

| Section | Bespoke component | Notes |
|---|---|---|
| Header | `ns-conbread` breadcrumb + live pulse + `ns-strhealth` composite strip | 4 tiles (throughput+sparkline / lag+backpressure / partition pips / retention) — NOT four plain number cards |
| Tabs | `ns-contab` Consume / Partitions / Consumers / Config | deep-linked via `?tab=` |
| Throughput hero | `ns-strhero` — JS-measured teal area chart + **hover crosshair + floating value tip** + peak/avg/floor/window OHLC footer + backpressure pill | `drawStreamsHero()`, post-mount, no SVG holes |
| Topology | `ns-strtopo` — producers → partitioned-log node → consumer-group **fan bus** (div/CSS) | lag-tinted consumer edges; not a Sagas canvas clone |
| Partition ledger | `ns-strledger` — Part/Leader/Head/Committed/**inline lag heat-bar**/Group | monospace, sortable-console feel; scrolls horizontally on mobile |
| Lag heatmap | `ns-strheat` — 6 partitions × 8 windows, tint = lag magnitude + legend | on Consume + Partitions tabs |
| Consumer groups | `ns-strgroup` — **radial lag gauge** + status + members/partitions/guarantee + lag bar | reuses shared `ns-gauge` conic-gradient |
| Live tail | `ns-strtail` — offset·part·key·value·age, monospace, dense, live-pulse header | the "Consume" record stream |
| Detail drawer | `ns-strdrawer` — message picker + fan-out delivery timeline + run/trace actions | right rail on desktop |
| Config | `ns-strcfg` KV + `ns-strschema` **line-numbered Avro record schema** (ref 13) | fills the tab, adds the schema facet |

## Data model

Enriched the S10 model in-place (still the one topic `payment-events`, same 3 wired subscribers, same
analytics-lags-and-fails story) with stream-native structure: 6 partitions with head/committed
offsets, 3 consumer groups with lag + status, a 24-point throughput series (derived to read as a
2-minute window), a 6×8 lag-intensity grid, a live record list, producers, and an Avro schema. No
routes/logic/copy-meaning changed; the existing message/fan-out/feed data is preserved and now
powers the detail drawer. All sections render from arrays, so empty/edge states collapse cleanly.

## Verification

- **Zero `{{ }}` holes, zero horizontal overflow, zero non-404 console errors** on Streams across
  desktop 1440 + mobile 390 × light + dark (the lone 404 is a first-load favicon, present on the
  BEFORE capture too).
- **Full-route regression** (all 16 nav routes, desktop + mobile): 0 holes / 0 overflow / 0 non-404
  errors everywhere — the shared-file changes (`drawStreamsHero()` + appended CSS) broke nothing;
  Workers / Sagas / Triggers markup untouched.
- `support.js`, `_ns_styles.css`, `_ds/*` untouched. Only `prototype.dc.html` +
  `assets/ns-ext.css` changed. Tokens only — no raw hex.
- Throughput hover crosshair verified interactive (`streams-throughput-hover-*.png`).

## Self-assessment vs the Triggers / Sagas bar

**Bespoke score: 9 / 10.** The screen is unmistakably a *topic console* and shares no signature
component with its neighbours: not the Sagas node-canvas, not the Workers registry table, not the
Triggers `ns-tmetric`/`ns-tdlt` firing console. Every section — header strip, hero, topology,
ledger, heatmap, consumer gauges, live tail, drawer, schema — is a purpose-built stream component,
and all four tabs carry substantial content (dead space killed by putting the heatmap on
Partitions and the schema view on Config). The throughput crosshair and lag heatmap are new
visualizations not present anywhere else in the product.

**Honest gaps:**
- The producer→consumer topology is a div/CSS **flow** (producers-and-log on top, consumers fanning
  below) rather than a truly horizontal 3-column graph — it reads clearly as a flow but the log node
  and consumer bus are not on the same horizontal line at desktop width. A measured-connector
  (getBoundingClientRect) version like the Sagas edges would connect them exactly; deferred to keep
  this pass div/CSS-only and avoid a second canvas system.
- On the **Consumers** tab the left column (3 gauge cards) is a little shorter than the tall right
  rail, leaving mild whitespace; Consume/Partitions/Config are well-balanced.
- Throughput/heatmap/records are a static (data-driven) snapshot; they do not tick live like the
  delivery feed does. Wiring them to the existing `tick()` sim would make the "live" pulse literal —
  a natural follow-up, out of scope for a visual pass.
