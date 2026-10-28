---
version: alpha
name: Filigrane
description: Minimal, thin and legible. Light Newsreader numerals over a calm Hanken Grotesk UI, held together by hairlines instead of boxes or shadows.
colors:
  # Resolved from Figma file pGRLnkPPRZJZy74evNcQBr with variable.resolveForConsumer on
  # frame 38:9 (Light) and 38:309 (Dark). Theme = Filigrane. Keys are the --ns-* suffix.
  bg: '#f9f9f8'
  bg-dark: '#111110'
  surface: '#f9f9f8'
  surface-dark: '#191918'
  card: '#fdfdfc'
  card-dark: '#191918'
  muted: '#f1f0ef'
  muted-dark: '#222221'
  selected: '#feebe7'
  selected-dark: '#391714'
  fg: '#21201c'
  fg-dark: '#eeeeec'
  muted-fg: '#63635e'
  muted-fg-dark: '#d2d0ca'
  fg-subtle: '#63635e'
  fg-subtle-dark: '#d2d0ca'
  inverse-fg: '#fdfdfc'
  inverse-fg-dark: '#111110'
  border: '#dad9d6'
  border-dark: '#62605b'
  border-subtle: '#e9e8e6'
  border-subtle-dark: '#2a2a28'
  border-strong: '#bcbbb5'
  border-strong-dark: '#62605b'
  input-border: '#82827c'
  input-border-dark: '#7c7b74'
  ring: '#21201c'
  ring-dark: '#7c7b74'
  border-control: '#21201c'
  border-control-dark: '#7c7b74'
  primary: '#d13415'
  primary-dark: '#e54d2e'
  primary-fg: '#ffffff'
  primary-fg-dark: '#111110'
  primary-text: '#d13415'
  primary-text-dark: '#ff977d'
  action-primary-bg: '#21201c'
  action-primary-bg-dark: '#00000000'
  action-primary-fg: '#fdfdfc'
  action-primary-fg-dark: '#eeeeec'
  action-primary-border: '#21201c'
  action-primary-border-dark: '#7c7b74'
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
typography:
  display: {
    fontFamily: Newsreader,
    fontSize: 76px,
    fontWeight: 300,
    lineHeight: 76px,
    letterSpacing: -2.4px,
  }
  kpi: {
    fontFamily: Newsreader,
    fontSize: 30px,
    fontWeight: 300,
    lineHeight: 36px,
    letterSpacing: -0.6px,
    fontFeature: '"lnum" 1, "tnum" 1',
  }
  heading: {
    fontFamily: Newsreader,
    fontSize: 24px,
    fontWeight: 300,
    lineHeight: 32px,
    letterSpacing: -0.2px,
  }
  lead: { fontFamily: Hanken Grotesk, fontSize: 17px, fontWeight: 400, lineHeight: 28px }
  body: { fontFamily: Hanken Grotesk, fontSize: 15px, fontWeight: 400, lineHeight: 24px }
  data: {
    fontFamily: Hanken Grotesk,
    fontSize: 14px,
    fontWeight: 400,
    lineHeight: 20px,
    fontFeature: '"tnum" 1',
  }
  amount: {
    fontFamily: Hanken Grotesk,
    fontSize: 15px,
    fontWeight: 500,
    lineHeight: 24px,
    fontFeature: '"tnum" 1',
  }
  button: {
    fontFamily: Hanken Grotesk,
    fontSize: 14px,
    fontWeight: 400,
    lineHeight: 16px,
    letterSpacing: 0.2px,
  }
  label: {
    fontFamily: Hanken Grotesk,
    fontSize: 13px,
    fontWeight: 400,
    lineHeight: 18px,
    letterSpacing: 0.2px,
  }
  caption: {
    fontFamily: Hanken Grotesk,
    fontSize: 12px,
    fontWeight: 400,
    lineHeight: 16px,
    letterSpacing: 0.2px,
  }
rounded:
  none: 0px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 14px
  lg: 22px
  xl: 28px
  2xl: 40px
  3xl: 56px
