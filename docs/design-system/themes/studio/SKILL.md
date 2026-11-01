---
name: fresh-ui-theme-studio
description: Build, extend or review NetScript Fresh UI screens in the Studio theme and its seven product flavors (Utility, Cloud, Workshop, Playful, Ledger, Atelier, Signal), which share one component anatomy. Use when a project sets data-theme="studio" or data-flavor, uses the NetScript default look (Utility), asks for a shadcn-, Linear-, Geist- or "clean SaaS" style, a finance/ledger, editorial-serif, developer/mono, playful-pastel or workshop/hard-shadow variant, or adds screens or components to a Studio app.
---

# Studio theme

Read `DESIGN.md` in this folder first; it holds the Utility tokens, the seven flavor tables and the
full specification. This file is the working procedure. Cross-theme rules are in
`docs/design-system/GUIDELINES.md` (shipped as the `netscript-design` skill).

> **Utility is the NetScript default theme**, and the docs site is the first product to use it. It
> has monochrome, sharp chrome with one red mark, and content in semantic colour (status tones on
> callouts, badges and notices; syntax colours in code; coloured API kind tags). It has 0–2px radii;
> 1px hairlines (#e0e0e0 / #313131, row rules #f0f0f0 / #2a2a2a); gray-9 field boundaries (#8d8d8d /
> #6e6e6e, ≥ 3:1); a 6px ink square location marker and a 2px ink selected-row bar; a 2px ink focus
> ring with a 2px gap; **red only in the logo (#DA291C / #E5332A) and in the destructive tone**
> (errors, destructive actions, CAUTION callouts); a Medium title and Regular KPI numerals at −2.5%;
> Fragment Mono for eyebrows, IDs and column heads; 1.5px icons; file-path and `data-*` chips.
> Values and roles are in `DESIGN.md` → front matter and _Flavors_ → Utility.

## Use it when / don't use it when

- **Use for:** SaaS consoles, admin, docs and dashboards. Pick the flavor by product: Utility
  (default, docs, neutral tools), Cloud (friendly cloud SaaS), Workshop (maker and ops tools),
  Playful (consumer, creator), Ledger (finance, dense data), Atelier (editorial, content reporting),
  Signal (developer tools, monitoring).
- **Don't use for:** Material-native Android products (use Tonal), widget-first personal dashboards
  (use Bloom), or a platform-native look (Cupertino, Liquid, Fluent). Don't use Playful for formal
  finance or Ledger for consumer onboarding.

## Thesis

Seven flavors share one component anatomy. Signature moves:

1. Component variants change through `Studio flavor` variables (border sides, tab track, row gap,
   ticks, offsets), not forked components.
2. Exact detailing: 1px-exact rules, one neutral ramp, a restrained accent, a complete 2/2 focus
   ring.
3. Each flavor has its own tinted dark ground; dark primaries are graphite or deep keys.

## Hard rules

- MUST change at least ground, radius set, type pairing, density and two component variants when
  adding or editing a flavor, so that no two flavors look alike.
- MUST give each flavor its own dark ground hue; never #000.
- NEVER outline a dark primary in white or near-white: dark keyline is #7b7b7b.
- NEVER fill a dark primary with a pale accent: Signal dark = #222222 key, #bde56c ink, #7b7b7b
  edge. In dark, accent colours are for selection, checkmarks and focus.
- MUST use deep-tone `studio/badge-solid/*` pairs for solid badges in dark (Workshop).
- MUST hover Primary by swapping to `primary-hover`; other button hovers are an 8% layer at inset 0,
  below the label, clipped to the radius.
- MUST draw input, checkbox and switch boundaries with `studio/input/border`
  (`--ns-studio-input-border`, ≥ 3:1: gray 9 in Utility, gray 10 elsewhere). A selected segment is
  never fill alone: Utility uses the ink marker + Medium label; other flavors use the boundary or
  underline in their variant.
- MUST draw focus as a 2px ring with a 2px gap on all four sides, never clipped. Utility and Atelier
  rings are ink in light and gray in dark (flavor `ring/*`). NEVER let a wrapper or a rounded
  container clip a ring or glyphs.
- Utility only:
  - NEVER use red except the logo (`--ns-studio-signal-brand`) and the destructive tone
    (`--ns-destructive*`: errors, destructive actions, CAUTION callouts).
  - NEVER drop the tone from a callout, alert, notice or status badge, or ship highlighted code
    without its syntax colours (`--ns-code-syntax-*`). Plain-text fences stay unhighlighted. Neutral
    identifiers, module and namespace kinds and neutral badges stay `fg`.
  - MUST stay sharp, with radii 0–2px, and keep separations quiet: 1px gray-5 structural hairlines
    and quiet row rules, no 2px ink rules, no underline tabs, no shadows.
  - MUST mark location with the 6px ink square (`--ns-studio-signal-marker`, slot reserved) and
    selection with the 2px ink bar; links are ink Medium with a `--ns-studio-signal-underline`
    underline that turns ink on hover.
  - MUST use Fragment Mono for eyebrows, column heads, IDs, paths, breadcrumbs, kbd and chips, and
    `--ns-studio-icon-stroke` (1.5px) for icons; title Medium and KPI numerals Regular at −2.5%.
- MUST render KPI values, totals and IDs as tabular lining numerals.
- MUST only read semantic roles (`--ns-*`) and `--ns-studio-*` roles. Never use primitives or the
  flavor collection directly in component CSS.

## Building a screen

1. **Enable the theme:** `data-theme="studio"`,
   `data-flavor="<utility|cloud|workshop|playful|
   ledger|atelier|signal>"`, `data-scheme`, plus
   the flavor's `data-gray`, `data-accent` and `data-density` (Utility: neutral, ink, compact).
   Provisional until the tokens build (#2414).
2. **Compose** the Orders pattern: top bar → page header (breadcrumb, title, two actions) → four
   KPIs → table card with a segmented filter and toolbar → form card beside a notice and an activity
   card. Density comes from the flavor (Utility 32px controls, 44px rows).
3. **Pick variants** from the flavor table in `DESIGN.md` → _Flavors_:

   | Component | Utility                                | Cloud      | Workshop          | Playful    | Ledger          | Atelier       | Signal       |
   | --------- | -------------------------------------- | ---------- | ----------------- | ---------- | --------------- | ------------- | ------------ |
   | Card      | 1px gray-5 top hairline                | platter    | bordered + offset | r28 tile   | 1px box         | top rule      | box + ticks  |
   | Tabs      | ink marker + Medium                    | pill track | chips             | pill track | boxed           | underline     | brackets     |
   | Badge     | outline + dot                          | pill + dot | solid             | pill + dot | subtle + border | outline + dot | `[TEXT]`     |
   | Table     | quiet hairlines + 2px ink selected bar | white card | banded head       | row pills  | zebra           | rules         | grid         |
   | Top bar   | 1px hairline + ink lane marker         | floating   | band              | none       | dark            | hairline      | black + lime |

4. **Use the signature objects** only where they carry meaning: Signal ticks frame data regions and
   block bars show a ratio; Workshop offsets mark pressable or primary containers; Playful pastel
   tiles distinguish KPI categories; Ledger joins the KPI strip because it is one ledger.
5. **Handle states:** hover 8% (rows 4%; Utility rows #f9f9f9 / #222222); Primary hover = fill swap;
   focus 2/2; disabled 38%; selected = `selected` tint plus a non-colour cue (Utility: the 2px ink
   bar or the 6px marker; other flavors: a checkbox, underline or boundary); invalid = 1px
   `destructive` and a repair sentence in `destructive-text`.

## New components or screens

- Derive from the closest shared component and read its flavor variables; add a flavor variable
  rather than a per-flavor component.
- If a new visual role is needed, add it as `studio/<path>` (and a flavor variable if it varies by
  flavor), list it in the style's role manifest (`DESIGN.md` → _NetScript Mapping_), then register
  it in code (#2414). Its code syntax is `var(--ns-studio-<path>)`.
- Add the component to all fourteen state sheets (seven flavors, Light and Dark).
- In Figma, seed bound paints with their resolved colour after any mode change. An unseeded paint
  can keep a stale value, such as a #ffffff edge on a primary button.

## Self-check before handing off

- [ ] Each flavor is identifiable at a 480px thumbnail on a contact sheet (no hue-only flavors).
- [ ] Dark audit: no white headers, light slabs, white outlines or light primary buttons.
- [ ] Text ≥ 4.5:1; input, checkbox and switch boundaries and focus ≥ 3:1. Measured on pixels.
- [ ] Every shadow follows the flavor's depth recipe (only Cloud and Workshop have shadows).
- [ ] Whole-pixel rules; bound paints seeded with their resolved colour (Figma).
- [ ] Utility only: red appears in the logo and the destructive tone only; callouts, notices and
      status badges carry their tone; highlighted code has syntax colours; hairlines are gray 5 /
      row rules quiet; location and selection are ink; no 2px black rules, underline tabs or
      JetBrains Mono.

## References

`DESIGN.md` → Sources.
