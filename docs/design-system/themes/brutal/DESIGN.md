---
version: alpha
name: Brutal
description: Gumroad-style neo-brutalism. Flat saturated blocks, black ink outlines and hard zero-blur offset shadows that stay black in both schemes.
colors:
  # Resolved from Figma file pGRLnkPPRZJZy74evNcQBr with variable.resolveForConsumer on
  # frame 34:9 (Light) and 35:199 (Dark). Theme = Brutal. Keys are the --ns-* suffix.
  bg: '#fefbe9'
  bg-dark: '#31312e'
  surface: '#f9f9f8'
  surface-dark: '#191918'
  card: '#ffffff'
  card-dark: '#191918'
  surface-raised: '#ffffff'
  surface-raised-dark: '#222221'
  muted: '#f1f0ef'
  muted-dark: '#222221'
  selected: '#fff7c2'
  selected-dark: '#302008'
  overlay: '#00000066'
  overlay-dark: '#000000a8'
  fg: '#21201c'
  fg-dark: '#eeeeec'
  muted-fg: '#63635e'
  muted-fg-dark: '#b5b3ad'
  ink-fg: '#fdfdfc'
  ink-fg-dark: '#eeeeec'
  border: '#dad9d6'
  border-dark: '#3b3a37'
  input-border: '#82827c'
  input-border-dark: '#7c7b74'
  border-control: '#000000'
  border-control-dark: '#7c7b74'
  ink: '#000000'
  ink-dark: '#000000'
  ring: '#0d74ce'
  ring-dark: '#70b8ff'
  primary: '#ffc53d'
  primary-dark: '#ffc53d'
  primary-hover: '#ffba18'
  primary-hover-dark: '#ffd60a'
  primary-fg: '#21201c'
  primary-fg-dark: '#21201c'
  primary-text: '#ab6400'
  primary-text-dark: '#ffca16'
  block-yellow: '#ffc53d'
  block-yellow-dark: '#ffc53d'
  block-blue: '#c2e5ff'
  block-blue-dark: '#0090ff'
  block-green: '#d3e7a6'
  block-green-dark: '#bdee63'
  block-pink: '#ffcdc2'
  block-pink-dark: '#e54d2e'
  block-purple: '#e1d9ff'
  block-purple-dark: '#6e56cf'
  block-fg: '#000000'
  block-fg-dark: '#000000'
  shadow-color: '#000000'
  shadow-color-dark: '#000000'
  success: '#46a758'
  success-dark: '#46a758'
  success-text: '#2a7e3b'
  success-text-dark: '#71d083'
  warning: '#ffc53d'
  warning-dark: '#ffc53d'
  warning-text: '#4f3422'
  warning-text-dark: '#ffca16'
  destructive: '#e5484d'
  destructive-dark: '#e5484d'
  destructive-text: '#641723'
  destructive-text-dark: '#ff9592'
  info: '#0090ff'
  info-dark: '#0090ff'
  info-text: '#113264'
  info-text-dark: '#70b8ff'
typography:
  title: {
    fontFamily: Space Grotesk,
    fontSize: 52px,
    fontWeight: 400,
    lineHeight: 52px,
    letterSpacing: -2px,
  }
  kpi: {
    fontFamily: Space Grotesk,
    fontSize: 40px,
    fontWeight: 700,
    lineHeight: 44px,
    letterSpacing: -1.5px,
  }
  heading: {
    fontFamily: Space Grotesk,
    fontSize: 18px,
    fontWeight: 700,
    lineHeight: 24px,
    letterSpacing: -0.3px,
  }
  body: { fontFamily: Space Grotesk, fontSize: 14px, fontWeight: 400, lineHeight: 20px }
  button: {
    fontFamily: Space Grotesk,
    fontSize: 14px,
    fontWeight: 700,
    lineHeight: 20px,
    letterSpacing: -0.3px,
  }
  caption: { fontFamily: Space Grotesk, fontSize: 12px, fontWeight: 400, lineHeight: 16px }
  label: {
    fontFamily: Space Mono,
    fontSize: 11px,
    fontWeight: 700,
    lineHeight: 16px,
    letterSpacing: 0.6px,
  }
  data: {
    fontFamily: JetBrains Mono,
    fontSize: 14px,
    fontWeight: 700,
    lineHeight: 20px,
    fontFeature: '"tnum" 1',
  }
  data-meta: { fontFamily: JetBrains Mono, fontSize: 13px, fontWeight: 400, lineHeight: 18px }
