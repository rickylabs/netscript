---
name: fresh-ui-theme-cupertino
description: Build, extend or review NetScript Fresh UI screens in the Cupertino theme (Apple-inspired classic, with a vibrant floating sidebar, a large-title header, capsule buttons, inset grouped lists, blur-only materials and full-row system-blue selection on opaque slate content cards; the owner-preferred composition, not strict macOS 15 / iOS 18 fidelity). Use when a project sets data-theme="cupertino", asks for a classic Mac-like, iOS Settings-style or "Apple but not Liquid Glass" look, or adds screens or components to a Cupertino app. For macOS 27 / Liquid Glass use fresh-ui-theme-liquid instead.
---

# Cupertino theme

Read `DESIGN.md` in this folder first. It holds the tokens and the full specification. This file is
the working procedure. The cross-theme rules are in `docs/design-system/GUIDELINES.md` (shipped as
the `netscript-design` skill).

## Use it when / don't use it when

- **Use for:** Mac-like tools, settings and configuration screens, back-office admin with forms,
  small-team dashboards that should feel native on Apple hardware.
- **Don't use for:** a request for "the new Apple look", glass sheets or lensing. Suggest `liquid`.
  For dense, Windows-centric enterprise suggest `fluent`.

## The thesis in one breath

Apple-inspired classic: floating sidebar, large-title header, capsule buttons, inset grouped lists
and blur-only materials, with one vibrant plane (sidebar and command capsules) over opaque slate
content. It is the owner-preferred hand-built composition, not a strict macOS 15 / iOS 18
reproduction. Signature moves:

1. Inset grouped editor: uppercase 12px captions over radius-12 groups of 44px rows, with a muted
   value and a chevron.
2. Full-row system-blue selection: the selected row fills with `--ns-primary`, and every glyph on it
   turns `--ns-primary-fg`.
3. One vibrancy plane: only the sidebar and Filter/Export capsules blur; content cards are opaque
   with a 1px `--ns-material-stroke` rim.

## Hard rules

- MUST keep the hand-built composition: floating 248px sidebar at 16px inset, large title, 36px
  capsules, inline grouped editor. Owner on the spec-literal rebuild: "this looks like bootstrap".
  NEVER convert it to a strict macOS 15 / iOS 18 rebuild (attached opaque sidebar, bordered push
  buttons); further separation from Liquid is an owner decision made by local comparison.
- MUST NOT ship lensing, refraction, dispersion, specular rims, a detached sheet or a floating
  selection bar. Those are Liquid. Owner: "the classic one still too much s mix if the two". The
  Figma frames carry `GLASS` refraction (0.50–0.55); the web theme proposes
  `backdrop-filter: blur()` plus tint only. Treat that as a proposed approximation, not a verified
  equivalent, until the S6 (#2419) comparison against the frames.
- MUST keep content opaque: KPI widgets, list, form, notice and activity are `--ns-card` (G-01).
- MUST give editable boundaries 1px `--ns-muted-fg` (search fields, G-07), and paint off-switch
  tracks and unchecked circles in `--ns-input-border` (G-02).
- MUST use the `*-text` roles for tinted text and 2px sparklines, never raw status fills (G-03).
- MUST show an invalid value and its repair as two lines: value, then a 12/16 helper (G-05).
- MUST keep dark mode designed: tinted slate grounds (`#111113`, `#18191b`), rims at 13% white, and
  dark `#111113` ink on the `#0090ff` primary. Never white on `#0090ff` (3.26:1).
- MUST paint the switch knob with its own `switch-thumb` role (proposed for S1 #2414; white in
  light, `#111113` in dark as rendered), never by binding `--ns-primary-fg`.
- MUST ship the two accessibility preference variants for every screen (G-04): Reduce Transparency
  (aurora hidden; the sidebar falls back to opaque `--ns-card`) and Increase Contrast
  (`--ns-border-strong` rims). They are preferences, not the default look.
- MUST only read semantic roles (`--ns-*`). Never use primitives. Don't adopt the 27 unused
  `--ns-cupertino-*` roles until S1 (#2414) decides their fate.

## Building a screen

1. **Enable the theme:** `data-theme="cupertino"`, `data-scheme="light|dark"`,
   `data-density="comfortable"` (provisional until S1 #2414).
2. **Compose:** canvas `--ns-bg` plus aurora → floating vibrant sidebar (radius 26) → main column at
   x288 with an 18px vertical rhythm → header row (large title left, capsules right) → filters
   (segmented left, search right) → opaque cards, 12–14px apart.
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

4. **Use the signature objects** where they carry meaning: grouped lists for record details and
   settings, full-row selection for the active record, the vibrant sidebar for navigation only.
5. **Handle states:** the Figma frames show rest, selected, on/off and error only. Follow the
   provisional physics in `DESIGN.md` → _Motion & States_. Hover, press, focus and disabled are owed
   to #2416.

## New components or screens

- Derive from the closest `Glass/*` component (`29:22`–`29:99`) and keep its radius step and
  material level. New content containers are opaque cards; never add a third material.
- If a new visual role is truly needed, propose it as `cupertino/<path>` for S1. Don't reuse an
  unrelated role or the spec-rebuild roles.
- Add the component in Light, Dark, Reduce Transparency and Increase Contrast.

## Self-check before handing off

- [ ] Recognisable as Cupertino at a 480px thumbnail: floating sidebar, capsules, grouped rows.
- [ ] Dark audit: no white headers, light slabs, white outlines or light primary buttons.
- [ ] Text ≥ 4.5:1; input, checkbox and switch boundaries and focus ≥ 3:1. Measured on pixels.
- [ ] Only the sidebar and command capsules are translucent; no refraction in CSS (blur-only is a
      proposed approximation awaiting the S6 #2419 comparison).
- [ ] Whole-pixel edges; bound paints seeded with their resolved colour (Figma).
- [ ] Reduce Transparency and Increase Contrast variants render and pass.

## References

`DESIGN.md` → Provenance.
