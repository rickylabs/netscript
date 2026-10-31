# Studio — Figma map

File `pGRLnkPPRZJZy74evNcQBr`, page "Theme direction" (`6:2`). Theme mode `Studio`; each flavor is a
`Studio flavor` mode. Frame names state the flavor's density.

## Frames

| Flavor (config id)       | Gray × accent, density    | Light     | Dark      |
| ------------------------ | ------------------------- | --------- | --------- |
| Utility (`neutral-ink`)  | Neutral × Ink, Compact    | `10:4277` | `10:5518` |
| Cloud (`slate-blue`)     | Slate × Blue, Comfortable | `10:4587` | `10:5828` |
| Workshop (`sand-orange`) | Sand × Orange, Chunky     | `10:4897` | `10:6138` |
| Playful (`mauve-violet`) | Mauve × Violet, Chunky    | `10:5207` | `10:6448` |
| Ledger (`ledger`)        | Slate × Indigo, Dense     | `10:6759` | `10:7690` |
| Atelier (`atelier`)      | Sand × Tomato, Airy       | `10:7069` | `10:8000` |
| Signal (`signal`)        | Neutral × Lime, Dense     | `10:8310` | `10:7379` |

Utility front-matter values are resolved variables on `10:4277` / `10:5518`; values marked
"measured" were sampled on the exported renders.

## State sheets (fourteen)

| Flavor   | Light              | Dark      |
| -------- | ------------------ | --------- |
| Utility  | `46:2210` (master) | `76:432`  |
| Cloud    | `76:668`           | `76:904`  |
| Workshop | `76:1140`          | `76:1376` |
| Playful  | `76:1612`          | `76:1848` |
| Ledger   | `76:2084`          | `76:2320` |
| Atelier  | `76:2556`          | `76:2792` |
| Signal   | `76:3028`          | `76:3264` |

Only Utility's state sheets have current renders; the other flavors' state renders predate the
flavor collection (`renders-r4/states--studio--*`).

## Variables added for Studio

- Primitives `color/swiss-red/{l,d}/9` (#DA291C / #E5332A, logo only).
- Flavor variables, with values in all seven flavor modes: `signal/{l,d}/{brand,marker,underline}`,
  `input/{l,d}/border`, `icon/stroke`, `prose/*`, `ring/{l,d}`, `brand-on/{l,d}` (Signal #0b0f0b;
  the other flavors mirror their `primary/fg` chain).
- Scheme roles `studio/signal/*`, `studio/input/border`, `studio/brand/on`,
  `studio/code/scroll-thumb` (→ `gray/{l,d}/10`).
- Code syntax `var(--ns-studio-<path>)` is set on every `studio/*` Scheme role and on every
  scheme-independent, non-boolean flavor variable without a Theme twin; S1 #2414 must register all
  of them. Flavor geometry booleans (border sides, ticks, sparkline, block bars) exist only in the
  flavor collection.
- Signal's logo glyph binds `studio/brand/on`; the other flavors' glyphs still bind `primary/fg`
  (rebinding them is pixel-neutral).

## Node-level notes

- No node-level exceptions (no primitive or raw value bound directly on a node).
- Atelier primary buttons (`10:7069` / `10:8000`): after a mode change, a paint bound to
  `primary/text` kept a stale #ffffff perimeter until it was re-seeded with its resolved colour.
  Seed bound paints after every mode change.
- Cloud `Page header`: must not clip. With clipping on, the 20px `radius/card` and 0 padding cut the
  leading glyphs of the title and subtitle at the x48 anchor.
- Utility segmented filter: the marker wrapper must not clip, or the 2px focus ring shows on one
  side only.

## Renders

`.llm/runs/design-system-s4--language-review/renders-r7/`: `studio--<cfg>--{light,dark}.png`,
`studio--contact--{light,dark}.png`, `studio--states--neutral-ink--{light,dark}.png`,
`utility--before-after.png`, `utility--thumbnail-test.png`, `utility-baseline--{light,dark}.png`,
hashed in `renders-r7/SHA256SUMS`. The current Cloud and Signal renders and the current Utility
state sheets are in `renders-r6/`, outside the hashed set.
