# Independent StatsGrid source review

PASS (slice 9c-b1 source review: the StatsGrid baseline audit)

The uncommitted StatsGrid unit implements the reviewed checkpoint compatibly. I found no blockers.

- **Root** (`packages/fresh-ui/registry/components/ui/stats-grid.tsx:50-65`):
  - An optional `columns` (exported `StatsGridColumns = 2 | 3 | 4`) emits `data-columns` only when set. When it's unset, the automatic auto-fit is unchanged.
  - `joined` defaults to `false` and emits `data-joined`.
  - Native props and classes pass through.
- **Card** (lines 67-152):
  - It's now a native `div` that keeps the `ns-card` class and `Card.Body`, and owns only the stats axes (`data-variant` default/hero, `data-delta` up/down/none). Card's own state and size axes no longer leak under the stats-grid scope.
  - `label`, `value`, `detail` and `badge` are kept, `badge` now gets its own part, and a `0` value still renders.
  - `icon` and the three decoration slots render only when supplied, as `aria-hidden` and `inert` wrappers.
  - The delta arrow is decorative and sits inside `detail`, so the caller's text carries the sign, as documented.
- **CSS** (`stats-grid.css`):
  - With `columns` set, a minmax formula caps the column count while keeping container auto-fit.
  - The KPI background positions, per-side border roles and first-card left border use existing roles only. Hero uses `primary`/`primary-fg` with inherited child colours.
  - **Joined:** a T/R/B root frame, a left rule on every card, and an upward 1 px shadow for the seam on wrapped rows, clipped on the first row. The computed and pixel checks prove 1 px rules in LTR and RTL.
  - **Decorations** default to `display: none` and only appear through `@container style(--ns-deco-*: 1)`. Browsers without style-query support stay hidden, so Utility (role 0) shows no decoration and nothing takes up space.
- **Evidence:**
  - 20 Chromium cases across Utility light/dark × 390/1280, covering native Tab/Enter/Space, all six modes, narrow and automatic layouts, hero and slots, with strict axe at zero and no allowances.
  - 379 contract tests and 124 registry tests, including the real CLI-installed StatsGrid.
  - The scoped wrappers, quality/architecture, preflight, docs accuracy, export drift and native publish (0 slow types) all pass.
  - The 124 doc-lint failure stays explicit under #2531, with the diagnostic set unchanged.

**Non-blocking:**

1. **Order-dependent CSS.** `.ns-stats-grid__card` and `.ns-card` (and the theme-scoped `:where(...) .ns-card` radius and border-width rule) have the same specificity. So the KPI background, border widths and radius depend on `stats-grid.css` loading after `card.css`. That holds for dependency-ordered installs and the fixture, but breaks if a consumer reorders imports. Consider raising the card rules to `.ns-card.ns-stats-grid__card`, a cheap change that adds no token, or document the import-order dependency.
2. **Delta needs `detail`.** The delta arrow only appears when `detail` is present. That fits "the sign lives in `detail`", but say so in the README so `delta` without `detail` isn't mistaken for a bug.
3. **Count reconciliation.** Correct the preliminary catalog count in the worklog to the real figures before the evidence commit, as you noted.

Next: the source commit, then the four committed-source carriers, a quality refresh at the commit, native publish, evidence review, privacy, push and the PR comment. DataTable/DataGrid (9c-b2) and all the remaining AI, Docs, Desktop, extension and harness work, the final runtime and CI are still required. No READY.


## Final small delta review

PASS (slice 9c-b1 final source change after the earlier PASS)

All three non-blocking items are addressed with small, compatible changes, and nothing else in the product changed.

1. **Order-independent CSS:** the card base rule is now `.ns-card.ns-stats-grid__card` (`packages/fresh-ui/registry/components/ui/stats-grid.css:22`), and the body rule is `.ns-card.ns-stats-grid__card > .ns-stats-grid__body` (line 46).
   - Both now outrank `.ns-card` and the theme-scoped `:where(...) .ns-card` rule, so the KPI background, the four border widths, the radius and the body padding no longer depend on import order.
   - The hero and joined rules already had higher specificity and are unchanged.
   - The new browser case loads the real maintained Card CSS last and asserts that the computed background, four borders, radius and body padding are unchanged for both plain and hero cards. That's real proof, not an assumption.
   - No token or API value changed.
2. **Delta documentation:** `packages/fresh-ui/README.md:318` now says the arrow only appears with `detail` and that the caller's text carries the sign.
3. **Worklog:** the catalog count is corrected.

The reported final browser run is 24/0 with nothing skipped or flaky, strict axe at zero with no allowances, and the same 36 captures. The browser fixture, spec and lint wrappers pass, and canonical asset generation passed after the selector change. The source stays at 15 files. If the latest browser-wrapper log is still finishing, make sure it lands green before the source commit.

Next: the source commit, then all four carriers, a quality refresh at the commit, native publish, evidence review, privacy, push and the PR comment. DataTable/DataGrid (9c-b2), the AI, Docs and Desktop units, the extensions and harness, and the final gates are still required. No READY.
