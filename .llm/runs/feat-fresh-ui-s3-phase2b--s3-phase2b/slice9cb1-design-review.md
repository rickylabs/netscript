# Independent StatsGrid design review

PASS (slice 9c-b1 design checkpoint: StatsGrid baseline audit)

The checkpoint (`.llm/runs/feat-fresh-ui-s3-phase2b--s3-phase2b/slice9cb1-checkpoint.md`) is a complete, compatible audit unit inside the approved 9c-b scope, and it doesn't drop the DataTable/DataGrid follow-up. Implementation may start.

**Accepted:**
- **Compatibility:** `StatsGrid`/`StatsGrid.Card`, the copy targets, native attributes, classes, `children`, and `label`/`value`/`detail`/`badge` are all kept.
- **New ports, all opt-in and empty by default:**
  - optional root `columns` (2/3/4) that caps the auto-fit, with automatic behavior kept when it's unset;
  - `joined`, defaulting to false;
  - card `variant` (default/hero), defaulting to default;
  - `delta` (up/down/none), defaulting to none;
  - `icon`, `sparkline`, `ticks` and `blockbars` as optional Renderable slots.

  These replace the phantom boolean flags in L3 (`src/contracts/catalog/layout-blocks/1.ts:581-592`), which is the right correction.
- **Card ownership:** owning a native `div` for the stat card, instead of passing a hero variant through `Card`, is the right call. Today `StatsGrid.Card` renders `<Card>` with `data-scope='stats-grid'` (`registry/components/ui/stats-grid.tsx:48-52`), so Card's own `data-variant` and `data-state` would show up as stats-grid axes and clash with a `hero` variant. The checkpoint avoids that without weakening Card's contract.
- **Scope limits:** decorations are owned by the caller, inert and `aria-hidden`, follow the theme's visibility, with no invented series. No tone or `deltaTone` promotions, no new tokens, dependencies, schema changes or identities. The joined one-pixel wrap geometry is called out as needing real browser proof.
- **Gates:** under 30 files; SSR, contract, installed-copy and provider fixtures; native child Tab and Enter/Space; the container-adaptive modes plus hero, delta and optional parts; Utility light/dark at 390/1280 plus a narrow container and RTL with strict axe; quality/architecture, preflight, docs accuracy, export drift, native publish and doc-lint with no new diagnostics; carriers after the source commit; the same independent review; privacy before push.

**Implementation advice (not blockers):**

1. **Declare parts and scope axes first.** L3 has no `icon` or delta-indicator part yet. Add them, for example `icon` and `delta`, before rendering them.
   - Scope `data-variant`/`data-delta` with `parts: ['card']` and `data-columns`/`data-joined` to the root.
   - Change the four decoration props from `boolean` to `slot`.
   - Record all of this as audited baseline corrections in `contracts.json` and the notes.
2. **Keep styling compatibility.** If existing consumers target the stat card's `ns-card` class, keep that class on the new native card `div`, so Card's base surface styling still applies. Make sure no Card-owned `data-*` axes leak under the stats-grid scope.
3. **Hidden decorations must take no space and be unreachable.** Where Utility's visibility roles are 0, hide the slot wrappers with `display: none`, not opacity, so they take no space, can't be reached, and caller content stays out of the tab order. Document that decorations must not contain controls, and add a browser assertion that a decoration with a focusable child gets no tab stop.
4. **Delta meaning.** The arrow glyph is decorative. The README and fixtures should show the caller conveying the sign in `detail` text. In hero, check `primary/fg` contrast for the value, the detail and the badge under strict axe.
5. **Joined rules.** Prove computed border widths at every column count and at the wrap point: no doubled two-pixel seams, and no missing left divider on the first card of a wrapped row. Do it with border placement or logical selectors only, with no token changes.
6. **`columns` typing.** TypeScript will likely use `2 | 3 | 4` while the contract enum uses string values. Pin the mapping in one named type, and assert the rendered `data-columns` value in the contract fixtures.
