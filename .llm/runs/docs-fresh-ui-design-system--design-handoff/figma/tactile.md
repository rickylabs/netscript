# Tactile — Figma map

Internal map for implementers. The public spec is `docs/design-system/themes/tactile/DESIGN.md`;
this file keeps the Figma node ids and node-level notes that the public spec no longer carries.

## File, page and mode

- Figma file: `pGRLnkPPRZJZy74evNcQBr`, read-only extraction on 2026-10-27.
- Page: "Language — Tactile" (`60:219`).
- Theme mode: `Tactile` (mode id `52:1`), set on all three current frames with 0 Theme bindings.
- YAML `colors` in `DESIGN.md` were resolved with `variable.resolveForConsumer` on frames `144:1744`
  (Light) and `145:1115` (Dark). Keys are the `--ns-*` suffix.

## Current frames

| What                         | Node id                 | Size      |
| ---------------------------- | ----------------------- | --------- |
| Orders · Light               | `144:1744`              | 1280×2391 |
| Orders · Dark                | `145:1115`              | 1280×2391 |
| Components sheet             | `146:856`               | 2560×2001 |
| Components sheet, light half | `146:857`               |           |
| Components sheet, dark half  | `147:891`               |           |
| KPI plateau, Light / Dark    | `144:9333` / `145:1227` | 916×241   |

- KPI plateau: 27px side padding (the plateau's 1px stroke counts in layout, so 28px padding left
  the readouts at 196.5 wide). The four columns are 197 wide at x 344 / 565 / 786 / 1007.

## Effect audit per frame

| Frame                     | Plateau | Key | Well | Pressed | LED | Rims (control + danger) | In-hue borders | Ad-hoc effects |
| ------------------------- | ------- | --- | ---- | ------- | --- | ----------------------- | -------------- | -------------- |
| Orders · Light `144:1744` | 5       | 23  | 19   | 4       | 18  | 8 + 1                   | 27             | 0              |
| Orders · Dark `145:1115`  | 5       | 23  | 19   | 4       | 18  | 8 + 1                   | 27             | 0              |
| Components `146:856`      | 2       | 38  | 42   | 14      | 20  | 32 + 2                  | 38             | 0              |

- Node counts: 580 nodes per Orders frame, 877 on the components sheet.
- Primitive bindings: 0. Core-role bindings: 0. Tactile nodes read only `tactile/*`.
- Accessibility pixels were sampled from 1x exports of `144:1744` and `145:1115`.
- Counts, node ids, modes and binding chains above were read from the Figma file. No node, variable,
  effect or type export accompanies them yet.

## Node-level exceptions

None in the current frames.

## Theme mode `Tactile`: raw values and the roles that replace them

The mode's core roles resolve to the build, but several are raw values in the mode because no
primitive exists for them (the ground, the solid accent, the ring, accent step 11 and gray step 10).
The neutral ramp is slate and the accent ramp blue. S1 (#2414) owns the aliasing; each raw value
duplicates a `tactile/*` role today.

| Core role (Theme = Tactile) | Raw value, light / dark | Duplicates `tactile/*` role     |
| --------------------------- | ----------------------- | ------------------------------- |
| `bg`, `card`, `raised`      | `#e0e5ec` / `#2a2d32`   | `tactile/surface/base`          |
| `primary`                   | `#1a6fe8`               | `tactile/surface/accent-start`  |
| `primary` hover             | `#1560cf`               | `tactile/surface/accent-end`    |
| `primary-fg`                | `#ffffff`               | `tactile/text/on-accent`        |
| `ring`                      | `#1e7bff` / `#3b8bff`   | `tactile/accent`                |
| `primary-text`              | `#1550b5` / `#79b0ff`   | `tactile/text/accent`           |
| `input-border`              | `#6a759e` / `#7a8498`   | `tactile/edge/control`          |
| `fg`                        | `#1c2024` / `#edeef0`   | none (no Tactile node reads it) |

- Fonts in the mode: Nunito Sans (`font/*`), Geist Mono (`font/mono`). Radii: control 999, input 14,
  card 24.
- Not yet aligned in the mode: `type/*` sizes and the shadow recipe still carry the superseded
  build's values. Text nodes are not bound to `type/*`; the node fonts are the source of truth.

## Users of the Theme mode

- The three current frames, which reach no Theme variable and so render unchanged.
- The superseded nodes on the Tactile page.
- Frame `63:559` "Tactile — Orders · Dark" on **Page 1** (superseded).

## Superseded nodes (do not use; nothing was removed)

| Kind          | Node ids                                                                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Components    | `60:251` Button, `60:282` Field, `60:289` Segment, `60:294` Switch, `60:299` Checkbox, `60:315` Status, `60:341` Product tile, `60:342` Stepper |
| Frames        | `61:224` on the Tactile page, `63:559` on Page 1                                                                                                |
| Effect styles | `Tactile/surface`, `Tactile/control`, `Tactile/solid`, `Tactile/pressed`, `Tactile/well`, `Tactile/thumb` (used only by those nodes)            |
| Unused style  | `Tactile/pressed-xs` (defined for keys ≤ 30px; the steppers are 44px)                                                                           |
