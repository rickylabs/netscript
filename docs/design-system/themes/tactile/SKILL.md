---
name: fresh-ui-theme-tactile
description: Build, extend or review NetScript Fresh UI screens in the Tactile theme (guideline-based neumorphism; one material and one top-left light, four heights, convex keys that rise, concave wells that sink, selection that sinks). Use when a project sets data-theme="tactile", asks for neumorphism, soft UI, a tactile, physical, device-panel or knob-and-LED look, or adds screens, controls or a dark mode to a Tactile app.
---

# Tactile theme

Read `DESIGN.md` in this folder first. It holds the tokens, the effect styles and the full physical
model. This file is the working procedure. The cross-theme rules are in
`docs/design-system/GUIDELINES.md` (shipped as the `netscript-design` skill). The local source
digests are `tactile-guidelines.md` and `tactile-elevation-map.md` in the S4 review run; which of
their values are verified upstream is listed in `DESIGN.md` → Provenance → Source classes.

## Use it when / don't use it when

- **Use for:** commerce and order consoles with a handful of records per view, IoT and device
  panels, widgets, settings, kiosk-like flows.
- **Don't use for:** dense tables, many-column grids, many-field forms, data-dense dashboards. This
  is Tactile's adopted design rule (it follows setproduct's S7 advice from a coordinator digest,
  upstream unverified), not a universal neumorphism standard. Suggest Studio (Cloud flavor) or
  Fluent instead.

## The thesis in one breath

One soft material lit from one corner: what you press rises as a convex key, what holds a value
sinks as a concave well, and choosing something presses it in. Signature moves:

1. Four heights from one top-left light: printed ground, plateaus, keys, wells.
2. Selected means sunk: concave, accent ink, content +1px ↘, a lit LED.
3. Instruments: knurled range dial in its bezel, LED segment gauge, recessed readouts, LED status.

## Hard rules

The owner's corrections drive every rule: "looks garbage (worse button with 1990 gradient I've
seen)", "applies it completely randomly neumorphism is complex it need deep understanding of surface
shapes shadows natural touch feeling", "check design system guidelines about neumorphism because
still off".

- MUST use **one light**: top-left at 135°. Raised = highlight (−d,−d) + shade (+d,+d); well = inner
  shade top-left + inner highlight bottom-right. NEVER vary the angle per element.
- MUST use **four heights** only: H0 ground (printed), H+1 plateau, H+2 key, H−1 well/pressed. Every
  effect-bearing node is named with its class (`H+1 plateau/`, `H+2 key/`, `H-1 well/`,
  `H-1 pressed/`, `LED/`) and carries the matching `Tactile/*` effect style. NEVER an ad-hoc shadow.
- MUST reserve **key height (H+2) for pressable things**. H+1 plateaus are the only raised
  non-pressable objects: low, one-level organizing regions with the plateau recipe, never styled
  like keys. Cards, rows, tiles, avatars, text and ghost controls at rest are printed (H0). NEVER
  raise decoration.
- MUST show **selected as sunk**: H+2 → H−1 (`pressed-m`/`pressed-s`), `text/accent` ink, content
  shifted 1px down-right, plus an LED or a label. Shadow alone is never the state (S6).
- MUST scale **throw with size**: keys ≤ 30px `key-s` 3/6, 44–48px `key-m` 6/12, ~88px `key-l`
  12/24; wells `well-s` 2/4, `well-m` inset 2/5 + −3/7, `well-l` 8/16; plateaus ±18 / blur 44. Blur
  = 2 × offset holds for the key bands and the symmetric `pressed-*`, `well-s` and `well-l` insets
  only. The plateau and `well-m` recipes are named exceptions: use them exactly.
- MUST respect the **nesting budget**: ground → plateau → (key or well). NEVER a plateau in a
  plateau or a key in a well, except a control's own thumb in its own well (dial knob in bezel,
  switch knob in track).
- MUST make keys **convex** (`convex/start → end`) and wells and pressed states **concave**
  (`concave/start → end`), ±3.5% lightness at ≈145°. Plateaus are flat material. NEVER a visible
  linear gradient, sheen or band ("1990 gradient").
- MUST keep borders **in hue**: `edge/border` (`#d1d9e6` / `#24272b`) on plateaus, keys and pressed
  elements. The **3:1 rim** `edge/control` (`#6a759e` / `#7a8498`, 3.57:1 / 3.67:1) goes ONLY on
  text inputs, checkbox, radio, switch track, the off switch knob and the slider knob: a 1px inside
  stroke on its own top layer, on whole pixels, above the inset shadow (C-05). NEVER on keys, cards
  or labelled actions.
