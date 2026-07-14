# Config Resolution — component rethink

## Design question

What tailored components best explain how one effective configuration value is chosen from layered
sources?

The screen is a precedence workbench: a dense key ledger drives a selected-key resolution panel,
whose ordered cascade makes the winning source and shadowed sources explicit.

## Anchor references

- `13-devconsole-c.png`: master/detail workbench and factual diff/code hierarchy.
- `21-flow-builder.webp`: connected decision path with a selected properties surface.

## Component decisions

- Replaced the decorated KPI slab with one flat fact rail and internal hairlines.
- Preserved the ordered precedence sequence because order is the domain; removed ornamental
  micro-meters and glyphs.
- Flattened effective keys into contiguous selectable records and made the selected row the only
  copper cue.
- Kept the vertical resolution cascade as the signature, with shadowed layers neutral and the real
  winner using the NS button-like hard offset.
- Converted override and layer state to squarish DM Mono labels and neutralized type-color accents.

## Self-verification

Playwright CLI captured main, alternate selected key, dark, and 390px mobile states in
`config-resolution-refix-shots/`. The screen has zero rendered template holes, console errors, or
horizontal overflow.
