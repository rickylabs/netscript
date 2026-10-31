# Terminal — Figma map

Internal map for implementers. The public spec is `docs/design-system/themes/terminal/DESIGN.md`.

## File and modes

- Figma file `pGRLnkPPRZJZy74evNcQBr`. Values were read with `variable.resolveForConsumer` on
  2026-10-27 (read-only extraction).
- Theme mode `Signal`, mode id `2:7`. Terminal shares this mode, its name and its lime primary with
  Studio's Signal flavor. Don't add Theme-mode values to `Signal` for Terminal only.
- Density `Compact` is set explicitly on both frames (control 32, row 44); no Density variable is
  bound. The 24px line box governs.
- Base modes on the frames resolve Neutral × Ink; the Signal Theme mode supplies gray and lime
  directly.
- The Signal mode sets `font/sans` to Geist; no Terminal node uses it.
- Signal mode radii `radius/control` 6, `radius/input` 6 and `radius/badge` 4 are not used by
  Terminal nodes.

## Frames

| Frame | Node     | Name                                    |
| ----- | -------- | --------------------------------------- |
| Light | `41:297` | "Terminal — Orders · Light" (1280×1052) |
| Dark  | `41:2`   | "Terminal — Orders" (1280×1052)         |

There is no state-sheet frame.

## Component sets

Page "Language — Terminal" (`39:2`):

| Set          | Node    |
| ------------ | ------- |
| Key          | `39:15` |
| Prompt field | `39:37` |
| Status       | `39:48` |
| Check        | `39:57` |
| Tab          | `39:64` |

Main components:

- `Terminal/Key` Primary (`39:3`) reads `[ save ctrl+s ]`.
- `Terminal/Tab` Selected (`39:61`) is the non-inverted tab: a `surface/hover` fill (`#f0f0f0` /
  `#222222`), a 2px inside bottom stroke in `border/ring` (lime) and `text/fg` text.

Remaining drift (reported by the Figma author): the frame keys override line-height to 24 (unbound),
while the `Terminal/Key` main binds `type/body/line` (20). The main is 28 tall; the instances are 32
and 34 tall.

## Node-level exceptions

| Node                   | Layer             | Bound primitive   | Raw value | Dark-scheme role it equals | Replacement                      |
| ---------------------- | ----------------- | ----------------- | --------- | -------------------------- | -------------------------------- |
| `41:231` dark Save key | fill              | `color/gray/d/3`  | `#222222` | `surface/muted`            | S1 scheme-aware key role (#2414) |
| `41:231` dark Save key | stroke            | `color/gray/d/10` | `#7b7b7b` | `border/input`             | S1 scheme-aware key role (#2414) |
| `41:231` dark Save key | three text layers | `color/lime/d/11` | `#bde56c` | `primary/text`             | S1 scheme-aware key role (#2414) |

Reason: the dark Save key needs a dark-only treatment while light Save stays a lime fill, and no
scheme-aware role exists yet. The public YAML uses the equivalent roles. S1 adds a scheme-aware key
role (name owned by code) and the node is rebound to it. These bindings are reported by the Figma
author.

## Pixel sample rows

- Dark Save key on the dark render: fill `#222222`, edge rows y948 and y981 `#7b7b7b`, label
  `#bde56c`. Edge on fill samples at 3.7588:1.

## Exports and references

- Renders: `renders-r7/terminal--light.png`, `renders-r7/terminal--dark.png` under
  `.llm/runs/design-system-s4--language-review/`.
- Reference pack: `inventory/reference-packs.md` §4 in the same run.