- NEVER use **dense tables**: lists become soft tiles (72px, 12px apart, no rules), forms keep one
  field per row with labels above, 52px wells and 24px rhythm (Tactile's adopted rule; see _Use it
  when_).
- MUST keep data graphics readable: bars and meters printed in `text/muted` at 100%, no per-bar
  fade, trend by height only (C-01).
- MUST keep type at 13px or more, body 16 Regular (not Light), Nunito Sans, mono only for IDs.
- MUST keep dark designed: mid-dark material `#2a2d32`, one-step highlight `#34383e`, near-black
  shade `#1c1e21`, saturated blue primary with white text. NEVER a pale hero, pale slab or white
  outer shadow (C-04).
- MUST read only `--ns-tactile-*` roles in Tactile components: they are the current component
  bindings. The core `--ns-*` compatibility roles under Theme = Tactile have been realigned to the
  build (ground `#e0e5ec` / `#2a2d32`, primary `#1a6fe8`, ring `#1e7bff` / `#3b8bff`, input border
  `#6a759e` / `#7a8498`; `corrections-r7.md` §Tactile), but that realignment still needs S1 #2414
  export validation, so don't bind Tactile components to them. NEVER use primitives.

## Building a screen

1. **Enable the theme:** `data-theme="tactile"`, `data-scheme="light|dark"`. No density mode; the
   guideline sizes apply. Names are provisional until S1 #2414.
2. **Compose:** a 48px-padded canvas with an unboxed sidebar (printed nav, wells for search and
   meters) and a main column of plateaus 48px apart. Inside a plateau, group with spacing and one
   tone step, never with rules or nested panels.
3. **Classify every element** before styling it, using the table in `DESIGN.md` → Elevation & Depth:
   is it printed, a region, pressable, or value-holding? Then pick the size band.
4. **Pick variants:**

   | Need                | Use                                                                        |
   | ------------------- | -------------------------------------------------------------------------- |
   | Action              | Convex pill key 48px, key-m, in-hue border                                 |
   | Primary action      | Accent convex key, key-primary-m glow, no border                           |
   | Icon action         | Convex circle key 44–48px                                                  |
   | Filter set          | A bank of keys; active key pressed-m + LED                                 |
   | Text input / select | 52px well-m + rim layer, label above                                       |
   | Boolean             | Switch 60×34 (well-s track + rim, convex knob) or 28px checkbox/radio well |
   | Quantity            | Two 44px round keys around a 48×44 well window                             |
   | Record list         | 72px printed tiles; selected tile pressed-m + LED edge                     |
   | Metric              | Recessed readout (well-l) with Light numeral and printed bars              |
   | Range               | Knurled dial knob (key-l) in a well-l bezel                                |
   | Status              | LED (`led/*` + glow) + word                                                |

5. **Handle states:** rest → pressed is a height change with a 1px content shift and accent ink;
   focus = 2px `accent` ring with a 2px gap (3.11:1 / 4.16:1); invalid = `text/danger` rim, red LED,
   helper; disabled = flat `surface/disabled`, no effect, `text/disabled`.

## New components or screens

- Classify, then derive from the closest existing element of the same height and size band.
- If a new visual role is needed, add it as `tactile/<path>` and register it in code (S1). Don't
  reuse an unrelated role. Don't add effect styles outside the ladder.
- Add the new component to the Components sheet (`146:856`), in Light and Dark, and re-run the
  audit.

## Self-check before handing off

- [ ] Recognisable as Tactile at a 480px thumbnail: one material, soft relief, blue only on LEDs,
      primary keys and selection.
- [ ] Dark audit: no white headers, light slabs, white outer shadows or light primary keys.
- [ ] Audit: every effect node has a `Tactile/*` style matching its class prefix; 0 ad-hoc effects;
      0 nesting breaches; every key convex; rims only on input, track or check nodes.
- [ ] Text ≥ 4.5:1 on its darkest local tone; rims, knob contours and focus ≥ 3:1. Measured on
      pixels of a 1x export (the inset shade can cover a rim).
- [ ] Whole-pixel edges; bound paints seeded with their resolved colour (Figma).
- [ ] No table, no hairline rules inside plateaus, no text under 13px.

## References

`DESIGN.md` → Provenance.