components:
  button-solid: {
    backgroundColor: '{colors.action-primary-bg}',
    textColor: '{colors.action-primary-fg}',
    typography: '{typography.button}',
    rounded: '{rounded.none}',
    height: 40px,
  }
  button-solid-dark: {
    backgroundColor: '{colors.action-primary-bg-dark}',
    textColor: '{colors.action-primary-fg-dark}',
    typography: '{typography.button}',
    rounded: '{rounded.none}',
    height: 40px,
  }
  button-outline: {
    textColor: '{colors.fg}',
    typography: '{typography.button}',
    rounded: '{rounded.none}',
    height: 40px,
  }
  button-outline-dark: {
    textColor: '{colors.fg-dark}',
    typography: '{typography.button}',
    rounded: '{rounded.none}',
    height: 40px,
  }
  link: { textColor: '{colors.primary-text}', typography: '{typography.button}' }
  link-dark: { textColor: '{colors.primary-text-dark}', typography: '{typography.button}' }
  field: {
    textColor: '{colors.fg}',
    typography: '{typography.lead}',
    rounded: '{rounded.none}',
    height: 37px,
  }
  field-dark: {
    textColor: '{colors.fg-dark}',
    typography: '{typography.lead}',
    rounded: '{rounded.none}',
    height: 37px,
  }
  field-focus: { backgroundColor: '{colors.bg}', textColor: '{colors.fg}', height: 38px }
  field-focus-dark: {
    backgroundColor: '{colors.bg-dark}',
    textColor: '{colors.fg-dark}',
    height: 38px,
  }
  checkbox-checked: {
    backgroundColor: '{colors.action-primary-bg}',
    textColor: '{colors.action-primary-fg}',
    rounded: '{rounded.none}',
    size: 16px,
  }
  checkbox-checked-dark: {
    backgroundColor: '{colors.action-primary-bg-dark}',
    textColor: '{colors.action-primary-fg-dark}',
    rounded: '{rounded.none}',
    size: 16px,
  }
  tab-selected: { textColor: '{colors.fg}', typography: '{typography.lead}', height: 38px }
  tab: { textColor: '{colors.muted-fg}', typography: '{typography.lead}', height: 36px }
  table-row: { textColor: '{colors.fg}', typography: '{typography.data}', height: 52px }
  table-row-dark: { textColor: '{colors.fg-dark}', typography: '{typography.data}', height: 52px }
  status-paid: {
    backgroundColor: '{colors.success}',
    textColor: '{colors.fg}',
    typography: '{typography.caption}',
    size: 7px,
  }
  kpi: { textColor: '{colors.fg}', typography: '{typography.kpi}' }
  kpi-dark: { textColor: '{colors.fg-dark}', typography: '{typography.kpi}' }
  avatar: {
    textColor: '{colors.fg}',
    typography: '{typography.label}',
    rounded: '{rounded.full}',
    size: 32px,
  }
---

# Filigrane

<!--
Format: Google Labs DESIGN.md (alpha, Apache-2.0), github.com/google-labs-code/design.md.
Values: Figma file pGRLnkPPRZJZy74evNcQBr, read-only extraction on 2026-10-27.
Formerly "Editorial", then the Theme mode "Atelier". Names are provisional until S1 #2414.
-->

## Overview

- **Thesis:** an operations screen written like a well-set page: light serif numerals, a calm
  grotesk for everything you read or touch, and hairlines doing all the structural work.
- **Signature moves:**
  1. Newsreader Light at display size: a 76px "Orders" title and 30px KPI numerals in a hairline
     grid ("In numbers · 30 days").
  2. Hairline anatomy: underline fields, 1px row rules, numbered form sections ("01 Customer") whose
     rule runs to the edge, and square, unshadowed controls.
  3. One vermilion thread: `primary` tomato marks the eyebrow, section numerals, links, the selected
     row's 3px margin bar and the attention rule. Nothing else is coloured.
