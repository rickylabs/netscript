---
layout: layouts/base.vto
title: Partials
templateEngine: [vento, md]
order: 14
---

# Partials

This page covers partials: routes that render one region of a page instead of the whole document.
Fresh swaps that region into an already-rendered page without a full navigation. NetScript uses
partials for **navigation that repaints part of the screen** and for **deferred regions that fill in
or refresh after first paint**.

Three pieces do the work: `definePartial()` (or `defineStatsPartial()`) declares the partial route,
`route.withPartial()` types the link that targets it, and a layer's `partial` config makes the page
runtime drive it.

## Compared with bare Fresh

To refresh one region in Fresh 2, you author a second route module that:

- exports `config = { skipAppWrapper: true, skipInheritedLayouts: true }`, so the app shell and
  layouts do not wrap the region a second time;
- wraps its output in `<Partial name="orders-list">` from `fresh/runtime`, with a name that matches
  the `Partial` boundary in the page;
- is targeted by an anchor or form carrying `f-partial="/partials/orders/list?limit=20"`, with an
  ancestor marked `f-client-nav` so Fresh intercepts the navigation;
- catches and renders its own error fallback, because an uncaught loader failure takes Fresh's
  normal route error path.

```tsx
// routes/partials/orders/list.tsx — bare Fresh
import { Partial } from 'fresh/runtime';

export const config = { skipAppWrapper: true, skipInheritedLayouts: true };

export default async function OrdersListPartial(ctx) {
  try {
    const orders = await listOrders({ limit: Number(ctx.url.searchParams.get('limit') ?? '20') });
    return (
      <Partial name='orders-list'>
        <OrdersTable orders={orders} />
      </Partial>
    );
  } catch (error) {
    return (
      <Partial name='orders-list'>
        <p class='error'>Could not load orders.</p>
      </Partial>
    );
  }
}
```

Then, in the page:

```tsx
<a href='/orders?limit=20' f-partial='/partials/orders/list?limit=20'>Next page</a>
```

Nothing checks that the `'orders-list'` strings in the partial and the page agree. The `f-partial`
URL is concatenated, so a renamed route file fails silently: Fresh falls back to a full navigation or
the region never updates. Each partial invents its own error fallback, and the loader's params come
out of `URLSearchParams` as `string | null`.

## `definePartial`: the route in one definition

`definePartial()` turns that file into a declaration. It returns a `DefinedPartialRoute` carrying
`config` (your Fresh route config merged with the framework defaults, which win), an optional
`handler`, `page`, and a `default`-export-compatible alias of `page`.

```tsx
export const ordersListPartial = definePartial<{ orders: Order[] }, PartialCtx>({
  name: 'orders-list',
  loader: async (ctx) => {
    const limit = Number(ctx.url.searchParams.get('limit') ?? '20');
    return { orders: await listOrders({ limit }) };
  },
  component: OrdersTable,
  errorTitle: 'Orders are temporarily unavailable',
});

export const config = ordersListPartial.config;
export default ordersListPartial.page;
```

The `<Partial name>` boundary is emitted from `name`. The loader is wrapped in the framework's
`errorHandler`, so a throw becomes normalized `ErrorData` and the partial renders `ErrorDisplay`
inside the same boundary, which is still a valid partial swap. `errorTitle` overrides the default
title, `Failed to load ${name}`. `errorComponent` replaces the body of the shell and receives
`PageErrorPrimitives`: the normalized `error`, plus pre-resolved title, message, code, status, icon,
`isRetryable`, and the utility classes the default renderer uses.

