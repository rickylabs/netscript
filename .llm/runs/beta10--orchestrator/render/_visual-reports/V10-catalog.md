# Pass V10 — Catalog (Service & Contract Registry)

## Design-question answer (first)

> *What tailored components, layout, and visualization best showcase THE CATALOG — a browsable
> registry of the contracts this app exposes, each with a kind, a type signature / schema, a version,
> and producer/consumer relationships — and how do they compose?*

**Answer: a contract registry / explorer, not a monitoring console.** The catalog's job is *browse a
registry → drill into a contract's signature + schema + who uses it*. So the whole screen is a
**two-pane explorer**: a dense, selectable **registry rail** on the left (contracts grouped by kind,
each entry a compact card carrying method glyph + mono `proc` name + a REST/RPC/SDK **duality
tri-pip** + coverage dot + a one-line signature preview), and a **contract detail** on the right that
renders the full **type signature** (mono, type-colored), a **version + compatibility** header, a
secondary **line-numbered schema** block, and a **producers → consumers relationship strip**. Above
both sits a **header composite** of micro-viz (kind distribution channel-bar, coverage ratio meter,
duality-reach tri-meter, version pill) — never plain number cards. Filter chips (kind / method /
coverage) + search make it a real registry toolbar. On mobile the rail stacks and a tapped contract
opens the shared bottom-sheet with the same signature+schema+relationships.

This idiom is deliberately **distinct** from every finished screen: no precedence waterfall (Config),
no version-arc timeline (Migrations), no fleet triage clusters (DLQ), no live monitoring gauges
(Workers/Sagas/Triggers/Streams). The catalog reads like a **schema/API registry explorer** — mono
signatures, line-numbered schema, a duality matrix, and a producer/consumer graph strip.

## What I mined, from which reference

| Reference | What I took | How it's adapted here |
|---|---|---|
| **13-devconsole-c** (schema registry + version diff) | The `Schema Registry > name` **breadcrumb**, the stat strip (CURRENT VERSION / TOTAL / FORMAT / **COMPATIBILITY**), the version dropdown, and the **line-numbered code** panel | Detail header = version tag + **compatibility chip**; schema shown as a **line-numbered signature block** (single, not a giant side-by-side diff — "secondary, not a giant diff" per brief) |
| **11-devconsole-a** (registry table + tabs + detail drawer) | The **registry → right detail drawer** composition, docs sub-tabs, and a compact stat strip | Two-pane browse→detail on desktop; the drawer becomes the **bottom-sheet** on mobile with signature/schema/relationships |
| **07-chat-signin** (browse/detail composition, KV form) | The **calm browse-left / detail-right** rhythm and the labelled KV block | The detail panel's provenance + transport KV rows; unselected empty-state affordance |
| **03-analytics-cards** (wildcard) | Segmented **channel-bar** distribution + ratio meters | Header **kind-distribution channel bar** + **coverage ratio meter** as micro-viz instead of number cards |
| **19-pm-dashboard** (wildcard) | Status-pill dense table + count badges per group | Registry group headers carry a **count + coverage micro-bar**; rows carry inline pips |

## Component prescription (built)

| # | Component | Element in reference | Adaptation |
|---|---|---|---|
| 1 | `ns-catreg` registry rail | 11 registry list + 19 grouped rows | Kind-grouped, selectable contract cards; each = method glyph + mono proc + duality tri-pip + coverage dot + signature preview |
| 2 | `ns-catreg__group` | 19 project groups w/ count | Collapsible kind header + count + **coverage micro-bar** (complete vs thin fill) |
| 3 | `ns-catdup` duality tri-pip | (new — schema/transport matrix idiom) | 3 pips REST/RPC/SDK, on/off, tinted teal/copper/amber; also a header **reach tri-meter** |
| 4 | `ns-catsig` signature block | 13 line-numbered code | Line-numbered, mono, **type-colored** type signature (params + return) |
| 5 | `ns-catschema` schema viewer | 13 code panel | Secondary line-numbered JSON-ish schema, muted, scrollable |
| 6 | `ns-catrel` producer→consumer strip | (new — dependency graph idiom) | producers column → contract node → consumers column, connector rail |
| 7 | `ns-cathead` header composite | 13 stat strip + 03 channel-bar/meters | kind-distribution channel bar + coverage ratio meter + duality reach tri-meter + version pill |
| 8 | `ns-catbar` filter toolbar | 11 toolbar (search + dropdowns) | search + kind/method/coverage chips |
| 9 | `ns-catver` version + compat | 13 version dropdown + COMPATIBILITY | version tag + compatibility chip in detail header |
| 10 | Contract bottom-sheet (`sheetIsS4`) | 11 drawer → 06 mobile sheet | Reuses shared `ns-sheet-dialog`: full signature + schema + relationships on mobile |

## Layout & composition

