---
layout: layouts/base.vto
title: SDK client and cache-first query
templateEngine: [vento, md]
prev: { label: "2 · Contract to service", href: "/tutorials/live-dashboard/02-contract-to-service/" }
next: { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" }
---

# SDK client and cache-first query

In chapter 2 you served an `orders.list` read-model on port **3002**. Now you will read it from the
Fresh app. The SDK gives you a typed client built from the same contract, and a query factory that
wraps every procedure in a KV-backed stale-while-revalidate cache — so the dashboard serves fast and
refreshes in the background.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/live-dashboard/01-scaffold/" },
  { label: "2 · Contract to service", href: "/tutorials/live-dashboard/02-contract-to-service/" },
  { label: "3 · Cache-first query", href: "/tutorials/live-dashboard/03-sdk-cache-first-query/" },
  { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" },
  { label: "5 · Live stream", href: "/tutorials/live-dashboard/05-live-stream/" },
  { label: "6 · Deploy", href: "/tutorials/live-dashboard/06-deploy/" }
] }) }}

## What you will build

A single module, `apps/dashboard/lib/api-clients.ts`, that exports a typed `ordersClient` and a
`baseQueries.orders` query utility. The client is derived from `typeof ordersContract`, so calling
`ordersClient.list({ … })` is type-checked against the contract you wrote in chapter 2. The query
factory adds per-procedure helpers — `queryOptions()`, `clientKey()`, and the cache-first
`getCachedEntry()` — that chapters 4 and 5 build the page on.

## Before you begin

You should have completed [chapter 2](/tutorials/live-dashboard/02-contract-to-service/): the
`orders` service answering on **3002**, the database seeded, and `aspire start` up. Confirm the typed
read-model still returns data:

```sh
curl 'http://localhost:3002/api/v1/orders/list?limit=1&offset=0'
```

You should get one seeded order back. If `items` is empty, re-run `netscript db seed` from the
workspace root.

## Step 1 — Create the typed service client

`createServiceClient` from `@netscript/sdk/client` builds a client from a contract. The key fields:
the `contract` itself, and a `serviceName` that is the **discovery key** — how the client finds the
service's URL at call time. Create the clients module in your Fresh app:

```ts
// apps/dashboard/lib/api-clients.ts
import { ordersContract } from '@contracts';
import { createServiceClient } from '@netscript/sdk/client';
import { createQueryFactories } from '@netscript/sdk/query';

export const ordersClient = createServiceClient<typeof ordersContract>({
  contract: ordersContract,
  serviceName: 'orders',
});
```

`ordersClient.list(input)` now has the exact signature the contract declared — wrong input shape, or
reading a field the output does not have, is a compile error.

{{ comp callout { type: "note", title: "How serviceName resolves to a URL" } }}
You never hardcode <code>http://localhost:3002</code>. <code>serviceName: 'orders'</code> is resolved at call time from an Aspire-injected env var — server-side <code>services__orders__http__0</code>, and the browser mirror <code>VITE_services__orders__http__0</code> — via <code>getServiceUrl</code> in <code>@netscript/sdk/discovery</code>. Aspire sets those when you list <code>orders</code> as a reference; the client just reads them. Full mechanics in <a href="/how-to/discover-services/">Discover services</a>.
{{ /comp }}

## Step 2 — Add the cache-first query factory

A bare client calls the service every time. For a dashboard you want **cache-first**: serve the
last-known answer instantly, then revalidate in the background. `createQueryFactories` wraps each
procedure in exactly that — a KV-backed stale-while-revalidate layer. Add it to the same module:

```ts
// apps/dashboard/lib/api-clients.ts (add below the client)
// Server-side query factories — KV-backed stale-while-revalidate.
export const baseQueries = createQueryFactories({
  orders: { contract: ordersContract, client: ordersClient },
});

// App code reads the per-procedure utilities off the factory.
export const ordersQueryUtils = baseQueries.orders;
```

`baseQueries.orders` carries one entry per contract procedure (`list`, `getById`, `getStats`, …),
each a small object of typed helpers. The four you will use across the next chapters:

{{ comp.apiTable({
  caption: "Per-procedure query helpers (e.g. ordersQueryUtils.list)",
  rows: [
    { name: ".queryOptions(input)", type: "(input) => options", desc: "A TanStack Query options object (queryKey + queryFn) for the client island — chapter 4 passes it straight to useQuery." },
    { name: ".clientKey(input?)", type: "(input?) => key", desc: "The stable query key the client uses to read, write, and invalidate this procedure's cache." },
    { name: ".getCachedEntry(input)", type: "(input) => entry | undefined", desc: "Server-side cache-first read: returns { data, cachedAt } from the KV cache, or undefined on a cold cache. This is the page loader's fast path." },
    { name: ".key(input?)", type: "(input?) => key", desc: "The server-side KV cache key for the entry." }
  ]
}) }}

{{ comp callout { type: "tip", title: "Why KV, and why cache-first" } }}
The cache is backed by KV (Redis in your Aspire stack — the default <code>--cache-backend</code>, registered at the top of <code>main.ts</code> in chapter 1; <code>garnet</code> and <code>deno-kv</code> are alternatives). Cache-first means a page render does not block on the service: <code>getCachedEntry</code> returns immediately from KV when warm, and the stale entry refreshes in the background. A cold cache returns <code>undefined</code>, which the page handles with a skeleton — you wire that in chapter 4.
{{ /comp }}

## Step 3 — Understand the calling shapes

You now have two ways to read orders, for two different places in the stack:

- **Server, cache-first** — `await ordersQueryUtils.list.getCachedEntry(input)` inside a page loader.
  Returns `{ data, cachedAt }` from KV, or `undefined`. Used in chapter 4's `definePage` loaders.
- **Client, in an island** — `useQuery(ordersQueryUtils.list.queryOptions(input))` inside a Fresh
  island. Used in chapter 4's `QueryIsland` for client-side reads and refetch.

Both derive their types and their cache key from the *same* contract, so a server-rendered row and a
client-refetched row are guaranteed to be the same shape.

## Verify your progress

Type-check the workspace to prove the client and query factory line up with the contract:

```sh
deno task check
```

A clean check confirms `createServiceClient<typeof ordersContract>` and the query factory typed
themselves off your chapter-2 contract. To prove the discovery key resolves end to end, leave
`aspire start` up — the next chapter renders the page that calls through this client, and a missing
`services__orders__http__0` shows up there as a clear "Service URL not found" error.

- [ ] `apps/dashboard/lib/api-clients.ts` exports `ordersClient`, `baseQueries`, and
      `ordersQueryUtils`.
- [ ] `deno task check` is clean.
- [ ] You can name the four per-procedure helpers (`queryOptions`, `clientKey`, `getCachedEntry`,
      `key`) and where each runs.

## What you built

A typed `ordersClient` and a cache-first `ordersQueryUtils` query layer, both derived from the
chapter-2 contract, with service discovery resolving the URL for you. Next you will render the live
table: NetScript's `definePage` builder for the server shell, and a `QueryIsland` that hydrates
these query helpers in the browser.

{{ comp.nextPrev({ prev: { label: "2 · Contract to service", href: "/tutorials/live-dashboard/02-contract-to-service/" }, next: { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" } }) }}
