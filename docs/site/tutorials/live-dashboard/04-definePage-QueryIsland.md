---
layout: layouts/base.vto
title: The page builder and the query island
templateEngine: [vento, md]
prev: { label: "3 · Cache-first query", href: "/tutorials/live-dashboard/03-sdk-cache-first-query/" }
next: { label: "5 · Live stream", href: "/tutorials/live-dashboard/05-live-stream/" }
---

# The page builder and the query island

This is the heaviest chapter in the track, and the most rewarding. You will render the orders table
with NetScript's `definePage` builder — its **layer / partial / island** triad — and hydrate a
TanStack Query island so the table reads and mutates on the client. By the end the dashboard renders
instantly from cache and refetches in the background. We flag where the surface is
conceptually dense.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/live-dashboard/01-scaffold/" },
  { label: "2 · Contract to service", href: "/tutorials/live-dashboard/02-contract-to-service/" },
  { label: "3 · Cache-first query", href: "/tutorials/live-dashboard/03-sdk-cache-first-query/" },
  { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" },
  { label: "5 · Live stream", href: "/tutorials/live-dashboard/05-live-stream/" },
  { label: "6 · Deploy", href: "/tutorials/live-dashboard/06-deploy/" }
] }) }}

## What you will build

An `/dashboard/orders/` route that renders a filterable orders table — the screen the fulfillment
team keeps open. The server shell is a `definePage` page with a cache-first `list` layer; the
interactive part is a `QueryIsland` that reads through the chapter-3 query helpers with `useQuery`
and advances order status with an optimistic `useMutation`. Optimistic matters here: when a packer
marks an order `shipped`, the row must move instantly — a badge that lags invites clicking it twice,
and a double-advanced order is exactly the kind of quiet mistake this dashboard exists to prevent.
You end with a page that paints from KV cache on first byte and stays live on the client.

## Before you begin

You should have completed [chapter 3](/tutorials/live-dashboard/03-sdk-cache-first-query/):
`apps/dashboard/lib/api-clients.ts` exports `ordersClient`, `baseQueries`, and `ordersQueryUtils`,
and `deno task check` is clean. Confirm the query module is in place:

```sh
deno check apps/dashboard/lib/api-clients.ts --unstable-kv
```

A clean check means the typed client and query factory are ready to wire into a page.

## The mental model: layer / partial / island

Before any code, hold these three words apart — most of the chapter is just them working together:

{{ comp.apiTable({
  caption: "The definePage triad",
  rows: [
    { name: "Layer", type: "withLayer(name, Component, config)", desc: "A named region of the page. Each layer has its own server loader, its own fallback skeleton, and its own staleness window. The page is a composition of layers." },
    { name: "Partial", type: "partial + partialName on a layer", desc: "The Fresh partial route a layer re-renders through. It lets one layer refresh on the server without a full page navigation — the cache-first refresh path." },
    { name: "Island", type: "a layer whose Component is a Fresh island", desc: "An interactive layer that hydrates in the browser. Here it is the QueryIsland: client-side reads, refetch, and optimistic mutations." }
  ]
}) }}

A `definePage` page wires several layers into a layout, each fed by its own loader. The server
renders every layer from cache; the island layer then takes over interactivity in the browser.

## Step 1 — Declare the route contract

A NetScript route declares its own typed search params. `defineRouteContract` from
`@netscript/fresh/route` builds that schema; `paginationSearchSchema` and `fallback` give you safe
defaults for missing or malformed query strings. Create the route file:

```ts
// apps/dashboard/routes/(dashboard)/dashboard/orders/index.route.ts
import { defineRouteContract, fallback, paginationSearchSchema } from '@netscript/fresh/route';
import { z } from 'zod';

const ORDERS_SEARCH_SCHEMA = paginationSearchSchema({
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
}).extend({
  search: fallback(z.string(), ''),
  status: fallback(z.enum([
    'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'failed',
  ]).optional(), undefined),
});

export default defineRouteContract({ searchSchema: ORDERS_SEARCH_SCHEMA });

// The parsed shape every loader and island receives — page, limit, offset, sortBy,
// sortOrder, plus the search/status fields the schema extends with.
export type OrdersSearch = ReturnType<typeof ORDERS_SEARCH_SCHEMA.parse>;
```

`fallback(schema, default)` is the safety belt: a junk `?status=banana` resolves to the default
instead of throwing, so a hand-edited URL never 500s the page. This is the same
`paginationSearchSchema()` the framework uses site-wide — every route that paginates parses `limit`
and `offset` through it rather than reading `searchParams` by hand.

