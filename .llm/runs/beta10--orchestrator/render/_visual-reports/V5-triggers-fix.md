# Pass V5-fix — Triggers (S9) — adversarial-gate fix pass

Gate verdict fixed against: `visual/_evals/V5-triggers-adversarial-vision.md` — **55/100
ACCEPT-WITH-FIXES** (Kimi K2.6 vision). The bespoke bones (category band, WHEN→DO rule builder,
7-day schedule horizon, firing-history sparkline table, tabbed drawer) were kept; this pass
rebuilds the five sections the gate correctly flagged as generic dashboard chrome.

Scope: **visual + layout only.** No route/logic/data/copy-meaning changes. NS One identity held —
`--ns-*` tokens only (zero raw hex), `ns-*` class contracts, warm-cream + `[data-theme='dark']`,
copper/teal/amber, DM Sans / DM Mono, hard press shadow. Geometry is div/CSS (no SVG `{{ }}` holes).
All new CSS appended to `render/assets/ns-ext.css` under the Pass V5 block.

## The design question (per section)

Each flagged section was re-asked *"what tailored component best showcases THIS part of the
trigger feature?"* — not "apply a generic widget."

| # | Gate hit | What shipped | Reference mined |
|---|----------|--------------|-----------------|
| 1 | Stats row = five grey number boxes | **Iconified metric strip** (`ns-tmetric`): each metric a type-glyph tile + value + a meaningful micro-viz — armed shield + armed/total meter, fires flame + 12-bucket copper sparkline + `↑ +6%` trend, DLQ alert + `↑ +3` trend, plus sub-labels. Denser, not five equal boxes. | `19-pm-dashboard` top summary-stats bar |
| 2 | Firing-history table has no controls | **Inline query toolbar** (`ns-thquery`) above the table: quick-search (WIRED — filters rendered rows by trigger/action name), outcome-filter dropdown, show-limit (25/50/100), "+ Add JS filter" affordance, live result count. | `11-devconsole-a` records-table toolbar |
| 3 | Dead-letters = two progress bars | **Compact dead-letter mini-table** (`ns-tdlt`): last 5 failed firings — id, queue tag (redis/memory), error snippet, age, source trigger, retry-count, inline Retry (↻) / Inspect (⇱) actions. One-line `redis 14 · memory 3` depth summary pill retained in the header; top-offender line kept in the footer. | `11-devconsole-a` record table |
| 4 | Category band — Manual card a hollow void; loose padding | **Meaningful empty-state** for hollow categories: bars flatten to a dashed baseline + "NO FIRES · 24H", and the foot line reads `silenced · CLI-only` (or `armed · awaiting invoke`) instead of a bare "0 fires". Card header padding + gap tightened so all four cards are denser. Per-category sparkbars + click-to-filter kept. | (tightening; ref 19 project rows for the density target) |
| 5 | Schedule next-fire cards = plain text | **Temporal treatment** (`ns-tnext`): each card gets a type-colored left bar (copper=cron/interval), a kind pill (CRON / INTERVAL / SCHEDULE), a **progress-to-next-fire bar** (elapsed vs interval), and the cadence label (`daily 02:00`, `every 30s`). 7-day day-strip left as-is. | `19-pm-dashboard` schedule blocks |

## Left intact (gate under-credited — do-not-touch)

- **WHEN → DO rule builder** — already reads event → condition → action; untouched.
- **Detail drawer / mobile sheet** — Action-chain / Payload / Schedule tabs kept; the **Payload
  tab renders formatted, indented JSON** (verified in the mobile-dark payload shot).

## Data-model additions (feed the new components; presentational only)

- `s9StatTiles` — added `glyph`, `spark`/`meter`/`meterTone`, `trend`/`trendDir`, `sparkTone`, `sub`.
- `s9Cats` — added `hollow` flag + `emptyLabel` (state-aware foot line; no card is a void).
- `s9NextFires` — added `progressPct`, `span`, `kindLabel` (from a declared-cadence lookup).
- `s9DeadLetters` — new array of 5 failed firings with presentational `retryAction`/`inspect`.
- Firing history — new `s9Query` / `s9Outcome` / `s9Limit` state; quick-search + outcome +
  limit applied to `s9HistRaw`/`s9HistShown`; `s9HistCount` label. Quick-search is genuinely wired.

## Verification

- **Quick-search wired:** typing `cron` → 1 row (`cron.nightly-reconcile`); `poll` → 1 row;
  clear → all 8 rows restored.
- **Every Triggers variant:** zero `{{ }}` holes, zero console errors (page/pageerror), zero
  horizontal overflow — desktop 1440 + mobile 390, light + dark, drawer, mobile sheet (chain +
  payload), category-filter, sorted, and quick-search states.
- **16-route regression:** clean — zero errors / zero holes / zero overflow on Home, Config,
  Runtime, Catalog, Live Flow, Run Inspector, Plugins, Workers, Sagas, Triggers, Streams,
  Migrations, DLQ, Auth, AI, Extensions. All new CSS is `ns-t*`-scoped; no shared-class edits, so
  no leakage.
- **Identity:** no raw hex in the new CSS; `--ns-*` tokens only; theme-blind `color-mix`.

## Shots (overwritten in `render/_visual-reports/V5-triggers-shots/`)

`triggers-desktop-{light,dark}.png`, `triggers-mobile-{light,dark}.png`,
`triggers-desktop-light-drawer.png`, `triggers-desktop-light-sorted.png`,
`triggers-desktop-dark-catfilter.png`, `triggers-desktop-light-search.png`,
`triggers-mobile-light-sheet.png`, `triggers-mobile-dark-sheet-payload.png`,
`triggers-mobile-dark-sheet-sched.png`. Prior `00-BEFORE-*` baselines retained for comparison.

## Honest gaps

- The **stat-strip glyphs** for ARMED (⛨ shield) and SILENCED (⊘ mute) render as slightly ambiguous
  boxy marks in DM Sans; the meter/trend/label carry the meaning, so it reads, but a font with
  richer glyph coverage (or an inline CSS mark) would be crisper.
- **"+ Add JS filter"** and the dead-letter **Retry/Inspect** buttons are presentational (toast /
  nav to DLQ) — no real JS-predicate editor or reprocess pipeline, matching the prototype's
  complementary-satellite scope. Quick-search + outcome + limit filters are the ones actually wired.
- The next-fire **progress fraction** is a declared-cadence lookup (presentational "how close"),
  not a live clock — appropriate for a static prototype, but it does not tick.
- Dead-letter rows are a fixed illustrative set (5 entries); they render cleanly but are not derived
  from the live `s9Events` feed.
