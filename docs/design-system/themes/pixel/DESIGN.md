---
version: alpha
name: Pixel
description: 'A NetScript-amber pixel language with Ore UI physics: banded amber stripes, stepped 2px-grid corners, Pixelify Sans numbers and Space Mono labels, and keys that sit on a 4px lip and press flat.'
colors:
  # Resolved from Figma file pGRLnkPPRZJZy74evNcQBr on frames 66:433 (Light) and 68:917 (Dark),
  # Theme mode "Pixel". Keys are the --ns-* suffix from each variable's code syntax.
  bg: '#f4efe6'
  bg-dark: '#12100e'
  card: '#fcfaf6'
  card-dark: '#1b1916'
  surface-raised: '#fcfaf6'
  surface-raised-dark: '#282623'
  muted: '#f1f0ef'
  muted-dark: '#222221'
  container: '#e8e0d3'
  container-dark: '#222221'
  selected: '#ffeacb'
  selected-dark: '#31200b'
  fg: '#21201c'
  fg-dark: '#eeeeec'
  muted-fg: '#63635e'
  muted-fg-dark: '#b5b3ad'
  border: '#dad9d6'
  border-dark: '#3b3a37'
  input-border: '#82827c'
  input-border-dark: '#7c7b74'
  control-ink: '#21201c'
  control-ink-dark: '#7c7b74'
  frame-ink: '#21201c'
  frame-ink-dark: '#494844'
  ring: '#12100e'
  ring-dark: '#ffc474'
  primary: '#faab35'
  primary-dark: '#faab35'
  primary-hover: '#e79c27'
  primary-hover-dark: '#ffba59'
  primary-fg: '#12100e'
  primary-fg-dark: '#12100e'
  primary-subtle: '#ffeacb'
  primary-subtle-dark: '#31200b'
  primary-text: '#9c681a'
  primary-text-dark: '#ffc474'
  success-text: '#2a7e3b'
  success-text-dark: '#71d083'
  success-subtle: '#e9f6e9'
  success-subtle-dark: '#1b2a1e'
  warning-text: '#4f3422'
  warning-text-dark: '#ffca16'
  warning-subtle: '#fff7c2'
  warning-subtle-dark: '#302008'
  info-text: '#113264'
  info-text-dark: '#70b8ff'
  info-subtle: '#e6f4fe'
  info-subtle-dark: '#0d2847'
  destructive-text: '#641723'
  destructive-text-dark: '#ff9592'
  destructive-subtle: '#feebec'
  destructive-subtle-dark: '#3b1219'
  destructive-fg: '#ffffff'
  destructive-fg-dark: '#ffffff'
  band-1: '#ffdba2'
  band-2: '#ffc673'
  band-3: '#ffb245'
  band-4: '#eda12e'
  band-5: '#d38e22'
  pixel-lip-primary: '#d38e22'
  pixel-lip-primary-dark: '#d38e22'
  pixel-highlight-primary: '#ffdba2'
  pixel-highlight-primary-dark: '#ffc673'
  pixel-lip-secondary: '#e8e0d3'
  pixel-lip-secondary-dark: '#12100e'
  pixel-face-secondary-hover: '#f4efe6'
  pixel-face-secondary-hover-dark: '#322f2b'
  pixel-destructive-face: '#ce2c31'
  pixel-destructive-face-dark: '#ce2c31'
  pixel-lip-destructive: '#a8222a'
  pixel-lip-destructive-dark: '#a8222a'
  pixel-focus-gap: '#21201c'
  pixel-focus-gap-dark: '#12100e'
  pixel-recess-shade: '#8a75502e'
  pixel-recess-shade-dark: '#00000073'
  pixel-tag-lip-success: '#94ce9a'
  pixel-tag-lip-success-dark: '#12100e'
  pixel-tag-lip-warning: '#e9c162'
  pixel-tag-lip-warning-dark: '#12100e'
  pixel-tag-lip-info: '#8ec8f6'
  pixel-tag-lip-info-dark: '#12100e'
  pixel-tag-lip-neutral: '#cfceca'
  pixel-tag-lip-neutral-dark: '#12100e'
  pixel-tag-lip-danger: '#f4a9aa'
  pixel-tag-lip-danger-dark: '#12100e'
