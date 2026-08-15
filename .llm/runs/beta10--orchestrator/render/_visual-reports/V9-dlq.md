# Pass V9 — Dead-Letter Queues (S12) — operational triage console

## The design question (answered first)

> *"What tailored components, layout, and visualization best showcase DEAD-LETTER
> QUEUES — failed messages parked across queues (redis/postgres/memory), each with a
> payload, an error/failure reason, a retry history, and a source (which
> trigger/worker/saga produced it), needing operational TRIAGE — and how do they
> compose?"*

**Answer:** an **operational triage console** whose signature is **clustering failures by
error signature** rather than showing a flat list. The screen composes, top-to-bottom:

1. **Triage strip** — a composite metric header (total parked with a *by-queue split
   micro-bar* that sums to the total; distinct-signature count as a click-to-clear
   button; oldest-parked age; retry-exhausted count as filled/empty pips; a 2h
   dead-arrival red sparkbar). No plain number cards — every tile carries a glyph +
   value + a supporting micro-viz + a contextual sub-label.
2. **Error-signature clusters** (the hero / signature) — failed messages grouped by
   signature (`E_CONN sink unreachable ×3`, `E_TIMEOUT handler timeout ×2`, …). Each
   cluster row shows a severity glyph, the signature + human message, an ×count, the
   affected-source chips, an 8-window sparkbar of *when* they died, the age range, and a
   per-cluster **Retry all / Purge** affordance. Clicking a cluster filters the table.
3. **Failed-message triage table** — dense grid: select, mono message id, source
   (trigger/worker/saga) with a kind glyph, signature badge, **retry pips + n/max**, age,
   inline **Inspect →**. A sticky **bulk-action bar** (count + CLI hint + Open-run + Purge
   + Reprocess-selected, gated) sits at the foot.
4. **Message inspector** — a right **drawer** on desktop (→ **bottom sheet** on mobile via
   the shared `ns-sheet-dialog`) with the signature + reason hero, a KV panel
   (source/queue/retries/parked/correlation), the **payload JSON**, a **retry-history
   step-timeline** (attempt 1→n with timestamps + outcomes), and gated
   Reprocess/Purge/Open-run actions.
5. **Queue-health overview** (right rail) — per-backend cards: depth number + a
   **depth-vs-capacity fill meter** + a **12-window depth-trend sparkbar** + oldest-age +
   a severity pill (clear/low/elevated/critical). Click a non-empty queue to filter.
6. **All-clear state** + **filtered-empty state** both render cleanly (fully data-driven);
   the **Trigger DLQ** scope (a single message) proves the layout holds with sparse data.

## What was mined, and from which reference

- **04-finance-cards** — the Spending-Summary **arc gauge with a two-tone fill + a "limit"
  caption** → adapted into the **queue-health depth-vs-capacity fill meter** (horizontal
  div meter + `cap N · pct%` caption + severity pill). Deliberately *horizontal fill
  meters*, not an arc, so DLQ is visually distinct from the Migrations arc gauge. The
  line-chart-with-value grammar → the depth-trend + cluster-death **sparkbars**.
- **19-pm-dashboard (Mondays)** — the compact single-row **stat strip** ("12hrs · 24 · 7")
  → the **triage strip**; and the **Status-column pills** in the projects table → the
  per-row **signature badges** + **retry pips** in the triage table.
- **11-devconsole-a (Conduktor)** — breadcrumb + **dense monospace table** + a **right
  detail/filter drawer with its own sections** → the failed-message table + the **message
  inspector drawer** (KV + payload + tabbed-feel sections), reusing the shared
  `ns-sheet-dialog` that auto-switches right-drawer ↔ bottom-sheet.
- **Cross-pollination (new pattern this screen invents):** the **error-signature cluster
  list** — a grouped-failure component with per-cluster bulk affordances and an inline
  death sparkbar — is not present on any prior screen; it is the DLQ signature.

## Bespoke components (per section)

| Section | Bespoke component (class) | What makes it tailored |
|---|---|---|
| Header | `ns-dlqhead` + `ns-conbread` | breadcrumb + title + scope segmented |
| Triage strip | `ns-dlqstrip` / `ns-dlqstat` | accent-bar tiles; `ns-dlqsplit` by-queue micro-bar; `ns-dlqpips` exhausted pips; `ns-spark` red arrival strip |
| Clusters (hero) | `ns-dlqcluster(list)` | grouped-by-signature rows; glyph + ×count + source chips + death sparkbar + age range + Retry-all/Purge |
| Triage table | `ns-dlqtable` / `ns-dlqrow` | dense grid; kind glyph; `ns-dlqsig` badge; `ns-dlqpips` retry pips; exhausted left-rail; inline inspect |
| Bulk bar | `ns-dlqbulk` | select-count + CLI hint + gated Purge/Reprocess |
| Queue health | `ns-dlqfleet` / `ns-dlqqueue` | depth + `ns-dlqmeter` fill + trend sparkbar + oldest age + severity pill; click-to-filter |
| Inspector | `sheetIsS12` / `ns-dlqinsp` | payload JSON + retry-history step-timeline + KV + gated actions; drawer→sheet |
| Empty/clear | `ns-dlqclear` + filtered-empty row | all-clear card + "no match" row |

## Verification

- **Zero `{{ }}` holes, zero console errors, zero horizontal overflow** on every variant
  (desktop 1440 + mobile 390, light + dark) and every interaction state. The lone
  first-load favicon 404 is pre-existing (present in `00-BEFORE-*`) and unrelated.
- **Full-route regression** across all 16 nav screens: holes=0, hOverflow=0 everywhere;
  other screens' markup untouched (only `render/prototype.dc.html` S12 block +
  `render/assets/ns-ext.css` appended).
- Data-driven both ways: **Queue DLQ** (7 messages, 4 signatures, 3 backends) and
  **Trigger DLQ** (1 message, 1 signature, 1 backend) both render cleanly.

## Shots (`render/_visual-reports/V9-dlq-shots/`)

`00-BEFORE-*` ×4 · `dlq-{desktop,mobile}-{light,dark}` ×4 · `dlq-desktop-{light,dark}-inspector`
· `dlq-mobile-{light,dark}-sheet` · `dlq-desktop-light-cluster-filter-bulk` ·
`dlq-desktop-light-trigger`.

## Self-assessed scores (vs the Streams / Migrations bar)

- **Bespoke: 9/10** — the error-signature cluster list is a genuinely new component;
  fill-meters + sparkbars are distinct from the Migrations arc gauge and the Streams
  throughput console; the inspector reuses the shared drawer but with DLQ-specific
  payload + retry-history content.
- **Density: 9/10** — no plain number cards (composite tiles w/ micro-viz), dense grid
  table with inline pips + badges + kind glyphs, compact cluster rows earning height with
  real metadata, slim fill meters. No orphaned ghost rows; sparse Trigger scope still
  holds.

## Honest gaps

- The right rail (`Queue health` + `How triage works`) is shorter than the main column,
  leaving some bottom whitespace on desktop when many messages are parked; acceptable and
  the "how triage works" earns its area, but a denser rail (e.g. a top-sources mini-list)
  could fill it in a future pass.
- Clusters are expand-to-filter (table-driven) rather than in-place expandable member
  lists; filtering the table is the chosen affordance and reads clearly, but an optional
  inline member peek could be added.
- Actions are presentational (askConfirm → toast), matching the prototype's
  complementary-satellite doctrine (no real reprocess/purge execution).
