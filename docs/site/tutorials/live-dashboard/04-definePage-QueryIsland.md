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

The page reads data through request-scoped **resource factories**. Using `.withResource()`, you declare factories that resolve credentials once, de-duplicate queries across layers, and fetch cache-first data. The page builder resolves these sequentially, letting downstream resources depend on upstream values:

```tsx
// apps/dashboard/routes/(dashboard)/dashboard/orders/index.tsx
import { definePage } from '@netscript/fresh/builders';
import { z } from 'zod';
import {
  dehydrateQueryClient,
  hydrateFromDehydrated,
  QueryIsland,
  useMutation,
  useQuery,
  useQueryClient,
} from '@netscript/fresh/query';
import { Deferred } from '@netscript/fresh/defer';
import { createNetScriptQueryClient } from '@netscript/sdk/query-client';
import { baseQueries, ordersQueryUtils } from '@app/lib/api-clients.ts';
import { resolveAuthSession } from '@app/lib/auth.ts';
import { routes } from '@app/router.ts';
import OrdersQueryIsland from './(_islands)/OrdersQueryIsland.tsx';
import StatsLayer from './(_components)/StatsLayer.tsx';
import StatusForm from './(_components)/StatusForm.tsx';
import { PlaygroundOrdersList, PlaygroundOrdersListSkeleton } from './(_components)/list.tsx';

export const ordersListPage = definePage()
  .withRoute(routes.dashboard.orders.$route)
  .withPolicy('balanced')
  .withTelemetry({ enabled: true, spanName: 'dashboard.orders.list' })
  
  // 1. Cross-layer Request-Dedup: Authenticate request once per page lifecycle
  .withResource('auth', async (ctx) => {
    return await resolveAuthSession(ctx.headers);
  })

  // 2. Per-layer Refinement Idiom: Use auth tenant context to scope queries safely
  .withResource('ordersData', async (ctx) => {
    const auth = await ctx.resource('auth');
    if (!auth) throw new Response('Unauthorized', { status: 401 });
    return await baseQueries.orders.list.getCachedEntry({
      limit: ctx.search.limit,
      offset: ctx.search.offset,
      tenantId: auth.tenantId,
    });
  })

  // 3. Server-side Query Prefetch: Initialize QueryClient and dehydrate it
  .withResource('dehydratedQuery', async (ctx) => {
    const auth = await ctx.resource('auth');
    if (!auth) throw new Response('Unauthorized', { status: 401 });
    
    const queryClient = createNetScriptQueryClient();
    const queryOptions = ordersQueryUtils.list.queryOptions({
      limit: ctx.search.limit,
      offset: ctx.search.offset,
      tenantId: auth.tenantId,
    });
    
    await queryClient.prefetchQuery(queryOptions);
    return dehydrateQueryClient(queryClient);
  })
```

By defining `dehydratedQuery` as a shared resource, you prefetch orders on the server and serialise the cache. It is sent to the client alongside the initial HTML, eliminating the browser refetch flash.

## Step 3 — Add layers, form handlers, and partials

Compose your page visual layers, forms, and partial layout slots. You add the interactive query table, a status-update form, and a stats panel loaded asynchronously via a deferred partial:

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
      const auth = await ctx.resource('auth');
      const entry = await ctx.resource('ordersData');
      const dehydratedState = await ctx.resource('dehydratedQuery');
      return {
        dehydratedState,
        input: {
          limit: ctx.search.limit,
          offset: ctx.search.offset,
          tenantId: auth.tenantId,
        },
        initialOrders: entry?.data,
        cachedAt: entry?.cachedAt,
      };
    },
    staleTime: 15_000,
    staleReloadMode: 'background',
  })

  // 4. Form integration: Typed server-bound mutation with validation
  .withForm('statusForm', StatusForm, {
    schema: z.object({ id: z.string(), status: z.string() }),
    mutate: async (input) => {
      return await baseQueries.orders.updateStatus.mutate(input);
    },
    onSuccess: () => {
      return { message: 'Order status updated successfully' };
    },
  })

  // 5. Partials & Deferred-Loader composition: Load stats asynchronously in the background
  .withLayer('stats', StatsLayer, {
    loader: async (ctx) => {
      const auth = await ctx.resource('auth');
      // Returns a Promise that resolves in the background
      const statsPromise = baseQueries.orders.getStats.getCachedEntry({ tenantId: auth.tenantId });
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
        {slots.statusForm()}
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

{{ comp callout { type: "tip", title: "Deferred-loader composition" } }}
Returning a promise like <code>statsPromise</code> allows the page's shell to paint instantly. The stats section remains suspended with a placeholder until the promise resolves, at which point the partial streams the completed block to the browser.
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

  // 6. Client Hydration: Load server-dehydrated state before rendering
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
    ...ordersQueryUtils.updateStatus.mutationOptions(),
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

The key moves:

- **`dehydrateQueryClient` / `hydrateFromDehydrated`** pass query state seamlessly from server to browser, warming the cache before first render.
- **`initialData`** seeds `useQuery` from the hydrated cache, ensuring instant first paint.
- **`clientKey(input)`** allows `useMutation` to target cache slots predictably.

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

Make sure `aspire start` is up, then open the route in a browser:

```
http://localhost:8010/dashboard/orders/
```

(The Fresh app's port is `:8010` in the Aspire stack; confirm the exact port in the
[dashboard](/explanation/aspire/) resource list.) You should see the orders table render
immediately — populated from KV cache, not a spinner — and a "Refreshing" indicator flicker as it
revalidates. Advancing an order's status should update its badge instantly. Type-check too:

```sh
deno task check
```

- [ ] `index.route.ts`, `(_shared)/query-loaders.ts`, `index.tsx`, and `(_islands)/OrdersQueryIsland.tsx`
      all exist under `apps/dashboard/routes/(dashboard)/dashboard/orders/`.
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
live from the *server*: real-time row updates over a durable StreamDB.

{{ comp.nextPrev({ prev: { label: "3 · Cache-first query", href: "/tutorials/live-dashboard/03-sdk-cache-first-query/" }, next: { label: "5 · Live stream", href: "/tutorials/live-dashboard/05-live-stream/" } }) }}
