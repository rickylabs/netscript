---
version: alpha
name: Tonal
description: Material 3 Expressive for NetScript — tonal surfaces instead of borders, a vibrant hero, shape-morphing connected controls, and a floating vibrant toolbar with a FAB.
colors:
  # Theme mode Tonal (aliases gray → Radix mauve, accent → Radix violet). Light, then `-dark`.
  # Resolved with resolveForConsumer on frames 23:277 (Light) and 25:295 (Dark).
  bg: '#fdfcfd'
  bg-dark: '#121113'
  surface: '#faf9fb'
  surface-dark: '#1a191b'
  card: '#faf9fb'
  card-dark: '#1a191b'
  container: '#f2eff3'
  container-dark: '#232225'
  container-high: '#eae7ec'
  container-high-dark: '#2b292d'
  container-highest: '#e3dfe6'
  container-highest-dark: '#323035'
  selected: '#f4f0fe'
  selected-dark: '#291f43'
  fg: '#211f26'
  fg-dark: '#eeeef0'
  muted-fg: '#605e67' # also the 1px enabled filled-field and textarea indicator
  muted-fg-dark: '#bab7c0'
  border: '#dbd8e0'
  border-dark: '#3c393f'
  input-border: '#84828e' # outlined buttons, chips, checkbox outlines; not the filled-field indicator
  input-border-dark: '#7c7a85'
  ring: '#6550b9'
  ring-dark: '#baa7ff'
  primary: '#6550b9'
  primary-dark: '#6e56cf'
  primary-hover: '#6550b9'
  primary-hover-dark: '#7d66d9'
  primary-fg: '#ffffff'
  primary-fg-dark: '#ffffff'
  primary-text: '#6550b9'
  primary-text-dark: '#baa7ff'
  primary-container: '#ebe4ff'
  primary-container-dark: '#33255b'
  primary-on-container: '#2f265f'
  primary-on-container-dark: '#e2ddfe'
  inverse: '#211f26'
  inverse-dark: '#eeeef0'
  inverse-fg: '#fdfcfd'
  inverse-fg-dark: '#121113'
  success-subtle: '#e9f6e9'
  success-subtle-dark: '#1b2a1e'
  success-text: '#2a7e3b'
  success-text-dark: '#71d083'
  warning-subtle: '#fff7c2'
  warning-subtle-dark: '#302008'
  warning-text: '#4f3422'
  warning-text-dark: '#ffca16'
  destructive-subtle: '#feebec'
  destructive-subtle-dark: '#3b1219'
  destructive-text: '#641723'
  destructive-text-dark: '#ff9592'
  info-subtle: '#e6f4fe'
  info-subtle-dark: '#0d2847'
  info-text: '#113264'
  info-text-dark: '#70b8ff'
typography:
  display: {
    fontFamily: Roboto Flex,
    fontSize: 57px,
    fontWeight: 500,
    lineHeight: 64px,
    letterSpacing: -0.25px,
  }
  title: { fontFamily: Roboto Flex, fontSize: 36px, fontWeight: 500, lineHeight: 44px }
  heading: {
    fontFamily: Roboto Flex,
    fontSize: 16px,
    fontWeight: 500,
    lineHeight: 24px,
    letterSpacing: 0.15px,
  }
  kpi: {
    fontFamily: Roboto Flex,
    fontSize: 45px,
    fontWeight: 500,
    lineHeight: 52px,
    fontFeature: '"tnum" 1, "lnum" 1',
  }
  kpi-sm: {
    fontFamily: Roboto Flex,
    fontSize: 32px,
    fontWeight: 500,
    lineHeight: 40px,
    fontFeature: '"tnum" 1, "lnum" 1',
  }
  body-lg: { fontFamily: Roboto Flex, fontSize: 16px, fontWeight: 400, lineHeight: 24px }
  body: {
    fontFamily: Roboto Flex,
    fontSize: 14px,
    fontWeight: 400,
    lineHeight: 20px,
    letterSpacing: 0.25px,
  }
  strong: {
    fontFamily: Roboto Flex,
    fontSize: 14px,
    fontWeight: 600,
    lineHeight: 20px,
    letterSpacing: 0.1px,
  }
  label: {
    fontFamily: Roboto Flex,
    fontSize: 12px,
    fontWeight: 600,
    lineHeight: 16px,
    letterSpacing: 0.4px,
  }
  small: {
    fontFamily: Roboto Flex,
    fontSize: 12px,
    fontWeight: 400,
    lineHeight: 16px,
    letterSpacing: 0.4px,
  }
