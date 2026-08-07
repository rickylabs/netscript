# Pass V8 — Migrations (S11) visual redesign

## The design question (answered first)
*"What tailored components, layout, and visualization best showcase MIGRATIONS — an ordered
chain of DB schema migrations (applied → pending), each with version / timestamp / duration /
status / DDL, plus schema DRIFT (live DB vs what the chain expects) — and how do they compose?"*

**Answer:** A **migration version-chain timeline** is the signature. A vertical spine renders the
applied history as completed teal nodes (v1→v2→v3, each a timed-event card: version glyph + name +
timestamp + duration + status), then a **"LIVE DB · HEAD" drift marker** (a ringed diamond on the
spine marking where the live DB actually sits), then a **QUEUED** section of dashed copper pending
nodes below. Composed around it: a **drift arc gauge** (teal↔amber half-ring, "N drifted / M in
sync") with drifted-object delta rows; a tailored **header composite** (schema HEAD `v3 → v4` +
1-behind pill + a 4-tile stat strip, not four plain number cards); a dense **ledger table**
(version / name / applied-at / duration / rows / status) whose rows open a **detail drawer**
(right on desktop, bottom sheet on mobile) with a Summary tab and the **DDL diff as a secondary
tab** — the diff is deliberately demoted, per brief. A **pending-apply card** carries the
"what will change" preview + `netscript db migrate` CLI. The screen reads as a migration control
plane at a glance: applied history → where the DB is → what's queued → the drift it causes.

## What was mined, from which reference
- **19-pm-dashboard** — the schedule day-strip + timed-event cards (colored left rail + glyph +
  title + time range + status pill) → became the **migration timeline nodes**: each migration is a
  card hung on a rail with a status dot, version glyph, timestamp + duration, and a status badge.
- **11-devconsole-a** — breadcrumb + compact stat strip (RECORDS/SIZE/PARTITIONS) + dense sortable
  table + **right detail drawer with its own docs tabs** → the **header stat strip**, the
  **migration ledger**, and the **detail drawer** (Summary / DDL-diff tabs) that becomes a mobile
  bottom sheet via the shared `ns-sheet-dialog`.
- **13-devconsole-c** — CURRENT VERSION / TOTAL VERSIONS / FORMAT / COMPATIBILITY label-over-value
  tiles + version dropdowns + line-numbered red/green schema diff → the **header composite tiles**
  and the **DDL-diff secondary tab** (line-op diff, NOT the centerpiece — Config Resolution already
  owns the diff-as-hero pattern).
- **04-finance-cards** — the Spending Summary **arc gauge** (180° half-ring, segmented fill, big
  centered value, legend row below) → the **drift arc gauge**: teal synced portion + amber drifted
  slice, "N drifted · M of T objects in sync", with drifted-object rows beneath.

## Bespoke components built (per section)
| Section | Component | Reference DNA |
|---|---|---|
| Header | `ns-mighead` composite: HEAD `v3→v4` version glyphs + 1-behind pill + 4-tile stat strip (applied/pending/drift/last-applied) | 13 stat strip + version chain |
| Signature | `ns-migchain` **version-chain timeline**: applied spine → `ns-mighead-marker` (live-DB ringed-diamond HEAD/drift divider) → `ns-migchain__queue` pending nodes | 19 timed-event cards on a rail |
| Timeline node | `ns-mignode`: rail + status dot (filled teal / hollow copper) + card (version glyph, title, name, timestamp·duration, status badge), selectable | 19 event card |
| Drift | `ns-migdrift` + `ns-arcgauge` (pure-CSS conic half-ring, teal↔amber) + `ns-driftrow` (kind tag + obj + strike-through has→wants delta + note) | 04 arc gauge |
| Ledger | `ns-migledger` dense table (ver / migration / applied-at / duration / rows / status), row-select → drawer | 11 dense table |
| Pending | `ns-migapply` action card: "what will change" +/~ preview + CLI + apply/details | 06 action sheet feel |
| Detail | `ns-migdetail` rail (desktop) + `sheetIsS11` drawer/bottom-sheet with Summary / DDL-diff segmented tabs | 11 drawer + 13 diff |

## Data-driven states verified (all clean: 0 holes / 0 console errors / 0 h-overflow)
- **pending + drift** (default): copper queue node, amber gauge (2 drifted / 6-of-8), drift rows,
  apply card, "1 behind".
- **in-sync** (after Run migrate): all-teal spine, teal HEAD marker "matches the chain", full-teal
  gauge "in sync · 8 of 8", "✓ chain fully applied — nothing queued", apply card + drift rows gone,
  header shows HEAD `v4` / "up to date" / pending 0.
- Both light + dark; desktop 1440 + mobile 390. Dark-mode version-glyph contrast fixed (copper/teal
  glyphs get lightened fg + stronger border under `[data-theme='dark']`).

## Interaction states captured
`V8-desktop-light-selected` (timeline node selected), `V8-desktop-light-drawer` (detail drawer,
Summary), `V8-desktop-light-drawer-ddl` (DDL-diff tab), `V8-mobile-light-sheet` (mobile bottom
sheet), `V8-desktop-light-insync` (in-sync data state).

## Distinct from siblings
- NOT the Config Resolution **precedence-waterfall** (that's a numbered-ordinal collapsing spine
  with wins/shadowed pills); this is a chronological version chain with a live-DB HEAD marker.
- NOT the capability-console **table + node-canvas**; the ledger is a supporting element, the hero
  is the timeline.
- The diff is a **secondary drawer tab**, never the centerpiece (brief's cardinal constraint).

## Honest gaps / follow-ups
- Timeline nodes are chronological but not horizontally branched (no parallel-branch migrations —
  the domain data is linear, so a single spine is correct; a fork visualization would be
  speculative).
- The arc gauge's drifted-object count (`trackedObjs = 8`) is a reasonable derived constant, not a
  live schema-object census; if real object counts land in the data model, wire the denominator to
  it.
- Rows-affected for the pending migration is an estimate (`~est. 12.4k`) — clearly labelled as an
  estimate; a real dry-run count would replace it.
- No sort affordance is wired on the ledger headers yet (visual hint only); selection + drawer is
  the primary interaction this pass.

## Scope integrity
Routes / logic / data-flow / copy meaning unchanged. Enrichment (version, duration, rows, DDL,
drift objects) is visual metadata implied by the domain; existing names / timestamps / statuses /
the `runMigrate` confirm flow and CLI are untouched. All CSS appended to `render/assets/ns-ext.css`
(loads last). No edits to `support.js`, `_ns_styles.css`, `_ds/*`, or other screens' markup.
