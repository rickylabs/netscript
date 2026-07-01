# Research — Sub-wave 5c: `@netscript/fresh-ui` + UI surface (rescoped)

> Generator session, research + design only. User rescoped 5c from "package quality
> pass over fresh-ui" to: **plan the intended end product** per RFC 06 and the
> NETSCRIPT-UI-WHITEPAPER — composition system, official design system, and a total
> revamp of the CLI-generated frontend output. "This is what we should PLAN, not
> monkey patching existing." Conclusions may drive multiple implementation runs,
> branches, or package splits.

## 0. Scope and quality bar (user mandate, verbatim anchors)

- fresh-ui is "FAR from production ready... quick and dirty in the previous repo to
  prove conceptually it could work".
- Resolve the deferred token statement now: "the initial registry can ship with
  hand-maintained CSS seed artifacts, while the long-term design-system source of
  truth migrates to Style Dictionary-managed tokens without changing consumer-facing
  component semantics."
- Three streams in this branch: (1) composition system (layers, tokens, Style
  Dictionary, registry); (2) official NetScript design system extracted from
  `apps/playground`; (3) CLI frontend generated output total revamp.
- "The generated app output (frontend) should be much closer in terms of quality to
  the playground — currently not only is it ugly but barely functional and barely
  leveraging NetScript features."
- Vision: "the most DX perfect enterprise grade Deno framework from infra to ui —
  coherent, quality bar maintained across all layers."

## 1. Current-state inventory (three tiers, measured)

### 1.1 Tier A — `packages/fresh-ui` (the package, 5,783 LOC)

Structure: `registry/` (schema.ts 40L, manifest.ts 440L, theme/ 7 CSS files,
components/ui/ ~32 items, islands/) + `runtime/` (7 machines) + `_internal/` utilities.

- **Registry model already exists**: `RegistryManifest` with
  `model: 'copy-based-registry'`,
  `tokenSourceStrategy: 'css-seed-artifact-now-style-dictionary-later'`, item kinds
  `theme | component | island | support`, layer 2|3, `copyOwnership:
  'app-owned-after-copy'`, dependencies, 6 collections (foundation, forms-core,
  surface-core, feedback-core, layout-foundations, dashboard-blocks).
- **~33 registry items**: theme-seed; button, icon-button, input, textarea, checkbox,
  switch, label, select, form-field; card, panel, badge, separator, alert,
  inline-notice, spinner, progress, skeleton; breadcrumb, sidebar-shell, page-header,
  filter-form, stats-grid, detail-layout, data-table, pagination, empty-state,
  section-divider; theme-toggle, sidebar-toggle, toast (+toast-support).
- **7 runtime machines** (accordion, dialog, drawer, popover, sheet, tabs, tooltip):
  hand-rolled, NOT Zag.js, but expose a **Zag-shaped API** — `useX()` hook returning
  prop getters (`getTriggerProps`/`getContentProps`/...), `data-part`/`data-state`
  attributes, controlled/uncontrolled via `@preact/signals`, reason-tagged
  `onOpenChange`. Dialog/drawer/sheet use **native `<dialog>`**
  (showModal/show/close, onCancel/onClose) — platform-aligned, no focus-trap JS.
- **Token seed** `registry/theme/tokens.css` (211L): complete dual-theme system —
  12-step warm gray, copper 1–8, teal 1–7, slate 1–7, red, amber; semantic aliases
  (`--ns-bg/fg/primary/...` with -subtle/-border variants); DM Sans/DM Mono; type,
  space, radius, shadow, ease, z scales; `[data-theme='light']` override block.
  Header comment already states the SD intent. Colors are **hex**, hand-picked.
- **Gaps**: no token build pipeline; no copy-install CLI (`ui:add` does not exist —
  registry is data without a tool); manifest dual-maintained against files; deno.json
  `check` task enumerates files explicitly (brittle); 2 exports only; alpha.0;
  playground consumes via deep relative paths (registry never exercised as designed).

### 1.2 Tier B — `apps/playground` (the quality bar, in test-app workspace)

- Imports ~20 fresh-ui registry components through
  `../../../../packages/fresh-ui/registry/...` deep relative barrels — proves the
  components, bypasses the registry model entirely.
