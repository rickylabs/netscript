# Sagas — component rethink

## Design question

What components best explain durable forward execution and compensating rollback at the same time?

Sagas is a state-machine canvas with two spatial lanes and a docked node inspector. Position, edge
direction, and dashed rollback wiring carry the semantics; selection connects a state node to its
payload, transitions, evidence, and actions.

## Anchor references

- `21-flow-builder.webp`: measured node graph, branch labels, and docked properties panel.
- `11-devconsole-a.png`: dense inspector hierarchy and exact record metadata.

## Component decisions

- Kept the measured canvas, minimap, and forward/rollback lanes as the screen’s unique
  visualization.
- Flattened the health summary into one fact rail and retained only the true instance-state
  distribution.
- Rebuilt nodes as flat Card surfaces; lane position and dashed compensation edges replace colored
  node borders and icon tiles.
- Removed the redundant semicircle state gauge, floating unicode toolbar, and rainbow legend.
- Made selected/rollback state the sole copper emphasis; the properties panel uses internal
  hairlines and underline tabs.

## Self-verification

Playwright CLI captured main, selected `reserving` node, dark, and 390px mobile states in
`sagas-refix-shots/`. Zero rendered holes, console errors, or horizontal overflow were found.

## Honest gap

The existing canvas fixture logs six non-error warnings for unresolved optional edge-label
placeholders. The measured graph still renders and connects correctly; fixing the fixture is outside
the target markup/CSS scope.
