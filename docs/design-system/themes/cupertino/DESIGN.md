---
version: alpha
name: Cupertino
description: 'Apple-inspired classic: a vibrant floating sidebar, a large-title header, capsule buttons, inset grouped lists and blur-only materials, with full-row system-blue selection on opaque slate content cards.'
colors:
  # Resolved from Figma file pGRLnkPPRZJZy74evNcQBr, Theme mode "Glass", frames 30:22 (Light)
  # and 32:169 (Dark). Keys are the --ns-* suffix from each variable's code syntax.
  bg: '#f0f0f3'
  bg-dark: '#111113'
  card: '#f9f9fb'
  card-dark: '#18191b'
  surface-raised: '#ffffffd1'
  surface-raised-dark: '#2b2e36c7'
  muted: '#f0f0f3'
  muted-dark: '#212225'
  selected: '#e6f4fe'
  selected-dark: '#0d2847'
  overlay: '#00000066'
  overlay-dark: '#000000a8'
  fg: '#1c2024'
  fg-dark: '#edeef0'
  muted-fg: '#60646c'
  muted-fg-dark: '#b0b4ba'
  inverse-fg: '#fcfcfd'
  inverse-fg-dark: '#111113'
  border: '#d9d9e0'
  border-dark: '#363a3f'
  border-subtle: '#e8e8ec'
  border-subtle-dark: '#272a2d'
  border-strong: '#b9bbc6'
  border-strong-dark: '#5a6169'
  input-border: '#80838d'
  input-border-dark: '#777b84'
  ring: '#0d74ce'
  ring-dark: '#0090ff'
  primary: '#0d74ce'
  primary-dark: '#0090ff'
  primary-hover: '#0d6fc6'
  primary-hover-dark: '#3b9eff'
  primary-fg: '#ffffff'
  primary-fg-dark: '#111113'
  primary-text: '#113264'
  primary-text-dark: '#70b8ff'
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
  material-fill: '#ffffff94'
  material-fill-dark: '#1f21298c'
  material-fill-strong: '#ffffffd1'
  material-fill-strong-dark: '#2b2e36c7'
  material-stroke: '#ffffffb8'
  material-stroke-dark: '#ffffff21'
  material-track: '#7575801f'
  material-track-dark: '#7575803d'
  shadow-color: '#0d0f1f1f'
  shadow-color-dark: '#00000073'
  aurora-1: '#8ec8f6'
  aurora-1-dark: '#2870bd'
  aurora-2: '#c2b5f5'
  aurora-2-dark: '#6958ad'
  aurora-3: '#ffc182'
  aurora-3-dark: '#7e451d'
  aurora-4: '#b2ddb5'
  aurora-4-dark: '#435db1'
  # Proposed S1 role (TD-24): the switch knob, measured on renders-r7. It equals primary-fg today;
  # bind the role, not primary-fg. A white dark knob would be a design change needing a re-render.
  switch-thumb: '#ffffff'
  switch-thumb-dark: '#111113'
typography:
  large-title: {
    fontFamily: Inter,
    fontSize: 34px,
    fontWeight: 700,
    lineHeight: 40px,
    letterSpacing: -0.9px,
  }
  kpi: { fontFamily: Inter, fontSize: 34px, fontWeight: 600, lineHeight: 40px, letterSpacing: -1px }
  heading: {
    fontFamily: Inter,
    fontSize: 17px,
    fontWeight: 600,
    lineHeight: 22px,
    letterSpacing: -0.3px,
  }
  body: {
    fontFamily: Inter,
    fontSize: 14px,
    fontWeight: 400,
    lineHeight: 20px,
    letterSpacing: -0.1px,
  }
  strong: {
    fontFamily: Inter,
    fontSize: 14px,
    fontWeight: 500,
    lineHeight: 20px,
    letterSpacing: -0.1px,
  }
  button: { fontFamily: Inter, fontSize: 14px, fontWeight: 600, lineHeight: 20px }
  segment: { fontFamily: Inter, fontSize: 13px, fontWeight: 500, lineHeight: 18px }
  small: {
    fontFamily: Inter,
    fontSize: 13px,
    fontWeight: 400,
    lineHeight: 18px,
    letterSpacing: -0.05px,
  }
  caption: { fontFamily: Inter, fontSize: 12px, fontWeight: 400, lineHeight: 16px }
  label: { fontFamily: Inter, fontSize: 12px, fontWeight: 500, lineHeight: 16px }
  data: {
    fontFamily: Inter,
    fontSize: 14px,
    fontWeight: 400,
    lineHeight: 20px,
    fontFeature: '"tnum" 1',
  }
