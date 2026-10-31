# Bloom — Figma map

File `pGRLnkPPRZJZy74evNcQBr`, page "Language — Bloom" (`102:808`). Bloom frames borrow the `Tonal`
Theme mode because the Theme collection is at its 10-mode limit. Under it, core roles resolve to
Tonal's mauve × violet; Bloom components read only `bloom/*` roles.

## Frames

| Frame                        | Node       |
| ---------------------------- | ---------- |
| v2 Light (current)           | `108:894`  |
| v2 Dark (current)            | `110:1006` |
| v1 (superseded)              | `102:809`  |
| Notch: Refund rate (248×128) | `108:965`  |
| Notch: Amount (172×112)      | `110:843`  |

No state sheet exists. Front-matter values were resolved with `resolveForConsumer` on `108:894` and
`110:1006`. The unused roles `bloom/primary` (#5b2a86 / #d2b6ff), `primary-container`, `lime`,
`lime-strong`, `tangerine`, `hero-accent` and their `on-*` pairs come from v1 `102:809`.

## Node-level notes (each replaced by an S1 #2414 role)

| Nodes                                 | Raw binding today                                                                   | Replacing role                                                                             |
| ------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| All 95 text nodes                     | Funnel fonts set directly; 0 bound (Theme `font/*` would resolve Roboto Flex)       | `font/sans` = Funnel Sans; `font/heading`, `font/kpi` = Funnel Display; a Bloom type scale |
| Every radius and size                 | Literal values                                                                      | A Bloom shape scale (28 for capsules, 22 / 24 for cards)                                   |
| Field capsules `110:883` / `110:1229` | Stroke `bloom-field-edge` (#8a8377); wrappers `110:882` / `110:1228` have no stroke | `input-border` → `bloom-field-edge`                                                        |

- No primitive bindings and no unbound paints.
- The frames bind 22 `bloom/*` roles and 0 core roles or Theme variables.
- Fonts in use: Funnel Sans Regular ×61, Funnel Sans Medium ×11, Funnel Display Regular ×23.
- Sizes in use: 12, 13, 14, 15, 16, 17, 18, 22, 24, 28, 30, 32, 40, 48, 60, 92.
- Radii in use: 2, 14, 15, 18, 20, 21, 22, 24, 26, 28, 30, 32, 40.
- The bell disc and the refund-rate notch pen disc stroke `bloom-control-outline`.
- The capsule boundary measures 3.7543:1 on white (light).

## Renders

`.llm/runs/design-system-s4--language-review/renders-r7/bloom--{light,dark}.png` (hashed in
`renders-r7/SHA256SUMS`).
