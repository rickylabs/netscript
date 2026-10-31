---
name: fresh-ui-theme-cupertino
description: Build, extend or review NetScript Fresh UI screens in the Cupertino theme (Apple-inspired classic, with a translucent floating sidebar, a large-title header, capsule buttons, inset grouped lists, blur-only materials and full-row system-blue selection on opaque slate content cards; a hand-built composition, not strict macOS 15 / iOS 18 fidelity). Use when a project sets data-theme="cupertino", asks for a classic Mac-like, iOS Settings-style or "Apple but not Liquid Glass" look, or adds screens or components to a Cupertino app. For macOS 27 / Liquid Glass use fresh-ui-theme-liquid instead.
---

# Cupertino theme

Read `DESIGN.md` in this folder first. It holds the tokens and the full specification. This file is
the working procedure. The cross-theme rules are in `docs/design-system/GUIDELINES.md` (shipped as
the `netscript-design` skill).

## Use it when / don't use it when

- **Use for:** Mac-like tools, settings and configuration screens, back-office admin with forms,
  small-team dashboards that should look native on Apple hardware.
- **Don't use for:** a request for "the new Apple look", glass sheets or lensing. Suggest `liquid`.
  For dense, Windows-centric enterprise suggest `fluent`.

## Thesis

Apple-inspired classic: floating sidebar, large-title header, capsule buttons, inset grouped lists
and blur-only materials. One translucent plane (sidebar and command capsules) sits over opaque slate
content. It is a hand-built composition, not a strict macOS 15 / iOS 18 reproduction. Signature
moves:

1. Inset grouped editor: uppercase 12px captions over radius-12 groups of 44px rows, with a muted
   value and a chevron.
2. Full-row system-blue selection: the selected row fills with `--ns-primary`, and every glyph on it
   turns `--ns-primary-fg`.
3. One vibrancy plane: only the sidebar and Filter/Export capsules blur; content cards are opaque
   with a 1px `--ns-material-stroke` rim.

## Hard rules

- MUST keep the hand-built composition: floating 248px sidebar at 16px inset, large title, 36px
  capsules, inline grouped editor. NEVER convert it to a strict macOS 15 / iOS 18 reproduction
  (attached opaque sidebar, bordered push buttons). That is the separate Apple Classic theme
  (planned, #2443).
- MUST NOT ship lensing, refraction, dispersion, specular rims, a detached sheet or a floating
  selection bar. Those belong to Liquid, and the two themes stay visually distinct. The Figma frames
  carry `GLASS` refraction (0.50–0.55); the web theme proposes `backdrop-filter: blur()` plus tint
  only. Treat that as a proposed approximation, not a verified equivalent, until the comparison
  against the frames in #2419.
- MUST keep content opaque: KPI widgets, list, form, notice and activity are `--ns-card`.
- MUST give editable boundaries 1px `--ns-muted-fg` (search fields), and paint off-switch tracks and
  unchecked circles in `--ns-input-border`.
- MUST use the `*-text` roles for tinted text and 2px sparklines, never raw status fills.
- MUST show an invalid value and its repair as two lines: value, then a 12/16 helper.
- MUST keep dark mode designed: tinted slate grounds (`#111113`, `#18191b`), rims at 13% white, and
  dark `#111113` ink on the `#0090ff` primary. Never white text on `#0090ff` (3.26:1). The white
  tick on a checked selection circle is a graphic and meets the 3:1 non-text minimum.
- MUST paint the switch knob with its own `switch-thumb` role (pending in #2414; white in light,
  `#111113` in dark), never by binding `--ns-primary-fg`.
- MUST ship the two accessibility preference variants for every screen: Reduce Transparency (aurora
  hidden; the sidebar falls back to opaque `--ns-card`) and Increase Contrast (`--ns-border-strong`
  rims). They are preferences, not the default look.
- MUST only read semantic roles (`--ns-*`). Never use primitives. Don't adopt the 27 unused
  `--ns-cupertino-*` roles until #2414 decides whether they stay.

## Building a screen

1. **Enable the theme:** `data-theme="cupertino"`, `data-scheme="light|dark"`,
   `data-density="comfortable"` (provisional until #2414).
2. **Compose:** canvas `--ns-bg` plus aurora → floating translucent sidebar (radius 26) → main
   column at x288 with an 18px vertical rhythm → header row (large title left, capsules right) →
   filters (segmented left, search right) → opaque cards, 12–14px apart.
3. **Pick variants:**

   | Need             | Cupertino variant                                                                                                                                                                                |
   | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
   | Primary action   | Prominent capsule, 36 tall, `--ns-primary`                                                                                                                                                       |
   | Secondary action | Material capsule (`--ns-material-fill`, 1px `--ns-material-stroke`)                                                                                                                              |
   | Inline link      | Plain button in `--ns-primary-text`                                                                                                                                                              |
   | Filter tabs      | Segmented control: 32 track, 28 thumb                                                                                                                                                            |
   | Table            | 52px rows, radius 12, selection circle column, dot-plus-word status; tracks `40px 104px minmax(0,1fr) 124px 150px 128px 104px 36px`, resolved after the list's 7px inset and the 8px row padding |
   | Form             | Inset grouped list with captions, 44px rows                                                                                                                                                      |
   | Boolean          | 51×31 switch: `--ns-success` on, `--ns-input-border` off, knob in the `switch-thumb` role                                                                                                        |
   | KPI              | 233-wide widget, radius 24, tinted icon tile, `kpi` value, 2px sparkline                                                                                                                         |
   | Alert            | Opaque notice card, radius 22, warning icon tile, plain action                                                                                                                                   |
   | Dialog           | Native `<dialog>`, opaque `--ns-card`, radius 26, over `--ns-overlay`                                                                                                                            |

4. **Use the signature objects** for their intended jobs: grouped lists for record details and
   settings, full-row selection for the active record, the translucent sidebar for navigation only.
5. **Handle states:** the Figma frames show rest, selected, on/off and error only. Follow the
   provisional physics in `DESIGN.md` → _Motion & States_. Hover, press, focus and disabled are
   pending in #2416.

## New components or screens

- Derive from the closest `Glass/*` library component and keep its radius step and material level.
  New content containers are opaque cards; never add a third material.
- If a new visual role is needed, propose it as `cupertino/<path>` in #2414. Don't reuse an
  unrelated role or the unused `cupertino/*` roles.
- Add the component in Light, Dark, Reduce Transparency and Increase Contrast.

## Self-check before handing off

- [ ] Recognisable as Cupertino at a 480px thumbnail: floating sidebar, capsules, grouped rows.
- [ ] Dark audit: no white headers, light slabs, white outlines or light primary buttons.
- [ ] Text ≥ 4.5:1; input, checkbox and switch boundaries and focus ≥ 3:1. Measured on pixels.
- [ ] Only the sidebar and command capsules are translucent; no refraction in CSS (blur-only is a
      proposed approximation awaiting the comparison in #2419).
- [ ] Whole-pixel edges; bound paints seeded with their resolved colour (Figma).
- [ ] Reduce Transparency and Increase Contrast variants render and pass.

## References

`DESIGN.md` → Sources.
