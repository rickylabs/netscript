# repo:fresh-host — `packages/fresh` as the host any DevTools surface must compose with

Run: `plan-devtools-contribution--seed` (Stage B, planning-only, read-only on source).
Worktree: `/home/codex/repos/ns-rfc-devtools-contribution`, branch `plan/devtools-contribution`
(`rtk git log -1` → `d5852188b41c3bd2c7c2a52da61dcc3dc9aa43e1`; task baseline `main` @ `2256a67bf`).
All file citations below are from this worktree.

## Summary

`packages/fresh` (`@netscript/fresh`, v0.0.5) is **not** a Fresh application. It is a library of
15 subpath exports layered `runtime/` + `application/` + `diagnostics/` + `testing/`
(`packages/fresh/deno.json:6-22`) that a *generated app* consumes. The actual host is the scaffolded
app the CLI emits: `main.ts` + `vite.config.ts` + `routes/` in `packages/cli/src/kernel/assets/app/`.

Composition today is **file-system-convention first with two programmatic seams**. Server-side,
`defineFreshApp()` wraps Fresh 2's `App` and exposes adapter seams — `app`, `createApp`,
`middleware[]`, `preConfigure`, `configure`, and `fsRoutes` (function | `false` | mount pattern)
(`packages/fresh/src/runtime/server/define-fresh-app.ts:33-137`). Build-side,
`createNetScriptVitePlugin()` is a single package-owned Vite plugin (`enforce: 'pre'`) that owns
aliases, `import.meta.env` define entries, SSR/rollup externalization, route-manifest generation and
the dev-server watcher (`packages/fresh/src/application/vite/vite.ts:281-438`).

Routes are discovered by **filesystem walk of `<appRoot>/routes`**, not by registration: a route
module is any `.ts`/`.tsx` that is not a `.route.ts(x)` sidecar and not in a helper dir
(`_*` or `(_*)`) (`packages/fresh/src/application/route/manifest.ts:44-86`). The generator writes
`.generated/manifest.ts` and `.generated/routes.ts`, which the app re-exports through a hand-written
`router.ts` (`packages/cli/src/kernel/assets/app/router.ts.template:1-24`).

**There is no plugin→UI channel.** Plugin manifests carry `capabilities.hasRoutes`
(`packages/plugin/src/protocol/manifest.ts:21,176`) but that flag means *service HTTP endpoints*
("Whether the plugin scaffolder adds service routes or HTTP endpoints",
`packages/plugin/src/protocol/manifest.ts:20`) and is consumed only as install/scaffold metadata.
The generated plugin registries are runtime registries (jobs, handlers) driven by
`scaffold.runtime.json` (`plugins/workers/scaffold.runtime.json:1-56`) — none produce pages, islands,
or Fresh routes. A plugin's client code reaches the app only via **hand-written Vite aliases**
(`@plugins/workers/streams` etc., `packages/cli/src/kernel/assets/app/vite.config.ts.template:20-32`)
plus a manual import in app code. UI itself is distributed by **copy**, via the `ui` registry:
`@ui/` → `components/ui/`, `@islands/` → `islands/ui/`
(`packages/cli/src/kernel/application/ui/registry.ts:68-69`).

A precedent surface already exists: the scaffold ships a `/design` route group
(`packages/cli/src/kernel/assets/app/routes/(design)/design/` — `_layout`, `index`, `tokens`,
`components`, `composition`) with its own sidebar shell. It is an ordinary in-app route tree with no
dev-only gating. Grepping `packages/`, `plugins/`, `docs/site` for `devtools|_devtools|DevTools`
returns nothing — no DevTools-shaped path, host, or mode flag exists today.

## Findings

