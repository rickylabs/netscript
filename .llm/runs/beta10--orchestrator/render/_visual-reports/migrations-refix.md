# Migrations — component rethink

## Design question

*What tailored components, layout, composition, data visualization, and data structure best showcase
MIGRATIONS — the applied ledger, the live database head, the declared schema, drift, and the exact DDL
change — and how should they compose together?*

Migrations should read as a schema workbench, not a health dashboard. The primary comparison is the
selected migration's exact DDL change, kept persistently adjacent to the migration ledger. A compact
metadata rail establishes live head, declared target, ledger position, drift count, and database.
Schema drift is a two-column records set because each discrepancy has a stable object and an actual →
declared value. The only visualization is the semantic add/remove DDL diff; it truthfully shows the
feature's change data.

Two references drive the composition:

- `13-devconsole-c.png` — compact schema/version metadata and a persistent, syntax-aware diff
  workspace.
- `11-devconsole-a.png` — dense records table with a contextual inspector that updates without
  leaving the work surface.

## Component decisions

| Existing element | Decision | Reason |
| --- | --- | --- |
| Applied ratio bar, pending pips, drift pips | Remove; retain exact metadata text | The same facts are already present in the ledger and drift records. The micro-visuals added no decision value. |
| Five-part migration header | Flatten to a compact inline metadata rail | These are related schema facts, not separate dashboard widgets. Hairlines and whitespace match ref 13. |
| Version-chain node cards | Remove after round 1 | The ledger already provides the complete ordered history; the visual stepper duplicated chronology. |
| Migration ledger | Recompose as `ns-data-table ns-data-table--console` | Migrations are comparable records with stable version, identifier, applied time, duration, rows, and status fields. |
| Node glyph chips for objects/rows/duration | Remove | The glyphs wrapped scalar facts in decorative chrome and duplicated the ledger columns. |
| Arc gauge for schema drift | Replace with drift records | `6 of 8` is a legitimate proportion, but the actionable information is which two objects differ and how. A gauge hid that detail. |
| Drift object mini-cards | Flatten to a two-column DataTable | Object and actual → declared value are record fields; kind and note remain compact textual metadata. |
| Separate pending-action card and black CLI strip | Replace with `InlineNotice` inside the selected inspector | The warning is actionable and belongs beside the DDL it will apply. The command stays factual and token-driven. |
| Selected detail card plus DDL modal/sheet | Replace with a persistent contextual inspector | Ref 13 keeps the diff in the workspace; ref 11 keeps selected context adjacent to records. Row selection now updates the inspector directly. |
| Status badges | Replace with plain mono text | Applied/pending are categorical cell values, not pills. Pending uses the screen's single primary accent; applied stays neutral. |
| Duplicate top and contextual migrate actions | Keep only the contextual apply action | One operation gets one control, located beside the pending DDL and command. |
| Repeated Receipt addition in v4 DDL | Remove from v4 diff | Receipt is introduced by v3 in the same dataset. Removing the duplicate restores the stated v3 → v4 migration meaning. |

## Kimi trajectory

### Round 1 — 64 / 100

Kimi found zero wrong visualization components, but called the sequence decorative duplication,
objected to the modal DDL path, and requested a denser, flatter ledger/diff workspace.

Applied: removed the sequence, made ledger selection update a persistent DDL inspector, reduced the
summary to compact metadata, and replaced status chips with text.

### Round 2 — 68 / 100

Kimi approved the persistent workspace direction but still read flat panes and plain status text as
card/pill chrome. Its useful fixes were to remove remaining shadows, demote actions, deduplicate the
selected identifier, and compress the mobile metadata treatment.

Applied: removed card surfaces and shadows, used hairline panes, converted the mobile rail to compact
inline facts, reduced inspector facts to applied/duration/rows, and demoted both migrate controls.

### Round 3 — 70 / 100

Kimi identified the real v4 DDL inconsistency (`Receipt` was already introduced by v3), plus the
selected-row ink rail and duplicate screen-level Aspire actions. It also continued to score shared
shell glyph density and to describe already-square, shadowless panes as rounded cards.

Applied: corrected the incremental DDL, removed the selection rail, removed screen-level Aspire
duplicates, and tightened mobile ledger records.

### Round 4 — 80 / 100 (four-round limit)

Kimi confirmed there was no fake visualization, marketing copy, modal fragmentation, glyph overload
inside the screen, or decorative text duplication. It again misidentified plain text statuses as
filled pills and hairline-separated facts as boxed bars, but found two concrete polish issues: the
duplicate migrate operation and inconsistent displayed version casing.

Applied after the final evaluation: removed the header migrate action so the contextual inspector owns
the single control, and normalized displayed versions to the dataset's lowercase `v*` form. The final
shots include this cleanup. The four-round cap was reached at 64 → 68 → 70 → 80.

## Design-system enhancement candidates

Migrations is the second validation surface for `ns-data-table--console` and
`ns-property-list--compact`. Both work without card chrome on a flat canvas, so the enhancement log
marks them ready for registry sync review. The screen-specific metadata rail, pane layout, and DDL
composition are not proposed as generic components.

## Validation

- Playwright final matrix: desktop light, selected desktop light, desktop dark, mobile 390 light,
  and selected mobile light.
- Navigation entered Migrations through the real nav button; no hash-only navigation was used.
- Selection was exercised with the v3 ledger record and visibly updates its facts and DDL.
- No browser console errors or warnings in the final matrix.
- Screen additions use `--ns-*` tokens and token `color-mix`; no new raw hex/RGBA values.
- No arc gauge, fake progress bar, pips, glyph chips, pill statuses, solid CLI bar, or modal DDL path
  remains in the screen.

Final screenshots are in `migrations-refix-shots/round4/`. Earlier rounds preserve the complete
component and evaluator trail.
