---
layout: layouts/base.vto
title: The Fresh page model
templateEngine: [vento, md]
order: 1
---

# The Fresh page model

This page explains how a NetScript Fresh app boots: where the islands boundary sits, how
`@netscript/fresh` splits into subpaths, and what `defineFreshApp()` registers, in which order.

The web runtime consumes public service types; it does not define persistence shapes. In a
database-backed product, those types start at [`netscript db generate` and `@database/zod`](/data-persistence/database/#generated-schemas-feed-public-contracts)
and pass through the [versioned API contract](/explanation/contracts/#where-the-public-shape-begins)
before they reach page loaders and islands.

## Server-first, islands at the edges

A NetScript Fresh page renders on the server by default. The handler runs in Deno, loads data and
returns HTML. Only components designated as islands ship JavaScript and hydrate in the browser;
everything else stays server-rendered markup.

The package splits that boundary into subpaths. The root entry (`@netscript/fresh`) exposes only the
page-loader cache helpers; every other capability has its own import:

- `./builders`: the define-page builder
- `./route`: typed route contracts
- `./form`: server-validated forms
- `./defer`: deferred and streaming UI
- `./query`: data loading and the query cache
- `./server`: server-only utilities that depend on packages such as `@netscript/kv`
- `./streams`, `./interactive`, `./vite`, `./error`, `./testing`

Anything that imports `@netscript/fresh/server` stays out of client bundles, which is what keeps the
islands boundary intact.

## Composing the runtime server

The runtime server is a Fresh `App<State>` instance. `App` passes the incoming `Request` through
middlewares and routes. It exposes verb helpers (`get`, `post`, `patch`, `put`, `delete`, `head`,
`all`), a WebSocket endpoint helper (`ws`) and file-system route insertion (`fsRoutes`). It produces
a handler for `Deno.serve` via `handler()`, or starts a server directly with `listen()`.

`defineFreshApp<State>(options)` builds that app for you. This is the whole generated entry point:

```ts
// apps/dashboard/main.ts
import { defineFreshApp } from "@netscript/fresh/server";
import type { State } from "@app/utils.ts";

export const app = defineFreshApp<State>({ name: "dashboard" });
```

### Compared with bare Fresh

The hand-rolled equivalent is also short:

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

The file does not say why the calls are in that order. Static files come before your middleware so
asset requests skip page work; `fsRoutes()` comes last so file-system routes are inserted after
everything registered above them. Put an app-level middleware in the wrong place in a second app and
you get a slow asset path or an unreachable explicit route, not an error.

The bare file also never registers the SDK's KV cache provider, so `getCachedEntry()` throws at the
first loader that calls it. `defineFreshApp()` calls `setCacheProvider(cacheQuery)` as its first
bootstrap step. See
[The query bridge](/web-layer/query-bridge/#the-bootstrap-call-that-makes-server-caching-work).

### The bootstrap order

`defineFreshApp` runs a fixed sequence. Each option is a seam in it:

1. **Register the server cache:** call `setCacheProvider(cacheQuery)`. This happens when
   `defineFreshApp()` is called, not when its module is imported.
2. **Obtain the app:** `options.app`, else `options.createApp(options.freshConfig)`, else
   `new App(options.freshConfig)`. The first match wins, so passing `app` means `createApp` is never
   called.
3. **`preConfigure(app)`:** runs before anything is registered. Put a route or middleware that must
   precede the static-file handler here.
4. **Static files:** `app.use(staticFiles())` unless `staticFiles` is `false`. Pass your own
   `Middleware` to replace Fresh's.
5. **Request telemetry:** register a `fresh.request` server span unless `telemetry` is `false`.
   Static attributes come from `telemetry.attributes`. Service-name precedence is
   `telemetry.serviceName`, then `name`, then `fresh-app`.
6. **App middleware:** `app.use(...options.middleware)`, skipped when the array is empty.
7. **Query-cache invalidation:** register the JSON-only POST route at
   `/_netscript/query-cache/invalidate`, unless `queryCacheInvalidation` is `false`. An object can
   override its path. The middleware above protects this route too.
8. **`configure(app)`:** runs after middleware and **before** file-system routes. Explicit routes
   registered here are inserted ahead of the generated ones.
9. **File-system routes:** `app.fsRoutes()`, or `app.fsRoutes(pattern)` when `fsRoutes` is a string,
   or your own callback when it is a function. `false` skips the step.

The return value is the `App<State>` itself, so `app.use(...)`, `app.get(...)` and `app.listen(...)`
stay available for anything the options do not cover.

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
`http.response.status_code` and `netscript.operation`, plus the caller's static attributes. A
scaffolded app needs no telemetry code in `main.ts`: its `name` supplies the service identity, and
the generated Aspire resource supplies Deno's OTEL environment and HTTP/protobuf exporter.

`Middleware<State>` is a function that receives a `Context<State>` and either returns a `Response`
(or a promise of one) or calls `ctx.next()` to continue the chain. Register app-level middleware
through the `middleware` option or directly with `app.use(...)`.

### Route discovery

`app.fsRoutes()` does not scan the file system at request time. It inserts the routes and islands
the Fresh **builder** collected, so a NetScript app configures discovery in `vite.config.ts`, not in
`main.ts`. The `fresh()` Vite plugin finds `routes/` and `islands/`; `createNetScriptVitePlugin` adds
the route manifest, workspace aliases and watch paths. See
[Build and Vite integration](/web-layer/vite/).

The `fsRoutes` option therefore controls *where* the collected routes land (under a prefix, through
your own callback, or not at all), not *what* is in them.

### The State binding

`defineFreshApp<State>` takes the same `State` that every page and middleware in the app is typed
against. The scaffold gives that type one home: `app/utils.ts` declares it and re-exports the two
builders already bound to it:

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

Route modules import `definePage` from `@app/utils.ts` rather than from
`@netscript/fresh/builders`, and `main.ts` imports `type { State }` from the same module. One
declaration binds the app, its middleware and every page context to the same shape. A route that
imports the package builder directly opts out of the binding, and `ctx.state` there types as an
empty record.

Widen `State` in that one file (a `requestId`, a session, a tenant) and every page's `ctx.state`
widens with it, along with the `middleware` array's `ctx`.

### What to watch for

- **`app` and `createApp` are not both used.** Passing an existing `app` short-circuits the factory;
  `createApp` only runs when `app` is absent.
- **`configure` is not the last hook.** Its name suggests final customization, but file-system routes
  are registered after it. Anything that must come after them goes on the returned `app`.
- **A custom `fsRoutes` callback never receives a pattern.** Its second parameter exists in the type,
  but the runtime only computes a pattern from the string form, which does not take the callback
  branch. Close over the pattern you want instead of reading the argument.
- **The KV cache provider is registered by the call, not by the import.** Calling
  `defineFreshApp()` installs it before any app hooks run. Importing `@netscript/fresh/server` for a
  different helper does not. A custom `new App()` bootstrap must call
  `setCacheProvider(cacheQuery)` itself, or its first provider-backed loader fails.
- **Adapter imports with their own ordering rules still go first.** The scaffolded dashboard puts
  `import '@netscript/kv/redis';` at the top of `main.ts` because that registration has to precede
  the first `getKv()` call. `defineFreshApp` does not sequence module-level side effects for you.

## Route contracts and the page-loader cache

Pages do not pass raw URL strings around. A route is described once as a typed contract from
`@netscript/fresh/route` and bound to a Fresh route pattern; the result parses requests and builds
hrefs from the same schemas. [Routing and route contracts](/web-layer/route/) covers contracts,
references and the generated `routes` tree.

The root `@netscript/fresh` entry exports the cache-entry helpers that page loaders and partials
share: `CacheEntryLike<T>` (`data` plus a `cachedAt` millisecond timestamp), `hasAllCacheEntries`,
`minCachedAt` and `projectCachedItemFromList`.
[Data loading and the query cache](/web-layer/query/) shows them in a loader.

## Streaming responses

Server-first pages can stream HTML progressively. `createStreamingResponse(vnode, options)` returns a
streaming HTTP `Response` whose body is a `ReadableStream` of UTF-8 HTML chunks; use it in route
handlers that want progressive delivery. `renderToStream` is the lower-level form and returns both
the `stream` and an `allReady` promise. `StreamErrorBoundary` wraps a streaming subtree so one
failing data source does not tear down the whole response. For deferred regions and live streams,
see [Deferred and streaming UI](/web-layer/defer-streaming-ui/).

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

## Next steps

Continue with [Pages and the define-page builder](/web-layer/builders/) to author the pages this app
serves. See also [The query bridge](/web-layer/query-bridge/) for the cache registration this
bootstrap performs, and the [Live dashboard](/tutorials/live-dashboard/) tutorial for a full app.
