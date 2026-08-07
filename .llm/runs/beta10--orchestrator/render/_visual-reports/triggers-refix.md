# Triggers — component rethink

## Design question

What components best show a trigger as an activation rule with a condition, action, and next-fire
schedule?

The screen is a rule-activation workbench. The WHEN → condition → DO builder is the signature;
category counts are supporting records, the seven-day strip is the temporal schedule, and firing
history is the audit ledger.

## Anchor references

- `21-flow-builder.webp`: connected rule nodes and selected rule properties.
- `19-pm-dashboard.png`: compact schedule/day rhythm and dense status-bearing records.

## Component decisions

- Rebuilt metric and category groups as flat contiguous rails with neutral internal rules.
- Removed glyph tiles, colored side rails, category rainbow styling, and four redundant category
  bar charts.
- Composed the rule builder from one Card with internal WHEN/condition/DO zones; the action palette
  uses squarish DM Mono labels.
- Preserved the seven-day schedule because it maps real next-fire times, and kept only the real 24h
  firing trend in the summary.
- Used copper as the single accent for armed/selected/action state.

## Self-verification

Playwright CLI captured main, Event-selected, dark, and 390px mobile states in
`triggers-refix-shots/`. There are zero rendered `{{ }}` holes, zero console errors, and zero
horizontal overflow.

## Honest gap

The prototype runtime emits nine existing warnings for unresolved firing-history placeholder fields;
it renders them empty rather than as visible holes. Fixing that data fixture would require the
out-of-scope runtime/support layer.
