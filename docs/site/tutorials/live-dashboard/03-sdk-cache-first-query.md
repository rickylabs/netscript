---
layout: layouts/base.vto
title: SDK client and cache-first query
templateEngine: [vento, md]
prev: { label: "2 · Contract to service", href: "/tutorials/live-dashboard/02-contract-to-service/" }
next: { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" }
---

# SDK client and cache-first query

In this chapter you read the chapter 2 `orders.list` read-model from the Fresh app. The SDK gives you
a typed client built from the same contract, and a query factory that wraps every procedure in a
KV-backed stale-while-revalidate (SWR) cache: the queue paints from the last-known rows, even while
the `orders` service redeploys, and refreshes in the background. The SWR behavior belongs to the
callable procedure action (for example, `await ordersQueries.list(input)`); `getCachedEntry(input)`
is a separate KV-only metadata read and never schedules a refresh.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/live-dashboard/01-scaffold/" },
  { label: "2 · Contract to service", href: "/tutorials/live-dashboard/02-contract-to-service/" },
  { label: "3 · Cache-first query", href: "/tutorials/live-dashboard/03-sdk-cache-first-query/" },
  { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" },
  { label: "5 · Live stream", href: "/tutorials/live-dashboard/05-live-stream/" },
  { label: "6 · Deploy", href: "/tutorials/live-dashboard/06-deploy/" }
] }) }}

## What you will build

One module, `apps/dashboard/lib/orders.ts`, that exports a typed `ordersClient` and an
`ordersQueries` query utility. The client is derived from `typeof ordersContract`, so
`ordersClient.list({ … })` is type-checked against the chapter 2 contract. The query factory adds
per-procedure helpers (`queryOptions()`, `clientKey()` and the KV-only `getCachedEntry()` metadata
read) that chapters 4 and 5 build the page on.

## Before you begin

You need [chapter 2](/tutorials/live-dashboard/02-contract-to-service/)'s `orders` service answering
on **3002**, the database seeded, and `aspire start` up. Confirm the read-model returns data:

```sh
curl 'http://localhost:3002/api/v1/orders/list?limit=1&offset=0'
```

You get one seeded order back. If `items` is empty, re-run `netscript db seed` from the workspace
root.

## Step 1 — Create the typed service client

`createServiceClient` from `@netscript/sdk/client` builds a client from a contract. It takes the
`contract` and a `serviceName`, the **discovery key** the client uses to find the service's URL at
call time. Create the module in your Fresh app:

```ts
// apps/dashboard/lib/orders.ts
import { ordersContract } from '@my-dashboard/contracts';
import { createServiceClient } from '@netscript/sdk/client';
import { createQueryFactories } from '@netscript/sdk/query';

export const ordersClient = createServiceClient<typeof ordersContract>({
  contract: ordersContract,
  serviceName: 'orders',
});
```

`ordersClient.list(input)` has the exact signature the contract declares: a wrong input shape, or
reading a field the output doesn't have, is a compile error.

{{ comp callout { type: "note", title: "How serviceName resolves to a URL" } }}
You never hardcode <code>http://localhost:3002</code>. <code>getServiceUrl</code> in
<code>@netscript/sdk/discovery</code> resolves <code>serviceName: 'orders'</code> at call time from an
Aspire-injected environment variable: <code>services__orders__http__0</code> on the server and its
browser mirror <code>VITE_services__orders__http__0</code>. Aspire sets them when you list
<code>orders</code> as a reference. See
<a href="/services-sdk/how-to/discover-services/">Discover services</a>.
{{ /comp }}

## Step 2 — Add the cache-first query factory

A bare client calls the service every time. A dashboard wants **cache-first** reads: serve the
last-known answer immediately, then revalidate in the background. `createQueryFactories` wraps each
procedure in a KV-backed stale-while-revalidate layer. Add it to the same module:

