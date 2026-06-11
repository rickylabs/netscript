# Plan — Sub-wave 5c: NetScript UI end product (PROPOSED)

> Status: **PROPOSED** — awaiting PLAN-EVAL. Generator session only; no
> implementation in this branch. This plan deliberately spans **three
> implementation runs** (user-sanctioned: "it is fine that conclusions drive us
> towards 3 separate implementation runs, or different branches"). Runs 2 and 3
> re-slice at their own lock points after upstream learnings; this plan locks the
> architecture decisions, the run split, and run 1's slices.

## 1. Archetype + doctrine verdict

- `packages/fresh-ui`: framework package with a **registry/distribution archetype**
  overlay — A3/A4-style package gates (check, lint, fmt, test, doc-lint, jsr
  dry-run) plus two registry-specific fitness checks introduced here (tokens-drift,
  manifest-integrity). New machine/primitive code is package-owned public surface;
  registry sources are copy-distributed and gated for metadata correctness, not API
  stability.
- `packages/cli`: scaffold/writers work inherits the CLI archetype incl. e2e
  (`netscript init` green) per netscript-cli skill.
- Doctrine fit: design.md §2.2 is "wrap, don't reinvent" applied in priority order
  (platform → Zag → never hand-roll); registry v2 wraps the shadcn model; token
  pipeline wraps DTCG + Style Dictionary. No proprietary formats introduced
  (DTCG JSON, shadcn-compatible registry.json export).

## 2. Architecture design

See `design.md` (companion, same commit) — thesis: one distribution chain
(DTCG → SD v5 → generated CSS artifacts → registry v2 → `ui:init`/`ui:add` →
apps), playground and starter app as two consumers of the same registry,
platform-first interactivity behind a Zag-shaped contract.

## 3. Decisions (proposed for lock)

| # | Decision | Summary |
| --- | --- | --- |
| D-1 | Layer model | Whitepaper 5 layers adopted; **L0 = platform contract** (conventions + few behavior primitives), not ~40 element wrappers. Layer-import rules + "L2 never imports L2" become review/lint gates. |
| D-2 | Runtime doctrine | Three tiers behind one Zag-shaped prop-getter contract: **Tier P** platform engines (dialog/drawer/sheet stay native `<dialog>`; accordion → `<details name>`; popover/tooltip/hover-card → Popover API + anchor positioning w/ fallback; tabs stays tiny hook); **Tier Z** `npm:@zag-js/preact` for machine-class components (combobox, date-picker, slider, ... — post-spike); **no new hand-rolled machines** once Tier Z proven. Public hook shapes preserved through migrations. |
| D-3 | Token pipeline | DTCG 2025.10 JSON source in `packages/fresh-ui/tokens/`; Style Dictionary v5 (pinned) builds 3 checked-in artifacts: `tokens.css`, `theme-bridge.css` (generated Tailwind @theme), `tokens.json`. Drift gate rebuilds + diffs in CI. Phase 1 = hex transcription (visually identical); Phase 2 = OKLCH ramps. Consumer contract (`--ns-*`, `*-ns-*`, ns- classes) is invariant. Resolves the RFC 06 deferred statement. |
| D-4 | Registry schema v2 | Kinds `theme|style|component|island|block|lib|hook|support`; `files[].target` with `@ui/ @islands/ @assets/ @lib/ ~/` placeholders; `registryDependencies` + `dependencies` (jsr:/npm: specifiers); **per-item CSS travels with the item**; docs/categories/meta. |
| D-5 | Distribution | Registry ships inside the JSR package; `netscript ui:init|ui:add` copy from package assets, rewrite specifiers, update deno.json. `deno task registry:build` emits shadcn-compatible `registry.json` as derived artifact = future community-namespace seam. No registry server. |
| D-6 | Ownership split | Copied/app-owned: L2, L3, theme CSS. Imported/package-owned: L0 primitives, L1 runtime, `_internal`. |
| D-7 | Official design system | Playground look promoted to official NetScript DS (dark-first warm gray + copper, DM Sans/Mono). Three CSS corpora reconciled into registry: base/typography/layout in theme artifacts, component classes split per-item; layout objects (RFC 06 bucket B) as CSS-only `layout-objects` style item. |
| D-8 | Playground = consumer #1 | Playground replaces deep relative imports with `ui:add`-installed app-owned copies; dogfoods the full chain. |
| D-9 | Living styleguide | `/design` route group in playground: tokens browser (reads tokens.json), per-item gallery, composition-rules pages; doubles as real-route validation surface. |
| D-10 | Scaffold = install + glue | `netscript init` app phase runs the `ui:init` code path + `starter` collection install; templates keep only glue (main/router/utils/vite/routes/example-service). Kills the template-fork drift class. |
| D-11 | Starter app definition | Generated app = playground sibling: `/` welcome map, `/dashboard` resource page (data-table block + sdk query factories + defer/partial + skeleton), `/dashboard/live` SSE widget, forms example, `/health`. Routes carry "what this demonstrates" doc headers. |
| D-12 | Topology | **One package** (`@netscript/fresh-ui`); no `@netscript/ui-primitives` split now (single consumer framework). Internal layout mirrors the future split; extraction is mechanical if/when a second consumer appears. Drift vs whitepaper recorded. |
| D-13 | Run split + ordering | Run 1 foundation → Run 2 design system (needs 1) → Run 3 scaffold revamp (needs 1+2 **and 5b merged** — templates target post-5b sdk surface incl. `defineServices()`). |

## 4. Open-decision sweep

- Naming of the official DS theme ("NS One" placeholder) — user call, cosmetic,
  doesn't block runs.
- Anchor-positioning fallback choice (OddBird polyfill vs CSS fixed-position
  degradation) — decided inside run 1's popover slice after the spike measures
  polyfill weight.
- Which Tier-Z components ship first (combobox is the likely lead) — decided at run
  2 lock; zero schema impact.
- `block:add` contract introspection — designed seam, explicitly deferred (§9).

## 5. Commit slices

### Run 1 — Composition foundation (`feat/...-5c1-ui-foundation`), 16 slices

| # | Slice | Notes |
| --- | --- | --- |
| 1 | Package task block + file-list cleanup in fresh-ui deno.json | replaces brittle explicit check list |
| 2 | DTCG token source: transcribe tokens.css 1:1 (hex) | D-3 phase 1 |
| 3 | SD v5 build task + generated tokens.css (byte/visual parity proof) | gate evidence in commit |
| 4 | Generated theme-bridge.css + tokens.json | new artifacts |
| 5 | tokens-drift fitness gate (`.llm/tools/fitness/`) | rebuild + diff |
| 6 | Registry schema v2 types + manifest migration | D-4 |
| 7 | manifest-integrity fitness gate | files exist ∧ all sources claimed |
| 8 | Per-item CSS extraction for existing component classes | from surfaces/forms/actions/feedback CSS |
| 9 | L0 conventions doc + primitives module (VisuallyHidden, SrOnly, Show) | D-1 |
| 10 | Zag×Fresh spike: `npm:@zag-js/preact` combobox in playground island (SSR + hydration) | go/no-go evidence for Tier Z; throwaway route |
| 11 | Accordion internals → native `<details name>` (hook shape preserved) | D-2 Tier P |
| 12 | Popover/tooltip internals → Popover API + anchor positioning + fallback | D-2 Tier P; largest slice |
| 13 | `ui:init` command in packages/cli (theme + styles aggregator + imports) | D-5 |
| 14 | `ui:add <item|collection>` command (copy, specifier rewrite, deps) | D-5 |
| 15 | OKLCH ramp re-derivation in token source | D-3 phase 2; visual review on /design precursor route |
| 16 | README/docs/jsr dry-run sweep | exit |

### Run 2 — Official design system (`feat/...-5c2-design-system`), ~12 slices (re-sliced at its lock)

CSS corpora reconciliation (playground 2,264L → registry homes); layout-objects
style item; component completion/reconciliation pass (toast, data-table, ...);
playground converted to `ui:add` consumer; `/design` styleguide (tokens browser,
gallery, rules); DS lint gates (no raw hex, no off-vocabulary color utilities);
real-route validation.

### Run 3 — Generated app revamp (`feat/...-5c3-scaffold-revamp`), ~12 slices (re-sliced at its lock; gated on 5b merge)

Scaffold pipeline: app phase delegates to `ui:init` + starter collection; delete
forked component/CSS templates; new starter routes per D-11 (dashboard resource
page w/ defer+partials, SSE live page, forms example) written against post-5b sdk
(`defineServices()`); route doc-headers; template manifest/loader cleanup;
`netscript init` e2e + generated-app check/lint/fmt green; visual parity review
against playground.

## 6. Gates (exit criteria per run)

- Standard package gates: `deno task check:packages` (and `check:apps` where
  playground is touched), lint, fmt:check, tests, combined doc-lint, jsr dry-run
  from package dir (netscript-tools wrappers; raw git for verdicts).
- New fitness gates introduced in run 1 and binding thereafter: **tokens-drift**
  (slice 5), **manifest-integrity** (slice 7).
- D-2 migrations: machine hook public shapes unchanged (deno doc diff) + playground
  real-route interaction checks.
- Run 3: `netscript init` e2e green (netscript-cli skill); generated app passes its
  own check/lint/fmt; starter routes validated in browser.
- Per gate matrix `.llm/harness/gates/archetype-gate-matrix.md`; PENDING_SCRIPT
  gates use manual evidence or debt entries (Phase A rules).

## 7. Risk register

| Risk | Mitigation |
| --- | --- |
| R1 Zag under Deno/Fresh unproven (npm specifier, SSR, hydration) | spike slice 10 is go/no-go **before** any Tier-Z component work; contract identical either way |
| R2 anchor positioning not Baseline (Firefox flag) | fallback decided in slice 12 with polyfill weight measured; tooltips degrade gracefully |
| R3 SD v5 2025.10 support partial | pin version; restrict source to supported features (colors object format verified); drift gate catches regressions |
| R4 scaffold blast radius | run 3 isolated + e2e-gated; template deletion only after `ui:init` path proven in run 1 |
| R5 playground in test-app repo (cross-repo) | framework repo ships DS; test-app sync via genesis flow; run 2 validates on synced copy |
| R6 5b concurrent sdk renames | run 3 hard-gated on 5b merge; template imports written against locked 5b surface |
| R7 per-item CSS split churns class catalog | extraction is move-only (no renames) in run 1; renames, if any, are run 2 decisions |

## 8. Debt implications

- Retires: `tokenSourceStrategy: 'css-seed-artifact-now-style-dictionary-later'`
  literal (becomes 'style-dictionary'); template-fork drift class; playground deep
  relative imports; hand-rolled popover/tooltip/accordion internals.
- Adds (accepted, recorded): OddBird polyfill or fallback CSS until anchor
  positioning is Baseline; legacy `apps/frontend` in test-app remains as-is until
  regenerated (not migrated in-place).

## 9. Deferred scope

- `block:add` contract-driven generation (whitepaper L3 factory) — seam designed
  (registry `block` kind + CLI introspection point), implementation post-5c.
- Tier-Z component buildout beyond the spike (combobox et al.) — run 2+ or its own
  wave once Zag is proven.
- Community namespaced registries (`@acme/*`) — registry.json export is the seam;
  activation deferred.
- `@netscript/ui-primitives` extraction — only on a second consumer framework.
- Customizable `<select>` adoption — Chromium-only today; revisit at Baseline.
