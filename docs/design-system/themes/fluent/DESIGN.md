---
version: alpha
name: Fluent
description: 'Fluent 2 as Windows 11 ships it: a Mica window, NavigationView with the 3×16 accent pill, flat card layers, elevation borders instead of shadows, and WinUI theme brushes.'
colors:
  # Resolved from Figma file pGRLnkPPRZJZy74evNcQBr on windows 155:746 (Light) and 158:931 (Dark),
  # Theme mode "Fluent". Keys are the --ns-* suffix from each variable's code syntax. The specimen
  # binds only fluent/* roles; the core roles below are what shared components read today.
  # Values are the native WinUI brushes, except the post-round-7 project overrides F-05 / F-07
  # (see "Round-7 corrections" under Colors). Dark primary #60cdff is the F-08 owner-approved
  # exception, scoped to control-size accents and selection indicators (2026-10-28).
  bg: '#f9f9f9'
  bg-dark: '#111111'
  card: '#ffffff'
  card-dark: '#191919'
  fg: '#202020'
  fg-dark: '#eeeeee'
  muted-fg: '#646464'
  muted-fg-dark: '#b4b4b4'
  input-border: '#838383'
  input-border-dark: '#7b7b7b'
  ring: '#000000e4'
  ring-dark: '#8d8d8d' # Theme-mode Fluent ring/d realigned with fluent-focus-outer (F-07)
  primary: '#005fb8'
  primary-dark: '#60cdff' # native AccentFill; F-08 exception, controls only (owner, 2026-10-28)
  primary-fg: '#ffffff'
  primary-fg-dark: '#000000'
  fluent-text-primary: '#000000e4'
  fluent-text-primary-dark: '#ffffff'
  fluent-text-secondary: '#0000009e'
  fluent-text-secondary-dark: '#ffffffc5'
  fluent-text-tertiary: '#00000072'
  fluent-text-tertiary-dark: '#ffffff87'
  fluent-text-on-accent: '#ffffff'
  fluent-text-on-accent-dark: '#000000'
  fluent-text-on-accent-secondary: '#ffffff' # opaque project override (F-05); native white 70%
  fluent-text-on-accent-secondary-dark: '#000000' # opaque (F-05); native black 50%
  fluent-text-accent: '#003e92'
  fluent-text-accent-dark: '#99ebff'
  fluent-accent-default: '#005fb8'
  fluent-accent-default-dark: '#60cdff'
  fluent-accent-secondary: '#005fb8e5'
  fluent-accent-secondary-dark: '#60cdffe5'
  fluent-accent-tertiary: '#0054a3' # opaque pressed fill, project override (F-05); native #005fb8 at 0.8
  fluent-accent-tertiary-dark: '#60cdffcc' # native, #60cdff at 0.8 (unchanged)
  fluent-control-default: '#ffffffb3'
  fluent-control-default-dark: '#ffffff0f'
  fluent-control-secondary: '#f9f9f980'
  fluent-control-secondary-dark: '#ffffff15'
  fluent-control-input-active: '#ffffff'
  fluent-control-input-active-dark: '#1e1e1eb3'
  fluent-subtle-secondary: '#00000009'
  fluent-subtle-secondary-dark: '#ffffff0f'
  fluent-stroke-control: '#0000000f'
  fluent-stroke-control-dark: '#ffffff12'
  fluent-stroke-control-strong: '#00000072'
  fluent-stroke-control-strong-dark: '#ffffff8b'
  fluent-stroke-card: '#0000000f'
  fluent-stroke-card-dark: '#00000019'
  fluent-stroke-divider: '#0000000f'
  fluent-stroke-divider-dark: '#ffffff15'
  fluent-stroke-surface: '#75757566'
  fluent-stroke-surface-dark: '#75757566'
  fluent-elevation-control-bottom: '#0000001c'
  fluent-elevation-control-bottom-dark: '#ffffff00'
  fluent-elevation-control-top: '#00000000'
  fluent-elevation-control-top-dark: '#ffffff07'
  fluent-elevation-accent-bottom: '#00000066'
  fluent-elevation-accent-bottom-dark: '#00000023'
  fluent-focus-outer: '#000000e4'
  fluent-focus-outer-dark: '#8d8d8d' # project override (F-07): 4.91:1 on #202020; native #ffffff
  fluent-focus-inner: '#ffffffb3'
  fluent-focus-inner-dark: '#000000b3'
  fluent-card-default: '#ffffffb3'
  fluent-card-default-dark: '#ffffff0d'
  fluent-layer-default: '#ffffff80'
  fluent-layer-default-dark: '#3a3a3a4c'
  fluent-mica-tint: '#f3f3f3d1'
  fluent-mica-tint-dark: '#202020db'
  fluent-system-success: '#0f7b0f'
  fluent-system-success-dark: '#6ccb5f'
  fluent-system-caution: '#9d5d00'
  fluent-system-caution-dark: '#fce100'
  fluent-system-critical: '#c42b1c'
  fluent-system-critical-dark: '#ff99a4'
  fluent-system-caution-bg: '#fff4ce'
  fluent-system-caution-bg-dark: '#433519'
  fluent-badge-brand-bg: '#eff6fc'
  fluent-badge-brand-bg-dark: '#002848'
  fluent-badge-brand-fg: '#106ebe'
  fluent-badge-brand-fg-dark: '#3aa0f3'
