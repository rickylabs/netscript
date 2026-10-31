# Pixel — Figma map

Internal map for implementers. The public spec is `docs/design-system/themes/pixel/DESIGN.md`; this
file keeps the Figma node ids and node-level notes that the public spec no longer carries.

## File and mode

- Figma file: `pGRLnkPPRZJZy74evNcQBr`.
- Theme mode: `Pixel` (mode `52:2`). The frames resolve Base gray `Neutral` / Base accent `Ink` by
  default; sand-family neutrals and the amber primary come from the `Pixel` mode's own ramps.
- YAML `colors` in `DESIGN.md` were resolved on frames `66:433` (Light) and `68:917` (Dark). Keys
  are the `--ns-*` suffix from each variable's code syntax.

## Frames

| What                                    | Node id                 |
| --------------------------------------- | ----------------------- |
| Orders screen, Light (refined in place) | `66:433`                |
| Orders screen, Dark (refined in place)  | `68:917`                |
| Components sheet, Light                 | `162:8708`              |
| Components sheet, Dark                  | `162:9408`              |
| Icon set (16px, 2px grid, 18 icons)     | `64:444`                |
| Baseline before the Ore UI physics      | `158:2075` / `158:3518` |
| Baseline components                     | `158:4961`              |

## Component sets

| Set      | Node id  |
| -------- | -------- |
| Button   | `65:459` |
| Field    | `65:533` |
| Checkbox | `65:550` |
| Switch   | `65:567` |
| Tag      | `65:593` |
| Tabs     | `65:602` |

## Node-level exceptions

| Exception             | Nodes and raw values                                                                                                 | Code syntax today | S1 role that replaces it (#2414) |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------- | -------------------------------- |
| Bands bind primitives | `color/band/1…5` = `#FFDBA2`, `#FFC673`, `#FFB245`, `#EDA12E`, `#D38E22`; 204 bindings in the Light frame (`66:433`) | `--ns-band-*`     | `pixel/band/1…5` (proposed name) |

- GUIDELINES gives `--ns-color-*` as the code syntax for primitives; the band primitives use
  `--ns-band-*`. The primitive binding is a recorded Figma-node exception and cannot ship in
  component CSS.
- Literal paints: none. The Light and Dark frames bind every solid paint (Dark: 960 of 960).
- Counts, node ids, modes and binding chains above were read from the Figma file. No node, variable,
  effect or type export accompanies them yet.
