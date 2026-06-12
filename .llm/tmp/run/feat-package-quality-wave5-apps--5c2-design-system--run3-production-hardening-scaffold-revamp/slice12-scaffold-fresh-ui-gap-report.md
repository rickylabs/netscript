# Slice 12 - Scaffold vs fresh-ui Registry Gap Report

Date: 2026-06-12
Scope: locked Slice 12, audit only. This report does not rescope Slices 13-16.

## Sources Read

- `packages/cli/docs/commands.md`
- `packages/cli/docs/maintainer-cli.md`
- `packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts`
- `packages/cli/src/kernel/adapters/templates/scaffold-template-assets.ts`
- `packages/cli/src/kernel/adapters/templates/app/generate-app-deno-json.ts`
- `packages/cli/src/public/features/ui/registry.ts`
- `packages/fresh-ui/registry.manifest.ts`
- `packages/fresh-ui/docs/l0-conventions.md`
- `packages/fresh-ui/docs/theme-authoring.md`
- `packages/fresh-ui/README.md`
- `apps/playground/routes/(design)/design/*`
- `apps/playground/lib/design/*`
- `apps/playground/islands/design/*`

## Current CLI Scaffold Surface

`netscript-dev init` writes a Fresh app through `writeNormalizedAppFiles()`. The frontend portion is
template-owned today:

- 40 app templates under `packages/cli/src/kernel/assets/app`.
- 10 visual system templates overlap with fresh-ui registry output:
  - `assets/styles.css.template`
  - `assets/tokens.css.template`
  - `assets/layouts.css.template`
  - `assets/components/actions.css.template`
  - `assets/components/forms.css.template`
  - `assets/components/surfaces.css.template`
  - `assets/components/feedback.css.template`
  - `components/ui/button.tsx.template`
  - `components/ui/card.tsx.template`
  - `components/ui/mod.ts.template`
- The writer creates app UI directories and writes bespoke `Button`, `Card`, and `ThemeToggle`
  files before writing routes.
- `generateAppDenoJson()` already includes `@netscript/fresh-ui`, but the scaffold uses it mainly
  for imported helpers such as `cn()`, not as the source of copied registry UI.
- `generateAppStyles()` mirrors the old scaffold template entrypoint; it does not go through the
  registry installer's styles aggregator.

## Current ui:init Surface

The public `ui:init` and `ui:add` commands already have the correct copy-system pieces:

- `installUiRegistryItems()` loads `registry.manifest.ts`.
- It resolves registry dependencies and collections.
- It copies files, rewrites copied TypeScript imports, writes `assets/styles.css`, and merges
  `deno.json` imports.
- It writes copied registry paths to:
  - `components/ui/`
  - `islands/ui/`
  - `assets/ui/`
  - `assets/`
  - `lib/`

The current `DEFAULT_UI_INIT_ITEMS` installs 18 resolved items:

`button`, `card`, `badge`, `form-field`, `input`, `select`, `alert`, `spinner`, `skeleton`,
`page-header`, `sidebar-shell`, `theme-toggle`, `toast`, `data-table`, `empty-state`,
`pagination`, `filter-form`, `stats-grid`.

The registry `foundation` collection resolves to 35 items and 55 files. Items present in
`foundation` but missing from `DEFAULT_UI_INIT_ITEMS` are:

`theme-seed`, `sheet-styles`, `icon-button`, `textarea`, `checkbox`, `switch`, `label`, `panel`,
`separator`, `inline-notice`, `progress`, `breadcrumb`, `detail-layout`, `responsive-table`,
`section-divider`, `sidebar-toggle`, `toast-support`.

Additional audit note: `floating-styles` is a registry item and is used by the playground design
components route, but it is not in `foundation` or `DEFAULT_UI_INIT_ITEMS`. The scaffold design
routes need it installed explicitly unless the collection is intentionally expanded in Slice 13.

## Registry Coverage Available to the Scaffold

The fresh-ui registry now exposes 44 items:

- 18 L2 components
- 11 L3 blocks
- 3 islands
- 7 style sheets
- 2 libs
- 2 support modules
- 1 theme seed

Useful collections:

- `foundation`: broad app baseline, currently 35 items.
- `dashboard-blocks`: dashboard composition blocks, 17 files including `responsive-table`.
- `forms-core`, `surface-core`, and `feedback-core`: smaller subsets.

For the scaffold revamp, the registry can cover the app's visual vocabulary directly:

