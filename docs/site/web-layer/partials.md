---
layout: layouts/base.vto
title: Partials
templateEngine: [vento, md]
order: 14
---

# Partials

A partial is a route that renders one region of a page instead of the whole document. Fresh can swap
that region into an already-rendered page without a full navigation, which makes partials the unit
NetScript uses for two different jobs: **navigation that only repaints part of the screen**, and
**deferred regions that fill in or refresh after first paint**.

Both jobs run through the same three pieces: `definePartial()` (or `defineStatsPartial()`) declares
the partial route, `route.withPartial()` types the link that targets it, and a layer's `partial`
config makes the page runtime drive it for you. This page is about those three, and about the seam
between them.

## What bare Fresh makes you write

Fresh 2's partial mechanics are real but low-level. To refresh one region you author a second route
module that:

- exports `config = { skipAppWrapper: true, skipInheritedLayouts: true }`, so the region renders
  without the app shell and layouts wrapping it a second time;
- wraps its output in `<Partial name="orders-list">` from `fresh/runtime`, where the name must match
  the `Partial` boundary already present in the page you are replacing content inside;
- is targeted by an anchor or form carrying `f-partial="/partials/orders/list?limit=20"`, with an
  ancestor marked `f-client-nav` so Fresh intercepts the navigation;
- decides its own error surface: a partial is its own response, so an uncaught loader failure takes
  Fresh's normal route error path. If the region needs a fallback of its own, this route is where you
  catch and render it — and every partial that wants one invents it again.

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

This version has four independent couplings. The string `'orders-list'` appears in the partial and in
the page, and nothing checks that they agree. The `f-partial` URL is built by concatenation, so a
renamed route file fails silently — Fresh falls back to a full navigation, or the region simply never
updates, and neither is a compile error. The error surface is per-file, so twelve partials that each
want a fallback drift into twelve error designs. The loader's params come out of `URLSearchParams` as
`string | null`.

## `definePartial`: the route in one definition

`definePartial()` collapses that file into a declaration. It returns a `DefinedPartialRoute` carrying
four things: `config` (your Fresh route config merged with the framework defaults — note the defaults
win), an optional `handler`, `page`, and a `default`-export-compatible alias of `page`.

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

The `<Partial name>` boundary is emitted for you from `name`. The loader is wrapped in the
framework's `errorHandler`, so a throw becomes normalized `ErrorData` rather than an exception in the
response, and the partial renders `ErrorDisplay` inside the same boundary — still a valid partial
swap, not a broken region. `errorTitle` overrides the default, which is literally
`Failed to load ${name}`; `errorComponent` replaces the body of the shell and receives
`PageErrorPrimitives` (the normalized `error`, plus pre-resolved title, message, code, status, icon,
`isRetryable`, and the utility classes the default renderer uses).

The two things `definePartial` does **not** do: it does not type `ctx` for you — `TContext` is
whatever your app's route context is — and it does not know the partial's own URL. The `name` and the
route path remain two independently supplied facts; the next section is about giving the path a
single typed source, and the name coupling survives it.

### `defineStatsPartial` for context-free regions

Counters, KPI strips, and summary panels usually need no request context at all. `defineStatsPartial`
is `definePartial` with `loader` swapped for `query: () => Promise<TProps>` — the same options
otherwise, and it delegates straight to `definePartial` internally.

```tsx
export const orderStatsPartial = defineStatsPartial<{ open: number }, PartialCtx>({
  name: 'order-stats',
  query: async () => ({ open: await countOpenOrders() }),
  component: OrderStats,
});
```

The scaffolded dashboard ships one of these — `routes/partials/examples/<service>-summary.tsx` — and
it is the smallest complete partial in the codebase, worth reading once.

## `route.withPartial()`: one typed source for both URLs

A page route reference and a partial route reference can be paired, and the pair builds both URLs
from one call:

```tsx
const ordersRoute = createRouteReference('/orders');
const ordersPartialRoute = createRouteReference('/partials/orders/list');
const paired = ordersRoute.withPartial(ordersPartialRoute);

const linkProps = paired.getLinkProps({});
// => { href: '/orders', 'f-partial': '/partials/orders/list', … }
```

`getLinkProps()` returns `PagePartialLinkProps` — the ordinary link props plus the `f-partial`
attribute — so the anchor's two URLs come from two typed route references instead of two string
literals. `href()` and `partialHref()` are available separately when you need one of them alone.
Path and search params are supplied once and applied to both sides, with `partialPath`,
`partialSearch`, and `partialPreserveSearchParams` available when the partial's params legitimately
differ from the page's.