rounded:
  input: 4px # filled field top corners; bottom corners 0
  connected-pressed: 4px
  segment-inner: 6px
  chip: 8px
  connected-inner: 8px
  fab: 20px
  card: 28px
  card-hero: 32px
  full: 9999px
spacing:
  button-height: 40px
  icon-button: 40px
  connected-height: 48px
  chip-height: 32px
  field-height: 56px
  search-height: 56px
  list-row-height: 72px
  list-gap: 2px
  rail-width: 96px
  rail-item-width: 80px
  fab-size: 64px
  toolbar-height: 64px
  card-padding: 24px
components:
  button-filled: {
    backgroundColor: '{colors.primary}',
    textColor: '{colors.primary-fg}',
    typography: '{typography.strong}',
    rounded: '{rounded.full}',
    height: 40px,
    padding: 0 24px,
  }
  button-filled-dark: {
    backgroundColor: '{colors.primary-dark}',
    textColor: '{colors.primary-fg-dark}',
    rounded: '{rounded.full}',
    height: 40px,
  }
  button-outlined: {
    textColor: '{colors.primary-text}',
    typography: '{typography.strong}',
    rounded: '{rounded.full}',
    height: 40px,
    padding: 0 24px 0 16px,
  }
  button-tonal: {
    backgroundColor: '{colors.primary-container}',
    textColor: '{colors.primary-on-container}',
    typography: '{typography.strong}',
    rounded: '{rounded.full}',
    height: 40px,
  }
  connected-selected: {
    backgroundColor: '{colors.primary}',
    textColor: '{colors.primary-fg}',
    typography: '{typography.strong}',
    rounded: '{rounded.full}',
    height: 48px,
  }
  connected-item: {
    backgroundColor: '{colors.container-high}',
    textColor: '{colors.fg}',
    typography: '{typography.strong}',
    rounded: '{rounded.connected-inner}',
    height: 48px,
  }
  chip-selected: {
    backgroundColor: '{colors.primary-container}',
    textColor: '{colors.primary-on-container}',
    typography: '{typography.strong}',
    rounded: '{rounded.chip}',
    height: 32px,
  }
  text-field: {
    backgroundColor: '{colors.container-highest}',
    textColor: '{colors.fg}',
    typography: '{typography.body-lg}',
    rounded: '{rounded.input}',
    height: 56px,
  }
  search-bar: {
    backgroundColor: '{colors.container-high}',
    textColor: '{colors.muted-fg}',
    typography: '{typography.body-lg}',
    rounded: '{rounded.full}',
    height: 56px,
  }
  list-row: {
    backgroundColor: '{colors.container}',
    textColor: '{colors.fg}',
    typography: '{typography.strong}',
    rounded: '{rounded.segment-inner}',
    height: 72px,
  }
  list-row-selected: {
    backgroundColor: '{colors.primary-container}',
    textColor: '{colors.primary-on-container}',
    rounded: '{rounded.segment-inner}',
    height: 72px,
  }
  status-success: {
    backgroundColor: '{colors.success-subtle}',
    textColor: '{colors.success-text}',
    typography: '{typography.label}',
    rounded: '{rounded.chip}',
    height: 28px,
  }
  kpi-hero: {
    backgroundColor: '{colors.primary}',
    textColor: '{colors.primary-fg}',
    typography: '{typography.kpi}',
    rounded: '{rounded.card-hero}',
    padding: 24px 24px 20px,
  }
  kpi-hero-dark: {
    backgroundColor: '{colors.primary-dark}',
    textColor: '{colors.primary-fg-dark}',
    rounded: '{rounded.card-hero}',
  }
  kpi: {
    backgroundColor: '{colors.container}',
    textColor: '{colors.fg}',
    typography: '{typography.kpi-sm}',
    rounded: '{rounded.card}',
    padding: 20px 20px 16px,
  }
  floating-toolbar: {
    backgroundColor: '{colors.primary-container}',
    textColor: '{colors.primary-on-container}',
    rounded: '{rounded.full}',
    height: 64px,
    padding: 8px,
  }
  fab: {
    backgroundColor: '{colors.primary}',
    textColor: '{colors.primary-fg}',
    rounded: '{rounded.fab}',
    size: 64px,
  }
