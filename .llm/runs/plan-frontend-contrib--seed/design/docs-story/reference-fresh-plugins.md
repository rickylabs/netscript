# `@netscript/fresh/plugins` — API reference

The runtime half of the frontend contribution layer. `@netscript/plugin-frontend-core` owns the
serializable contract vocabulary; this subpath owns everything that touches the framework —
mounting, page helpers, zone rendering, the nav feed, and the route-module normalizer — as thin
wrappers over upstream Fresh primitives.

The module consumes the **generated registry** the CLI emits into `.netscript/generated/` on
`plugin install` / `netscript generate plugins`:

| Generated file          | Consumed by                                             |
| ----------------------- | ------------------------------------------------------- |
| `frontend.registry.ts`  | `defineFreshApp({ frontend })` — identities, resolved bases, contributions, literal lazy route loaders. |
| `frontend.islands.ts`   | `vite.config.ts` — `fresh({ islandSpecifiers: pluginIslandSpecifiers })`. |
| `frontend.routes.ts`    | `router.ts` — typed hrefs (`routes.plugins.crons.calendar.href()`). |
| `frontend.css`          | the app stylesheet — host layer prelude + plugin overlays. |
| `frontend.gateway.ts`   | the gateway route table (see below).                    |
| `frontend.check.ts`     | the staged install-time type-check — imports every referenced module. |

Generation is transactional: the set is staged out-of-place, type-checked, and swapped atomically.
A removed plugin emits the deterministic empty set, so imports can never dangle.

## `defineFreshApp` — the `frontend` option

```ts
import { defineFreshApp } from '@netscript/fresh/server';
import { frontendRegistry } from './.netscript/generated/frontend.registry.ts';

export const app = defineFreshApp<State>({
  name: 'my-app',
  frontend: frontendRegistry,
});
```

One option mounts everything: plugin sub-apps, nav, zones, the gateway, and host-context
injection. The generated registry exists from day zero — empty when no plugin contributes — so the
wiring is unconditional.

**Composition order matters.** Fresh compiles each route's middleware and layout chain at
insertion time, so plugin mounting runs as a dedicated phase *after* the host's own routes:

```text
static files → host middleware → host fs routes/layouts → mountPluginFrontends
```

Within each plugin sub-app the order is fixed: **middleware first, then routes**. Contributed
sub-apps may not carry `App`-level `notFound`, `onError`, or `appWrapper` commands; the mount glue
strips them and reports.

## `mountPluginFrontends`

```ts
function mountPluginFrontends(app: App, registry: FrontendContributionRegistry): void;
```

The composition-phase mount step the `frontend` option invokes. Per plugin, it creates a sub-`App`,
registers the plugin-scope middleware (which injects `state.pluginHost`), registers each route
with its generated literal lazy loader, and mounts the sub-app at the resolved base:

```ts
// What the phase does, per plugin (sketch):
const sub = new App<State>();
sub.use(pluginScopeMiddleware(identity));   // BEFORE routes
for (const r of m.routes) sub.route(r.path, r.load);
app.mountApp(m.resolvedBase, sub);
```

You never call it directly in a scaffolded app — `defineFreshApp({ frontend })` wires it — but it
is exported for hosts with a custom composition pipeline.

## `definePluginPage`

```ts
function definePluginPage(page: (ctx: PluginPageProps) => unknown): unknown;
```

Authoring sugar for plugin route modules: a Fresh page whose props carry the injected plugin
contexts. `PluginPageProps` is Fresh `PageProps` plus:

| Field    | Type                   | Notes                                            |
| -------- | ---------------------- | ------------------------------------------------ |
| `host`   | `PluginRequestContext` | Server-only: identity, base, `serviceUrl`, principal port, CSP nonce, abort signal. |
| `client` | `PluginClientContext`  | Serializable; the only context an island may receive. |

```tsx
import { definePluginPage } from '@netscript/fresh/plugins';
import { createCronsClient } from '@acme/plugin-crons/contracts/v1';

export default definePluginPage(async (ctx) => {
  const crons = await createCronsClient(ctx.host.serviceUrl('crons-api')).crons.list();
  return <CronCalendar initial={crons} client={ctx.client} />;
});
```

