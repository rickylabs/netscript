---
layout: layouts/base.vto
title: Layers, layout, and slots
templateEngine: [vento, md]
order: 16
---

# Layers, layout, and slots

This page explains `withLayer(id, Component, config)` and `withLayout(slots => …)`. A layer is a
named region of the page: it loads its own props and can carry its own fallback, freshness window
and refresh route. `withLayout` places the regions. **Layers resolve concurrently** and **cannot see
each other**, which is why [request-scoped resources](/web-layer/resources/) exist alongside them.

It assumes you know the [builder chain](/web-layer/builders/).

## Compared with bare Fresh

Fresh 2 gives a route one handler and one component. Regions are a convention you maintain:

```tsx
// routes/orders.tsx — bare Fresh
export const handler = define.handlers({
  async GET(ctx) {
    const session = ctx.state.session;
    const [orders, openTickets] = await Promise.all([
      listOrders({ tenantId: session.tenantId, limit: 20 }),
      countOpenTickets(session.tenantId),
    ]);
    return { data: { session, orders, openTickets } };
  },
});

export default define.page<typeof handler>(({ data }) => (
  <div class='shell'>
    <AccountHeader name={data.session.userId} roles={data.session.roles} />
    <main>
      <OrdersTable orders={data.orders} />
    </main>
    <aside>
      <TicketBadge open={data.openTickets} />
    </aside>
  </div>
));
```

This works, but the shape costs more as the page grows:

- **A region is not addressable.** A skeleton, a freshness window or a URL that re-renders only one
  box each need an identity the region does not have. `routes/_layout.tsx` does not help: a Fresh
  layout wraps a whole route, not the parts inside one.
- **Adding a region couples several sites.** The `Promise.all`, the returned data shape and the JSX
  change together, and their type is inferred from the whole handler.
- **Concurrency is bookkeeping.** Forget to add a third fetch to `Promise.all` and the page is
  silently serialised, with no per-region spans to show it.
- **One slow region is the whole page's latency.** Painting the fast regions first means inventing
  your own Suspense boundary, fallback and refresh path per page.

## The mechanism

Layers are descriptors, resolved together after the resource store is prepared. From
`packages/fresh/src/application/builders/define-page/runtime/mod.tsx`:

```ts
const layers = await Promise.all(
  config.layers.map((descriptor): Promise<RuntimeLayerResolution> => {
    // … memo key, span, loader …
  }),
);
```

Four properties follow from it:

1. **Layers run concurrently.** Resources are a sequential `for…of`; layers are a `Promise.all`.
   Loaders taking 40 ms and 10 ms interleave, so a page's layer cost is its slowest region, not the
   sum. Resources are for values whose *order* matters; layers are for regions whose order does not.
2. **Layers cannot read each other.** They start together, so layer B never observes layer A's
   result. `ctx.layerData` on a layer loader's context is `{}`. Two regions that need the same value
   declare it as a resource and both read it from there.
3. **Each layer is its own span.** Every resolution is wrapped as `page.layer.<id>` carrying
   `page.route`, `page.layer.id`, `page.layer.has_partial`, `page.layer.has_loader` and
   `page.layer.delivery`, so a trace shows which region is slow.
4. **The loader's return value decides whether the component renders.** The contract is
   `TProps | CacheEntryLike<TProps> | null | undefined`, and the runtime renders the component only
   when it received data:

```ts
const component = data ? renderLayerComponent(descriptor.component, data) : null;
```

{{ comp callout { type: "warning", title: "A layer with no loader renders nothing" } }}
<code>.withLayer('banner', Banner)</code>, with no third argument, produces empty output: there is no
loader, so no data, so the component is never constructed. A loader that returns <code>null</code> or
<code>undefined</code> behaves the same way. A static region needs a loader that returns an empty
object: <code>.withLayer('banner', Banner, { loader: () => ({}) })</code> renders
<code>&lt;Banner /&gt;</code> with no props. A <code>fallback</code> also fills the hole, with the
fallback rather than the component.
{{ /comp }}

## Two ways to configure a layer

The third argument is either the loader itself or a config object holding it. `resolveLayerConfig`
normalises the shorthand (`typeof layerConfig === 'function' ? { loader: layerConfig } : …`), so
these are the same layer:

```tsx
.withLayer('header', AccountHeader, async (ctx) => {
  const session = await ctx.resource('session');
  return { name: session.userId, roles: session.roles };
})

.withLayer('header', AccountHeader, {
  loader: async (ctx) => {
    const session = await ctx.resource('session');
    return { name: session.userId, roles: session.roles };
  },
})
```