rounded:
  none: 0px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  2xl: 24px
  3xl: 32px
components:
  button-primary: {
    backgroundColor: '{colors.block-yellow}',
    textColor: '{colors.block-fg}',
    typography: '{typography.button}',
    rounded: '{rounded.md}',
    height: 44px,
  }
  button-primary-dark: {
    backgroundColor: '{colors.block-yellow-dark}',
    textColor: '{colors.block-fg-dark}',
    typography: '{typography.button}',
    rounded: '{rounded.md}',
    height: 44px,
  }
  button-secondary: {
    backgroundColor: '{colors.card}',
    textColor: '{colors.fg}',
    rounded: '{rounded.md}',
    height: 44px,
  }
  button-secondary-dark: {
    backgroundColor: '{colors.card-dark}',
    textColor: '{colors.fg-dark}',
    rounded: '{rounded.md}',
    height: 44px,
  }
  button-ink: {
    backgroundColor: '{colors.ink}',
    textColor: '{colors.ink-fg}',
    rounded: '{rounded.md}',
    height: 44px,
  }
  input: {
    backgroundColor: '{colors.card}',
    textColor: '{colors.fg}',
    rounded: '{rounded.md}',
    height: 44px,
  }
  input-dark: {
    backgroundColor: '{colors.card-dark}',
    textColor: '{colors.fg-dark}',
    rounded: '{rounded.md}',
    height: 44px,
  }
  checkbox-checked: {
    backgroundColor: '{colors.primary}',
    textColor: '{colors.primary-fg}',
    rounded: '{rounded.xs}',
    size: 22px,
  }
  switch-on: {
    backgroundColor: '{colors.block-green}',
    rounded: '{rounded.full}',
    width: 52px,
    height: 28px,
  }
  sticker-success: {
    backgroundColor: '{colors.block-green}',
    textColor: '{colors.block-fg}',
    typography: '{typography.label}',
    rounded: '{rounded.full}',
    height: 26px,
  }
  tab-selected: {
    backgroundColor: '{colors.ink}',
    textColor: '{colors.ink-fg}',
    typography: '{typography.label}',
    height: 40px,
  }
  table-header: {
    backgroundColor: '{colors.ink}',
    textColor: '{colors.ink-fg}',
    typography: '{typography.label}',
    height: 44px,
  }
  table-header-dark: {
    backgroundColor: '{colors.ink-dark}',
    textColor: '{colors.ink-fg-dark}',
    typography: '{typography.label}',
    height: 44px,
  }
  table-row-selected: {
    backgroundColor: '{colors.block-yellow}',
    textColor: '{colors.block-fg}',
    height: 60px,
  }
  kpi-card: {
    backgroundColor: '{colors.block-yellow}',
    textColor: '{colors.block-fg}',
    typography: '{typography.kpi}',
    rounded: '{rounded.lg}',
    width: 289px,
    height: 190px,
  }
  kpi-card-dark: {
    backgroundColor: '{colors.block-blue-dark}',
    textColor: '{colors.block-fg-dark}',
    typography: '{typography.kpi}',
    rounded: '{rounded.lg}',
  }
  notice: {
    backgroundColor: '{colors.block-pink}',
    textColor: '{colors.block-fg}',
    rounded: '{rounded.lg}',
  }
  notice-dark: {
    backgroundColor: '{colors.block-pink-dark}',
    textColor: '{colors.block-fg-dark}',
    rounded: '{rounded.lg}',
  }
  panel: { backgroundColor: '{colors.card}', textColor: '{colors.fg}', rounded: '{rounded.lg}' }
  panel-dark: {
    backgroundColor: '{colors.card-dark}',
    textColor: '{colors.fg-dark}',
    rounded: '{rounded.lg}',
  }
---

# Brutal

<!--
Format: Google Labs DESIGN.md (alpha, Apache-2.0), github.com/google-labs-code/design.md.
Values: Figma file pGRLnkPPRZJZy74evNcQBr, read-only extraction on 2026-10-27.
Names are provisional until S1 #2414.
-->

## Overview

- **Thesis:** a sticker-book commerce console. Every surface is one flat, saturated block held by a
  black ink outline and a hard offset shadow, and the ink stays black when the page goes dark.
