# Host Runtime — mounting, SSR/hydration, data, nav, theming, isolation (draft)

> **Draft — design document only.** All mount paths wrap verified upstream primitives
> (research.md §3.1); the new code is glue in `@netscript/fresh` (new `./plugins` subpath).

## 1. The host entry — one option on `defineFreshApp`

```ts
// app/main.ts (scaffold template, after)
import { defineFreshApp } from '@netscript/fresh/server';
import { frontendRegistry } from './.netscript/generated/frontend.registry.ts';

export const app = defineFreshApp<State>({
  name: '{{appName}}',
  frontend: frontendRegistry,   // ← the entire host-side integration
});
```

`defineFreshApp` (`packages/fresh/src/runtime/server/define-fresh-app.ts`) already exposes
`middleware[]` / `preConfigure` / `configure` seams; the `frontend` option is sugar that runs the
mount sequence below inside `configure`. Apps that need control call the pieces directly from
`@netscript/fresh/plugins`:

```ts
import { mountPluginFrontends, pluginApiProxy, pluginNavSections } from '@netscript/fresh/plugins';
```

## 2. Route mounting — sub-app per plugin

For each plugin with route contributions the glue builds an upstream sub-`App` and mounts it:

```ts
// inside mountPluginFrontends (sketch)
for (const [pluginId, m] of registry.plugins) {
  const sub = new App<State>();
  if (m.layoutModule) sub.layout('*', lazy(m.specifierOf(m.layoutModule)));   // plugin _layout
  for (const r of m.routes ?? []) sub.route(r.path, lazy(m.specifierOf(r.module)));
  sub.use(pluginScopeMiddleware(pluginId));  // sets data-ns-plugin ctx + PluginHostState
  app.mountApp(m.resolvedBase, sub);         // upstream App.mountApp (core src/app.ts:357)
}
```

- **Base policy (locked, owner fork F2 records the alternative):** the plugin declares a
  preferred `base` (default `/<pluginId>`); the **host** may remap per plugin in
  `netscript.config` (`frontend: { basePaths: { crons: '/tools/crons' } }`); collisions are
  generate-time errors. The dev-dashboard host auto-remaps everything under
  `/plugins/<pluginId>/…` — same registry, different policy.
- Plugin routes are lazy (`MaybeLazy<Route>` upstream) — code-splitting for free.
- A plugin `_layout` wraps only that plugin's pages; the app's root layout still applies
  (upstream layout nesting semantics).

## 3. Islands — build-time registration, both build paths

- **Vite (scaffold default):** `vite.config.ts` template passes the generated list —
  `fresh({ islandSpecifiers: [...pluginIslandSpecifiers] })`
  (`@fresh/plugin-vite@1.0.8 src/mod.ts:56-63,211-214`; scaffold template currently calls bare
  `fresh()` — `packages/cli/src/kernel/assets/app/vite.config.ts.template:44`).
- **Non-vite builder:** `withPluginIslands(builder, registry)` →
  `builder.registerIsland(specifier)` (`@fresh/core@2.3.3 src/dev/builder.ts:157`).

Because registration is by specifier, plugin code imports its islands like any component; SSR,
hydration, and props serialization are stock Fresh behavior. **Boundary rule (documented, not
new machinery):** island props must be serializable — the standard Fresh constraint.

## 4. Data access — server direct, client via proxy

- **Server (route handlers, zone components):** typed clients from the plugin's own
  `contracts/v1` against the plugin service URL, resolved from host runtime config / Aspire
  service discovery via `ctx.host.serviceUrl('<service-name>')`. Services are an existing axis
  (`ServiceContribution` — `packages/plugin/src/config/domain/service-contribution.ts`).
- **Client (islands):** same typed clients pointed at a same-origin proxy:
  `pluginApiProxy(registry)` middleware mounted at `/api/plugins/:pluginId/*`
  (upstream `app.use(path, mw)`), forwarding to the plugin service base URL. Precedent: the AI
  chat island already streams through an app-local proxy path
  (`plugins/ai/.../chat-route.stub.ts` → `/api/ai/chat-stream`;
  `packages/fresh/src/runtime/ai/stream-proxy.ts`). The proxy forwards session/auth headers
  set by app middleware; `requires.procedures` is the audit surface for what flows (enforcement
  = dashboard-run scope).
