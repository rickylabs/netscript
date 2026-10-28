# Brutal — Figma map

Internal map for implementers. The public spec is `docs/design-system/themes/brutal/DESIGN.md`.

## File and modes

- Figma file `pGRLnkPPRZJZy74evNcQBr`. Values were read with `variable.resolveForConsumer` on
  2026-10-27 (read-only extraction).
- Theme mode `Brutal`, mode id `14:2`, set explicitly on both frames.
- Base modes on the frames resolve Neutral × Ink. The Brutal Theme mode aliases its own sand gray
  and amber accent, so neither base mode changes the output.
- No Density mode is set on the frames and no Density variable is bound; geometry is literal on the
  nodes (44px controls, 60px rows).
- Page title text binds `type/title`.

## Frames

| Frame | Node     | Name                     |
| ----- | -------- | ------------------------ |
| Light | `34:9`   | "Brutal — Orders"        |
| Dark  | `35:199` | "Brutal — Orders · Dark" |

There is no separate state-sheet frame.

## Component sets

Page "Language — Brutal" (`33:8`):

| Set      | Node    |
| -------- | ------- |
| Button   | `33:24` |
| Input    | `33:48` |
| Checkbox | `33:53` |
| Switch   | `33:58` |
| Sticker  | `33:69` |
| Tab      | `33:76` |

## Other nodes referenced by the spec

| Node                                | What it is                                |
| ----------------------------------- | ----------------------------------------- |
| `47:1368`                           | Textarea, a detached frame (no component) |
| `35:151`                            | `Notice` frame                            |
| `34:10`                             | `Top bar` frame                           |
| `79:2194`, `79:2197`, `79:2200`     | Button `State=Pressed` variants           |
| `33:23` (Rest), `79:2202` (Pressed) | `Brutal/Button` Kind=Ink label            |

- Pressed variant padding changes from 0/18/0/16 to 4/14/0/20.
- The Kind=Ink label and its "+" icon strokes bind `ink/fg`. Measured on the ink-button specimen:
  dark `#eeeeec` on `#000000` 18.08:1, light `#fdfdfc` 20.63:1. A `text/inverse` binding on this
  label measures 1.05:1 in dark. The Orders frames show no Ink label.

## Node-level exceptions

None reported. The Figma author reported an audit of 451 nodes per frame with 0 primitive bindings;
that count has not been independently verified.

## S1 role mapping

No node binds a primitive, so no node waits on a new S1 role. Role and mode names, including the
shared `block/*` names, stay provisional until S1 #2414.

## Exports and references

- Renders: `renders-r7/brutal--light.png`, `renders-r7/brutal--dark.png`,
  `renders-r7/brutal--ink-button-specimen.png` under `.llm/runs/design-system-s4--language-review/`.
- Reference pack: `inventory/reference-packs.md` §1 in the same run.