- **Signature moves:**
  1. Hard offset shadows with zero blur in pure black (`#000000`), sized 3/3, 4/4 or 6/6 by object
     size, in both schemes.
  2. Saturated colour blocks carrying data: the four KPI tiles (yellow, blue, pink, green), the pink
     notice and the yellow selected row, always with black `block-fg` text.
  3. Mono "sticker" labels: Space Mono Bold 11px uppercase with 0.6px tracking, on pill stickers
     with a 2px ink border; the page's `LIVE SYNC` sticker is rotated −6°.
- **Anchor:** Gumroad UI code (MIT, `antiwork/gumroad`) plus neobrutalism.dev (MIT,
  `ekmas/neobrutalism-components`). Taken: the hard shadow that is pinned to black in dark mode, the
  bordered pill badge, regular-weight headings, colour-block fills without gradients, the
  shadow-collapses-on-press model. Not copied: Gumroad's name, coin illustrations, pink `#ff90e8`
  trade dress and the commercial ABC Favorit font (substituted by Space Grotesk). Figma's 2024 brand
  is explicitly not an anchor, because it retired heavy outlines.
- **Family:** Expressive.
- **Best for / avoid for:** creator tools, storefront admin, marketing consoles. Avoid long data
  sessions and dense analytics: every row carries a 2px rule and every panel a 6px slab.
- **Feel:** loud, honest, tactile. First impression: "a zine that runs a shop".

## Colors

- **Ground and surface ladder.**
  - Light: canvas `bg` `#fefbe9` (amber/l/2, warm cream) → panels `card` `#ffffff` → blocks.
  - Dark: canvas `bg-dark` `#31312e` (sand/d/5) is _lighter_ than the panels `card-dark` `#191918`
    (sand/d/2). The panels read as dark slabs sitting on a mid-dark table, which is what keeps the
    black outlines and shadows meaningful in dark.
- **Accent policy.** Colour lives in `block/*` fills only: KPI tiles, the notice, avatars, stickers,
  the selected nav item and the selected row (`block-yellow`). Text on any block is always
  `block-fg` (`#000000`). Accent never tints text, outlines or shadows.
- **Ink.** `border/ink` and `effect/shadow` are `#000000` in both schemes. The table header, the
  selected filter tab, the delta pills and page key 1 are filled with `border/ink` and labelled with
  `ink/fg` (`#fdfdfc` light, `#eeeeec` dark).
- **Status colours.** Stickers map Paid → `block-green`, Awaiting payment → `block-yellow`, Shipped
  → `block-blue`, Failed → `block-pink`, Refunded → `card` (neutral). Error text and outlines use
  `destructive` (`#e5484d`) and `destructive-text`.
- **Dark design notes.** The blocks change ramp in dark: blue goes from blue/l/5 `#c2e5ff` to
  blue/d/9 `#0090ff`, pink from tomato/l/5 to tomato/d/9 `#e54d2e`, green from lime/l/5 to lime/d/9
  `#bdee63`. They stay saturated so black text keeps ≥5.4:1. Control boundaries switch from ink to
  `border/control` = sand/d/10 `#7c7b74`, because black on `#31312e` is only 1.61:1.

## Typography

| Role    | Family         | Size / line               | Weight              | Tracking | Used for                                    |
| ------- | -------------- | ------------------------- | ------------------- | -------- | ------------------------------------------- |
| title   | Space Grotesk  | 52/52                     | Regular 400         | −2px     | Page title "Orders" (bound to `type/title`) |
| kpi     | Space Grotesk  | 40/44                     | Bold 700            | −1.5px   | KPI values                                  |
| heading | Space Grotesk  | 18/24                     | Bold 700            | −0.3px   | Brand, panel titles, notice heading         |
| button  | Space Grotesk  | 14/20                     | Bold 700            | −0.3px   | Button labels, customer names               |
| body    | Space Grotesk  | 14/20 (13/18 small)       | Regular 400         | 0        | Subtitle, channel, activity text            |
| label   | Space Mono     | 11/16                     | Bold 700, UPPERCASE | +0.6px   | Nav, column headers, stickers, KPI labels   |
| data    | JetBrains Mono | 14/20 Bold; 13/18 Regular | 700 / 400           | 0        | Order IDs, totals, dates, field values      |