The sugar-free equivalent is plain `define.page`, reading `props.state.pluginHost` yourself.

## `pluginApi`

```ts
function pluginApi(client: PluginClientContext): string;
```

Returns the gateway base URL for the calling plugin, derived from the client context's `mountId`.
Pass it to a typed client inside an island; the request then travels the generated gateway with
the host's authentication and audit posture.

```tsx
import { pluginApi } from '@netscript/fresh/plugins';

async function refresh() {
  entries.value = await createCronsClient(pluginApi(props.client)).crons.list();
}
```

Server-side code does not need `pluginApi` — call typed clients against `ctx.host.serviceUrl(...)`
directly.

## `PluginZone`

```tsx
<PluginZone id='app.dashboard.panels' />
```

| Prop | Type     | Meaning                                             |
| ---- | -------- | --------------------------------------------------- |
| `id` | `string` | A zone id from the host's `HostSurfaceDescriptor`.  |

Renders the zone's contributions in deterministic order (`order`, then mount id, then contribution
id), each wrapped for scoping and provenance:

```html
<div data-ns-plugin='crons' data-ns-contribution='crons/next-fires'>…</div>
```

**Containment contract.** Data resolution runs host-side before render inside a guard; a failed
resolution renders the quarantine card. Hydrated islands sit under a client-side boundary, so
post-hydration crashes degrade to the card without killing the page. A plugin route that throws
fails that route, host-styled. An SSR **render-time** throw in a zone component fails the page
response — the reason zone components resolve data in the resolver and keep renders pure.

## `pluginNavSections`

```ts
function pluginNavSections(
  registry: FrontendContributionRegistry,
  options: { group: string },
): SidebarNavSection[];
```

Builds the nav feed for a group from the registry, for `SidebarShell.navigation` or the topbar.
Targets are discriminated: `route` targets get the base path composed and resolve through the
generated typed route refs; `href` renders as-is; `external` renders with
`rel="noopener noreferrer"`. Labels are `MessageRef`s resolved through the host's message
resolution, falling back to the mandatory default text.

```tsx
// routes/_layout.tsx — contributed entries append to the app's own:
const navigation = [
  ...DESIGN_NAVIGATION,
  ...pluginNavSections(frontendRegistry, { group: 'main' }),
];
```

## `normalizeFreshRouteModule`

```ts
function normalizeFreshRouteModule(module: unknown): Route;
```

Maps a file-system route module namespace — `default` (the component), `handler`/`handlers`,
`config`, `css` — onto the internal `Route` shape upstream `App.route()` accepts. Unknown module
members throw a structured error. You never call it yourself; the generated registry applies it in
every literal lazy loader:

```ts
// .netscript/generated/frontend.registry.ts (excerpt) — AUTO-GENERATED, DO NOT EDIT
{
  id: 'calendar',
  path: '/calendar',
  load: () => import('@acme/plugin-crons/frontend/routes/calendar').then(normalizeFreshRouteModule),
}
```

## The generated gateway

```ts
// Wired by the `frontend` option via `app.use(...)` — not called directly in a scaffolded app.
pluginGateway(registry);
```

`frontend.gateway.ts` is a **deny-by-default route table** generated from each plugin's
`requires.procedures` crossed with its versioned contract metadata — one route per granted
procedure, with the service owner, method, path template, request/response mode, and streaming
policy derived from the contract. Nothing else is reachable; there is no wildcard forwarding.

The gateway's posture:

- server-side authentication and authorization through the host principal port — browser
  credentials are never blind-forwarded;
- origin/CSRF checks, request/response size limits, timeouts, and abort propagation;
- manual redirect handling and a response-header allowlist;
- a structured audit log line per invocation (mount id, procedure, subject);
- streaming (SSE / event-iterator procedures) only where the contract metadata declares it.

Islands reach the gateway through `pluginApi`. Durable AI chat streams are **not** gateway
traffic: they stay on the specialized `@netscript/fresh/ai` stream proxy, which the plugin mounts
as its own contributed route.
