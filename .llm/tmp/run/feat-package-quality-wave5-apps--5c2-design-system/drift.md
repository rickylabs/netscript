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

## D-5c2-2 — Slice 3: consumer-surfaced regressions + conversion shape (2026-06-12)

- Plan said: "playground converted to ui:add consumer | gate: playground
  check passes | replaces deep relative imports."
- Reality / deviations recorded:
  1. **`: unknown` JSX regression in shipped runtime** — the JSR
     no-slow-types annotation pass (Run 1) had stamped `): unknown {` on 44
     runtime components across 7 files (Accordion, Dialog, Drawer, Popover,
     Sheet, Tabs, Tooltip). `unknown` is not a valid JSX element type, so any
     consumer rendering them fails TS2786. Invisible to all package
     self-gates (they never render runtime components in JSX); surfaced only
     by the consumer typecheck this slice introduces. Fixed `: VNode` per
     house convention (framework `b54e3533`). Follow-up: slice 7/8 gate
     scripts should include a consumer-shaped JSX render typecheck.
  2. **button.css slice-1 regression** — `2a1b378` introduced a duplicated
     `.ns-btn {` opening line (unbalanced brace, CSS parse error at EOF in
     every consumer copy). Step-0 audit missed it (audit swept raw values,
     not parse validity). Fixed in framework `372484e`.
  3. **Scope growth, deliberate**: playground-wide fmt normalization + all 37
     pre-existing lint findings fixed, because the locked gate is the
     app-level `deno task check` (fmt && lint && check) and the pass-2
     mandate forbids waiving it. Isolated in its own commit (`32cc5bb`).
  4. **Typecheck gate is INFO_FAIL at env level**: playground full
     `deno check` is red at HEAD (347 errors) due to missing
     `database/postgres/schema/.generated/zod/` Prisma artifacts; generating
     them requires Prisma engines + env files, out of run scope. Gate verdict
     therefore = "no new errors vs HEAD baseline" (normalized set-diff
     empty), not "exit 0". fmt + lint are hard PASS.
  5. **App-owned skin split**: playground styles.css monolith split into
     registry `assets/ui/*.css` (package-owned) + components.css /
     dashboard.css (app-owned skins) — additive consumer-side structure,
     no registry change.
  6. **Slice-9 candidate**: playground responsive table patterns flagged for
     `ns-responsive-table` registry item during slice 9.

## D-5c2-3 — Slice 4: Prisma zod regeneration pipeline broken at HEAD (2026-06-12)