- All three families are OFL on Google Fonts. Fallbacks:
  `"Space Grotesk", ui-sans-serif,
  system-ui`; `"Space Mono", "JetBrains Mono", ui-monospace`.
- Headings are regular weight at display size, following Gumroad. Only the KPI numerals are bold.
- Field values and placeholders are mono (`JetBrains Mono Regular 14/20`), which makes inputs read
  as typed data.
- Tabular numerals: the mono faces are fixed-width; `"tnum"` for Space Grotesk numerals is owed to
  #2414/#2416 (no Plugin API to prove it).

## Layout

- **Canvas:** 1280 wide. Top bar 76px tall (padding 0/32, gap 28) with a 2px ink bottom rule. Body
  padding 36px top and 32px sides; vertical rhythm between regions is 32px.
- **Orders fixture composition:**
  1. Header: breadcrumb label, 52px title with the rotated sticker, subtitle; Export and Create
     order buttons right.
  2. KPI row: four 289×190 tiles, gap 20, padding 18/20, internal gap 10, each with a 12-bar ink bar
     chart.
  3. Orders panel (1216 wide): toolbar 72 (padding 16/20) with joined filter tabs, header row 44,
     six rows of 60 with a 2px ink bottom rule, footer 66 with 36px page keys.
  4. Bottom row (gap 24): order form 812 wide (padding 22/24/24/24, gap 20, two-column field rows
     with gap 16) and a 380-wide side column (notice, then recent activity; gap 24).
- **Table columns:** select 52px, order 112px, customer `minmax(0, 1fr)`, channel 136px, status
  176px, date 132px, total 120px, actions 48px. Cells pad 0/8 inside their track. The customer track
  takes what remains of the 1216px panel after its 2px borders, any row padding and column gaps are
  subtracted. The earlier resolved 412px customer width, and the totals derived from it, do not fit
  that container once padding and borders are counted; re-resolve after a fresh layout export. Never
  shrink the type or clip a column to force the arithmetic.
- **Density:** no Density mode is set on the frames and no Density variable is bound; geometry is
  literal on the nodes. Effective density sits between Comfortable and Chunky (44px controls, 60px
  rows). Treat these numbers as the theme's own until S1 maps them.

## Elevation & Depth

Brutal has one depth device: a hard offset slab. There is no blur, no gradient and no tint anywhere.

| Level   | Recipe (CSS)                        | Applied to                                                  | Why                                        |
| ------- | ----------------------------------- | ----------------------------------------------------------- | ------------------------------------------ |
| Flat    | `box-shadow: none`                  | Rows, nav items, stickers, inputs at rest, tabs, avatars    | Printed on the block; not an object        |
| Slab S  | `3px 3px 0 0 #000`                  | Logo tile 40×40, "Next" page button 36px                    | Small objects get a short throw            |
| Slab M  | `4px 4px 0 0 #000`                  | Buttons 44px (Export, Create order, Cancel, Save)           | Pressable controls                         |
| Slab L  | `6px 6px 0 0 #000`                  | KPI tiles, Orders panel, order form, notice, activity panel | Regions                                    |
| Focus   | `4px 4px 0 0 var(--ns-ring)`        | Focused field                                               | Replaces nothing; the 2px ink border stays |
| Invalid | `4px 4px 0 0 var(--ns-destructive)` | Invalid field                                               | Paired with icon and helper text           |
| Pressed | `none`, content translated +4/+4    | Button `State=Pressed` (79:2194, 79:2197, 79:2200)          | The slab collapses into the page           |

- The shadow colour is `effect/shadow` = `#000000` in **both** schemes. A pale offset in dark was
  once accepted by review and then reversed as a review error (round 5).
- Pressed keeps the hit area: the Figma variant swaps padding from 0/18/0/16 to 4/14/0/20.

## Shapes

- **Radius scale:** `rounded.xs` 4 (checkbox, delta pill), `sm` 6 (nav item, page key, avatar), `md`
  8 (button, input, search, logo), `lg` 12 (tiles, panels), `full` (stickers, switch). Theme
  variables: `radius/control` 8, `radius/input` 8, `radius/card` 12, `radius/badge` 999.
- **Strokes:** 2px inside strokes everywhere: panels, buttons, inputs, stickers, avatars, checkbox,
  switch, row rules. Activity dividers are 1.5px dashed `[6, 4]`.
