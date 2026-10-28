# Tonal — Figma map

File `pGRLnkPPRZJZy74evNcQBr`, page "Language — Tonal" (`16:2`). Theme mode `Tonal` aliases gray →
Radix mauve and accent → Radix violet; the frames set no Base gray or Base accent modes.

## Frames

| Frame              | Node     |
| ------------------ | -------- |
| Light              | `23:277` |
| Dark               | `25:295` |
| State sheet, Light | `47:527` |
| State sheet, Dark  | `47:857` |

Front-matter values were resolved with `resolveForConsumer` on `23:277` and `25:295`.

## Component sets (page `16:2`)

| Component set            | Node     |
| ------------------------ | -------- |
| `Tonal/Button`           | `16:28`  |
| `Tonal/Text field`       | `16:86`  |
| `Tonal/Connected button` | `22:328` |
| `Tonal/Wavy progress`    | `22:333` |

## Node-level notes

- No primitive bindings, no unbound paints; all 133 text nodes bind their font.
- Container radii are literal values (32, 28, 24, 20, 8, 6, 4) and do not use the Theme
  `radius/card` (16). Role pending in #2414: an M3 shape scale. Buttons bind `radius/control` (999).
- `Tonal/Text field` State=Enabled, container `16:49`: the enabled active indicator binds `muted-fg`
  (#605e67 / #bab7c0), not `input-border`. The textarea uses the same role. Measured 4.8459:1 light
  on #e3dfe6 and 6.5985:1 dark on #323035.
- Bloom frames also set the `Tonal` Theme mode. They bind no core roles or Theme variables, so
  Tonal's values reach only a shared component rendered under `data-theme="bloom"`.

## Renders

`.llm/runs/design-system-s4--language-review/renders-r7/tonal--{light,dark}.png` (hashed in
`renders-r7/SHA256SUMS`); state sheets `renders-r4/states--tonal--{light,dark}.png`.