- **Anchor:** owner-defined minimal thin type. It began on FT Origami o3 (MIT tokens) and Guardian
  Source (Apache-2.0). Kept: the Origami double-ring focus, right-aligned numerals, accounting
  parentheses for refunds, one accent. Removed on owner direction: masthead, dateline, double rules,
  italic standfirst, all-caps labels and "the wire". Not copied: FT salmon paper, Financier and
  Metric (proprietary), Guardian pillar colours.
- **Family:** Editorial.
- **Best for / avoid for:** reporting, finance and content back offices, low-frequency admin. Avoid
  control-dense tools (many toggles, nested toolbars); the underline fields and square outline
  buttons get lost in volume.
- **Feel:** quiet, precise, literate. First impression: "an annual report you can edit".

## Colors

- **Ground and surface ladder.** Light `bg` `#f9f9f8` (sand/l/2) is the only surface; there are no
  cards. Dark `bg` `#111110` (sand/d/1). Regions are separated by hairlines and whitespace, not
  fills.
- **Hairline ladder.** `border-subtle` (header rule), `border` (row rules, panel top rules),
  `border-strong` (tab baseline, stat grid, section rules), `input-border` (field underlines,
  outline buttons, unchecked boxes). In dark, `border` and `border-strong` are both sand/d/8
  `#62605b`, one step stronger than light after the owner's "Filigrane dark lacks readability".
- **Accent policy.** `primary` (tomato/l/11 `#d13415`, dark tomato/d/9 `#e54d2e`) appears only as a
  3px margin bar or a 1px top rule. `primary-text` (`#d13415` / `#ff977d`) is used for the eyebrow,
  section numerals, "Attention" and links. Primary actions do **not** use the accent: they use the
  `action/primary-*` roles (ink fill in light, hairline outline in dark).
- **Status colours.** A 7×7 square glyph in `success`, `warning`, `info`, `destructive` or
  `fg-subtle` (refunded), always followed by the word. Deltas use `success-text`, `destructive-text`
  and `warning-text` with ▲/▼ glyphs. Refunds read "(210.00)" in `destructive-text`.
- **Dark design notes.** Muted text is brightened to sand/d/11-bright `#d2d0ca` (12.25:1). The
  primary button is transparent with a `#7c7b74` hairline, never a light slab. The focus ring and
  every interactive edge use sand/d/10 `#7c7b74` (E-05, E-06).

## Typography

| Role    | Family         | Size / line | Weight                       | Tracking   | Used for                                    |
| ------- | -------------- | ----------- | ---------------------------- | ---------- | ------------------------------------------- |
| display | Newsreader     | 76/76       | Light 300                    | −2.4px     | Page title                                  |
| kpi     | Newsreader     | 30/36       | Light 300                    | −0.6px     | KPI numerals                                |
| heading | Newsreader     | 24/32       | Light 300                    | −0.2px     | Brand, notice sentence                      |
| lead    | Hanken Grotesk | 17/28       | Regular                      | 0          | Intro, tab labels, field values, form title |
| body    | Hanken Grotesk | 15/24       | Regular (Medium for amounts) | 0          | Checkbox labels, notice body, activity      |
| data    | Hanken Grotesk | 14/20       | Regular                      | 0          | Table cells, nav                            |
| button  | Hanken Grotesk | 14/16       | Regular                      | +0.2px     | Buttons and links                           |
| label   | Hanken Grotesk | 13/18       | Regular                      | +0.2px     | Eyebrow, stat and field labels, footnotes   |
| caption | Hanken Grotesk | 12/16       | Regular                      | +0.1–0.2px | Status words, tab counts, helpers           |

- Newsreader and Hanken Grotesk are OFL (Google Fonts). Fallbacks:
  `Newsreader, "Source Serif 4",
  Georgia, serif`; `"Hanken Grotesk", ui-sans-serif, system-ui`.
- Pairing logic: the serif is reserved for numbers and one-sentence statements; anything you scan or
  operate is grotesk. No italics, no all-caps, sentence case everywhere.
