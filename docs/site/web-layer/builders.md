---
layout: layouts/base.vto
title: Pages and the define-page builder
templateEngine: [vento, md]
order: 2
---

# Pages and the define-page builder

This page covers the `definePage()` builder from `@netscript/fresh/builders`: how the chain
carries types forward, what `build()` returns, and every method you can chain. You start with
`definePage()`, add resources, params, render layers, handlers and metadata, and finish with
`build()` to get a Fresh-compatible page definition. The same module defines partial routes through
`definePartial()` and `defineStatsPartial()`.

Route contracts (the generated route references passed to `withRoute()`) live on
`@netscript/fresh/route`; see [Routing and route contracts](/web-layer/route/). Layer data follows a
separate type seam: in database-backed products, generated model schemas first become a narrowed
[versioned API contract](/explanation/contracts/#where-the-public-shape-begins). See the
[`@database/zod` generation step](/data-persistence/database/#generated-schemas-feed-public-contracts)
before wiring that contract's SDK or query result into a loader.

## The builder chain

`definePage<TState>()` returns a `PageRootBuilder<TState>`, which extends `PageBuilder`, the public
fluent page builder surface. Each method returns a new `PageBuilder` whose type parameters carry
forward the accumulated state, resources, path and search schemas, layer data and a `THasRoute`
flag. Loaders, handlers, layouts and metadata resolvers later in the chain therefore see the exact
shapes you declared earlier.

The chain ends with `build()`. A page bound to a route with `withRoute()` (which sets `THasRoute` to
`true`) builds a `RoutedPageDefinition`; otherwise `build()` returns a `PageDefinition`. A
`PageDefinition` exposes a `page` renderer and a `default` export-compatible renderer, both
`(ctx: PageRequestContext<TState>) => Promise<PageRenderable>`, plus an optional `handler` built from
the handlers you registered.

> [!NOTE]
> `build()` is overloaded: `build()`, `build(routePattern: string)` and `build(options)` select the
> routed or unrouted return type from the arguments and the `THasRoute` flag. A page bound with
> `withRoute()` always builds a `RoutedPageDefinition`.

## Building a page

This page declares a route contract, a resource, a defer policy, telemetry, a render layer with a
partial, a route-bound form, layout slots and response shaping in one chain:

```tsx
import { definePage } from "@netscript/fresh/builders";
import { z } from "zod";
import { MetricChart, MetricChartSkeleton } from "../components/MetricChart.tsx";
import { EditOrderForm } from "../components/EditOrderForm.tsx";

const orderPage = definePage()
  .withRouteContract({
    $route: "/orders/[id]",
    pathSchema: z.object({ id: z.string() }),
    searchSchema: z.object({ tab: z.string().optional() }),
  })
  .withResource("metrics", async (ctx) => {
    return await loadOrderMetrics(ctx.path.id);
  })
  .withPolicy("balanced")
  .withTelemetry({ enabled: true, spanName: "order-detail-page" })
  .withLayer("chart", MetricChart, {
    loader: async (ctx) => ({ points: await ctx.resource("metrics") }),
    partial: "/partials/orders/chart",
    partialName: "orders-chart",
    fallback: <MetricChartSkeleton />,
    staleTime: 15_000,
    staleReloadMode: "background",
  })
  .withForm("editOrder", EditOrderForm, {
    schema: z.object({ status: z.string() }),
    mutate: async (values, ctx) => {
      await updateOrderStatus(ctx.path.id, values.status);
    },
  })
  .withLayout((slots, _ctx) => (
    <div class="layout">
      <aside>{slots.chart()}</aside>
      <section>{slots.editOrder()}</section>
    </div>
  ))
  .withHeader("x-page-type", "order-detail")
  .withStatus(200)
  .build();

export default orderPage.default;
```

`withRouteContract` types `ctx.path` and `ctx.search` for the rest of the chain, `withForm` wires
schema validation, CSRF headers and the `mutate` handler into a form layer, and `withLayout`
receives a `slots` map of callable layer renderers. The smallest useful page is much shorter:

```ts
import { definePage } from "@netscript/fresh/builders";

const page = definePage()
  .withResource("metrics", async () => {
    return await loadMetrics();
  })
  .withStatus(200)
  .withMeta((ctx) => ({ title: "Dashboard" }))
  .build();

export default page.default;
```

Loaders, handlers, layouts and metadata resolvers receive a `PageContext`. It extends
`PageRequestContext` with the parsed `path` and `search` state, the resolved `layerData`, the
`routePattern`, a typed `nav` href builder, the `resources` record, and a `resource(key)` accessor
that reads one named resource with full typing.

## Builder methods

The methods on `PageBuilder` cover resources, params, routing, render layers, handlers and response
shaping. Each returns a `PageBuilder` for continued chaining.

| Method | Purpose |
| --- | --- |
| `withResource(key, factory)` | Add a single named resource to the page pipeline. |
| `withResources(factories)` | Add multiple named resources to the page pipeline. |
| `withParams({ path?, search? })` | Apply both path and search schemas in one step. |
| `withPathParams(schema)` | Apply a typed path schema to the page. |
| `withSearchParams(schema)` | Apply a typed search schema to the page. |
| `withRoute(route)` | Bind the page to a generated route reference. |
| `withRouteContract({ $route?, pathSchema?, searchSchema? })` | Bind the page to a route via an inline contract; the Vite plugin inserts `$route` from the page path. |
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

`withHeader` accepts a single `name`/`value` pair, a `HeadersInit` map, or a `PageHeaderResolver`
that computes headers per request.

Resources resolve sequentially, before any layer, into a store every loader shares; see
[Request-scoped resources](/web-layer/resources/). Layers then resolve concurrently, each into its
own named region; see [Layers, layout, and slots](/web-layer/layers/).

### Params and route state

`withPathParams`, `withSearchParams` and the combined `withParams` apply typed schemas to the page.
After they run, `PageContext.path` and `PageContext.search` carry the parsed state. `withRoute` binds
the page to a `PageRouteReference`, which exposes a typed `nav`, an `href(...)` builder, a
route-bound `Link` component, and `parsePath` / `parseSearch` helpers (plus `safeParsePath` /
`safeParseSearch`, which return a `PageSchemaParseResult`).

With the NetScript Vite plugin enabled, the binding call is generated from the page module's path
under `routes/` when the page has no explicit binding. An existing `.withRoute(...)` call and its
imports remain author-owned. Otherwise, author only the contract body: inline in `withRouteContract()`, in a sibling
`<page>.route.ts` sidecar, or not at all. The three forms, their conflict rules and the
`pageModuleRouteBinding: false` opt-out are covered in
[Routing and route contracts](/web-layer/route/#three-authoring-forms-one-generated-binding).

### Defer policy and streaming

`withPolicy` accepts a `PageDeferPolicyInput` or a `PageDeferPolicyProfile`. The profile is one of
`"balanced"`, `"aggressive-first-paint"`, `"background-refresh"` or `"low-bandwidth"`. A
`PageDeferPolicyInput` overrides individual fields such as `staleTimeMs`, `prewarmOnMiss` and
`prewarmOnStale`. `withStreaming()` enables builder-owned HTML streaming for layers declared with
`delivery: 'stream'`. See [Deferred and streaming UI](/web-layer/defer-streaming-ui/) for the policy
model.

### Handlers and methods

`withHandler(method, handler)` registers a method handler. `method` is a `PageMethod`: `"GET"`,
`"POST"`, `"PUT"`, `"PATCH"`, `"DELETE"`, `"OPTIONS"` or `"HEAD"`. `withForm` registers a route-bound
form as a typed layer, wiring a layer, a method handler, CSRF headers and form metadata; its
component receives `RuntimeFormState` props. See [Server-validated forms](/web-layer/form/).

[Response shaping](/web-layer/response/) explains which combination of `withHandler`, `withHeader`,
`withStatus` and `withStreaming` produces which handler, and the errors that guard them.

## Partials

`definePartial()` defines a partial route backed by an async loader, and `defineStatsPartial()`
defines a stats-only partial backed by a context-free query. Both return a `DefinedPartialRoute`.
`DefinePartialOptions` requires a stable `name`, a `loader` and a `component`;
`DefineStatsPartialOptions` replaces `loader` with a `query`. [Partials](/web-layer/partials/)
covers both, with the error shell and the paired route reference that types the `f-partial` link.

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

## Next steps

Continue with [Request-scoped resources](/web-layer/resources/), the first thing a built page
resolves at runtime. See also [Layers, layout, and slots](/web-layer/layers/) and
[Response shaping](/web-layer/response/).
