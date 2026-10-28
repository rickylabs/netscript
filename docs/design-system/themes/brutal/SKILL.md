---
name: fresh-ui-theme-brutal
description: Build, extend or review NetScript Fresh UI screens in the Brutal theme (Gumroad-style neo-brutalism with flat saturated blocks, black ink outlines and hard zero-blur offset shadows). Use when a project sets data-theme="brutal", asks for a neo-brutalist, Gumroad-like, sticker, zine or "bold flat blocks with black shadows" look, or adds screens, components or a dark mode to a Brutal app.
---

# Brutal theme

Read `DESIGN.md` in this folder first. It holds the tokens and the full specification. This file is
the working procedure. The cross-theme rules are in `docs/design-system/GUIDELINES.md` (shipped as
the `netscript-design` skill).

## Use it when / don't use it when

- **Use for:** creator tools, storefront and order admin, marketing and campaign consoles, landing
  dashboards with a handful of KPIs.
- **Don't use for:** long data sessions, dense analytics or many-column grids; every row carries a
  2px rule and every region a 6px slab. Suggest Studio (Utility or Ledger flavor) instead, or
  Terminal for operator tooling.

## The thesis in one breath

Every surface is one flat, saturated block held by a black ink outline and a hard offset shadow, and
the ink stays black when the page goes dark. Signature moves:

1. Hard `#000000` offset shadows with zero blur: 3/3 small, 4/4 buttons, 6/6 regions.
2. Colour blocks (`block/*`) carry data, always with black `block-fg` text.
3. Space Mono Bold 11px uppercase sticker labels on 2px-bordered pills; one tilted sticker per page.

## Hard rules

- MUST keep `border/ink` and the shadow colour `#000000` in both schemes. Owner: "Brutal dark mode
  is simply inverted and therefore unreadable".
- NEVER let a header, selected tab, chip or slab turn white or pale in dark. Owner: "Brutal had like
  white header this should never happen on a dark theme". Ink-filled surfaces are labelled with
  `ink/fg`, never `text/inverse` (that flips to `#111110` on black).
- MUST keep the dark canvas (`bg` `#31312e`) lighter than dark panels (`card` `#191918`) so slabs
  still read as objects.
- MUST draw every boundary a user has to find (inputs, search, checkbox, switch track and the
  off-thumb contour, page keys) in `border/control`: ink in light, `#7c7b74` in dark (3.07:1 on the
  dark canvas). Black on the dark canvas is only 1.61:1 (B-06). Decorative panel outlines stay ink.
- MUST put black text on blocks and check each pair. NEVER put black text on dark `block-purple`
  (3.9:1); its avatar label uses `text/fg` (B-01).
- MUST bind chart bars and delta arrows to ink roles (`primary/fg`, `ink/fg`), never to the block
  colour (B-01, B-05).
- MUST show focus as a separate hard `4px 4px 0` offset in `border/ring` (`#0d74ce` / `#70b8ff`)
  while the 2px ink border stays (B-02). Invalid uses the same offset in `destructive` plus an icon
  and a repair sentence.
- MUST collapse the slab on press: shadow none, content +4/+4, same hit area (B-03).
- NEVER add blur, gradients, glass or soft elevation. Depth is the offset slab only.
- NEVER bold the title. Display type is Space Grotesk Regular (Gumroad's regular headings).
- MUST use one name per command ("Create order" in every entry point) and spell statuses in full
  ("AWAITING PAYMENT", 144px minimum sticker) (B-04).
- MUST only read semantic roles (`--ns-*`), including the shared `--ns-block-*`, `--ns-ink`,
  `--ns-border-control` and `--ns-ink-fg`. Never use primitives. Brutal has no `--ns-brutal-*` roles
  today.

## Building a screen

1. **Enable the theme:** `data-theme="brutal"`, `data-scheme="light|dark"`. No density mode is set
   in Figma; geometry is literal (44px controls, 60px rows). All names are provisional until S1
   #2414.
2. **Compose:** cream canvas with a 76px top bar and a 2px ink rule; then header (52px title, tilted
   sticker, actions), a row of block KPI tiles, one Orders panel, and a form and side column below.
   Regions get Slab L (6/6); controls get Slab M (4/4); small tiles get Slab S (3/3).
3. **Pick variants:**

   | Need             | Use                                                                                                                                              |
   | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
   | Primary action   | `Brutal/Button` Primary: `block-yellow`, ink border, 4/4 slab                                                                                    |
   | Secondary action | Button Secondary: `card` fill                                                                                                                    |
   | Toolbar filter   | Button Secondary at 40px, no slab                                                                                                                |
   | Filter set       | Joined `Brutal/Tab` row (gap −2), selected = ink fill                                                                                            |
   | Status           | `Brutal/Sticker` tone: green paid, yellow awaiting, blue shipped, pink failed, card refunded                                                     |
   | Field            | `Brutal/Input`: Space Mono label, mono value, `border/control`                                                                                   |
   | Table            | Ink header, 60px rows, 2px ink rules, `block-yellow` selected row; fixed columns plus a `minmax(0, 1fr)` customer track (`DESIGN.md` → _Layout_) |
   | KPI              | 289×190 block tile, 40px Bold value, ink delta pill, 12 ink bars                                                                                 |
   | Notice           | `block-pink` slab with ink alert disc                                                                                                            |

4. **Use the signature objects** only where they carry meaning: blocks for KPIs, status and
   selection; the tilted sticker for one live or promotional state per page.
5. **Handle states:** rest = slab; pressed = flush and +4/+4; focus = blue 4/4 offset; invalid = red
   border, red offset, icon and repair text; selected = ink or yellow fill plus a checked control.
   Hover and disabled are owed to #2416. Pick one hover model (toward the shadow, or Gumroad's lift)
   and keep it everywhere.

## New components or screens

- Derive from the closest existing component's variant, and keep the 2px ink stroke, r8 controls,
  r12 regions and the 3/4/6 slab ladder.
- If a new visual role is needed, add it as `brutal/<path>` and register it in code (S1). Don't
  reuse an unrelated role.
- Add the new component to a state sheet, in Light and Dark. Brutal has no state-sheet frame yet;
  create one rather than relying on the component sets.

## Self-check before handing off

- [ ] Recognisable as Brutal at a 480px thumbnail: blocks, black slabs, mono stickers.
- [ ] Dark audit: no white headers, light slabs, white outlines or shadows, or light primary
      buttons. Shadows and outlines are `#000000`.
- [ ] Text ≥ 4.5:1 on every block in both schemes; control boundaries and focus ≥ 3:1. Measured on
      pixels.
- [ ] Every shadow is a zero-blur offset from the 3/4/6 ladder; no other effect exists.
- [ ] Whole-pixel edges; bound paints seeded with their resolved colour (Figma).
- [ ] Each block's text and icons bind ink roles, not the block colour.

## References

`DESIGN.md` → Provenance.