- SSE/streaming passes through (the stream-proxy precedent covers eventIterator contracts).

## 5. Host state — `PluginHostState` (the SSR/hydration contract seam)

```ts
// contracts/v1 (sketch) — what plugin server code may assume about the host
export interface PluginHostState {
  readonly plugin: string;                       // the mounted plugin id
  readonly base: string;                         // resolvedBase, for building intra-plugin hrefs
  readonly serviceUrl: (service: string) => string;
  /** Session claims when the auth plugin is installed; null otherwise. Shape owned by plugin-auth-core. */
  readonly session: SessionClaims | null;
}
```

Populated by `pluginScopeMiddleware` from app state. Plugin pages must not reach past this seam
into app-specific `State` — the seam is what keeps contributions portable across hosts (app,
dashboard). `definePluginPage` types `ctx.host` so the constraint is ergonomic, not policed.

## 6. Zones — SSR injection with provenance

```tsx
// app markup (scaffold templates place these; apps may add/remove freely)
import { PluginZone } from '@netscript/fresh/plugins';
<PluginZone id='app.dashboard.panels' />
```

`PluginZone` renders every `ZoneContribution` targeting that zone (deterministic order), each
wrapped:

```html
<div data-ns-plugin='crons' data-ns-contribution='crons/next-fires'> …component… </div>
```

- SSR-only by default; interactivity comes from islands the zone component imports.
- A crashed zone component renders the quarantine card (fix CLI + provenance), never breaks the
  page — the prior design's render-time rule applied at the component boundary
  (Preact error boundary in `PluginZone`).
- Zone occupancy is inspectable: dev-mode overlay listing zones + occupants is a dashboard-run
  deliverable; the data (registry) already supports it.

## 7. Nav — feeding the existing shell, typed

- `pluginNavSections(registry, { group })` → `readonly SidebarNavSection[]` — directly
  spreadable into `SidebarShell.navigation`
  (`packages/fresh-ui/registry/components/ui/sidebar-shell.tsx:24-36`) and the scaffolded topbar
  (`_layout.tsx.template:33-74`), with `matchPrefix` set from the plugin base.
- Typed hrefs everywhere: `routes.plugins.crons.calendar.href()` via the generated
  `frontend.routes.ts` merged in `router.ts` — no string paths in app code.

## 8. Theming & style isolation

- Plugin CSS is layered (`@layer ns-plugins`) below app CSS — apps always win specificity wars —
  and scoped under `[data-ns-plugin='<id>']` (the wrapper from §6 and the plugin layout from §2).
- Only `--ns-*` semantic vars (`packages/fresh-ui/tokens/semantic.tokens.json`,
  `registry/theme/theme-bridge.css`): plugin UI inherits light/dark and any app theme override
  with zero plugin-side work. `data-theme` switching (scaffold `_app.tsx` precedent) is free.
- Tailwind utilities inside plugin modules: plugin files are NOT in the app's Tailwind content
  scan; v1 rule is **plain CSS + tokens (+ inline `class` on fresh-ui runtime components)** for
  plugin-served UI. (Extending the app's Tailwind `content` globs to plugin packages is a
  possible phase-2 nicety — flagged, not promised.)

## 9. Isolation & failure containment (app surface = T0)

- Installed plugins already run arbitrary server code — the app surface trusts them (research.md
  §6.5). Containment here is about *blast radius of bugs*, not malice: lazy route mounting
  (a broken page module fails on navigation, not boot), zone error boundaries, quarantined
  contract drift, CSS layering.
- The `requires` declaration + provenance wrappers are the audit surface the dashboard's T1/T2
  tiers will later enforce (iframe + RPC bridge — dashboard run, [stable]).

## 10. What is explicitly NOT built

No runtime registration API; no plugin-to-plugin frontend imports (composition happens through
zones/nav, or through explicitly published packages); no client-side plugin router (Fresh
partials/`f-client-nav` already cover SPA-feel navigation); no shadow-DOM/web-component wrapper
(tokens + layers + scoping attributes suffice at T0).
