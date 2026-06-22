---
layout: layouts/base.vto
title: Pages and the define-page builder
templateEngine: [vento, md]
---

# Pages and the define-page builder

`@netscript/fresh` exposes a fluent builder for declaring pages. You start a chain
with `definePage()`, layer on resources, params, render layers, handlers, and
metadata, and finish with `build()` to produce a Fresh-compatible page definition.
The same module also defines framework-owned partial routes through `definePartial()`
and `defineStatsPartial()`. Reach for this surface whenever you author a route module
and want a typed pipeline rather than hand-wired loaders and handlers.

Route contracts themselves — the generated route references passed to `withRoute()` —
live on `@netscript/fresh/route`; see [Routing and route contracts](/web-layer/route/).

## The builder chain

`definePage<TState>()` returns a `PageRootBuilder<TState>`, the root of a typed
fluent chain. `PageRootBuilder` extends `PageBuilder`, the public fluent page builder
surface. Each method returns a new `PageBuilder` whose type parameters carry forward
the accumulated state, resources, path/search schemas, layer data, and a `THasRoute`
flag. Because every step is typed, downstream loaders, handlers, layouts, and metadata
resolvers see the exact shapes you declared earlier in the chain.

The chain ends with `build()`. When the page was bound to a route with `withRoute()`
(setting `THasRoute` to `true`), `build()` returns a `RoutedPageDefinition`; otherwise
it returns a `PageDefinition`. A `PageDefinition` exposes a `page` renderer and a
`default` export-compatible renderer — both `(ctx: PageRequestContext<TState>) =>
Promise<PageRenderable>` — plus an optional `handler` built from the handlers you
registered.

{{ comp callout { type: "note" } }}
`build()` is overloaded. Calling `build()` with no argument, `build(routePattern:
string)`, or `build(options)` selects the routed or unrouted return type based on the
arguments and the `THasRoute` flag. A page bound with `withRoute()` always builds a
`RoutedPageDefinition`.
{{ /comp }}

## Building a page

The example below composes documented builder methods only: it declares a resource,
applies a search schema, registers a render layer, sets a status code, and builds an
unrouted page definition. `definePage` infers each generic from the calls you make.

```ts
import { definePage } from "@netscript/fresh";

const page = definePage()
  .withResource("metrics", async () => {
    return await loadMetrics();
  })
  .withStatus(200)
  .withMeta((ctx) => ({ title: "Dashboard" }))
  .build();

export default page.default;
```

Inside a loader, handler, layout, or metadata resolver, the runtime hands you a
`PageContext`. It extends `PageRequestContext` and adds the parsed `path` and `search`
state, already-resolved `layerData`, the `routePattern`, a typed `nav` href builder,
the `resources` record, and a `resource(key)` accessor that resolves a single named
resource with full typing.

## Builder methods

The methods on `PageBuilder` group into resources, params, routing, render layers,
handlers, and response shaping. Each returns a `PageBuilder` for continued chaining.

| Method | Purpose |
| --- | --- |
| `withResource(key, factory)` | Add a single named resource to the page pipeline. |
| `withResources(factories)` | Add multiple named resources to the page pipeline. |
| `withParams({ path?, search? })` | Apply both path and search schemas in one step. |
| `withPathParams(schema)` | Apply a typed path schema to the page. |
| `withSearchParams(schema)` | Apply a typed search schema to the page. |
| `withRoute(route)` | Bind the page to a generated route reference. |
| `withPolicy(policy)` | Configure defer policy defaults for the page. |
| `withTelemetry(telemetry)` | Configure telemetry metadata for the page. |
| `withLayer(id, component, config?)` | Register a render layer for the page. |
| `withForm(id, component, config)` | Register a route-bound form as a typed layer. |
| `withHandler(method, handler)` | Register a page method handler. |
| `withLayout(layout)` | Register the page layout. |
| `withMeta(resolver)` | Register the page metadata resolver. |
| `withHeader(...)` | Append a static header, header map, or computed headers. |
| `withStatus(status)` | Set the default HTTP status code for Fresh `GET` rendering. |
| `withStreaming()` | Enable builder-owned HTML streaming for `delivery: 'stream'` layers. |
| `createNav(routePattern?)` | Create typed route navigation for the page. |
| `build(...)` | Build the `PageDefinition` or `RoutedPageDefinition`. |

`withHeader` is overloaded: it accepts a single `name`/`value` pair, a `HeadersInit`
map, or a `PageHeaderResolver` that computes headers per request.

### Params and route state