typography:
  display: {
    fontFamily: Open Sans,
    fontSize: 68px,
    fontWeight: 600,
    lineHeight: 92px,
    letterSpacing: -1px,
  }
  title-large: {
    fontFamily: Open Sans,
    fontSize: 40px,
    fontWeight: 600,
    lineHeight: 52px,
    letterSpacing: -0.5px,
  }
  title: {
    fontFamily: Open Sans,
    fontSize: 28px,
    fontWeight: 600,
    lineHeight: 36px,
    letterSpacing: -0.5px,
  }
  subtitle: {
    fontFamily: Open Sans,
    fontSize: 20px,
    fontWeight: 600,
    lineHeight: 28px,
    letterSpacing: -0.2px,
  }
  body-large: { fontFamily: Open Sans, fontSize: 18px, fontWeight: 400, lineHeight: 24px }
  body: { fontFamily: Open Sans, fontSize: 14px, fontWeight: 400, lineHeight: 20px }
  body-strong: { fontFamily: Open Sans, fontSize: 14px, fontWeight: 600, lineHeight: 20px }
  caption: { fontFamily: Open Sans, fontSize: 12px, fontWeight: 400, lineHeight: 16px }
  caption-strong: { fontFamily: Open Sans, fontSize: 12px, fontWeight: 600, lineHeight: 16px }
  data: {
    fontFamily: Open Sans,
    fontSize: 14px,
    fontWeight: 400,
    lineHeight: 20px,
    fontFeature: '"tnum" 1',
  }
rounded:
  none: 0px
  indicator: 1.5px
  control: 4px
  card: 8px
  toggle: 10px
  full: 9999px
spacing:
  titlebar: 48px
  pane: 280px
  nav-item: 36px
  control: 32px
  command-bar: 40px
  header-row: 36px
  row: 48px
  page-x: 28px
  page-y: 20px
  grid: 12px
  card-padding: 16px
  settings-gap: 4px
components:
  window: { backgroundColor: '{colors.fluent-mica-tint}', rounded: '{rounded.card}' }
  window-dark: { backgroundColor: '{colors.fluent-mica-tint-dark}' }
  content-layer: { backgroundColor: '{colors.fluent-layer-default}' }
  content-layer-dark: { backgroundColor: '{colors.fluent-layer-default-dark}' }
  button-accent: {
    backgroundColor: '{colors.fluent-accent-default}',
    textColor: '{colors.fluent-text-on-accent}',
    typography: '{typography.body}',
    rounded: '{rounded.control}',
    height: 32px,
    padding: 0 12px,
  }
  button-accent-dark: {
    backgroundColor: '{colors.fluent-accent-default-dark}',
    textColor: '{colors.fluent-text-on-accent-dark}',
  }
  button-standard: {
    backgroundColor: '{colors.fluent-control-default}',
    textColor: '{colors.fluent-text-primary}',
    typography: '{typography.body}',
    rounded: '{rounded.control}',
    height: 32px,
    padding: 0 12px,
  }
  button-standard-dark: {
    backgroundColor: '{colors.fluent-control-default-dark}',
    textColor: '{colors.fluent-text-primary-dark}',
  }
  textbox: {
    backgroundColor: '{colors.fluent-control-default}',
    textColor: '{colors.fluent-text-primary}',
    typography: '{typography.body}',
    rounded: '{rounded.control}',
    height: 32px,
    padding: 5px 6px 6px 10px,
  }
  textbox-focused: {
    backgroundColor: '{colors.fluent-control-input-active}',
    textColor: '{colors.fluent-text-primary}',
    rounded: '{rounded.control}',
    height: 32px,
  }
  nav-item-selected: {
    backgroundColor: '{colors.fluent-subtle-secondary}',
    textColor: '{colors.fluent-text-primary}',
    typography: '{typography.body}',
    rounded: '{rounded.control}',
    height: 36px,
  }
  selection-pill: {
    backgroundColor: '{colors.fluent-accent-default}',
    rounded: '{rounded.indicator}',
    width: 3px,
    height: 16px,
  }
  selection-pill-dark: { backgroundColor: '{colors.fluent-accent-default-dark}' }
  list-row-selected: {
    backgroundColor: '{colors.fluent-subtle-secondary}',
    textColor: '{colors.fluent-text-primary}',
    rounded: '{rounded.control}',
    height: 48px,
  }
  kpi-card: {
    backgroundColor: '{colors.fluent-card-default}',
    textColor: '{colors.fluent-text-primary}',
    typography: '{typography.title}',
    rounded: '{rounded.card}',
    padding: 16px,
  }
  settings-card: {
    backgroundColor: '{colors.fluent-card-default}',
    textColor: '{colors.fluent-text-primary}',
    rounded: '{rounded.control}',
    padding: 16px 16px 16px 18px,
  }
  infobar-warning: {
    backgroundColor: '{colors.fluent-system-caution-bg}',
    textColor: '{colors.fluent-text-primary}',
    rounded: '{rounded.control}',
    height: 48px,
  }
  infobar-warning-dark: {
    backgroundColor: '{colors.fluent-system-caution-bg-dark}',
    textColor: '{colors.fluent-text-primary-dark}',
  }
  toggle-on: {
    backgroundColor: '{colors.fluent-accent-default}',
    rounded: '{rounded.toggle}',
    width: 40px,
    height: 20px,
  }
  badge-shipped: {
    backgroundColor: '{colors.fluent-badge-brand-bg}',
    textColor: '{colors.fluent-badge-brand-fg}',
    typography: '{typography.caption-strong}',
    rounded: '{rounded.control}',
    height: 20px,
    padding: 0 6px,
  }
  badge-shipped-dark: {
    backgroundColor: '{colors.fluent-badge-brand-bg-dark}',
    textColor: '{colors.fluent-badge-brand-fg-dark}',
  }
