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

## Slice 2 (cont.) — step-0 audit + layout-objects style item extraction

- Scope: step-0 takeover audit of inherited slices 1/1-cont/2, plus completion
  of the locked slice-2 deliverable (separate `layout-objects` style item).
- Audit findings:
  - Raw-value sweep over the registry CSS corpus: generated theme artifacts
    (tokens.css / theme-bridge.css / tokens.json) legitimately carry raw
    values — they ARE the theme. Only true residual outside them was
    `registry/theme/styles.css:22` `-webkit-tap-highlight-color: rgba(...)`
    → now `var(--ns-primary-border)`. TSX corpus clean.
  - Locked slice-2 deliverable gap: layouts.css was still a theme-seed file,
    not a separate style item. Fixed below; recorded as drift D-5c2-1.
- Changes:
  - `git mv registry/theme/layouts.css → registry/styles/layouts.css`.
  - manifest: new `layout-objects` style item (layer 2, depends theme-seed,
    css contribution `@import './layouts.css';`); theme-seed slimmed to the
    4 NS One artifacts and re-described per the theme mandate; 9 dependents
    (skeleton, breadcrumb, sidebar-shell, page-header, stats-grid,
    detail-layout, pagination, empty-state, sidebar-toggle) gain
    `layout-objects` in registryDependencies; layout-foundations collection
    now points at `layout-objects`.
  - styles.css: dropped `@import './layouts.css';` (aggregator contributes it).
  - foundation.test.tsx: assertions for layout-objects item shape and that
    theme-seed ships no layouts.css.
- Gate evidence:
  - package check: PASS; tests: 35 passed (incl. updated foundation tests)
  - manifest-integrity: PASS 62/62 claimed (registry/styles/ auto-walked)
  - tokens-drift: PASS (3 artifacts stable)
  - CLI focused registry test: PASS
  - ui:init smoke into scratch dir: 28 items (was 27, +layout-objects),
    40 files copied, `assets/layouts.css` present, aggregator line 16 =
    `@import './layouts.css';`
  - fmt (changed sources): PASS after `deno fmt` on manifest.ts +
    foundation.test.tsx
- Drift: D-5c2-1 (structural extraction, additive)

## Slice 3 — playground converted to ui:add consumer

- Scope: convert `apps/playground` (repo-genesis, branch `feat/repo-genesis`)
  from deep relative imports into `packages/fresh-ui` to a real ui:add
  consumer, validating the design system on the synced copy (cross-repo R5:
  framework ships the DS; test-app syncs via the genesis flow).
- Changes (framework worktree):
  - `registry/components/ui/button.css`: removed duplicated `.ns-btn {`
    opening line — a slice-1 (`2a1b378`) regression producing a CSS parse
    error at EOF in every consumer copy. Follow-up fix commit, no amend.
  - `.llm/temp/ui-init-smoke.ts`: driver now accepts extra items CSV + theme
    args for consumer-shaped smoke runs.
  - `runtime/{accordion,dialog,drawer,popover,sheet,tabs,tooltip}/*.tsx`:
    **fixed `: unknown` → `: VNode` on 44 components in 7 files** (+ `VNode`
    type imports). The JSR no-slow-types pass had annotated explicit
    `: unknown` returns, which is not a valid JSX element type — any consumer
    rendering `<Sheet.Root>` etc. fails TS2786. Package self-gates never
    render runtime components in JSX, so only the consumer typecheck caught
    it: exactly the regression class the slice-3 gate exists to catch.
- Changes (repo-genesis), three structured commits:
  - sync: full `packages/fresh-ui` directory replace @ framework `b54e3533`
    (package-level untracked deno.lock excluded to mirror framework).
  - conversion: app-owned ui:add copies (`components/ui`, `islands/ui`,
    `lib/cn.ts`, `lib/ui/toast.ts`), bare `@netscript/fresh-ui`
    (+`/interactive`) import-map entries, registry styles as
    `assets/ui/*.css`, app skins split into components.css/dashboard.css,
    ns token vocabulary in tokens.css/theme-bridge.css/tokens.json,
    deno.json + root deno.lock (+clsx, +tailwind-merge; conflicting
    `preact/hooks` pin removed), islands SidebarToggle/ThemeToggle/Toast
    rewired to `./ui/*` copies.
  - normalization: mechanical fmt over the app + all 37 pre-existing lint
    findings fixed (playground lint gate green per pass-2 mandate).