## Step 2 — Define the page and cache-first resource pipeline

The page reads data through request-scoped **resource factories**. `.withResource(name, factory)`
registers a value that is computed at most once per request, no matter how many layers ask for it.
That matters here because two layers want the same cached orders slice: the server-rendered `list`
table and the `ordersQuery` island seed. Declared as a resource, the KV read happens once and both
layers share it. Downstream resources may await upstream ones, so the prefetch step below builds on
the same typed search input — the resolution order, the shared store, and the dedup spans behind that
are in [Request-scoped resources](/web-layer/resources/):

```tsx
// apps/dashboard/routes/(dashboard)/dashboard/orders/index.tsx
import { definePage } from '@app/utils.ts';
import { dehydrateQueryClient } from '@netscript/fresh/query';
import { createNetScriptQueryClient } from '@netscript/sdk/query-client';
import { baseQueries, ordersQueryUtils } from '@app/lib/api-clients.ts';
import { routes } from '@app/router.ts';
import OrdersQueryIsland from './(_islands)/OrdersQueryIsland.tsx';
import StatsLayer from './(_components)/StatsLayer.tsx';
import { PlaygroundOrdersList, PlaygroundOrdersListSkeleton } from './(_components)/list.tsx';

export const ordersListPage = definePage()
  .withRoute(routes.dashboard.orders.$route)
  .withPolicy('balanced')
  .withTelemetry({ enabled: true, spanName: 'dashboard.orders.list' })
  // Read once per request; the list layer and the island layer both consume this.
  .withResource('ordersData', async (ctx) => {
    return await baseQueries.orders.list.getCachedEntry({
      limit: ctx.search.limit,
      offset: ctx.search.offset,
      status: ctx.search.status,
    });
  })
  .withResource('dehydratedQuery', async (ctx) => {
    const queryClient = createNetScriptQueryClient();
    await queryClient.prefetchQuery(ordersQueryUtils.list.queryOptions({
      limit: ctx.search.limit,
      offset: ctx.search.offset,
      status: ctx.search.status,
    }));
    return dehydrateQueryClient(queryClient);
  })
```

`definePage` comes from `@app/utils.ts`, not straight from `@netscript/fresh/builders`. Your scaffold
wrote that module in chapter 1 — a thin wrapper that calls the package builder with the app's `State`
type applied (`export function definePage() { return createDefinePage<State>(); }`), so every page in
the app shares one typed context. Import the package builder directly and you lose that binding.

`spanName: 'dashboard.orders.list'` is not decoration: every render of this page emits a span under
that name, and it shows up in the Aspire dashboard's traces view alongside the service call the
loader made. When the table feels slow, that trace is where you find out whether the time went to KV,
to the orders service, or to the render itself.

By defining `dehydratedQuery` as a shared resource, you prefetch orders on the server and serialise
the cache. It is sent to the client alongside the initial HTML, eliminating the browser refetch flash.

## Step 3 — Add layers and partials

Now compose the visual regions. You add the server-rendered table, the interactive query island, and
a stats panel loaded asynchronously through a deferred partial — then lay them out and `build()`. The
`partial` and `partialName` entries below are what turn a layer into a refreshable region;
[Partials](/web-layer/partials/) covers the partial route on the other end:

```tsx
// apps/dashboard/routes/(dashboard)/dashboard/orders/index.tsx (continued)
  .withLayer('list', PlaygroundOrdersList, {
    loader: async (ctx) => {
      const cachedEntry = await ctx.resource('ordersData');
      if (!cachedEntry) return undefined; // cold cache → fallback skeleton
      return { data: cachedEntry.data, cachedAt: cachedEntry.cachedAt };
    },
    partial: routes.partials.dashboard.orders.list.$route.href(),
    partialName: 'orders-list',
    fallback: <PlaygroundOrdersListSkeleton />,
    staleTime: 15_000,
    staleReloadMode: 'background',
  })
  .withLayer('ordersQuery', OrdersQueryIsland, {
    loader: async (ctx) => {
      // Same resource the list layer read — resolved once, shared here.
      const entry = await ctx.resource('ordersData');
      const dehydratedState = await ctx.resource('dehydratedQuery');
      return {
        dehydratedState,
        input: {
          limit: ctx.search.limit,
          offset: ctx.search.offset,
          status: ctx.search.status,
        },
        initialOrders: entry?.data,
        cachedAt: entry?.cachedAt,
      };
    },
    staleTime: 15_000,
    staleReloadMode: 'background',
  })
  .withLayer('stats', StatsLayer, {
    loader: (ctx) => {
      // Not awaited: the promise is handed to the layer and resolves in the background.
      const statsPromise = baseQueries.orders.getStats({ status: ctx.search.status });
      return { statsPromise };
    },
    partial: routes.partials.dashboard.orders.stats.$route.href(),
    partialName: 'orders-stats',
  })
  .withLayout((slots) => (
    <main class='ns-page-end'>
      <div class='ns-stack ns-stack--lg'>
        {slots.stats()}
        {slots.list()}
        {slots.ordersQuery()}
      </div>
    </main>
  ))
  .withMeta(() => ({
    title: 'Order Queue',
    description: 'Browse and manage orders in the live dashboard.',
  }))
  .build();

export const { handler, default: page } = ordersListPage;
export { page as default };
```