- **Joined tabs:** the filter tabs overlap by 2px (gap −2) so neighbouring borders merge; only the
  outer corners are rounded.
- **Tilt:** one sticker per screen may rotate (−6° on `LIVE SYNC`). Never rotate controls.

## Components

| Component       | Variant used                                                                    | Anatomy and states                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button          | `Brutal/Button` Kind = Primary (block-yellow), Secondary (card), Ink (ink fill) | 44 tall, r8, 2px `border/ink`, Slab M. Pressed: no shadow, content +4/+4. Toolbar instances are 40 tall without shadow. Kind=Ink (not used on the Orders frames): `border/ink` fill with the label and "+" glyph in `ink/fg`, _measured_ on `renders-r7/brutal--ink-button-specimen.png` at `#eeeeec` on `#000000` (18.08:1) in dark and `#fdfdfc` (20.63:1) in light; matches the YAML `button-ink` entry. |
| Input / select  | `Brutal/Input` Default, Focus, Error                                            | Label (Space Mono 11) above a 44px r8 field with mono value. Default border is `border/control`; Focus keeps a 2px ink border and adds the 4/4 ring slab; Error uses a `destructive` border, 4/4 destructive slab, trailing alert icon and helper "This code expired on Oct 15. Remove it or choose another."                                                                                               |
| Textarea        | Detached frame `47:1368`                                                        | 92px field, r8, `border/control`, counter helper "Optional · 0 / 500".                                                                                                                                                                                                                                                                                                                                      |
| Checkbox        | `Brutal/Checkbox` 22×22 r4                                                      | Unchecked: card fill, `border/control`. Checked: `primary` fill, `primary-fg` check, 2px `primary-fg` keyline.                                                                                                                                                                                                                                                                                              |
| Switch          | `Brutal/Switch` 52×28 pill                                                      | Off: card fill, `border/control`, black thumb with a 1px `border/control` inner contour (B-06). On: `block-green`, ink border.                                                                                                                                                                                                                                                                              |
| Tabs            | `Brutal/Tab`                                                                    | Joined row, 40 tall. Selected: ink fill, `ink-fg` label and count. Unselected: card fill.                                                                                                                                                                                                                                                                                                                   |
| Table row       | Frames `Row — *`                                                                | 60 tall, 2px ink bottom rule. Selected: `block-yellow` fill, checked box. Header: ink fill, `ink-fg` Space Mono labels.                                                                                                                                                                                                                                                                                     |
| Sticker (badge) | `Brutal/Sticker` Tone = Success, Warning, Error, Info, Neutral                  | 26 tall pill, 2px ink border, Space Mono Bold 11 uppercase. "AWAITING PAYMENT" is spelled out (min width 144).                                                                                                                                                                                                                                                                                              |
| KPI tile        | Frames `KPI — *`                                                                | 289×190, r12, Slab L, block fill, label, 40px value, ink delta pill (r4) with `ink-fg` arrow and %, 12 ink bars.                                                                                                                                                                                                                                                                                            |
| Notice          | `Notice` 35:151                                                                 | `block-pink` slab, ink alert disc, Space Grotesk 18 heading, underlined mono "REVIEW ORDERS" link.                                                                                                                                                                                                                                                                                                          |
| Nav item        | `Nav — *`                                                                       | 28 tall, r6, no fill. Selected: `block-yellow`, 2px ink border, 32 tall.                                                                                                                                                                                                                                                                                                                                    |
| Top bar         | `Top bar` 34:10                                                                 | Logo tile with Slab S, nav, 240×40 search with `border/control`.                                                                                                                                                                                                                                                                                                                                            |
| Page keys       | `Page *`                                                                        | 36×36 r6, `border/control`; current page ink-filled.                                                                                                                                                                                                                                                                                                                                                        |
| Dialog / sheet  | Not drawn                                                                       | Overlay roles exist (`overlay` 40% / 66% black). Anatomy owed to #2416.                                                                                                                                                                                                                                                                                                                                     |

Hover, disabled and focus-visible on buttons, tabs and rows are not drawn. They are owed to #2416.

## Do's and Don'ts

- **Do** keep outlines and hard shadows `#000000` in dark. The owner rejected the first dark as
  "simply inverted and therefore unreadable".
- **Don't** let any header, tab or slab turn white in dark: "Brutal had like white header this
  should never happen on a dark theme". The table header and selected tab are ink-filled in both
  schemes.
