# Drift — Run 5c2: Official design system

Append-only. Inherits parent 5c drift (D-1…D-8) and 5c1 drift
(D-5c1-1 benign scratch hosting, D-5c1-2 RESOLVED Tier Z = GO,
D-5c1-3 root-exclude lift with accepted root publish-graph churn).

## D-5c2-0 — Run 2 lock: Tier-Z lead component deferred to dedicated wave

- Slice: lock (pre-slice-1)
- Plan reference: design-appendix.md §E.1 Run 2 table (12 slices); lock-time decision
  asks whether to add slice 13 = Tier-Z combobox.
- Decision: **defer** Tier-Z lead component (combobox) to a dedicated post-5c wave.
  Rationale: (a) the 12 locked slices already represent substantial cross-repo work
  (CSS reconciliation, layout-objects, playground/ui:add conversion, /design route
  group, lint gates, component completion, docs, check/lint/fmt, JSR dry-run);
  (b) the cross-repo caveat (R5) means playground validation requires genesis sync
  mechanics that are themselves non-trivial; (c) the Zag×Fresh spike in 5c1 proved
  SSR + hydration works, but shipping a production-grade combobox with full
  accessibility, tests, and docs deserves its own scoped wave rather than being
  squeezed into an already-full run.
- Impact: no rescope of the 12 locked slices; Tier-Z component buildout recorded as
  deferred scope beyond Run 3.

## D-5c2-1 — Structural: layouts.css moved out of theme-seed into a layout-objects style item

- Slice: 2 (cont.) / step-0 takeover audit
- Plan reference: locked Run 2 table slice 2 ("layout-objects" deliverable) and the
  theme-architecture mandate (theme = token artifacts; components/styles consume
  only the semantic `--ns-*` vocabulary).
- Reality at takeover (`ae29999`): `registry/theme/layouts.css` was shipped as a
  *file of the theme-seed theme item*, conflating theme-specific artifacts with
  theme-independent layout objects. The locked slice-2 deliverable (a separate
  style item) had not actually been created — only the rgba cleanup landed.
- Change: `git mv registry/theme/layouts.css → registry/styles/layouts.css`; new
  manifest item `layout-objects` (kind `style`, layer 2, depends on `theme-seed`,
  css contribution `@import './layouts.css';`); theme-seed slimmed to the 4 NS One
  artifacts (styles.css, tokens.css, theme-bridge.css, tokens.json) and re-described
  as the NS One theme; 9 dependent items (skeleton, breadcrumb, sidebar-shell,
  page-header, stats-grid, detail-layout, pagination, empty-state, sidebar-toggle)
  now declare `layout-objects` in registryDependencies; layout-foundations
  collection points at `layout-objects`; styles.css drops the layouts import
  (aggregator now contributes it) and its last raw rgba
  (`-webkit-tap-highlight-color` → `var(--ns-primary-border)`).
- Impact: additive/structural only — ui:init now installs 28 items (was 27,
  +layout-objects) and 40 files; aggregator emits `@import './layouts.css';` from
  the css contribution instead of the theme's own import. No component API change.
  This is the open/closed seam the mandate requires: a second theme can replace
  theme-seed without touching layout objects.
