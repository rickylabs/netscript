# Home — exact per-widget spec (match the reference craft, widget by widget)

The bar is the reference images in `references/` (esp. `03-analytics-cards`, `01-synergy-hr-desktop`).
The rule from the owner: **each widget must be TAILORED** — a bespoke, multi-layer composition, not a
generic tile. Dense content-sized masonry, no dead space. Every card follows the ref anatomy:
**header (title + action) → hero (big value + delta pill) → a MID layer (table / segmented control /
stacked bar / legend) → a chart or rich body.** In NS One identity (warm-cream/dark, press shadow,
copper/teal/amber, `--ns-*` tokens, `ns-*` markup) — NOT the refs' palette.

## Missing component types to BUILD (token-driven, no SVG `{{ }}` holes)
- **Filled area chart** with a faint baseline grid + axis labels (ref: Conversion Rate). A comparison
  under-area is a plus.
- **Line chart** with a marker point + a floating value tooltip + optional crosshair (ref: Stock Tracker).
- **Bar chart** with value labels on/above bars (ref: Product Performance).
- **Data table** = per row: (icon) + label + metric value + colored trend arrow+% ; with column headers
  (ref: Marketing Channels). Column-aligned.
- **Stacked segmented bar** (rounded segments w/ gaps) + **dot legend** (ref: Marketing Channels).
- **Radial gauge** with the value centered + a small breakdown row/tiles beneath (ref: Time Off).
- **Delta pill** (rounded, tinted bg: success/destructive), **trend arrow** colored, **status pills**,
  **tag pills**, **avatar/provenance stacks**, **timer/relative-time pills**, **⌘-shortcut chips**.
- **Segmented time control** (1H/24H/7D style) as a real control.
- **Per-card actions:** a top-right "Details/Runs →/See All" affordance on every card; a full-width
  secondary button at the bottom where the ref uses one ("View reports").

## Per-widget mapping (NetScript Home → reference archetype)
1. **Throughput KPIs (executions/hr, firings/hr, override changes, saga success).** Do NOT leave as
   thin sparkline tiles. Make the row RICHER: promote 1–2 to a full **Conversion-Rate-style** card
   (hero value + delta pill + a small breakdown table + a **filled area chart w/ grid + axis**); the
   others as compact stat tiles with a proper filled micro-area (baseline, not a hairline). Each has a
   top-right deep-link.
2. **Wiring health (16/20 nodes).** A **Time-Off-style** card: radial gauge centered + a 3-tile
   breakdown (healthy/degraded/unbound with colored dots + counts) + an "ATTENTION" pill + a "View →".
3. **Execution outcomes.** A **Marketing-Channels-style** card: hero (270 runs) + a **stacked channel
   bar** (completed/retried/failed) + **dot legend** + a **table** (Job executions / Saga instances /
   Trigger firings → count + colored trend) + a "Runs →" action.
4. **Capability mix.** A **donut** card: donut (6 plugins) + a **legend table** (Workers 42% / Triggers
   28% / Streams 18% / Sagas 12% with colored dots + %) + "Plugins →".
5. **Wiring signals.** A **segmented control** (1H/24H/7D) + a **table** of signals (Plugin doctor,
   Migrations, Runtime overrides, Scheduler drift → status pills + a "→"). Column-aligned.
6. **AI incident summary.** Keep the narrative but tighten to the card anatomy: eyebrow + ✦ + title,
   the causal paragraph, **grounding chips**, an **action-chip row**, a provenance/model footer. Give
   it a copper left-accent. Dense, not airy.
7. **Where to look (6 facts).** A tight **3×2 stat grid**: each = big value + label + a one-line
   sub-detail + a deep-link arrow; warning-toned dot only when non-zero.
8. **Just happened.** A compact **activity feed**: colored primitive dot + event text + entity chip +
   relative-time pill, 4–5 rows.
9. **Command palette + Contributed panels.** Composed cards: the palette as a search + grouped action
   rows (Navigate/Act/Recent) with ⌘ hints; contributed panels as a small provenance table.

## Chrome (make it a signature — refs 01/02)
- **Sidebar:** logo tile + wordmark; grouped nav (Overview/Capabilities/Data/System) with icon-tiles,
  derived badges, an **active pill + left accent + filled icon + chevron**; add a **PINNED/RECENT group
  with ⌘-shortcut chips** on the right; a **profile/workspace card pinned at the bottom** (avatar +
  workspace + env + chevron); collapsible icon rail.
- **Topbar:** a real header — a **two-line context** (crumb/title + a one-line status like the refs'
  greeting), the `local · my-app · aspire` env pill, a **prominent search/⌘K**, **Open Aspire ↗**, a
  **primary action button** (e.g. "Ask ✦" styled like the refs' "Create Request"), theme toggle.

## Mobile — dedicated bottom sheets (REQUIRED, called out by owner)
- Sidebar → drawer (already have). Beyond that: **dedicated bottom-sheet modals** for detail/actions —
  a stat/card tap opens a bottom sheet with its detail; the command palette is a bottom sheet; filters/
  segmented views open as bottom sheets (refs `06-mobile-sheets`). Dense single-column masonry; cards
  reflow to their mobile composition; no horizontal body scroll.

## Execution discipline (this is the point)
Build each widget, screenshot it, and **compare it directly to its named reference archetype** — if it
is sparser / flatter / fewer layers than the ref, it is NOT done; iterate. Do not settle for
"improved" — match the reference craft. Zero `{{ }}` in the DOM, zero console errors, no horizontal
overflow, both themes, both viewports, every iteration.
