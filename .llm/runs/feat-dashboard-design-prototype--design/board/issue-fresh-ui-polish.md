## Context

The beta.6 Dev Dashboard design prototype (#507, PR #506) synced the full `@netscript/fresh-ui` copy-source registry (44 units + 8 interactive primitives) onto a Claude Design canvas at 100% parity. Rendering every component side by side surfaced source-level visual quality gaps that were previously invisible because components were only ever eyeballed one at a time inside scaffolded apps:

- `skeleton` renders visibly broken/ugly (misaligned pill stacks) — confirmed identical in fresh-ui source, not a sync artifact.
- Several components lean on unstyled fallbacks or missing default values when given minimal props.
- `code-block` ships without syntax highlighting by design ("layered at L4 if desired") — no L4 layer exists yet.
- General refinement gap to a "pixel-perfect" bar: spacing rhythm, alignment, hover/focus states, dark-theme contrast, motion.
- Responsiveness / mobile-optimized behavior has never been audited registry-wide.

## Scope

A registry-wide UI quality pass over `packages/fresh-ui` (registry components, blocks, islands, layout objects, tokens where needed):

1. **Audit every registry unit** rendered in a real scaffolded project (the auto-scaffolded `/design` page), light + dark, desktop + mobile viewports.
2. **Fix to a pixel-perfect bar**: correct visual defects (skeleton first), tighten spacing/alignment/typography rhythm, ensure sensible defaults so components render well with minimal props, refine states (hover/focus/disabled/empty).
3. **Responsive/mobile optimization** as a first-class acceptance criterion for every unit, not a follow-up.
4. **Extend the registry** where the audit exposes missing pieces (e.g. an L4 syntax-highlight layer for `code-block`, and gaps surfaced by the dashboard promote-set in #507).
5. Iterate render → inspect → refine until the bar is met; evidence via `/design` page screenshots per unit.

## Constraints

- Theme-blind components: `--ns-*` tokens + `ns-*` classes only; no raw hex; light default, `[data-theme='dark']` override.
- Class contract stability: `ns-<block>`, `ns-<block>--<variant>`, `ns-<block>__<part>`; markup changes must round-trip with the design-sync canvas lane (`tools/design-sync/`).
- Registry archetype gates apply (doctrine); copy-source registry stays dependency-thin.

## Relationships

- Part of #400 (dev-dashboard epic); sibling of #507 (design prototype pre-step). The canvas prototype consumes these components via design-sync re-syncs, so quality improvements land in the prototype automatically at the next sync checkpoint.
