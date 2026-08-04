---
layout: layouts/base.vto
title: Layers, layout, and slots
templateEngine: [vento, md]
order: 16
---

# Layers, layout, and slots

A dashboard page is a header, a table, a stats strip, and a side panel. Four regions, four different
data needs, four different acceptable latencies. Written as one route handler they become one
function with one await budget and one props bag — and the slowest of the four decides when any of
them paints.

`withLayer(id, Component, config)` splits that page back into the regions it visually already is.
Each layer names itself, loads its own props, and can carry its own fallback, freshness window, and
refresh route. `withLayout(slots => …)` then places them. The two facts worth internalising up front
are that **layers resolve concurrently** and that **they cannot see each other** — which is precisely
why [request-scoped resources](/web-layer/resources/) exist alongside them.

The builder-chain overview lives in [Pages and the define-page builder](/web-layer/builders/); this
page assumes it.

## What bare Fresh makes you write

Fresh 2 gives a route one handler and one component. Regions are a convention you maintain, not a
thing the framework knows about:

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

Nothing here is wrong, and `Promise.all` is the right tool — the point is what the shape costs as the
page grows.

**A region is not addressable.** There is no name to hang anything on. A skeleton for the slow one, a
freshness window, a URL that can re-render only that box: each of those needs an identity the page
does not have. `routes/_layout.tsx` does not help, because a Fresh layout receives a single
`{ Component }` and wraps it — it is chrome around a whole route, not a placement grid for the parts
inside one.

**Adding a region is a three-file edit.** The handler's `Promise.all` tuple, the destructuring, the
props bag, and the JSX all change together, and the type that ties them is inferred from the handler
rather than declared per region.

**Concurrency is bookkeeping.** Two fetches overlap because you wrote `Promise.all`. Add a third and
forget, and you have silently serialised the page — with no trace to say so, because there are no
per-region spans to compare.

**One slow region is the whole page's latency.** The handler resolves or it does not. Painting the
fast three while the fourth is still loading means reaching for Suspense and inventing your own
boundary, fallback, and refresh path per page.

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

Four properties follow from that one line, and they are the whole model.

**1. Layers run concurrently.** Resources are a sequential `for…of`; layers are a `Promise.all`. Two
loaders taking 40 ms and 10 ms interleave — the second finishes first — so a page's layer cost is its
slowest region, not the sum. This is the exact inverse of the resource contract, and the split is
deliberate: resources are for values whose *order* matters, layers for regions whose order does not.

**2. Layers cannot read each other.** Because they start together, there is no moment at which layer
B could observe layer A's result. `ctx.layerData` exists on a layer loader's context and is `{}` for
the whole of it. Two regions that need the same value declare it as a resource and both read it from
there; that is the division of labour the two APIs are for.

**3. Each layer is its own span.** Every resolution is wrapped as `page.layer.<id>` carrying
`page.route`, `page.layer.id`, `page.layer.has_partial`, `page.layer.has_loader`, and
`page.layer.delivery` — so "which region is slow" is a trace question, not a bisection.

**4. The loader's return value decides whether the component renders at all.** The contract is
`TProps | CacheEntryLike<TProps> | null | undefined`, and the runtime renders the component only when
it received data:

```ts
const component = data ? renderLayerComponent(descriptor.component, data) : null;
```

That is a sharper rule than it looks, and it has one genuinely surprising consequence.

{{ comp callout { type: "warning", title: "A layer with no loader renders nothing" } }}
<code>.withLayer('banner', Banner)</code> — no third argument — produces empty output. There is no
loader, so there is no data, so the component is never constructed. The same is true of a loader that
returns <code>null</code> or <code>undefined</code>. A static region needs a loader that returns an
empty object: <code>.withLayer('banner', Banner, { loader: () => ({}) })</code> renders
<code>&lt;Banner /&gt;</code> with no props. Declaring a <code>fallback</code> also fills the hole —
with the fallback, not the component.
{{ /comp }}

## Two ways to configure a layer

The third argument is either the loader itself or a config object holding it. `resolveLayerConfig`
normalises the shorthand — `typeof layerConfig === 'function' ? { loader: layerConfig } : …` — so
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

Use the shorthand when the loader is all there is. Everything else — a fallback, a stale window, a
partial route — needs the object form.

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

