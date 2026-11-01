**PASS**: the round-2 Docs 11b2 design (RuledGrid X8 and Hero X9) is ready to implement, with one binding condition. The failure streak resets to 0.

**Both round-1 blockers are resolved** (`slice11b2-checkpoint.md`, "Required round1 corrections", lines 92–168)
- **The responsive policy now measures the component's own width** (lines 98–138).
  - Each root is a named inline-size container (`ns-ruled-grid`, `ns-hero`), and one inner part is styled from it: `grid` and `layout`. That's necessary because an element can't query its own container, and it isn't ornamental. No JS, parent contract or duplicate markup.
  - Literal widths are maximums with `minmax(0, …)`, so content can't force overflow.
- **The bands are exact.**
  - RuledGrid: 1 column up to 767, 2 from 768 to 1100, the declared 2, 3 or 4 from 1101.
  - Every band first resets each cell's inline-end rule, then removes it on every Nth cell. So no stale rule survives a band change, the last row keeps only its own bottom rule, and the feature variant carries no structural rules.
  - Hero:
    - up to 767, one column, gap 32, inline padding 20 and the 48/52 title role;
    - 768–1100, `1.5fr : 1fr` with gap 40, carrying over the live docs middle band (`docs/site/styles/components.css:836-870`);
    - 1101 and up, `17fr : 9fr` with gap 80, capped at 1120. That works out to exactly 680/360: 1120 − 80 = 1040, split 17:9.
  - Centered stays one column. Forced modes bypass the automatic overrides and remain `min 0`.
- **The tests reach the right points.** Band edges 767, 768, 1100, 1101 and 1120, for every column request, both variants and layouts, LTR and RTL. Also 390 and 1280 viewports, and the real `SidebarShell` `docs` layout with a rail at 1280, which is the case that exposed the gap.
- **The catalog delta is listed in full** (lines 140–164), against the current `src/contracts/catalog/docs-kit/4.ts`.
  - `RuledGrid.Cell`: its qualified slots (`eyebrow`, `icon`, `title`, `children` mapped to `description`, `action`), its conditional parts with `arrow` decorative, and no axes, with `data-columns` and `data-variant` stripped after the spread.
  - The keyboard contract is normalized to native child composition, with the frame adding no tab stop.
  - Hero `headingLevel` is a string enum `'1'`…`'6'`, default `'1'`, affecting rank only.
  - `paths` maps to a conditional `path-stack`, and `aside` renders when `aside` or `paths` is present. `layout` is declared as a new part.
  - `data-breakpoint` appears only when forced and is absent in automatic mode.
  - The settled enums are unchanged, and everything is labelled as normalization of an unshipped placeholder.

**Binding condition: write the queries as complementary ranges so fractional widths can't fall between bands**
- Don't use `max-width: 767px` / `min-width: 768px` or `max-width: 1100px` / `min-width: 1101px`. A container at 767.5 or 1100.5 would match neither, which is the same trap as the earlier DataGrid boundary.
- Use range syntax: `(width <= 767px)`, `(767px < width <= 1100px)` and `(width > 1100px)`. The integer bands in the checkpoint keep their meaning.
- Add fractional geometry cases at 767.5 and 1100.5 to the browser evidence, for both components and both directions. Assert exactly one band applies, with no overflow and no rule errors. Expect the result from the queries, never from the component's own display, as the native query reference already does for DataGrid.

**Already sound**
- Native frames with controls the caller supplies and no nested interactive elements. Title rank is the caller's choice.
- Owned attributes win after the spread.
- No hooks or L2 imports. Existing tokens only, with role resolution checked.
- The budget is under 30 files, and the README documents the band table.
- The full gate list and ledger captures, with 11b3, 12 and 13 deferred honestly.

**Next**
1. The source slice.
2. Its full gates, including the fractional cases.
3. This same source review, then evidence review.
4. The carriers, the public audit and the exact-lease push.

Still required after that:
- **11b3:** the actual six-component Desktop audit.
- **12:** the declared x-extensions and the all-style harness.
- **13:** the full runtime run, the IMPL-EVAL and green CI at the exact head.

No READY, labels, closing keywords or merge.