typography:
  display: { fontFamily: Pixelify Sans, fontSize: 40px, fontWeight: 600, lineHeight: 48px }
  kpi: { fontFamily: Pixelify Sans, fontSize: 40px, fontWeight: 500, lineHeight: 48px }
  heading: { fontFamily: Pixelify Sans, fontSize: 24px, fontWeight: 600, lineHeight: 32px }
  body: { fontFamily: Inter, fontSize: 14px, fontWeight: 400, lineHeight: 20px }
  strong: { fontFamily: Inter, fontSize: 14px, fontWeight: 700, lineHeight: 20px }
  label: {
    fontFamily: Space Mono,
    fontSize: 12px,
    fontWeight: 400,
    lineHeight: 16px,
    letterSpacing: 0.6px,
  }
  label-strong: {
    fontFamily: Space Mono,
    fontSize: 12px,
    fontWeight: 700,
    lineHeight: 16px,
    letterSpacing: 0.6px,
  }
  caption: { fontFamily: Inter, fontSize: 12px, fontWeight: 400, lineHeight: 16px }
  data: {
    fontFamily: JetBrains Mono,
    fontSize: 13px,
    fontWeight: 400,
    lineHeight: 18px,
    fontFeature: '"tnum" 1',
  }
rounded:
  none: 0px
  step: 2px
  notch: 4px
spacing:
  unit: 2px
  lip: 4px
  topbar: 64px
  band-stripe: 10px
  page-x: 40px
  section: 32px
  card-padding: 20px
  form-padding: 24px
  control: 40px
  tab: 32px
  row: 56px
components:
  button-primary: {
    backgroundColor: '{colors.primary}',
    textColor: '{colors.primary-fg}',
    typography: '{typography.label-strong}',
    rounded: '{rounded.notch}',
    height: 40px,
    padding: 0 18px 4px 16px,
  }
  button-primary-lip: { backgroundColor: '{colors.pixel-lip-primary}', height: 4px }
  button-hero-highlight: { backgroundColor: '{colors.pixel-highlight-primary}', height: 2px }
  button-outline: {
    backgroundColor: '{colors.surface-raised}',
    textColor: '{colors.fg}',
    typography: '{typography.label-strong}',
    rounded: '{rounded.step}',
    height: 40px,
  }
  button-outline-dark: {
    backgroundColor: '{colors.surface-raised-dark}',
    textColor: '{colors.fg-dark}',
  }
  button-destructive: {
    backgroundColor: '{colors.pixel-destructive-face}',
    textColor: '{colors.destructive-fg}',
    typography: '{typography.label-strong}',
    rounded: '{rounded.notch}',
    height: 40px,
  }
  tab-selected: {
    backgroundColor: '{colors.primary}',
    textColor: '{colors.primary-fg}',
    typography: '{typography.label-strong}',
    rounded: '{rounded.step}',
    height: 32px,
  }
  page-key: {
    backgroundColor: '{colors.pixel-face-secondary-hover}',
    textColor: '{colors.fg}',
    typography: '{typography.label}',
    rounded: '{rounded.step}',
    height: 32px,
  }
  field: {
    backgroundColor: '{colors.surface-raised}',
    textColor: '{colors.fg}',
    typography: '{typography.body}',
    rounded: '{rounded.step}',
    height: 40px,
    padding: 0 12px,
  }
  field-dark: { backgroundColor: '{colors.surface-raised-dark}', textColor: '{colors.fg-dark}' }
  tag-paid: {
    backgroundColor: '{colors.success-subtle}',
    textColor: '{colors.success-text}',
    typography: '{typography.label}',
    rounded: '{rounded.step}',
    height: 24px,
    padding: 0 8px 2px,
  }
  tag-paid-dark: {
    backgroundColor: '{colors.success-subtle-dark}',
    textColor: '{colors.success-text-dark}',
  }
  row-selected: { backgroundColor: '{colors.selected}', textColor: '{colors.fg}', height: 56px }
  row-selected-dark: { backgroundColor: '{colors.selected-dark}', textColor: '{colors.fg-dark}' }
  kpi-panel: {
    backgroundColor: '{colors.surface-raised}',
    textColor: '{colors.fg}',
    typography: '{typography.kpi}',
    rounded: '{rounded.none}',
    padding: 20px,
  }
  notice: {
    backgroundColor: '{colors.warning-subtle}',
    textColor: '{colors.fg}',
    rounded: '{rounded.none}',
  }
  switch-on: {
    backgroundColor: '{colors.primary}',
    textColor: '{colors.primary-fg}',
    rounded: '{rounded.step}',
    width: 44px,
    height: 24px,
  }
  switch-off: {
    backgroundColor: '{colors.muted}',
    textColor: '{colors.control-ink}',
    rounded: '{rounded.step}',
    width: 44px,
    height: 24px,
  }
