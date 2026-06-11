# Worklog — Run 5c2: Official design system

## Bootstrap

- Worktree `wave5-apps-5c2-design-system`, branch
  `feat/package-quality-wave5-apps-5c2-design-system` forked off `652c0bc`
  (tip of `feat/package-quality-wave5-apps-5c-fresh-ui`, post-PR-#31 merge,
  IMPL-EVAL PASS). Run dir created. Bootstrap performed by the generator
  coordinator session; implementation starts at MEASURE-FIRST + Run 2 lock.
- Plan of record: LOCKED v2 plan §5 Run 2 table (12 slices) in
  `.llm/tmp/run/feat-package-quality-wave5-apps--5c-fresh-ui/plan.md` on the
  5c branch, plus the Tier-Z lead component decision due at Run 2 lock
  (D-5c1-2 RESOLVED, Tier Z = GO).
- Inherited carry-over findings from 5c1 `evaluate.md`: package-wide fmt
  wrapper exit-1-with-zero-findings baseline quirk (use changed-source fmt
  checks as verdicts); tokens-drift gate env permission note for Linux
  runners (local runs unaffected).

## MEASURE-FIRST + Run 2 Lock

- HEAD verified: `fb71ddd` on top of `652c0bc`.
- Baseline recorded in `measure-5c2.json`:
  - check: PASS, test: 35 passed, lint: 0 findings, doc-lint: 0 errors
  - tokens-drift: PASS (3 artifacts stable)
  - manifest-integrity: PASS (62/62 files claimed, 4 excluded)
  - JSR dry-run: PASS (`Success Dry run complete`)
  - LOC: ~8,160 (ts+tsx+css), registry: 66 source files, 42 items, 6 collections
  - theme CSS: 868 lines
- **Lock decision**: Tier-Z lead component (combobox) **deferred** to dedicated
  post-5c wave. 12 slices remain locked; no slice 13. Recorded as D-5c2-0 in
  `drift.md`.

## Slice 1 — CSS corpora reconciliation (button + toast)

- Scope: Enhanced `button.css` and `toast.css` with playground-inspired visual
  depth while replacing raw hex/rgba with token-based `color-mix()`.
- Changes:
  - button.css: added 3D box-shadow depth to primary/secondary/outline/destructive
    variants; added transform transitions for tactile press feedback; replaced
    raw `rgba(235, 228, 210, 0.04)` with `color-mix(in srgb, var(--ns-fg) 4%, transparent)`.
  - toast.css: replaced all hardcoded `rgba()` values with `color-mix(in srgb, ...)`
    using semantic tokens; eyebrow color mixes `var(--ns-fg)` instead of `white`.
- Gate evidence:
  - manifest-integrity: PASS (no new files, existing items updated)
  - visual diff: button.css +152L/-50L, toast.css +225L/-121L (net +206L)
- Commits: `2a1b378` (impl), `3fb5098` (docs/measure)
- Drift: none

## Slice 1 (cont.) — remaining raw rgba in form-control-styles + sheet

- Scope: finish the slice-1 raw-value cleanup across the registry component CSS
  corpus (form-control-styles, sheet).
- Changes:
  - form-control-styles.css: focus ring + error shadows now use
    `color-mix(in srgb, ...)` over semantic tokens (`--ns-ring`,
    `--ns-destructive`) instead of raw rgba.
  - sheet.css: backdrop + shadows mix `var(--ns-gray-12)` via `color-mix`
    instead of black rgba literals.
- Gate evidence:
  - claim at commit time: zero raw rgba remaining in registry **component** CSS
    (touched files); corpus-wide verification deferred to the step-0 takeover
    audit below.
- Commits: `ae29999` (impl)
- Drift: none

## Slice 2 — layout-objects (layouts.css token cleanup)

- Scope: layout-objects deliverable. `layouts.css` (shell, stack, cluster,
  grid, toolbar, section, split, scroll-region, switcher, cover, sidebar,
  content-rail, dashboard) already existed from Run 1 as a file of the
  `theme-seed` item; this slice cleaned the one remaining raw rgba.
- Changes:
  - layouts.css: `.ns-status-bar__sep` / `.ns-status-sep` raw
    `rgba(135, 132, 125, 0.4)` → `color-mix(in srgb, var(--ns-muted-fg) 40%, transparent)`.
- Gate evidence: zero raw hex/rgba remaining in layouts.css.
- Commits: `7c5dffc` (impl)
- Note (takeover session): the locked slice-2 deliverable is a **separate
  `layout-objects` style item**; at `ae29999` layouts.css is still bundled
  inside the `theme-seed` theme item. Completed in the step-0 audit
  (slice 2 cont.) below, with drift recorded.

## Takeover checkpoint (session handover)

- Implementation taken over by a new generator session at remote tip
  `ae29999`; bookkeeping reconciled (this entry, slice 1-cont and slice 2
  worklog entries, commits.md rows) as a follow-up commit — no amends.
