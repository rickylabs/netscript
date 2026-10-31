---
layout: layouts/base.vto
title: The page builder and the query island
templateEngine: [vento, md]
prev: { label: "3 · Cache-first query", href: "/tutorials/live-dashboard/03-sdk-cache-first-query/" }
next: { label: "5 · Live stream", href: "/tutorials/live-dashboard/05-live-stream/" }
---

# The page builder and the query island

In this chapter you render the orders table with NetScript's `definePage` builder and its
**layer / partial / island** triad, and hydrate a TanStack Query island so the table reads and
mutates on the client. At the end the dashboard renders from cache and refetches in the background.
This is the longest chapter in the track.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/live-dashboard/01-scaffold/" },
  { label: "2 · Contract to service", href: "/tutorials/live-dashboard/02-contract-to-service/" },
  { label: "3 · Cache-first query", href: "/tutorials/live-dashboard/03-sdk-cache-first-query/" },
  { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" },
  { label: "5 · Live stream", href: "/tutorials/live-dashboard/05-live-stream/" },
  { label: "6 · Deploy", href: "/tutorials/live-dashboard/06-deploy/" }
] }) }}

## What you will build

A `/dashboard/orders/` route that renders a filterable orders table. The server shell is a
`definePage` page with a cache-first `list` layer. The interactive part is a `QueryIsland` that
reads through the chapter 3 query helpers with `useQuery` and advances order status with an
optimistic `useMutation`, so a row changes as soon as you act on it instead of inviting a second
click. The page paints from the KV cache and stays live on the client.

## Before you begin

You need [chapter 3](/tutorials/live-dashboard/03-sdk-cache-first-query/)'s
`apps/dashboard/lib/orders.ts`, exporting `ordersClient` and `ordersQueries`, with
`deno task check` clean. Confirm the query module is in place:

```sh
deno check apps/dashboard/lib/orders.ts --unstable-kv
```

A clean check means the typed client and query factory are ready for a page.

## The mental model: layer / partial / island

Three terms carry this chapter:

{{ comp.apiTable({
  caption: "The definePage triad",
  rows: [
    { name: "Layer", type: "withLayer(name, Component, config)", desc: "A named region of the page. Each layer has its own server loader, its own fallback skeleton, and its own staleness window. The page is a composition of layers." },
    { name: "Partial", type: "partial + partialName on a layer", desc: "The Fresh partial route a layer re-renders through. It lets one layer refresh on the server without a full page navigation — the cache-first refresh path." },
    { name: "Island", type: "a layer whose Component is a Fresh island", desc: "An interactive layer that hydrates in the browser. Here it is the QueryIsland: client-side reads, refetch, and optimistic mutations." }
  ]
}) }}

A `definePage` page places several layers in a layout, each fed by its own loader. The server renders
every layer from cache, and the island layer then handles interactivity in the browser.

## Step 1 — Declare the route contract

A NetScript route declares its own typed search params. `defineRouteContract` from
`@netscript/fresh/route` builds the schema, and `paginationSearchSchema` and `fallback` give safe
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

With `fallback(schema, default)`, a junk `?status=banana` resolves to the default instead of
throwing, so a hand-edited URL never returns a 500. Every NetScript route that paginates parses
`limit` and `offset` through the same `paginationSearchSchema()` instead of reading `searchParams` by
hand.

## Step 2 — Define the page and cache-first resource pipeline

The page reads data through request-scoped **resource factories**: `.withResource(name, factory)`
computes a value once per render, however many layers ask for it. The server-rendered `list` table
and the `ordersQuery` island seed need the same cached orders slice, so the KV read happens once and
both share it. [Request-scoped resources](/web-layer/resources/) covers resolution order, the shared
store and dedup spans:

```tsx
// apps/dashboard/routes/(dashboard)/dashboard/orders/index.tsx
import { definePage } from '@app/utils.ts';
import { dehydrateQueryClient } from '@netscript/fresh/query';
import { createNetScriptQueryClient } from '@netscript/sdk/query-client';
import { ordersQueries } from '@app/lib/orders.ts';
import { routes } from '@app/router.ts';
import OrdersQueryIsland from './(_islands)/OrdersQueryIsland.tsx';
import StatsLayer from './(_components)/StatsLayer.tsx';
import { PlaygroundOrdersList, PlaygroundOrdersListSkeleton } from './(_components)/list.tsx';

export const ordersListPage = definePage()
  .withRoute(routes.dashboard.orders.$route)
  .withPolicy('balanced')
  .withTelemetry({ enabled: true, spanName: 'dashboard.orders.list' })
  // Read once per request; the list and island layers share it.
  .withResource('ordersData', async (ctx) => {
    return await ordersQueries.list.getCachedEntry({
      limit: ctx.search.limit,
      offset: ctx.search.offset,
      status: ctx.search.status,
    });
  })
  .withResource('dehydratedQuery', async (ctx) => {
    const queryClient = createNetScriptQueryClient();
    await queryClient.prefetchQuery(ordersQueries.list.queryOptions({
      limit: ctx.search.limit,
      offset: ctx.search.offset,
      status: ctx.search.status,
    }));
    return dehydrateQueryClient(queryClient);
  })
```