- Icons: arrows at 16px with a 1.5px stroke, the checkbox check at 12px with a 2px stroke.
- Every label that was 11–12px in round 4 was raised by 1px for dark readability; nothing in the UI
  is below 12px.
- The display weight is **Light**. The Theme variable `type/display/style` still says ExtraLight but
  is not bound on the frame; the owner's readability round moved the node to Light.
- Lining tabular numerals for KPIs and amounts are intended (`"lnum"`, `"tnum"`) but owed to #2414:
  the Figma Plugin API cannot set them.

## Layout

- **Canvas:** 1280 wide, padding 28/56/56/56. Content width 1168.
- **App header:** 72 tall with a 1px `border-subtle` rule: Newsreader brand, nav (gap 28, selected
  item in `fg` over a 1px `fg` underline, others `muted-fg`), a 220px underline search, a 32px
  circular avatar.
- **Lead block** (padding 40/0/32, gap 56): a 692px column (eyebrow, display title, 17/28 intro
  sentence, actions) beside a 420px "In numbers" grid of four 210×106 cells divided by
  `border-strong` hairlines.
- **Tabs row** 67 tall (28 top padding, gap 28): label with a subscript count, 2px underline on the
  selected tab; a link action on the right.
- **Table:** header 40, rows 52 with a 1px `border` rule. Columns: mark 36px, No. 108px, customer
  `minmax(0, 1fr)`, channel 140px, status 150px, date 132px, amount 120px (right aligned). The
  customer track is the flexible one: resolve it from the 1168px content width only after
  subtracting row padding, borders and column gaps. The earlier resolved 482px customer width
  assumed none of those; re-resolve it after a fresh layout export. Never shrink the type or clip a
  column to force the arithmetic. Footnote row 36: "Page 1 of 531 · amounts in USD, refunds in
  parentheses".
- **Bottom** (padding 40, gap 56): a 732px form (1px top rule, gap 22) and a 380px side column
  (gap 36) with the attention notice and recent activity.
- **Density:** no Density mode set and none bound; rhythm is literal and generous (row 52, field 37,
  gaps 22–56). The Comfortable values happen to match the 52px row.

## Elevation & Depth

Filigrane is flat. `effect/shadow` is transparent and the Theme mode sets `shadow/blur` 0 and
`shadow/y` 0.

- **Depth is typographic and linear:** a heavier hairline (`border-strong`) marks a structural
  boundary; a lighter one (`border`) separates rows.
- **Focus is the only stacked effect:**
  `box-shadow: 0 0 0 3px var(--ns-bg), 0 0 0 5px
  var(--ns-ring)` plus a 2px `ring` bottom border.
  That gives a 2px ring with a 3px paper gap, the Origami double ring.
- Never add drop shadows, cards or tinted panels.

## Shapes

- **Radius:** 0 everywhere (buttons, fields, checkboxes, status glyphs, tab underlines). The only
  circle is the 32px avatar.
- **Unused Theme radii:** the Filigrane Theme mode still carries `radius/control` 999,
  `radius/input` 10 and `radius/card` 16 (author-reported). No Filigrane node binds them; they are
  left over from when the mode was named `Atelier`. Studio's Atelier flavor documents its own radii
  (0/0/0/0) on Theme mode `Studio`, so these values do not drive it.
- **Strokes:** 1px hairlines for rules, field underlines, outline buttons and unchecked boxes; 2px
  for the selected-tab underline, focused and invalid underlines and the focus ring; 3px for the
  selected-row margin bar.

## Components