rounded:
  none: 0px
  xs: 7px
  sm: 9px
  input: 10px
  md: 12px
  card: 22px
  lg: 24px
  xl: 26px
  full: 9999px
spacing:
  inset: 16px
  gutter: 24px
  stack: 18px
  grid: 12px
  card-padding: 16px
  form-padding: 20px
  control: 36px
  field: 32px
  grouped-row: 44px
  row: 52px
components:
  button-prominent: {
    backgroundColor: '{colors.primary}',
    textColor: '{colors.primary-fg}',
    typography: '{typography.button}',
    rounded: '{rounded.full}',
    height: 36px,
    padding: 0 16px 0 14px,
  }
  button-prominent-dark: {
    backgroundColor: '{colors.primary-dark}',
    textColor: '{colors.primary-fg-dark}',
  }
  button-capsule: {
    backgroundColor: '{colors.material-fill}',
    textColor: '{colors.fg}',
    typography: '{typography.button}',
    rounded: '{rounded.full}',
    height: 36px,
  }
  button-capsule-dark: {
    backgroundColor: '{colors.material-fill-dark}',
    textColor: '{colors.fg-dark}',
  }
  button-plain: { textColor: '{colors.primary-text}', typography: '{typography.button}' }
  search-field: {
    backgroundColor: '{colors.material-track}',
    textColor: '{colors.fg}',
    rounded: '{rounded.input}',
    height: 32px,
  }
  segmented-track: {
    backgroundColor: '{colors.material-track}',
    rounded: '{rounded.sm}',
    height: 32px,
    padding: 2px,
  }
  segment-selected: {
    backgroundColor: '{colors.material-fill-strong}',
    textColor: '{colors.fg}',
    typography: '{typography.segment}',
    rounded: '{rounded.xs}',
    height: 28px,
  }
  sidebar: { backgroundColor: '{colors.material-fill}', rounded: '{rounded.xl}', width: 248px }
  sidebar-item-selected: {
    backgroundColor: '{colors.material-track}',
    textColor: '{colors.fg}',
    rounded: '{rounded.sm}',
    height: 32px,
  }
  kpi-card: {
    backgroundColor: '{colors.card}',
    textColor: '{colors.fg}',
    rounded: '{rounded.lg}',
    padding: 16px 16px 14px,
  }
  list-row-selected: {
    backgroundColor: '{colors.primary}',
    textColor: '{colors.primary-fg}',
    rounded: '{rounded.md}',
    height: 52px,
  }
  list-row-selected-dark: {
    backgroundColor: '{colors.primary-dark}',
    textColor: '{colors.primary-fg-dark}',
  }
  grouped-group: { backgroundColor: '{colors.material-fill-strong}', rounded: '{rounded.md}' }
  toggle-on: {
    backgroundColor: '{colors.success}',
    rounded: '{rounded.full}',
    width: 51px,
    height: 31px,
  }
  toggle-off: {
    backgroundColor: '{colors.input-border}',
    rounded: '{rounded.full}',
    width: 51px,
    height: 31px,
  }
  notice: {
    backgroundColor: '{colors.card}',
    textColor: '{colors.fg}',
    rounded: '{rounded.card}',
    padding: 16px,
  }
---

# Cupertino

## Overview

- **Thesis:** Apple-inspired classic. One vibrant floating sidebar, a large-title header with
  capsule buttons, inset grouped lists, blur-only materials and full-row system-blue selection, with
  opaque slate content cards over a soft aurora. This is the owner-preferred hand-built composition,
  not a strict macOS 15 / iOS 18 reproduction.