`withPathParams`, `withSearchParams`, and the combined `withParams` apply typed
schemas to the page. After they run, `PageContext.path` and `PageContext.search`
carry the parsed, typed state. `withRoute` binds the page to a `PageRouteReference`,
which exposes a typed `nav`, an `href(...)` builder, a route-bound `Link` component,
and `parsePath` / `parseSearch` helpers (plus `safeParsePath` / `safeParseSearch`
returning a `PageSchemaParseResult`). Data loading details are covered in
[Data loading and the query cache](/web-layer/query/).

### Defer policy and streaming

`withPolicy` accepts a `PageDeferPolicyInput` or a `PageDeferPolicyProfile`. The
profile is one of `"balanced"`, `"aggressive-first-paint"`, `"background-refresh"`,
or `"low-bandwidth"`. A `PageDeferPolicyInput` overrides individual fields such as
`staleTimeMs`, `prewarmOnMiss`, and `prewarmOnStale`. `withStreaming()` enables
builder-owned HTML streaming for layers declared with `delivery: 'stream'`. See
[Deferred and streaming UI](/web-layer/defer-streaming-ui/) for the policy model.

### Handlers and methods

`withHandler(method, handler)` registers a method handler. `method` is a `PageMethod`,
one of `"GET"`, `"POST"`, `"PUT"`, `"PATCH"`, `"DELETE"`, `"OPTIONS"`, or `"HEAD"`.
`withForm` registers a route-bound form as a typed layer, wiring a layer, method
handler, CSRF headers, and form metadata; its component receives `RuntimeFormState`
props. Forms are covered in [Server-validated forms](/web-layer/form/).

## Partials

`definePartial()` defines a framework-owned partial route backed by an async loader,
and `defineStatsPartial()` defines a stats-only partial backed by a context-free query
function. Both return a `DefinedPartialRoute`, which carries a Fresh `config`, an
optional `handler`, a `page` renderer, and a `default` export-compatible renderer.

`DefinePartialOptions` requires a stable `name`, a `loader` `(ctx) => Promise<TProps>`,
and a `component`. It also accepts an optional `errorComponent`, `errorTitle`,
`handler`, and Fresh `config`. `DefineStatsPartialOptions` omits `loader` and instead
requires a `query` `() => Promise<TProps>`.

```ts
import { definePartial } from "@netscript/fresh";

export const liveCount = definePartial({
  name: "live-count",
  loader: async (ctx) => {
    return { total: await countActive(ctx) };
  },
  component: CountView,
});
```

## API summary

| Symbol | Description |
| --- | --- |
| `definePage<TState>()` | Start a new typed page builder chain. |
| `PageRootBuilder<TState>` | Root page builder returned by `definePage()`. |
| `PageBuilder<...>` | Public fluent page builder surface. |
| `PageDefinition<...>` | Unrouted page definition returned by `build()` without a route. |
| `RoutedPageDefinition<...>` | Page definition built with an explicit route. |
| `PageContext<...>` | Runtime context shared by loaders, handlers, layouts, and metadata resolvers. |
| `PageRequestContext<TState>` | Typed request context exposed to page builders. |
| `PageRenderContext<TState>` | Request context variant that can call `ctx.render()`. |
| `definePartial(options)` | Define a framework-owned partial route backed by an async loader. |
| `defineStatsPartial(options)` | Define a stats-only partial route backed by a context-free query. |
| `DefinePartialOptions<...>` | Options for creating a framework-owned partial route. |
| `DefineStatsPartialOptions<...>` | Options for creating a stats-only partial route. |
| `DefinedPartialRoute<...>` | Materialized partial route contract returned by `definePartial()`. |
| `PageMethod` | Page handler HTTP method union. |
| `PageDeferPolicyProfile` | Named defer policy profile union. |
| `PageRenderable` | Renderable value returned by page and partial renderers. |

## Related

{{ comp.cardsGrid({ columns: 3, cards: [ { title: "The Fresh page model", body: "How a NetScript Fresh page is structured.", href: "/web-layer/server/" }, { title: "Routing and route contracts", body: "Generated route references for withRoute().", href: "/web-layer/route/" }, { title: "Data loading and the query cache", body: "Resolve resources and cache data.", href: "/web-layer/query/" }, { title: "Server-validated forms", body: "withForm and RuntimeFormState.", href: "/web-layer/form/" }, { title: "Deferred and streaming UI", body: "withPolicy, withStreaming, and defer profiles.", href: "/web-layer/defer-streaming-ui/" }, { title: "Live dashboard tutorial", body: "Build a page end to end.", href: "/tutorials/live-dashboard/" } ] }) }}

See the [Web Layer overview](/web-layer/) for the full pillar map.