---

# Pixel

## Overview

- **Thesis:** a NetScript-amber pixel language with Ore UI physics. Discrete amber bands, stepped
  corners on a 2px grid, pixel-font numbers and mono labels, and keys that sit on a lip and press
  flat. It reads as a game launcher without copying one.
- **Signature moves:**
  1. **Banded amber.** Five 2px bands (`#FFDBA2 → #FFC673 → #FFB245 → #EDA12E → #D38E22`) form the
     10px stripe under the top bar, the 4px bar on the selected row, the brand mark, the KPI chart's
     latest column and the fulfilment progress. They are never a smooth gradient.
  2. **Keys on a lip.** Every pressable thing is a stepped key on a 4px lip (`pixel-lip-primary` =
     band 5 under amber, `pixel-lip-secondary` sand under paper). Pressed drops the face 4px and
     removes the lip. Fields and unchecked boxes are recessed with a 2px inner shade.
  3. **Pixel type for numbers, mono for words.** Pixelify Sans sets the title and KPI values, Space
     Mono sets uppercase labels and buttons, JetBrains Mono sets order IDs, dates and totals, and
     Inter sets reading text.
- **Anchor:** the Mistral pixel idea (banded gradient, cream ground, mono labels), as the owner
  asked: "the idea should be leveraged". Secondary: 8bitcn/ui (MIT) for stepped borders, and
  Minecraft Ore UI for component physics (lips, pressed keys, recessed inputs). Not copied:
  Mistral's M or cat marks, ALTMistral, Mistral's sampled hexes; Mojang fonts, textures, the
  green/stone palette and logos.
- **Family:** Expressive. **Best for:** games, playful products, creator and community tools, hobby
  dashboards. **Avoid for:** formal finance, legal and medical; suggest `studio` or `filigrane`.
- **Feel:** warm, crafted, playful. First impression: "a launcher I want to click."

## Colors

- **Ground and surface ladder.** NetScript paper: canvas `bg` `#F4EFE6` / `#12100E`. Panels
  `surface-raised` `#FCFAF6` / `#282623`. Muted wells `#F1F0EF` / `#222221`. The selected row is
  `selected` `#FFEACB` / `#31200B`. Panels are framed by 1px `frame-ink` (`#21201C` light, a quieter
  `#494844` dark). Interactive perimeters use `control-ink` / `input-border`.
- **The palette is fixed and owner-approved.** Soft amber `#FAAB35` (OKLCH hue 72) with `#12100E`
  ink text. Paper `#FCFAF6` / `#F4EFE6` / `#E8E0D3`. Dark `#12100E` / `#1B1916` / `#282623`. Do not
  retune it toward Mistral orange or toward brown.
- **Accent policy.** Amber fills: primary and hero keys, the selected tab, the current page key, a
  checked checkbox, the on switch, the focus ring and the block cursor. Bands appear only as signals
  (stripe, selection bar, latest chart column, progress). Links use `primary-text`.
- **Status colours.** Tags tint with `*-subtle` behind `*-text` labels and sit on a 2px tone lip.
  Red is an error role here: Destructive keys (`pixel-destructive-face` `#CE2C31`), "Payment failed"
  and the invalid field. The NetScript Utility rule "red only in the logo and errors" doesn't
  constrain Pixel beyond that.