- **Signature moves:**
  1. **Inset grouped editor.** 12px Medium uppercase section captions over 12px-radius groups of
     44px rows: label left, muted value right, a trailing chevron. This is the iOS Settings grammar
     inside a desktop form.
  2. **Full-row system-blue selection.** The selected order row fills edge to edge with `primary`.
     Every glyph on it turns `primary-fg` (white in light, `#111113` in dark), including the check
     circle (`primary-fg` disc, blue tick) and the avatar (`primary-fg` disc, blue initials). This
     echoes the macOS table highlight.
  3. **One vibrancy plane.** Only the floating sidebar and the header command capsules are
     translucent. Every content surface (KPI widgets, orders list, form, notice, activity) is opaque
     `card` with a 1px `material-stroke` rim.
- **Anchor:** Apple-inspired classic, using grouped-list and typography cues from the iOS 18 / macOS
  15 design resources. Taken: large titles, inset grouped lists, 51×31 switches, edit-mode selection
  circles, the segmented control (track plus raised thumb), traffic lights in a full-height sidebar,
  system-blue selection. The floating sidebar and capsule buttons are the owner-preferred
  composition, not platform-literal macOS 15 anatomy. Not copied: SF Pro, SF Symbols, Apple
  wallpapers, any Apple asset. Icons are Lucide.
- **Family:** Platform.
- **Best for:** Mac-like tools, settings-heavy admin, small-team back offices. **Avoid for:**
  nothing in the catalogue; it is the calm Apple option when Liquid's glass would distract.
- **Feel:** calm, familiar, tidy. First impression: "a Mac app I already know how to use."

### Composition boundary (owner decision, read before changing shapes)

