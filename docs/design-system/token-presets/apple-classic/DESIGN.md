# Apple Classic

This faithful token preset follows the approved Figma export in NetScript #2493
at `dd442e82794c4b960e51529f1c7ac534afda75ea`. Figma owns its values; code owns
registered names and alias resolution. This document describes the token contract,
not a new component design specification.

## Preset contract

- Preset id and root language: `apple-classic`.
- Theme set: `B` → Theme B, active mode `Apple Classic`.
- Scheme: Light or Dark, using the target collection's active mode at every alias hop.
- Base gray: Slate; Base accent: Blue; Studio flavor: Utility. These apply only
  when an alias reaches that collection; they never overwrite the theme's own ramps.
- Source density: Comfortable; public `data-density`: `comfortable`. Density is fixed by
  this preset and is not a separate visual toggle.

The generated theme item installs its CSS, font metadata and preset configuration.
Chart roles `chart-1` through `chart-5` follow the per-theme palette in each scheme.
Code syntax uses `code-syntax-*` on `code-bg`. Do not replace either with status
colours or colors borrowed from another language.

## Values and validation

Read `packages/fresh-ui/tokens/README.md` and the nine-collection snapshot under
`packages/fresh-ui/tokens/figma/` to extend this preset. Theme set owns shared WEB
names; Scheme selects its Light/Dark roles. Never patch source values in CSS.

Contrast value burn-down remains open in #2450. The S1b run's `failing-pairs.json`
records each failing use; passing token gates include exact source exclusions and
do not mean the Figma contrast corrections are finished. The mixed emphasis style
name must be interpreted using source-style metadata until its vocabulary migration.
