---
layout: layouts/base.vto
title: The Fresh page model
templateEngine: [vento, md]
order: 1
---

# The Fresh page model

`@netscript/fresh` is NetScript's web layer: a server-first meta-framework built on
[Fresh](https://fresh.deno.dev/) that renders pages on the server, sends HTML, and hydrates only the
interactive parts of a page as islands. This page frames the whole Web Layer — how the runtime
server is composed, where the islands boundary sits, and how a page connects to typed route
contracts and the shared page-loader cache. Reach for it first when you want the mental model before
diving into any individual leaf.

The web runtime consumes public service types; it does not define persistence shapes. For a
DB-backed product, follow the predecessor from [`netscript db generate` and `@database/zod`](/data-persistence/database/#generated-schemas-feed-public-contracts)
into the [versioned API contract](/explanation/contracts/#where-the-public-shape-begins) before those
types reach page loaders and islands.

## Server-first, islands at the edges

A NetScript Fresh page is rendered on the server by default. The handler runs in Deno, loads data,
and returns HTML. Interactivity is opt-in: only components designated as islands ship JavaScript to
the browser and hydrate there. Everything else stays static server-rendered markup. The result is a
small client payload with a clear boundary between server work (data loading, validation, rendering)
and client work (the islands).

The package is organized around explicit subpaths, each a leaf of this pillar. The root entry
(`@netscript/fresh`) exposes only the cross-cutting page-loader cache helpers; every other
capability lives on its own import:

- `./builders` — the define-page builder
- `./route` — typed route contracts
- `./form` — server-validated forms
- `./defer` — deferred and streaming UI
- `./query` — data loading and the query cache
- `./server` — server-only utilities that depend on packages such as `@netscript/kv`
- `./streams`, `./interactive`, `./vite`, `./error`, `./testing`

This split keeps server-only code — anything importing `@netscript/fresh/server` — out of client
bundles, which is what preserves the islands boundary.

## Composing the runtime server

The runtime server is a Fresh `App<State>` instance. `App` passes the incoming `Request` through
middlewares and routes, exposes verb helpers (`get`, `post`, `patch`, `put`, `delete`, `head`,
`all`), a WebSocket endpoint helper (`ws`), file-system route insertion (`fsRoutes`), and produces a
handler for `Deno.serve` via `handler()` or starts a server directly with `listen()`.

`defineFreshApp<State>(options)` is the NetScript-managed entry point for building that app:

```ts
// apps/dashboard/main.ts
import { defineFreshApp } from "@netscript/fresh/server";
import type { State } from "@app/utils.ts";

export const app = defineFreshApp<State>({ name: "dashboard" });
```

That is the entire generated entry point, and the ratio matters more than the line count.

### What bare Fresh makes you write

The hand-rolled equivalent is short too — that is not the argument:

```ts
// main.ts — bare Fresh
import { App, staticFiles } from "fresh";

export const app = new App<State>()
  .use(staticFiles())
  .use((ctx) => {
    ctx.state.requestId = crypto.randomUUID();
    return ctx.next();
  })
  .fsRoutes();
```

What this file does not say is why the calls are in that order. Static files before your middleware
means asset requests skip work meant for pages; `fsRoutes()` last means the file-system routes are
inserted after everything registered above them. Those rules are real and they live nowhere except in
whoever wrote the file. Copy it into a second app, add an app-level middleware in the wrong place, and
the failure is a slow asset path or an unreachable explicit route — not an error.

One thing is also silently absent: the SDK's KV cache provider is never registered, so
`getCachedEntry()` throws at the first loader that calls it. That registration is an import side
effect — `@netscript/fresh/server` re-exports the module whose body imports `@netscript/sdk/cache` —
and it is documented in
[The query bridge](/web-layer/query-bridge/#the-import-that-makes-any-of-this-work). A bare Fresh
entry point that never imports `@netscript/fresh/server` bypasses it. Calling `defineFreshApp` is not
itself the trigger; evaluating the `/server` module is.

### The bootstrap order

`defineFreshApp` runs a fixed sequence, and every option is a seam in it:

1. **Obtain the app** — `options.app`, else `options.createApp(options.freshConfig)`, else
   `new App(options.freshConfig)`. The first match wins, so passing `app` means `createApp` is never
   called.
2. **`preConfigure(app)`** — before anything is registered. This is where a route or middleware that
   must precede the static-file handler goes.
3. **Static files** — `app.use(staticFiles())` unless `staticFiles` is `false`; pass your own
   `Middleware` to replace Fresh's.
4. **Request telemetry** — register a `fresh.request` server span unless `telemetry` is `false`.
   Static attributes come from `telemetry.attributes`; service-name precedence is
   `telemetry.serviceName`, then `name`, then `fresh-app`.
5. **App middleware** — `app.use(...options.middleware)`, skipped entirely when the array is empty.
6. **Query-cache invalidation** — register the JSON-only POST route at
   `/_netscript/query-cache/invalidate`, unless `queryCacheInvalidation` is `false`; an object can
   override its path. The middleware above protects this route too.
7. **`configure(app)`** — after middleware, **before** file-system routes. Explicit routes registered
   here are inserted ahead of the generated ones.
8. **File-system routes** — `app.fsRoutes()`, or `app.fsRoutes(pattern)` when `fsRoutes` is a string,
   or your own callback when it is a function. `false` skips the step.

The returned value is the `App<State>` itself, so `app.use(...)`, `app.get(...)`, and `app.listen(...)`
remain available afterwards for anything the options do not cover.

| Option | Type | Effect |
| --- | --- | --- |
| `name` | `string` | Stable app identifier and default telemetry service name. |
| `app` | `App<State>` | Reuse an existing instance; wins over `createApp`. |
| `freshConfig` | `FreshConfig` | Passed to `createApp` or to `new App()`. |
| `createApp` | `(freshConfig?) => App<State>` | Replace app construction. |
| `staticFiles` | `Middleware<State> \| false` | Replace or disable the static-file middleware. |
| `middleware` | `Middleware<State>[]` | Registered in order, after static files. |
| `preConfigure` | `(app) => void` | Runs first, before static files. |
| `configure` | `(app) => void` | Runs after middleware, before file-system routes. |
| `fsRoutes` | `((app, pattern?) => void) \| false \| string` | Mount at a pattern, replace, or disable. |
| `telemetry` | `boolean \| FreshAppTelemetryOptions` | Configure request-span service identity/static attributes; `false` disables it. |
| `queryCacheInvalidation` | `FreshQueryCacheInvalidationOptions \| false` | Configure the standard server-cache invalidation path or disable it. |

```ts
// mount an app's file routes under a prefix and serve assets elsewhere
export const admin = defineFreshApp<State>({
  name: "admin",
  staticFiles: false,
  fsRoutes: "/admin",
});

// register a health endpoint ahead of the static handler, and a version
// endpoint ahead of the file-system routes
export const dashboard = defineFreshApp<State>({
  name: "dashboard",
  preConfigure: (app) => app.get("/healthz", () => new Response("ok")),
  configure: (app) => app.get("/version", () => new Response("0.0.4")),
});
```

Every non-static request runs inside a `fresh.request` server span emitted through
`@netscript/telemetry/tracer`. The span includes `service.name`, `http.request.method`, `url.path`,
`http.response.status_code`, and `netscript.operation`, plus the caller's static attributes. A
scaffolded app needs no telemetry code in `main.ts`: its `name` supplies the service identity and
the generated Aspire resource supplies Deno's OTEL environment and HTTP/protobuf exporter.

The `Middleware<State>` type is the basic building block: a function that receives a `Context<State>`
and returns a `Response` (or a promise of one), or calls `ctx.next()` to continue the chain. Register
app-level middleware through the `middleware` option above or directly with `app.use(...)`.

### What it does not wire

`app.fsRoutes()` does not scan the file system at request time — it inserts the routes and islands the
Fresh **builder** collected, which is why a NetScript app's discovery is configured in
`vite.config.ts` rather than in `main.ts`. The `fresh()` Vite plugin finds `routes/` and `islands/`;
`createNetScriptVitePlugin` adds the route manifest, workspace aliases, and watch paths. See
[Build and Vite integration](/web-layer/vite/).

The consequence for the bootstrap is that `fsRoutes` in the options controls *where* those collected
routes land — under a prefix, replaced by your own callback, or not at all — not *what* is in them.

### The State binding

`defineFreshApp<State>` takes the same `State` every page and middleware in the app is typed against,
and the scaffold gives that type one home. `app/utils.ts` declares it and re-exports the two builders
already bound to it:

```ts
// apps/dashboard/utils.ts
import { createDefine } from "fresh";
import { definePage as createDefinePage } from "@netscript/fresh/builders";

export type State = Record<string, never>;

export const define = createDefine<State>();

export function definePage() {
  return createDefinePage<State>();
}
```

Route modules then import `definePage` from `@app/utils.ts` rather than from
`@netscript/fresh/builders`, and `main.ts` imports `type { State }` from the same module. One
declaration binds the app, its middleware, and every page context to the same shape; importing the
package builder directly in a route silently opts that page out of the binding, and `ctx.state` there
types as an empty record.

Widen `State` in that one file — adding `requestId`, a session, a tenant — and every page's `ctx.state`
widens with it, along with the `middleware` array's `ctx`.

### What to watch for

- **`app` and `createApp` are not both used.** Passing an existing `app` short-circuits the factory;
  `createApp` only runs when `app` is absent.
- **`configure` is not the last hook.** Its name suggests final customization, but file-system routes
  are registered after it. Anything that must come after them goes on the returned `app`.
- **A custom `fsRoutes` callback never receives a pattern.** Its second parameter exists in the type,
  but the runtime only computes a pattern from the string form — which does not take the callback
  branch. Close over the pattern you want instead of reading the argument.
- **The KV cache provider is registered by the import, not by the call.** Evaluating
  `@netscript/fresh/server` — for `defineFreshApp`, `createStreamingResponse`, or anything else on the
  subpath — registers it. Constructing the app with `new App()` in a module that still imports
  `/server` keeps the registration; only an entry point that never touches the subpath loses it, and
  the failure then surfaces in a loader, far from `main.ts`.
- **Adapter imports with their own ordering rules still go above everything.** The scaffolded
  dashboard puts `import '@netscript/kv/redis';` at the top of `main.ts` because that registration has
  to precede the first `getKv()` call — `defineFreshApp` does not sequence module-level side effects
  for you.

## Pages connect to typed route contracts

Pages do not pass raw strings around. A route is described once as a typed contract and bound to a
concrete Fresh route pattern. `defineRouteContract(options)` builds a contract around optional path
and search schemas; binding it to a pattern yields a `RouteReference` with typed parsing and href
helpers.

```ts
import {
  defineRouteContract,
  paginationSearchSchema,
} from "@netscript/fresh/route";

const ordersContract = defineRouteContract({
  searchSchema: paginationSearchSchema({ defaultLimit: 20 }),
});

const ordersRoute = ordersContract.bind("/orders");

// Typed href with validated search state:
const href = ordersRoute.href({ search: { page: 2 } });

// Parse incoming query params back into typed state:
const search = ordersRoute.parseSearch(new URLSearchParams("page=2"));
```

`createRouteReference("/orders/[id]")` infers path params straight from the pattern, and
`paginationSearchSchema()` returns a pagination-aware search schema that parses `page`, `limit`,
`sortBy`, `sortOrder` and computes a derived `offset`. Both `parseSearch` and `safeParseSearch` are
available — the `safe*` variants return a `SchemaParseResult` instead of throwing. Route contracts
are covered in depth on the routing leaf.

## Pages connect to the shared query cache

The root `@netscript/fresh` entry exposes the page-loader cache helpers that page loaders and partial
orchestration share. A cached value carries its payload plus the time it was produced, and the
helpers let a page reason about freshness and reuse across boundaries.

```ts
import {
  hasAllCacheEntries,
  minCachedAt,
  projectCachedItemFromList,
  type CacheEntryLike,
} from "@netscript/fresh";

function summarize(entries: Array<CacheEntryLike<unknown> | null>) {
  return {
    ready: hasAllCacheEntries(entries),
    oldest: minCachedAt(entries),
  };
}
```

`CacheEntryLike<T>` is the cached-entry shape (`data` plus a `cachedAt` millisecond timestamp) shared
by page loaders and partial orchestration. `projectCachedItemFromList` derives a single cached item
from a cached list response while preserving the list timestamp. Data loading and the full query
cache surface live on the query leaf.

## Streaming responses

Server-first pages can stream HTML progressively. `createStreamingResponse(vnode, options)` returns a
streaming HTTP `Response` whose body is a `ReadableStream` of UTF-8 HTML chunks — the high-level API
for route handlers that want progressive delivery. `renderToStream` is the lower-level form that
returns both the `stream` and an `allReady` promise. `StreamErrorBoundary` wraps a streaming subtree
so a single failing data source does not tear down the whole response. These are introduced here and
detailed on the deferred-and-streaming-UI leaf.

## API summary

| Symbol | Subpath | Description |
| --- | --- | --- |
| `defineFreshApp` | `/server` | Create a NetScript-managed Fresh `App` with baseline bootstrap defaults and adapter seams. |
| `DefineFreshAppOptions` | `/server` | Options contract for `defineFreshApp` (app, middleware, static files, lifecycle hooks, fs routes, telemetry). |
| `FreshQueryCacheInvalidationOptions` | `/server` | Path configuration for the standard same-origin JSON invalidation route. |
| `App` | `/server` | Fresh application instance: middleware, verb routing, `ws`, `fsRoutes`, `handler()`, `listen()`. |
| `Middleware` | `/server` | Request-handling building block receiving a `Context<State>`. |
| `FreshAppFactory` | `/server` | `createApp` seam: `(freshConfig?) => App<State>`. |
| `FreshAppFsRoutes` | `/server` | `fsRoutes` seam: `(app, pattern?) => void`. |
| `FreshAppTelemetryOptions` | `/server` | Reserved telemetry bootstrap options (`serviceName`, `attributes`). |
| `createStreamingResponse` | `/server` | Build a streaming HTML `Response` from a Preact VNode tree. |
| `renderToStream` | `/server` | Render a VNode tree to a `ReadableStream` with Suspense streaming. |
| `StreamErrorBoundary` | `/server` | Boundary that catches rendering errors in a streaming subtree. |
| `defineRouteContract` | `/route` | Define a typed route contract around optional path and search schemas. |
| `createRouteReference` | `/route` | Build a route reference directly from a Fresh route pattern. |
| `paginationSearchSchema` | `/route` | Create a pagination-aware search schema with typed defaults. |
| `RouteReference` | `/route` | Bound route with typed parsing and href helpers. |
| `hasAllCacheEntries` | root | Return `true` when every supplied cache entry is present. |
| `minCachedAt` | root | Return the oldest `cachedAt` timestamp across entries. |
| `projectCachedItemFromList` | root | Project one cached item from a cached list while preserving the list timestamp. |
| `CacheEntryLike` | root | Cached-entry shape (`data`, `cachedAt`) shared across loaders. |

## Related

{{ comp.cardsGrid({ columns: 3, cards: [
  { title: "Pages and the define-page builder", body: "Author server-rendered pages with the page builder.", href: "/web-layer/builders/" },
  { title: "The query bridge", body: "The cache registration this bootstrap performs.", href: "/web-layer/query-bridge/" },
  { title: "Routing and route contracts", body: "Typed path and search contracts in depth.", href: "/web-layer/route/" },
  { title: "Data loading and the query cache", body: "Load data and share the page-loader cache.", href: "/web-layer/query/" },
  { title: "Server-validated forms", body: "Validate form submissions on the server.", href: "/web-layer/form/" },
  { title: "Deferred and streaming UI", body: "Stream HTML and defer expensive sections.", href: "/web-layer/defer-streaming-ui/" },
  { title: "Interactive islands", body: "Opt components into client-side hydration.", href: "/web-layer/interactive/" },
  { title: "Build and Vite integration", body: "Bundle the Web Layer with Vite.", href: "/web-layer/vite/" },
  { title: "Error handling and diagnostics", body: "Surface and diagnose page errors.", href: "/web-layer/error/" },
  { title: "Testing Fresh pages", body: "Test server-rendered pages and handlers.", href: "/web-layer/testing/" }
] }) }}

Build a full app end to end in the flagship tutorial: [Live dashboard](/tutorials/live-dashboard/).
Return to the pillar hub: [Web Layer](/web-layer/).
