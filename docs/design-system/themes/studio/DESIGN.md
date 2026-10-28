---
version: alpha
name: Studio
description: One component anatomy, seven products. Studio flavors change ground, shape, type, density and component variants on a shadcn/Linear-grade base; Utility is the NetScript default.
colors:
  # Flavor Utility = Theme Studio × Base gray Neutral × Base accent Ink × Density Compact: the
  # refined NetScript default, frozen in round 7 (renders-r7/studio--neutral-ink--{light,dark}.png).
  # Light value, then the Dark twin (`-dark`). "measured" = sampled on those frozen renders; other
  # values are resolved variables reported by the Figma author (frames 10:4277 / 10:5518).
  bg: '#ffffff'
  bg-dark: '#18181a'
  surface: '#f6f6f6'
  surface-dark: '#1e1e21'
  card: '#ffffff'
  card-dark: '#18181a'
  surface-raised: '#ffffff'
  surface-raised-dark: '#222225'
  muted: '#f0f0f0'
  muted-dark: '#26262a'
  selected: '#f0f0f0' # selected-row fill, measured
  selected-dark: '#2a2a2a'
  fg: '#202020'
  fg-dark: '#eeeeee'
  muted-fg: '#646464' # text/subtle resolves to the same value (S-01)
  muted-fg-dark: '#b4b4b4'
  border: '#d9d9d9' # gray 6: soft borders on toolbar buttons, kbd and chips, measured
  border-dark: '#3a3a3a'
  border-subtle: '#e4e4e4' # author-resolved before round 7; not re-sampled
  border-subtle-dark: '#2c2c30'
  input-border: '#838383' # core role (gray 10); Utility fields read studio-input-border
  input-border-dark: '#7b7b7b'
  ring: '#202020' # 2px ink focus ring with a 2px gap, measured
  ring-dark: '#7b7b7b'
  primary: '#202020'
  primary-dark: '#313131'
  primary-hover: '#3f3f3f'
  primary-hover-dark: '#3a3a3a'
  primary-fg: '#fcfcfc'
  primary-fg-dark: '#eeeeee'
  success-text: '#2a7e3b'
  success-text-dark: '#71d083'
  warning-subtle: '#fff7c2'
  warning-subtle-dark: '#302008'
  warning-text: '#4f3422'
  warning-text-dark: '#ffca16'
  destructive: '#e5484d' # error boundary; with destructive-text, the only red besides the logo
  destructive-text: '#641723'
  destructive-text-dark: '#ff9592'
  info-text: '#113264'
  info-text-dark: '#70b8ff'
  studio-signal-brand: '#da291c' # Swiss red, logo square only, measured
  studio-signal-brand-dark: '#e5332a'
  studio-signal-marker: '#202020' # 6px location square and 2px selected-row bar, measured
  studio-signal-marker-dark: '#eeeeee'
  studio-signal-underline: '#bbbbbb' # link underline, gray 8
  studio-signal-underline-dark: '#606060'
  studio-input-border: '#8d8d8d' # gray 9: field, checkbox and switch boundaries, measured (3.32:1)
  studio-input-border-dark: '#6e6e6e' # measured, 3.48:1 on #18181a
  studio-primary-bg: '#202020'
  studio-primary-bg-dark: '#313131'
  studio-primary-fg: '#fcfcfc'
  studio-primary-fg-dark: '#eeeeee'
  studio-primary-stroke: '#202020'
  studio-primary-stroke-dark: '#7b7b7b' # S-18, closed in round 7
  studio-topbar-rule: '#e0e0e0' # gray 5 structural hairline, 1px, measured
  studio-topbar-rule-dark: '#313131'
  studio-table-head-rule: '#e0e0e0' # measured
  studio-table-head-rule-dark: '#313131'
  studio-table-row-rule: '#f0f0f0' # quiet row rule, measured
  studio-table-row-rule-dark: '#2a2a2a'
  studio-card-border: '#e0e0e0' # 1px top hairline on cards and KPI columns, measured
  studio-card-border-dark: '#313131'
  studio-code-scroll-thumb: '#838383' # docs code-block scrollbar thumb, gray 10 (DS-02): 3.51:1 on #f6f6f6
  studio-code-scroll-thumb-dark: '#7b7b7b' # 3.93:1 on #1e1e21
  studio-topbar-bg: '#ffffff'
  studio-topbar-bg-dark: '#18181a'
typography:
  title: {
    fontFamily: Host Grotesk,
    fontSize: 48px,
    fontWeight: 500,
    lineHeight: 52px,
    letterSpacing: -0.025em,
  }
  heading: {
    fontFamily: Host Grotesk,
    fontSize: 15px,
    fontWeight: 600,
    lineHeight: 22px,
    letterSpacing: -0.2px,
  }
  kpi: {
    fontFamily: Host Grotesk,
    fontSize: 40px,
    fontWeight: 400,
    lineHeight: 44px,
    letterSpacing: -0.025em,
    fontFeature: '"tnum" 1, "lnum" 1',
  }
  body: { fontFamily: Host Grotesk, fontSize: 14px, fontWeight: 400, lineHeight: 22px }
  strong: { fontFamily: Host Grotesk, fontSize: 14px, fontWeight: 500, lineHeight: 22px }
  small: { fontFamily: Host Grotesk, fontSize: 13px, fontWeight: 400, lineHeight: 18px }
  label: {
    fontFamily: Fragment Mono,
    fontSize: 11px,
    fontWeight: 400,
    lineHeight: 16px,
    letterSpacing: 0.6px,
  }
  data: {
    fontFamily: Fragment Mono,
    fontSize: 13px,
    fontWeight: 400,
    lineHeight: 18px,
    fontFeature: '"tnum" 1',
  }
  prose-body: { fontFamily: Host Grotesk, fontSize: 16px, fontWeight: 400, lineHeight: 26px }
  prose-lede: { fontFamily: Host Grotesk, fontSize: 19px, fontWeight: 400, lineHeight: 30px }
  prose-h1-sm: { fontFamily: Host Grotesk, fontSize: 36px, fontWeight: 500, lineHeight: 40px }
  prose-h2: {
    fontFamily: Host Grotesk,
    fontSize: 26px,
    fontWeight: 500,
    lineHeight: 34px,
    letterSpacing: -0.4px,
  }
  prose-h3: {
    fontFamily: Host Grotesk,
    fontSize: 19px,
    fontWeight: 500,
    lineHeight: 28px,
    letterSpacing: -0.2px,
  }
  prose-h4: { fontFamily: Host Grotesk, fontSize: 16px, fontWeight: 500, lineHeight: 24px }
  prose-code: { fontFamily: Fragment Mono, fontSize: 13px, fontWeight: 400, lineHeight: 22px }