- **Do** put the dark canvas (`#31312e`) above the dark panels (`#191918`) in lightness, so slabs
  still read as objects.
- **Do** use `border/control` for every boundary someone must find: inputs, search, checkbox, switch
  track and thumb contour, page keys. Black on dark measures 1.61:1 (B-06).
- **Don't** use `border/control` on decorative panel outlines; those stay ink.
- **Do** pair the colour blocks with black text and check each pair. Dark blue, pink and green give
  6.43, 5.43 and 15.57:1.
- **Don't** put black text on the dark violet block (3.9:1). Avatar labels on `block-purple` use
  `text/fg` (B-01): 4.64:1 dark, 12.09:1 light.
- **Do** bind chart bars and delta arrows to ink roles (`primary/fg`, `ink/fg`), never to the block
  colour (B-01, B-05).
- **Don't** label an ink-filled surface with `text/inverse`; it flips to near-black in dark. Use
  `ink/fg`, as the table header, selected tab, delta pills and Ink button do. (History: the Ink
  button label once bound `text/inverse` and measured 1.05:1 in dark.)
- **Do** show focus as a separate hard 4/4 offset in `border/ring` while keeping the ink border
  (B-02). Never signal focus by border colour alone.
- **Do** collapse the slab on press (shadow 0, content +4/+4) and keep the hit area (B-03).
- **Do** use one label per command ("Create order" everywhere) and spell statuses in full (B-04).
- **Don't** add blur, gradients or soft shadows; Brutal's depth is only the offset slab.
- **Don't** make headings bold. Display and title are Space Grotesk Regular.
- **Don't** add a second accent family. Blocks come from `block/*` only.

## Iconography & Imagery

- Stroke icons from `icon/*` instances named after Lucide glyphs (search, chevron, arrow, alert),
  Lucide being ISC-licensed; 16–18px, ink coloured.
- Avatars are 34×34 r6 colour blocks with a 2px ink border and Space Mono Bold initials. No photos.
- No illustration or backdrop. Gumroad's coins and mascots must not be used.

## Motion & States

- **Pressed:** the slab collapses (shadow 0) and content moves +4/+4. **Hover** (anchor behaviour,
  not drawn): neobrutalism.dev moves the element toward its shadow; Gumroad lifts with
  `translate(-0.25rem)`. Pick one in #2416 and keep the hit area fixed.
- **Easing:** the anchor animates `transform` only with `ease-out`; no colour fades. Durations are
  owed to #2419.
- **Reduced motion:** drop the translation and keep the shadow change.
- **Selection:** a selected row fills with `block-yellow`; a selected tab fills with ink. Both also
  change the checkbox or label, so selection never relies on colour alone.

## Accessibility

Ratios are _(token)_ arithmetic from the resolved tokens. Dark values were also _measured_ on the
dark render, which is byte-identical to the frozen `renders-r7/brutal--dark.png`.

| Pair                                    | Light                 | Dark                                                               |
| --------------------------------------- | --------------------- | ------------------------------------------------------------------ |
| `fg` on `bg` / on `card`                | 15.67 / 16.30         | 11.23 / 15.14                                                      |
| `muted-fg` on `card`                    | 6.04                  | 8.39                                                               |
| `block-fg` on blue / pink / green block | 15.95 / 14.76 / 15.75 | 6.43 / 5.43 / 15.57                                                |
| `ink-fg` on ink header                  | 20.63                 | 18.08                                                              |
| Control boundary on canvas              | ink 20.19             | `#7c7b74` on `#31312e` 3.07 (pixel-measured 3.0710 by Codex, B-06) |
| Focus offset `ring` on `bg`             | 4.58                  | 6.21                                                               |

- Hit targets: buttons 44, fields 44, page keys 36, checkbox 22 (row cell is 52 wide), switch 52×28.
- Known exceptions: decorative black panel outlines on dark panels measure 1.19:1. They are
  decorative by design; the 3:1 boundary comes from `border/control`.
- RTL: mirror the slab offset (`-4px 4px`) and the pressed translation. Owed to #2419.

## NetScript Mapping