Desktop 1440: `header (breadcrumb + title + Contracts/Routes segmented)` → `ns-cathead` composite
(4 micro-viz cells) → `ns-catbar` filter toolbar (search + kind/method/coverage chips) →
`ns-catgrid` two-pane: **registry rail** (`ns-catreg`, grouped selectable cards) + **contract
detail** (`ns-catdetail`: header w/ version+compat → method-strip → line-numbered signature →
line-numbered schema → producer→consumer strip → Scalar action). The Routes tab is a dense
bound/unbound table with a summary chip.

Responsive: ≤960 the header composite goes 2-col; ≤720 the grid collapses to the rail only and the
detail pane is hidden — tapping a contract opens the shared **bottom sheet** (`sheetIsS4`) with the
full signature + schema + relationships; ≤560 the header cells stack single-column with divider
rules. No horizontal body scroll at any width.

## Distinctness from finished screens

- **Not a monitoring console** (Workers/Sagas/Triggers/Streams): no live feed, no runtime gauges, no
  status-stream. This is a static registry you *browse and read*.
- **Not the Config waterfall / Migrations arc-timeline / DLQ clusters:** the signature idioms here —
  a **duality tri-pip matrix**, **type-colored mono signatures**, a **line-numbered schema**, and a
  **producer→consumer connector strip** — appear on no other screen.
- Header micro-viz (kind channel-bar + coverage ratio meter + transport-reach tri-meter) replaces the
  old plain warning badges; per density doctrine, zero plain number-card rows.

## Density notes (per ROLLOUT-DOCTRINE density defaults)

- No plain number-card stat row — header is a composite of a glyph+value cell + three micro-viz cells.
- Registry cards are compact (≈52px): each earns height with method glyph + proc + signature preview
  + duality tri-pip + coverage dot. No 100px padded cards.
- Schema/signature are line-numbered dense mono blocks, not airy bullets; alternating row tint.
- Group headers carry a count + coverage micro-bar (data-bearing, not a ghost divider).
- The gated `crons` group is a slim dashed affordance, not a big empty box.

## Data model (visual metadata only — fully derived, no route/logic/copy-meaning change)

`s4Raw` enriches each of the 7 existing contracts with derived visual fields: `ver`, `compat`,
`input`/`output` (→ signature preview), `sig` (tokenized `[text, kind]` cells → type-colored), `schema`
(tokenized `[name, kind, rest]` lines → line-numbered block), `producers`/`consumers` (→ relationship
strip). Derived aggregates: `s4Head` (total, kind distribution, coverage ratio, transport reach),
`s4Groups` (kind-grouped rows + per-group coverage %), `s4Detail` (selected contract). Geometry uses
`--w0..--w20` width-bucket classes (5% steps) — **no SVG `{{ }}` holes**. New state:
`s4Sel`/`s4Kind`/`s4Method`/`s4Cov`/`s4Q`; empty/populated + no-results states all render cleanly.
Existing `s4Contracts`/`s4Routes`/`s4Tree`/`s4Summary` bindings preserved (Tree/Summary now derived
from the same source). `sheetIsS4` reuses the shared `ns-sheet-dialog` (right drawer desktop / bottom
sheet mobile).

## Verification

0 `{{ }}` holes / 0 real console errors (only a benign favicon 404) / 0 horizontal overflow across:
desktop 1440 (light+dark), mobile 390 (light+dark), plus interaction states — contract selected
(complete + thin), coverage-filter narrowing (empty groups hidden), Routes tab, and the mobile
bottom-sheet (light+dark). **Full 16-route regression clean** (every nav item: 0 holes, 0 overflow,
0 errors). Edits limited to the S4 Catalog markup, S4 state/bindings/derivation, the `sheetIsS4`
sheet body, and appended `ns-ext.css` — no edits to `support.js`, `_ns_styles.css`, `_ds/*`, or any
other screen's markup.

## Self-assessment

- **Bespoke:** 9/10 — the explorer idiom (registry rail + signature/schema/relationship detail) is
  unlike any finished screen; only the Routes secondary tab reuses the generic table.
- **Density:** 8.5/10 — compact cards, line-numbered mono blocks, composite header micro-viz, no ghost
  rows. Detail pane has some intentional breathing room around the schema block.

## Honest gaps / declined

- The **Routes tab** stays a standard dense table (it is the secondary tab; the Contracts explorer
  carries the bespoke weight). A future pass could give it a small route→contract binding graphlet.
- The producer/consumer nodes are **non-interactive labels** (deep-linking them to their entities is a
  candidate future enhancement; the data has no canonical target ids today, so I did not invent nav).
- Version history is shown as a single `ver`+`compat` chip, **not** a v→v diff viewer (brief said
  schema should be "secondary, not a giant diff" — so a single line-numbered block, not the ref-13
  side-by-side). A version dropdown could be added if multi-version data is introduced.
- Signature/schema strings are illustrative visual metadata consistent with each proc's method +
  namespace; they are not read from a real type system (this is a static prototype).

