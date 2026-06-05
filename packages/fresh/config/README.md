# `@netscript/fresh/vite`

Vite-only integration surface for NetScript Fresh apps.

## Import

- `import { createNetScriptVitePlugin } from '@netscript/fresh/vite';`

## Use from `plugins: []`

```ts
export default defineConfig({
  plugins: [
    fresh(),
    tailwindcss(),
    createNetScriptVitePlugin({
      appRoot,
      workspaceRoot,
      aliasDirectories: ['assets', 'components', 'islands', 'lib', 'routes'],
      watchPaths: [resolve(workspaceRoot, 'packages')],
      routeManifest: {},
    }),
  ],
});
```

## What the plugin does

- publishes `@app/*` aliases through Vite `resolve.alias`
- resolves alias imports through `resolveId()` for plugin/tooling paths
- extends `server.fs.allow` for workspace packages
- bridges selected process env values into `import.meta.env.*`
- registers extra watch paths during dev
- can generate app-local `.generated/manifest.ts` and `.generated/routes.ts` outputs from Fresh file routes

## Route manifest generation

Enable `routeManifest: {}` to have the plugin keep these generated files in sync with your Fresh
file routes:

- `@app/.generated/manifest.ts` for pure filesystem-derived route patterns
- `@app/.generated/routes.ts` for generated route references and contract bindings

### What gets generated

- `manifest.ts` exports `routePatterns` for all discovered route patterns
- `routes.ts` exports `routes` for every discovered route; routes with sibling `*.route.ts[x]` sidecars are contract-bound via `bindRoutePattern(...)`
- generated route bindings import `routePatterns` from `manifest.ts`

This keeps Fresh file routing as the runtime source of truth while still enabling centralized,
typed cross-page navigation contracts.

Recommended consumer pattern:

- generate `@app/.generated/manifest.ts` and `@app/.generated/routes.ts`
- re-export them through a stable app-local module such as `@app/router.ts`
- have routes/components import `@app/router.ts`, not the generated files directly

### Route sidecars

Use sibling route-contract sidecars to opt specific routes into typed manifest entries:

```ts
import { defineRouteContract, enumPathParamSchema, paginationSearchSchema } from '@netscript/fresh';

const pathSchema = enumPathParamSchema('section', ['overview', 'navigation', 'mutation']);
const searchSchema = paginationSearchSchema({ defaultLimit: 3, defaultSort: 'freshness', defaultOrder: 'desc' });

export default defineRouteContract({ pathSchema, searchSchema });
```

Contract-bound generated routes come only from sibling `*.route.ts` / `*.route.tsx` sidecars.

Page modules should bind themselves with `definePage().withRoute(routes....$route)`, but the
generator no longer reads route contracts from the page module itself.

The generated files then expose both surfaces:

- `routePatterns.dashboard.framework.wi09.$section.$route`
- `routes.dashboard.framework.wi09.$section.$route`

`routes...$route` carries:

- `routePattern`
- `pathSchema`
- `searchSchema`
- `nav.makeHref()`
- `Link`
- `getLinkProps(...)`

### Lifecycle

When `routeManifest.enabled !== false`, the plugin performs route-manifest work in three places:

1. **plugin init** — initial sync when the Vite config instantiates the plugin
2. **buildStart** — sync before Vite build work begins
3. **dev watcher** — watches the configured `routes/` tree and regenerates on relevant `*.ts` / `*.tsx` / `*.route.ts[x]` changes

If either generated file changes during dev, the plugin triggers a full reload so imports of
`@app/router.ts` (and the generated files it re-exports) stay aligned with the route tree.

### Does it require a manual run?

No, not during normal Vite usage.

- starting the app through Vite dev regenerates it automatically
- Vite build regenerates it automatically
- changing route files while the dev server is running regenerates it automatically

If Vite is **not** running, nothing watches the route tree. In that case the next Vite startup or
build will refresh the manifest.

### Tracing and console output

Route-manifest logging is **silent by default**. You can opt in with:

```ts
createNetScriptVitePlugin({
  routeManifest: { logLevel: 'changes' },
});
```

Supported values:

- `silent` — no route-manifest logs
- `changes` — log only when the manifest file changes
- `verbose` — log initial/build/watch checks even when no file content changed

Example console line:

```txt
[@netscript/fresh/vite] route manifest updated during watch: .../.generated/manifest.ts, .../.generated/routes.ts (30 routes, 1 contract-bound)
```

### How discovery works

- the plugin scans the configured `routesDir` (default: `<appRoot>/routes`)
- route filenames are converted into Fresh-style route patterns
- route groups like `(dashboard)` are skipped in the URL pattern but preserved in filesystem layout
- `index` collapses to the parent segment
- `_app` and `_layout` are ignored as route leaves
- every discovered route is emitted into `routes`
- routes are contract-bound only when a sibling `*.route.ts[x]` sidecar exists

### Configuration surface

`routeManifest` supports:

- `enabled?: boolean`
- `routesDir?: string`
- `outputPath?: string` (controls `.generated/routes.ts`; `manifest.ts` is written beside it)
- `logLevel?: 'silent' | 'changes' | 'verbose'`

### Current intended usage pattern

For simple string access:

- use `routePatterns`

For typed cross-page navigation and route contracts:

- use `routes`, preferably via an app-local `@app/router.ts` re-export

For example, a route can now build from the generated typed contract instead of a hand-maintained
route-pattern constant plus a separate local `createNav()` split.

## Fixed-port dev note

If you want stable Vite ports across Aspire restarts, set app-local env values and read them with
Vite `loadEnv()` in the app config:

- `NETSCRIPT_VITE_PORT`
- `NETSCRIPT_VITE_HOST`

`apps/frontend/.env.example` and `apps/playground/.env.example` show the expected shape.

## Related files

- plugin: `packages/fresh/config/vite.ts`
- tests: `packages/fresh/config/vite.test.ts`
- playground consumer: `apps/playground/vite.config.ts`
- frontend consumer: `apps/frontend/vite.config.ts`