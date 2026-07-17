# Runtime Config — component rethink

## Design question

*What tailored components, layout, composition, data-visualization, and data-structure best showcase
RUNTIME CONFIG — live values that override resolved defaults, their provenance, reload state, and
revision/rollback history — and how do they compose together?*

Runtime Config should read as an override ledger with a versioned write history, not a generic
metrics dashboard. A unified summary ribbon establishes the current store revision and the override
inventory. The live set is a records table whose scan axis is key, base value, runtime value,
provenance, reload state, and action. A selected record opens a contextual property inspector. The
revision sequence and its actual add/remove diff are the feature-true visual structure; they show
change over time without inventing trend or progress data.

Two references drive the composition:

- `11-devconsole-a.png` — dense records table, compact tool rail, and contextual right-side
  inspector.
- `13-devconsole-c.png` — one contiguous summary rail plus version selection and code-diff history.

The PM dashboard remains a secondary density reference, but its social avatars and card widgets are
not appropriate for a runtime-config ledger.

## Component decisions

| Existing element | Decision | Reason |
| --- | --- | --- |
| Four-part override header | Keep as one contiguous `ns-card--console` summary ribbon | Ref 13 uses a single compact version/format/compatibility rail; the facts belong together and are not four independent cards. |
| Diverging 8/42 meter | Replace with ratio text | The proportion is legitimate, but the selected reference pattern expresses simple registry facts as precise text; the revision diff carries the screen's visual comparison. |
| Override kind pips/glyphs | Replace with one textual type breakdown | Flags/jobs/triggers/tasks are categorical counts, not a distribution chart. |
| Live override set | Recompose as `ns-data-table ns-data-table--console` | Overrides are comparable records. Base and runtime value remain paired because the transition is the row's defining fact. |
| LIVE/PENDING pills | Replace with neutral DM Mono uppercase metadata | Reload state is categorical; it does not need colored capsule chrome. |
| Row glyphs and colored value states | Remove/neutralize | The key and base/runtime value already identify the record; extra glyph/color layers competed with the selected state. |
| Prose activity feed | Replace with time/target/action records | Override events have stable comparable fields and benefit from the same scan rhythm as ref 11. |
| Pending-reload and author widgets | Remove | Pending state is already on each record; authors are already in provenance. Both cards duplicated the ledger. |
| Revision change pips | Remove; retain explicit change count and real diff | A pip count obscured a value already present in text. The version sequence and diff are meaningful. |
| All/Compact/JSON segmented buttons | Replace with `ns-tabs--underline` | These are alternate read modes of one dataset, matching the tab grammar in ref 11. |
| Inspector KV table | Replace with compact `ns-property-list--compact` | One record's properties belong in a definition record, not a comparison table. Desktop uses two columns; mobile uses one. |
| Follow switch | Replace with Pause/Follow text action | Stream following is a transient action, not a persisted preference. |
| Heavy/blurred selected sheet context | Flatten and de-blur only the Runtime Config inspector | The selected row stays visible behind the drawer/sheet, improving wayfinding without changing other routes. |

## Kimi trajectory

### Round 1 — 58 / 100

Kimi confirmed that the 8/42 proportion was the only remaining meter, then flagged colored feed
pips, pill-like reload/current states, author avatars, the high-attention destructive drawer action,
and weak mobile record treatment.

Applied: neutral text states/actions, removed feed pips and avatars, flattened inspector chrome,
wrapped full keys/values, shortened helper copy, and added an explicit mobile selected-state shot.

### Round 2 — 62 / 100

Kimi shifted to information architecture: the right rail still behaved like a generic widget stack,
the feed was prose rather than records, authors duplicated provenance, inspector facts used a table,
and revision modes looked like action buttons.

Applied: event DataTable, removed pending/authors widget cards, introduced the property list, moved
revision modes to underline tabs, and made the diff neutral.

### Round 3 — 62 / 100

Kimi then objected to the proportion visualization and follow switch and requested a more compact
property record. It also continued to score shared shell chrome even after the audit was scoped to
screen content.

Applied: removed the ratio bar in favor of precise text, replaced the switch with Pause/Follow,
removed screen helper prose, tightened the two-column property record, and strengthened selected-row
context.

### Round 4 — 62 / 100 (four-round limit)

Kimi's final findings contradicted earlier rounds in several places: it first required the prose feed
to become a table, then called the table the wrong component; it first requested a definition list,
then called that list wrong after it became a compact property grid; and it described the contiguous
summary ribbon as four isolated cards. The four-round limit was reached.

The owner directly reviewed the resulting screen and confirmed that AI slop was gone, then raised a
separate craft requirement: recover the crisp hierarchy of the Dribbble references. The final craft
pass therefore follows the owner's design direction and the direct reference evidence rather than
chasing contradictory evaluator suggestions. The prototype now uses the ref-11 table/inspector
pattern and ref-13 summary/version-diff pattern through Fresh UI tokens and logged component
modifiers.

## Design-system enhancement candidates

Runtime Config is the first validation surface for `ns-card--console`,
`ns-data-table--console`, `ns-tabs--underline`, and `ns-property-list--compact`. Their intended
registry targets and promotion criteria are recorded in `design-system-enhancement-log.md`; package
source was not silently changed during this prototype slice.

## Validation

- Playwright final matrix: desktop light, selected desktop light, desktop dark, mobile 390 light,
  and selected mobile bottom sheet.
- Navigation used the real Runtime Config nav button; no hash-only navigation was used to enter the
  screen.
- Final mobile document width equals viewport width (`390`); no rendered template holes.
- Only the pre-existing missing `/favicon.ico` request appears in the console.
- Runtime-specific additions use `--ns-*` tokens; no new raw hex/RGBA values.

Final screenshots are in `runtime-config-refix-shots/round4/`. Earlier rounds remain as the visual
evidence trail for the 58 → 62 → 62 → 62 evaluator trajectory.
