---
name: fresh-ui-theme-<id>
description: Build, extend or review NetScript Fresh UI screens in the <Theme Name> theme (<one-line thesis>). Use when a project sets data-theme="<id>", asks for a <style keywords> look, or adds new screens or components to a <Theme Name> app.
---

# <Theme Name> theme

Read `DESIGN.md` in this folder first. It holds the tokens and the full specification. This file is
the working procedure. The cross-theme rules are in `docs/design-system/GUIDELINES.md`, shipped as
the `netscript-design` skill.

## Use it when / don't use it when

- **Use for:** <products and screens where the style works>.
- **Don't use for:** <where the style's own guidelines say it fails>. Suggest <alternative theme>
  instead.

## Thesis

<Thesis.> Signature moves:

1. <move>
2. <move>
3. <move>

## Hard rules

- MUST <rule the theme depends on, from `DESIGN.md` → _Do's and Don'ts_>.
- NEVER <anti-pattern this theme is prone to>.
- MUST keep dark mode designed: <theme-specific dark rule>.
- MUST only read semantic roles (`--ns-*`) and `--ns-<id>-*` language roles. Never use primitives.

## Building a screen

1. **Enable the theme:** `data-theme="<id>"`, `data-scheme`, `data-density="<default>"` (provisional
   until #2414).
2. **Compose:** <how this theme lays out a page; which regions get which depth or material>.
3. **Pick variants:** <component → variant table for this theme>.
4. **Use the signature objects** where they carry meaning, never as decoration: <list>.
5. **Handle states:** <the theme's state physics>.

## New components or screens

- Start from the closest existing component's variant. Keep the theme's depth and shape rules.
- If a new visual role is needed, add it as `<id>/<path>`, list it in the language pack's role
  manifest (`DESIGN.md` → _NetScript Mapping_; GUIDELINES §2.4) and register it in code (#2414).
  Don't reuse an unrelated role.
- Add the new component to the state sheet, in Light and Dark.

## Self-check before handing off

- [ ] Recognisable as <Theme Name> at a 480px thumbnail.
- [ ] Dark audit: no white headers, pale gray slabs, white outlines or white or pale primary
      buttons. Saturated accent fills only where the accent policy in `DESIGN.md` allows them.
- [ ] Text ≥ 4.5:1; input, checkbox and switch boundaries and focus ≥ 3:1. Measured on pixels.
- [ ] Every depth or effect follows the model in `DESIGN.md` → _Elevation & Depth_.
- [ ] Whole-pixel edges; bound paints seeded with their resolved colour (Figma).
- [ ] <Theme-specific check>.

## References

`DESIGN.md` → Sources.
