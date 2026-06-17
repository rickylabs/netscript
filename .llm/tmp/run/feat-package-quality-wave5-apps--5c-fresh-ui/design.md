# Design — NetScript UI end product (composition system, design system, generated app)

> Companion to research.md. This is the architecture the implementation runs build
> toward. Decisions here are PROPOSED until PLAN-EVAL locks plan.md.

## 1. One-paragraph thesis

NetScript UI becomes a **single coherent distribution chain**: DTCG token source →
Style Dictionary build → generated CSS artifacts (custom props + Tailwind v4 @theme
bridge) → registry v2 items (copy-owned components, package-owned runtime) →
`netscript ui:init / ui:add / block:add` → apps. The playground and the generated
starter app become **two consumers of the same registry** — the playground is the
maximal install plus labs, the starter is a curated install plus example routes
that exercise definePage/defer/partials/sdk/SSE end-to-end. Interactive behavior is
**platform-first** (native dialog/details/popover/anchor) behind a **Zag-shaped
prop-getter contract**, with Zag.js (official Preact adapter) as the approved engine
for genuinely machine-class components. One source of truth per concern; zero forks.

## 2. Composition system (stream 1)

### 2.1 Layer model — whitepaper 5 layers, with L0 as contract

| Layer | What it is | Where it lives | Distribution |
| --- | --- | --- | --- |
| L0 | **Platform contract**: token consumption, `data-part`/`data-state`/ARIA conventions, native-element-first rules; plus a small set of real utility primitives (VisuallyHidden, Portal-equivalent, Show/SrOnly) | `fresh-ui/primitives` + conventions doc | imported |
| L1 | Behavior: hooks returning prop getters (Zag-shaped) | `fresh-ui/runtime/*` | imported |
| L2 | Styled components (pure `components/ui` vs interactive `islands/ui`) | `fresh-ui/registry/components|islands` | **copied** (app-owned) |
| L3 | Blocks composed from L2 + sdk (resource-table, filter-form, stats, dashboards, jobs/sagas widgets) | `fresh-ui/registry/blocks` | **copied**, some CLI-generated from contracts |
| L4 | Framework integration: definePage layers, defer/partials, SSE wiring, query factories | `@netscript/fresh` + `@netscript/sdk` (exists) | imported |

Amendment vs whitepaper (recorded as drift): L0 is **not** ~40 element-wrapper
components. Base UI 1.0 proves the modern contract is data-attributes + prop
merging, not wrapper elements; in Preact, JSX intrinsics are already fully typed and
wrappers add indirection without safety. L0 ships conventions (enforced by lint
rules + review gates) and only primitives that encapsulate real behavior.

Composition rules (unchanged from whitepaper, made enforceable):

- A layer imports only from layers beneath it. **L2 never imports another L2** —
  shared behavior moves down to L1/L0, shared composition moves up to L3.
- Anything wrapping an L1 hook is an island (`islands/ui/`); pure render stays in
  `components/ui/`. The registry item kind encodes this (`component` vs `island`).
- Only L0/L2 emit class names; L1 emits only data-attrs + ARIA + handlers. CSS
  expresses state exclusively via `[data-state=...]`/`[data-part=...]` selectors.

### 2.2 Interactive runtime doctrine — platform-first, Zag-shaped, Zag-backed when needed

Three tiers, one public contract (`useX()` → prop getters, identical shape across
tiers, so the engine is an implementation detail consumers never see):

- **Tier P (platform engine)** — behavior the web platform now owns:
  - dialog / drawer / sheet: native `<dialog>` (keep current implementation; it is
    already correct and focus-trap-free).
  - accordion: native `<details name>` grouping (replace hand-rolled machine).
  - popover / tooltip / hover-card / dropdown-menu-lite: Popover API
    (`popover`/`popovertarget`) + CSS anchor positioning, `@starting-style`
    transitions; OddBird polyfill (or graceful fixed-position fallback) until
    anchor positioning is Baseline.
  - tabs: roving-tabindex hook (tiny; keep hand-rolled — no platform primitive yet,
    too small for Zag).
- **Tier Z (Zag engine, `npm:@zag-js/preact` official adapter)** — machine-class
  components the platform doesn't provide: combobox, select-rich, date/range picker,
  slider, tags-input, pin-input, tree-view, color-picker, editable, toast-queue
  (evaluate per component at build time; spike slice validates Zag×Fresh SSR +
  islands first).
- **Tier never**: new hand-rolled machines are prohibited once Tier Z is proven.
  Existing hand-rolled popover/tooltip/accordion internals migrate to Tier P; their
  hooks' public shapes are preserved.

Why this beats "all Zag" (whitepaper) and "all hand-rolled" (current): smallest
possible JS (platform features are 0kb), wrap-don't-reinvent applies to the platform
before any library, and the Zag-shaped contract keeps every option open per
component — including swapping tiers later with zero consumer changes.