The `partial`, `partialName`, `staleTime`, `staleReloadMode`, `policy`, and `params` fields are the
deferred-region half; what the runtime builds out of them is documented in
[Partials](/web-layer/partials/#deferred-loader-composition-the-page-runtime-drives-the-partial), and
the freshness behaviour they select is [Deferred and streaming UI](/web-layer/defer-streaming-ui/).

Two behaviours are worth knowing before you reach for `delivery`:

- **`delivery: 'stream'` only streams on a `withStreaming()` page.** The condition is
  `config.streaming && descriptor.config.delivery === 'stream'`. On an ordinary page a `'stream'`
  layer does not stream *and* does not defer — it renders inline, even if it also declares a
  `partial`. There is no warning.
- **`delivery: 'blocking'` opts a region out of deferral** while keeping its `partial` declared, which
  is the switch to reach for when a region must be present in the first HTML.

## Cached data goes in and props come out

A loader may return a cache entry — `{ data, cachedAt }` — instead of props, and the runtime unwraps
it. The layer component still receives `data`'s shape as its props; `cachedAt` becomes the region's
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

This is why `getCachedEntry()` and `withLayer` fit together without an adapter — see
[The query bridge](/web-layer/query-bridge/#the-loader-half-a-read-not-a-fetch) for what that call
does and does not do.

`staleReloadMode` decides what a *stale* entry means. With `'background'`, the stale data still
renders and the server is asked to prewarm behind it. With `'blocking'`, the runtime discards the
data before render, so the region paints its fallback rather than known-stale content:

| `staleReloadMode` | Entry inside `staleTime` | Entry older than `staleTime` |
| --- | --- | --- |
| `'background'` (or unset) | renders the data | renders the data, server prewarms |
| `'blocking'` | renders the data | renders the **fallback** |

## The layout places what the layers produced

Without `withLayout`, layers render in declaration order, one after another. With it, you get a
`slots` object keyed by layer id and place them wherever you like:

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

`loadSession` runs once, before the layers; all three loaders then run together. Placement in the
layout is independent of declaration order — moving `{slots.tickets()}` above `{slots.header()}`
changes the markup and nothing else.

A slot is a function that returns the region's rendered element, and it carries the resolved props on
`.data` — so a layout can read a layer's result without rendering it twice:

```tsx
.withLayout((slots) => (
  <section aria-label={`${slots.orders.data?.orders.length ?? 0} orders`}>
    {slots.orders()}
  </section>
))
```

`.data` is optional because a layer that produced no data has none. The layout's second argument is
the full page context, and by the time the layout runs `ctx.layerData` is populated with every
layer's props — the same values, reached by id instead of through a slot.

{{ comp callout { type: "note" } }}
<code>withLayout</code> is not a replacement for <code>routes/_layout.tsx</code>. The Fresh layout is
route-tree chrome — nav bars, theme, the app shell — and still applies. <code>withLayout</code> places
the regions <em>inside</em> one page. A NetScript app normally has both.
{{ /comp }}

## Reading layers from a component

A routed `build()` returns a definition carrying `hooks`, and those hooks read the page context from
inside the render tree — no prop path:

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
`definePage() could not resolve layer data for "<id>" in the current render tree.` — which is what you
get when the layer produced no data, not only when the id is wrong. The standalone forms
(`useDefinePageLayer`, `useRequiredDefinePageLayer`, `useDefinePageSlots`) are the same functions
without the page's type binding; the full hook list is in
[Pages and the define-page builder](/web-layer/builders/).

## Typing a layer component from its loader

When a loader lives in its own module, `InferDefinePageLayerLoaderProps` derives the component's
props from it instead of restating them:

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

It understands the cache-entry case too: a loader returning `{ data, cachedAt }` infers `data`'s shape,
not the envelope, matching what the runtime actually passes. `null` and `undefined` are excluded, so
the props type describes the rendered case rather than the empty one.

## What to watch for

- **Ids are identity, and duplicates collapse.** Layers are memoised per render on id plus route
  state plus `layerDeps`. Declaring the same id twice means the second loader never runs and the first
  region's element is emitted twice.
- **`gcTime` is inert.** The type accepts it; the page runtime never reads it. Freshness comes from
  `staleTime`, `staleReloadMode`, and the policy.
- **An empty object is data; `null` is not.** `{}` renders the component with no props. `null` renders
  the fallback, or nothing.
- **Concurrency means no ordering.** If one region genuinely must run after another, the earlier value
  is a resource, not a layer.
- **Fallbacks are not universal.** A deferred or streamed region without a `fallback` gets a default
  `aria-busy` placeholder; a plain inline region without one renders nothing when its loader comes back
  empty.
- **The `delivery` span attribute reports a different default than the behaviour.** The span records
  `delivery ?? 'blocking'` while the defer decision reads `delivery ?? 'defer'`, so a region that
  omits `delivery` and declares a `partial` defers but traces as `blocking`. Read the
  `page.layer.has_partial` attribute alongside it.

## Related

{{ comp.cardsGrid({ columns: 3, cards: [
  { title: "Pages and the define-page builder", body: "The full builder chain this page zooms into.", href: "/web-layer/builders/" },
  { title: "Request-scoped resources", body: "The sequential half: values layers share.", href: "/web-layer/resources/" },
  { title: "Partials", body: "What a layer's partial config actually builds.", href: "/web-layer/partials/" },
  { title: "Deferred and streaming UI", body: "Policies, stale windows, and the refresh decision.", href: "/web-layer/defer-streaming-ui/" },
  { title: "Response shaping", body: "withMeta, withHeader, and withStatus after the layers resolve.", href: "/web-layer/response/" },
  { title: "Live dashboard tutorial", body: "Three layers and a layout, end to end.", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" }
] }) }}

See the [Web Layer overview](/web-layer/) for the full pillar map.