- Navigation and app shell: `sidebar-shell`, `sidebar-toggle`, `breadcrumb`, `theme-toggle`.
- Page structure: `page-header`, `section-divider`, `detail-layout`, `stats-grid`.
- CRUD/list examples: `filter-form`, `data-table`, `responsive-table`, `pagination`, `empty-state`.
- Form examples: `form-field`, `input`, `textarea`, `select`, `checkbox`, `switch`, `label`.
- Feedback: `alert`, `inline-notice`, `toast`, `spinner`, `progress`, `skeleton`, `badge`.
- Surfaces and actions: `button`, `icon-button`, `card`, `panel`, `separator`.

## Gap Matrix

| Area | Current scaffold | fresh-ui target | Locked follow-up |
| --- | --- | --- | --- |
| UI copy source | Scaffold emits bespoke `Button`, `Card`, `ThemeToggle`, tokens, layout CSS, and component CSS. | `ui:init` / `ui:add` copy registry files and own dependency/style aggregation. | Slice 13: call the registry installer from init after app `deno.json` exists; stop writing duplicate UI assets. |
| Init default item set | `DEFAULT_UI_INIT_ITEMS` is a partial 18-item list. | Generated app needs the full registry vocabulary used by design routes and scaffold pages. | Slice 13: make scaffold install `foundation` plus any route-required extra items, or update defaults to the same effective set. |
| Style aggregator | `assets/styles.css` is generated from the scaffold template and imports bespoke CSS bundles. | Registry installer writes NS One `styles.css` plus per-item imports and an app-specific tail marker. | Slice 13: use registry aggregator output as the app's canonical style entrypoint. |
| Import paths | Scaffold imports `@app/islands/ThemeToggle.tsx`; registry copies to `@app/islands/ui/ThemeToggle.tsx`. | Registry paths must remain copy-fidelity paths. | Slices 13-15: update app templates/routes to import `@app/islands/ui/*` and `@app/components/ui/mod.ts`. |
| Design routes | Playground has `/design/tokens`, `/design/components`, `/design/composition`; scaffold has none. | Scaffolded app ships the same routes as first-run inspection surfaces. | Slice 14: port design routes, `assets/design.css`, `lib/design/*`, and `islands/design/*`. |
| Design route CSS | Playground route-specific classes live in `assets/design.css`. | Scaffold must import design CSS without violating registry copy-fidelity. | Slice 14: make `assets/design.css` scaffold-owned L4 CSS and import it from app `client.ts` or `assets/styles.css` after registry output. |
| Route manifest seed | Seed manifest only knows `/`, `/health`, `/examples`, and `/examples/telemetry`. | Design routes can work as route files, but typed route references are absent. | Slice 14: add typed route references only if scaffold templates need `appRoutes.design`; otherwise use literal design hrefs like the playground layout. |
| App routes | Home/examples/service templates use bespoke composition and partial old `ns-*` utility classes. | Pages should be rebuilt on registry components only with no off-vocabulary styling. | Slice 15: rebuild home/dashboard/CRUD examples with copied registry components and semantic Tailwind bridge utilities. |
| Browser proof | Existing scaffold E2E does not browser-gate design routes or theme flip. | Fresh app evidence must cover `/design/*` and one app route at desktop, 390x844, and reduced motion. | Slice 16: generate a fresh app, run Vite, validate with Playwright, and save artifacts. |

## Implementation Constraints for Later Slices

- Do not create a second registry-copy implementation in the scaffold writer. Reuse
  `installUiRegistryItems()` or a small application wrapper around it.
- App `deno.json` must be written before registry install so dependency merging has a file to patch.
- Registry install may overwrite `assets/styles.css`; scaffold-owned custom CSS should be appended
  after registry install or imported as a separate app/design CSS file.
- Remove duplicate scaffold UI templates from `APP_TEMPLATE_URLS` only after all imports have been
  moved to copied registry paths.
- Keep registry copies content-identical. Scaffold pages may compose them, but must not mutate copied
  files after installation.
- Route tests under `packages/cli/src/kernel/templates/app/` need updates with exact expected
  imports and scaffold route behavior.
- Full runtime smoke remains deferred to Slice 16 / final readiness; Slice 12 is an audit artifact.

## Locked Follow-ups

1. Slice 13 owns registry installation during `netscript init`, NS One seed adoption, style
   aggregation, deno import merging, duplicate visual template removal, and tests for those facts.
2. Slice 14 owns adding design routes and their route-local support files from `apps/playground`.
3. Slice 15 owns rebuilding scaffolded app pages on registry components only.
4. Slice 16 owns generated-app browser proof and evidence capture.

Out-of-scope for Slice 12: changing registry collections, changing scaffold templates, adding new
routes, or running the expensive full scaffold runtime E2E.
