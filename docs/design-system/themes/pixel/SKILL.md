---
name: fresh-ui-theme-pixel
description: Build, extend or review NetScript Fresh UI screens in the Pixel theme (a NetScript-amber pixel language with Ore UI physics, with banded amber stripes, stepped 2px-grid corners, Pixelify Sans numbers, Space Mono labels, and keys that sit on a 4px lip and press flat). Use when a project sets data-theme="pixel", asks for a pixel-art, 8-bit, retro game, game-launcher, Minecraft-like or Mistral-like look, or adds screens or components to a Pixel app.
---

# Pixel theme

Read `DESIGN.md` in this folder first. It holds the tokens and the full specification. This file is
the working procedure. The cross-theme rules are in `docs/design-system/GUIDELINES.md` (shipped as
the `netscript-design` skill).

## Use it when / don't use it when

- **Use for:** games and launchers, playful consumer products, creator and community tools, hobby or
  maker dashboards.
- **Don't use for:** formal finance, legal, medical or long reading. Suggest `studio` or
  `filigrane`.

## Thesis

Pixel combines amber pixels with game-key physics and keeps everything else calm. Signature moves:

1. Banded amber: five discrete 2px bands (`#FFDBA2 → #D38E22`) for the header stripe, the
   selected-row bar, the latest chart column, progress and the notice edge.
2. Keys on a lip: a stepped face on a 4px lip. Pressing drops the face 4px (`translateY(+4px)`) and
   collapses the lip. Fields and unchecked boxes are recessed with a 2px inner shade.
3. Type by role: Pixelify Sans for the title and KPIs, Space Mono for uppercase labels, JetBrains
   Mono for data, Inter for reading text.

## Hard rules

- MUST keep the palette exactly: amber `#FAAB35` with `#12100E` ink; bands
  `#FFDBA2 #FFC673 #FFB245 #EDA12E #D38E22`; paper `#FCFAF6 #F4EFE6 #E8E0D3`; dark
  `#12100E #1B1916 #282623`. Never shift it toward Mistral orange.
- MUST NOT copy Mistral or Minecraft: no M or cat mark, no ALTMistral, no brand colours, no Mojang
  fonts, textures, green/stone palette or logos. Take the pixel idea and the physics only.
- MUST treat the Ore UI physics as a refinement of the pixel language; don't restyle the layout.
- MUST keep stepped geometry, icon pixels, major offsets (lips, pressed travel, corner steps) and
  bands on the 2px grid; Pixelify Sans at 24 or 40 only. The documented 1px panel frames and table
  rules and the 13px JetBrains Mono data type are allowed exceptions. No blur, no soft shadow, no
  half pixels.
- MUST pair every amber focus ring with its 2px ink gap: amber alone is 1.84:1 on paper.
- MUST keep dark mode as specified: warm near-black grounds; dark interactive perimeters at
  `--ns-control-ink` / `--ns-input-border` `#7C7B74`, never white, including the focused field's
  inner edge; tag lips warm near-black.
- MUST keep chart silhouettes outside the bands and give tags their full label width.
- MUST use red only as an error or destructive role (`--ns-pixel-destructive-face`,
  `--ns-destructive-*`).
- MUST only read `--ns-*` and `--ns-pixel-*` roles. The bands bind primitives (`--ns-band-*`) today;
  that exception is documented and waits for band roles in the tokens build (#2414). Don't add new
  primitive bindings.

## Building a screen

1. **Enable the theme:** `data-theme="pixel"`, `data-scheme`, `data-density="comfortable"`
   (provisional until #2414).
2. **Compose:** 64px top bar with a banded mark, uppercase mono nav and identicon → 10px band stripe
   → content at 40px sides, sections 32 apart → flat panels framed in 1px `--ns-frame-ink` (no lips
   on panels) → keys, tabs and fields inside them.
3. **Pick variants:**

   | Need             | Pixel variant                                                                   |
   | ---------------- | ------------------------------------------------------------------------------- |
   | Primary action   | Primary key (amber on the band-5 lip); Hero adds a 2px top highlight            |
   | Secondary action | Outline key: 2px stepped ink edge, sand inner lip                               |
   | Danger           | Destructive key (`#CE2C31` face, `#A8222A` lip, white label)                    |
   | Filter tabs      | Tabs with mono counts; selected is raised on a 2px lip                          |
   | Pagination       | Page keys; the current page is pressed                                          |
   | Table            | 56px rows, mono IDs and dates, identicons, lipped tags, a selected-row band bar |
   | Text input       | Recessed field; focus = ink edge + amber ring + block cursor                    |
   | Boolean          | Recessed switch with I/O marks; checkbox pops up on a 2px lip when checked      |
   | KPI              | Pixelify value, mono delta, 2px-grid block chart with a banded latest column    |
   | Alert            | `warning-subtle` panel with an 8px banded edge                                  |

4. **Use the signature objects** where they carry meaning: bands mark the current or newest thing
   (selection, latest data, progress), never decoration.
5. **Handle states:** rest on the lip; hover darkens the face (`--ns-primary-hover`, or
   `--ns-pixel-face-secondary-hover`); pressed drops the face 4px (`transform: translateY(4px)`,
   downward) and collapses the lip, with the outer hit area unchanged; disabled is a flat `muted`
   face; focus is the ink gap plus the stepped amber ring. Animate with `steps()`.

## New components or screens

- First classify it as pressable (key on a lip), input (recess), signal (bands) or panel (flat
  frame). Use exactly one of those depth treatments.
- Cut corners as pixel steps with `clip-path` (4px on 40px keys, 2px on smaller controls).
- New visual roles go under `pixel/<path>` and must be registered in the tokens build (#2414).
- Add every new component, in all its states, to the Light and Dark components sheets.

## Self-check before handing off

- [ ] Recognisable as Pixel at a 480px thumbnail: band stripe, stepped keys, pixel numbers.
- [ ] Dark audit: no white headers, light slabs, white outlines; perimeters `#7C7B74`.
- [ ] Text ≥ 4.5:1 (tags ≥ 4.54:1); input, checkbox and switch boundaries and focus ≥ 3:1. Measured
      on pixels.
- [ ] Every lip, recess and band follows _Elevation & Depth_; panels stay flat.
- [ ] Whole-pixel edges (2px grid for stepped geometry; 1px frames and rules) at 1×, 1.25× and 1.5×
      DPR; bound paints seeded with their resolved colour.
- [ ] None of the known weaknesses repeated: no hidden tag dot, a visible focus gap on Outline keys,
      a visible hover lip.

## References

`DESIGN.md` → Sources.