| Component      | Variant used                                                 | Anatomy and states                                                                                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button         | `Filigrane/Button` Solid, Outline, Link                      | Solid: 40 tall, square, padding 0/18, gap 10, `action/primary-*` fill and 1px border, arrow icon 16. Outline: 1px `input-border`, `fg` label. Link: `primary-text`, underlined, arrow.                                                                                              |
| Field          | `Filigrane/Field` Default, Focus, Error                      | Label 13/18 `muted-fg` above, value 17/28, 1px `input-border` underline (field 37 tall). Focus: label goes `fg`, 2px `ring` underline, `bg` fill, double ring. Error: label, underline (2px `destructive`) and helper in `destructive-text`; the helper states the repair.          |
| Header search  | Frame `Search` 89:906                                        | 220×28, one opaque 1px `input-border` bottom fill on a whole pixel (E-06).                                                                                                                                                                                                          |
| Checkbox       | `Filigrane/Checkbox`                                         | 16×16 square. Unchecked: 1px `input-border`. Checked: fill `action/primary-bg`, 1px stroke `action/primary-border`, check `action/primary-fg`. Light: ink square with a `#fdfdfc` check. Dark: transparent box, `#7c7b74` edge (4.45:1 on `#111110`) and `#eeeeec` check (16.26:1). |
| Tabs           | `Filigrane/Tab`                                              | Lead-size label + caption count. Selected: `fg` label, 2px `fg` underline. Unselected: `muted-fg`.                                                                                                                                                                                  |
| Table row      | Frames `Row — *`                                             | 52 tall, 1px `border` rule, checkbox at x+8. Selected: checked box plus a 3px `primary` margin bar outside the cell. No fill.                                                                                                                                                       |
| Status         | `Filigrane/Status` Paid, Awaiting, Shipped, Failed, Refunded | 7×7 square glyph, gap 8, `fg` word at 12/16.                                                                                                                                                                                                                                        |
| KPI            | "In numbers" grid                                            | `label` caption, Newsreader 30/36 numeral, delta 14/20 Medium with ▲/▼.                                                                                                                                                                                                             |
| Notice         | "Attention" block (layer `Pull quote` 38:285)                | 1px `primary` top rule, `primary-text` label, Newsreader 24/32 sentence, `muted-fg` body, link action.                                                                                                                                                                              |
| Activity       | List (layer `The wire` 38:294)                               | `label` timestamp column + 15/24 sentence, 1px `border` rules.                                                                                                                                                                                                                      |
| Nav item       | Header nav                                                   | 14/20, 34 tall; selected item `fg` with a 1px `fg` underline, others `muted-fg` with an empty underline slot.                                                                                                                                                                       |
| Top bar        | `App header` 89:887                                          | Described in Layout.                                                                                                                                                                                                                                                                |
| Dialog / sheet | Not drawn                                                    | Owed to #2416; keep it square, hairline, no shadow, solid overlay.                                                                                                                                                                                                                  |

Hover, pressed and disabled states are not drawn (E-02 handoff to #2416).

## Do's and Don'ts

- **Do** keep it minimal, thin and legible; owner: "this is the part I liked most (minimalistic,
  thin police, legible content, ...)".
- **Don't** bring back newspaper apparatus (masthead, dateline, double rules, italic standfirst,
  all-caps kickers); owner: "I liked less the newspaper format".