---

# Fluent

## Overview

- **Thesis:** Fluent 2 as Windows 11 ships it. A Mica window, a NavigationView with the accent pill,
  flat card layers and WinUI theme brushes, so the app reads as a native Windows 11 app.
- **Signature moves:**
  1. **Mica plus a content layer.** The window is Mica tint (`#F3F3F3` 82% / `#202020` 86%) over a
     120px-blurred wallpaper. The title bar and NavigationView pane sit directly on Mica. Content
     lives on one layer (`#FFFFFF` 50% / `#3A3A3A` 30%) with an 8px top-left radius and a 1,1,0,0
     CardStroke border.
  2. **Accent pills.** A 3×16 accent pill (radius 1.5) marks the selected NavigationViewItem and the
     selected ListView row. A 16×3 pill sits under the selected SelectorBar item. A focused TextBox
     gets a 2px accent bottom edge.
  3. **Elevation borders, not shadows.** Controls carry a 1px stroke with a darker bottom edge in
     light and a brighter top edge in dark. Cards are flat. Only the window casts a shadow.
- **Anchor:** WinUI 3 theme resources (`microsoft/microsoft-ui-xaml`, MIT), Fluent 2 tokens
  (`@fluentui/tokens`, MIT) for badges and avatars, and the Windows Community Toolkit SettingsCard
  (MIT). Every value and its source key is in the run's `fluent-sources.md`. Not copied: Segoe UI,
  Windows wallpapers, Microsoft product logos, Windows app icons.
- **Family:** Platform. **Best for:** Microsoft-centric enterprise, back-office tools used on
  Windows, admin consoles next to Microsoft 365. **Avoid for:** consumer marketing and expressive
  brands; suggest `bloom` or `brutal`.
- **Feel:** native, quiet, efficient. First impression: "this ships with Windows."

### Which Fluent this documents

