**Verdict: PASS** for the S4 blocks, navigation and overlays slice. S4R–S6 were not assessed.

**The evidence matches the frozen source.** All 21 files match `s4-source-hashes.json`. The capture ran at 08:27:28, and every CSS and TSX file it renders was last changed by 08:26:44. Only the catalog TS, `contracts.json` and two test files changed afterwards (08:27:41), and none of them affect rendering. Gates:
- tests: 139 focused + 19 generated-template, all pass
- check, lint and fmt: 6 files, 0 findings
- legacy comparison: 262×2 unchanged
- quality gate: exit 0
- browser capture: 30 fixtures, 176 measurements, zero errors

**Cascade and contracts:**
- **Tokens:** every role the S4 diff references exists in both the light and dark Utility blocks, including the tabs, nav, table, chart 1–5, marker, KPI, overlay and inverse roles.
- **Isolation:**
  - Every new rule is behind the Utility guard.
  - The edits outside the guard in `floating.css` (collapsed multi-line `:where()` lists) and `layouts.css` (re-indented grid selectors) are formatting only, and the legacy comparison confirms nothing changed.
  - Existing parts are reused, and the generated top bar now carries the existing `top-bar` root and brand parts.
- **Chart series:**
  - `data-series` is emitted only when there is no explicit tone, so explicit `destructive` stays red.
  - The Utility series rules come after the tone rules but carry a different attribute, so the two never compete.
  - The legacy `data-tone` cycle is unchanged.
  - The new attribute is in the TS catalog and `contracts.json` with matching parts (`bar`, and `ring`/`swatch`). The donut cycle has exactly 5 entries.
  - Tests assert explicit error intent survives.
- **Table states:**
  - Selected beats plain hover through source order at the same specificity, and the separate selected-and-hovered rule (0,7,0) darkens it.
  - This matches the locked table row: hover tint, selected fill with a 2px ink leading edge, and a darker fill when selected and hovered.

**Visual checks against locked and library references:**
- **Matches:**
  - stats grid: top hairline, mono uppercase eyebrow, large light KPI
  - table: uppercase mono headers and compact hairline rows
  - tabs: square marker, ink text, no fill
  - donut: chart 1–5 palette plus explicit red error, with the 96px size kept and the gap recorded
  - overlays: sharp, raised, no shadow or blur; tooltip on the inverse surface
- **Focus:** a 2px ring on tabs, nav items, breadcrumb, sidebar-toggle, theme-toggle, table rows and links, and popover items.
- **RTL:** the breadcrumb separator and progress mirror, and the off-canvas sidebar opens from the right.

**Non-blocking, carry into S4R/S6:**
1. **The two locked references disagree on the selected nav item.** The states sheet shows a light grey fill (sRGB 243) behind "■ Orders". The locked Orders screen's top nav shows no fill, and `--ns-nav-active` is transparent, which follows the screen. The sidebar's selected item currently has no fill. Decide explicitly in S4R and record the choice in drift. If the states sheet wins, `--ns-selected` is an existing role you could use.
2. **The sidebar's selected item shows the marker and the nav icon together** ("■ ★ Example"). The locked nav has no icon. Also, in the locked segmented control the focus ring sits inside the marker, while ours wraps the marker too. Both are cosmetic.
3. **The `top-bar`/`sidebar` gallery shots show the header about 52px below the top of `main`.** That's the existing sticky `top:0` header reacting to page scroll during capture; the measured header height is 48px. Reset scroll before the S6 summary capture.
4. **`table/true` clips its empty text.** This is the existing 44rem minimum table width inside a narrow specimen with horizontal scroll, not a regression.
5. **Hover tints come from the token values:** table hover is `#f9f9f9`, nav hover a computed 8%. The locked sheet reads about 4–5%. Don't change the tokens, as the plan requires.
6. **The `_layout.tsx.template` change and the chart/donut source changes must flow into the embedded registry and generated carriers.** That freshness gate belongs to S6.