- **Do** keep dark text bright: `muted-fg` `#d2d0ca` and no label below 12px (owner: "Filigrane dark
  lacks readability"; closed at 12.25:1).
- **Don't** use ExtraLight in the UI. Display and numerals are Newsreader Light.
- **Do** draw every interactive edge in `input-border` (3.67:1 light, 4.45:1 dark). Decorative rules
  may stay quieter (E-01).
- **Do** bind the focus ring to `border/ring` in both schemes: `#21201c` light, `#7c7b74` dark
  (E-05). Never paint a white `#eeeeec` perimeter in dark.
- **Do** paint underlines as one opaque 1px fill on an integer y and seed bound paints with their
  resolved colour. The dark search underline once rendered `#080808` from a stale paint plus a 0.5px
  offset (E-06).
- **Do** snap every hairline to a whole pixel, so each 1px rule renders as one row. The "01/02/03"
  section rules are one crisp `border-strong` row: _measured_ `#bcbbb5` (1.83:1) light and `#62605b`
  (3.01:1) dark at y 996 / 1115 / 1354. They are decorative, so they don't need 3:1.
- **Do** draw the checked checkbox with `action/primary-bg` (fill), `action/primary-border` (stroke)
  and `action/primary-fg` (check). In dark it is a transparent box with a `#7c7b74` edge, never a
  light `#eeeeec` square.
- **Do** keep the checkbox in every row, including the selected one; mark selection with the 3px
  margin bar outside the cell (E-03).
- **Do** write copy from the fixture's facts and give every error its repair (E-04).
- **Don't** fill the primary button with the accent or a light slab in dark; use `action/primary-*`.
- **Don't** add shadows, cards, radii or tinted panels.
- **Do** pair every status glyph with its word; the amber glyph is only 1.5:1 on the paper.

## Iconography & Imagery

- Thin stroke icons only where they direct: a 16px arrow on buttons and links, a check in the
  checkbox, a chevron in the select. Use Lucide (ISC) at 1.5px stroke.
- The avatar is a 32px hairline circle with initials. No photos, no illustration.

## Motion & States

- Nothing moves; states are drawn with lines and ink. The reviewer's proposed matrix (E-02, round 2)
  is: text-action hover thickens the underline to 2px; focus adds the double ring; field focus is a
  2px underline plus caret. Only field focus and error are drawn today. The rest is owed to #2416.
- Selection: a checked box plus the 3px margin bar; never a row fill.
- Reduced motion: no change, because there is no animated transform.

## Accessibility

| Pair                                        | Light                          | Dark                             |
| ------------------------------------------- | ------------------------------ | -------------------------------- |
| `fg` on `bg`                                | 15.48                          | 16.26                            |
| `muted-fg` on `bg`                          | 5.73                           | 12.25                            |
| `primary-text` on `bg`                      | 4.73                           | 8.97                             |
| `success-text` / `destructive-text` on `bg` | 4.81 / 11.80                   | 9.94 / 8.97                      |
| Field underline `input-border`              | 3.67 (pixel row y77 `#82827c`) | 4.45 (pixel row y77 `#7c7b74`)   |
| Focus ring `ring`                           | 15.48                          | 4.45 (rows y1161–1162 `#7c7b74`) |
| Selected margin bar `primary`               | 4.73                           | 4.89                             |

Pixel rows are _measured_ on the frozen `renders-r7/filigrane--{light,dark}.png`; the round-7 review
independently sampled the dark focus ring and search edge (4.4466:1). The other ratios are _(token)_
arithmetic.

- Hit targets: buttons 40 tall, checkbox 16 inside a 24px label row (meets the 24px minimum with the
  label), tabs 36–38.
- Known exceptions: decorative rules (`border` 1.34:1 light) are not boundaries. Status glyphs rely
  on their words.
- RTL: mirror the margin bar to the right edge and the arrow icons. Owed to #2419.

## NetScript Mapping

| Layer              | Value                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| Figma Theme mode   | `Filigrane` (mode id 2:6, author-reported; formerly named `Atelier`)                                  |
| Base gray × accent | Frames resolve Neutral × Ink; the Filigrane Theme mode aliases sand gray and a tomato accent directly |
| Density            | none set; no Density variable bound                                                                   |
| Flavor             | n/a                                                                                                   |
| `data-theme`       | `filigrane`                                                                                           |
| Language roles     | none. Uses core roles plus `action/primary-*`                                                         |

- **Relation to Studio Atelier.** Studio documents every flavor, Atelier included, on Theme mode
  `Studio` (`studio/DESIGN.md` → _Flavors_). Atelier visually inherits Filigrane-like thin type
  (Newsreader Light over Hanken Grotesk) through Studio flavor values. No binding export shows a
  live shared Theme-mode binding, so don't assume that a Filigrane mode change reaches Atelier, or
  the reverse.
- **Node-level exceptions:** none reported. The author reports 288 nodes per frame with 0 primitive
  bindings; that count is independently unverified.
- **Current state after the r7 pre-review pass** (2026-10-28; `corrections-r7.md` in the run dir;
  accepted by the round-7 review):
  - **Section rules "01 / 02 / 03"** (`38:215`, `38:235`, `38:263` light; `38:479`, `38:486`,
    `38:494` dark). Each rule is a 2px rect whose `border-strong` paint is a 1px INSIDE bottom
    stroke, so it renders as one crisp row: _measured_ `#bcbbb5` (1.83:1) light and `#62605b`
    (3.01:1) dark. History: a 1px rect centred in an 18px row used to put it on y + 0.5, where it
    split into two half-intensity rows.
  - **Checked checkbox** (`Filigrane/Checkbox` Checked=True `37:69`) binds `action/primary-bg`,
    `action/primary-border` and `action/primary-fg`. Dark: a transparent box with a `#7c7b74` edge
    (4.45:1 on `#111110`) and an `#eeeeec` check (16.26:1). Light resolves as before. History: the
    dark checked box used to render as a light `#eeeeec` square.
  - **Reported caveat, not changed:** the author reports half-pixel positions on table-row cells
    (checkboxes and status chips at y + 0.5), stat tiles 210.5 / 209.5 wide, and the invisible
    spacers `89:905` and `38:200`. Snap them when the table is next edited.
- **Figma frames:** Light `38:9`, Dark `38:309` on page "Language — Filigrane" (`37:6`). Component
  sets: Button `37:22`, Field `37:44`, Status `37:60`, Tab `37:67`, Checkbox `37:72`. No state-sheet
  frame.
- **Renders:** `renders-r7/filigrane--light.png`, `renders-r7/filigrane--dark.png` (re-exported
  after the r7 pre-review pass, then frozen for round 7).
- **Evidence status (TD-25).** Visual claims refer to the frozen round-7 renders
  `renders-r7/filigrane--{light,dark}.png` under `.llm/runs/design-system-s4--language-review/`,
  hashed in `renders-r7/SHA256SUMS` (sha256 `092b1cd4…`; review input commit `affd6b158`). Node ids,
  variable modes, alias and `resolveForConsumer` chains, binding and unbound counts, effect-style
  values and Figma text-style weights in this file are **reported by the Figma author and
  independently unverified**: no frozen node/variable/effect/type export accompanies the snapshot.
  Ratios marked _measured_ were sampled on exported pixels; _(token)_ ratios are resolved-variable
  arithmetic; values marked _proposed_ stay proposals until a re-render proves them; runtime
  behaviour is unproven until #2419.

## Provenance

- **Sources:** FT Origami o3 (`@financial-times/o3-foundation`, MIT), Guardian Source
  (`@guardian/source`, Apache-2.0) for the original anchor; reference pack
  `inventory/reference-packs.md` §2. Current direction is owner-defined.
- **Review rounds** (independent Codex reviewer, run `design-system-s4--language-review`): r2
  E-01…E-04 as Editorial; r3 PASS both schemes; r5 renamed and rebuilt, owner readability addendum
  closed at 12.25:1, E-05 and E-06 opened; r6 light **PASS**, dark CHANGES_REQUESTED (E-05, E-06);
  r7 **PASS** in both schemes on the frozen renders, with E-05, E-06 and the section-rule repair
  CLOSED and E-02 handed to #2416. Round-2 findings are retained, but round 2's runtime was not
  attested as `gpt-6-astra`/`xhigh`; the rounds whose runtime was attested are identified in
  `review/worklog.md`.
- **Owner decisions (verbatim):** "Editorial looks to much newspaper and should maybe be renamed
  Filigrane because this is the part I liked most (minimalistic, thin police, legible content, ...)
  I liked less the newspaper format"; "Filigrane dark lacks readability" (`brief-r5.md`).
- **Provisional:**
  - Names until S1 #2414, including the Filigrane Theme mode (formerly `Atelier`).
  - Hover, pressed, disabled, checkbox and row state matrix: #2416 (E-02).
  - Numeral features, keyboard, viewport and RTL: #2414 and #2419.
- **Invented fixture content:** the "Northwind" store, orders SO-10477…SO-10482, customers and
  emails, amounts, KPI values, the intro sentence, activity entries and the AUTUMN24 code are demo
  data from the shared Orders fixture.