`ordersData` is a bare `getCachedEntry()` read, not chapter 3's action-then-metadata loader: on a
miss or stale entry the runtime prewarms the `list` layer's `partial` route, whose loader runs the
callable action. On a cold or expired cache the page still waits on `orders`, because it awaits the
island's `dehydratedQuery` prefetch, which runs that action.

`definePage` comes from `@app/utils.ts`, not directly from `@netscript/fresh/builders`. The scaffold
wrote that module in chapter 1 as a thin wrapper that applies the app's `State` type
(`export function definePage() { return createDefinePage<State>(); }`), so every page shares one
typed context. Importing the package builder directly loses that binding.

`spanName: 'dashboard.orders.list'` names the span every render emits in the Aspire dashboard's
traces view, next to the service calls it made. When the table is slow, that trace shows whether the
time went to KV, the orders service or the render.

`dehydratedQuery` prefetches orders on the server and serializes the cache into the initial HTML, so
the island doesn't refetch on hydrate.

## Step 3 — Add layers and partials

Now add the visual regions: the server-rendered table, the interactive query island, and a stats
panel loaded asynchronously through a deferred partial. Then lay them out and call `build()`. The
three layers resolve concurrently, so the page costs its slowest region, not the sum.
[Layers, layout, and slots](/web-layer/layers/) covers the loader contract, the full layer config and
slot placement. The `partial` and `partialName` entries turn a layer into a refreshable region;
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
      const statsPromise = ordersQueries.getStats({ status: ctx.search.status });
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

The builder, one call at a time:

{{ comp.apiTable({
  caption: "definePage builder steps",
  rows: [
    { name: ".withRoute(route)", type: "route contract", desc: "Binds the typed search schema from Step 1. The loaders receive a typed search object." },
    { name: ".withPolicy('balanced')", type: "caching policy", desc: "The page's caching posture. 'balanced' serves cache-first and revalidates in the background." },
    { name: ".withTelemetry({ enabled, spanName })", type: "tracing", desc: "Wraps the page render in a named span that surfaces in the Aspire dashboard traces." },
    { name: ".withResource(name, factory)", type: "request-scoped value", desc: "Computes a value once per page render. Layers read it with ctx.resource(name), so two layers reading the same slice cost one fetch." },
    { name: ".withLayer(name, Component, config)", type: "a named region", desc: "Adds a layer with its own loader, partial, fallback, and staleTime. Call it once per region." },
    { name: ".withLayout(slots => …)", type: "layout callback", desc: "Places each layer by calling slots.<name>(). The layout is plain JSX." },
    { name: ".withMeta(() => …)", type: "head metadata", desc: "Page title and description." },
    { name: ".build()", type: "finalize", desc: "Produces the page object: { handler, default } that Fresh serves." }
  ]
}) }}

{{ comp callout { type: "note", title: "When to use definePage" } }}
A layer config holds a <code>loader</code> (cache-first server read), a <code>partial</code> and
<code>partialName</code> (the refresh route), a <code>fallback</code> (cold-cache skeleton), and
<code>staleTime</code> and <code>staleReloadMode</code> (the staleness window and how it refreshes).
That is more setup than a plain Fresh route, and in return each region renders from cache
independently and refreshes without a full navigation. For a static page, a plain Fresh route is
lighter; use <code>definePage</code> when a region must be cache-first and self-refreshing, as a live
table is. See <a href="/web-layer/">the Fresh meta-framework</a>.
<a href="/web-layer/defer-streaming-ui/">Deferred and streaming UI</a> explains how
<code>'balanced'</code>, <code>staleTime</code> and <code>staleReloadMode</code> choose between
prewarming on the server, refreshing on the client, or neither.
{{ /comp }}

