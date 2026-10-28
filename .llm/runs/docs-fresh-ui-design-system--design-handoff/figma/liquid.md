# Liquid — Figma map

Internal map for implementers. The public specification is
`docs/design-system/themes/liquid/DESIGN.md`; this file keeps the node-level facts it no longer
carries.

## File and modes

- Figma file `pGRLnkPPRZJZy74evNcQBr`.
- Theme mode `Glass`, shared with Cupertino because of the 10-mode Theme ceiling. Liquid's own
  values live in `liquid/*` and in literals.
- Base gray × accent: Radix slate × blue through the `Glass` mode (the frames resolve Base gray
  `Neutral` / Base accent `Ink` by default).
- Density: `Comfortable`, set explicitly on both windows.

## Frames

| Frame                                           | Node                  |
| ----------------------------------------------- | --------------------- |
| Page                                            | `93:735`              |
| Light window                                    | `93:736`              |
| Dark window                                     | `97:786`              |
| Light desktop                                   | `133:1088`            |
| Dark desktop                                    | `133:1150`            |
| Superseded kit-literal pair (not the reference) | `123:1046`, `126:691` |

No state sheet exists.

## Apple macOS 27 kit instances

- Page "Apple reference — macOS 27": `120:1831`.
- Unified window: `120:4713`.
- Sidebar: `120:5188`. This instance has no blur effect. The run records the kit sidebar blur as 80;
  that value is unverified.

## Role bindings

- `liquid/*`: 54 roles (`--ns-liquid-*`).
- Bound in the windows: `primary/default`, `primary/text`,
  `material/glass-{sidebar,control,sheet,float}`, `toolbar/{scroll-edge,hairline}`,
  `sidebar/selection`, `effect/{outline,side}`, `window/{close,minimize,zoom}`, `accent/system`,
  `border/ring`, `border/input`, `tag/{green,orange,purple,red,gray}`, `switch/on-track`,
  `success/text` (light only), `status/shipped-fg` (both schemes).
- Solid paints: 51 of 267 per window are unbound literals.
- `liquid/status/shipped-fg` is variable `199:340` (`var(--ns-liquid-status-shipped-fg)`), `#005fbe`
  light / `#409cff` dark.

## Node bindings

| Element                           | Light nodes                                                          | Dark nodes                                                           | Binding                                                                                               |
| --------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Avatar initials (black `#000000`) | `95:822`, `95:836`, `95:850`, `95:864`, `95:878`, `95:892`, `93:804` | `97:849`, `97:863`, `97:877`, `97:891`, `97:905`, `97:919`, `97:972` | Literal `#000000` on role-bound `liquid-tag-*` discs                                                  |
| Off switch                        | `96:836`                                                             | `97:1071`                                                            | 1px inside `liquid-border-input` edge (`#86868b` / `#8e8e93`)                                         |
| Focus field                       | `96:812`                                                             | `97:1050`                                                            | 1px inside stroke plus 2px solid ring (spread-2 shadow), `liquid-border-ring` (`#007aff` / `#0a84ff`) |
| Green deltas                      | `95:772` (KPI), `93:742` (hero pill)                                 | Core `success-text`                                                  | `liquid-success-text` `#1e7b34` light; pill tint `liquid-tag-green` at 12%                            |
| "Shipped" pill label / dot        | `96:795` / `96:794`                                                  | `97:1034` / `97:1033`                                                | `liquid-status-shipped-fg`; tint and geometry unchanged                                               |
| Inspector sheet grabber           | `96:781` (hidden)                                                    | n/a                                                                  | Hidden; the sheet has no grabber                                                                      |

- The tracking row's 0.5px hairline does not count in layout, so the field sits on y 358.
- System hues: `#0a84ff`, `#30d158`, `#ff9f0a`, `#bf5af2`, `#ff453a` and `#8e8e93` bind
  `liquid-accent-system`, `liquid-tag-*` or `liquid-border-ring` (caret, focus): 38 paints per
  window. The light frame renders the light hues `#007aff` / `#34c759` / `#ff9500` / `#af52de` /
  `#ff3b30`. The dark on switch binds `liquid-switch-on-track` (`#30d158`).

## Node-level exceptions (still literal)

| Literal                                                             | Paints per window | S1 role                            |
| ------------------------------------------------------------------- | ----------------- | ---------------------------------- |
| Pink `#ff2d55` / `#ff375f` (avatar)                                 | 5                 | New pink tag role (none exists)    |
| Avatar initials `#000000`                                           | 7                 | Needs a role                       |
| White labels and knobs                                              | 12                | `liquid-primary-fg`                |
| Hairlines, black 6–18% / white 10–28%                               | 24                | Need roles                         |
| On-accent rims (white 30–35%)                                       | —                 | Need roles                         |
| Selected-avatar ring (white 90%)                                    | —                 | Needs a role                       |
| Green deltas: light `liquid-success-text`, dark core `success-text` | —                 | S1 picks one role for both schemes |

- Type and radii are literal, because the `Glass` Theme scale belongs to Cupertino.

## Effects

- Float and thumb glass: `GLASS` refraction 0.55, depth 22, dispersion 0.25, light 0.90 at −50°.
- Toolbar controls: 0.35 / 12 / 0.15 / 0.85.

## Renders

Under `.llm/runs/design-system-s4--language-review/`:

- `renders-r7/liquid--{light,dark}.png`, hashed in `renders-r7/SHA256SUMS` (sha256 `092b1cd4…`;
  review input commit `affd6b158`).
- Superseded kit-literal pair: `renders-r7/liquid-kit-literal-rejected--{light,dark}.png`.
- The corrected light export with the "Shipped" pill role overwrites `renders-r6/liquid--light.png`
  (outside the r7 set). The dark render is byte-identical.
