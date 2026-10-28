---
name: fresh-ui-theme-tonal
description: Build, extend or review NetScript Fresh UI screens in the Tonal theme (Material 3 Expressive with tonal container surfaces, a saturated hero, connected button groups, segmented list rows, filled text fields, a floating toolbar with a FAB). Use when a project sets data-theme="tonal", asks for a Material 3, Material You, M3 Expressive, Android-style or "Google" look, or adds screens or components to a Tonal app.
---

# Tonal theme

Read `DESIGN.md` in this folder first; it holds the tokens and the full specification. This file is
the working procedure. The cross-theme rules are in `docs/design-system/GUIDELINES.md` (shipped as
the `netscript-design` skill).

## Use it when / don't use it when

- **Use for:** consumer and Android-adjacent products, mobile-first admin, and apps that should look
  like current Google product UI.
- **Don't use for:** dense desktop finance grids (use Studio Ledger), widget-first personal
  dashboards with big type (use Bloom), or a platform look for Apple or Windows (Cupertino, Liquid,
  Fluent).

## Thesis

Material 3 Expressive on NetScript roles: tonal containers and shape carry the hierarchy. Signature
moves:

1. One saturated `primary` hero over a `container` → `container-high` → `container-highest` ladder,
   with no card borders.
2. Connected and segmented shapes: connected groups (selected = full pill, inner 8 → 4 pressed),
   segmented rows (28 outer / 6 inner), and the sunny shape only on the selected order.
3. A floating toolbar plus FAB, wavy progress, and filled fields with inside labels.

## Hard rules

- MUST read as current M3 Expressive, not the 2019-era Material look.
- NEVER separate Tonal surfaces with borders or drop shadows; only the floating toolbar
  (`0 3px 8px`) and the FAB (`0 4px 10px`) cast shadows.
- MUST keep dark saturated: hero, Save and FAB are #6e56cf with white text; never a pale inverse
  slab.
- MUST use on-colour state layers: hover 8%, pressed 12%, behind the label. Disabled = 12%
  container + 38% label at parent opacity 1.
- MUST bind enabled field labels to `fg`, focused to `primary-text` with a 2px `ring` indicator,
  error to `destructive-text` with a 2px indicator, an icon and a full repair sentence.
- MUST draw outlined controls with `input-border`, and the 1px enabled indicator of filled fields
  and text areas with `muted-fg` (#605e67 / #bab7c0, 4.85:1 / 6.60:1 on the field fill).
- MUST reserve the sunny shape for the selected order; other avatars are circles; no decorative hero
  blob. No sparklines on secondary KPIs.
- MUST name every icon-only action and keep a single "Create order" FAB.
- MUST only read semantic roles (`--ns-*`). Tonal has no language namespace; never use primitives.

## Building a screen

1. **Enable the theme:** `data-theme="tonal"`, `data-scheme`, default density (provisional until S1
   #2414). Gray and accent come from the theme (mauve × violet).
2. **Compose:** navigation rail (96px) + main column; pill search on top; header with title and one
   outlined action; KPI row with one hero; content in segmented lists, not ruled tables; forms in an
   r32 `container` card; supporting cards (r28) in a side column; the floating toolbar + FAB at the
   bottom centre for selection-scoped actions.
3. **Pick variants:**

   | Need             | Tonal component                                                    |
   | ---------------- | ------------------------------------------------------------------ |
   | Primary action   | filled button 40px pill, or the FAB for the screen's create action |
   | Secondary action | tonal (`primary-container`), outlined or text button               |
   | View filter      | connected button group 48px                                        |
   | Facet filter     | 32px chip, radius 8 (selected = tonal + check)                     |
   | Data list        | 72px segmented rows, 2px gaps, 28/6 corners                        |
   | Form field       | filled text field 56px with inside label                           |
   | Status           | 28px chip, radius 8, icon on `*-subtle`                            |
   | Progress         | wavy indicator with a stop dot                                     |

4. **Use the signature objects** where they carry meaning: the hero for the screen's main KPI, the
   sunny shape for the current selection, the wave for an operation in progress.
5. **Handle states:** layers (8/12%), focus 2px ring at a 2px gap, shape morph on press, selected
   rows and chips in `primary-container`.

## New components or screens

- Start from the M3 Expressive component that does the same job (m3.material.io) and the closest
  Tonal component; keep the M3 sizes and shape scale.
- Tonal has no namespaced roles. If a new visual role is needed, propose a core role through S1; do
  not invent `tonal/*`.
- Add the component to both state sheets (Light and Dark).

## Self-check before handing off

- [ ] Recognisable as Tonal at a 480px thumbnail (hero, tonal ladder, pill toolbar + FAB).
- [ ] Dark audit: no white headers, light slabs, white outlines or light primary buttons.
- [ ] Text ≥ 4.5:1; input, checkbox and switch boundaries and focus ≥ 3:1, measured on pixels. The
      enabled field indicator is `muted-fg` and measures ≥ 3:1 on its own fill; only disabled (38%)
      states are exempt.
- [ ] No borders between surfaces; shadows only on the floating toolbar and FAB.
- [ ] Whole-pixel edges; bound paints seeded with their resolved colour (Figma).
- [ ] Every icon-only action has an accessible name.

## References

`DESIGN.md` → Sources.