`definePartial` does **not** type `ctx` (`TContext` is your app's route context) and does not know
the partial's own URL. The `name` and the route path stay two separately supplied facts; the next
section gives the path one typed source.

### `defineStatsPartial` for context-free regions

Counters, KPI strips and summary panels usually need no request context. `defineStatsPartial` is
`definePartial` with `loader` replaced by `query: () => Promise<TProps>`; the other options are the
same, and it delegates to `definePartial` internally.

```tsx
export const orderStatsPartial = defineStatsPartial<{ open: number }, PartialCtx>({
  name: 'order-stats',
  query: async () => ({ open: await countOpenOrders() }),
  component: OrderStats,
});
```

The scaffolded dashboard ships one in `routes/partials/examples/<service>-summary.tsx`, the smallest
complete partial in the codebase.

## `route.withPartial()`: one typed source for both URLs

Pair a page route reference with a partial route reference, and the pair builds both URLs from one
call:

```tsx
const ordersRoute = createRouteReference('/orders');
const ordersPartialRoute = createRouteReference('/partials/orders/list');
const paired = ordersRoute.withPartial(ordersPartialRoute);

const linkProps = paired.getLinkProps({});
// => { href: '/orders', 'f-partial': '/partials/orders/list', … }
```

`getLinkProps()` returns `PagePartialLinkProps`: the ordinary link props plus the `f-partial`
attribute, so both URLs come from typed route references instead of string literals. `href()` and
`partialHref()` return one URL each. Path and search params are supplied once and applied to both
sides; use `partialPath`, `partialSearch` and `partialPreserveSearchParams` when the partial's params
differ from the page's.

This centralizes URL construction; it does not track renames. The `createRouteReference` calls
above still hold pattern literals that go stale when the route file moves. With the Vite plugin, the
generated `routes` tree is derived from the filesystem, so `routes.partials.dashboard.orders.list`
stops existing when the file moves and every call site fails `deno check`. Prefer the generated
accessor where rename tracking matters. See [Routing and route contracts](/web-layer/route/).

## Deferred-loader composition: the page runtime drives the partial

A layer declared with a `partial` URL is not rendered inline. The runtime renders a `DeferPage`
region around it:

```tsx
const ordersPage = definePage()
  .withRoute(ordersRoute)
  .withPolicy('balanced')
  .withLayer('list', OrdersTable, {
    loader: async () => ({ orders: await listOrders({ limit: 20 }) }),
    partial: ordersPartialRoute.href(),
    partialName: 'orders-list',
    fallback: <OrdersTableSkeleton />,
    staleTime: 15_000,
    staleReloadMode: 'background',
  })
  .build();
```

What the runtime derives from that config, in
`packages/fresh/src/application/builders/define-page/runtime/mod.tsx`:

| You write | The runtime supplies |
| --- | --- |
| `partial` (string or `(ctx) => string`) | `DeferPage`'s `partial`; its `action` is the current `ctx.url.pathname` |
| `partialName` | `DeferPage`'s `name`, **defaulting to the layer id** when omitted |
| `fallback` | rendered whenever the loader produced no data |
| `staleTime` + a cache-entry-shaped loader result | `cachedAt` and the freshness window |
| `staleReloadMode: 'background'` | `staleStrategy: 'server-prewarm'` |
| `policy` | falls back to the page's `withPolicy()` when the layer omits it |
| `params` | the partial-only search params, merged over the request's |

The layer id, the partial name and the route reference sit in one layer configuration, and the
region gains cache-aware refresh without a `DeferPage` in your page module. Nothing checks that
`partialName` matches the `name` you passed to `definePartial`. A layer with `delivery: 'stream'`
opts out of this path; a layer with no `partial` renders inline.

A partial refresh is a request, not a connection: the region is re-fetched through the partial
endpoint, and nothing is pushed. The policy profiles that decide when that happens, and the transport
underneath, are documented in [Deferred and streaming UI](/web-layer/defer-streaming-ui/).

## What to watch for

- **Framework defaults win the config merge.** `skipAppWrapper` and `skipInheritedLayouts` are
  applied *after* your `config`, so you cannot turn them off through `definePartial`.
- **`name` is still a string.** `definePartial` emits it once, and the page side matches it against
  `partialName` (or the layer id). The types do not close this coupling.
- **Export `page` (or `default`), not the object.** A partial route module exports `config` and the
  renderer; exporting the `DefinedPartialRoute` itself gives Fresh nothing to render.
- **`defineStatsPartial` receives no context.** If the panel needs the request (a tenant, a session,
  a search param), use `definePartial`.
- **A partial can carry a `handler`.** Pass one through when the region also needs to accept a
  non-`GET` method; it is attached to the route unchanged.

## Next steps

Continue with [Deferred and streaming UI](/web-layer/defer-streaming-ui/) for the policies that decide
when a deferred partial refreshes. See also [Diagnostics and error surfaces](/web-layer/error/) for
the error primitives a partial shell renders.