### 2.3 Token architecture — resolving the deferred statement

**Source of truth**: DTCG 2025.10 JSON under `packages/fresh-ui/tokens/`:

```
tokens/
  primitives.tokens.json     # color ramps (OKLCH), type scale, space, radius, shadow, motion, z
  semantic.tokens.json       # bg/fg/primary/success/... aliases ({color.copper.6} refs)
  themes/dark.tokens.json    # default theme bindings
  themes/light.tokens.json   # light overrides
```

**Build**: Style Dictionary v5 (pinned `npm:style-dictionary@^5`), run via
`deno task tokens:build` inside fresh-ui. Outputs are **generated, checked in,
formatted, and gated** (a fitness check rebuilds and diffs — drift between source
and artifacts fails CI):

1. `registry/theme/tokens.css` — `:root` custom props + `[data-theme='light']`
   block. Same consumer contract as today (`--ns-*`).
2. `registry/theme/theme-bridge.css` — generated Tailwind v4 `@theme` block
   (`--color-ns-* : var(--ns-*)`, fonts, radii) — today this is hand-kept in each
   app's styles.css; generating it removes a whole fork class.
3. `registry/theme/tokens.json` — flat resolved export for tooling (docs site,
   future Figma sync, CLI introspection).

**Phasing** (this is the locked answer to the deferred statement):

- Step 1 (mechanical): transcribe current hex seed 1:1 into DTCG source; SD build
  must emit visually-identical CSS (hex passthrough). Consumers notice nothing.
- Step 2 (quality): re-derive ramps in **OKLCH** in the source (perceptually uniform
  steps, the reason Tailwind v4 adopted it); emit `oklch()` (Baseline) with the DTCG
  `hex` fallback component populated.
- Invariant for both steps: **consumer-facing semantics never change** — the
  custom-property names (`--ns-*`), the @theme utility names (`*-ns-*`), and
  component class names are the stable contract; only the production process and
  color values behind them improve.