Read the builder one call at a time:

{{ comp.apiTable({
  caption: "definePage builder steps",
  rows: [
    { name: ".withRoute(route)", type: "route contract", desc: "Binds the typed search schema from Step 1. The loaders receive a typed search object." },
    { name: ".withPolicy('balanced')", type: "caching policy", desc: "The page's caching posture. 'balanced' serves cache-first and revalidates in the background." },
    { name: ".withTelemetry({ enabled, spanName })", type: "tracing", desc: "Wraps the page render in a named span that surfaces in the Aspire dashboard traces." },
    { name: ".withResource(name, factory)", type: "request-scoped value", desc: "Computes a value at most once per request. Layers await it with ctx.resource(name), so two layers reading the same slice cost one fetch." },
    { name: ".withLayer(name, Component, config)", type: "a named region", desc: "Adds a layer with its own loader, partial, fallback, and staleTime. Call it once per region." },
    { name: ".withLayout(slots => …)", type: "layout callback", desc: "Places each layer by calling slots.<name>(). The layout is plain JSX." },
    { name: ".withMeta(() => …)", type: "head metadata", desc: "Page title and description." },
    { name: ".build()", type: "finalize", desc: "Produces the page object: { handler, default } that Fresh serves." }
  ]
}) }}

{{ comp callout { type: "note", title: "This is the dense part — and it earns its weight" } }}
The layer config carries a lot: a <code>loader</code> (cache-first server read), a <code>partial</code> + <code>partialName</code> (the refresh route), a <code>fallback</code> (cold-cache skeleton), and <code>staleTime</code> + <code>staleReloadMode</code> (the staleness window and how it refreshes). It is more upfront ceremony than a plain Fresh route — the payoff is that each region renders from cache independently and refreshes without a full navigation. If you only need a static page, a plain Fresh route is lighter; reach for <code>definePage</code> when a region must be cache-first and self-refreshing, which a live table is. See <a href="/web-layer/">the Fresh meta-framework</a>.
{{ /comp }}

{{ comp callout { type: "tip", title: "Deferred-loader composition" } }}
Returning a promise like <code>statsPromise</code> lets the page's shell paint without waiting for stats. The stats region shows its fallback until the promise resolves. In the current non-streaming Fresh runtime, <code>Deferred</code> behaves as a Suspense-ready boundary; it becomes fully progressive — streaming the resolved block into the response — only once streaming delivery lands in Fresh.
{{ /comp }}

## Step 4 — Hydrate the QueryIsland client-side

The client-side island receives the server-prefetched query state as props. You call `hydrateFromDehydrated` during mount to warm up the client cache, allowing `useQuery` to resolve without hitting the network:

```tsx
// apps/dashboard/routes/(dashboard)/dashboard/orders/(_islands)/OrdersQueryIsland.tsx
import { useRef } from 'preact/hooks';
import {
  getIslandQueryClient,
  hydrateFromDehydrated,
  QueryIsland,
  useMutation,
  useQuery,
  useQueryClient,
} from '@netscript/fresh/query';
import { ordersQueryUtils } from '@app/lib/api-clients.ts';

function OrdersQueryInner(props) {
  const queryClient = useQueryClient();
  const currentKey = ordersQueryUtils.list.clientKey(props.input);
  const hydratedRef = useRef(false);

  // Warm the client cache from the server-dehydrated state, once, before first render.
  if (!hydratedRef.current && props.dehydratedState) {
    hydrateFromDehydrated(getIslandQueryClient(), props.dehydratedState);
    hydratedRef.current = true;
  }

  // Resolves instantly from the hydrated cache (no spinner, no flash)
  const { data: orders, isRefetching } = useQuery({
    ...ordersQueryUtils.list.queryOptions(props.input),
    initialData: props.initialOrders,
    staleTime: 15_000,
  });

  // Optimistic status advance — update the cache, roll back on error.
  const statusMutation = useMutation({
    ...ordersQueryUtils.update.mutationOptions(),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: currentKey });
      const previous = queryClient.getQueryData(currentKey);
      queryClient.setQueryData(currentKey, (prev) => applyStatus(prev, variables));
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(currentKey, ctx.previous);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ordersQueryUtils.list.clientKey() }),
  });

  const items = orders?.items ?? [];
  return <OrdersTable items={items} isRefetching={isRefetching} onAdvance={statusMutation.mutate} />;
}

export default function OrdersQueryIsland(props) {
  return (
    <QueryIsland>
      <OrdersQueryInner {...props} />
    </QueryIsland>
  );
}
```

One constraint makes this work: the hydrated entries land in the island's shared QueryClient under
the exact query keys the server used, so `useQuery` only benefits if `queryOptions(props.input)`
produces the same key the server prefetched. `initialData` itself comes from the explicit
`initialOrders` prop — it is the belt to hydration's suspenders, covering the case where the
dehydrated payload is absent. `clientKey(input)` is that same stable key, which is why the
mutation's optimistic writes land on exactly the rows the query is showing.

## Step 5 — Render the Deferred stats layer

To display the stats layer that loaded asynchronously, use the `<Deferred>` component. It acts as a suspense boundary, wrapping the promise and rendering a fallback placeholder while it resolves:

```tsx
// apps/dashboard/routes/(dashboard)/dashboard/orders/(_components)/StatsLayer.tsx
import { Deferred } from '@netscript/fresh/defer';

interface StatsProps {
  statsPromise: Promise<{ totalRevenue: number; ordersCount: number }>;
}

export default function StatsLayer(props: StatsProps) {
  return (
    <Deferred
      promise={props.statsPromise}
      fallback={<div class="ns-skeleton">Loading statistics...</div>}
    >
      {(data) => (
        <div class="ns-stats-grid">
          <div class="ns-card">
            <h4>Total Revenue</h4>
            <p>${data.totalRevenue}</p>
          </div>
          <div class="ns-card">
            <h4>Orders Count</h4>
            <p>{data.ordersCount}</p>
          </div>
        </div>
      )}
    </Deferred>
  );
}
```

## Verify your progress

Make sure `aspire start` is up, then open the route in a browser at `/dashboard/orders/`.

You need the app's port to do that, and there is no number to memorize: a scaffolded Fresh app pins
no host port, so Aspire allocates one at runtime. The [Aspire dashboard](/explanation/aspire/)
resource list is the authority — find the `dashboard` resource, click its endpoint, and append `/dashboard/orders/`.
You should see the orders table render
immediately — populated from KV cache, not a spinner — and a "Refreshing" indicator flicker as it
revalidates. Advancing an order's status should update its badge instantly. Type-check too:

```sh
deno task check
```

- [ ] `index.route.ts`, `index.tsx`, `(_components)/StatsLayer.tsx`, and
      `(_islands)/OrdersQueryIsland.tsx` all exist under
      `apps/dashboard/routes/(dashboard)/dashboard/orders/`.
- [ ] The page renders the orders table from cache on first paint (no spinner flash).
- [ ] Advancing a status updates the row optimistically.
- [ ] `deno task check` is clean.

{{ comp callout { type: "tip", title: "Table is empty or spinning forever?" } }}
A perpetually empty table usually means the KV cache is cold and the loader returned <code>undefined</code> with nothing to refetch — confirm <code>aspire start</code> is up so <code>services__orders__http__0</code> resolves, and that <code>netscript db seed</code> ran. The first request warms the cache; reload once.
{{ /comp }}

## What you built

A `definePage` orders page that renders cache-first through the layer/partial/island triad, plus a
hydrated `QueryIsland` that reads with `useQuery` and mutates optimistically with `useMutation` —
all keyed off the same contract-derived helpers. The table is live on the client. Next you make it
live from the *server*: rows pushed into an open page over a durable StreamDB.

{{ comp.nextPrev({ prev: { label: "3 · Cache-first query", href: "/tutorials/live-dashboard/03-sdk-cache-first-query/" }, next: { label: "5 · Live stream", href: "/tutorials/live-dashboard/05-live-stream/" } }) }}
