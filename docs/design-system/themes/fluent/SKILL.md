---
name: fresh-ui-theme-fluent
description: Build, extend or review NetScript Fresh UI screens in the Fluent theme (Fluent 2 as Windows 11 ships it, with a Mica window, a NavigationView with the 3×16 accent pill, flat card layers, elevation borders and WinUI theme brushes). Use when a project sets data-theme="fluent", asks for a Windows 11, WinUI, Fluent 2, Microsoft 365-adjacent or "native Windows" look, mentions Mica, NavigationView, SettingsCard or InfoBar, or adds screens or components to a Fluent app.
---

# Fluent theme

Read `DESIGN.md` in this folder first. It holds the tokens and the full specification. This file is
the working procedure. The cross-theme rules are in `docs/design-system/GUIDELINES.md` (shipped as
the `netscript-design` skill). Every WinUI value and its source key is listed in the S4 run's
`fluent-sources.md`; treat that file as the primary reference.

> **Review status (round 7):** the WinUI rebuild (`155:737` / `158:922`) keeps its structure, but
> both schemes were CHANGES_REQUESTED on F-05 (pressed label) and F-06 (ComboBox edge), plus F-07
> (white dark focus outline). All three were corrected in Figma after the review and are closed
> (author-measured; values below). The dark accent `#60CDFF` is **F-08, an owner-approved exception
> scoped to controls** (2026-10-28). The r5 Fluent 2 web frames were rejected ("The Fluent is
> completely off").

## Use it when / don't use it when

- **Use for:** Microsoft-centric enterprise, Windows-first back-office and admin tools, settings and
  configuration surfaces, apps that sit next to Microsoft 365.
- **Don't use for:** consumer, marketing or expressive brands, or Apple-first audiences. Suggest
  `bloom`, `brutal` or `cupertino`.

## The thesis in one breath

A native Windows 11 app: Mica, layers and theme brushes, not a web dashboard. Signature moves:

1. Mica plus one content layer: tint 82% / 86% over a 120px blur; the layer at white 50% / `#3A3A3A`
   30%, top-left radius 8, a 1,1,0,0 CardStroke.
2. Accent pills: 3×16 for the selected nav item and row, 16×3 under the selected SelectorBar item, a
   2px accent bottom edge on a focused TextBox.
3. Elevation borders, not shadows: controls get a 1px stroke plus a darker bottom (light) or a
   brighter top (dark); cards are flat; only the window has a shadow.

## Hard rules

- MUST take values from WinUI theme resources and cite the key (`fluent-sources.md`). Never invent a
  brush or approximate one by eye. Owner on the improvised r5 version: "completely off".
- MUST keep cards and layers flat: no `box-shadow` on cards. Only the window (`0 2 21` plus
  `0 32 64`) and flyouts (`shadow16`) cast shadows.
- MUST use radius 4 (`ControlCornerRadius`) for controls, rows, nav items and SettingsCards, and 8
  (`OverlayCornerRadius`) for the window, cards and flyouts.
- MUST confine `--ns-fluent-accent-default` to the accent Button, a checked CheckBox, an on
  ToggleSwitch, the selection pills, the SelectorBar indicator and the TextBox focus edge.
- MUST give every text input its `--ns-fluent-stroke-control-strong` bottom edge (≥3:1, F-01
  lineage) and its 2px accent focus edge.
- MUST pair Regular icons with the Filled icon for the selected destination (F-03).
- MUST keep dark mode designed: Mica `#202020`, the layer `#3A3A3A` 30%, cards white 5%.
- MUST keep the dark accent `#60CDFF` (WinUI's native dark AccentFill, black text) inside its
  owner-approved scope (F-08): control size only (accent buttons ≤ 32px tall, 40×20 toggles, 20px
  checkboxes) plus native selection indicators (3px pills, SelectorBar). NEVER fill a content slab,
  header, row, card or banner with it.
- MUST keep enabled pressed accent labels opaque: `--ns-fluent-text-on-accent-secondary` is
  `#ffffff` / `#000000` on `--ns-fluent-accent-tertiary` (`#0054a3` light, `#60cdff` at 0.8 dark),
  7.51 / 8.05:1. The native translucent pressed label fails (F-05). Disabled stays separately
  exempt.
- MUST give enabled ComboBoxes (Rest, Hover, Pressed) the same 1px
  `--ns-fluent-stroke-control-strong` bottom edge as the TextBox: 3.66:1 light, 5.72:1 dark (F-06).
- MUST keep the WinUI focus visual (2px outer, 1px inner, 3px outset) and NEVER draw it as a white
  outline in dark: `--ns-fluent-focus-outer` dark is `#8d8d8d`, 4.91:1 on `#202020` (F-07).
- MUST NOT use `--ns-fluent-text-tertiary` for informative text on cards; use
  `--ns-fluent-text-secondary` (the "0 / 500" counter now does: `#5f5f60` / `#d0d0d0`, reported 6.10
  / 8.45:1).
- MUST only read `--ns-*` and `--ns-fluent-*` roles. Never use primitives. The core `--ns-primary`,
  `--ns-primary-fg` and `--ns-ring` in this theme are aligned to WinUI (AccentFill, TextOnAccent,
  FocusStrokeOuter; dark `--ns-ring` follows the `#8d8d8d` focus outer); components still bind the
  `--ns-fluent-*` roles until S1 aliases the core roles to them.

## Building a screen

1. **Enable the theme:** `data-theme="fluent"`, `data-scheme` (provisional until S1 #2414). No
   density mode; WinUI sizes are the defaults.
2. **Compose:** TitleBar 48 (back, pane toggle, app icon, title, centred AutoSuggestBox, caption
   buttons) → NavigationView pane 280 on Mica → content layer (padding 20/28) → breadcrumb, Title,
   description → CommandBar (accent primary first, separator, AppBarButtons) → InfoBar when needed →
   cards on a 12px grid.
3. **Pick variants:**

   | Need             | Fluent variant                                                                           |
   | ---------------- | ---------------------------------------------------------------------------------------- |
   | Primary action   | Accent Button, 32 tall, Body label                                                       |
   | Secondary action | Standard Button or a label-on-right AppBarButton in the CommandBar                       |
   | Navigation       | NavigationViewItem 36, Filled icon plus a 3×16 pill when selected                        |
   | Filter tabs      | SelectorBar with counts and a 16×3 indicator                                             |
   | Table            | ListView rows 48, checkbox column, Fluent 2 tint badges, a 3×16 pill on the selected row |
   | Form             | A stack of SettingsCards (radius 4, gap 4) with the control trailing                     |
   | Text input       | TextBox 32 with a strong bottom edge; error = critical stroke, glyph and helper          |
   | Choice           | ComboBox 32 with the same strong bottom edge in Rest, Hover and Pressed (F-06)           |
   | Boolean          | ToggleSwitch 40×20 with an "On"/"Off" label                                              |
   | KPI              | Card 286×110, radius 8, a 32px Fluent Color icon, Title value                            |
   | Alert            | InfoBar (severity background, disc icon, title plus message, action, close)              |

4. **Use the signature objects** where they carry meaning: Mica only on the window, one content
   layer per window, pills only for the current selection.
5. **Handle states:** Button and TextBox states are on the components sheet (`159:1106`). Hover and
   press step ControlFill Default → Secondary → Tertiary; standard pressed text is `text-secondary`
   (native), but the pressed accent label stays opaque on-accent primary (F-05); focus is 2px outer
   plus 1px inner at a 3px offset, with the gray `#8d8d8d` outer in dark (F-07). The frozen r7
   renders predate these corrections; the corrected re-exports are `renders-r6/fluent--*`.

## New components or screens

- Start from the WinUI control that exists for the job (`fluent/*` sets in `153:730`) and copy its
  theme-resource keys. Don't restyle a web component to look like one.
- New colours must map to a WinUI or Fluent 2 token and go under `fluent/<path>`, registered in S1.
- Add the component to both panels of the components sheet (Light and Dark).

## Self-check before handing off

- [ ] Recognisable as Windows 11 at a 480px thumbnail: Mica, pane, pills, flat cards.
- [ ] Dark audit: no white headers, light slabs or white outlines (focus included, F-07); the dark
      accent only at control size and on selection indicators (F-08 scope).
- [ ] Pressed accent labels ≥ 4.5:1 (F-05); ComboBox bottom edges ≥ 3:1 (F-06).
- [ ] Text ≥ 4.5:1; input, checkbox and switch boundaries and focus ≥ 3:1. Measured on pixels.
- [ ] No shadow on any card or layer; every control has its elevation border.
- [ ] Every brush traces to a key in `fluent-sources.md`.
- [ ] Whole-pixel edges; bound paints seeded with their resolved colour (Figma).

## References

`DESIGN.md` → Provenance.