1. **Broken regeneration pipeline (env/repo defect, out of run scope).**
   Playground SSR depends on gitignored
   `database/postgres/schema/.generated/zod/` artifacts, but
   `schema/schema.prisma` at HEAD declares only `generator client` (the
   `generator zod` block was removed with a comment saying
   prisma-zod-generator is "not used here to avoid requiring a global
   binary"), while `packages/database/scripts/generate-zod.ts` still
   expects `prisma generate` to trigger the zod generator. Result:
   `deno task db:generate` can never produce the zod artifacts a fresh
   clone needs — `fix-zod-imports.ts` crashes on the missing dir.
   Follow-up owner: database package; either restore the `generator zod`
   block (it resolves via the workspace `node_modules/.bin/`
   prisma-zod-generator, no global binary needed) or rewrite
   generate-zod.ts to invoke the generator directly.
2. **Workaround used (local-only, not committed).** Temporarily restored
   the historical `generator zod` block from `6d2caeb57`, ran
   `db:generate` with placeholder `DATABASE_URL` (prisma.config.ts
   requires it at config-eval time even for generate; generate never
   connects), verified artifacts, reverted the schema edit. Working tree
   clean after.
3. **Side-effect guarded:** the regeneration + dev-server runs mutated
   root `deno.lock` (+1075 lines of additive resolutions); restored via
   `git checkout -- deno.lock` both times. Lock content committed by
   slice 3 (`e8ae8068`) unaffected.
4. **Gate-shape note:** "browser validation" for /design routes required
   regenerating env artifacts unrelated to the design system. Slices 5–6
   inherit the workaround (artifacts persist locally until cleaned).

## D-5c2-3 CORRECTION — zod pipeline NOT broken framework-wide (2026-06-12)

User feedback (with `.agents/skills/netscript-cli/SKILL.md` §Manual Full
Scaffold Smoke): `db init/generate/seed` are CLI commands intended to be
run manually via `deno run -A packages/cli/bin/netscript-dev.ts db
generate --project-root <app> --db postgres` as part of the manual smoke
procedure — and the CLI scaffold template
(`packages/cli/src/kernel/assets/database/schema.prisma.template`)
**ships WITH the `generator zod` block**. Corrected reading of D-5c2-3
item 1:

- The framework pipeline is NOT broken: fresh scaffolds get a
  schema.prisma containing `generator zod`, so CLI `db generate` emits
  the zod artifacts.
- What I observed is app-local drift in the repo-genesis instance: its
  `database/postgres/schema/schema.prisma` had the block removed (with
  an "avoid requiring a global binary" comment), which orphans the
  app-local `deno task db:generate` zod step. Follow-up owner is the
  repo-genesis app schema (realign with the CLI template), not the
  database package.
- My temporary block restoration matched the template exactly, so the
  regenerated artifacts are template-faithful.
- Process lesson recorded: activate the `netscript-cli` skill before
  reasoning about scaffold/db/CLI command behavior.

## D-5c2-4 — registry CSS ships zero prefers-reduced-motion guards (2026-06-12)

Found by the slice-5 browser gate (reduced-motion emulation on
/design/components). `grep -r prefers-reduced-motion packages/fresh-ui`
returns nothing, while five registry stylesheets animate:

- `progress.css:52` — indeterminate bar, 1.2s ease-in-out infinite
- `skeleton.css:16` — shimmer, 1.35s ease-in-out infinite
- `spinner.css:6` — ns-spin 0.6s linear infinite
- `sheet.css:30,34,78` — enter/backdrop transitions (~220ms one-shot)
- `toast.css:185,189` — enter/exit (~220ms one-shot)

The infinite loops (progress, skeleton) are the WCAG-relevant ones;
spinner is an essential loading indicator and the sheet/toast one-shots
are sub-250ms micro-motions, but a vocabulary-level guard is still the
right shape for a theme-blind component kit. NOT fixed inside slice 5
(locked scope = gallery route; fixing means editing registry sources in
the framework worktree + re-syncing byte-identical app copies in
repo-genesis). Follow-up owner: slice 9 (component completion — toast
is already in its scope; add the guards package-wide there and re-sync).

## D-5c2-5 — ns-responsive-table is a registry candidate, not built (2026-06-12)

The slice-9 reconciliation survey confirmed data-table.tsx renders a plain
semantic table inside `.ns-data-table` overflow scroll; there is no
stacked-card / responsive collapse variant anywhere in the registry, while
the gallery's 390px pass relies purely on horizontal scroll. A dedicated
`ns-responsive-table` (stacked rows under a container query) is a good
registry candidate but is OUT of the locked Run 2 scope. Recorded here so
the doctrine plan (post-Run-2 task) can pick it up as a backlog item.

## D-5c2-6 — copy fidelity is content-identity, not byte-identity (2026-06-12)

Slice-9 sweep: playground checkouts are CRLF (repo-genesis autocrlf) while
registry sources are LF, and island copies legitimately rewrite relative
import depth (`../lib/` → `../../lib/`). The practical copy-fidelity gate
is therefore `diff --strip-trailing-cr` plus the documented import-path
adaptation, not `cmp`. After fmt-normalizing registry sources
(`deno fmt --no-config --indent-width 2 --line-width 100 --single-quote`)
all 38+14 copied files pass that gate; `foundation.test.tsx`,
`floating.css`, `sheet.css` have no playground copies because those
registry items were never installed by the app (expected).