**History.** The round-5 brief defined a strict macOS 15 / iOS 18 target ("bordered rounded-rect
push buttons", "no glass capsules, no lensing or refraction, no floating sheets"). The reviewer
turned that into G-08 and a rebuild spec (attached 208px sidebar, 6px-corner 28px buttons, docked
inspector). The owner rejected the result: "I don't like this classic version yours was way more
appealing and closer to real apple guidelines this looks like bootstrap". G-08 closed "by owner
rescope": "The old no-capsule/attached-inspector mandate is withdrawn." None of that rejected
anatomy describes the current theme.

**Current state.** Cupertino is the owner-preferred Apple-inspired classic composition: floating
sidebar, large-title header, capsule buttons, inset grouped lists, blur-only materials. Round 7
confirmed the pair (PASS) and recommends keeping it now. Whether to separate it further from Liquid
later is an open owner question; if pursued, it is an owner-directed local comparison, never another
wholesale rebuild.

What it never takes from Liquid: lensing, specular rims, a detached sheet, a floating selection bar,
glass on content, or the macOS 27 toolbar groups. The Figma frames still carry a `GLASS` effect on
the sidebar and capsules (refraction 0.50–0.55, author-reported). The web theme **proposes**
dropping that lensing and shipping blur plus tint only (classic vibrancy). That is a proposed web
approximation, not a verified equivalent: it needs an S6 (#2419) side-by-side comparison against the
Figma frames before it is accepted (GUIDELINES §3).

## Colors

- **Ground and surface ladder.** Canvas `bg` `#f0f0f3` / `#111113` (Radix slate 3 / slate-dark
  step 1) under four blurred aurora ellipses (`aurora-1…4`, LAYER_BLUR 170). Content cards are
  `card` `#f9f9fb` / `#18191b`. Grouped rows sit on `material-fill-strong` (white 82% / `#2b2e36`
  78%). Vibrancy is `material-fill` (white 58% / `#1f2129` 55%). There is no overlay in the
  specimen; `overlay` is `#00000066` / `#000000a8`.
- **Accent policy.** `primary` (blue l11 `#0d74ce` / blue d9 `#0090ff`) appears only as: the
  prominent capsule (New Order, Save Changes), the selected list row, a checked selection circle,
  the brand and avatar discs. Links and plain buttons (Review Orders, See All) use `primary-text`
  (`#113264` / `#70b8ff`), never the fill colour.
- **Status colours.** Status is a dot plus a word: 8px `success`/`warning`/`destructive`/`info` dot,
  label in `fg`. Tinted text uses the `*-text` roles: positive deltas `success-text`, the expired
  code `destructive-text`. Sparklines are 2px strokes in `primary-text`, `success-text`,
  `warning-text` and `destructive-text` (G-03).
- **Dark design notes.** Ground is tinted slate, not black. Elevation is lighter tint (`card`
  `#18191b`, grouped rows `#2b2e36` 78%). The aurora drops to deep tones (`#2870bd`, `#6958ad`,
  `#7e451d`, `#435db1`). The dark primary is saturated `#0090ff` with **dark** ink `#111113`
  (5.78:1). White on `#0090ff` is only 3.26:1, so never use white there. Rims fall to white 13%.

## Typography

- **Families.** Inter (OFL, Google Fonts) stands in for SF Pro, which cannot be embedded and renders
  blank from the Figma Plugin API. One family throughout; hierarchy is size and weight. Code stack:
  `Inter, -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`.
- **Scale (Theme mode `Glass`, bound on the frames).** Large title 34/40 Bold −0.9px ("Orders"). KPI
  34/40 Semi Bold −1px. Heading 17/22 Semi Bold −0.3px (the iOS headline size, used for "Order
  SO-10480" and "Activity"). Body 14/20 −0.1px. Strong 14/20 Medium. Small 13/18 −0.05px. Caption
  12/16. Label 12/16 Medium.
- **Literal styles (not yet tokens).** Buttons 14/20 Semi Bold. Segments 13/18: Medium at rest, Semi
  Bold when selected. Section captions are 12/16 Medium uppercase in `muted-fg`; sidebar section
  titles are 12/16 Semi Bold, title case.
- **Numerals.** Tabular figures for money, counts and dates (`data`). The Plugin API cannot set
  `tnum`, so this is owed to #2414.

## Layout

- **Window.** 1280×1366 specimen. Sidebar floats at x16/y16, 248×1334. Main column x288, 968 wide,
  24px right inset (G-06). Main stacks with an 18px gap and 18px top/bottom padding.
- **Header.** Large title plus a 14/20 muted subtitle on the left; three 36px capsules on the right
  (Filter, Export, New Order, 8px gap). Below them: segmented control left, 260×32 search right.
- **Grid.** Four KPI widgets 233×170, 12px gaps (4 × 233 + 3 × 12 = 968). Orders list full width.
  The bottom row is the order form (582) plus a side column (372) with a 14px gap (582 + 14 + 372 =
  968); side items stack with 14px.
- **Orders list columns.** Resolve the row grid from the container inward, never from a pixel total.
  Measured on `renders-r7/cupertino--light.png`: the 968px list card insets its rows by 7px per side
  (rows span x295–1248, 954 wide). Each row then has 8px side padding, leaving 938px. The fixed
  tracks are 40 + 104 + 124 + 150 + 128 + 104 + 36 = 686, and there is no column gap, so the
  customer track `minmax(0,1fr)` resolves to 252 at this width. The list does **not** use the 16px
  `card-padding`; with 16px it would leave only 234 for the customer. Keep the type sizes; at
  narrower widths the customer track shrinks and its email truncates, never the fixed columns.
  Re-resolve the customer width after a fresh layout export rather than copying 252.
- **Rows and fields** (Density Comfortable; no Density variable is bound, the sizes equal its
  values). Table rows 52, header 38. Grouped rows 44, or 64 with an error helper (G-05).
  Capsules 36. Search fields and the segmented track 32. Sidebar items 32 with 2px gaps; channel
  rows 30.
- **Orders fixture.** KPIs → segmented filter and search → orders list → order form beside the
  payment notice and activity feed. The editor is inline in the content flow, never a sheet.

## Elevation & Depth

Two planes, and nothing else gets depth.

| Level      | Recipe (CSS)                                                                                                                                                                                                                                    | Who gets it                                      |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 0 Canvas   | `background: var(--ns-bg)` plus four blurred aurora discs (`filter: blur(170px)`), hidden under Reduce Transparency                                                                                                                             | The window ground                                |
| 1 Content  | Opaque `var(--ns-card)`, `border: 1px solid var(--ns-material-stroke)`, **no shadow**                                                                                                                                                           | KPI widgets, orders list, form, notice, activity |
| 2 Vibrancy | `background: var(--ns-material-fill)`; `backdrop-filter: blur(18px)` (sidebar) or `blur(10px)` (capsules); `border: 1px solid var(--ns-material-stroke)`; `box-shadow: 0 10px 28px var(--ns-shadow-color)` (sidebar) or `0 4px 14px` (capsules) | The sidebar and the Filter/Export capsules only  |
| Thumb      | `box-shadow: 0 1px 3px, 0 3px 8px` at 12% black on `material-fill-strong`                                                                                                                                                                       | Selected segment                                 |
| Knob       | `0 3px 8px, 0 1px 1px` at 12% black                                                                                                                                                                                                             | Switch knob                                      |

- The Figma author reports the sidebar `GLASS` at radius 18, refraction 0.50, depth 16, dispersion
  0.20, and the capsules at radius 10 (prominent 4), refraction 0.55, depth 14, dispersion 0.25. The
  proposed web approximation keeps only the radius, as the blur above; whether blur-only matches the
  frames is unproven until the S6 (#2419) comparison.
- The prominent capsule is opaque `primary`; the proposal drops its Figma `GLASS` effect in CSS.
- **Accessibility preferences (not the default look).** Reduce Transparency (`81:1388`): the aurora
  is hidden, the sidebar falls back to opaque `card`, and capsules become `surface-raised`. Increase
  Contrast (`81:1850`): every card, capsule and sidebar rim becomes `border-strong` `#b9bbc6`. Both
  were last exported in round 5; they are not in the frozen round-7 set.

## Shapes

- Radii are not concentric by formula; they step by role. Sidebar and order form 26. KPI widgets and
  orders list 24. Notice and activity 22 (`radius/card`). Grouped groups and table rows 12. Search
  10 (`radius/input`). Sidebar items and segmented track 9. Segment thumb and icon tiles 7.
  Capsules, switches, selection circles and avatars are full pills (`radius/control` 999).
- Strokes are 1px inside. Grouped-row separators are 1px `border-subtle`, inset 16px from the
  leading edge. Table rows divide with a 1px bottom `border-subtle`.
- No notches, steps or hard offsets.

## Components

| Component         | Cupertino variant and anatomy                                                                                                                                                                                                                                                                                                               | States shown in Figma       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Buttons           | `Glass/Button`: Prominent (`primary` fill, `primary-fg` label), Glass (`material-fill`, 1px `material-stroke`, `fg` label), Plain (`primary-text` label, no fill). 36 tall, full pill, 16/14 padding, 16px icon, 6px gap                                                                                                                    | Rest only                   |
| Search field      | 32 tall, radius 10, `material-track` (sidebar) or `material-fill` (header), 1px `muted-fg` boundary (G-07), 15px magnifier, `fg` placeholder                                                                                                                                                                                                | Rest only                   |
| Segmented control | 32 track, `material-track`, radius 9, 2px inset; 28px segments, radius 7; the selected thumb is `material-fill-strong` with two soft shadows                                                                                                                                                                                                | Selected / unselected       |
| Selection circle  | 20px; unchecked: 1.5px `input-border` ring; checked: `primary` disc with a white tick; inside a selected row: `primary-fg` disc (white light, `#111113` dark), blue tick                                                                                                                                                                    | Checked / unchecked         |
| Switch            | 51×31, 27px knob in its own `switch-thumb` role (proposed, register in S1 #2414): white `#ffffff` in light, `#111113` in dark, as measured on the frozen renders. The knob's current Figma binding is not exported; don't bind the knob to `primary-fg` even though the values match today. On: `success`. Off: `input-border` track (G-02) | On / off                    |
| Table row         | 52 tall, radius 12, 8px side padding, 1px bottom `border-subtle`, no column gap. Tracks: `40px 104px minmax(0,1fr) 124px 150px 128px 104px 36px` (select, order, customer with a 28px avatar plus name/email, channel, status, date, total, overflow). See _Layout_ for the arithmetic                                                      | Rest / selected             |
| Status            | 8px tone dot plus 14px `fg` word: Paid, Awaiting payment, Shipped, Refunded, Payment failed                                                                                                                                                                                                                                                 | Five tones                  |
| KPI widget        | 233×170, radius 24, 26px tinted icon tile (radius 7), label 14 Semi Bold, value `kpi`, delta 14 Semi Bold in `success-text`/`destructive-text` plus 12/16 "vs last month", 2px sparkline 28 tall                                                                                                                                            | Rest                        |
| Grouped list      | Section caption (12px uppercase, 16px leading inset) over a radius-12 group of 44px rows; value rows show muted value plus chevron; the toggle row has a 51×31 switch                                                                                                                                                                       | Value, input, toggle, error |
| Error row         | Label and value in `destructive-text`, a trailing alert icon, then a full-width 12/16 helper below the value: "This code expired on Oct 15. Remove it or choose another." (G-05)                                                                                                                                                            | Error                       |
| Notice            | Opaque card, radius 22, 16 padding; 26px `warning` icon tile; 14 Semi Bold title, 14 muted body, Plain "Review Orders" button                                                                                                                                                                                                               | Rest                        |
| Nav item          | 32 tall, radius 9, 10px gap, 16px Lucide icon in `primary-text`; selected = `material-track` fill plus Semi Bold label and `fg` count                                                                                                                                                                                                       | Rest / selected             |
| Top bar           | No toolbar strip. A large title in the content column; capsules on the same row. Traffic lights live in the sidebar: 12px at a 20px pitch                                                                                                                                                                                                   | —                           |
| Dialog / sheet    | Not in the specimen. Use native `<dialog>` as an opaque `card` panel at radius 26 over `overlay`; never a glass sheet (that is Liquid)                                                                                                                                                                                                      | Owed to #2416               |
| Signature         | The inset grouped editor and the full-row blue selection                                                                                                                                                                                                                                                                                    | —                           |

Hover, pressed, focus and disabled are not drawn for any Cupertino component. They are owed to
#2416. Until then, use the platform physics in _Motion & States_.

## Do's and Don'ts

- **Do** keep the hand-built composition. A spec-literal rebuild was rejected: "this looks like
  bootstrap".
- **Do** keep capsules and the floating sidebar. G-08's no-capsule mandate is withdrawn.
- **Don't** describe or rebuild Cupertino as strict macOS 15 / iOS 18 (opaque attached sidebar,
  bordered push buttons). It is Apple-inspired classic; further separation from Liquid is an owner
  decision, made by local comparison.
- **Don't** ship lensing, refraction, dispersion or specular rims. Those belong to Liquid, and the
  owner asked for the two looks to stay apart: "the classic one still too much s mix if the two".
  Blur-only CSS is the proposed approximation of the Figma frames, pending S6 (#2419) proof.
- **Don't** put material on content. KPI widgets, the list, the form, the notice and activity stay
  opaque `card` (G-01).
- **Do** give every editable boundary `muted-fg` at 1px, including search on the vibrant plane
  (G-07: 4.10, 4.87 and 5.22:1 measured).
- **Do** paint unchecked circles and off-switch tracks in `input-border` (G-02).
- **Do** draw sparklines in the `*-text` roles at 2px. Never in raw `success`/`warning` fills (G-03;
  the yellow line was 1.26:1).
- **Do** keep the editable value and its error apart: value `AUTUMN24`, then a 12/16 helper line
  (G-05).
- **Do** align to the 16/24 outer grid: inset 16, sidebar 248, gap 24, content at x288 (G-06).
- **Don't** put white text on dark `#0090ff`. Use `primary-fg` `#111113`. The switch knob is not
  text: give it the `switch-thumb` role, not `primary-fg`.
- **Don't** show a white header, white slab or white perimeter in dark. Rims stay at 13% white.
- **Do** ship the Reduce Transparency and Increase Contrast variants with every screen (G-04).
- **Don't** import the unused `cupertino/*` roles into new screens. They belong to the rejected spec
  rebuild (see _NetScript Mapping_).

## Iconography & Imagery

- Lucide (ISC), 1.5–2px stroke: 16px in nav and buttons, 15px in tiles and search, 14px chevrons.
  Nav icons are `primary-text`. KPI icons sit white on a 26px tinted tile (`primary`, `success`,
  `warning`, `destructive`).
- Avatars: 28px circles with 12px Semi Bold initials. Neutral in rows; white with blue initials on
  the selected row. The profile avatar is a 32px `primary` disc.
- Backdrop: four blurred aurora discs on `bg`. Never a photo, never Apple wallpaper. Remove it under
  Reduce Transparency.

## Motion & States

- Not drawn in Figma; owed to #2416 (states) and #2419 (runtime). Platform-inspired defaults: hover
  lifts a capsule one material step (`material-fill` → `material-fill-strong`); press darkens 8%
  without movement; row selection fills instantly; the switch knob travels in 150–200ms ease-out;
  the segmented thumb slides.
- Focus: 2px `ring` outline, 2px offset, following the capsule or row radius.
- Reduced motion: no thumb or knob travel. Reduce Transparency removes blur and aurora.

## Accessibility

Measured on `renders-r7` pixels (byte-identical to the r5/r6 exports) and resolved tokens (WCAG
2.2):

| Pair                                     | Light                      | Dark                        |
| ---------------------------------------- | -------------------------- | --------------------------- |
| Label on primary (row, New Order, Save)  | `#ffffff`/`#0d74ce` 4.77:1 | `#111113`/`#0090ff` 5.78:1  |
| `muted-fg` on `card`                     | 5.65:1                     | 8.45:1                      |
| `success-text` delta on `card`           | 4.82:1 (G-03)              | `#71d083` 9.26:1            |
| `primary-text` link on `card`            | 12.00:1                    | 8.37:1                      |
| Off-switch track `input-border` vs group | `#80838d`/white 3.78:1     | `#777b84`/`#2b2e36` 3.20:1  |
| Header search boundary (G-07, reviewer)  | 4.10:1                     | 4.87:1 (preferences 5.22:1) |

- Hit targets: capsules 36, rows 52, grouped rows 44, segments 28, switches 31. The 20px circle hits
  through its 40×52 cell.
- Focus indicators are not drawn yet (#2416).
- RTL: mirror the sidebar, chevrons and trailing values; keep the traffic lights on the leading
  edge.

## NetScript Mapping

| Layer              | Value                                                                                                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Figma Theme mode   | `Glass` (mode `14:1`). Set explicitly on all four Cupertino frames, and **also** on both Liquid windows (`93:736`, `97:786`); the 10-mode ceiling forces the share                                                |
| Base gray × accent | The frames resolve Base gray `Neutral` × Base accent `Ink` by default, but the `Glass` mode's own `gray/*` and `accent/*` alias Radix **slate × blue** directly (`surface/bg` → `surface/l/canvas` → `slate/l/3`) |
| Density            | Comfortable (default; not bound)                                                                                                                                                                                  |
| Flavor             | n/a                                                                                                                                                                                                               |
| `data-theme`       | `cupertino`                                                                                                                                                                                                       |
| Language roles     | `cupertino/*`: 27 Scheme roles, `--ns-cupertino-*`. **Bound 0 times** in the hand-built frames (304 of 304 paints bind core roles). All 324 paints of the rejected spec frames bind them.                         |

- **Node-level exceptions:** no primitive is bound. Corner radii are literal values, not bound to
  `radius/*`: 24 and 26 differ from `radius/card` 22. Reduce Transparency capsules use
  `surface-raised` (82% alpha), not an opaque role.
  - **r7 audit (report only; no change).** Both frames have 0 bound radii. The literals per frame:
    - **24 ×5:** the KPI widgets `30:163`, `30:178`, `30:192`, `30:205` and the Orders list
      `30:218`. In dark: `32:230`, `32:241`, `32:252`, `32:263`, `32:274`.
    - **26 ×2:** the Sidebar `30:27` / `32:174` and the Order form `31:126` / `32:418`.
    - **Others:** 22 ×2, 12 ×9, 10 ×2, 9 ×6, 7 ×10, 999 ×26.
  - **Reconcile:** S1 must either add a 24 / 26 container tier or snap these to `radius/card`. The
    second option changes the look.
- **Open decision for S1 (#2414):** delete `cupertino/*`, or keep it as the Cupertino resolver mode
  once Theme has no ceiling. Don't bind it piecemeal.
- **Figma frames:** Light `30:22`, Dark `32:169`, Reduce Transparency `81:1388`, Increase Contrast
  `81:1850`. Components: `Glass/Button` `29:22`, `Glass/Segment` `29:27`, `Glass/Search field`
  `29:33`, `Glass/Toggle` `29:38`, `Glass/Selection circle` `29:43`, `Glass/Sidebar item` `29:58`,
  `Glass/Status` `29:74`, `Glass/Grouped row` `29:99`. Rejected, record only: `113:1183`,
  `117:5699`. No state sheet exists.
- **Renders:** `renders-r7/cupertino--{light,dark}.png` (byte-identical to r5 and r6); rejected,
  record only: `renders-r7/cupertino-spec-rejected--{light,dark}.png`. The preference exports
  `renders-r5/cupertino--light--{reduce-transparency,increase-contrast}.png` are **not in the frozen
  round-7 set**: their round-5 PASS is carried, not re-exported.
- **Switch knob (TD-24).** The frozen dark render paints the knob `#111113` (light `#ffffff`), the
  same values as `primary-fg`. Which variable the knob binds is not exported. S1 (#2414) should
  register an explicit `switch-thumb` role with these values. If the owner or S1 prefers a white
  knob in both schemes, that is a design change and needs a re-render.
- **Evidence status (TD-25).** Visual claims refer to the frozen round-7 renders
  `renders-r7/cupertino--{light,dark}.png` and
  `renders-r7/cupertino-spec-rejected--{light,dark}.png` under
  `.llm/runs/design-system-s4--language-review/`, hashed in `renders-r7/SHA256SUMS` (sha256
  `092b1cd4…`; review input commit `affd6b158`). Node ids, variable modes, alias and
  `resolveForConsumer` chains, binding and unbound counts, effect-style values and Figma text-style
  weights in this file are **reported by the Figma author and independently unverified**: no frozen
  node/variable/effect/type export accompanies the snapshot. Ratios marked _measured_ were sampled
  on exported pixels; _(token)_ ratios are resolved-variable arithmetic; values marked _proposed_
  stay proposals until a re-render proves them; runtime behaviour is unproven until #2419.

## Provenance

- **Sources.** [Apple Design Resources](https://developer.apple.com/design/resources/) (the iOS 18
  and iPadOS 18 kit is subscribed in the file as a library, author-reported; used for cues, not as a
  fidelity target);
  [HIG Materials](https://developer.apple.com/design/human-interface-guidelines/materials);
  [WWDC20 Adopt the new look of macOS](https://developer.apple.com/videos/play/wwdc2020/10104/).
- **Review rounds** (Codex, run `design-system-s4--language-review`): r2 as "Glass" raised G-01 to
  G-06; r3 and r4 kept G-04, G-06 and G-07 open; r5 raised G-08 ("Liquid-era anatomy"). **r6: design
  PASS** for light, dark, reduce-transparency and increase-contrast; G-01 to G-08 closed, G-08 by
  owner rescope. **r7: confirmation only**, light and dark PASS on the frozen renders; the
  preference-variant PASS is carried from round 5 with no round-7 export. Round-2 findings are
  retained, but round 2's runtime was not attested as `gpt-6-astra`/`xhigh`; the rounds whose
  runtime was attested are identified in `review/worklog.md`.
- **Separation question (open owner decision; round-7 recommendation only):** keep the current
  owner-preferred pair now and describe it as Apple-inspired classic, not strict macOS 15 / iOS 18
  fidelity. Any later push toward a stricter pre-Liquid look is an owner-directed local comparison,
  not a wholesale rebuild.
- **Owner decisions (verbatim):**
  - "Glass styling doesn't look at all like LATEST Apple Designs System it looks outdated";
  - "Note that apple we could keep this as classic Apple and go all in glass design for another
    variant if it's different enough, you're call";
  - "the classic one still too much s mix if the two";
  - "I don't like this classic version yours was way more appealing and closer to real apple
    guidelines this looks like bootstrap".
- **Historical only:** `review/cupertino.redesign.json` and `review/apple-pair.md`. Facts still held
  from them: Inter in Figma with the system UI stack at runtime, and darker functional blues for
  normal text.
- **Invented fixture content:** Northwind store, all names and emails, SO-10477 to SO-10482,
  amounts, channel counts (1,904 / 412 / 866; other themes show different splits), the synthetic
  30-day sparkline series (accepted under G-03), the tracking number and `AUTUMN24`.
- **Open evidence:** #2414 (token names, fonts, `tnum`, full contrast matrix), #2416 (state sheet,
  focus, accessible names), #2419 (keyboard, scroll, live preferences).