---

# Tonal

<!-- Format: Google Labs DESIGN.md (alpha). Values resolved from Figma file pGRLnkPPRZJZy74evNcQBr,
page "Language — Tonal" (16:2), on 2026-10-27. Names are provisional until S1 #2414. -->

## Overview

- **Thesis:** Material 3 Expressive, built on NetScript roles: hierarchy comes from tonal containers
  and shape, not from borders or shadows.
- **Signature moves:**
  1. **Vibrant hero and tonal ladder.** One saturated violet hero KPI (`primary`) over a ladder of
     `container` → `container-high` → `container-highest` surfaces; no card borders.
  2. **Shape that means something.** Connected button groups (selected = full pill, inner corners
     8px, pressed 4px), segmented list rows (outer 28px, inner 6px, 2px gaps), and the Expressive
     "sunny" shape reserved for the selected order.
  3. **Floating vibrant toolbar + FAB** at the bottom centre, with a wavy progress indicator and
     filled text fields carrying their label inside.
- **Anchor:** Material 3 Expressive (May 2025, m3.material.io): shape scale, emphasized type, colour
  roles, state layers, connected button groups, floating toolbar, wavy progress. The Material 3
  Design Kit is in the Figma file for calibration. Do not copy Google marks, the Material Symbols
  set (use our Lucide-style icons) or Google Sans.
- **Family:** System. **Best for:** Android-adjacent and consumer-facing apps, mobile-first admin.
  **Avoid for:** dense desktop finance grids (use Studio Ledger).
- **Feel:** soft, confident, tactile. Owner bar: "Material should look like the newest Material 3
  design, not 2019".

## Colors

- **Ladder:** `bg` #fdfcfd → `container` #f2eff3 (KPIs, form, list rows) → `container-high` #eae7ec
  (search, connected items, options, banner) → `container-highest` #e3dfe6 (filled fields, switch
  track). Dark: #121113 → #232225 → #2b292d → #323035.
