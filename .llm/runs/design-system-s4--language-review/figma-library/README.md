# Figma component library handoff

The Figma file is the source of truth for component values (variables) and visual design. Code owns
names and structure. This folder holds the text and review images an implementer needs without Figma
access. It is a snapshot: Figma moves ahead of it.

## What is here

| File | Use it for |
| --- | --- |
| `component-spec.md` | The component list across all 11 categories: anatomy and parts, props, variants, states, sizes, keyboard map, tokens, and priority. Start here. |
| `ledger-<category>.json` | The as-built base sets: ids, variant axes and counts, binding audit, and deviations from the spec. When a ledger and the spec disagree, the ledger records what was built and why. |
| `variables-change.md` | Every variable added or changed in Figma, with aliasing and per-mode values, including the per-theme chart palettes. The tokens follow-up mirrors it in code. |
| `review/<category>/` | Utility light and dark review renders of each base category. |
| `review/screens/utility/` | The five archetype screens (dashboard, orders, settings, sign-in, command palette). |
| `review/chart-palettes/` | The chart palette sheet, plus the dataviz validator output. |
| `style-briefs/` | Per-style design briefs, plus the build protocols for style passes. |
| `ledger-style-*`, `ledger-feedback-*`, `ledger-late-*` | Per-style set ids and the defects fixed in each pass. |
| `state.json` | Build state: categories, styles, collections, and open design notes (`ownerNotes`). |
| `theme-character.md`, `plan.md` | Each theme's character, and the library build plan. |

## Base categories

Actions, Forms, Navigation, Overlays, Data display (two parts), Feedback, Layout & blocks, AI, Desktop,
Docs kit. Every set binds colours through the Scheme collection, theme values through Theme set, and
spacing through Density. Variants are the data-attribute axes of the component contract
(`packages/fresh-ui/src/contracts/`).

## Styles

Ten styles restyle every base set over the same contract (`<Style>/<Component>`): Tonal, Bloom,
Cupertino, Liquid, Fluent, Brutal, Filigrane, Terminal, Pixel and Tactile. Utility, the default, is
the base. A style may change anatomy (shape, borders, fills, decoration) but never a prop, part,
variant value or keyboard behaviour.