- **Dark design notes.** Warm near-black grounds, not neutral black. Panels lift to `#282623`.
  Decorative frames dim to `#494844`; interactive perimeters stay `#7C7B74` (P-03). Tag lips turn
  warm near-black. The amber primary stays amber with ink text (9.89:1). The reviewer classes it as
  an "explicitly retained saturated" accent, not an inverse slab.

## Typography

- **Families (all OFL, Google Fonts):** Pixelify Sans (`font/heading`, `font/kpi`), Space Mono
  (`font/label`), JetBrains Mono (`font/data`), Inter (`font/sans`).
- **Scale (Theme mode `Pixel`).** Title 40/48 Pixelify Sans SemiBold ("Orders"). KPI 40/48 Medium.
  Heading 24/32. Body 14/20 Inter. Strong 14/20 Bold. Labels 12/16 Space Mono, +0.6px, uppercase
  (Bold on buttons, the active nav item and form labels). Data 13/18 JetBrains Mono (Bold for
  totals); dates 12/16.
- **Rules.** Set Pixelify Sans only at 24 and 40px (the editor header is 24). The editor amount is
  JetBrains Mono Bold 24. `font-synthesis: none`; never fake bold. Uppercase only Space Mono labels.
  Body copy stays Inter so long text is readable.

## Layout

- **Frame.** 1280×1537. Top bar 64 (`surface-raised`, padding 0 40, gap 32): banded "N" mark plus
  NORTHWIND, five uppercase nav items with a 4px indicator, search field 260×40, a pixel bell, a
  32px identicon. A 10px band stripe sits below.
- **Content.** Padding 40 sides, 40 top, 48 bottom; sections 32 apart. Header: breadcrumb, title,
  description, then Export and New order (40 tall).
- **KPI strip.** One 1200×204 panel framed in `frame-ink`, split into four 300px cells by `border`
  rules. Padding 20, label → value → delta → 190×58 block chart.
- **Orders table.** A 1200 panel: toolbar 73 (tabs 32, filter field 280×40, Filter key), header row
  40 with a `frame-ink` rule, rows 56 with `border` dividers, a pager (Prev, 1, 2, 3, …, 531, Next).
  Columns 52 / 112 / 402 / 132 / 196 / 132 / 112 / 44.
- **Bottom row.** Order form 836 (padding 24, sections 24 apart) beside a 340 side column: the
  notice (150) and recent activity (290), 24 apart.
- **Density.** `Comfortable`, explicit. Stepped geometry, icon pixels, major offsets (lips, pressed
  travel, stepped corners) and bands sit on the 2px grid. The documented 1px panel frames and table
  rules, and the 13px data type, are deliberate exceptions to that grid; every edge still lands on a
  whole pixel.

## Elevation & Depth

No blur and no soft shadows (`shadow/*` is transparent, blur 0). Depth is extruded pixels.

| Level            | Recipe (CSS)                                                                                                                                                             | Who                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| Flat             | 1px `frame-ink` frame, no depth                                                                                                                                          | Panels: KPI strip, table, form, notice, activity  |
| Key (rest)       | Face plus a 4px lip: `box-shadow: 0 4px 0 var(--ns-pixel-lip-primary)` (outline keys: inner lip `var(--ns-pixel-lip-secondary)` inside a 2px `control-ink` stepped edge) | Buttons                                           |
| Hero             | Key plus `inset 0 2px 0 var(--ns-pixel-highlight-primary)`                                                                                                               | New order                                         |
| Pressed          | Face drops 4px: `transform: translateY(4px)` (positive y, downward); the lip collapses (`box-shadow: none`); the outer hit area is unchanged                             | All keys                                          |
| Raised tab       | Face on a 2px lip                                                                                                                                                        | Selected tab, a checked checkbox, tags (tone lip) |
| Pressed page key | No lip, face 2px lower                                                                                                                                                   | The current page key                              |
| Recess           | `inset 2px 2px 0 var(--ns-pixel-recess-shade)` inside a 2px stepped edge                                                                                                 | Fields, unchecked checkbox, off switch track      |
| Focus            | 2px `pixel-focus-gap` ring, then a 2px stepped amber ring outside it (fields: the 2px edge turns `control-ink`, then a 2px gap, then the amber ring)                     | Every focusable control                           |

