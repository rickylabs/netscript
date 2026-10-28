# Filigrane — Figma map

Internal map for implementers. The public spec is `docs/design-system/themes/filigrane/DESIGN.md`.

## File and modes

- Figma file `pGRLnkPPRZJZy74evNcQBr`. Values were read with `variable.resolveForConsumer` on
  2026-10-27 (read-only extraction).
- Theme mode `Filigrane`, mode id `2:6` (reported by the Figma author). The mode was previously
  named `Atelier`; the theme was previously named "Editorial".
- Base modes on the frames resolve Neutral × Ink. The Filigrane Theme mode aliases sand gray and a
  tomato accent directly.
- No Density mode is set and no Density variable is bound.
- Leftover Theme radii on the mode (reported by the Figma author): `radius/control` 999,
  `radius/input` 10, `radius/card` 16. No Filigrane node binds them. Studio's Atelier flavor carries
  its own radii (0/0/0/0) on Theme mode `Studio`.
- `type/display/style` still says ExtraLight but is not bound on the frame; the display node is set
  to Light directly.
- No binding export shows a shared Theme-mode binding between Filigrane and Studio's Atelier flavor.

## Frames

| Frame | Node     |
| ----- | -------- |
| Light | `38:9`   |
| Dark  | `38:309` |

Page "Language — Filigrane" (`37:6`). There is no state-sheet frame.

## Component sets

| Set      | Node    |
| -------- | ------- |
| Button   | `37:22` |
| Field    | `37:44` |
| Status   | `37:60` |
| Tab      | `37:67` |
| Checkbox | `37:72` |

## Other nodes referenced by the spec

| Node                                                                      | What it is                                                               |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `89:887`                                                                  | `App header` frame                                                       |
| `89:906`                                                                  | Header `Search` frame: 220×28, one opaque 1px `input-border` bottom fill |
| `38:285`                                                                  | Attention notice, layer named `Pull quote`                               |
| `38:294`                                                                  | Activity list, layer named `The wire`                                    |
| `37:69`                                                                   | `Filigrane/Checkbox` Checked=True                                        |
| `38:215`, `38:235`, `38:263` (light); `38:479`, `38:486`, `38:494` (dark) | Section rules "01 / 02 / 03"                                             |
| `89:905`, `38:200`                                                        | Invisible spacers                                                        |

- **Section rules.** Each rule is a 2px rect whose `border-strong` paint is a 1px INSIDE bottom
  stroke, so it renders as a single row: measured `#bcbbb5` (1.83:1) light and `#62605b` (3.01:1)
  dark, at y 996 / 1115 / 1354 on the renders. A 1px rect centred in an 18px row sits on y + 0.5 and
  splits into two half-intensity rows.
- **Checked checkbox** `37:69` binds `action/primary-bg` (fill), `action/primary-border` (stroke)
  and `action/primary-fg` (check). Dark: a transparent box with a `#7c7b74` edge (4.45:1 on
  `#111110`) and an `#eeeeec` check (16.26:1).
- **Header search** `89:906`: the dark underline renders `#080808` if the paint is stale and the
  fill sits on a 0.5px offset.

## Pixel sample rows

- Field underline: row y77, `#82827c` light (3.67:1), `#7c7b74` dark (4.45:1).
- Dark focus ring: rows y1161–1162, `#7c7b74` (4.45:1). The dark focus ring and search edge sample
  at 4.4466:1.

## Node-level exceptions

None reported. The Figma author reported 288 nodes per frame with 0 primitive bindings; that count
has not been independently verified.

Reported layout caveats, not yet fixed: half-pixel positions on table-row cells (checkboxes and
status chips at y + 0.5), stat tiles 210.5 / 209.5 wide, and the invisible spacers `89:905` and
`38:200`. Snap them when the table is next edited.

## S1 role mapping

No node binds a primitive, so no node waits on a new S1 role. Names, including the Filigrane Theme
mode, stay provisional until S1 #2414.

## Exports and references

- Renders: `renders-r7/filigrane--light.png`, `renders-r7/filigrane--dark.png` under
  `.llm/runs/design-system-s4--language-review/`.
- Reference pack: `inventory/reference-packs.md` §2 in the same run.