### F1 — `@netscript/fresh` public surface is 15 subpath exports, no app/host export
`packages/fresh/deno.json:6-22` lists `.`, `./server`, `./desktop`, `./builders`, `./route`,
`./defer`, `./form`, `./error`, `./streams`, `./ai`, `./ai/sandbox`, `./query`, `./interactive`,
`./vite`, `./testing`. Confirmed by `deno doc packages/fresh/mod.ts` (ran; module doc enumerates the
same subpaths and states "For visual UI components and design system primitives, see
`@netscript/fresh-ui`. Visual components are copied into your app (via `ui:add`), not imported from
the package."). `observed`.

Note: `deno doc packages/fresh/src/application/vite/vite.ts` (ran) emitted a wall of
`@types/node` type-resolution warnings and no usable output in this environment; the Vite surface
below was read from source instead. `observed`.

### F2 — There IS a programmatic server-side compose API: `defineFreshApp`
`packages/fresh/src/runtime/server/define-fresh-app.ts:89-118`. Options
(`:33-80`): `name`, `app` (reuse an existing `App<State>`), `freshConfig`, `createApp` factory,
`staticFiles` (middleware | `false`), `middleware[]`, `preConfigure(app)`, `configure(app)`,
`fsRoutes` (`(app, pattern?) => void` | `false` | string mount pattern), `telemetry`,
`queryCacheInvalidation`. Order is fixed: `preConfigure` → static files → telemetry middleware →
user middleware → query-cache-invalidation route → `configure` → fs routes (`:93-117`).
`registerFsRoutes` calls `app.fsRoutes(pattern)` or `app.fsRoutes()` (`:120-137`). `observed`.

Relevance: a DevTools surface could be mounted server-side today with zero framework change via
`configure(app)` (register routes before fs routes) or by passing a custom `fsRoutes` adapter — but
neither is a *contributed* seam; the app author must hand-write the call in `main.ts`.

### F3 — The generated app's `main.ts` uses the defaults only; no mount points
`packages/cli/src/kernel/assets/app/main.ts.template:11-14`:
`export const app = defineFreshApp<State>({ name: '{{appName}}' });`. No middleware, no
`configure`, no second route tree. `observed`.

### F4 — Route composition is filesystem-convention, resolved by a synchronous walk
`packages/fresh/src/application/route/manifest.ts:289` defaults `routesDir` to
`resolve(appRoot, 'routes')`; `:407` walks it. Route-module predicate at `:83-86`: extension in
`ROUTE_FILE_EXTENSIONS`, not a `.route.ts(x)` sidecar (`:44-46`), not a helper path (`:74-81`).
Helper dirs are `_*` or `(_*)` (`:53-55`); helper file stems start with `_` except `_app`/`_layout`
(`:57-72`). Dynamic segments `[x]`, `[...x]`, `[[...x]]` (`:48-51`). `observed`.

Relevance: a `routes/(_devtools)/…` tree would be *invisible* to the manifest generator (helper
group), while `routes/_devtools/…` — a `_`-prefixed **directory** — is also treated as a helper dir.
A visible DevTools tree must therefore be a normal path such as `routes/(devtools)/devtools/…`,
exactly mirroring the existing `routes/(design)/design/…` shape. `inference` from
`manifest.ts:53-55` + the `(design)/design` layout on disk.

### F5 — Generated manifest + hand-written `router.ts` is the route contract seam
`packages/cli/src/kernel/assets/app/router.ts.template:1-24` imports `routePatterns` from
`./.generated/manifest.ts` and `routes` from `./.generated/routes.ts`, then *spreads and extends*
them with `createRouteReference(...)` entries, exporting `routes`, `appRoutes`, `appRouter`, and
`type AppRouter`. `observed`. The file is app-owned and user-editable; generated output is confined
to `.generated/`.

### F6 — Vite plugin chain is assembled in the app's `vite.config.ts`, owned by the app author
`packages/cli/src/kernel/assets/app/vite.config.ts.template:41-56`: `plugins: [fresh(),
tailwindCSS(), createNetScriptVitePlugin({ appRoot, workspaceRoot, aliasEntries, watchPaths,
routeManifest: {} })]`. `fresh()` comes from `@fresh/plugin-vite` (`:1`) — islands discovery,
client entry, HMR are **Fresh's plugin, not NetScript's**. `observed`.

There is **no extension point for a plugin to add a Vite plugin**: nothing in
`plugins/*/scaffold.plugin.json` or the registry generators touches `vite.config.ts`, and
`rtk grep -rl createNetScriptVitePlugin` over the repo hits only the template, the package, its
tests/README, and docs — no plugin. `observed` (grep result set listed in Sources).

### F7 — `createNetScriptVitePlugin` hook-by-hook (what a second surface would collide with)
`packages/fresh/src/application/vite/vite.ts:307-437`:
- `name: 'vite-plugin-netscript'`, `enforce: 'pre'` (`:308-309`).
- `config()` (`:310-379`): emits `resolve.alias` from `aliasEntries`, `resolve.dedupe: ['preact',
  '@preact/signals']`, `server.fs.allow`, `define` for `import.meta.env.*`, plus `ssr.external` and
  `build.rollupOptions.external` for a hardcoded `SERVER_ONLY_PREFIXES` list (`:348-356`).
- `resolveId()` (`:380-393`): alias resolution first, then canonicalizes `preact` and
  `@preact/signals` specifiers and normalizes the resolved id path (Windows).
- `buildStart()` (`:394-402`): regenerates the route manifest and rewrites page-module route
  bindings.
- `configureServer()` (`:403-434`): adds `options.watchPaths` and `routeManifest.routesDir` to
  `server.watcher`, debounces 25 ms (`:28`), regenerates, and on change calls
  `server.ws.send({ type: 'full-reload' })` (`:429`).
`observed`.

Collision surface for a second mounted surface (`inference` from the above): a single
`routesDir` per plugin instance; a single `aliasPrefix` default `@app` (`:287`); preact/signals
`dedupe` is global; and the watcher's response to any route change is a **full page reload**, not an
HMR patch — a DevTools panel holding client state would be reset by any route edit.

### F8 — Route-manifest generation MUTATES app page modules by default
`vite.ts:293` — `pageModuleRouteBinding = options.pageModuleRouteBinding !== false` — and
`:299-305`/`:394-402`/`:422-431` call `writeNetScriptPageModuleBindingsSync` at init, build, and
watch, rewriting Form A/B/C page modules to own the route-binding call (documented at `:109-116`).
`observed`. Any DevTools route tree placed under `routes/` inherits this write-back behavior.

### F9 — Plugin `hasRoutes` is service-endpoint metadata, not UI contribution
`packages/plugin/src/protocol/manifest.ts:20-21` (doc comment + field) and `:176` (zod
`hasRoutes: z.boolean()`). Producers/consumers found by grep are install/scaffold/doctor paths and
tests (`packages/cli/src/public/features/plugins/new/new-plugin-use-case.ts:309` sets
`hasRoutes: descriptor.kind === 'feature'`). No consumer maps it to a Fresh route or page.
`observed`.

### F10 — Generated plugin registries are runtime registries, never UI
`packages/cli/src/public/features/generate/plugins/generate-plugin-registries-command.ts:47-68`
defines `generate plugins` ("Generate installed plugin runtime registries (authoritative)"), driven
per plugin by `scaffold.runtime.json`. Example: `plugins/workers/scaffold.runtime.json:24-55`
declares one registry of kind `workers-job` writing
`.netscript/generated/plugin-workers/job-registry.ts`, typed `JobHandler<any>` from
`@netscript/plugin-workers-core/runtime`. `observed`. No `kind` in the repo emits routes, pages, or
islands.

### F11 — A plugin's client code reaches the host through hand-written Vite aliases
`packages/cli/src/kernel/assets/app/vite.config.ts.template:20-32` hardcodes
`@plugins/workers/streams`, `@plugins/sagas/streams`, `@plugins/triggers/streams` → 
`plugins/<n>/streams/mod.ts`. Those modules exist (`plugins/workers/streams/` contains
`factory.ts`, `mod.ts`, `producer.ts`, `schema.ts`, `server.ts`). The alias list is static template
text — adding a plugin does not add an alias. `observed`.

### F12 — UI is distributed by copy, not import (`ui:add` registry)
`packages/cli/src/kernel/application/ui/registry.ts:68-69` maps registry targets
`'@ui/' → 'components/ui/'` and `'@islands/' → 'islands/ui/'`; `resolveTarget` (`:277`) writes into
the project root (`:179`, `:270`). `packages/fresh-ui/deno.json:7-14` exports `.`,
`./ai/render-ui`, `./desktop`, `./interactive`, `./primitives`, `./registry`, and publishes
`registry/**/*.json` (`:26`). The `@netscript/fresh` module doc (via `deno doc`) states visual
components are copied via `ui:add`, not imported. `observed`.

### F13 — `/design` is the existing in-app dev-facing route tree; no dev-only gate
Files: `packages/cli/src/kernel/assets/app/routes/(design)/design/{_layout,index,tokens,components,
composition}.tsx.template`. `_layout.tsx.template:1-30` imports `SidebarShell`, `Breadcrumb`,
`Badge` from `@app/components/ui/mod.ts`, islands `@app/islands/ui/{SidebarToggle,ThemeToggle}.tsx`,
and builds `DESIGN_NAVIGATION` from `appRoutes.design*`. Corresponding route references are
hand-registered in `router.ts.template:33-46`. `observed`. Nothing in these templates checks
`MODE`/`NODE_ENV`; the only `MODE` read in the scaffold is a log line
(`main.ts.template:17`). `observed`.

### F14 — No DevTools-shaped surface, mode flag, or second host exists
`rtk grep -rn "devtools|_devtools|DevTools"` across `packages`, `plugins`, `docs/site` (ts/tsx/json/
template) → zero matches. `observed`. There is no `apps/` directory in this repo (`ls apps` →
"No such file or directory"), although `main.ts.template:6-8` references `apps/playground/main.ts`
"in the reference monorepo". `observed`.

### F15 — Dev server: one Vite process per app, native config loader
`packages/cli/src/kernel/adapters/templates/app/generate-app-deno-json.ts:112-119` — tasks
`dev: '… deno run -A npm:vite --configLoader native'`, `build: 'deno run -A npm:vite build'`,
`serve: 'vite preview'`, `start: 'deno serve -A _fresh/server.js'`. Port/host come from
`NETSCRIPT_VITE_PORT`/`NETSCRIPT_VITE_HOST` or `PORT`, default 5173
(`vite.config.ts.template:36-39`). `observed`.

Relevance (`inference`): a DevTools app shipped as a *separate* Vite/Fresh host needs its own port,
its own `deno task`, and its own Aspire resource wiring; a DevTools app mounted *inside* the app
host shares the 5173 process, the `fresh()` island graph, and the full-reload watcher of F7.

### F16 — Preact/signals singleton discipline is a hard constraint on any second surface
`vite.ts:322` sets `dedupe: ['preact', '@preact/signals']` with an inline comment that the
`resolveId` hook additionally canonicalizes slash variants and "converges Fresh's versioned Signals
import on the app-owned import-map entry" (`:318-323`, `:380-393`).
`packages/fresh/deno.json:36,41` pins `preact ^10.29.2` and `@preact/signals 2.9.2` (exact).
`observed`. A DevTools surface loaded from a different resolution root would risk a second Preact
copy and dead signals. `inference` from the dedupe comment.

## Contracts

| Name | Shape | Evidence |
| --- | --- | --- |
| `defineFreshApp` | `<State>(options?: DefineFreshAppOptions<State>) => App<State>` | `packages/fresh/src/runtime/server/define-fresh-app.ts:89` |
| `DefineFreshAppOptions` | `{ name?, app?, freshConfig?, createApp?, staticFiles?: Middleware\|false, middleware?: Middleware[], preConfigure?(app), configure?(app), fsRoutes?: ((app, pattern?)=>void)\|false\|string, telemetry?, queryCacheInvalidation? }` | `define-fresh-app.ts:33-80` |
| `createNetScriptVitePlugin` | `(options?: NetScriptVitePluginOptions) => NetScriptVitePlugin` | `vite.ts:282` |
| `NetScriptVitePluginOptions` | `{ appRoot?, workspaceRoot?, aliasEntries?, aliasDirectories?, aliasPrefix?, watchPaths?, envMappings?, env?, allowFsPaths?, includeWorkspaceRootInFsAllow?, routeManifest?, pageModuleRouteBinding? }` | `vite.ts:86-117` |
| `NetScriptVitePlugin` | `{ name, enforce?, config?, resolveId?, buildStart?, configureServer? }` | `vite.ts:147-160` |
| `NetScriptViteAlias` | `{ find: string; replacement: string }` | `vite.ts:68-73` |
| route-module convention | route = `.ts\|.tsx` under `routes/`, excluding `*.route.ts(x)` sidecars and any `_*` / `(_*)` dir or `_`-stem file (except `_app`/`_layout`) | `packages/fresh/src/application/route/manifest.ts:44-86` |
| generated route outputs | `<app>/.generated/manifest.ts` (`routePatterns`) + `<app>/.generated/routes.ts` (`routes`) | `packages/cli/src/kernel/assets/app/router.ts.template:2-3` |
| app router surface | `export { routePatterns }; export const routes/appRoutes/appRouter; export type AppRouter` | `router.ts.template:11-58` |
| `createRouteReference` | `(pattern, { id, kind: 'page' \| … }) => RouteReference` (usage form) | `router.ts.template:17-21` |
| plugin manifest capabilities | `{ hasDatabaseMigrations: boolean; hasRoutes: boolean; hasBackgroundWorkers: boolean }` — `hasRoutes` = service endpoints | `packages/plugin/src/protocol/manifest.ts:18-24,176`; `plugins/workers/scaffold.plugin.json` capabilities block |
| runtime registry descriptor | `scaffold.runtime.json` → `runtimeRegistries[]: { kind, dir, registryPath, fileSuffixes, registryKey, varPrefix, typeImport{name,from}, mapValueType, pluginDirs[] }` | `plugins/workers/scaffold.runtime.json:24-55` |
| ui registry target prefixes | `'@ui/' → 'components/ui/'`, `'@islands/' → 'islands/ui/'` | `packages/cli/src/kernel/application/ui/registry.ts:68-69` |
| app dev commands | `dev: vite --configLoader native`; `build: vite build`; `start: deno serve -A _fresh/server.js` | `packages/cli/src/kernel/adapters/templates/app/generate-app-deno-json.ts:112-119` |

## Drift candidates

| Expected | Actual | Evidence | Severity |
| --- | --- | --- | --- |
| Plugins contribute UI through a registry/zone mechanism | No UI-contribution channel exists at all; only hand-written Vite aliases + manual imports, and copy-mode `ui:add` | `vite.config.ts.template:20-32`; `packages/cli/src/kernel/application/ui/registry.ts:68-69`; no `runtimeRegistries` kind emits routes (`plugins/workers/scaffold.runtime.json:24-55`) | architectural |
| `capabilities.hasRoutes` signals a plugin has front-end routes | It documents *service* routes/HTTP endpoints and is only install/scaffold metadata | `packages/plugin/src/protocol/manifest.ts:20-21`; `new-plugin-use-case.ts:309` | significant |
| A plugin can extend the Vite plugin chain | The chain is static template text in the app's `vite.config.ts`; no plugin in the repo references `createNetScriptVitePlugin` | `vite.config.ts.template:41-56`; repo-wide grep for `createNetScriptVitePlugin` hits only package + template + docs | architectural |
| `@netscript/fresh` provides the app host | It provides library seams; the host is CLI-scaffolded app files the user owns | `packages/fresh/deno.json:6-22` vs `packages/cli/src/kernel/assets/app/` | minor |
| Route-manifest generation is read-only | It rewrites app page modules (`pageModuleRouteBinding` defaults on) at init/build/watch | `vite.ts:293,299-305,394-402,422-431` | significant |
| `main.ts.template` references `apps/playground/main.ts` as a live reference | No `apps/` directory exists in this repo | `main.ts.template:6-8`; `ls apps` → not found | minor |

## Open questions

1. Does `@fresh/plugin-vite`'s `fresh()` support more than one island root / a second route root in
   one Vite process? Not verified here — would be answered by reading `jsr:@fresh/plugin-vite@2.x`
   source or `deno doc jsr:@fresh/plugin-vite`.
2. Can `defineFreshApp({ fsRoutes })` mount two independent fs-route trees, or does Fresh's
   `App.fsRoutes(pattern)` assume a single `routes/` dir? Needs `deno doc jsr:@fresh/core@2/App` +
   a probe.
3. Does the route-manifest generator support multiple `routesDir` instances (two plugin instances in
   one config), or would two instances fight over `.generated/`? `resolveNetScriptRouteManifestOptions`
   was not read in full (`manifest.ts:280-300`).
4. Is `routes/(devtools)/devtools/…` actually emitted by the manifest walker as expected, and does
   the `(group)` segment get stripped from the URL pattern? Inferred from `(design)/design`; not
   executed.
5. How are `/design` routes gated in production builds today — are they shipped to end users? No
   gate found; needs an owner answer or a build-output probe.
6. What does `writeNetScriptPageModuleBindingsSync` do to a page module it does not recognize
   (Form D)? Warnings are printed (`vite.ts:258-260`) but the failure mode is unverified.
7. Aspire wiring for a second HTTP host (port allocation, dashboard resource) — out of scope here;
   belongs to the `aspire` discovery topic.

## Sources

- `packages/fresh/deno.json` (exports, imports, compilerOptions, tasks)
- `packages/fresh/src/application/vite/vite.ts` (read in full, 438 lines)
- `packages/fresh/src/application/route/manifest.ts:30-140, 280-410`
- `packages/fresh/src/runtime/server/define-fresh-app.ts` (read in full, 137 lines)
- `packages/fresh/src/runtime/interactive/mod.ts:1-11`
- `packages/cli/src/kernel/assets/app/{main,router,client,vite.config}.ts.template`
- `packages/cli/src/kernel/assets/app/routes/**` (directory listing; `(design)/design/_layout.tsx.template:1-30`)
- `packages/cli/src/kernel/adapters/templates/app/generate-app-deno-json.ts:100-140`
- `packages/cli/src/kernel/application/ui/registry.ts:68-69, 138, 179, 270-277`
- `packages/cli/src/public/features/generate/plugins/generate-plugin-registries-command.ts`
- `packages/plugin/src/protocol/manifest.ts:18-24, 176`
- `plugins/workers/scaffold.plugin.json`, `plugins/workers/scaffold.runtime.json`
- `packages/fresh-ui/deno.json:7-27`
- `docs/site/web-layer/vite.md:1-80`
- Commands actually run: `deno doc packages/fresh/mod.ts` (succeeded);
  `deno doc packages/fresh/src/application/vite/vite.ts` (ran, output unusable — `@types/node`
  resolution warnings); `rtk grep -rl createNetScriptVitePlugin .`;
  `rtk grep -rn "hasRoutes" --include=*.ts packages plugins`;
  `rtk grep -rn "devtools|_devtools|DevTools" packages plugins docs/site` (0 matches);
  `ls apps` (not found).