{{ comp callout { type: "tip", title: "Deferred loaders" } }}
Returning a promise like <code>statsPromise</code> lets the page shell paint without waiting for the
stats; the stats region shows its fallback until the promise resolves. The current Fresh runtime
doesn't stream responses, so <code>Deferred</code> acts as a Suspense-ready boundary rather than
streaming the resolved block into the response.
{{ /comp }}

## Step 4 — Hydrate the QueryIsland client-side

The island receives the server-prefetched query state as props. Call `hydrateFromDehydrated` during
mount to warm the client cache, so `useQuery` resolves without a network call:

```tsx
// apps/dashboard/routes/(dashboard)/dashboard/orders/(_islands)/OrdersQueryIsland.tsx
import { useRef } from 'preact/hooks';
import {
  getIslandQueryClient,
  hydrateFromDehydrated,
  invalidateServerQueryCache,
  QueryIsland,
  useMutation,
  useQuery,
  useQueryClient,
} from '@netscript/fresh/query';
import { ordersQueries } from '@app/lib/orders.ts';

function OrdersQueryInner(props) {
  const queryClient = useQueryClient();
  const listOptions = ordersQueries.list.queryOptions(props.input);
  const currentKey = listOptions.queryKey;
  const hydratedRef = useRef(false);

  // Warm the client cache from the server-dehydrated state, once, before first render.
  if (!hydratedRef.current && props.dehydratedState) {
    hydrateFromDehydrated(getIslandQueryClient(), props.dehydratedState);
    hydratedRef.current = true;
  }

  // Resolves instantly from the hydrated cache (no spinner, no flash)
  const { data: orders, isRefetching } = useQuery({
    ...listOptions,
    initialData: props.initialOrders,
    initialDataUpdatedAt: props.cachedAt,
    staleTime: 15_000,
  });

  // Optimistic status advance — update the cache, roll back on error.
  const statusMutation = useMutation({
    ...ordersQueries.update.mutationOptions(),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: currentKey });
      const previous = queryClient.getQueryData(currentKey);
      queryClient.setQueryData(currentKey, (prev) => applyStatus(prev, variables));
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(currentKey, ctx.previous);
    },
    onSuccess: async () => {
      // Invalidate the server tier first, so a reload cannot repaint stale KV data.
      await invalidateServerQueryCache(ordersQueries.list.key(props.input));
      await queryClient.invalidateQueries({ queryKey: ordersQueries.list.clientKey() });
    },
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

The hydrated entries land in the island's shared QueryClient under the exact query keys the server
used, so `useQuery` benefits only if `queryOptions(props.input)` produces the key the server
prefetched. `initialData` comes from the explicit `initialOrders` prop and wins the mount-time
handoff even if the shared client already holds an older entry; `initialDataUpdatedAt` keeps the KV
entry's real age. Later optimistic writes and refetches take precedence over that seed.

The mutation clears two cache tiers in order:

1. `invalidateServerQueryCache()` calls the JSON-only route that `defineFreshApp()` registers
   automatically, using `.key(props.input)` for the serialized KV key.
2. Only after that succeeds, `invalidateQueries()` refreshes the browser tier.

You need no API route of your own, and a reload between the two steps can't read around the entry
just invalidated.

## Step 5 — Render the Deferred stats layer

Render the asynchronously loaded stats with the `<Deferred>` component. It is a suspense boundary
that wraps the promise and renders a fallback placeholder until it resolves:

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

With `aspire start` up, open `/dashboard/orders/` in a browser. A scaffolded Fresh app pins no host
port, so Aspire allocates one at runtime: in the [Aspire dashboard](/explanation/aspire/) resource
list, open the `dashboard` resource's endpoint and append `/dashboard/orders/`.

The orders table renders from the KV cache without a spinner, and a "Refreshing" indicator flickers
as it revalidates. Advancing an order's status updates its badge at once. Then type-check:

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
A table that stays empty usually means the KV cache is cold and the loader returned
<code>undefined</code> with nothing to refetch. Confirm <code>aspire start</code> is up, so
<code>services__orders__http__0</code> resolves, and that <code>netscript db seed</code> ran. The
first request warms the cache; reload once.
{{ /comp }}

## What you built

A `definePage` orders page that renders cache-first through layers, partials and an island, and a
hydrated `QueryIsland` that reads with `useQuery` and mutates optimistically with `useMutation`, all
keyed off the same contract-derived helpers. The table is live on the client. Next, the *server*
pushes rows into an open page over a durable StreamDB.