Token tiers follow the 3-tier industry standard: primitive (ramps) → semantic
(purpose) → component (only where a component needs its own knob, defined in the
component's CSS referencing semantic tokens — never raw values).

### 2.4 Registry v2 — shadcn-grade schema, JSR-native distribution

Schema evolves toward shadcn registry-item (adopting its proven fields, dropping
React-isms):

```ts
kind: 'theme' | 'style' | 'component' | 'island' | 'block' | 'lib' | 'hook' | 'support'
files: { source, target }[]          // target uses placeholders: @ui/ @islands/ @assets/ @lib/ ~/
registryDependencies: string[]       // bare = same registry; '@ns/x' reserved for future namespaces
dependencies: string[]               // jsr:/npm: specifiers (e.g. npm:@zag-js/combobox) — CLI adds to deno.json
css?: { layer, content }[]           // per-item CSS contributions (component classes travel with the item)
docs?, categories?, meta?
```

Key structural change: **per-item CSS travels with the item**. Today the class
catalog (ns-btn, ns-card, ...) lives in monolithic CSS files; v2 splits component
CSS into per-item files so `ui:add button` copies button.tsx + button.css and the
app's styles.css aggregates via `@import './ui/*.css'` globs (or a generated
imports file). The monolithic seed files remain only for base/layout/typography.

**Distribution = the JSR package itself.** The registry files ship as package assets
inside `@netscript/fresh-ui`; `netscript ui:add` resolves the manifest from the
package (local workspace or JSR cache), copies files to targets, rewrites import
specifiers to app-local paths. No registry server, no auth — versioning, integrity,
and offline come free from JSR. A `deno task registry:build` emits `registry.json`
(shadcn-compatible shape) as a derived artifact, which (a) lets third-party tools
read us and (b) is the seam where future **namespaced community registries**
(`@acme/thing`, shadcn-3.0-style URL templates) plug into `ui:add` without changing
the copy machinery. Manifest correctness is gated: a fitness check verifies every
manifest file path exists and every registry source file is claimed by an item.

Ownership split (matches shadcn's radix-vs-components split):

- copied, app-owned: L2 components/islands, L3 blocks, theme CSS artifacts.
- imported, package-owned: L0 primitives, L1 runtime hooks, `_internal`.

## 3. Official NetScript design system (stream 2)

### 3.1 Identity

Codify the playground's existing look as the **official NetScript design system**
(working name: "NS One"; final naming is a user call): dark-first, 12-step warm
gray, copper primary, teal success, slate secondary, DM Sans / DM Mono, 4px-grid
spacing, restrained radii/shadows, `data-theme` switching with FOWT-prevention
inline script. This identity already exists and is good — the work is **promotion,
not invention**: move its source of truth from the playground app into the package.

### 3.2 Mechanics

1. **Reconcile the three CSS corpora** (playground 2,264L > package surfaces +
   CLI 570L subset) into the registry: every ns- class gets exactly one home —
   base/typography/layout objects in theme artifacts, component classes in per-item
   CSS (§2.4). Layout objects (Stack, Cluster, Grid, Toolbar, Section, Split,
   ScrollRegion — RFC 06 bucket B) become a `layout-objects` style item:
   CSS-only, class-driven, zero JS.
2. **Playground becomes registry consumer #1**: replace deep relative imports with
   `ui:add`-installed app-owned copies (dogfoods the CLI flow and the copy-ownership
   story; playground diffs against registry become an intentional signal, not drift).
3. **Living styleguide**: `/design` route group in the playground — tokens browser
   (reads generated tokens.json), component gallery per registry item, layer/
   composition rules pages. This is the design system's documentation AND its visual
   regression surface (validated on real routes per repo rules).
4. **Design-system rules** (RFC 06 §5's seven rules) move into the conventions doc
   + lint gates where mechanically checkable (e.g. no raw hex in components, no
   Tailwind color utilities outside @theme vocabulary).

## 4. CLI generated frontend — total revamp (stream 3)

### 4.1 Principle: scaffold = registry install + thin glue

The generated app must be **a sibling of the playground, not a fork of it**. The
scaffold pipeline stops shipping forked `.template` copies of design-system files
and components; instead `netscript init` (app phase) runs the same code path as
`netscript ui:init`:

1. `ui:init`: copy theme artifacts (tokens.css, theme-bridge.css, base/layout CSS),
   write styles.css aggregator, set deno.json imports, install the `starter`
   collection (button, card, badge, form-field, input, select, alert, spinner,
   skeleton, page-header, sidebar-shell, theme-toggle, toast, data-table,
   empty-state, pagination).
2. Templates keep only app-specific glue: main.ts, router.ts, utils.ts, vite
   config, route files, lib/example-service.ts.

This kills the template-fork drift class permanently: design-system upgrades reach
the scaffold by upgrading the package, not by re-syncing ~25 template files.

### 4.2 Starter app product definition ("what `netscript init` boots into")

A small but **real** app, every screen exercising a NetScript capability:

- `/` — welcome + workspace map (services, routes, links), page-header + cards,
  theme toggle; definePage with meta.
- `/dashboard` — sidebar-shell chrome; **resource page for the scaffolded example
  service**: data-table block fed by sdk query factories (`defineServices()` —
  post-5b surface), filter-form, pagination, empty-state; one layer
  `delivery: 'defer'` + partial + skeleton fallback (proves streaming SSR).
- `/dashboard/live` — SSE example wired to the example service (jobs/heartbeat
  widget block) — the capability users currently rebuild by hand (17 ad-hoc islands
  in legacy apps/frontend prove the demand).
- `/health` — content-negotiated (keep).
- Forms example route — form-field + validation against the contract schema.

Each generated route carries a short "what this demonstrates / where to edit"
docs-comment header — scaffold-as-teaching-surface.

### 4.3 `block:add` (deferred seam, designed now)

The whitepaper's contract-driven generation (`netscript block:add resource-table
--service=users` → infer columns/filters from the oRPC/Zod contract) lands after
the registry flow is proven; registry v2's `block` kind + the contract-introspection
seam in the CLI are designed so this drops in without schema changes. Out of scope
for the three runs below; recorded as deferred scope.

## 5. Package topology decision

**Keep one package: `@netscript/fresh-ui`** (registry + runtime + tokens + primitives).
Do NOT create `@netscript/ui-primitives` now — recorded as drift vs whitepaper with
rationale: there is exactly one consumer framework (Fresh/Preact) and one runtime;
a split would duplicate publish/gate overhead and create an import-graph seam with
no second consumer to serve. The internal directory layout (primitives/ runtime/
registry/ tokens/) mirrors the future split exactly, so extraction is a `git mv` +
deno.json change when a second consumer (or non-Fresh Preact usage) materializes.
This honors both the old hard rule (don't create it) and the user's new latitude
(split when findings demand — they don't yet).

## 6. How it scales

- **Internally**: one source of truth per concern (tokens → SD; behavior → runtime;
  look → registry CSS; distribution → manifest); gates enforce the graph (layer
  imports, manifest↔files, tokens↔artifacts, doc coverage); playground = continuous
  integration surface for the whole chain.
- **Community**: copy-ownership means user apps never break on upgrade; registry.json
  export + namespace seam enables third-party registries (shadcn 3.0 model);
  Zag-shaped contracts mean community components interop with ours; DTCG tokens mean
  design-tool sync is an exporter, not a rewrite.
- **Across the framework**: the starter app is generated from the same registry the
  playground uses — infra-to-UI coherence is structural, not aspirational.