- **CSS design system lives here, not in the package**: components.css 381L,
  layouts.css 974L, styles.css 909L (~2,264L total) — "NetScript Design System —
  Playground Entry"; `@theme` block bridging `--color-ns-*` → `var(--ns-*)`;
  imports tailwindcss + tokens + fresh-ui surfaces.css.
- 12 islands (CodeTabs, Defer, FormsLab*, OrderItems, PluginShowcase, SagasLive,
  SidebarToggle, ThemeToggle, Toast, TriggerButton, TriggersLive, WorkersLive);
  dashboard route groups incl. framework labs (forms, streamdb, streaming, tanstack,
  wi-09). This is the only surface that exercises definePage + defer/partials + sdk
  queries + SSE + design system together.

### 1.3 Tier C — CLI scaffold output (the revamp target)

Two sub-tiers found — important nuance:

**C.1 Current templates** (`packages/cli/src/kernel/assets/app/*.template`, ~45
frontend templates, manifest-keyed via `assets/manifest.ts` → loaders in
`adapters/templates/scaffold-template-assets.ts` → writers in
`application/scaffold/writers/write-app-files.ts`):

- Better than expected: `routes/index.tsx` uses `definePage()` builder;
  `examples/service/index.tsx` uses `.withPolicy('balanced')`, `.withTelemetry`,
  `.withLayer(..., { delivery: 'defer', partial: ..., staleTime, staleReloadMode })`;
  `lib/example-service.ts` wires `createServiceClient` + `createQueryFactories` +
  `bridgeInvalidation` from `@netscript/sdk`; `assets/styles.css` has the @theme
  bridge; `tokens.css.template` (212L) is a copy of the fresh-ui seed.
- But: design system is a **duplicated subset** — CSS templates total ~570L vs
  playground's ~2,264L (actions 52, feedback 35, forms 26, surfaces 59, layouts 106,
  styles 91); only **2 UI components** (button 141L, card 63L) shipped as inert
  `.template` text forked from the registry sources. Every template copy is
  guaranteed drift against fresh-ui. No interactive machines, no data-table/blocks,
  no toast, no sidebar-shell chrome.

**C.2 Legacy generated app** (`apps/frontend` in test-app — what the user lives
with): Fresh default starter aesthetics — `fresh-gradient` lemon background, Fresh
logo + Counter island on the home route, `console.log` in the page body;
`assets/styles.css` is **298 bytes** (no tokens, no design system); `components/ui/`
has a hand-rolled indigo-Tailwind Button (no ns- classes) + Toast; 17 islands of
8–21KB each (JobsWidget 16K, LiveExecutionsTable 17.7K, Saga* ×4, TaurifyTest 21.5K)
hand-grown with inline raw Tailwind, zero fresh-ui usage; plus 35 `.taurify-*` junk
dirs. This is the concrete evidence for "ugly, barely functional, barely leveraging
NetScript features" — and the proof that valuable feature surfaces (SSE jobs,
sagas, triggers, workers widgets) get rebuilt ad hoc when the framework doesn't
ship them as blocks.

### 1.4 Gap synthesis

| Axis | Generated app (C) | Playground (B) | Cause |
| --- | --- | --- | --- |
| Tokens/theme | 0–212L copy | full system + bridge | no single source; template forks |
| CSS catalog | ~570L subset | ~2,264L | DS lives in playground, not package |
| Components | 2 (template forks) | ~20 (deep imports) | no `ui:add` copy flow |
| Interactivity | ThemeToggle only | 12 islands + machines | no machine/block distribution |
| NetScript features | partial (templates) / none (legacy) | full | no feature blocks in registry |

The registry exists as **data without a tool**; the design system exists as **an app
without a package**; the CLI ships **forks instead of installs**. The three streams
converge on one root cause: no distribution mechanism connects package → apps.

## 2. Intended end product (RFC 06 + whitepaper, points of tension)

Digest (both read in full this run):

- Whitepaper: strict 5-layer model — L0 HTML/CSS primitives (only layer rendering
  raw HTML, ~40 element wrappers), L1 state machines (**Zag.js**, ~24 machines,
  hook + thin part components), L2 styled copy-owned components (shadcn-style;
  pure `components/ui` vs interactive `islands/ui`), L3 composed blocks
  (CLI-generated from schema: resource-table, filters, forms), L4 ecosystem (SSE
  widgets, oRPC wiring, DeferPage). Each layer imports only beneath itself; L2 never
  imports L2. Package: `@netscript/ui-primitives` on JSR (./primitives, ./machines).
  Registry JSON + `ui:init`/`ui:add`/`block:add` CLI.