Stepped corners ship as `clip-path: polygon()` notches (4px on 40px keys, 2px on tags, tabs and 24px
controls), or as stacked hard `box-shadow`s. No fractional transforms; animate with `steps()`.

## Shapes

- `radius/*` is 0 everywhere. Corners are cut as pixel steps: filled keys lose a 4×4 square;
  outlined controls draw a 2px edge with a 2×2 step pixel; tags, tabs, the checkbox and the switch
  use a 2px notch.
- Lines are 2px for interactive edges and 1px for panel frames and table rules. Icons and identicons
  sit on a 2px grid.

## Components

| Component         | Pixel variant and anatomy                                                                                                                                                                                                                    | States in Figma                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Button `65:459`   | Kinds Primary, Hero, Outline, Destructive, Ink (`text/fg` face, `surface-raised` label). 40 tall: a 36px face plus a 4px lip, 16/18 padding, a 16px pixel icon, Space Mono Bold 12 uppercase                                                 | Rest, hover, pressed, disabled, focus (Ink: Rest only) |
| Tabs `65:602`     | Tab: Space Mono label plus a JetBrains Mono count; selected = amber face on a 2px lip. Page keys: mini keys on a sand lip; current page = pressed amber                                                                                      | Selected / unselected for both kinds                   |
| Field `65:533`    | 40 tall, a 2px `input-border` stepped edge, a 2px recess shade top and left, Inter 14 value. Focus: `control-ink` edge, amber ring, 8×18 amber block cursor. Error: `destructive` edge and `destructive-subtle` fill, triangle glyph, helper | Rest, focus, error, disabled                           |
| Checkbox `65:550` | 20px. Unchecked: recessed well. Checked: amber, popped up on a 2px lip, ink tick                                                                                                                                                             | Both                                                   |
| Switch `65:567`   | 44×24. Off: recessed `muted` track, "O" mark, 16px `control-ink` knob left. On: amber track, "I" mark, 16px ink knob right                                                                                                                   | Both                                                   |
| Tag `65:593`      | 24 tall, 2px tone lip, Space Mono 12 uppercase `*-text` on `*-subtle`: PAID, AWAITING PAYMENT, SHIPPED, REFUNDED, PAYMENT FAILED                                                                                                             | Five statuses                                          |
| Table row         | 56 tall: checkbox, JetBrains Mono ID, a 28px identicon plus name and email, channel, tag, mono date, Bold total, dots. Selected = `selected` fill plus a 4px band bar                                                                        | Rest / selected                                        |
| KPI cell          | Space Mono label, Pixelify value, an arrow plus a Space Mono delta, a block chart (`muted-fg` blocks; the last column banded with a 2px outside `fg` silhouette, P-01)                                                                       | Rest                                                   |
| Notice            | `warning-subtle` panel, 8px banded bar on the leading edge, pixel triangle, Space Mono Bold title, Inter body, a REVIEW ORDERS link with an arrow                                                                                            | Rest                                                   |
| Nav item          | Space Mono 12 uppercase; active = Bold `fg` plus a 4px banded indicator                                                                                                                                                                      | Rest / active                                          |
| Top bar           | 64 tall, then the 10px band stripe                                                                                                                                                                                                           | —                                                      |
| Progress          | Four segments of 2px-band blocks (Paid, Packed, Shipped, Delivered); the undone segment is flat neutral. Done labels Space Mono Bold with a tick                                                                                             | —                                                      |
| Dialog            | Not drawn. Use `<dialog>` with a `frame-ink` frame, stepped corners and an ink scrim                                                                                                                                                         | Owed to #2416                                          |

## Do's and Don'ts

- **Do** keep the current essence. The Ore pass is a refinement: "I like current one, we're speaking
  of refinement".
- **Don't** copy Mistral: "a bit too Mistral… no need to copy the proprietary colors". No M or cat
  mark, no ALTMistral, no sampled Mistral hexes.
- **Don't** copy Minecraft: "should not be a copy paste". No Mojang fonts, textures, green/stone
  palette or logos. Take only the physics.