What this buys is centralized URL construction with typed params: one reference owns the pattern,
and every link that targets the partial is built from it. It is not automatic rename tracking — the
`createRouteReference` calls above still hold route-pattern literals, and moving the route file
leaves them stale. That job belongs to the generated accessors: with the Vite plugin, the app's
`routes` tree is derived from the filesystem, so `routes.partials.dashboard.orders.list` stops
existing when the file moves and every call site fails `deno check`. Prefer the generated accessor
where rename tracking matters, and keep `createRouteReference` for routes outside the generated tree.
Route references, contracts, and the schema helpers behind them are covered in
[Routing and route contracts](/web-layer/route/).

## Deferred-loader composition: the page runtime drives the partial

The third piece is the one that removes the most wiring. A layer declared with a `partial` URL is not
rendered inline — the runtime renders a `DeferPage` region around it:

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

What the runtime derives from that config, verbatim from
`packages/fresh/src/application/builders/define-page/runtime/mod.tsx`:

| You write | The runtime supplies |
| --- | --- |
| `partial` (string or `(ctx) => string`) | `DeferPage`'s `partial`; its `action` is the current `ctx.url.pathname` |
| `partialName` | `DeferPage`'s `name` — **defaulting to the layer id** when omitted |
| `fallback` | rendered whenever the loader produced no data |
| `staleTime` + a cache-entry-shaped loader result | `cachedAt` and the freshness window |
| `staleReloadMode: 'background'` | `staleStrategy: 'server-prewarm'` |
| `policy` | falls back to the page's `withPolicy()` when the layer omits it |
| `params` | the partial-only search params, merged over the request's |

The layer id, the partial name, and the route reference are colocated in one layer configuration,
and the region gains cache-aware refresh behaviour without a `DeferPage` ever appearing in your page
module. Colocated is not verified, though: nothing checks that `partialName` matches the `name` you
passed to `definePartial`. A layer with `delivery: 'stream'` opts out of this path; a layer with no
`partial` renders inline as usual.

The freshness half — the four policy profiles, `resolveDeferPolicy`, and the submit/skip decision
matrix in `decideDeferClientAction` — is documented in
[Deferred and streaming UI](/web-layer/defer-streaming-ui/). The short version: `balanced` skips a
client refresh while the server is already prewarming, `background-refresh` refreshes even on a fresh
cache, and the profile you name is the one thing that makes two regions behave the same way on
purpose.

## What the runtime actually does today

Two runtime boundaries prevent "deferred" from implying server push or progressive delivery.

**Deferral is Suspense-ready, not streaming.** `Deferred` wraps a promise in a Suspense boundary; in
the current non-streaming Fresh runtime it behaves as a Suspense-ready boundary and becomes fully
progressive once streaming delivery lands. Code written against it today keeps working when that
happens — but today the response is not being streamed in pieces.

**A partial refresh is a request, not a connection.** `DeferPage` renders a hidden form in an island;
when policy says refresh, the island calls `requestSubmit()` and the region is re-fetched through the
partial endpoint. Server prewarm is the same thing from the other side — a fire-and-forget `fetch` of
the partial URL, tagged `X-Defer-Prewarm: 1` so the prewarm render skips its own prewarm and
telemetry. There is no push channel here. A region that must stay current *after* it settles — a
feed, a chat transcript, a live counter — belongs to the streams client and live queries instead; see
[Deferred and streaming UI](/web-layer/defer-streaming-ui/).

## What to watch for

- **Framework defaults win the config merge.** `skipAppWrapper` and `skipInheritedLayouts` are
  applied *after* your `config`, so you cannot turn them off through `definePartial`.
- **`name` is still a string.** It is emitted once by `definePartial` and matched against
  `partialName` (or the layer id) on the page side — the one coupling the types do not close.
- **Export `page` (or `default`), not the object.** A partial route module exports `config` and the
  renderer; exporting the `DefinedPartialRoute` itself gives Fresh nothing to render.
- **`defineStatsPartial` receives no context.** If the panel needs the request — a tenant, a session,
  a search param — it is a `definePartial`, not a stats partial.
- **A partial can carry a `handler`.** Pass one through when the region also needs to accept a
  non-`GET` method; it is attached to the route unchanged.

## Related

{{ comp.cardsGrid({ columns: 3, cards: [
  { title: "Pages and the define-page builder", body: "definePartial in the context of the full chain.", href: "/web-layer/builders/" },
  { title: "Deferred and streaming UI", body: "Defer policies, profiles, and the streams client.", href: "/web-layer/defer-streaming-ui/" },
  { title: "Routing and route contracts", body: "Route references, pairing, and typed link props.", href: "/web-layer/route/" },
  { title: "Request-scoped resources", body: "Share one loaded value across every region.", href: "/web-layer/resources/" },
  { title: "Diagnostics and error surfaces", body: "The error primitives a partial shell renders.", href: "/web-layer/error/" },
  { title: "Live dashboard tutorial", body: "A page whose list layer refreshes through a partial.", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" }
] }) }}

See the [Web Layer overview](/web-layer/) for the full pillar map.
