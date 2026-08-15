[0m
> build · moonshotai/kimi-k2.6
[0m
openrouter/moonshotai/kimi-k2.6

## 1. BESPOKE VERDICT (0–100): 62

**Tailored parts:**  
- The vertical **Version chain** with the teal connector line is genuinely bespoke to migrations—timeline semantics are correct and the APPLIED/PENDING pill on each node is contextual.  
- The **Schema drift** half-donut gauge is feature-specific (drift count + "6 of 8 objects in sync").  
- The **DDL diff** tab in the drawer/sheet, showing `schema.prisma DIFF` with `+ model User` entries, is directly tied to migration artifacts.

**Generic/template parts:**  
- The top **SCHEMA HEAD → v4** hero area is mostly empty centered text in a oversized card—reads like a status banner swapped from any SaaS admin page.  
- The four **APPLIED / PENDING / DRIFT / LAST APPLIED** stat cards (3, 1, 2 drifted, "add receipts") are plain number-in-box widgets with zero visual distinction beyond the amber "2 drifted" tint; could be from any analytics dashboard.  
- The **Migration ledger** table is a generic 6-column data grid (VER, MIGRATION, APPLIED AT, DURATION, ROWS, STATUS) with no visual density or feature-specific affordances—literally a `<table>` rendered with borders.  
- The **right-hand "1 migration pending"** rail is a generic info panel with bullet-list "WHAT WILL CHANGE" items (table bullet, orders.status bullet) and a full-bleed CTA—indistinguishable from a Stripe billing-detail sidebar.

---

## 2. DENSITY / DEAD-SPACE

| Region | Empty/low-info % | Verdict |
|---|---|---|
| Top hero ("DB migrations & drift" + stat cards) | ~45% | FAIL. The hero text is centered with huge whitespace below it; stat cards are spaced loosely and the LAST APPLIED card is mostly whitespace around a two-line text block. |
| Version chain column | ~35% | FAIL. Each timeline node is a 120px-tall card containing only a title, filename, date, and duration—vast internal padding; the "LIVE DB · HEAD AT V3" marker is a ghost row with dashed border and almost no content. |
| Migration ledger table area | ~30% | FAIL. The table has generous row height and no inline actions, no nested DDL preview, no row hover affordances—just text floating in cells. |
| Schema drift gauge panel | ~25% | BORDERLINE. The gauge is nice, but the DRIFTED OBJECTS list below it has oversized cards with tiny font labels ("COLUMN", "TABLE") surrounded by whitespace. |
| Right pending-migration rail | ~40% | FAIL. The "1 migration pending" card has a small header, two tiny bullet rows, then a massive command block (`$ netscript db migrate`) consuming vertical space with almost no information density. |

By contrast, the PM dashboard reference packs stats into a single horizontal chip row, the Schema Registry reference packs metadata into a compact 4-column header, and the Dev Console reference packs a data table + filter panel + docs into one viewport with zero wasted gutters.

---

## 3. COMPONENT PRESCRIPTION TABLE

| # | Screen section (what you see now) | Why it's generic/weak | Prescribed concrete component/pattern | Source reference — file + the EXACT element in it | How to adapt to Migrations |
|---|---|---|---|---|---|
| 1 | Top stat cards (APPLIED 3, PENDING 1, etc.) | Four disconnected squircles with plain integers; no trend, no sparkline, no iconography. | **Horizontal metric chip row** with icon + number + micro-label, e.g., "12hrs Time Saved · 24 Projects Completed · 7 Projects In-progress". | `19-pm-dashboard.png` — the stats row directly under "Good Evening! John," | Replace the 4 tall cards with a single compact horizontal strip: v3→v4 icon, Applied count, Pending count, Drift count, Last-applied relative timestamp. |
| 2 | Migration ledger table | Monotonic grid; no diff preview, no row expansion, no syntax highlighting. | **Inline diff/code expander**, like the side-by-side schema diff viewer with line numbers and `+`/`-` line backgrounds. | `13-devconsole-c.png` — the Schema Registry JSON diff block with green/red line highlights and line numbers | Each ledger row should expand (or slide a drawer) to reveal the actual `schema.prisma` diff inline, not just a generic "STATUS" pill. |
| 3 | "1 migration pending" right rail | Generic bullet list with text-only changes; no visual preview of structural impact. | **Documentation explainer panel** beneath an action area, with collapsible "Basics / Parameters / Functions / Examples" tabs. | `11-devconsole-a.png` — the "Documentation" lower section in the Add JS filter panel, especially the bullet list with code formatting | Replace the "WHAT WILL CHANGE" bullets with a collapsible "Impact preview" doc panel showing before/after DDL snippets and affected table diagrams. |
| 4 | LIVE DB · HEAD AT V3 marker | Dashed ghost box with tiny text; visually orphaned and low-confidence. | **Connection status badge + version selector dropdown**, e.g., "Version 3 (current)" dropdown arrow beside a live dot indicator. | `13-devconsole-c.png` — the "Version 3 (current)" dropdown with arrow in the Schema Registry header | Make the live DB marker a compact, pinned header chip with a green pulse dot and a dropdown to jump between live-vs-chain versions. |
| 5 | Schema drift "2 drifted" gauge panel | Gauge is fine, but the drifted-object cards below are airy label-value blocks with no structural preview. | **Structured object diff list** with inline property highlighting, similar to the schema registry's field-level diff. | `13-devconsole-c.png` — the JSON field diff showing `"logicalType"` changing from `"time-milies"` to `"time-millis"` with red/green rows | Show each drifted object as a compact diff card: left side = expected type, right side = actual type, with a one-line DDL snippet. |
| 6 | Migration detail drawer/sheet (Summary tab) | Summary shows only a text paragraph and "TABLES TOUCHED" chips—too sparse. | **Schedule + event card list**, using visual date/time blocks and avatar/assignee stacks to show chronology. | `19-pm-dashboard.png` — the Schedule section with Mo/Tu/We day blocks and event cards ("Kickoff Meeting", "Create Wordpress website") | In the migration detail sheet, show a timeline of "Pre-check → Apply → Seed → Verify" steps as a vertical schedule, with durations and status icons. |
| 7 | Migration detail DDL diff | Only 2 lines of diff visible (`+ model User`, `+ model Session`) with no line numbers, no file path tabs, no navigation. | **Filter-side panel with code editor + documentation tabs**, including line-numbered textarea, file tabs, and "Apply filter" action button. | `11-devconsole-a.png` — the "Add JS filter" panel with the Filter code textarea, line numbers implied, plus the "Apply filter" primary button | Give the DDL diff a real code-editor chrome: file tabs (`schema.prisma`, `migration.sql`), line numbers, and a sticky "Run migration" action bar at the bottom of the drawer. |
| 8 | Mobile bottom sheet | Three stacked full-width cards (APPLIED, DURATION, ROWS) consuming excessive vertical space; looks like a default BottomSheet. | **Compact inline metadata grid** with small-label-above-value cells and a draggable handle. | `11-devconsole-a.png` — the compact table header row ("Timestamp / Offset / Partition / Key / Value") and the tight Add JS filter panel | Collapse the metadata into a 3-column grid (Applied / Duration / Rows) on one row, then immediately show the Summary/DDL tabs below without scrolling. |

---

## 4. VARIETY LEVERAGE

Four patterns from the references that the Migrations screen does NOT use but should:

1. **Horizontal summary metric chips with icons** (`19-pm-dashboard.png`, the row under the greeting).  
   *Missing from:* the top hero area.  
   *Where it would go:* Replace the four tall stat cards with a single dense horizontal strip under the page title, showing Schema Head, Applied count, Pending count, Drift count as icon+number micro-cards.

2. **Side-by-side diff viewer with line numbers and red/green row highlights** (`13-devconsole-c.png`, the Schema Registry JSON diff).  
   *Missing from:* the Schema drift section and the DDL diff view.  
   *Where it would go:* The Schema drift panel should show before/after structural snippets side-by-side (expected schema vs live DB), and the drawer DDL diff should be upgraded from a plain `<pre>` block to a lined, colored diff.

3. **Inline tabbed documentation panel** (`11-devconsole-a.png`, the "Documentation" area in the Add JS filter panel with Basics/Parameters/Functions/Examples tabs).  
   *Missing from:* the right pending-migration rail and the detail sheet.  
   *Where it would go:* Replace the "WHAT WILL CHANGE" bullet list with a tabbed mini-docs panel explaining the migration's impact on queries, indexes, and constraints.

4. **Status badge + avatar stack + scheduled timeline strip** (`19-pm-dashboard.png`, the Schedule section with day selectors and stacked-avatar event cards).  
   *Missing from:* the Version chain and the migration detail sheet.  
   *Where it would go:* The Version chain should show who/what triggered each migration (avatar or system icon) and a mini-timeline of pre-flight checks; the detail sheet should show a step-by-step execution pipeline with durations.

---

## 5. TOP 5 FIXES

1. **Flatten the four stat cards into a horizontal metric strip** (per the PM dashboard reference) because the current cards consume 200px of vertical hero space for four integers.  
2. **Upgrade the DDL diff to a lined, side-by-side, syntax-highlighted diff viewer** (per the Schema Registry reference) because a raw `<pre>` block with two green lines is insufficient for reviewing structural migrations.  
3. **Add an inline "Impact preview" accordion to the pending migration rail** (per the Dev Console documentation panel) because bullet-point text ("+ table delivery_attempts") does not communicate schema risk.  
4. **Compact the Version chain nodes by 40% and add per-node metadata** (duration, row count, author avatar) because the current cards are 120px tall with only 3 lines of text—dead space that breaks density.  
5. **Replace the mobile sheet's stacked metadata cards with a 3-column grid and a fixed action bar** (per the Dev Console filter panel density) because the current sheet pushes the DDL diff below the fold on a standard phone.

---

## 6. FINAL

**ACCEPT-WITH-FIXES**