```ts
// apps/dashboard/lib/orders.ts (add below the client)
// Server-side query factories — callable actions use KV-backed stale-while-revalidate.
export const ordersQueries = createQueryFactories({
  orders: { contract: ordersContract, client: ordersClient },
}).orders;
```

The callable procedure action owns that stale policy. `getCachedEntry(input)` only inspects the KV
value and timestamp; it doesn't run the policy.

`ordersQueries` has one entry per contract procedure (`list`, `getById`, `getStats`, …), each a
small object of typed helpers. The next chapters use four of them:

{{ comp.apiTable({
  caption: "Per-procedure query helpers (e.g. ordersQueries.list)",
  rows: [
    { name: ".queryOptions(input)", type: "(input) => options", desc: "A TanStack Query options object (queryKey + queryFn) for the client island — chapter 4 passes it straight to useQuery." },
    { name: ".clientKey(input?)", type: "(input?) => key", desc: "The stable query key the client uses to read, write, and invalidate this procedure's cache." },
    { name: ".getCachedEntry(input)", type: "(input) => Promise<entry | null>", desc: "Server-side KV metadata read: resolves to { data, cachedAt } from KV, or null on a cold cache. It does not evaluate staleness or fetch." },
    { name: ".key(input)", type: "(input) => key", desc: "The server-side KV cache key for the entry." }
  ]
}) }}

{{ comp callout { type: "tip", title: "Where the cache lives" } }}
The cache is backed by KV: Redis in your Aspire stack, the default <code>--cache-backend</code>,
registered at the top of <code>main.ts</code> in chapter 1 (<code>garnet</code> and
<code>deno-kv</code> are alternatives). <code>getCachedEntry</code> is a pure KV read: it returns
<code>{ data, cachedAt }</code> on a warm cache and <code>null</code> on a cold one. It doesn't
evaluate staleness or start revalidation; the callable action or the page/client policy does that
explicitly.
{{ /comp }}

## Step 3 — Understand the calling shapes

You now have two ways to read orders, for two places in the stack:

- **Server, policy-aware cache read** — first run
  `const data = await ordersQueries.list(input, { preferFreshOnStale: true })`, then read
  `const entry = await ordersQueries.list.getCachedEntry(input)` and return
  `entry ?? { data, cachedAt: Date.now() }`. The metadata read alone never fetches or revalidates.
  The default callable action without the flag is the non-blocking SWR path; this loader chooses
  `preferFreshOnStale: true` so `cachedAt` reflects the refreshed value.
- **Client, in an island** — `useQuery(ordersQueries.list.queryOptions(input))` inside a Fresh
  island. Used in chapter 4's `QueryIsland` for client-side reads and refetch.

Both take their types and their cache key from the *same* contract, so a server-rendered row and a
client-refetched row have the same shape.

## Verify your progress

Type-check the workspace to confirm the client and query factory line up with the contract:

```sh
deno task check
```

A clean check confirms `createServiceClient<typeof ordersContract>` and the query factory take their
types from your chapter 2 contract. Leave `aspire start` up: the next chapter renders the page that
calls through this client, and a missing `services__orders__http__0` shows up there as a
"Service URL not found" error.

- [ ] `apps/dashboard/lib/orders.ts` exports `ordersClient` and `ordersQueries`.
- [ ] `deno task check` is clean.
- [ ] `deno check apps/dashboard/lib/orders.ts --unstable-kv` passes on its own — the module
      compiles against the chapter-2 contract with no other file in play.

## What you built

A typed `ordersClient` and a cache-first `ordersQueries` query layer, both derived from the chapter 2
contract, with service discovery resolving the URL. Next, you render the table with NetScript's
`definePage` builder and a `QueryIsland` that hydrates these query helpers in the browser.

{{ comp.nextPrev({ prev: { label: "2 · Contract to service", href: "/tutorials/live-dashboard/02-contract-to-service/" }, next: { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" } }) }}