- **Don't** retune the amber. The owner walked it from "too far" through "less brown… not mistral
  orange" to "more yellowish" and approved `#FAAB35`.
- **Do** run bands as discrete 2px steps, never a smooth gradient.
- **Do** keep stepped geometry, icon pixels, major offsets and bands on the 2px grid. The documented
  1px panel frames and table rules and the 13px JetBrains Mono data type are allowed; no half pixels
  anywhere.
- **Do** keep chart silhouettes outside the bands so the bands stay whole (P-01).
- **Do** give status tags room for their full uppercase label (P-02: 196px status column).
- **Do** keep dark interactive perimeters at `control-ink` / `input-border` `#7C7B74`, never white.
  The focused field's inner perimeter included (P-03).
- **Do** pair every amber focus ring with its 2px ink gap: amber alone is 1.84:1 on paper.
- **Don't** add soft shadows or blur. Depth is lips and recesses only.
- **Don't** use Pixelify Sans for body text or at off-grid sizes.

## Iconography & Imagery

- Our own 16px pixel icon set on a 2px grid (`64:444`, 18 icons: home, box, user, tag, chart,
  search, bell, plus, check, up, down, chevron, dots, alert, download, filter, x, arrow). Single
  colour, inheriting text colour.
- Identicons replace photos: 28px (32 in the top bar) symmetric pixel glyphs on a tinted square
  (`warning-subtle`, `info-subtle`…). The Shipping bot uses a neutral glyph.
- Charts are block charts on the 2px grid. The brand mark is a banded pixel "N" for the fictional
  Northwind, not a real logo.

## Motion & States

- Drawn: button rest, hover (Primary darkens to `primary-hover`; Outline face goes to
  `pixel-face-secondary-hover`), pressed (the face drops 4px, `translateY(+4px)`, and the lip
  collapses; the outer hit area is unchanged), disabled (flat `muted` face, `border` edge,
  `muted-fg` label), focus. Field rest, focus, error and disabled. Tabs, page keys, checkbox and
  switch on/off.
