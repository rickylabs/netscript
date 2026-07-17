# Catalog — component rethink

## Design question

What tailored components, layout, composition, data-visualization, and data-structure best showcase
the Catalog — a browsable registry of callable contracts — and how do they compose together?

Catalog is a contract workbench, not a KPI dashboard. It combines a compact fact rail, a contiguous
grouped registry, and a persistent signature/schema inspector. Coverage and transport reach are
categorical contract facts, so the old meter language is absent. Selection is the interaction that
connects the registry to the inspector.

## Anchor references

- `11-devconsole-a.png`: dense browse surface, compact filtering, and persistent side inspector.
- `13-devconsole-c.png`: schema-first hierarchy, line-numbered code region, and quiet metadata rail.

## Component decisions

- Composed the summary and inspector from real `ns-card` surfaces: flat `--ns-card`,
  `--ns-shadow-xs`, and internal hairline rules.
- Rebuilt the registry as an `ns-data-table`-style contiguous record list instead of bordered cards.
- Kept procedure method, coverage, and REST/RPC/SDK support as squarish DM Mono facts; no faux
  progress or colored outer rails.
- Made the schema/signature pane the single copper-accent signature and kept all other structure
  neutral.
- Removed decorative search/external-link glyphs and rounded body-text pills.

## Self-verification

Playwright CLI captured main, selected-record, dark, and 390px mobile states in
`catalog-refix-shots/`. The rendered Catalog has zero `{{ }}` holes, zero console errors, zero
document/screen horizontal overflow, and a working click-selected detail state.

## Honest gap

At 390px the persistent desktop inspector intentionally becomes the existing selection sheet; the
main mobile screenshot therefore prioritizes the registry and its filters.
