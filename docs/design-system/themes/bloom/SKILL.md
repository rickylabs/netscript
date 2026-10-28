---
name: fresh-ui-theme-bloom
description: Build, extend or review NetScript Fresh UI screens in the Bloom theme (widget-first Material You with notch-cut pastel widgets on warm paper, a large regular Funnel grotesk, black action discs, nested outline cards). Use when a project sets data-theme="bloom", asks for a widget dashboard, Material You / dynamic-colour, pastel, "big type" or personal-dashboard look, or adds screens, widgets or components to a Bloom app.
---

# Bloom theme

Read `DESIGN.md` in this folder first; it holds the tokens, the notch primitive and the full
specification. This file is the working procedure. The cross-theme rules are in
`docs/design-system/GUIDELINES.md` (shipped as the `netscript-design` skill).

## Use it when / don't use it when

- **Use for:** personal and small-business dashboards, consumer apps, small-shop back-offices, and
  any screen made of a few glanceable widgets and one short list.
- **Don't use for:** dense admin, long tables or many-field forms: rows are 84px and six fill a
  column. Suggest Studio (Ledger or Utility) for data-dense work, or Tonal for stock Material.

## Thesis

Widget-first Material You. Signature moves:

1. Notch-cut widgets whose notch holds an action disc.
2. A large regular grotesk: Funnel Display Regular 92/96 title, 60/64 values.
3. Black (ink) action discs and nested outline cards; pastels mark categories and ink marks actions.

## Hard rules

- MUST make widgets play with shape (notches, nested tiles) and NEVER decorate: no stars or other
  unreadable ornaments.
- NEVER use stock Material chrome (FAB, navigation rail, filled text fields, Google Sans, Material
  Symbols).
- MUST carry hierarchy with size, not weight: Regular for display and values; Medium only on hero
  button labels, the selection count and initials.
- MUST centre every icon on whole pixels inside its disc (20 in 48 at 14px).
- MUST keep the floating selection bar a single ink material, with no second background.
- MUST keep the rhythm: 64px margins, 16px widget gaps, 24px widget padding, 6px row gaps.
- MUST keep actions ink (`bloom-hero`); NEVER a pastel or violet primary.
- MUST use `bloom-muted` #655f55 for light supporting text, a 1px `bloom-field-edge` #8a8377 capsule
  for editable fields and `bloom-control-outline` (#8a8377 in dark) for outlined controls.
- NEVER strike through a refunded customer; the chip and the negative amount show the refund.
- MUST keep dark designed: pastels become deep tones of the same hue; the ink card and discs lift to
  warm browns (#453a2c, #3b3631). No white outlines, no black slab on black.
- MUST only read semantic `--ns-bloom-*` roles. In the Figma prototype the core roles resolve to
  Tonal values (a borrowed mode, not a contract, until S1 #2414 exports a complete Bloom core-role
  map); never paint them, and never use primitives.

## Building a screen

1. **Enable the theme:** `data-theme="bloom"`, `data-scheme` (provisional until S1 #2414; Bloom
   borrows the Tonal Theme mode in Figma and lives in `bloom/*` roles).
2. **Compose:** warm paper with backdrop arcs → greeting + 92px title + one control pair → a row of
   3–5 widgets (272px tall, 16px gaps, one stacked column of 128px tiles allowed) → a 700px list
   column beside a 420px detail panel with a white sheet. A floating ink selection bar appears only
   when rows are selected.
3. **Pick variants:**

   | Need                      | Bloom component                                                                                             |
   | ------------------------- | ----------------------------------------------------------------------------------------------------------- |
   | Headline metric           | r32 pastel widget, 60/64 value, action disc + outline disc                                                  |
   | Metric with one edit      | notched ink widget (`.ns-bloom-notch[data-variant="…"]`), disc in the notch (`DESIGN.md` → Notch primitive) |
   | Secondary metric + action | nested outline card with an inner action tile                                                               |
   | Primary action            | 52px ink hero pill with a trailing peach disc                                                               |
   | Secondary action          | outline pill (52/48/40px) or outline disc                                                                   |
   | Boolean                   | 28px toggle disc (ink + check / outline ring)                                                               |
   | List item                 | 84px r28 row: numbered pastel disc, meta, 28/32 name, status chip, amount                                   |
   | Status                    | 30px outline pill with a 6px status dot                                                                     |
   | Text input                | 56px capsule with inside label                                                                              |

4. **Use the signature objects** where they carry meaning: a notch only when its disc acts on that
   widget; pastels by category (peach revenue/current, mint orders, lavender attention/selection).
5. **Handle states:** selected row = lavender fill + `bloom-control-outline` chip + trailing pen
   disc; error field = 1.5px `bloom-error` capsule, error label, icon, repair sentence. Hover,
   pressed, focus and disabled are not designed yet (#2416): propose them on the state sheet before
   shipping, with a ≥ 2px focus ring on the disc or pill, never on a clipped notch.

## New components or screens

- Derive from the closest widget, disc or pill; keep Regular display type, ink actions and pastel
  categories.
- New roles go under `bloom/<path>` and must be registered in code (S1); don't reuse an unrelated
  pastel for a new meaning.
- A new notch size needs its own measured path (outer r, notch w × h, inner convex r, concave r) and
  a disc placed 4px from the outer edges. Add it as a new `data-variant` of `.ns-bloom-notch`
  registered through S3 #2416, never as a BEM modifier class.
- Bloom has no state sheet yet; create one (Light and Dark) for every new interactive component.

## Self-check before handing off

- [ ] Recognisable as Bloom at a 480px thumbnail (paper, pastel widgets, big regular title, ink
      discs).
- [ ] Dark audit: no white headers, light slabs, white outlines or light primary buttons.
- [ ] Text ≥ 4.5:1 on every pastel; field, toggle and outline-control boundaries ≥ 3:1 on pixels.
- [ ] No shadow except the floating selection bar; depth comes from nesting.
- [ ] Every notch holds a disc; no stars, blobs or decorative glyphs.
- [ ] Icons centred on whole pixels; bound paints seeded with their resolved colour (Figma).

## References

`DESIGN.md` → Sources.