- Gate evidence (gate: playground check passes):
  - `deno task check` in apps/playground: fmt PASS, lint PASS (0 problems),
    typecheck 347 errors — **byte-identical set to the HEAD baseline**
    (temp worktree `rg-baseline-check` @ `ce13e8089`; normalized `comm`
    set-diff empty). All 347 pre-existing, rooted in missing
    `database/postgres/schema/.generated/zod/` Prisma artifacts (77 TS2307
    cascade) — env INFO_FAIL, out of scope (`db:generate` needs Prisma
    engines + env files). Zero conversion-introduced errors; TS2786 count 0.
  - Conversion-owned files typecheck clean
    (`deno check --unstable-kv components/ui/mod.ts islands/{SidebarToggle,ThemeToggle,Toast}.tsx islands/ui/*.tsx lib/cn.ts lib/ui/toast.ts`).
  - fresh-ui package: typecheck PASS (entrypoints + 7 fixed files), lint
    PASS (37 files), tests 5/5 PASS in framework worktree AND on the synced
    repo-genesis copy; 7 edited files fmt-clean per deno.gates.json.
  - Deep-import sweep: no `../../packages/fresh-ui` imports remain in
    playground islands/components/routes.
- Pre-existing noted for slice 11: 30 runtime files unformatted per the
  package's own deno.gates.json fmt config (untouched by this slice).
- Slice-9 candidate carried: playground responsive table patterns →
  `ns-responsive-table` registry item.
- Commits: framework `372484e`, `7c7863a`, `b54e3533`; repo-genesis
  `b2008985` (sync), `e8ae8068` (conversion), `32cc5bb` (normalization).
- Drift: D-5c2-2

## Slice 4 — /design tokens browser route (2026-06-12)

- Scope (locked table row 4): `/design` route group: tokens browser |
  gate: browser validation | reads tokens.json. Built in repo-genesis
  `apps/playground` (the ui:add consumer from slice 3).
- Changes (repo-genesis, 7 files, 1066 insertions):
  - `lib/design/tokens.ts`: typed loader over `assets/tokens.json`
    (`with { type: 'json' }`); groups the 134-token manifest into
    foundation roles, six semantic intents (base/fg/hover/subtle/border
    companions), six primitive ramps, and type/space/radius/shadow/
    motion/z scales. Space tokens sorted by resolved px, z by value.
  - `routes/(design)/design/`: `_layout.tsx` (SidebarShell + breadcrumbs
    + ThemeToggle, "design system" badge), `index.tsx` (302 →
    /design/tokens), `tokens.tsx` (anchor rail + 8 sections; every
    swatch/specimen/bar/tile renders from its live `var(--ns-*)`, so the
    page is theme-aware by construction per the theme architecture
    mandate — no hardcoded NS One values).
  - `islands/design/TokenClipboard.tsx`: single delegated-click island;
    copies `var(--ns-*)` to clipboard, transient `data-copied` feedback.
  - `assets/design.css` (+ `styles.css` import): app-owned skin speaking
    only the ns token vocabulary + color-mix; 64rem responsive collapse
    (rail → pills, intents → 1-col, z-stack flattens);
    prefers-reduced-motion kills transitions/transforms.
- SSR unblock (env, not committed): playground SSR 500'd on missing
  gitignored `database/postgres/schema/.generated/zod/` artifacts.
  Restored the historical `generator zod` block from `6d2caeb57` into
  `schema/schema.prisma` TEMPORARILY, ran `db:generate` with a
  placeholder `DATABASE_URL` (generate never connects), verified
  artifacts, reverted the schema edit. Root `deno.lock` mutations from
  the regeneration/dev runs restored via `git checkout`. Drift D-5c2-3.