rounded: { control: 0px, input: 0px, card: 0px, badge: 2px, checkbox: 2px, full: 9999px }
spacing:
  control-height: 32px
  control-height-sm: 28px
  control-padding-x: 12px
  inline-gap: 8px
  section-gap: 16px
  card-padding: 16px
  page-padding-x: 24px
  table-row-height: 44px
  topbar-height: 48px
  badge-height: 20px
  kpi-gap: 24px
  marker-size: 6px
  marker-gap: 8px
  selected-bar-width: 2px
  focus-ring-width: 2px
  focus-ring-offset: 2px
  icon-stroke: 1.5px
  prose-measure: 544px
  prose-wide: 720px
components:
  button-primary: {
    backgroundColor: '{colors.studio-primary-bg}',
    textColor: '{colors.studio-primary-fg}',
    typography: '{typography.strong}',
    rounded: '{rounded.control}',
    height: 32px,
    padding: 0 12px,
  }
  button-primary-dark: {
    backgroundColor: '{colors.studio-primary-bg-dark}',
    textColor: '{colors.studio-primary-fg-dark}',
    rounded: '{rounded.control}',
    height: 32px,
  }
  button-secondary: {
    backgroundColor: '{colors.card}',
    textColor: '{colors.fg}',
    typography: '{typography.strong}',
    rounded: '{rounded.control}',
    height: 32px,
  }
  input: {
    backgroundColor: '{colors.card}',
    textColor: '{colors.fg}',
    typography: '{typography.body}',
    rounded: '{rounded.input}',
    height: 32px,
    padding: 0 12px,
  }
  input-dark: {
    backgroundColor: '{colors.card-dark}',
    textColor: '{colors.fg-dark}',
    rounded: '{rounded.input}',
    height: 32px,
  }
  nav-item-active: {
    textColor: '{colors.fg}',
    typography: '{typography.strong}',
    height: 30px,
    padding: 6px 10px,
  }
  location-marker: {
    backgroundColor: '{colors.studio-signal-marker}',
    rounded: '{rounded.control}',
    width: '{spacing.marker-size}',
    height: '{spacing.marker-size}',
  }
  location-marker-dark: {
    backgroundColor: '{colors.studio-signal-marker-dark}',
    rounded: '{rounded.control}',
    width: '{spacing.marker-size}',
    height: '{spacing.marker-size}',
  }
  eyebrow: { textColor: '{colors.muted-fg}', typography: '{typography.label}' }
  link: { textColor: '{colors.fg}', typography: '{typography.strong}' }
  table-header: { textColor: '{colors.muted-fg}', typography: '{typography.label}', height: 32px }
  table-row-selected: {
    backgroundColor: '{colors.selected}',
    textColor: '{colors.fg}',
    typography: '{typography.small}',
    height: 44px,
  }
  table-row-selected-dark: {
    backgroundColor: '{colors.selected-dark}',
    textColor: '{colors.fg-dark}',
    typography: '{typography.small}',
    height: 44px,
  }
  file-path-chip: {
    backgroundColor: '{colors.surface}',
    textColor: '{colors.fg}',
    typography: '{typography.data}',
    rounded: '{rounded.badge}',
  }
  badge-success: {
    textColor: '{colors.success-text}',
    typography: '{typography.label}',
    rounded: '{rounded.badge}',
    height: 20px,
    padding: 0 6px,
  }
  kpi-value: { textColor: '{colors.fg}', typography: '{typography.kpi}' }
  notice-warning: {
    backgroundColor: '{colors.warning-subtle}',
    textColor: '{colors.fg}',
    rounded: '{rounded.card}',
    padding: 12px 14px,
  }
  topbar: { backgroundColor: '{colors.studio-topbar-bg}', textColor: '{colors.fg}', height: 48px }
---

# Studio

<!-- Format: Google Labs DESIGN.md (alpha). Values resolved from Figma file pGRLnkPPRZJZy74evNcQBr,
page "Theme direction" (6:2), on 2026-10-27; Utility updated on 2026-10-28 to the refined NetScript
default frozen in round 7. Front matter = Utility flavor; the other six flavors are in the "Flavors"
extension section. Names are provisional until S1 #2414. -->

## Overview

- **Thesis:** one component anatomy, seven products. A Studio flavor changes the ground, shape, type
  pairing, density and component variant of the same Orders anatomy, so each flavor reads as a
  different product at a 480px thumbnail.