- **Accent policy:** violet `primary` fills only the hero KPI, the selected connected button, the
  FAB and filled buttons. `primary-container` (#ebe4ff / #33255b) marks selection: the selected row,
  the selected chip, the floating toolbar, the sync card, tonal buttons and the rail indicator.
  `primary-text` (#6550b9 / #baa7ff) is for text buttons, focused labels and progress.
- **Status:** chips use `*-subtle` fills with `*-text` (success #2a7e3b / #71d083, warning #4f3422 /
  #ffca16, destructive #641723 / #ff9592, info #113264 / #70b8ff) plus a leading icon.
- **Dark design notes:** the hero, Save and FAB keep a saturated #6e56cf fill with white text
  (5.39:1), never a pale inverse slab (R5-TONAL-DARK). Selection stays deep (#33255b). Shadows turn
  to #000 at 50%. Surfaces lighten with height.

## Typography

**Roboto Flex** (OFL, Google Fonts) for every role; Geist Mono (OFL) is the mono role. Fallback:
`system-ui, sans-serif`. Emphasized scale (T-07): display 57/64 Medium −0.25; title 36/44 Medium;
hero KPI 45/52 Medium; secondary KPIs 32/40 Medium (`type/kpi-sm`); headings and names 16/24 Medium
+0.15; body 14/20 +0.25; strong and labels on buttons 14/20 SemiBold +0.1; field values and search
16/24; field labels and captions 12/16 +0.4. Order IDs and totals are SemiBold 14/20. Numerals must
be tabular lining in code; owed to #2414/#2416 (T-07). Sentence case throughout.

## Layout

- **Frame (1280×1876):** a 96px navigation rail (menu icon button, five 80×60 destinations) and a
  main column (1144px content): search bar (640×56) and notification button → header (title,
  subtitle, outlined Export) → KPI row (hero 380×210 + three 243×152) → orders section (toolbar with
  connected group and chips, column labels, six 72px segmented rows, "Load more") → bottom row:
  order form (728) beside a side column (400: sync card, banner, recent activity).
- **Floating toolbar + FAB:** 292×64, bottom centre, over content.
- **Rhythm:** 4px grid; list gaps 2px; card padding 24 (hero) / 20 (KPI); form groups 16. Density
  mode is Comfortable by default, but Tonal controls use the fixed M3 sizes in _spacing_.

## Elevation & Depth

Tonal elevation: height is shown by moving up the container ladder, not by shadow.

| Level           | Recipe                                                                | Applied to          |
| --------------- | --------------------------------------------------------------------- | ------------------- |
| 0               | `bg`                                                                  | page                |
| 1–3             | `container` / `container-high` / `container-highest` fills, no stroke | cards, rows, fields |
| Floating        | `box-shadow: 0 3px 8px #0f0f1414` (dark `#00000080`)                  | floating toolbar    |
| Floating action | `box-shadow: 0 4px 10px #0f0f1414` (dark `#00000080`)                 | FAB                 |

Focus: 2px `ring` at a 2px gap ("Focus 2/2" on the state sheets).

## Shapes

M3 shape scale, drawn as literal radii: full (buttons, search, floating toolbar, delta pills), 32
(hero, form), 28 (KPIs, sync card, banner, first/last segmented row), 24 (first/last activity item),
20 (FAB, options group ends), 8 (chips, status, connected inner corners), 6 (segmented inner), 4
(field top corners, pressed connected inner corners, activity inner). Expressive shapes: the "sunny"
8-point shape for the selected order's avatar (list and form header, 56px) and shape badges (44px)
on the sync card and banner. Strokes: 1px field indicator, 2px focused/error indicator, 1px outlined
button.

## Components

States come from `47:527` / `47:857` (state layers use the on-colour).

- **Buttons:** filled (`primary`), tonal (`primary-container`), outlined (1px `input-border`,
  `primary-text` label), text (`primary-text`). 40px, full radius, 24px padding (16px on the icon
  side). Hover 8%, pressed 12% layer behind the label, focus 2/2, disabled =
  `state/disabled-
  container` 12% + `state/disabled-fg` 38%, parent opacity 1 (T-05).
- **Connected button group:** 48px, 2px gaps; selected item becomes a full pill in `primary`; others
  `container-high` with 8px inner corners; pressed inner corners morph to 4px.
- **Chips:** 32px r8. Filter chip = 1px `input-border`, `muted-fg` label, trailing chevron. Selected
  chip = `primary-container` with a leading check.
- **Filled text field:** 56px, `container-highest`, top corners 4px, label inside (12/16) and value
  (16/24). Enabled indicator 1px `muted-fg` (`text/muted`, #605e67 / #bab7c0; _measured_ 4.8459:1 /
  6.5985:1 on the field fill); hover indicator `fg`; focused 2px `ring` with a `primary-text` label;
  error 2px `destructive-text`, trailing alert icon and a full repair sentence; error + focus adds
  the outer ring; disabled 38% (T-01, T-02).
- **Text area:** 112px container, label inside, 1px `muted-fg` bottom indicator, counter "Optional ·
  0 / 500".
- **Checkbox / switch:** checkbox in a 40px round state target; switch 52×32, off track
  `container-highest` with a 2px `muted-fg` outline; on track `primary` with a check in the thumb.
- **Segmented list row (table):** 72px rows, 2px apart, `container`; outer corners 28, inner 6;
  checkbox, ID, avatar + name/email, channel, status chip, date, total, overflow icon button.
  Selected = `primary-container` with `primary-on-container` text and the sunny avatar.
- **Status chip:** 28px r8, `*-subtle` fill, leading status icon, `*-text` label.
- **KPI:** hero 380×210 r32 `primary` with label, 45/52 value, delta and an area sparkline (white at
  18% + 2.5px line); secondary 243×152 r28 `container` with a shape-badge icon, 32/40 value and a
  delta pill; no sparklines (T-10).
- **Notice / banner:** r28 `container-high`, shape badge, body, text + tonal actions.
- **Navigation rail:** 80×60 items, 56×32 r16 indicator in `primary-container`, 24px icon, 12/16
  label (Medium when active). No compose FAB in the rail (T-06).
- **Top bar:** 56px pill search in `container-high` with a trailing avatar; tonal bell button.
- **Floating toolbar + FAB:** 220×64 pill in `primary-container` holding four 48px named icon
  actions (Filter, Export, Copy order ID, More); 64px r20 `primary` FAB "Create order".
- **Wavy progress:** 4px wave in `primary-text` with a 4px stop dot; remainder `muted-fg` (T-03).
- **Dialog/sheet:** not drawn in the fixture; owed to #2416 (use r28 `container-high`).

## Do's and Don'ts

- **Do** match current M3 Expressive anatomy. Owner: "Material should look like the newest Material
  3 design, not 2019", and "REAL work on a per-component basis to make them TRULY UNIQUE".
- **Don't** separate surfaces with borders or shadows; climb the container ladder instead.
- **Don't** paint a pale hero, pale selected segment or pale primary in dark: use #6e56cf with white
  (R5-TONAL-DARK).
- **Do** bind enabled field labels to `fg`; focused labels to `primary-text`; errors to
  `destructive-text` with a 2px indicator and a full repair sentence (T-01, T-02).
- **Do** draw outlined buttons, chips, checkboxes and icon buttons with `input-border` (T-01), and
  the 1px enabled indicator of filled fields and text areas with `muted-fg` (≥ 3:1 on the field
  fill).
- **Do** compose hover/pressed as 8%/12% on-colour layers behind the label; disabled as 12%
  container + 38% label at parent opacity 1, never an opaque grey (T-05).
- **Do** morph shape on interaction: pressed connected inner corners 8 → 4 (T-05).
- **Do** reserve the sunny shape for the selected order; all other avatars are circles; no
  decorative blob on the hero (T-08).
- **Don't** add sparklines to secondary KPIs (T-10) or a second compose FAB in the rail (T-06).
- **Do** give every icon-only action a name ("Filter orders", "Export orders", "Copy order ID",
  "More order actions", "Create order") (T-06).
- **Do** keep the emphasized scale: 36/44 title, 45/52 hero, 32/40 secondary KPIs, 16/24 names
  (T-07); keep the wave and stop dot in `primary-text` (T-03).
- **Do** keep the Priority switch off in the fixture, as in every theme (T-09).
- **Don't** treat a floating toolbar as proven: viewport and scroll behaviour is owed to #2419.

## Iconography & Imagery

The shared `icon/*` set (Lucide-style strokes, ISC): 24px in the rail, search and toolbar, 18px in
buttons and chips, 28px in the FAB. Avatars are 40px circles with initials on `primary-container`;
the selected order uses the sunny shape. Shape badges (44px) hold product icons. No photos.

## Motion & States

Shown statically: hover 8%, pressed 12%, focus 2/2, disabled 12%/38%, selected `primary-container`,
selected + hover. M3 Expressive spring motion and the shape-morph transition are not specified in
Figma; owed to #2419 with a reduced-motion equivalent (no morph, instant state change) and RTL
mirroring of the rail, chevrons and wavy progress.

## Accessibility

| Pair (light / dark)                                                                  | Ratio           |
| ------------------------------------------------------------------------------------ | --------------- |
| `fg` on `bg`                                                                         | 15.92 / 16.25   |
| `muted-fg` on `container`                                                            | 5.59 / 8.00     |
| `muted-fg` on `container-highest` (field placeholder)                                | 4.85 / 6.60     |
| `primary-fg` on `primary` (hero, FAB, Save)                                          | 6.17 / 5.39     |
| `primary-on-container` on `primary-container`                                        | 10.92 / 10.28   |
| `ring` on `container-highest`                                                        | 4.69 / 6.25     |
| `destructive-text` on `container-highest`                                            | 9.45 / 6.19     |
| Enabled field indicator `muted-fg` on the field fill (#e3dfe6 / #323035), _measured_ | 4.8459 / 6.5985 |
| `input-border` (outlined buttons, chips) on `container`                              | 3.31 / 3.75     |

The enabled filled-field indicator meets 3:1 in both schemes on the frozen R7 renders (T-01 closed).
Disabled fields (38%) are inactive components and are exempt from the contrast minimums; that
exemption is separate and does not extend to enabled states. Hit targets: 40px buttons and checkbox
targets, 48px toolbar actions, 72px rows.

## NetScript Mapping

| Layer              | Value                                                                               |
| ------------------ | ----------------------------------------------------------------------------------- |
| Figma Theme mode   | `Tonal`                                                                             |
| Base gray × accent | Mauve × Violet (aliased inside the Tonal mode; frames set no Base modes)            |
| Density            | Comfortable (default); M3 component sizes are fixed                                 |
| Flavor             | n/a                                                                                 |
| `data-theme`       | `tonal`                                                                             |
| Language roles     | none — Tonal reads only core roles (`--ns-container*`, `--ns-primary-container`, …) |

- **Node-level exceptions:** none reported. Author-reported: no primitive bindings, no unbound
  paints, all 133 text nodes bind their font. Container radii (32, 28, 24, 20, 8, 6, 4) are literal;
  Theme `radius/card` (16) is not used by them. S1 needs an M3 shape scale. Buttons bind
  `radius/control` (999).
- **Fixed in the r7 pre-review pass** (2026-10-28): the filled text field's enabled active indicator
  (`Tonal/Text field` State=Enabled, container `16:49`) now binds `muted-fg` instead of
  `input-border`. This is the M3 on-surface-variant and the role the textarea already used.
  - Light: `#605e67` on the `#e3dfe6` field fill, _measured_ 4.8459:1 on the frozen R7 render.
  - Dark: `#bab7c0` on the `#323035` field fill, _measured_ 6.5985:1.
  - The Enabled and Disabled indicators share the same colour; Disabled keeps its 38% treatment.
  - The binding change itself (node `16:49`) is author-reported; the pixels are independently
    measured (`review/evidence-r7.json` T-01).
- **Figma frames:** Light `23:277`, Dark `25:295`; states `47:527` (Light), `47:857` (Dark);
  component sets on page `16:2` (`Tonal/Button` `16:28`, `Tonal/Text field` `16:86`,
  `Tonal/Connected
  button` `22:328`, `Tonal/Wavy progress` `22:333`, …).
- **Renders:** `renders-r7/tonal--{light,dark}.png` (frozen round-7 set);
  `renders-r4/states--tonal--{light,dark}.png` (state sheets, not in the frozen R7 set); history in
  `renders-r3/`.
- **Evidence status (TD-25).** Visual claims refer to the frozen round-7 renders
  `renders-r7/tonal--{light,dark}.png` under `.llm/runs/design-system-s4--language-review/`, hashed
  in `renders-r7/SHA256SUMS` (sha256 `092b1cd4…`; review input commit `affd6b158`). Node ids,
  variable modes, alias and `resolveForConsumer` chains, binding and unbound counts, effect-style
  values and Figma text-style weights in this file are **reported by the Figma author and
  independently unverified**: no frozen node/variable/effect/type export accompanies the snapshot.
  Ratios marked _measured_ were sampled on exported pixels; _(token)_ ratios are resolved-variable
  arithmetic; values marked _proposed_ stay proposals until a re-render proves them; runtime
  behaviour is unproven until #2419.

## Provenance

- **Source:** m3.material.io (Material 3 Expressive, May 2025); Material 3 Design Kit (Figma
  community) for calibration.
- **Rounds:** r1 CHANGES_REQUESTED (T-01…T-10); r2 T-01, T-05…T-08 open; r3 T-01 textarea and T-05
  still open; r4 PASS (light and dark). r5 dark audit found a pale hero/primary; fixed to #6e56cf;
  r6 dark PASS, light keeps its r4 PASS. r7 (frozen `renders-r7/`): PASS in both schemes; T-01
  closed on the repaired enabled field indicator (`review/tonal.md`). No current static finding.
- **Owner:** "no more AI slop and true professional UI grade quality"; earlier "too simplistic: you
  just tweaked a few colors and radius".
- **Inconsistencies:** `inventory/themes.md` (r1) lists title 40/48 SemiBold and radii 999/4/16/8;
  Figma now resolves 36/44 Medium and the containers use 28/32.
  - **Resolved in r7:** the textarea and the text fields now both use `muted-fg` for the enabled
    indicator (_measured_ 4.8459:1 light, 6.5985:1 dark).
  - Bloom frames also set the Tonal Theme mode. The Figma author reports they bind 0 core roles and
    0 Theme variables (independently unverified), so Tonal's values only reach a shared component
    rendered under `data-theme="bloom"`.
- **Invented fixture content:** Northwind data, customers, order IDs, amounts, "Importing
  marketplace orders · 214 of 314".
- **Open evidence:** #2414 fonts, numerals, shape-scale tokens, contrast matrix; #2416 canonical
  state matrix, tooltips for named actions, dialog; #2419 floating toolbar viewport/scroll, motion.
