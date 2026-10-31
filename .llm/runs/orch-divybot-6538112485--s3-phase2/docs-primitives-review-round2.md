PASS (slice 7c2a follow-up, not the final IMPL-EVAL)

Both refinements are correct and add no blockers.

- **New icon names in the Icon contract:**
  - The Z1 Icon `name` enum (`catalog/foundations/1.ts:16-17`) now lists `arrow-left` and `arrow-right`, matching the published `ICON_PATHS` entries (`primitives.tsx:53-54`). The Lucide/Feather notice is in the file header.
  - `tests/registry/docs-primitives.test.tsx:12` checks that the contract's icon names exactly equal `Object.keys(ICON_PATHS)`, so a future glyph can't be added without updating the contract.
  - Two real Icon fixtures render the new glyphs (`utility-docs-primitives.tsx:8`).
  - You report `contracts.json` was refreshed to match; that file is checked against the typed catalog by the existing JSON-equality test.
- **Card header grid:**
  - The two-column header grid now applies only when an action is present (`card.css:41`: `.ns-card > .ns-card__header:has(> .ns-card__action)`). Headers without `Card.Action` keep their previous layout and whatever children they had.
  - The remaining `grid-column` rule for title and description (line 52) has no effect outside that grid, so it's harmless.
  - The browser case that checks both computed layouts covers the regression.

The rest of the slice is unchanged from the earlier PASS, so those conclusions still hold.
