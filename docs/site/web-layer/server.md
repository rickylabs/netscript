---
layout: layouts/base.vto
title: The Fresh page model
templateEngine: [vento, md]
---

# The Fresh page model

`@netscript/fresh` is NetScript's web layer: a server-first meta-framework built on
[Fresh](https://fresh.deno.dev/) that renders pages on the server, sends HTML, and hydrates only the
interactive parts of a page as islands. This page frames the whole Web Layer — how the runtime
server is composed, where the islands boundary sits, and how a page connects to typed route
contracts and the shared page-loader cache. Reach for it first when you want the mental model before
diving into any individual leaf.

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

`defineFreshApp<State>(options)` is the NetScript-managed entry point for building that app. It keeps
the default Fresh bootstrap unchanged while exposing optional adapter seams — app construction
(`createApp`), static-file middleware (`staticFiles`), app-level `middleware`, lifecycle hooks
(`preConfigure`, `configure`), file-system route registration (`fsRoutes`), and reserved telemetry
defaults (`telemetry`). It returns a ready `App<State>`.

```ts
import { defineFreshApp } from "@netscript/fresh/server";

interface State {
  requestId: string;
}

const app = defineFreshApp<State>({
  name: "dashboard",
  middleware: [
    (ctx) => {
      ctx.state.requestId = crypto.randomUUID();
      return ctx.next();
    },
  ],
});

await app.listen({ port: 8000 });
```

The `Middleware<State>` type is the basic building block: a function that receives a `Context<State>`
and returns a `Response` (or a promise of one), or calls `ctx.next()` to continue the chain. Register
app-level middleware through the `middleware` option above or directly with `app.use(...)`.

{{ comp callout { type: "note" } }}
The `telemetry` option and `FreshAppTelemetryOptions` (`serviceName`, `attributes`) are reserved
bootstrap seams for future Fresh app telemetry defaults. They are accepted today and wired for
forward compatibility.
{{ /comp }}

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
| `App` | `/server` | Fresh application instance: middleware, verb routing, `ws`, `fsRoutes`, `handler()`, `listen()`. |
| `Middleware` | `/server` | Request-handling building block receiving a `Context<State>`. |
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
