# Pass V8-fix — Migrations density tighten

Scoped follow-up to the V8 Migrations redesign. The adversarial vision gate scored the redesign
**62/100** — mostly harsh (many of its asks were declined as gold-plating or data-invention), but it
landed **one legitimate density hit**: the hero **version-chain nodes were under-filled** and the
**header stat tiles were plain number boxes**. This pass tightens exactly those, plus the two
"if quick" density wins (slim HEAD marker, compact drift cards, mobile sheet metadata). No route,
logic, data, or copy-meaning changes; no other screen touched. VISUAL + LAYOUT only.

## What changed (the valid density hits only)

### 1. Version-chain nodes (`ns-mignode`) — compacted + earn their height with real metadata
- **Internal padding cut ~35%**: card padding `2.5/3 → 2/2.5` (`--ns-space-*`), inter-row gap
  `space-1-5 → 3px`, node bottom padding `space-3 → space-2`, dot size/offset trimmed.
- **Added an inline mono chip row** carrying real per-migration data already in `s11Rows` (no
  invention): `◫ N objs` (from `tables.length`), `≡ <rows>` (rows-affected), `◷ <duration>`, with the
  applied-at timestamp right-aligned. Pending nodes show `~est.`/`est ~` framings. Chips are tinted
  copper on pending nodes, neutral on applied. The previously-empty right half of each node is now
  filled with data instead of whitespace.
- Kept: the teal spine, applied/pending status glyphs + dots, the selected-row press shadow, the
  dashed-copper pending queue styling.

### 2. Header composite (`ns-mighead`) — denser, each tile gets a supporting micro-viz
- Head padding reduced (`space-4/5 → space-3/4`), lead column narrowed, tile padding trimmed and
  content top-aligned. Big `text-2xl` number shrunk to `text-xl`.
- **Each tile now carries a light micro-viz** (all derived from existing data):
  - **APPLIED** → `N of <total>` + a teal **ratio meter bar** (`applied/total` %).
  - **PENDING** → `N queued` + one **copper pip per pending** migration.
  - **DRIFT** → `N drifted` + an **n-of-8 pip row** (teal = in-sync object, amber = drifted),
    reading straight off the gauge's `syncedN`/`trackedN`.
  - **LAST APPLIED** → title + a **relative-time hint** (`7d ago` / `today`) computed from the
    applied date against the app's own "now" anchor (`2026-07-13 14:02`, the timestamp `runMigrate`
    already stamps), next to the absolute timestamp.
- Kept: the `v3 → v4` version glyphs and the "1 behind" / "up to date" pill.

### 3. Quick wins
- **HEAD/drift divider (`ns-mighead-marker`)** is now a **slim one-line marker** — mono uppercase
  `LIVE DB · HEAD v3` + inline note, on a thin tinted strip with a 2px copper/teal left accent.
  Height dropped **52px → 23px**. No more big dashed ghost box (satisfies doctrine rule 4:
  "no orphaned ghost rows").
- **Drifted-object cards (`ns-driftrow`)** tightened: padding halved, the `has → wants` delta and the
  status note (`type mismatch` / `not created`) now share one compact row (note pulled inline-right)
  instead of an airy 3-line block.
- **Mobile bottom sheet metadata** kept as a **3-across grid (Applied / Duration / Rows)** at 390px
  (previously collapsed to a 1-column stack at ≤560px), padding tightened, so the Summary/DDL
  segmented tabs and the Summary body sit **above the fold** on a standard phone.

## Before / after measurements (desktop 1440, DPR 2)
| Element | Before | After |
|---|---|---|
| Version-chain node — card height | 87px | **81px** |
| Version-chain node — full node (incl. rail) | 99px | **89px** |
| Per-node metadata surfaced | `at · dur` only (2 fields) | **objs + rows + duration + applied-at (4 fields)** |
| HEAD/drift divider height | 52px | **23px** |
| Header composite height | 112px | **104px** |

Note: the desktop node shrank modestly (87→81) because the added chip row offsets part of the padding
cut — but that is the point of the doctrine's "compact nodes" rule: the node now **earns** its height
with real data (4 metadata fields) rather than padding. On mobile the chips wrap, so node height rises
(87→110) but every pixel now carries information; on a scrolling phone that is the correct trade.

## Verification
- **Zero `{{ }}` placeholders**, **zero console errors** (the one 404 is a pre-existing asset miss,
  present in the baseline), **zero horizontal overflow** on all 8 core variants
  (desktop/mobile × light/dark × default/detail-drawer).
- **Data-driven both ways:** applied-and-pending (drift, 2 amber pips, copper queue) AND the in-sync
  applied-only state (`4 of 4`, full teal bar, all 8 teal pips, teal HEAD marker, "chain fully
  applied / no drift") both render cleanly — confirmed by applying the pending migration at runtime.
- **Full 16-route regression clean**: 32 route-visits (16 routes × light + dark) — zero braces, zero
  h-overflow, zero console errors. Shared-CSS edits broke nothing.

## Declined (per brief — gold-plating or would invent data)
- No inline per-row DDL diff expanders in the ledger (dense table + detail drawer already cover it).
- No tabbed docs accordion for the pending "what will change" list.
- No full code-editor chrome (file tabs / line numbers) on the DDL diff — it stays a secondary
  drawer tab (left untouched).
- No author avatars and no pre-flight-step pipeline — there is no such data; inventing it is forbidden.

## Shots (`V8-migrations-shots/`)
`00-BEFORE-*` = pre-fix baseline. Post-fix: `V8-desktop-{light,dark}.png`,
`V8-mobile-{light,dark}.png`, `V8-desktop-light-selected.png`, `V8-desktop-dark-drawer.png`,
`V8-desktop-light-drawer.png` + `-ddl.png`, `V8-desktop-light-drift.png`,
`V8-desktop-light-insync.png`, `V8-mobile-{light,dark}-sheet.png`.

## Files
- `render/prototype.dc.html` — S11 markup (node chip rows, header tile micro-viz, slim marker) +
  `nodeOf`/`s11Head` data model (chip fields, ratio %, pip arrays, relative-time).
- `render/assets/ns-ext.css` — S11 block only (`ns-mignode*`, `ns-mighead*`, `ns-migstat*`,
  `ns-migpip`, `ns-mighead-marker*`, `ns-driftrow*`, `ns-migsheet__stat*`, responsive).
