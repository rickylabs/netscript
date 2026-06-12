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