- Runtime (#2419): press is instant or 2 `steps()`; the switch knob jumps in 2–3 steps; no easing
  curves. Reduced motion: no knob travel, state swaps instantly.

## Accessibility

| Pair (measured)                         | Light          | Dark        |
| --------------------------------------- | -------------- | ----------- |
| Ink label on amber key                  | 9.89:1         | 9.89:1      |
| White on the Destructive face `#CE2C31` | 5.21:1         | 5.21:1      |
| Tags (lowest: PAID `#2a7e3b`/`#e9f6e9`) | 4.54:1         | ≥ 7.08:1    |
| `muted-fg` on panel                     | 5.79:1         | 7.20:1      |
| Field edge `input-border` on panel      | 3.71:1         | 3.55:1      |
| Off-switch knob `control-ink` on track  | 14.32:1        | 3.75:1      |
| Focus: ink gap / amber ring on panel    | 15.64 / 1.84:1 | ring 7.86:1 |

- Known weaknesses (open):
  - the Outline (secondary) focus gap merges with the outline's own ink edge;
  - the light hover lip is faint (`#E8E0D3` against `#F4EFE6`, about 1.2:1; dark lip `#12100E`
    against `#282623` 1.26:1);
  - the Ink kind has only a Rest variant;
  - the status tag's 6px dot sits below its fill and never paints.
- Hit targets: keys 40, tabs 32, rows 56, checkbox 20 inside a 52×56 cell.
- RTL: mirror the row band bar, arrows and the tab order; bands stay horizontal.

## NetScript Mapping

| Layer              | Value                                                                                                                                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Figma Theme mode   | `Pixel` (mode `52:2`)                                                                                                                                                                                                            |
| Base gray × accent | Sand-family neutrals and the amber primary come from the `Pixel` mode's own ramps (the frames resolve Base gray `Neutral` / Base accent `Ink` by default)                                                                        |
| Density            | `Comfortable` (explicit)                                                                                                                                                                                                         |
| Flavor             | n/a                                                                                                                                                                                                                              |
| `data-theme`       | `pixel`                                                                                                                                                                                                                          |
| Language roles     | `pixel/*`: 13 Scheme roles, `--ns-pixel-*`: `lip/{primary,secondary,destructive}`, `highlight/primary`, `face/secondary-hover`, `destructive/face`, `focus/gap`, `recess/shade`, `tag/lip-{success,warning,info,neutral,danger}` |

- **Node-level exceptions:** the bands bind **primitives** directly: `color/band/1…5` (the Figma
  author reports 204 bindings in the Light frame). Their code syntax is `--ns-band-*`, not the
  `--ns-color-*` GUIDELINES gives for primitives. S1 must add semantic band roles (for example
  `pixel/band/1…5`); the primitive binding is a recorded Figma-node exception and cannot ship in
  component CSS. The author also reports no literal paints: the Light and Dark frames bind every
  solid paint (Dark 960 of 960).
- **Figma frames:** Light `66:433`, Dark `68:917` (refined in place); components Light `162:8708`,
  Dark `162:9408`; sets Button `65:459`, Field `65:533`, Checkbox `65:550`, Switch `65:567`, Tag
  `65:593`, Tabs `65:602`; icons `64:444`. Frozen baseline before the Ore pass: `158:2075` /
  `158:3518`, components `158:4961`.
- **Renders:** `renders-r7/pixel--{light,dark,components,before-after}.png` (frozen round-7 set).
- **Evidence status (TD-25).** Visual claims refer to the frozen round-7 renders
  `renders-r7/pixel--{light,dark,components,before-after}.png` under
  `.llm/runs/design-system-s4--language-review/`, hashed in `renders-r7/SHA256SUMS` (sha256
  `092b1cd4…`; review input commit `affd6b158`). Node ids, variable modes, alias and
  `resolveForConsumer` chains, binding and unbound counts, effect-style values and Figma text-style
  weights in this file are **reported by the Figma author and independently unverified**: no frozen
  node/variable/effect/type export accompanies the snapshot. Ratios marked _measured_ were sampled
  on exported pixels; _(token)_ ratios are resolved-variable arithmetic; values marked _proposed_
  stay proposals until a re-render proves them; runtime behaviour is unproven until #2419.

## Provenance

- **Sources:** the Mistral brand (pattern only; mistral.ai/brand), 8bitcn/ui (MIT), Ore UI
  (minecraft.wiki/w/Ore_UI, physics only), the run's `inventory/reference-packs.md` §5.
- **Review rounds:** r3 first review (P-01 chart contour, P-02 status labels); r4 and r5 repairs; r6
  light **PASS** (carried from r5), dark CHANGES_REQUESTED on P-03 only. P-03 has since been applied
  and built into the Field component. **Round 7** reviewed the Ore refinement: light and dark
  **PASS**, judged as the owner-approved refinement against the supplied before/after and component
  renders (the Ore UI wiki page could not be fetched for a fresh upstream comparison). The palette
  is not reopened.
- **Owner decisions** (verbatim from the run worklog and `brief-r5.md`):
  - "Keep terminal and let's add s Pixel one for Mistral";
  - "The Mistral one is. Abit too Mistral the them is pixel do while the idea should be leveraged no
    need to copy one one the propertsry colors";
  - "For the Pixel theme you went to far the Mistral copy looked better just slightly change tone of
    the orange";
  - "Netscript is less brown that that more orange yet not mistral orange";
  - "Pixel is still too orange go more yellowish then";
  - "Pixel finally looks good and start ri give Minecraft vibes I like it".
- **Ore UI direction** (relayed by the supervisor; recorded verbatim in `brief-r7.md`): "mix the
  current Mistral pixel approach with the gaming approach of https://minecraft.wiki/w/Ore_UI while
  it should not be a copy paste… keeping the current essence first"; "I like current one, we're
  speaking of refinement".
- **Invented fixture content:** Northwind and its banded N mark, every name, email, identicon and
  order, the KPI block-chart series, "Edited by Maya Rossi · 2 min ago", the fulfilment steps.
- **Open evidence:** #2414 (band roles, fonts, `tnum`), #2416 (Ink kind states, dialog, tag dot),
  #2419 (stepped motion, keyboard, DPR crispness at 1.25× and 1.5×).