- RFC 06: 4-layer + E-bridge pragmatic mapping; seam buckets A–E; machine-backed
  seams live in `fresh-ui/interactive` (NOT a new package — explicit transitional
  bridge to whitepaper); §5 token architecture + @theme bridge + ns- class catalog +
  7 design-system rules; the deferred token phasing statement (line 578).

Tensions to resolve in design.md:

1. **Machine engine**: whitepaper says Zag.js; current runtime is hand-rolled (but
   Zag-shaped, native-`<dialog>`-based). New external fact: official
   `@zag-js/preact` adapter exists (§3.4) — Zag is feasible natively. Counter-fact:
   the web platform itself absorbed several machines (§3.5).
2. **`@netscript/ui-primitives` split**: whitepaper mandates it; RFC 06 defers it;
   prior wave hard rule said "do NOT create"; user now explicitly permits package
   splitting per findings.
3. **L0 literalism**: ~40 element wrappers vs L0-as-contract (conventions +
   data-attrs); Base UI's render/useRender model is prior art for contract-first.
4. **Token pipeline**: seed CSS now vs Style Dictionary canonical — DTCG 2025.10
   stable + SD v5 makes "later" resolvable to a concrete design now.

## 3. External research (state of the art, June 2026)

### 3.1 Base UI 1.0 (MUI-backed, 35 components)

