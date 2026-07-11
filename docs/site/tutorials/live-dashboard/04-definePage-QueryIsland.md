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

## Step 2 — Write the cache-first page loader

The page reads the cache, not the service. Add a small loader that pulls the orders island's initial
data from KV through the chapter-3 helpers. Because the page binds the Step 1 contract, the loader is
handed a typed `search` object — `limit`, `offset`, and `status` are already parsed and defaulted, so
there is no `searchParams.get(...)` to write. A cold cache returns `undefined`, which the page renders
as a skeleton:

```ts
// apps/dashboard/routes/(dashboard)/dashboard/orders/(_shared)/query-loaders.ts
import { baseQueries } from '@app/lib/api-clients.ts';
import type { OrdersSearch } from '../index.route.ts';

export async function ordersQueryLoader({ search }: { search: OrdersSearch }) {
  const input = { limit: search.limit, offset: search.offset, status: search.status };
  const entry = await baseQueries.orders.list.getCachedEntry(input);

  return {
    initialOrders: entry?.data,
    cachedAt: entry?.cachedAt,
    input,
  };
}
```

The loader returns three things the island needs: the cached `data`, the `cachedAt` timestamp (so
the client knows how stale the seed is), and the `input` (so the client can refetch the same slice).
The `search` object is the contract's payoff — the same typed slice the Step 3 layer loader reads, so
both loaders agree on what `limit`/`offset` mean without either one touching the raw query string.

## Step 3 — Compose the page with definePage

`definePage` from `@netscript/fresh/builders` is a fluent builder. You bind the route, set a caching
policy, add layers, lay them out, and `build()`. Here is the orders page reduced to the live-table
spine:

```tsx
// apps/dashboard/routes/(dashboard)/dashboard/orders/index.tsx
import { definePage } from '@netscript/fresh/builders';
import { routes } from '@app/router.ts';
import OrdersQueryIsland from './(_islands)/OrdersQueryIsland.tsx';
import { ordersQueryLoader } from './(_shared)/query-loaders.ts';
import { PlaygroundOrdersList, PlaygroundOrdersListSkeleton } from './(_components)/list.tsx';
import { baseQueries } from '@app/lib/api-clients.ts';

export const ordersListPage = definePage()
  .withRoute(routes.dashboard.orders.$route)
  .withPolicy('balanced')
  .withTelemetry({ enabled: true, spanName: 'dashboard.orders.list' })
  .withLayer('list', PlaygroundOrdersList, {
    loader: async ({ url, search }) => {
      const input = { limit: search.limit, offset: search.offset, status: search.status };
      const cachedEntry = await baseQueries.orders.list.getCachedEntry(input);
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
    loader: ordersQueryLoader,
    staleTime: 15_000,
    staleReloadMode: 'background',
  })
  .withLayout((slots) => (
    <main class='ns-page-end'>
      <div class='ns-stack ns-stack--lg'>
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
    { name: ".withLayer(name, Component, config)", type: "a named region", desc: "Adds a layer with its own loader, partial, fallback, and staleTime. Call it once per region." },
    { name: ".withLayout(slots => …)", type: "layout callback", desc: "Places each layer by calling slots.<name>(). The layout is plain JSX." },
    { name: ".withMeta(() => …)", type: "head metadata", desc: "Page title and description." },
    { name: ".build()", type: "finalize", desc: "Produces the page object: { handler, default } that Fresh serves." }
  ]
}) }}

{{ comp callout { type: "note", title: "This is the dense part — and it earns its weight" } }}
The layer config carries a lot: a <code>loader</code> (cache-first server read), a <code>partial</code> + <code>partialName</code> (the refresh route), a <code>fallback</code> (cold-cache skeleton), and <code>staleTime</code> + <code>staleReloadMode</code> (the staleness window and how it refreshes). It is more upfront ceremony than a plain Fresh route — the payoff is that each region renders from cache independently and refreshes without a full navigation. If you only need a static page, a plain Fresh route is lighter; reach for <code>definePage</code> when a region must be cache-first and self-refreshing, which a live table is. See <a href="/web-layer/">the Fresh meta-framework</a>.
{{ /comp }}

## Step 4 — Hydrate the QueryIsland

The server shell paints from cache; the island makes it interactive. `QueryIsland` from
`@netscript/fresh/query` provides the TanStack Query context; inside it, `useQuery` reads through the
chapter-3 `queryOptions`, seeded with the loader's `initialData` so there is no client refetch flash.
`useMutation` advances an order's status optimistically:

```tsx
// apps/dashboard/routes/(dashboard)/dashboard/orders/(_islands)/OrdersQueryIsland.tsx
import { QueryIsland, useMutation, useQuery, useQueryClient } from '@netscript/fresh/query';
import { ordersQueryUtils } from '@app/lib/api-clients.ts';

function OrdersQueryInner(props) {
  const queryClient = useQueryClient();
  const currentKey = ordersQueryUtils.list.clientKey(props.input);

  // Server-seeded read: no client refetch flash on first paint.
  const { data: orders, isRefetching } = useQuery({
    ...ordersQueryUtils.list.queryOptions(props.input),
    initialData: props.initialOrders,
    initialDataUpdatedAt: props.cachedAt,
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

The key moves:

- **`initialData` + `initialDataUpdatedAt`** seed `useQuery` from the server loader, so the table is
  populated on first paint and TanStack treats it as fresh until `staleTime` elapses.
- **`clientKey(input)`** is the same stable key from chapter 3 — `useMutation` reads, writes, and
  invalidates the cache through it, so the optimistic update lands on exactly the rows `useQuery`
  is showing.
- **`onMutate` / `onError`** are the optimistic pattern: apply the change immediately, snapshot the
  previous data, and roll back if the server rejects it.

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