- Browser validation (Playwright, real route http://localhost:5173/design/tokens):
  - 200 SSR; title "Design tokens — NetScript design system"; zero
    console errors/warnings; `/design` → 302 → `/design/tokens`.
  - All 8 sections render in light AND dark themes (toggle exercised
    both ways); full-page + per-section screenshots in
    `scratch/slice4-evidence/`.
  - Copy interaction: island hydrated; click writes `var(--ns-primary)`
    to clipboard and sets `data-copied` (atomic in-page assertion).
  - Anchor rail: #ramps lands heading at y=80 (scroll-margin honored).
  - 390px mobile: scrollWidth 375 ≤ viewport (no horizontal overflow).
  - Reduced-motion emulation: ramp-step transition → `none`; motion-chip
    keeps inline transition but hover transform forced `none` (no motion).
- Fixes found BY browser validation (impeccable pass):
  - tile-row overlap: `.ns-token-row__preview` shrank to 22px in narrow
    `.ns-token-tiles` columns, sliding shadow/motion previews under the
    copy chip → `flex: 1 0 auto` for tile previews; overlap re-measured
    false for ease-spring/shadow-xs/radius-sm.
  - ramp label contrast: `mix-blend-mode: difference` failed mid-ramp
    (copper-6, teal-5) → token-based translucent pill
    (`color-mix(var(--ns-bg) 70%, transparent)` + `--ns-fg`), verified
    readable on every step in both themes.
  - z-stack mobile overflow (500px scrollWidth): inline staircase indent
    moved to `--zplate-indent` custom prop; 64rem media query flattens.
- Static gates: fmt PASS (6 files), lint PASS (5 files),
  `deno check --unstable-kv` PASS (exit 0, all 5 TS/TSX files).
- Commits: repo-genesis `30972f89` (pushed; remote head verified
  `30972f89b73666a403a1671ee2de3a5670a09fde`).
- Drift: D-5c2-3

## Slice 5 — /design component gallery route (2026-06-12)

- Scope (locked table row 5): `/design` component gallery | gate:
  browser validation, per registry item. Built in repo-genesis
  `apps/playground` on top of the slice-4 design route group.
- Changes (repo-genesis, 18 files, commit `e4da873bc`):
  - `routes/(design)/design/components.tsx`: all 43 fresh-ui-foundation
    registry items, grouped by kind — Components 18, Blocks 10,
    Islands 3, Styles 7, Foundation 5 (theme/lib/support). Every item
    is an `<article data-registry-item=… data-registry-kind=…>` with
    mono name, kind badge, layer badge, and manifest description.
    Live demos for every visual item (button incl. link form/loading/
    disabled, icon-button, all form controls, card, panel ×3 tones,
    badge ×6, separator h+v, alert ×4 with correct status/alert roles,
    inline-notice, spinner, progress det+indet, skeleton table+form,
    breadcrumb, page-header, filter-form, stats-grid, detail-layout,
    data-table 3 rows, pagination, empty-state, section-divider).
    Chrome-live items (sidebar-shell, theme-toggle, sidebar-toggle)
    documented in place via "Live on this page" notices — the page IS
    their demo. Style seams cross-link the demos that exercise them
    (`#item-*` anchors); theme-seed links to /design/tokens using
    `tokenManifestMeta.total`.
  - Installed the 6 registry items the playground had not copied:
    icon-button, checkbox, switch, panel, separator, progress (+ their
    CSS and choice-styles.css), byte-identical to
    `packages/fresh-ui/registry/` sources; `components/ui/mod.ts`
    barrel +9 exports (6 new + missing Label/Skeleton/Spinner);
    `assets/styles.css` +6 @import lines.
  - `lib/design/registry.ts`: app-owned 43-item catalog snapshot of
    `registry/manifest.ts` (decision from slice-5 prep: snapshot
    instead of widening the package API surface with a manifest
    export).
  - `assets/design.css`: gallery skin (item shell on `--ns-surface`,
    demo zone recessed to `--ns-bg`, row/stack helpers, refs links) —
    ns token vocabulary only; `_layout.tsx` nav gains Components entry.
- Browser validation (Playwright, real route
  http://localhost:5173/design/components):
  - SSR 200; title "Components — NetScript design system"; zero console
    errors/warnings.
  - Per-registry-item gate: 43/43 `data-registry-item` present, zero
    missing/extra/duplicate vs the manifest list; section counts exactly
    18/10/3/7/5; every item has name + description; the only items
    without demo zones are the 11 catalog-only style/lib/support items.
  - Demo integrity: 10 buttons (+link form anchor), 4 icon-buttons,
    3 inputs (1 error), 4 checkboxes, 3 role=switch, 4 select options,
    form-field error text, card title, 3 panels, 6 badges,
    3 role=separator, 4 alerts with roles [status,status,alert,alert],
    3 inline-notices, 4 spinners, 4 role=progressbar (64%/100% widths),
    22 skeleton blocks, breadcrumb aria-current, filter-form is a real
    `<form>`, stats values, 3 data-table rows, pagination disabled
    Previous, empty-state heading, 12 style-ref links all resolving to
    real anchors.
  - Themes: flipped via the REAL ThemeToggle island both ways
    (light→dark→light); oklch surface values verified to change;
    full-page screenshots both themes in `scratch/slice5-evidence/`.
  - 390px mobile: scrollWidth 375 ≤ 390, zero offending elements, rail
    collapses to static row pills.
  - Reduced-motion emulation: gallery skin itself adds no animation;
    FOUND package-level gap — registry CSS has no
    prefers-reduced-motion guards at all (progress indeterminate keeps
    its 1.2s loop; skeleton shimmer 1.35s; spinner; sheet; toast).
    Recorded as drift D-5c2-4, follow-up in slice 9.
- Static gates: fmt PASS (6 files), lint PASS (3 files),
  `deno check --unstable-kv` PASS (exit 0: components.tsx, _layout.tsx).
- Env notes: root `deno.lock` mutated again by the dev server
  (+562/−35) → restored via `git checkout -- deno.lock`. New untracked
  `packages/fresh-ui/deno.lock` appeared in repo-genesis during the dev
  run; left in place per the never-delete-locks rule (not committed).
- Commits: repo-genesis `e4da873bc` (pushed; remote head verified
  `e4da873bc967101f9013e4b45792c1865f6639a3`).
- Drift: D-5c2-4

## Slice 6 — /design/composition rules page (2026-06-12)

**Goal (locked plan row 6):** /design composition-rules page; browser validation; static docs route.

**Built (repo-genesis, branch `feat/repo-genesis`, commit `0e6013211d995da5f99c2cee3202aef9a1650ab5`):**

- `apps/playground/routes/(design)/design/composition.tsx` (NEW): static docs route with six
  anchored sections — layers (L0–L4 ladder, ownership column, per-layer import rule incl.
  "L2 must not import another L2; behavior moves down, composition moves up"), ownership
  (imported surface vs copy-source registry), tokens (5-point token rule: semantic --ns-* only,
  color-mix derivation, ramps are theme raw material, documented platform fallbacks only,
  theme = generated DTCG artifact set; NS One is a theme not the system), layout objects
  (6 live specimens: ns-stack/ns-cluster/ns-grid--3/ns-split/ns-toolbar/ns-switcher + footnote
  naming the rest of the vocabulary), attributes (data-part / data-state / aria-* / prop getters
  + native-first note), do/don't (6 pairs). Content grounded in
  packages/fresh-ui/docs/l0-conventions.md and README §Architecture.
- `apps/playground/routes/(design)/design/_layout.tsx`: nav entry /design/composition.
- `apps/playground/assets/design.css`: ns-rules-* skin (ladder staircase via nth-child indent,
  model cards, specimen figures with recessed --ns-bg canvas, dashed plates, def cards,
  do/don't cards with --ns-success / --ns-destructive accent borders). Token vocabulary only;
  initial --ns-fg-muted/--ns-fg-subtle slips corrected to --ns-muted-fg before commit.

**Gate evidence:**

- fmt: 3 files clean; lint: 2 files clean; `deno check --unstable-kv` route + layout: exit 0.
- Browser (Playwright, real route http://localhost:5173/design/composition):
  - SSR 200, console 0 errors / 0 warnings across whole session.
  - Sections 6/6 present, rail links 6/6, rungs L0–L4 in order, specimens 6/6 with live layout
    behavior verified computed (grid--3 → 3 columns, stack → column flex, cluster → flex).
  - Counts: 19 plates, 2 model cards, 4 attribute defs, 6 do + 6 don't, 5 token-rule items,
    link buttons → /design/tokens + /design/components, nav entry present.
  - Theme flip via live ThemeToggle: light → dark (bodyBg oklch(0.135 0.006 85), rung surface
    oklch(0.175 0.006 85), do-border oklch(0.61 0.082 190), dont-border oklch(0.625 0.165 28))
    → back to light. Full-page screenshots both themes + 390px viewport.
  - 390×844: scrollWidth 375 ≤ 390, 0 offenders; rail static row; switcher specimen stacks;
    deepest ladder rung right edge 331 < 390.
- Root deno.lock mutated by dev server again (4th occurrence) → restored via git checkout.
  Untracked packages/fresh-ui/deno.lock left untouched per never-delete-locks rule.

**Drift:** none new.

## Slice 7 — DS lint gate: no raw hex in components (2026-06-12)

**Goal (locked plan row 7):** DS lint gate "no raw hex in components", PENDING_SCRIPT replaced by
a real `.llm/tools/fitness/` script. Carries the D-5c2-2 follow-up (consumer-shaped JSX render
typecheck).

**Built (framework commit `fd9b41a2bc144bd1ea6246eb822b9b6c2fecfb1a`):**

- `.llm/tools/fitness/check-ds-no-raw-hex.ts` (NEW): scans packages/fresh-ui css/ts/tsx
  (excluding generated `registry/theme/` artifacts, `scripts/`, `docs/`, and test files) for raw
  hex literals and raw color functions (rgb/rgba/hsl/hsla/oklch/oklab/hwb). `color-mix(` is
  structurally immune (lookbehind excludes `-`). Escape hatch for documented platform fallbacks:
  `ds-allow-raw-color` same-line marker, per the l0-conventions token rule. House conventions
  followed (plain Deno script, PASS/FAIL + exit code, CI command in header, no deps).
- `packages/fresh-ui/consumer-render.test.tsx` (NEW): constructs all 7 interactive namespaces
  (full sub-seam trees) + Show/VisuallyHidden/SrOnly in consumer-shaped JSX, typed `: VNode`.
  Closes D-5c2-2 follow-up: the `: unknown` runtime regression class now fails `deno task check`
  inside the package itself. Excluded from publish by existing `**/*.test.tsx` rule.

**Gate evidence:**

- `deno run --allow-read .llm/tools/fitness/check-ds-no-raw-hex.ts` → `PASS 93 files clean`.
- Negative test: injected `#ff0000` + `rgba(0,0,0,.5)` into layouts.css → FAIL exit 1 listing
  both literals with file:line; reverted; PASS again.
- `deno task check` (package): exit 0 incl. new fixture. `deno task test`: 36 passed / 0 failed,
  including `runtime namespaces construct consumer-shaped JSX trees ... ok`.
- fmt + lint clean on both new files.
- NOTE: untracked `packages/fresh-ui/deno.lock` (843B) now also present in the framework
  worktree (appeared during package task runs). Left untracked per never-delete-locks rule;
  flag for slice 11/12 review (likely belongs in .gitignore or needs tracking decision).

**Drift:** none new; D-5c2-2 follow-up closed.

## Slice 8 — DS lint gate: no off-vocabulary color utilities (2026-06-12)

**Goal (locked plan row 8):** DS lint gate "no off-vocabulary color utilities", PENDING_SCRIPT
replaced by a real `.llm/tools/fitness/` script.

**Built (framework commit `9cf8bea5306bfc3caf305b8c71ccc4bd3053e1d0`):**

- `.llm/tools/fitness/check-ds-color-utilities.ts` (NEW): same walk/scope as slice 7 gate
  (packages/fresh-ui css/ts/tsx minus registry/theme, scripts, docs, tests). Three violation
  classes across 15 color-bearing utility prefixes (bg/text/border/ring/fill/stroke/outline/
  decoration/divide/accent/caret/from/via/to/shadow): stock Tailwind palette (22 palette names ×
  numeric steps), keyword colors (-white/-black), arbitrary color values (-[#…/-[rgb…/-[oklch…).
  Semantic `*-ns-*` utilities structurally unmatched. Escape hatch: `ds-allow-color-utility`.

**Gate evidence:**

- PASS 93 files clean at HEAD.
- Negative test: injected `bg-red-500 text-white border-[#ccc]` line → FAIL exit 1 listing all
  three violations with file:line; removed; PASS 93 again. (Injection accidentally created a
  stray new file — real components live under registry/components/ui/ — deleted immediately,
  verified untracked-by-git, gate re-run PASS.)
- `deno check --no-lock --unstable-kv` on script: exit 0. fmt clean. deno lint skips `.llm/`
  by root config (consistent with all existing fitness scripts).

**Drift:** none new.

## Slice 9 — component completion: reconciliation + reduced-motion (2026-06-12)

Survey: toast.css and data-table.tsx divergence was formatting-only (package
fmt config never covered CSS; root config excludes the package). Fix: fmt-
normalized all 60 registry sources (`deno fmt --no-config --indent-width 2
--line-width 100 --single-quote`); copies now pass `diff --strip-trailing-cr`
(CRLF is repo-genesis autocrlf; island copies legitimately adapt import
depth — drift D-5c2-6). `islands/Toast.tsx` "divergence" was exactly that
import-depth adaptation; `lib/toast.ts` is imported from the package root by
design (no copy). Closed D-5c2-4: prefers-reduced-motion guards in
progress (static 42% fill), skeleton (static gradient), spinner (1.5s,
essential indicator), toast/sheet (0.01ms one-shots, fill-mode preserved;
grep-verified no JS animationend dependency).

Gates: ds-no-raw-hex PASS 93, ds-color-utilities PASS 93, package check
exit 0, tests 36/36, browser gate on /design/components with
emulateMedia reducedMotion=reduce → progress animationName none w=188px
translated, skeleton none, spinner ns-spin 1.5s. ns-responsive-table
recorded as out-of-scope registry candidate (D-5c2-5).

Commits: framework 1d7b3053ef443502a26ccf46901020a218991153,
repo-genesis 3d8374d14285afad194f9425be9724eb02dd5124.

## Slice 10 — README + docs rewritten from scratch (2026-06-12)

User directive: rewrite entirely, reflecting the FINAL production-ready
package so follow-on agents can rely on it. README.md now leads with the
three pillars (themes/registry/runtime), the L0-L4 layer table, the CLI
install path + collections, the theme contract summary, the registry
catalog dumped from the live manifest (43 items, schema v2), living
reference routes (/design/*), and validation incl. the two DS fitness
gates. New docs/theme-authoring.md captures the theme contract (full
semantic vocabulary assignment, light+dark, ramps as raw material,
Tailwind bridge, must-NOT list). docs/l0-conventions.md rewritten with
the motion rule (slice-9 policy promoted to contract) and the
copy-fidelity criterion (D-5c2-6). Task names verified against deno.json
(tokens:build/tokens:check); token slot names verified against
registry/theme/tokens.css. Gates re-run: both PASS 93.

Commits: framework 571eccabf37a811454ddb457f8cb6bd65ee8cb59,
repo-genesis 40924ff89de8b9312b6798423d8772b20fcae91f.
