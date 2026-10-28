---
name: fresh-ui-theme-filigrane
description: Build, extend or review NetScript Fresh UI screens in the Filigrane theme (minimal, thin and legible; light Newsreader numerals over a Hanken Grotesk UI, held together by hairlines with no shadows). Use when a project sets data-theme="filigrane", asks for a minimal, thin-type, typographic, report-like or "quiet luxury" look, or adds screens, forms or a dark mode to a Filigrane app.
---

# Filigrane theme

Read `DESIGN.md` in this folder first; it has the tokens and the full specification. This file is
the procedure. Cross-theme rules are in `docs/design-system/GUIDELINES.md`, shipped as the
`netscript-design` skill.

## Use it when / don't use it when

- **Use for:** reporting, finance and content back offices, order review, settings pages, and any
  screen that is read more than operated.
- **Don't use for:** control-dense tools with many toggles, nested toolbars or drag interactions,
  where underline fields and square outline buttons get lost among the controls. Suggest Studio
  instead; its Atelier flavor keeps the thin type with conventional controls.

## Thesis

An operations screen typeset like a printed page. Numerals use a light serif, everything you read or
operate uses a grotesk, and hairlines provide all the structure. Signature moves:

1. Newsreader Light at display size (76px title, 30px KPI numerals) in a hairline "In numbers" grid.
2. Hairlines instead of boxes: underline fields, 1px row rules, numbered form sections, square
   controls.
3. One vermilion accent (`primary-text` / `primary`) for the eyebrow, section numerals, links, the
   3px selected-row margin bar and the attention rule.

## Hard rules

- MUST stay minimal, thin and legible.
- NEVER add newspaper apparatus: masthead, dateline, double rules, italic standfirst, all-caps
  kickers, a news-wire feed. They make the screen read as a newspaper.
- MUST keep dark readable: `muted-fg` dark `#d2d0ca` (12.25:1), nothing below 12px, display in
  Newsreader **Light** (not ExtraLight).
- MUST draw interactive edges (field underlines, outline buttons, unchecked boxes, header search) in
  `border/input`: 3.67:1 light, 4.45:1 dark. Decorative rules may have lower contrast.
- MUST bind the focus ring to `border/ring` in both schemes (`#21201c` / `#7c7b74`): 2px ring, 3px
  `bg` gap, 2px ring underline. NEVER paint a white `#eeeeec` perimeter in dark.
- MUST paint an underline as one opaque 1px fill on an integer y, with its paint seeded by the
  resolved colour. A stale paint plus a 0.5px offset renders the dark search edge as `#080808`.
- MUST use `action/primary-*` for the primary button: ink fill in light, transparent with a
  `#7c7b74` hairline in dark. NEVER a tomato or light slab.
- MUST keep the checkbox in every row and mark selection with the 3px `primary` margin bar outside
  the cell. NEVER fill a selected row.
- MUST draw the checked checkbox with `action/primary-bg` (fill), `action/primary-border` (stroke)
  and `action/primary-fg` (check): an ink square in light, a transparent box with a `#7c7b74` edge
  and an `#eeeeec` check in dark. NEVER a light square in dark.
- MUST size table columns as fixed tracks plus one `minmax(0, 1fr)` customer track, resolved after
  row padding, borders and gaps. NEVER shrink type or clip a column to make the widths add up.
- MUST give every error its repair sentence and keep copy factual.
- NEVER add shadows, cards, radii (except the avatar circle) or tinted panels.
- MUST pair every status glyph with its word; the 7px amber square is 1.5:1 on paper.
- MUST only read semantic roles (`--ns-*`, including `--ns-action-primary-*`). Never use primitives.
  Filigrane has no `--ns-filigrane-*` roles today.

## Building a screen

1. **Enable the theme:** `data-theme="filigrane"`, `data-scheme="light|dark"`. Filigrane sets no
   density mode; its rhythm is fixed. Names are provisional until the token export in #2414.
2. **Compose:** a 72px header with a hairline rule; a lead block (eyebrow, display title, one
   factual sentence, actions) beside an "In numbers" hairline grid; tabs on a `border-strong`
   baseline; a ruled table; a form in numbered sections beside an attention block and an activity
   list. Separate regions with whitespace (22–56px), not boxes.
3. **Pick variants:**

   | Need                   | Use                                                                     |
   | ---------------------- | ----------------------------------------------------------------------- |
   | Primary action         | `Filigrane/Button` Solid (`action/primary-*`)                           |
   | Secondary action       | Button Outline (1px `border/input`)                                     |
   | Inline or table action | Button Link (`primary-text`, underline, arrow)                          |
   | Field                  | `Filigrane/Field`: label above, 17/28 value, underline                  |
   | Filter set             | `Filigrane/Tab`: lead label, caption count, 2px underline when selected |
   | Status                 | `Filigrane/Status`: 7px square glyph + word                             |
   | KPI                    | Newsreader Light 30/36 numeral in a hairline cell                       |
   | Alert                  | 1px `primary` top rule, "Attention" label, Newsreader 24/32 sentence    |

4. **Use the signature objects** where they carry meaning: Newsreader only for numbers and
   one-sentence statements; the vermilion only to mark position (eyebrow, section number, the
   current row, the one thing needing attention).
5. **Handle states:** focus = double ring; error = 2px destructive underline and repair helper;
   selected = checked box + margin bar; refund amounts in parentheses in `destructive-text`. Hover,
   pressed and disabled are pending in #2416.

## New components or screens

- Start from the closest existing component's variant. Keep radius 0, 1px hairlines and the
  serif/grotesk split.
- If you need a new visual role, add it as `filigrane/<path>` and register it in code (#2414). Don't
  reuse an unrelated role. Studio's Atelier flavor uses Filigrane-like thin type through Studio
  flavor values on Theme mode `Studio`. No shared Theme-mode binding is proven, so check Atelier
  separately if the two must stay aligned.
- Add the new component to a state sheet, in Light and Dark.

## Self-check before handing off

- [ ] Recognisable as Filigrane at a 480px thumbnail: light serif numerals, hairlines, no boxes.
- [ ] Dark audit: no white headers, light slabs, white outlines or light primary buttons.
- [ ] Text ≥ 4.5:1; underlines, outline buttons, checkbox edges and focus ≥ 3:1. Measured on pixels.
- [ ] No shadow, card or radius exists other than the focus ring and the avatar circle.
- [ ] Whole-pixel edges; bound paints seeded with their resolved colour (Figma). Check every 1px
      rule renders as one row, not two.
- [ ] Nothing reads as a newspaper; nothing is below 12px.

## References

`DESIGN.md` → Sources.