Use the shorthand when the loader is all there is. A fallback, a stale window or a partial route
needs the object form.

| Field | Effect |
| --- | --- |
| `loader` | Produces the layer's props. Its absence means the layer renders nothing. |
| `fallback` | JSX or a zero-prop component, rendered when there is no data. |
| `partial` | A partial route URL, string or `(ctx) => string`. Turns the region into a deferred refreshable one. |
| `partialName` | The Fresh partial name; defaults to the layer id. |
| `params` | `(ctx) => Record<string, string>` merged over the request's search params on the partial URL. |
| `staleTime` | Freshness window in milliseconds, applied to a cache-entry-shaped loader result. |
| `staleReloadMode` | `'blocking'` drops stale data before render; `'background'` keeps it and asks the server to prewarm. |
| `policy` | A defer policy or profile for this region, overriding the page's `withPolicy()`. |
| `shouldReload` | `boolean` or `(ctx) => boolean`; `false` renders the region inline instead of deferring it. |
| `layerDeps` | `(ctx) => unknown` over `path` and `search`; participates in the per-render memo key. |
| `delivery` | `'blocking' \| 'defer' \| 'stream'`. |
| `gcTime` | Accepted by the type, **not read by the page runtime**. |

The `partial`, `partialName`, `staleTime`, `staleReloadMode`, `policy` and `params` fields configure
the deferred region. [Partials](/web-layer/partials/#deferred-loader-composition-the-page-runtime-drives-the-partial)
documents what the runtime builds from them, and
[Deferred and streaming UI](/web-layer/defer-streaming-ui/) documents the freshness behaviour they
select.

Two `delivery` behaviours to know:

- **`delivery: 'stream'` only streams on a `withStreaming()` page.** The condition is
  `config.streaming && descriptor.config.delivery === 'stream'`. On an ordinary page a `'stream'`
  layer neither streams nor defers: it renders inline, even if it declares a `partial`, and nothing
  warns you.
- **`delivery: 'blocking'` opts a region out of deferral** while keeping its `partial` declared. Use
  it when a region must be present in the first HTML.

## Cache-entry loaders

A loader may return a cache entry (`{ data, cachedAt }`) instead of props, and the runtime unwraps
it. The layer component receives `data`'s shape as its props, and `cachedAt` becomes the region's
freshness stamp:

```tsx
.withLayer('orders', OrdersTable, {
  loader: async (ctx) => await ordersQueries.list.getCachedEntry({ limit: ctx.search.limit }),
  partial: '/partials/orders/list',
  fallback: <OrdersSkeleton />,
  staleTime: 15_000,
  staleReloadMode: 'background',
})
```

That is why `getCachedEntry()` and `withLayer` fit together without an adapter. See
[The query bridge](/web-layer/query-bridge/#the-loader-half-a-read-not-a-fetch) for what that call
does and does not do.

The loader is a bare metadata read, not the
[action-then-metadata loader](/services-sdk/sdk/#service-discovery-query-client), because this layer
owns its refresh: on a miss or a stale entry the runtime prewarms the `partial` route, and that
route's loader runs the callable action that fetches and re-caches. A layer with no `partial` has no
such path; give it the action-then-metadata loader instead.

`staleReloadMode` decides what a *stale* entry means. With `'background'`, the stale data renders
and the server prewarms behind it. With `'blocking'`, the runtime discards the data before render,
so the region paints its fallback instead of known-stale content:

| `staleReloadMode` | Entry inside `staleTime` | Entry older than `staleTime` |
| --- | --- | --- |
| `'background'` (or unset) | renders the data | renders the data, server prewarms |
| `'blocking'` | renders the data | renders the **fallback** |

## Placing layers with `withLayout`

Without `withLayout`, layers render in declaration order. With it, you get a `slots` object keyed
by layer id and place each region where you want it:

```tsx
export const ordersPage = definePage()
  .withResource('session', async (ctx) => await loadSession(ctx.req))
  .withLayer('header', AccountHeader, async (ctx) => {
    const session = await ctx.resource('session');
    return { name: session.userId, roles: session.roles };
  })
  .withLayer('orders', OrdersTable, {
    loader: async (ctx) => {
      const session = await ctx.resource('session');
      return { orders: await listOrders({ tenantId: session.tenantId, limit: 20 }) };
    },
    fallback: <OrdersSkeleton />,
  })
  .withLayer('tickets', TicketBadge, {
    loader: async (ctx) => {
      const session = await ctx.resource('session');
      return { open: await countOpenTickets(session.tenantId) };
    },
  })
  .withLayout((slots) => (
    <div class='shell'>
      {slots.header()}
      <main>{slots.orders()}</main>
      <aside>{slots.tickets()}</aside>
    </div>
  ))
  .build('/orders');
```

`loadSession` runs once, before the layers; the three loaders then run together. Placement is
independent of declaration order: moving `{slots.tickets()}` above `{slots.header()}` changes the
markup and nothing else.

A slot is a function that returns the region's rendered element. It carries the resolved props on
`.data`, so a layout can read a layer's result without rendering it twice:

```tsx
.withLayout((slots) => (
  <section aria-label={`${slots.orders.data?.orders.length ?? 0} orders`}>
    {slots.orders()}
  </section>
))
```

`.data` is optional because a layer that produced no data has none. The layout's second argument is
the full page context; by the time the layout runs, `ctx.layerData` holds every layer's props, keyed
by id.

{{ comp callout { type: "note" } }}
<code>withLayout</code> does not replace <code>routes/_layout.tsx</code>. The Fresh layout is
route-tree chrome (nav bars, theme, the app shell) and still applies. <code>withLayout</code> places
the regions <em>inside</em> one page. A NetScript app normally has both.
{{ /comp }}

## Reading layers from a component

A routed `build()` returns a definition carrying `hooks`. They read the page context from inside
the render tree, without a prop path:

```tsx
export const ordersPage = definePage()
  .withLayer('orders', OrdersTable, {
    loader: async () => ({ orders: await listOrders({ tenantId: 't', limit: 20 }) }),
  })
  .build('/orders');

export function OrdersCount() {
  const orders = ordersPage.hooks.useRequiredLayer('orders');
  return <span>{orders.orders.length}</span>;
}
```

| Hook | Returns |
| --- | --- |
| `useLayers()` | `Partial<…>` of every layer's props |
| `useLayer(id)` | one layer's props, or `undefined` |
| `useRequiredLayer(id)` | one layer's props, throwing when absent |
| `useSlots()` | the slot map, callable per layer id |

`useRequiredLayer` throws
`definePage() could not resolve layer data for "<id>" in the current render tree.` when the layer
produced no data, not only when the id is wrong. The standalone forms (`useDefinePageLayer`,
`useRequiredDefinePageLayer`, `useDefinePageSlots`) are the same functions without the page's type
binding.

## Typing a layer component from its loader

When a loader lives in its own module, `InferDefinePageLayerLoaderProps` derives the component's
props from it:

```tsx
import type { InferDefinePageLayerLoaderProps } from '@netscript/fresh/builders';

export const ordersLoader = async (): Promise<{ orders: readonly Order[] }> => ({
  orders: await listOrders({ tenantId: 't', limit: 20 }),
});

type OrdersLayerProps = InferDefinePageLayerLoaderProps<typeof ordersLoader>;

export function OrdersPanel(props: OrdersLayerProps) {
  return <table>{props.orders.length}</table>;
}
```

A loader returning `{ data, cachedAt }` infers `data`'s shape, not the envelope, which matches what
the runtime passes. `null` and `undefined` are excluded, so the props type describes the rendered
case.

## What to watch for

- **Ids are identity, and duplicates collapse.** Layers are memoised per render on id, route state
  and `layerDeps`. Declare the same id twice and the second loader never runs; the first region's
  element is emitted twice.
- **`gcTime` is inert.** The type accepts it; the page runtime never reads it. Freshness comes from
  `staleTime`, `staleReloadMode` and the policy.
- **An empty object is data; `null` is not.** `{}` renders the component with no props. `null` renders
  the fallback, or nothing.
- **Concurrency means no ordering.** If one region must run after another, the earlier value is a
  resource, not a layer.
- **Fallbacks are not universal.** A deferred or streamed region without a `fallback` gets a default
  `aria-busy` placeholder; a plain inline region without one renders nothing when its loader returns
  empty.
- **The `delivery` span attribute misreports its default.** The span records
  `delivery ?? 'blocking'` while the defer decision reads `delivery ?? 'defer'`, so a region that
  omits `delivery` and declares a `partial` defers but traces as `blocking`. Behaviour is correct;
  read `page.layer.has_partial` alongside the attribute.

## Next steps

Continue with [Partials](/web-layer/partials/) to see what a layer's `partial` config builds. See
also [Deferred and streaming UI](/web-layer/defer-streaming-ui/) for the freshness policies and
[Response shaping](/web-layer/response/) for what runs after the layers resolve.
