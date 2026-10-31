# Cupertino — Figma map

Internal map for implementers. The public specification is
`docs/design-system/themes/cupertino/DESIGN.md`; this file keeps the node-level facts it no longer
carries.

## File and modes

- Figma file `pGRLnkPPRZJZy74evNcQBr`.
- Theme mode `Glass` (mode id `14:1`). Set explicitly on all four Cupertino frames and also on both
  Liquid windows (`93:736`, `97:786`); the 10-mode Theme ceiling forces the share.
- The frames resolve Base gray `Neutral` × Base accent `Ink` by default, but the `Glass` mode's own
  `gray/*` and `accent/*` alias Radix slate × blue directly (`surface/bg` → `surface/l/canvas` →
  `slate/l/3`).
- Density: Comfortable by default; no Density variable is bound (sizes equal its values).

## Frames

| Frame                                       | Node                   |
| ------------------------------------------- | ---------------------- |
| Light                                       | `30:22`                |
| Dark                                        | `32:169`               |
| Reduce Transparency                         | `81:1388`              |
| Increase Contrast                           | `81:1850`              |
| Superseded spec rebuild (not the reference) | `113:1183`, `117:5699` |

No state sheet exists.

## Library components

| Component                | Node    |
| ------------------------ | ------- |
| `Glass/Button`           | `29:22` |
| `Glass/Segment`          | `29:27` |
| `Glass/Search field`     | `29:33` |
| `Glass/Toggle`           | `29:38` |
| `Glass/Selection circle` | `29:43` |
| `Glass/Sidebar item`     | `29:58` |
| `Glass/Status`           | `29:74` |
| `Glass/Grouped row`      | `29:99` |

## Role bindings

- `cupertino/*`: 27 Scheme roles (`--ns-cupertino-*`). Bound 0 times in the current frames: 304 of
  304 paints bind core roles. All 324 paints of the superseded spec frames bind `cupertino/*`.
- No primitive is bound on any node.

## Node-level exceptions

### Literal corner radii

Both frames have 0 bound radii. Every radius is a literal.

| Radius | Count per frame | Light nodes                                                              | Dark nodes                                       | S1 role                                                               |
| ------ | --------------- | ------------------------------------------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------------- |
| 24     | 5               | KPI widgets `30:163`, `30:178`, `30:192`, `30:205`; Orders list `30:218` | `32:230`, `32:241`, `32:252`, `32:263`, `32:274` | New 24 container tier, or snap to `radius/card` 22 (changes the look) |
| 26     | 2               | Sidebar `30:27`; Order form `31:126`                                     | Sidebar `32:174`; Order form `32:418`            | New 26 container tier, or snap to `radius/card` 22 (changes the look) |
| 22     | 2               | Notice, activity                                                         | Same                                             | `radius/card`                                                         |
| 12     | 9               | Grouped groups, table rows                                               | Same                                             | None named yet                                                        |
| 10     | 2               | Search fields                                                            | Same                                             | `radius/input`                                                        |
| 9      | 6               | Sidebar items, segmented track                                           | Same                                             | None named yet                                                        |
| 7      | 10              | Segment thumb, icon tiles                                                | Same                                             | None named yet                                                        |
| 999    | 26              | Capsules, switches, selection circles, avatars                           | Same                                             | `radius/control`                                                      |

### Switch knob

- Rendered values: `#ffffff` in light, `#111113` in dark. These equal `primary-fg` today.
- The knob's variable binding is not exported.
- S1 role: `switch-thumb` (`#ffffff` / `#111113`). Do not bind the knob to `primary-fg`. A white
  knob in both schemes would be a design change and needs a re-render.

### Reduce Transparency capsules

- Use `surface-raised` (82% alpha), not an opaque role.

### Effects

- Sidebar `GLASS`: radius 18, refraction 0.50, depth 16, dispersion 0.20.
- Capsules `GLASS`: radius 10 (prominent 4), refraction 0.55, depth 14, dispersion 0.25.
- The prominent capsule is opaque `primary` with a `GLASS` effect in Figma.
- The web theme proposes blur plus tint only; it keeps the radius as the blur value (sidebar 18px,
  capsules 10px). Comparison against these frames is pending in #2419.

### Type

- Text styles are bound on the frames through Theme mode `Glass`. Button and segment styles are
  literal, not yet tokens.
- The Plugin API cannot set `tnum`, so `data` has no tabular figures in Figma. S1 (#2414) owns it.

## Renders

Under `.llm/runs/design-system-s4--language-review/`:

- `renders-r7/cupertino--{light,dark}.png` (byte-identical to the r5 and r6 exports), hashed in
  `renders-r7/SHA256SUMS` (sha256 `092b1cd4…`; review input commit `affd6b158`).
- Superseded spec rebuild: `renders-r7/cupertino-spec-rejected--{light,dark}.png`.
- Preference variants: `renders-r5/cupertino--light--{reduce-transparency,increase-contrast}.png`
  (not in the r7 set).
