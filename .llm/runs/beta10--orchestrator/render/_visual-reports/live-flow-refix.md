# Live Flow — component rethink

## Design question

What components let a developer follow one request across capability seams while preserving the
payload and owner at every handoff?

Live Flow is a causal seam map. A compact flow rail selects one execution; the center shows its
ordered request→trigger→saga→worker→stream journey; the right inspector exposes the selected seam’s
owner, entity, correlation, and actions.

## Anchor references

- `21-flow-builder.webp`: connected node sequence, branch semantics, and properties relationship.
- `20-ref.png`: expanded detail surface paired with a dense underlying record view.

## Component decisions

- Removed the redundant 2/5 semicircle gauge and kept the exact cleared/total count plus one true
  seam-progress strip.
- Rebuilt flow and journey items as contiguous records on a causal spine rather than colored cards.
- Preserved fan-out and severed-edge treatments because they encode real topology.
- Flattened hero, journey, inspector, and assist into Card surfaces with internal hairlines.
- Neutralized per-state rainbow badges; teal selection, live dots, progress, and seam values form the
  sole chromatic channel.

## Self-verification

Playwright CLI captured main, selected seam, dark, and 390px mobile states in
`live-flow-refix-shots/`. Zero rendered holes, console errors, and horizontal overflow were found.