- **Utility is the NetScript default theme.** Its first use is the docs site. The refined Utility is
  a monochrome system with one red mark, frozen in round 7
  (`renders-r7/studio--neutral-ink--{light,dark}.png`, `utility--before-after.png`):
  - sharp geometry: radii 0 on controls, inputs and cards, 2px on badges, kbd, chips and checkboxes;
  - soft 1px hairlines: structural rules #e0e0e0 / #313131 (gray 5), row rules #f0f0f0 / #2a2a2a;
  - ink location: a 6px ink square marks the active nav lane, tab, segment and filter, and the
    selected row gets a 2px ink bar;
  - a 2px ink focus ring with a 2px gap (#202020 / #7b7b7b);
  - field, checkbox and switch boundaries in gray 9 (#8d8d8d / #6e6e6e, ≥ 3:1);
  - **red only in the logo (#DA291C / #E5332A) and in errors**;
  - a Medium title and Regular KPI numerals, both at −2.5% tracking;
  - a mono voice: Fragment Mono for eyebrows, IDs, column heads, breadcrumbs, kbd and chips;
  - 1.5px icon strokes, and file-path and `data-*` attribute chips as copy-source cues.
- **Signature moves:**
  1. **Variant-by-variable.** Card, KPI, tabs, table, badge and top bar change anatomy through the
     `Studio flavor` collection (border sides, row gap and radius, tab track, corner ticks, hard
     offsets, signal and prose variables), not through forked components.
  2. **Precision craft.** 1px-exact rules, one neutral ramp with step roles, a restrained accent, a
     complete 2px/2px focus ring and `⌘K` key hints, as in the shadcn and Linear anchors.
  3. **Designed, tinted darks.** Each flavor has its own dark ground hue (graphite, navy, roasted
     brown, aubergine, teal-black, olive-black, green-black). Dark primaries are graphite or deep
     keys with an accent edge or ink, never a pale slab.
- **Anchor:** shadcn/ui 2026 styles (MIT) and Linear (observed only), with Geist (OFL fonts) and
  AlignUI (MIT code only). Take ring borders, one neutral ramp with step roles, label/mono pairs,
  restrained accent, key hints. Never copy the Vercel marks, Linear chrome or AlignUI's Figma Pro.
- **Family:** System. **Best for:** SaaS, admin and docs (Utility). **Avoid:** Playful for formal
  finance, Ledger for consumer onboarding. **Feel (Utility):** exact, quiet, Swiss, premium — "a
  printed spec sheet that happens to be interactive".

## Colors

- **Ladder (Utility):** canvas `bg` #ffffff → `surface` #f6f6f6 → `muted` #f0f0f0 →
  `container-highest` #e0e0e0. Cards have **no fill** (`studio/card/bg` transparent); structure
  comes from rules. Dark: #18181a → #1e1e21 → #26262a → #313131; raised #222225.
- **Accent policy (Utility):** Base accent Ink makes `primary` the ink itself (#202020, dark
  #313131). Location, selection, links and focus are ink too: `studio/signal/marker` #202020 /
  #eeeeee. **Red appears only in the logo and in errors** (owner: "Apart from the logo no red except
  for error"). There are no red markers, links, hairlines or focus rings. Status colours (success,
  warning, info) stay for badges and notices.
- **Logo red vs error red** (a documented pair; they differ in form as well as hue):

  | Role                                                                                    | Light   | Dark    | Use                                                                                                     |
  | --------------------------------------------------------------------------------------- | ------- | ------- | ------------------------------------------------------------------------------------------------------- |
  | `studio/signal/brand` (`--ns-studio-signal-brand`, primitive `color/swiss-red/{l,d}/9`) | #DA291C | #E5332A | Logo only: a filled 24px square carrying the N (4.87:1 on #ffffff, 4.09:1 on #18181a; logos are exempt) |
  | `destructive`                                                                           | #E5484D | #E5484D | Invalid field boundary, destructive solid                                                               |
  | `destructive-text`                                                                      | #641723 | #FF9592 | Error message text, always with an icon and a message                                                   |

- **Accent policy (other flavors):** the accent moves onto primary actions, the focus ring, the
  selected row tint and the brand mark; it never fills large surfaces except Playful's KPI tiles and
  hero.
- **Status (Radix, shared by all flavors):** text roles are step 12 light / step 11 dark
  (`success-text` #2a7e3b / #71d083, `warning-text` #4f3422 / #ffca16, `destructive-text` #641723 /
  #ff9592, `info-text` #113264 / #70b8ff). Field error borders use `destructive` #e5484d.
- **Dark design notes:** grounds are tinted, never #000. Elevation is a lighter tint
  (`surface-raised`), not a shadow. Utility dark primary is graphite #313131 with a #7b7b7b keyline
  (S-18, closed in round 7); dark markers and the selected-row bar are light ink #eeeeee, and the
  dark focus ring is gray #7b7b7b. Signal dark primary is a #222222 key with lime #bde56c ink (S-19,
  closed), and Signal's core `primary` is now aligned to the same #222222 key (it was #1f2917;
  author-reported). Workshop dark solid badges use deep-tone pairs (e.g. #25482d with #71d083).

## Typography

One pairing per flavor (see _Flavors_), bound through `font/{sans,heading,label,data,kpi,mono}`.
Every family is OFL on Google Fonts (Host Grotesk, Fragment Mono, Figtree, Manrope, Instrument Sans,
Bricolage Grotesque, Nunito, Fredoka, IBM Plex Sans Condensed/Mono, Hanken Grotesk, Newsreader,
Geist Mono, Space Mono, DM Mono). Fallbacks: `system-ui, sans-serif`; `ui-monospace, monospace`.

- **Utility scale:** title 48/52 Medium at −2.5% (−1.2px); KPI 40/44 Regular at −2.5% (−1px);
  heading 15/22 SemiBold; body 14/22; small 13/18 (table cells, nav); caption 12/16.
- **Utility mono voice:** Fragment Mono for eyebrows and column heads (11/16, +0.6px, uppercase,
  `muted-fg`), IDs, paths, commands, breadcrumbs, kbd and chips (13px in table cells as rendered;
  12/16 for chips and breadcrumbs). JetBrains Mono is no longer part of Utility.
- **Prose scale** (`--ns-studio-prose-*`, identical in every flavor; the docs site uses it):

  | Role                  | Size / line / tracking          | Weight  | Token                                                 |
  | --------------------- | ------------------------------- | ------- | ----------------------------------------------------- |
  | Body                  | 16 / 26                         | Regular | `--ns-studio-prose-body-{size,line}`                  |
  | Lede                  | 19 / 30                         | Regular | `--ns-studio-prose-lede-{size,line}`                  |
  | H1, mobile            | 36 / 40                         | Medium  | `--ns-studio-prose-h1-sm-{size,line}`                 |
  | H2                    | 26 / 34 / −0.4px                | Medium  | `--ns-studio-prose-h2-{size,line,tracking}`           |
  | H3                    | 19 / 28 / −0.2px                | Medium  | `--ns-studio-prose-h3-*`                              |
  | H4                    | 16 / 24                         | Medium  | `--ns-studio-prose-h4-*`                              |
  | Code                  | Fragment Mono 13 / 22           | Regular | `--ns-studio-prose-code-{size,line}`                  |
  | Measure / wide column | 544px (≈ 72 characters) / 720px | —       | `--ns-studio-prose-measure`, `--ns-studio-prose-wide` |
- **Numerals:** KPI, totals and IDs must be tabular lining figures
  (`font-variant-numeric:
  tabular-nums lining-nums`). Figma cannot set this; it is owed to
  #2414/#2416 (S-10).
- **Label case:** sentence case for UI labels. Utility eyebrows and column heads are uppercase mono;
  Signal uppercases badge words inside brackets (`[PAID]`).

## Layout

- **Fixture (1280px):** top bar → page header (breadcrumb, title, subtitle, two actions) → four KPIs
  → orders table card (segmented filter, filter input, Status, date range; 6 rows; footer with
  pagination) → bottom row: order form card (≈ 2/3) beside a side column with a warning notice and a
  recent-activity card.
- **Density is a flavor choice** (Density collection): Utility Compact (control 32, row 44, card
  padding 16, page padding 24/20); Cloud Comfortable (36/52/20/32); Workshop and Playful Chunky
  (44/56/24/32); Ledger and Signal Dense (28/32/12/20); Atelier Airy (40/56/28/56).
- **Frame names** now state these densities (corrected before round 7; author-reported).
- **Rhythm:** 4px grid. Utility KPI gap 24, tab gap 20, field rows 78 (label 18 + 6 + input 32 + 6 +
  helper 16). Vertical lists reserve a 6px marker slot plus an 8px gap, so labels never shift when
  the marker appears. Cloud adds a 16px frame inset so the top bar floats.

## Elevation & Depth

Depth is a flavor property. Rule: only things that float or press get a shadow; everything else is
separated by rules or tint.

| Flavor                           | Recipe (CSS)                                                                            | Applied to                                     |
| -------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Utility, Ledger, Atelier, Signal | none (`shadow/blur` 0)                                                                  | — structure is rules and tints                 |
| Cloud                            | `0 12px 32px #1428501f` (dark `#02041099`); top bar `0 6px 24px`; tab thumb `0 1px 2px` | white platters, floating top bar, selected tab |
| Workshop                         | hard offset `4px 4px 0 #3a2e22` (dark `#050301f2`); buttons `3px 3px 0`                 | cards, KPIs, table, buttons                    |
| Playful                          | none; depth by pastel tint and the dark-pinned hero                                     | KPI tiles, hero                                |

**Focus (all flavors):** a 2px `ring` at a 2px offset, drawn as
`box-shadow: 0 0 0 2px var(--ns-card),
0 0 0 4px var(--ns-ring)` (or
`outline: 2px solid var(--ns-ring); outline-offset: 2px`), with sharp corners in Utility. It covers
all four sides of the control and is never clipped (S-05). Utility's ring is ink #202020 in light
and gray #7b7b7b in dark. Atelier's ring is ink/gray through the flavor `ring/{l,d}` variables.

## Shapes

- **Radius sets** (control / input / card / badge): Utility 0/0/0/2, Cloud 10/10/20/999, Workshop
  6/6/6/4, Playful 999/18/28/999, Ledger 2/2/2/2, Atelier 0/0/0/0, Signal 2/2/2/0. Checkboxes are
  4px and switches full in every flavor.
- **Strokes:** `border/width` 1px (Workshop 1.5px). Utility separations are quiet 1px hairlines:
  - structural rules (top bar, card and KPI top rules, table head rule) in `studio/topbar/rule`,
    `studio/card/border` and `studio/table/head-rule`: #e0e0e0 / #313131 (gray 5);
  - row rules in `studio/table/row-rule`: #f0f0f0 / #2a2a2a;
  - no black rules. Ink strokes are reserved for state: the 2px selected-row bar, the 6px location
    marker and the 2px focus ring.
- **Utility checkboxes** render at about a 2px radius (the 4px corner of the pre-refinement frame is
  gone); badges, kbd and chips use `--ns-radius-badge` (2px).
- **Concentricity:** Cloud's tab track (r999, pad 3) holds r999 thumbs. Playful's table (r28,
  inset 8) holds r14 rows — not strictly concentric (28 − 8 = 20); keep it as drawn.

## Components

Shared anatomy (all flavors; per-flavor variants are in _Flavors_). States are from the state sheets
(master `46:2210`).

- **Buttons** (Primary, Secondary, Outline, Ghost): Primary = `studio/primary/bg` + 1px inside
  `studio/primary/stroke`, hover swaps to `bg-hover`; other kinds hover with an 8% layer clipped to
  the button shape. Focus 2/2 ring; disabled 38%.
- **Input, select, textarea:** `card` fill, 1px boundary in `studio/input/border`
  (`--ns-studio-input-border`: gray 9 #8d8d8d / #6e6e6e in Utility, gray 10 in the other flavors);
  hover = stroke only; invalid = 1px `destructive` + `destructive-text` helper; invalid + focus
  keeps both; disabled = `muted` fill. IDs and codes in `font/data`. Textarea hugs content, 12/12
  padding, min 80 (S-17). Toolbar buttons that only open a menu (Status, date range) use the soft
  `border` (#d9d9d9 / #3a3a3a), not the field boundary.
- **Checkbox 16px** (Utility r2; other flavors r4), boundary in `studio/input/border`; checked =
  `primary` + 1px `primary-text` (Utility dark keyline #7b7b7b). **Switch** 32×18, off track edge in
  `studio/input/border`, 14px thumb.
- **Tabs and segmented filters:** Utility marks the selected item with the 6px ink marker, a Medium
  label and a mono count; there is no underline, track or fill (S-16 is superseded by this
  borderless marker anatomy). Other flavors use the variants in _Flavors_, never fill alone.
  Disabled 0.38, no hover (S-15). Focus is the complete 2px/2px perimeter around the segment's
  bounds: #202020 16.29:1 light, #7b7b7b 4.19:1 dark (S-20, closed). The marker wrapper must not
  clip the ring; the round-7 state sheet showed one side only until the wrapper stopped clipping.
- **Table row:** Utility hover fill #f9f9f9 / #222222 (measured); selected = `selected` fill
  (#f0f0f0 / #2a2a2a) + a 2px ink bar on the left (`studio/signal/marker`) + checked box. Other
  flavors hover at 4%. **Nav item:** 30px, 6/10 padding; Utility active = 6px ink marker + Medium
  `fg`, no fill; other flavors use `studio/nav/active`. **Notice:** `warning-subtle`, 1px
  `warning-border`, 12/14 padding, action in `fg` + underline (S-06). Badge, KPI, card and top bar
  are flavor variants.
- **Links (Utility):** ink, Medium, with a 1px underline at a 4px offset in
  `studio/signal/underline` (gray 8, #bbbbbb / #606060); on hover the underline becomes
  `studio/signal/marker`. The text colour never changes; the underline and the weight are the
  non-colour cues.
- **Copy-source cues (Utility):** file-path chips (Fragment Mono 12, copy icon 14px, `surface` fill,
  1px `border-subtle`, r2) and `data-*` attribute chips (`data-variant=` in `muted-fg`, `"value"` in
  `fg`). Kbd: mono 11/16 `muted-fg`, 1px `border`, `card` fill, r2, 20px high.
- **Dialog/sheet:** not drawn. Use the flavor card plus `overlay` (#000 @ 40% / 66%); owed #2416.
- **Signature objects:** Utility's ink location marker, red square N and copy-source chips; Signal
  ticks and block bars, Workshop offsets, Cloud floating bar, Playful hero and pastel tiles, Ledger
  joined KPI strip, Atelier serif numerals.

## Do's and Don'ts

- **Do** keep Utility monochrome: red only in the logo and in errors. Owner: "Apart from the logo no
  red except for error".
- **Do** keep Utility sharp and quiet: radii 0–2px, 1px gray-5 structural hairlines, quiet row
  rules, no shadows. Owner: "I really like the sharp aspect of it just make it more refined" and
  "separations are a bit too strong".
- **Don't** reintroduce the rejected stronger-rules stage in Utility: no 2px ink rules, underline
  tabs, Bold title, Medium KPI numerals or JetBrains Mono.
- **Do** mark location with the 6px ink square (reserve its slot) and selection with the 2px ink
  bar; never with red or colour alone.
- **Do** vary ground, shapes, sizes, type and component variants per flavor. Owner: "too meh… they
  all look too close (play more with variables between them to give them each a real unique feel)".
- **Do** design each dark ground with its own hue. Owner: "Studio could play more with shapes,
  background, shades, tones, sizes, component variants, dark mode all looks the same (dark is not
  necessarily pure black)".
- **Don't** outline a dark primary in white. Utility dark keyline is `studio/primary/stroke` #7b7b7b
  on #313131 (S-18).
- **Don't** fill a dark primary with a pale accent. Signal dark is #222222 / hover #2a2a2a, label
  #bde56c, 1px #7b7b7b edge; lime stays for selection, checkmarks and focus (S-19).
- **Don't** reuse light saturated solid badges in dark; Workshop dark uses the deep-tone
  `studio/badge-solid/*` pairs.
- **Do** hover Primary by changing its fill; give other buttons an 8% layer at inset 0, below the
  label, clipped to the button radius (S-14).
- **Do** draw input, checkbox and switch boundaries with `studio/input/border` (≥ 3:1: Utility gray
  9, 3.32:1 / 3.48:1 measured; other flavors gray 10), never `border` or `border-subtle` (S-02);
  `fg-subtle` is step 11 (S-01).
- **Do** use accent step 11 for light rings and for blue/orange/tomato solids carrying white text
  (S-03, S-05). Utility and Atelier rings are ink/gray instead (flavor `ring/*`).
- **Do** keep the focus ring complete on four sides; no ancestor may clip it (S-05).
- **Don't** let disabled nav items or segments look enabled (S-15), or mark a selected segment by
  colour alone (S-16). Let textareas grow (S-17); render numerals tabular (S-10).
- **Don't** ship a flavor that differs only in hue at 480px (§4.3 thumbnail test).
- **Do** seed every bound paint with its resolved colour after any mode change. Historical trap:
  Atelier's primary buttons once painted a stale #ffffff perimeter while bound to `primary/text`;
  the round-7 review closed it (R5-ATELIER-DARK).

## Flavors

All flavors: Theme mode `Studio`, `data-flavor` = flavor name (provisional). Config ids are the
render names. "L / D" = light / dark.

### Utility (`neutral-ink`) — NetScript default · Neutral × Ink, Compact · L `10:4277`, D `10:5518`

Frozen round-7 candidate: `renders-r7/studio--neutral-ink--{light,dark}.png` and
`studio--states--neutral-ink--{light,dark}.png`, hashed in `renders-r7/SHA256SUMS`.

| Property                | Value                                                                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ground L / D · dark hue | #ffffff / #18181a · graphite                                                                                                                                    |
| Radius                  | 0 / 0 / 0 / 2 (checkbox about 2)                                                                                                                                |
| Type pairing            | Host Grotesk (title 48/52 Medium −2.5%, KPI 40/44 Regular −2.5%, body 14/22) + Fragment Mono (eyebrows, column heads, IDs, breadcrumbs, kbd, chips)             |
| Card                    | no fill, 1px gray-5 top hairline (#e0e0e0 / #313131)                                                                                                            |
| Button                  | square, 32px; ink primary #202020 (dark #313131 + #7b7b7b keyline); secondary and toolbar buttons 1px #d9d9d9 / #3a3a3a                                         |
| Tabs                    | 6px ink marker before the selected label, Medium label, mono counts; no underline, no track; gap 20                                                             |
| Table                   | no fill; mono uppercase head; 1px #e0e0e0 / #313131 head rule; #f0f0f0 / #2a2a2a row rules; 44px rows; selected row = #f0f0f0 / #2a2a2a fill + 2px ink left bar |
| Badge                   | 1px outline in the status text colour, 6px square dot, r2, 11px +0.6                                                                                            |
| KPI                     | open column under a 1px #e0e0e0 / #313131 hairline; mono uppercase eyebrow; 40/44 Regular value                                                                 |
| Top bar                 | white / #18181a, 48px, 1px #e0e0e0 / #313131 bottom hairline; active lane = 6px ink marker + Medium; red square "N" mark (#DA291C / #E5332A)                    |
| Inputs                  | 1px gray 9 boundary #8d8d8d / #6e6e6e (3.32:1 / 3.48:1)                                                                                                         |
| Icons                   | Lucide, 1.5px stroke (`--ns-studio-icon-stroke`)                                                                                                                |
| Accent / ring           | ink; 2px ring with a 2px gap, #202020 / #7b7b7b                                                                                                                 |

### Cloud (`slate-blue`) — Slate × Blue, Comfortable · L `10:4587`, D `10:5828`

| Property                | Value                                                                                                                                                                                                                                                                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ground L / D · dark hue | #edf1f7 / #111830 · navy                                                                                                                                                                                                                                                                                                                            |
| Radius                  | 10 / 10 / 20 / 999                                                                                                                                                                                                                                                                                                                                  |
| Type pairing            | Manrope (heading, KPI 32/38 Bold) + Figtree (body, labels) + Geist Mono                                                                                                                                                                                                                                                                             |
| Card                    | white platter r20, no border, `0 12px 32px #1428501f`; footer #f7f9fc                                                                                                                                                                                                                                                                               |
| Button                  | r10, 36px; primary #0d74ce (dark #0090ff, ink #111113)                                                                                                                                                                                                                                                                                              |
| Tabs                    | pill track #e4eaf3 (pad 3) with a white thumb and `0 1px 2px` shadow                                                                                                                                                                                                                                                                                |
| Table                   | white r20 card; header #f7f9fc; row hover #f1f6fe; 52px rows                                                                                                                                                                                                                                                                                        |
| Badge                   | pill, `*-subtle` fill + 6px dot                                                                                                                                                                                                                                                                                                                     |
| KPI                     | white platter r20 with sparkline                                                                                                                                                                                                                                                                                                                    |
| Top bar                 | floating white bar r16, 16px inset, `0 6px 24px`                                                                                                                                                                                                                                                                                                    |
| Accent / ring           | blue; ring #0d74ce / #70b8ff                                                                                                                                                                                                                                                                                                                        |
| Page header             | Not clipped. Round 7 found the leading C of "Commerce" and F of "Fulfilment" cut; the cause was `Page header` clipping with the 20px `radius/card` and 0 padding. Without the clip, both glyphs render in full at the x48 anchor and Create order shows its own r10 corner (S-22, closed). Never clip a header container that carries a card radius |

### Workshop (`sand-orange`) — Sand × Orange, Chunky · L `10:4897`, D `10:6138`

| Property                | Value                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------- |
| Ground L / D · dark hue | #f4ede1 / #1f160e · roasted brown                                                       |
| Radius                  | 6 / 6 / 6 / 4                                                                           |
| Type pairing            | Bricolage Grotesque ExtraBold (title 40/44, KPI 44/48) + Instrument Sans + Space Mono   |
| Card                    | paper #fbf6ee, 2px #3a2e22 border, hard `4px 4px 0` shadow                              |
| Button                  | r6, 44px, 1.5px border, `3px 3px 0` shadow; primary #cc4e00 (dark #f76b15, ink #111110) |
| Tabs                    | separate chips: 1.5px #cdbfa7 idle; selected #fce1c0 + 1.5px ink                        |
| Table                   | header band #e9dcc4 with 3px rule; 56px rows                                            |
| Badge                   | solid r4: e.g. #2a7e3b + #fbf6ee; dark deep tone #25482d + #71d083                      |
| KPI                     | cream #fff8ec card, 2px border, 4/4 offset                                              |
| Top bar                 | #e9dcc4 band, 64px, 3px rule (dark #2e2217 with orange #e07b2a rule)                    |
| Accent / ring           | orange; ring #cc4e00 / #ffa057                                                          |

### Playful (`mauve-violet`) — Mauve × Violet, Chunky · L `10:5207`, D `10:6448`

| Property                | Value                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| Ground L / D · dark hue | #f1ecfd / #1a1226 · aubergine                                                                               |
| Radius                  | 999 / 18 / 28 / 999                                                                                         |
| Type pairing            | Fredoka SemiBold (title 44/48, KPI 54/58) + Nunito + DM Mono                                                |
| Card                    | white r28, no border, no shadow                                                                             |
| Button                  | pill, 44px; primary #6e56cf with white label                                                                |
| Tabs                    | pill track #e3d8ff (pad 4), white thumb                                                                     |
| Table                   | rows are separate white r14 pills, 6px apart, 8px inset on #f6f2fe; no rules                                |
| Badge                   | pill, `*-subtle` fill + dot, Nunito Bold 12                                                                 |
| KPI                     | four pastel tiles r28: #ffe1ec, #d9f4e3, #fff0c2, #dceaff (dark #3a1d30, #173126, #352a12, #18284a)         |
| Top bar                 | transparent, 64px; nav on a white pill track                                                                |
| Accent / ring           | violet; ring #6550b9 / #baa7ff; page header is a violet hero #33236e, pinned to Scheme Dark in both schemes |

### Ledger (`ledger`) — Slate × Indigo, Dense · L `10:6759`, D `10:7690`

| Property                | Value                                                                        |
| ----------------------- | ---------------------------------------------------------------------------- |
| Ground L / D · dark hue | #f4f6f9 / #08171f · teal-black                                               |
| Radius                  | 2 / 2 / 2 / 2                                                                |
| Type pairing            | IBM Plex Sans Condensed (title 20/26) + IBM Plex Mono for data and KPI 22/26 |
| Card                    | white, 1px #c5cfdc border all sides                                          |
| Button                  | r2, 28px, 12px condensed label; primary #3e63dd                              |
| Tabs                    | r2 track #e3e9f1; selected white + 1px #9aa8bc                               |
| Table                   | header #e3e9f1, zebra #f3f6fa (dark #0f222d), 32px rows                      |
| Badge                   | `*-subtle` fill + 1px `*-border`, r2, no dot, 10/14                          |
| KPI                     | one joined strip: 0 gap, shared 1px borders                                  |
| Top bar                 | navy #04101a, 40px, pinned to Scheme Dark in both schemes                    |
| Accent / ring           | indigo; ring #3a5bc7 / #9eb1ff                                               |

### Atelier (`atelier`) — Sand × Tomato, Airy · L `10:7069`, D `10:8000`

| Property                | Value                                                                                                                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ground L / D · dark hue | #f8f5ee / #191813 · olive-black                                                                                                                                                        |
| Radius                  | 0 / 0 / 0 / 0                                                                                                                                                                          |
| Type pairing            | Newsreader Light (title 60/64, KPI 44/48) + Hanken Grotesk (body 15/24) + IBM Plex Mono                                                                                                |
| Card                    | no fill, 1px ink top rule (#1f1c18; dark #8f8778)                                                                                                                                      |
| Button                  | r0, 40px; primary is text + 1px outline in `primary-text` (#d13415 / #ff977d), fill hidden                                                                                             |
| Tabs                    | 1px underline, gap 24                                                                                                                                                                  |
| Table                   | no fill, #ded7ca row rules, 56px rows                                                                                                                                                  |
| Badge                   | 1px `success-border`-style outline, r0, dot, Regular 11                                                                                                                                |
| KPI                     | open, 1px top rule, 40px gap                                                                                                                                                           |
| Top bar                 | transparent, 72px, 1px #ded7ca hairline                                                                                                                                                |
| Accent / ring           | tomato accent (primary outline #d13415 / #ff977d); focus ring ink #21201c / gray #7c7b74 through the flavor `ring/{l,d}` variables (measured on the round-7 renders: 14.97:1 / 4.18:1) |

### Signal (`signal`) — Neutral × Lime, Dense · L `10:8310`, D `10:7379`

| Property                | Value                                                                                                                                                                                                                                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ground L / D · dark hue | #ecf0ec / #090e0a · green-black                                                                                                                                                                                                                                                                                      |
| Radius                  | 2 / 2 / 2 / 0                                                                                                                                                                                                                                                                                                        |
| Type pairing            | Geist Mono throughout (title 22/28, KPI 28/32 SemiBold)                                                                                                                                                                                                                                                              |
| Card                    | #f7f9f6, 1px #a9b4aa border, 12px corner ticks (#1b1f1c; dark lime #bdee63)                                                                                                                                                                                                                                          |
| Button                  | r2, 28px, bracket labels `[ Create order ]`; light lime #bdee63 + #37401c ink + #5c7c2f edge; dark #222222 + #bde56c + #7b7b7b (S-19)                                                                                                                                                                                |
| Tabs                    | bracketed `[All]`, selected #e4f5bd fill, no track                                                                                                                                                                                                                                                                   |
| Table                   | header #e3e9e3, row and vertical cell rules #d3dcd3, 32px rows                                                                                                                                                                                                                                                       |
| Badge                   | no box: uppercase bracket text `[PAID]` in the status text colour                                                                                                                                                                                                                                                    |
| KPI                     | bordered cell, corner ticks, 8px segmented block-bar meter                                                                                                                                                                                                                                                           |
| Top bar                 | black #050806, 40px, 1px lime #9be22d rule, pinned to Scheme Dark                                                                                                                                                                                                                                                    |
| Accent / ring           | lime; ring #5c7c2f / #bdee63. Core `primary` dark aligned to #222222                                                                                                                                                                                                                                                 |
| Logo glyph              | The N binds `studio/brand/on` (`--ns-studio-brand-on`) = #0b0f0b in both schemes on the lime tile: 14.32:1 (was #bde56c, 1.07:1; S-21, closed; logo craft, not a WCAG requirement). The other flavors' glyphs still bind `primary/fg`; their `brand-on` values mirror that chain, so rebinding them is pixel-neutral |

## Iconography & Imagery

Lucide stroke icons (ISC), 16px (`icon/plus`, `icon/bell`); 24px only in the Tonal language. The
stroke comes from the flavor `icon/stroke` variable (`--ns-studio-icon-stroke`): 1.5px in Utility,
2px in the other flavors. Avatars are initials on `muted`, shaped by `studio/avatar/radius` (0
Utility, Signal; 2 Ledger; 6 Workshop; 10 Playful; 999 Cloud, Atelier). Brand mark: a 24px square in
`studio/signal/brand` (which aliases the flavor `brand`) with a letter (Northwind is invented
fixture branding). No illustration or photo.

## Motion & States

From the state sheets: hover = 8% layer (row 4%), Primary hover = fill swap, focus = 2/2 ring,
disabled = 38%, selected = `selected` tint plus a non-colour marker. Durations and easing are not
specified in Figma; the anchor's 100ms and `translate-y-px` press are a starting point only. Owed to
#2419 with reduced motion (no translate) and RTL.

## Accessibility

WCAG 2.x ratios from resolved variables _(token)_, except where marked _measured_ on the frozen
round-7 renders:

| Flavor L / D | `fg` on `bg`  | `muted-fg` on `card` | `primary-fg` on primary | `input-border` on `card`                                | `ring` on `bg`                           |
| ------------ | ------------- | -------------------- | ----------------------- | ------------------------------------------------------- | ---------------------------------------- |
| Utility      | 16.29 / 15.28 | 5.92 / 8.55          | 15.88 / 11.21           | 3.32 / 3.48 (gray 9, `studio/input/border`, _measured_) | 16.29 / 4.19 (_measured_)                |
| Cloud        | 14.46 / 15.11 | 5.94 / 7.42          | 4.77 / 5.78             | 3.78 / 3.64                                             | 4.20 / 8.34                              |
| Workshop     | 14.01 / 15.33 | 5.61 / 7.67          | 4.51 / 6.36             | 3.59 / 3.79                                             | 3.88 / 8.83                              |
| Playful      | 14.09 / 15.64 | 5.69 / 7.84          | 5.39 / 5.39             | 3.64 / 3.88                                             | 5.34 / 8.68                              |
| Ledger       | 15.14 / 15.69 | 5.94 / 8.10          | 5.21 / 5.21             | 3.78 / 3.98                                             | 5.54 / 8.84                              |
| Atelier      | 14.97 / 15.30 | 5.55 / 8.48          | 4.98 / 4.89             | 3.55 / 4.18                                             | 14.97 / 4.18 (ink/gray ring, _measured_) |
| Signal       | 14.15 / 16.78 | 5.59 / 8.94          | 8.14 / 11.05            | 3.58 / 4.38                                             | 4.17 / 14.44                             |

Signal light's lime fill is 1.17:1 on its ground; its 1px #5c7c2f edge (4.17:1) is the boundary.
Utility link underlines are #bbbbbb / #606060 (1.92:1 / 2.82:1); the underline's presence and the
Medium weight are the non-colour cues, and hover turns it ink. The logo reds are 4.87:1 / 4.09:1
(logotypes are exempt). Hit targets: Dense flavors use 28px controls and 24px small controls (meets
the 24px minimum; use Comfortable or larger for touch). A fresh full contrast matrix is owed to
#2414.

## NetScript Mapping

| Layer              | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Figma Theme mode   | `Studio`                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Base gray × accent | per flavor (Utility Neutral × Ink)                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Density            | per flavor (Utility Compact)                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Flavor             | `Studio flavor`: Utility, Cloud, Workshop, Playful, Ledger, Atelier, Signal                                                                                                                                                                                                                                                                                                                                                                                               |
| `data-theme`       | `studio` (+ `data-flavor`, provisional)                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Language roles     | Pack manifest (GUIDELINES §2.4): `studio/{card,kpi,table,tabs,topbar,nav,hero,brand,button,deco,primary}/*`, `studio/badge-solid/{success,warning,info,destructive,neutral}/{bg,fg}`, `studio/signal/{brand,marker,underline}`, `studio/input/border`, `studio/brand/on`, `studio/code/scroll-thumb` → `--ns-studio-*`; scheme-independent flavor variables `--ns-studio-prose-*` and `--ns-studio-icon-stroke`; flavor `ring/{l,d}` (Utility and Atelier ink/gray rings) |

- **Code syntax:** round 7 gave every `studio/*` Scheme role, and every scheme-independent,
  non-boolean Studio flavor variable without a Theme twin, the code syntax `var(--ns-studio-<path>)`
  (author-reported). The `studio-*` keys above follow that rule. All of them must be registered in
  S1 #2414. Flavor geometry booleans (border sides, ticks, sparkline, block bars) live only in the
  flavor collection today.
- **New this round (author-reported):** primitives `color/swiss-red/{l,d}/9`; flavor variables
  `signal/{l,d}/{brand,marker,underline}`, `input/{l,d}/border`, `icon/stroke`, `prose/*` and
  `ring/{l,d}`, with values in all seven flavor modes; Scheme roles `studio/signal/*` and
  `studio/input/border`. Added by the post-review corrections: Scheme role `studio/brand/on` (flavor
  `brand-on/{l,d}`: Signal #0b0f0b, the other flavors mirror their `primary/fg` chain) and Scheme
  role `studio/code/scroll-thumb` (→ `gray/{l,d}/10`).
- **Docs-site roles (Utility, `docs-design.md`):** the dark primary keyline binds
  `studio/primary/stroke` #7b7b7b, 3.07:1 on the #313131 fill and 4.19:1 on the page (DS-01). The
  code-block scrollbar thumb binds `studio/code/scroll-thumb`: gray/l/10 #838383, 3.51:1 on #f6f6f6;
  gray/d/10 #7b7b7b, 3.93:1 on #1e1e21. Its 3px geometry is unchanged (DS-02). Author-measured after
  the round-7 corrections.
- **Node-level exceptions:** none reported. The Atelier stale-paint perimeter (`10:7069` /
  `10:8000`) is closed (history in _Do's and Don'ts_).
- **State sheets:** master `46:2210` (Utility L), `76:432` (Utility D), `76:668`/`76:904` Cloud,
  `76:1140`/`76:1376` Workshop, `76:1612`/`76:1848` Playful, `76:2084`/`76:2320` Ledger,
  `76:2556`/`76:2792` Atelier, `76:3028`/`76:3264` Signal.
- **Renders:** `renders-r7/studio--<cfg>--{light,dark}.png`, `studio--contact--{light,dark}.png`,
  `studio--states--neutral-ink--{light,dark}.png`, `utility--before-after.png`,
  `utility--thumbnail-test.png` and `utility-baseline--{light,dark}.png` under
  `.llm/runs/design-system-s4--language-review/`. Only Utility has round-7 state sheets; the other
  flavors' state renders are pre-flavor (`renders-r4/states--studio--*`, not in the frozen set).
- **Evidence status (TD-25).** Visual claims refer to the frozen round-7 renders listed above,
  hashed in `renders-r7/SHA256SUMS` (sha256 `092b1cd4…`; review input commit `affd6b158`). Node ids,
  variable modes, alias and `resolveForConsumer` chains, binding and unbound counts, effect-style
  values and Figma text-style weights in this file are **reported by the Figma author and
  independently unverified**: no frozen node/variable/effect/type export accompanies the snapshot.
  Ratios marked _measured_ were sampled on exported pixels; _(token)_ ratios are resolved-variable
  arithmetic; values marked _proposed_ stay proposals until a re-render proves them; runtime
  behaviour is unproven until #2419.

## Provenance

- **Sources:** ui.shadcn.com (MIT), vercel.com/geist (OFL fonts), linear.app (observed), alignui.com
  (MIT code only); reference pack `inventory/reference-packs.md` §6.
- **Rounds:** r1–r3 CHANGES_REQUESTED (S-01…S-17); r4 all 14 PASS; r5 carried, dark-audit conflicts
  disclosed; r6 (commit `1c67e857c`) 12 PASS, Utility dark (S-18) and Signal dark (S-19)
  CHANGES_REQUESTED. Round 7 (frozen renders, `renders-r7/SHA256SUMS`): Workshop, Playful, Ledger
  and Atelier PASS in both schemes; S-18, S-19 and R5-ATELIER-DARK CLOSED; three local craft
  findings were raised: S-20 (Utility segmented focus perimeter), S-21 (Signal logo glyph) and S-22
  (Cloud clipped header glyphs). See `review/studio.md`. All three were fixed in Figma after the
  review and are closed (author-measured on re-exported pixels; `corrections-r7.md` § "Round 7 —
  independent review corrections"). The corrected state sheets and Cloud and Signal renders
  overwrite `renders-r6/`; they are outside the frozen set, so the next round should freeze them.
- **Owner direction (excerpts, `worklog.md` and `brief-r7.md`):** "the doc itself … will follow the
  'utility - neutral' theme which is the new netscript default"; "more sleek premium, classy touch …
  separations are a bit too strong, and it lack a bit identity"; "I really like the sharp aspect of
  it just make it more refined"; "Apart from the logo no red except for error".
- **Reconciled before round 7 (author-reported):** frame names now state the actual densities;
  Atelier's focus ring is ink/gray through the flavor `ring/*` variables (the r6 review's gray
  reading, not the earlier tomato); Signal's core dark `primary` is aligned to #222222.
  `inventory/themes.md` (r1) is still stale and lists Geist for Studio.
- **Invented fixture content:** Northwind, the six customers, SO-10477…10482, amounts, emails, the
  tracking number and AUTUMN24.
- **Open evidence:** #2414 tokens, fonts, numerals and contrast matrix; #2416 canonical states,
  dialog/sheet anatomy, semantics; #2419 runtime, keyboard, motion, RTL.
