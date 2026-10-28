---
name: fresh-ui-theme-liquid
description: Build, extend or review NetScript Fresh UI screens in the Liquid theme (macOS 27 Liquid Glass over a real desktop, with a translucent edge-to-edge sidebar, kit-recipe glass toolbar groups, and a lensing inspector sheet and selection bar over opaque content). Use when a project sets data-theme="liquid", asks for Liquid Glass, macOS 27, iOS 27, visionOS-like glass, "the new Apple look", glass sheets or a floating toolbar, or adds screens or components to a Liquid app. For the Apple-inspired classic look (floating sidebar, capsule buttons, inset grouped lists, blur-only materials) use fresh-ui-theme-cupertino instead.
---

# Liquid theme

Read `DESIGN.md` in this folder first. It holds the tokens and the full specification. This file is
the working procedure. The cross-theme rules are in `docs/design-system/GUIDELINES.md` (shipped as
the `netscript-design` skill).

## Use it when / don't use it when

- **Use for:** pro desktop tools, inspectors, media, asset and design tools, dashboards where the
  desktop context matters.
- **Don't use for:** long reading, dense data entry or many-field forms. Glass behind text reduces
  legibility. Suggest `cupertino` (calm Apple) or `studio`.

## Thesis

Glass is reserved for navigation and controls. Content is opaque, and a desktop wallpaper sits
behind the window. Signature moves:

1. A desktop under glass: a radius-16 window on a blurred wallpaper; the 240px sidebar at 58% / 52%
   with a 60px backdrop blur.
2. Specular rims: gradient 1px strokes (100→25→75% white light, 34→5→18% dark), a top highlight and
   an inner glow on the sheet, the selection bar and the segmented thumb.
3. Kit-recipe toolbar: 36px groups on a 52px hard scroll edge; `#FBFBFB`, 0.5px outline, ±0.75px
   side shading, no drop shadow.

## Hard rules

- MUST keep the proportions and composition in `DESIGN.md`. Apply macOS 27 kit facts only as local
  corrections, never as a template.
- MUST put glass only on the sidebar, toolbar groups, search, sheet, selection bar and segmented
  thumb. Hero, platters, banner and table stay opaque.
- MUST render a wallpaper or colour field behind the window. Never glass over a flat page.
- MUST keep sidebar selection grey (`--ns-liquid-sidebar-selection`), never accent.
- MUST use `--ns-liquid-primary-default` (`#0063e1` / `#0058d0`) for filled actions and the selected
  row, with white text (5.42 / 6.35:1). NEVER white on `#0a84ff` (3.65:1).
- MUST keep the colourful avatars: discs in the scheme's Apple hue (`--ns-liquid-tag-*`) with black
  `#000000` initials (minimum 5.08:1 light, 5.76:1 dark). NEVER white initials on these hues
  (2.02–3.65:1), and don't replace the avatars with a pastel template.
- MUST give editable fields and off-switch tracks a 1px `--ns-liquid-border-input` edge (off track
  3.59:1 light / 4.28:1 dark), and draw focus as a solid 3px `--ns-liquid-border-ring` band: a 1px
  inside stroke plus a 2px solid ring, no translucent halo (3.98:1 / 3.83:1 against the group).
- MUST keep tinted labels ≥4.5:1 at their actual composite. Light green deltas use
  `--ns-liquid-success-text` (`#1e7b34`) on a 12% `--ns-liquid-tag-green` tint; dark deltas use
  `--ns-success-text`.
- MUST set the "Shipped" pill's label and dot in `--ns-liquid-status-shipped-fg` (`#005fbe` light,
  `#409cff` dark) on the 14% accent tint: 4.57:1 light. NEVER use `#0066cc`
  (`--ns-liquid-primary-text`) there; it measures 4.10:1.
- MUST keep dark mode designed: smoky glass (sheet `#262629` 80%, bar `#2c2c2e` 70%), dim rims,
  darker blue. Never a white slab, white perimeter or white outer shadow.
- MUST only read semantic roles (`--ns-*`) and `--ns-liquid-*` roles. Never use primitives, and
  don't add new literal Apple hues: bind `--ns-liquid-tag-*` and `--ns-liquid-accent-system`.

## Building a screen

1. **Enable the theme:** `data-theme="liquid"`, `data-scheme`, `data-density="comfortable"`
   (provisional until #2414).
2. **Compose:** wallpaper → window (radius 16, 80px margin) → glass sidebar (240) → 52px scroll edge
   with toolbar groups → opaque content column (24px inset) → floating glass: a detached inspector
   sheet 12px from the toolbar, right and bottom edges, plus a selection bar when rows are selected.
3. **Pick variants:**

   | Need                 | Liquid variant                                                                          |
   | -------------------- | --------------------------------------------------------------------------------------- |
   | Primary action       | Prominent capsule (toolbar, 36) or a 40px pill (sheet) in `--ns-liquid-primary-default` |
   | Secondary action     | 40px pill on `--ns-material-track`; toolbar actions as icon-only glass groups           |
   | Bulk actions         | Floating selection bar, 44 tall, radius 22, `primary-text` actions                      |
   | Filter tabs          | Pill segmented control with a glass thumb and counts                                    |
   | Table                | 40px rows, radius 8, zebra, full-row blue selection, dot-plus-word status               |
   | Record detail / form | Inspector sheet with grouped sections (radius 12, 44px rows)                            |
   | KPI                  | Hero number plus area chart, then 203×92 platters                                       |
   | Alert                | 44px `warning-subtle` banner, radius 12                                                 |
   | Boolean              | 46×28 switch, 24px knob                                                                 |

4. **Use the signature objects** for their intended jobs: the sheet for the selected record, the
   selection bar only while a selection exists, the scroll edge only where content scrolls under the
   toolbar.
5. **Handle states:** only focus, error, on/off and selected are drawn. Hover, press, disabled and
   reduced transparency are pending in #2416; follow `DESIGN.md` → _Motion & States_.

## New components or screens

- First decide which plane the component belongs to: content (opaque, no shadow) or control (glass,
  rim, lensing). Never both.
- Derive geometry concentrically: a pill inside the 36px toolbar, radius 12 groups inside the radius
  22 sheet, radius 7 fields inside the groups.
- New visual roles go under `liquid/<path>` and must be registered in #2414. Reuse the existing
  `liquid/*` roles (`tag/*`, `switch/*`, `border/*`, `info/*`, `success/text`) before adding any.
- Add every new component in Light and Dark, over both the bright and the dark wallpaper.

## Self-check before handing off

- [ ] Recognisable as Liquid at a 480px thumbnail: wallpaper, glass sidebar, floating sheet.
- [ ] Dark audit: no white headers, light slabs, white outlines or light primary buttons.
- [ ] Text ≥ 4.5:1; input, checkbox and switch boundaries and focus ≥ 3:1. Measured on composited
      pixels over the brightest and darkest wallpaper area.
- [ ] Every glass node is navigation or a control; content carries no blur or shadow.
- [ ] Avatars (black initials), off-switch edges and the 3px solid focus band follow the recipes in
      _Hard rules_; tinted status pills reach 4.5:1 at their composite.
- [ ] Whole-pixel edges; bound paints seeded with their resolved colour (Figma).

## References

`DESIGN.md` → Sources.