| Layer              | Value                                                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Figma Theme mode   | `Brutal` (mode id 14:2), set explicitly on both frames                                                                                    |
| Base gray × accent | Frames resolve Neutral × Ink, but Brutal's Theme mode aliases its own sand gray and amber accent, so neither base mode changes the output |
| Density            | none set (Comfortable by default); no Density variable bound                                                                              |
| Flavor             | n/a                                                                                                                                       |
| `data-theme`       | `brutal`                                                                                                                                  |
| Language roles     | none. Brutal uses core roles plus the shared `block/*`, `border/ink`, `border/control` and `ink/fg`                                       |

- **Node-level exceptions:** none reported. The author reports an audit of 451 nodes per frame with
  0 primitive bindings; that count is independently unverified.
- **Ink button (current state after the r7 pre-review pass, 2026-10-28):** the `Brutal/Button`
  Kind=Ink label (Rest `33:23`, Pressed `79:2202`) and its "+" icon strokes bind `ink/fg`.
  - _Measured_ on the light/dark specimen `renders-r7/brutal--ink-button-specimen.png`: dark
    `#eeeeec` on `#000000` is 18.08:1; light `#fdfdfc` is 20.63:1. The round-7 review closed it.
  - History: the label and glyph used to bind `text/inverse` (1.05:1 in dark).
  - The Orders frames show no Ink label; the author reports they re-export with 0 changed pixels.
- **Figma frames:** Light `34:9` "Brutal — Orders", Dark `35:199` "Brutal — Orders · Dark".
  Component sets on page "Language — Brutal" (`33:8`): Button `33:24`, Input `33:48`, Checkbox
  `33:53`, Switch `33:58`, Sticker `33:69`, Tab `33:76`. There is no separate state-sheet frame.
- **Renders:** `renders-r7/brutal--light.png`, `renders-r7/brutal--dark.png` and
  `renders-r7/brutal--ink-button-specimen.png` (byte-identical to the `renders-r6/` exports of the
  same names). The author reports the light/dark pair is pixel-identical to the r5 light / r6 dark
  renders.
- **Evidence status (TD-25).** Visual claims refer to the frozen round-7 renders
  `renders-r7/brutal--{light,dark,ink-button-specimen}.png` under
  `.llm/runs/design-system-s4--language-review/`, hashed in `renders-r7/SHA256SUMS` (sha256
  `092b1cd4…`; review input commit `affd6b158`). Node ids, variable modes, alias and
  `resolveForConsumer` chains, binding and unbound counts, effect-style values and Figma text-style
  weights in this file are **reported by the Figma author and independently unverified**: no frozen
  node/variable/effect/type export accompanies the snapshot. Ratios marked _measured_ were sampled
  on exported pixels; _(token)_ ratios are resolved-variable arithmetic; values marked _proposed_
  stay proposals until a re-render proves them; runtime behaviour is unproven until #2419.

## Provenance

- **Sources:** Gumroad (`github.com/antiwork/gumroad`, MIT; `app/javascript/components/ui/*`),
  neobrutalism.dev (MIT). Reference pack: `inventory/reference-packs.md` §1.
- **Review rounds** (independent Codex reviewer, run `design-system-s4--language-review`): r2
  B-01…B-04; r3 PASS both schemes; r5 dark reopened after the owner's inversion finding (B-05
  arrows, B-06 control boundaries); r6 **PASS** in both schemes, no open finding; r7 **PASS** in
  both schemes on the frozen renders, with the Ink-button label CLOSED and B-03 handed to #2416.
  Round-2 findings are retained, but round 2's runtime was not attested as `gpt-6-astra`/`xhigh`;
  the rounds whose runtime was attested are identified in `review/worklog.md`.
- **Owner decisions (verbatim):** "This one is not bad good start" (early review; relayed by the
  supervisor); "Brutal dark mode is simply inverted and therefore unreadable"; "Brutal had like
  white header this should never happen on a dark theme these are design failure" (`brief-r5.md`).
- **Provisional:**
  - Role and mode names until S1 #2414, including the shared `block/*` names.
  - Hover, disabled, focus-visible on buttons and tabs, dialog anatomy and the pressed export: #2416
    (B-03 handoff).
  - Keyboard, viewport, reduced-motion and RTL behaviour: #2419.
- **Invented fixture content:** the "Northwind" store, orders SO-10477…SO-10482, customer names and
  emails, all amounts, KPI values and deltas, activity entries and the AUTUMN24 code are demo data
  from the shared Orders fixture.