Unstyled, accessibility-complete React components. Styling contract = **data
attributes reflecting machine state** (`stateAttributesMapping` → `data-*` on DOM),
composition via **render prop / `useRender`** (props merged: handlers composed,
class/style joined, external wins). Validates fresh-ui's existing
`data-part`/`data-state` + prop-getter direction as the industry-standard contract.
Sources: [useRender](https://base-ui.com/react/utils/use-render),
[Composition handbook](https://base-ui.com/react/handbook/composition),
[InfoQ release coverage](https://www.infoq.com/news/2026/02/baseui-v1-accessible/).

### 3.2 shadcn CLI 3.0 registry (Aug 2025)

`registry.json` (name, homepage, items) + `registry-item.json` per item: `type`
taxonomy (`registry:base|block|component|ui|lib|hook|page|file|font|style|theme|item`),
`dependencies` (npm, version-pinnable), `registryDependencies` (bare, namespaced
`@acme/item`, URL, local), `files[].target` with placeholders (`@components/`,
`@ui/`, `@lib/`, `@hooks/`, `~/`), `cssVars` scoped `theme|light|dark`, raw `css`
layer injection, `envVars`, `docs`, `categories`, `meta`. **Namespaced registries**
(`@namespace/item`, per-registry URL template + auth headers in components.json) are
the community-scaling mechanism. Sources:
[registry-item.json](https://ui.shadcn.com/docs/registry/registry-item-json),
[registry.json](https://ui.shadcn.com/docs/registry/registry-json),
[Namespaces](https://ui.shadcn.com/docs/registry/namespace),
[CLI 3.0 changelog](https://ui.shadcn.com/docs/changelog/2025-08-cli-3-mcp).

### 3.3 Design tokens: DTCG 2025.10 stable + Style Dictionary v5

- **DTCG Format Module reached its first stable version 2025.10** (Oct 28, 2025):
  vendor-neutral token JSON; multi-file support, theming, advanced color (14 color
  spaces incl. OKLCH). 20+ org editors (Adobe, Figma, Microsoft, Salesforce...).
- **Style Dictionary v5**: drop-in upgrade, internals refactor for perf, first-class
  DTCG (v4 baseline; 2025.10 adoption in progress — colors with
  `colorSpace/components/alpha/hex` object format already supported). zeroheight
  already runs SD v5 + 2025.10 in production.
- Tailwind v4 = CSS-first config: `@theme` tokens generate utilities AND runtime CSS
  vars; OKLCH adopted for perceptual ramps; guidance: primitives in `:root`,
  utility-generating tokens in `@theme`, semantic 3-tier layering.
  Sources: [DTCG stable announcement](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/),
  [Format 2025.10](https://www.designtokens.org/tr/drafts/format/),
  [SD DTCG info](https://styledictionary.com/info/dtcg/),
  [SD v5 migration](https://styledictionary.com/versions/v5/migration/),
  [Tailwind theme docs](https://tailwindcss.com/docs/theme).

### 3.4 Zag.js / Ark UI — Preact status

**Official `@zag-js/preact` adapter exists on npm — v1.31.1, actively published**
(same monorepo as react/vue/svelte adapters). Ark UI (the component wrapper over
Zag) has **no Preact target** — so the whitepaper's "hook + thin part components"
approach (Zag machines consumed directly) is the right granularity for Fresh; Ark is
the design template, not a dependency. Zag dialog/popover machines bundle focus-trap
+ dismissable-layer logic (div-based, not native `<dialog>`). Sources:
[@zag-js/preact on npm](https://www.npmjs.com/package/@zag-js/preact),
[zagjs.com](https://zagjs.com/), [Ark UI](https://ark-ui.com/docs/overview/about),
[Ark vs Zag discussion](https://github.com/chakra-ui/ark/discussions/2795).

### 3.5 Web platform absorption of UI machinery (Baseline status)

- **Popover API**: Baseline, all major browsers (4–18 months). Top-layer rendering,
  light-dismiss, `popovertarget` declarative wiring — replaces most
  popover/tooltip/menu JS.
- **CSS Anchor Positioning**: Chrome + Safari 26 shipped; Firefox 145 behind flag —
  not yet Baseline; OddBird polyfill maintained. `position-area`/`anchor()`
  replaces floating-ui-style positioning.
- **`@starting-style` + `transition-behavior: allow-discrete`**: entry/exit
  transitions for display:none ↔ visible without JS.
- **Customizable `<select>`** is itself built on popover + anchor positioning
  (Chromium-first).
- Native `<dialog>` (already used by fresh-ui) and `<details name>` grouping
  (native exclusive accordion) are Baseline.
  Sources: [MDN Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using),
  [OddBird anchor updates](https://www.oddbird.net/2025/10/13/anchor-position-area-update/),
  [OddBird polyfills](https://www.oddbird.net/2025/05/06/polyfill-updates/).

Implication: the whitepaper's L1 inventory (written when Zag was the only credible
engine) now splits into **platform-tier** components (dialog, drawer/sheet, popover,
tooltip, accordion, menu-lite) and **machine-tier** components (combobox,
date-picker, slider, tags-input, tree-view...) where Zag stays mandatory.

## 4. Consumer census

- `packages/fresh-ui` imported by: apps/playground (deep relative, ~20 items + CSS),
  nothing else in framework repo. CLI templates **fork** (not import) button/card/CSS.
- fresh-ui imports: `preact`, `@preact/signals`, fresh (jsx precompile). **Zero
  imports of sdk/plugin-streams-core** → 5c research/design is fully parallel to 5b;
  only the CLI-revamp run touches sdk surface (templates import
  `@netscript/sdk/client|query|query-client`) and must track 5b's locked renames
  (e.g. `defineServices()`, subpath folds 12→10).
- `netscript ui:*` commands: do not exist yet (whitepaper specifies
  ui:init/ui:add/block:add).

## 5. Risk inputs

- R1: Zag under Deno/Fresh (npm: specifier, SSR, islands hydration) unproven in this
  repo — needs a spike slice before committing the machine-tier to it.
- R2: Anchor positioning not Baseline (Firefox flag) — platform-tier popover needs
  fallback strategy (polyfill or CSS fallback) until Baseline.
- R3: SD v5 2025.10 support "in progress" — pin SD version; keep token source 2025.10
  but constrain to features SD already handles (colors object format OK).
- R4: CLI revamp touches the scaffold pipeline (manifest-keyed templates, writers,
  e2e tests) — large blast radius; must keep `netscript init` e2e green per
  netscript-cli skill.
- R5: Playground lives in the test-app workspace, not this repo — design-system
  extraction crosses repo boundaries; the framework repo ships the DS, test-app
  validates it (sync via genesis flow).
- R6: 5b implementation is concurrently rewriting sdk subpaths — CLI template
  imports must be written against the **post-5b** surface, gating run 3 on 5b merge.