The r5 frames (`55:19`, `58:206`) were Fluent 2 web and are rejected ("The Fluent is completely
off"). This file documents the r6 WinUI rebuild: desktops `155:737` / `158:922`. **Review status
(round 7):** light and dark CHANGES_REQUESTED on F-05 (pressed label), F-06 (ComboBox edge) and, in
dark, F-07 (white focus outline). All three were corrected in Figma after the review and are closed
(author-measured on re-exported pixels; see _Round-7 corrections_). F-08 (dark accent) is closed by
an owner decision: a scoped exception (next section). F-01…F-04 and the counter are closed. The
structure, typography and layer hierarchy are accepted.

## Colors

- **Ground and surface ladder.** Wallpaper (`fluent/wallpaper/*`) → Mica window → content layer →
  cards (`fluent-card-default`, white 70% / white 5%) with `fluent-stroke-card` → controls
  (`fluent-control-default`, white 70% / white 6%). Text is alpha black or white
  (`fluent-text-primary` 89% black / white) so it sits correctly on every layer.
- **Accent policy.** `fluent-accent-default` (`#005FB8` / `#60CDFF`) appears only on: the accent
  Button (New order, Save changes), a checked CheckBox, a ToggleSwitch that is on, the nav and row
  selection pills, the SelectorBar indicator, and a focused TextBox's bottom edge. The hyperlink
  "View all" is `fluent-text-accent`. The accent never fills a surface, header or row.
- **Status colours.** The InfoBar uses `fluent-system-caution-bg` with a `fluent-system-caution`
  severity disc. Badges are Fluent 2 "tint": Paid green, Awaiting payment orange, Payment failed
  cranberry, Shipped brand, Refunded neutral (values in `fluent-sources.md`). KPI deltas use
  `fluent-system-success` / `-critical` / `-caution` with 12px arrows.
- **Dark design notes.** Mica `#202020`, layer `#3A3A3A` 30%, cards white 5%: elevation is a lighter
  alpha, never a shadow. The native dark accent is light; the owner approved it as a scoped
  exception (next section).

### Dark accent `#60CDFF`: scoped exception, owner-approved (F-08)

WinUI's dark `AccentFillColorDefault` is `SystemAccentColorLight2` (`#60CDFF`) with black
`TextOnAccentFillColorPrimary` (11.67:1). Under the literal owner rule (GUIDELINES §4.5: light
primary buttons are dark-mode defects, applied to Studio S-19 and Terminal X-06), it is a
light-filled primary. Native fidelity alone does not grant an exception; the owner did.

- **Decision (owner, 2026-10-28, on the round-7 recommendation):** keep it as is. The native dark
  accent is allowed at control size only: accent buttons ≤ 32px tall, the 40×20 toggle, the 20px
  checkbox, plus the native selection indicators (3px pills, SelectorBar bar).
- **Scope is the rule.** It never fills a content slab, card, header, row, banner or any surface
  larger than a control. Anything outside that scope is still a GUIDELINES §4.5 defect.
- This exception is Fluent's alone. Another theme does not inherit it by citing a platform
  reference; it needs its own owner decision.

### Round-7 corrections: native value vs project override

The native column is what WinUI ships and what the frozen r7 renders show (_measured_ on
`renders-r7/fluent--components.png` by the reviewer). The override column is the current project
value, applied in Figma after the round-7 review. Its ratios were measured by the Figma author on
re-exported pixels (`corrections-r7.md` § "Round 7 — independent review corrections"); they are not
yet independently re-reviewed.

| Finding                   | Native WinUI value (source key)                                                                                                           | Project override (current)                                                                                                                                                                                                                                                                          | Status                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| F-05 pressed accent label | `TextOnAccentFillColorSecondary` (white 70% / black 50%) on `AccentFillColorTertiary` (accent at 80%). Measured 2.94:1 light, 3.10:1 dark | `fluent/text/on-accent-secondary` opaque `#ffffff` / `#000000`; `fluent/accent/tertiary` light opaque `#0054a3`, dark `#60cdff` at 0.8 (unchanged). Pressed label: white on `#0054a3` **7.51:1** light, black on `#53aad2` **8.05:1** dark. Disabled stays separately exempt                        | Closed                               |
| F-06 ComboBox bottom edge | `ControlElevationBorder` bottom (`fluent/elevation/control-bottom`). Measured 1.45:1 light, 1.25:1 dark                                   | Rest, Hover and Pressed bottom edge = 1px `fluent/stroke/control-strong`, the TextBox edge (Pressed gained the edge). Components **3.66:1** light (`#838383` on `#fbfbfb`), **5.72:1** dark (`#a7a7a7` on `#2d2d2d`); desktops 3.72–3.76:1 light, 4.80:1 dark. Focused keeps its distinct perimeter | Closed                               |
| F-07 dark focus outer     | `FocusStrokeColorOuter` dark `#ffffff`: a white full outline (16.29:1, but it breaks the owner's no-white-outline rule)                   | `fluent/focus/outer` dark `#8d8d8d`, keeping the 2px outer + 1px inner anatomy: **4.91:1** on `#202020`. The inner 1px (black at 0.7) now composites to `#2a2a2a`. Theme-mode Fluent `ring/d` is realigned to `#8d8d8d` too. Light focus is unchanged                                               | Closed                               |
| F-08 dark accent fill     | `AccentFillColorDefault` dark `#60CDFF`, black text 11.67:1                                                                               | Native value kept, scoped to controls and selection indicators                                                                                                                                                                                                                                      | Closed (owner exception, 2026-10-28) |

### Core roles: accent aligned to WinUI in r7

The core `primary`, `primary-fg` and `ring` of Theme mode `Fluent` are aligned to the WinUI brushes
(author-reported in `corrections-r7.md` §Fluent; the r5 Radix values are history). A shared
component under `data-theme="fluent"` renders WinUI blue:

| Core role                      | Light / dark                                                             | WinUI brush                                       |
| ------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------- |
| `primary`                      | `#005fb8` / `#60cdff` (dark: F-08 scoped exception)                      | AccentFill                                        |
| hover                          | 90% alpha                                                                | AccentFillSecondary                               |
| `primary-fg`                   | `#ffffff` / `#000000`                                                    | TextOnAccent                                      |
| `primary-text` = `accent-text` | `#003e92` / `#99ebff`                                                    | AccentText                                        |
| `ring`                         | `#000000e4` / `#8d8d8d` (dark realigned with `fluent/focus/outer`, F-07) | FocusStrokeOuter (light); project override (dark) |

- **Still Radix:** neutrals (`bg` `#f9f9f9` / `#111111`) and the accent tint steps
  (`primary-subtle`, `primary-border`).
- **Raw values:** the WinUI values sit in the mode as raw values. No primitive exists for them.

The language `fluent/*` roles remain the current component bindings: the specimen reads only
`fluent/*`. S1 (#2414) must alias the core roles to those roles:

- `primary` → `fluent/accent/default`;
- `primary-fg` → `fluent/text/on-accent`;
- `ring` → `fluent/focus/outer`;
- `fg` → `fluent/text/primary`;
- `muted-fg` → `fluent/text/secondary`;
- `card` → `fluent/card/default`;
- `input-border` → `fluent/stroke/control-strong`.

## Typography

- **Family.** Open Sans (OFL, Google Fonts) stands in for Segoe UI Variable. It was selected by
  visual comparison as the closest available fallback (`fluent-sources.md`); it shares Segoe UI's
  designer (Steve Matteson). Microsoft documents [Selawik](https://github.com/microsoft/Selawik) as
  an open-source Segoe UI replacement; that says nothing about an Open Sans lineage, and none is
  claimed here. Segoe UI Variable, Segoe UI and Selawik are not loadable in the file, and Selawik is
  not on Google Fonts. Code stack:
  `"Open Sans", "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif`. Segoe is never
  embedded.
- **Ramp (text styles `Fluent/*`, MUX-TYPE sizes, Fluent 2 line heights).** Caption 12/16. Body
  14/20. Body Strong 14/20 SemiBold. Body Large 18/24. Subtitle 20/28 (−0.2px). Title 28/36
  (−0.5px). Title Large 40/52 (−0.5px). Display 68/92 (−1px). Tightening approximates Segoe UI
  Variable Display's optical size.
- **Use.** Page title and KPI values: Title. Editor header and amount: Subtitle. Everything
  interactive: Body Regular (WinUI buttons are not bold). Column headers and descriptions: Caption
  in `fluent-text-secondary`. Badges: Caption Strong.

## Layout

- **Desktop.** 1648×1309 (not about 1440×1080: the fixture must fit unscrolled). Window 1520×1181 at
  (64, 56).
- **Window chrome.** TitleBar 48: back and pane toggle (40×32), a 16px app icon, "Northwind
  Commerce" in Caption, a centred 480×32 AutoSuggestBox, caption buttons 46×48 with 10px glyphs.
- **NavigationView.** Pane 280. Items 272×36 at a 4px margin, 4px apart. Separators 8. A
  NavigationViewItemHeader of 40 ("Channels", Body Strong secondary). Profile item 40 and Settings
  36 at the bottom.
- **Content layer** from x281. Page padding 20 top, 28 sides. Breadcrumb → Title → description
  (gap 4) → CommandBar 40 → InfoBar → KPI row (4 × 286×110, gap 12) → columns (gap 16): left 693
  (ListView 432 plus activity 294, gap 12), right 472 (editor; SettingsCards gap 4).
- **Rows.** ListView header 36, rows 48, pager 48. SettingsCards 70 (86 with a two-line description,
  140 for the multi-line note).

## Elevation & Depth

| Level          | Recipe (CSS)                                                                                                                                                                                                                           | Who                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Window         | `background: var(--ns-fluent-mica-tint); backdrop-filter: blur(120px); border: 1px solid var(--ns-fluent-stroke-surface); border-radius: 8px; box-shadow: 0 2px 21px #00000038, 0 32px 64px #00000047` (dark `#0000008c`, `#0000008f`) | The app window only                                                                              |
| Layer          | `background: var(--ns-fluent-layer-default); border: solid var(--ns-fluent-stroke-card); border-width: 1px 0 0 1px; border-top-left-radius: 8px`                                                                                       | The content layer                                                                                |
| Card           | `background: var(--ns-fluent-card-default); border: 1px solid var(--ns-fluent-stroke-card)`; **no shadow**                                                                                                                             | KPI, ListView, activity, SettingsCards                                                           |
| Control        | `background: var(--ns-fluent-control-default); border: 1px solid var(--ns-fluent-stroke-control); box-shadow: inset 0 -1px 0 var(--ns-fluent-elevation-control-bottom), inset 0 1px 0 var(--ns-fluent-elevation-control-top)`          | Standard Button; ComboBox fill and side strokes (its bottom edge is the Text control edge, F-06) |
| Accent control | `background: var(--ns-fluent-accent-default); border: 1px solid var(--ns-fluent-stroke-on-accent); box-shadow: inset 0 -1px 0 var(--ns-fluent-elevation-accent-bottom)`                                                                | Accent Button                                                                                    |
| Text control   | `box-shadow: inset 0 -1px 0 var(--ns-fluent-stroke-control-strong)`; focused: `inset 0 -2px 0 var(--ns-fluent-accent-default)` and `fluent-control-input-active` fill                                                                  | TextBox, AutoSuggestBox; enabled ComboBox Rest, Hover and Pressed bottom edge (F-06 override)    |
| Flyout         | `Fluent/shadow16`: `0 0 2px #0000001f, 0 8px 16px #00000024`                                                                                                                                                                           | Menus and popups only (components sheet)                                                         |

- Mica is static in CSS: a tint plus a backdrop blur. Figma has no luminosity blend, so the tint is
  raised above the API TintOpacity (0.5 / 0.8). Acrylic is for transient surfaces only and is never
  placed next to another acrylic pane.
- Figma builds the gradient elevation borders from 1px edge bars whose alpha is solved to match
  WinUI's composite (light bottom `#29000000`, dark top `#18FFFFFF`). In CSS, use inset shadows.

## Shapes

- `ControlCornerRadius` 4: buttons, TextBoxes, ComboBoxes, nav items, list rows, SettingsCards,
  badges, the InfoBar, the checkbox. `OverlayCornerRadius` 8: the window, KPI and list cards, and
  the content layer's top-left corner. Theme `radius/card` was changed from 6 to 8 for this.
- Indicators: 3×16 or 16×3 at radius 1.5. Toggle track 40×20, radius 10, with a 12px knob. Avatars
  are circles. Strokes are 1px; the TextBox focus edge is 2px.

## Components

| Component          | Fluent variant and anatomy                                                                                                                                                                                                                                                                                                                                                                                         | States in Figma                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| Button             | 32 tall, 12px sides, 16px icon, 8 gap, Body label. Standard = ControlFill plus elevation border; pressed text `text-secondary` (native). Accent = AccentFill plus white (light) / black (dark) label; **pressed accent label stays opaque on-accent primary** on the opaque `accent-tertiary` fill: 7.51:1 light / 8.05:1 dark (F-05 override, see _Round-7 corrections_). AppBarButton: label right, no rest fill | Rest, hover, pressed, disabled, focus (`153:780`) |
| TextBox            | 32 tall, padding 10/5/6/6, ControlFill, 1px stroke, `stroke-control-strong` bottom edge; focus: 2px accent bottom plus `input-active` fill; error: `system-critical` stroke, error glyph, 1px critical bottom                                                                                                                                                                                                      | Rest, hover, focus, error, disabled (`153:805`)   |
| ComboBox           | 32 tall, ControlFill, 12px chevron in `text-secondary`. **Enabled Rest, Hover and Pressed carry the TextBox bottom edge, 1px `stroke-control-strong`**: 3.66:1 light / 5.72:1 dark (F-06 override; Pressed gained the edge; the native elevation edge measured 1.45 / 1.25:1). Focused keeps a distinct perimeter                                                                                                  | Rest, hover, pressed (`153:822`)                  |
| CheckBox           | 20×20, radius 4. Unchecked: `control-alt-secondary` plus `stroke-control-strong`. Checked: accent plus on-accent tick                                                                                                                                                                                                                                                                                              | Both (`154:751`)                                  |
| ToggleSwitch       | 40×20 track, 12px knob, "On"/"Off" label to its left. Off: `control-alt-secondary` plus strong stroke, knob `text-secondary`. On: accent, knob on-accent                                                                                                                                                                                                                                                           | Both (`154:742`)                                  |
| SelectorBar        | 40 tall items, Body label plus Caption count. Selected: `text-primary` plus a 16×3 accent pill; others `text-secondary`                                                                                                                                                                                                                                                                                            | Rest / selected                                   |
| ListView row       | 48 tall, radius 4, 12px leading padding: checkbox, order plus channel (two lines), 32px avatar plus name and email, tint badge, date, total, overflow. Hover and selected = `subtle-secondary`; selected adds the 3×16 accent pill                                                                                                                                                                                 | Rest, hover, selected (`154:779`)                 |
| Badge              | Fluent 2 tint, 20 tall, radius 4, 0/6 padding, Caption Strong, 1px tone border                                                                                                                                                                                                                                                                                                                                     | Five statuses (`154:790`)                         |
| KPI card           | 286×110, radius 8, 16 padding, 32px Fluent Color icon, Body label, Title value, Caption delta with a 12px arrow                                                                                                                                                                                                                                                                                                    | Rest                                              |
| InfoBar            | Warning: min 48, `system-caution-bg`, CardStroke, 16px severity disc, Body Strong title plus Body message, standard Button, 38px close                                                                                                                                                                                                                                                                             | Rest                                              |
| NavigationViewItem | 36 tall, radius 4, 20px icon (Filled when selected), Body label; selected = `subtle-secondary` plus pill                                                                                                                                                                                                                                                                                                           | Rest, hover, selected (`154:768`)                 |
| SettingsCard       | Radius 4, padding 16/16/16/18, 20px icon, Body header plus Caption description, the control trailing                                                                                                                                                                                                                                                                                                               | Rest                                              |
| Dialog / flyout    | Not in the specimen. Use `<dialog>` at radius 8 with `shadow64` over a Smoke scrim; flyouts `shadow16`                                                                                                                                                                                                                                                                                                             | Owed to #2416                                     |

## Do's and Don'ts

- **Don't** return to the r5 Fluent 2 web look: "The Fluent is completely off".
- **Do** take every colour, size and radius from WinUI theme resources and cite its key
  (`fluent-sources.md`). No invented brushes.
- **Do** keep cards flat. Depth comes from layers and elevation borders, not shadows.
- **Do** confine the accent to the seven places listed in _Colors_. Never use it as a surface.
- **Do** give every text input its `stroke-control-strong` bottom edge (F-01 lineage: 3.75:1 light,
  4.80:1 dark measured), with no black override in dark.
- **Do** draw selection and focus indicators in the accent fill, which clears 3:1 against the
  selected fill (5.58 / 6.06:1). F-02 lineage: never a dark brand stroke on a dark ground.
- **Do** pair Regular icons with the Filled variant for the selected destination (F-03; the r6 set
  has `box_20_filled`).
- **Do** keep the shared fixture totals (Refunded 87) (F-04).
- **Don't** use the dark accent `#60CDFF` beyond its approved scope (F-08): control-sized buttons,
  toggle, checkbox and selection pills only, never content slabs, cards, headers, rows or banners.
- **Do** keep enabled pressed accent labels opaque on-accent primary on the opaque `accent-tertiary`
  fill (F-05: 7.51 / 8.05:1), give enabled ComboBoxes the 1px `stroke-control-strong` bottom edge in
  Rest, Hover and Pressed (F-06: 3.66 / 5.72:1), and keep the WinUI 2px/1px focus visual with the
  gray `#8d8d8d` dark outer, never white (F-07: 4.91:1).
- **Don't** put informative text in `fluent-text-tertiary` on cards. The "0 / 500" counter uses
  `fluent-text-secondary`: `#5f5f60` light / `#d0d0d0` dark, 6.10 / 8.45:1 (author-reported pixel
  measurement).
- **Don't** embed Segoe UI or show Microsoft product logos.
- **Don't** place acrylic on content, put two acrylic panes edge to edge, or set accent text on
  acrylic.

## Iconography & Imagery

- Fluent System Icons (MIT): Regular 20 for nav and SettingsCards, 16 for commands, 12 for chevrons
  and arrows; Filled for the selected destination. 51 components in `152:729`.
- The Fluent Color set (MIT) for KPI tiles (32), the app icon (16), the editor header and activity
  (24).
- Hand-drawn SVG: caption glyphs (10px, 1px stroke) and the InfoBar severity disc. No logos.
- Avatars: 32px circles in the Fluent 2 colourful palette (light: `tint40` bg, `shade30` fg; dark:
  reversed). Wallpaper: an original abstract of blurred blobs, never the Windows "Bloom".

## Motion & States

- Drawn on the components sheet: Button rest, hover, pressed, disabled and focus; TextBox rest,
  hover, focus and error; ComboBox rest, hover and pressed. Physics: hover and press step the
  ControlFill (Default → Secondary → Tertiary); standard pressed text goes to `text-secondary`
  (native); the pressed accent drops its bottom edge, and its label stays opaque on-accent primary
  (F-05 override: `text-on-accent-secondary` is opaque; the native translucent value fails AA).
- Fluent 2 motion tokens, for runtime (#2419): 50–500ms durations, `decelerateMid`
  `cubic-bezier(0,0,0,1)`. Fluent 2 web grows the input focus bar in 200ms and removes it in 50ms;
  WinUI swaps it instantly. Reduced motion: no growth, instant state.

## Accessibility

| Pair (measured on renders or tokens)                             | Light                                             | Dark                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------- |
| Accent button label                                              | white/`#005FB8` 6.31:1                            | black/`#60CDFF` 11.67:1 (F-08 scoped exception)               |
| `text-secondary` on card / layer                                 | 6.17 / 5.90:1                                     | 9.09 / 9.62:1                                                 |
| "0 / 500" counter, now `text-secondary` (author-reported pixels) | `#5f5f60` 6.10:1                                  | `#d0d0d0` 8.45:1                                              |
| TextBox bottom edge (pixels)                                     | `#838383`/`#fdfefe` 3.75:1                        | `#acacad`/`#3c3d3e` 4.80:1                                    |
| Selection pill on selected fill                                  | 5.58:1                                            | 6.06:1                                                        |
| Badges (lowest)                                                  | brand 4.82:1, marigold avatar 4.77:1              | danger 4.96:1                                                 |
| Pressed accent label (F-05, author-measured after the fix)       | white/`#0054A3` 7.51:1                            | black/`#53AAD2` 8.05:1                                        |
| ComboBox bottom edge (F-06, author-measured after the fix)       | `#838383`/`#fbfbfb` 3.66:1 (desktops 3.72–3.76:1) | `#a7a7a7`/`#2d2d2d` 5.72:1 (desktops 4.80:1)                  |
| Focus outer (F-07, author-measured after the fix)                | black 89% (unchanged)                             | `#8d8d8d`/`#202020` 4.91:1                                    |
| Before the fix, native (_measured_ on the frozen r7 renders)     | pressed label 2.94:1; ComboBox edge 1.45:1        | pressed label 3.10:1; ComboBox edge 1.25:1; white focus outer |

- No contrast failure remains in the shown states: F-05, F-06 and F-07 are closed by the
  post-round-7 Figma corrections (author-measured; the next independent review confirms them). F-08
  is an owner-approved scoped exception. Disabled states stay separately exempt.
- Focus: 2px outer plus 1px inner, offset 3 (WinUI focus visual). Light outer is black 89%. The dark
  outer is `#8d8d8d` (4.91:1 on `#202020`), a project override of WinUI's white FocusStrokeOuter
  under the owner's no-white-outline rule (F-07); the inner 1px composites to `#2a2a2a`. Shown on
  the components sheet; in-context focus is owed to #2416.
- Hit targets: buttons 32, nav items 36, rows 48, caption buttons 46×48.
- RTL: mirror the pane, pills, breadcrumbs and chevrons.

## NetScript Mapping

| Layer              | Value                                                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Figma Theme mode   | `Fluent` (mode `52:0`); `radius/card` set to 8 in r6. No non-Fluent frame uses that mode                                                                                                               |
| Base gray × accent | The specimen binds no ramp. The core roles in this mode resolve to neutral Radix gray × the WinUI accent (aligned in the r7 pre-review pass; the accent tint steps are still Radix blue; see _Colors_) |
| Density            | None bound (WinUI defaults)                                                                                                                                                                            |
| Flavor             | n/a                                                                                                                                                                                                    |
| `data-theme`       | `fluent`                                                                                                                                                                                               |
| Language roles     | `fluent/*`: 79 Scheme roles, `--ns-fluent-*` (text, control, subtle, accent, stroke, elevation, focus, card, layer, solid, mica, system, badge ×15, avatar ×12, wallpaper ×6)                          |

- **Node-level exceptions:** none reported. Per the Figma author, every solid paint in the Light
  window binds a `fluent/*` role (0 unbound) and radii bind `radius/control` and `radius/card`. Not
  componentised: SettingsCard rows, KPI cards and table rows are frames.
- **Fixed in the r7 pre-review pass** (2026-10-28; `corrections-r7.md` in the run dir; author
  report, the counter is visually confirmed by the round-7 review):
  - **"0 / 500" counter** (`156:964` / `158:1285`). It now binds `fluent/text/secondary` instead of
    `fluent/text/tertiary`.
    - Light: `#5f5f60` on `#f9fafb`, 6.10:1 (was 3.31).
    - Dark: `#d0d0d0`, 8.45:1 (was 4.91).
  - **Theme mode `Fluent` core accent, ring and text aligned to WinUI** (see _Colors_). The current
    frames reach only `radius/*` in Theme, so they render unchanged. Only the rejected r5 frames and
    the r5 components re-render.
  - **Stale-paint sweep.** It re-seeded 3 `border/input` paints that stored `#000000`: `53:26` (r5
    `Fluent/Input`), `57:248` and `58:503` (rejected r5 textareas). The stale black had been
    rendering. No current node was affected.
- **Fixed after the round-7 review** (2026-10-28; `corrections-r7.md` § "Round 7 — independent
  review corrections"; author report, measured on re-exported pixels):
  - **F-05:** `fluent/text/on-accent-secondary` (`150:1158`) opaque in both modes;
    `fluent/accent/tertiary` (`150:1173`) light `#0054a3` at 1, dark unchanged.
  - **F-06:** `fluent/ComboBox` Rest `153:811` and Hover `153:817` edges rebound to
    `stroke/control-strong`; Pressed `153:818` gained a 1px edge (`199:5993`). All 8 instances
    inherit it.
  - **F-07:** `fluent/focus/outer` (`150:1185`) dark `#8d8d8d`; the six focus effects resolve to it.
    Theme-mode Fluent `ring/d` realigned to `#8d8d8d`.
  - F-08 was not touched.
- **Figma frames** (page `53:2`): Light desktop `155:737` (window `155:746`); Dark desktop `158:922`
  (window `158:931`); components `159:1106` (panels `159:1107` / `159:1330`); library `153:730`
  (Button `153:780`, TextBox `153:805`, ComboBox `153:822`, ToggleSwitch `154:742`, CheckBox
  `154:751`, NavigationViewItem `154:768`, ListViewItem `154:779`, Badge `154:790`, Avatar
  `154:803`); icons `152:729`. Rejected: `55:19`, `58:206`.
- **Renders:** `renders-r7/fluent--{light,dark,components}.png` (frozen round-7 set);
  `renders-r7/fluent-r5-rejected--dark.png` (record only). They predate the F-05/F-06/F-07
  corrections, so they show the native values. The corrected re-exports overwrite
  `renders-r6/fluent--{light,dark,components}.png`; they are not hashed in the frozen set, so the
  next review round should freeze them.
- **Evidence status (TD-25).** Visual claims refer to the frozen round-7 renders
  `renders-r7/fluent--{light,dark,components}.png` under
  `.llm/runs/design-system-s4--language-review/`, hashed in `renders-r7/SHA256SUMS` (sha256
  `092b1cd4…`; review input commit `affd6b158`). Node ids, variable modes, alias and
  `resolveForConsumer` chains, binding and unbound counts, effect-style values and Figma text-style
  weights in this file are **reported by the Figma author and independently unverified**: no frozen
  node/variable/effect/type export accompanies the snapshot. Ratios marked _measured_ were sampled
  on exported pixels; _(token)_ ratios are resolved-variable arithmetic; values marked _proposed_
  stay proposals until a re-render proves them; runtime behaviour is unproven until #2419.

## Provenance

- **Sources** (MIT except Learn): `microsoft/microsoft-ui-xaml` theme resources (MUX-*),
  `CommunityToolkit/Windows` SettingsCard, `microsoft/fluentui` tokens and Badge styles,
  `microsoft/fluentui-system-icons`, Microsoft Learn Mica guidance. Keys: `fluent-sources.md`.
- **Review rounds (r3–r6 on the rejected r5 frames):** r3 F-01 to F-04; r4 F-02 and F-04 closed; r5
  F-01 open, F-03 handed off; r6 light PASS (carried), dark CHANGES_REQUESTED (F-01). **Round 7 (the
  WinUI rebuild):** light and dark CHANGES_REQUESTED on F-05 and F-06, plus F-07 in dark; F-08
  recommended as a scoped exception; F-01…F-04 and the counter closed. After the review, F-05, F-06
  and F-07 were corrected in Figma and are closed (author-measured; the next independent review
  confirms them). The pre-review core-role alignment and counter fix are author-reported
  (`corrections-r7.md`); the counter is visually confirmed by the round-7 review, the core-role
  values are not independently verified.
- **Owner decisions (verbatim):** "Note client has a fluent web 3.x more modern and unique but it's
  the right direction" (round 3); "The Fluent is completely off" (round 6, which triggered the WinUI
  rebuild); on F-08, choosing between the scoped `#60CDFF` exception and a darker accent: "Stay as
  is" (2026-10-28).
- **Known deviations** (`fluent-sources.md`): Open Sans, static Mica, a 1648×1309 desktop, edge bars
  for gradient borders, a fixed default-blue accent, the web brand tint `#106EBE` on Shipped, no
  filter box. Its "−0.5px at Title and above" note disagrees with the styles (Display −1px, Subtitle
  −0.2px).
- **Invented fixture content:** Northwind Commerce, every name and order, channel counts (1,846 /
  612 / 298 / 426, sum 3,182), "Page 1 of 531", "Last edited by Maya Rossi · 2 min ago", "Store
  manager", the descriptions on the SettingsCards.
- **Open evidence:** #2414 (core-role aliasing, fonts, `tnum`), #2416 (in-context focus, dialogs,
  flyouts), #2419 (Mica fallback, motion, keyboard).
