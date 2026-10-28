---
layout: layouts/base.vto
title: The query bridge
templateEngine: [vento, md]
order: 15
---

# The query bridge

This page explains how a server loader's cached data reaches an island without a refetch. The
loader reads from a KV cache on the server to render HTML; the island reads from a TanStack
`QueryClient` in the browser. One `createQueryFactories` call gives every contract procedure both a
server-side cache-first read and a client-side TanStack options object, typed from the same contract.
The sections below show how the two halves connect, where their keys differ on purpose, and what the
type system checks.

The island hooks themselves (`QueryIsland`, `useQuery`, mutations, polling) are covered in
[Data loading and the query cache](/web-layer/query/).

## What bare Fresh makes you write

Fresh already carries the loader's value into the island: island props are serializable, and Fresh
handles their transport and escaping. Without a shared factory, the handoff looks like this:

```tsx no-check:counter-example intentionally omits bare Fresh setup
// routes/orders.tsx — bare Fresh
export const handler = define.handlers({
  async GET(ctx) {
    const res = await fetch('http://orders:3002/api/v1/orders/list?limit=20&offset=0');
    const orders = await res.json() as { items: Order[] }; // hand-declared
    return { data: { orders } };
  },
});

export default define.page<typeof handler>(({ data }) => <OrdersIsland initialOrders={data.orders} />);
```

```tsx no-check:counter-example intentionally omits bare TanStack setup
// islands/OrdersIsland.tsx — bare Fresh
export default function OrdersIsland({ initialOrders }: { initialOrders: { items: Order[] } }) {
  const query = useQuery({
    queryKey: ['orders', 20, 0], // invented here; the loader never agreed to it
    queryFn: () => fetch('/api/v1/orders/list?limit=20&offset=0').then((r) => r.json()),
    initialData: initialOrders,
  });

  return <OrdersTable orders={query.data?.items ?? []} />;
}
```

Three seams stay uncoordinated:

- **Response type.** The handler asserts `{ items: Order[] }`, the island's prop type asserts it
  again, and nothing checks either against the service.
- **Request input.** `?limit=20&offset=0` appears in the handler and in the island's `queryFn`, so a
  changed default produces two different result sets on one page.
- **Query key.** `['orders', 20, 0]` exists only in the island. A second island, or a mutation that
  invalidates the orders list, has to guess the same literal. A mismatch shows a spinner where a
  table should be, or a stale table that never refreshes.

The handler's `fetch` and the island's `fetch` are also two independent round trips to the same
service, with no shared freshness policy.

## One factory, two halves

`createQueryFactory(resource, contract, client, defaultOptions?)`, usually reached through
`createQueryFactories({ … })`, attaches helpers to every procedure on the contract. The helpers split
by environment:

| Method | Runs where | What it does |
| --- | --- | --- |
| `orders.list(input, options?)` | server | cache-first read through the KV provider (SWR) |
| `.prefetch(input, options?)` | server | warm the KV entry, fire-and-forget |
| `.getCachedData(input)` | server | KV read, data only, `null` when cold |
| `.getCachedEntry(input)` | server | KV read, `{ data, cachedAt }` or `null` |
| `.invalidate()` | server | drop the KV entries under this resource/action prefix |
| `.key(input)` | anywhere | the server-tier cache key |
| `.queryOptions(input, options?)` | server or client | TanStack options whose `queryFn` uses KV on the server and the typed client in the browser |
| `.mutationOptions(options?)` | client | `{ mutationKey, mutationFn }` plus your callbacks |
| `.clientKey(input?)` | client | the client-tier key for a truthy input; the action prefix otherwise |

The server methods go through `getCacheProvider()`. `queryOptions()` is the bridge: its `queryFn`
uses that provider when server bootstrap has registered one, and falls back to the typed client in
the browser, where no provider exists. The key, mutation-option and client-key helpers are pure
functions of the resource name, action name and input. A provider-backed method called from client
code fails with this error:

The angle-bracket token `<resolved import.meta.url>` stands for the install-specific resolved module URL.

```text
[NetScript SDK] Cache provider not initialized in module <resolved import.meta.url>. Call `setCacheProvider(cacheQuery)` during server bootstrap. `defineFreshApp()` does this for NetScript-managed Fresh apps. If initialization already ran, one possibility is that two `@netscript/sdk` module instances are loaded; check that `@netscript/fresh`, its subpaths, and `@netscript/sdk` resolve to one version. If you see this in the browser, a server-only cache method (query, prefetch, getCachedData, getCachedEntry, invalidate) was called from client-side code — use queryOptions/mutationOptions/clientKey instead.
```

## Two key tiers, deliberately not merged

The server key and the client key for the same call have different shapes:

```ts no-check:pseudocode compares key shapes rather than defining runnable values
// server tier — packages/sdk/src/ports/query-key.ts
createActionQueryKey(resource, action, input); // => [resource, action, JSON.stringify(input)]

// client tier — packages/sdk/src/query/query-factory.ts
clientKey(props?); // => [resource, action, { input: props }]  ·  [resource, action] when falsy
```

The server key is serialized because it addresses a KV entry: the store writes it under
`['cache_query', ...key.map(String)]`, and a KV key part must be a primitive. The client key stays
structured because TanStack's `invalidateQueries` matches by prefix, which works only when the
leading segments are real array elements rather than one JSON string.

The two tiers are intentionally not merged. Do not make one serve the other; bridge them:

```ts no-check:partial invalidation fragment uses surrounding query utilities
import { bridgeInvalidation, toClientKeyPrefix } from '@netscript/sdk/query-client';

toClientKeyPrefix('orders'); // ['orders']          — every orders query
toClientKeyPrefix('orders', 'list'); // ['orders', 'list']  — every orders.list query

await ordersQueryUtils.list.invalidate(); // server tier: drops the KV entries
queryClient.invalidateQueries(bridgeInvalidation('orders', 'list')); // client tier
```

An island cannot call the server-only `.invalidate()` method. Instead, `defineFreshApp()` registers a
same-origin, JSON-only POST route at `/_netscript/query-cache/invalidate`, and the browser helper
sends the canonical server key to it. After a committed mutation, await the server tier first, then
invalidate the client tier, so a reload cannot repopulate the page from the entry the mutation made
stale:

```ts no-check:partial invalidation fragment uses surrounding cache values
import { invalidateServerQueryCache } from '@netscript/fresh/query';

await invalidateServerQueryCache(ordersQueryUtils.list.key(input));
await queryClient.invalidateQueries({ queryKey: ordersQueryUtils.list.clientKey() });
```

The endpoint accepts an exact key or a prefix made of JSON primitives. App middleware applies to it,
so protect it with your usual authentication and authorization middleware. To serve it at another
path, set `queryCacheInvalidation: { path: '/internal/cache/invalidate' }`; set it to `false` to
disable the route.

Hydration needs the client key to match on both sides. Entries the server prefetched land in the
island's `QueryClient` under the server's keys, so the island's `queryOptions(input)` finds them only
if it produces the same key. Both come from the same factory and the same input, so they match by
construction. Do not hand-write either key.

## The loader half: a read, not a fetch

`getCachedEntry(input)` resolves the server key, reads KV once and returns `{ data, cachedAt }` or
`null`. It does not fetch, revalidate or wait on the service:

```tsx no-check:partial builder chain uses page-local declarations omitted here
export const ordersPage = definePage()
  .withRoute(routes.dashboard.orders.$route)
  .withResource('ordersData', async (ctx) =>
    await ordersQueryUtils.list.getCachedEntry({
      limit: ctx.search.limit,
      offset: ctx.search.offset,
    }))
  .withLayer('list', OrdersTable, {
    loader: async (ctx) => {
      const entry = await ctx.resource('ordersData');
      if (!entry) return undefined; // cold cache → the layer's fallback renders
      return { orders: entry.data, cachedAt: entry.cachedAt };
    },
  })
  .build();
```

Declare the read as a resource so the island layer uses the same entry: one KV read, two consumers.
See [Request-scoped resources](/web-layer/resources/).

The callable action, `ordersQueryUtils.list(input)`, is the stale-while-revalidate path:

- a fresh entry (within `staleTime`, default 30 s) returns immediately;
- an expired entry (past `cacheTime`, default 5 min) refetches and waits;
- a stale but live entry returns the cached value and revalidates in the background, unless
  `preferFreshOnStale` says to wait.

Concurrent callers for one key share one in-flight promise.

Choose by what a cold cache should do to the page. `getCachedEntry` never blocks and returns `null`,
so you can render a skeleton; the callable blocks on a cold cache but guarantees data.

## The island half: `queryOptions` plus `initialData`

`queryOptions(input)` returns three fields:

```ts no-check:object-shape pseudocode documents generated query options
{
  queryKey: [resource, action, { input }],
  queryFn: () => invokeClientProcedure(client, action, input),
  staleTime,
}
```

The island spreads them and adds the loader's seed:

```tsx no-check:partial component uses page-local types and view components
function OrdersInner(props: OrdersIslandProps) {
  const query = useQuery({
    ...ordersQueryUtils.list.queryOptions(props.input),
    initialData: props.initialOrders,
    initialDataUpdatedAt: props.cachedAt,
    staleTime: 15_000,
  });

  return <OrdersTable orders={query.data?.items ?? []} status={query.status} />;
}
```

With `initialData` present, hydration paints the rows the server rendered and does not refetch
straight away. The island client's default `staleTime` is 30 s (the server's
`DEFAULT_QUERY_STALE_TIME`), its `gcTime` matches the server's cache time, and
`refetchOnWindowFocus` is off.

`queryOptions()` never sets `initialData`. Its return type, `QueryOptionsWithInitialData`, declares
optional `initialData` and `initialDataUpdatedAt`. The server loader calls `getCachedEntry()` and
passes the result as island props; the island sets both fields.

Fresh seeds both fields into the shared QueryClient before the observer reads it. This mount-time
server snapshot wins even over an older entry that a previous island left under the same key, but
only once per hook mount: later optimistic writes and refetches take precedence. When `cachedAt` is
already outside `staleTime`, the rows still paint immediately while `isFetching` and `isRefetching`
report the background refresh.

## Dehydrate or props

The package recommends `initialData` props. Its dehydration utilities are for a route that needs a
full `QueryClient` dehydration and hydration cycle, such as prefetching several queries into one
serialized state. The two routes differ like this:

| | `initialData` props | dehydrate / hydrate |
| --- | --- | --- |
| Payload | one value per island prop | every prefetched query in one state object |
| Age | `initialDataUpdatedAt` from the server entry | `dataUpdatedAt` per query, plus a `dehydratedAt` stamp |
| Source of the data | whatever the loader has, typically the KV entry | whatever the server `QueryClient` fetched |
| Wiring | a prop and one option | a per-request client, a dehydrate call, a hydrate call |

On the server, dehydration builds a per-request client, prefetches into it and serializes it:

```tsx no-check:partial builder chain continues from surrounding page code
.withResource('dehydratedQuery', async (ctx) => {
  const queryClient = createNetScriptQueryClient();
  await queryClient.prefetchQuery(ordersQueryUtils.list.queryOptions({
    limit: ctx.search.limit,
    offset: ctx.search.offset,
  }));
  return dehydrateQueryClient(queryClient);
})
```

`createNetScriptQueryClient()` returns a TanStack `QueryClient` with NetScript's defaults: 30 s
stale time, 5 min gc time, no focus refetch and one retry. It supports `prefetchQuery` and the type
Fresh accepts for dehydration.

On the server, the prefetch runs `queryOptions().queryFn` through the registered cache provider, so
it reads and revalidates the same KV entry as the generated action. In the browser, where no provider
is registered, the same options object refetches through the typed client.

On the client, the moment you hydrate decides whether the first render sees the data:

- `HydrationBoundary` hydrates inside a `useEffect`, so children render once against an empty cache
  before the data arrives. Use it when the island's own fallback is acceptable for one frame.
- Calling `hydrateFromDehydrated(getIslandQueryClient(), state)` during render, guarded so it runs
  once, adds the entries before the children render. The
  [live dashboard tutorial](/tutorials/live-dashboard/04-definePage-QueryIsland/) does this, so its
  island paints without a spinner.

`QueryHydrationScript` delivers the state another way: it writes it into a
`<script type="application/json">` tag (default id `__netscript_query_state__`) and escapes every
`<` in the serialized JSON as `\u003c`.

> [!TIP]
> Pass `initialData` props by default. Dehydrate when one island needs several prefetched queries.
> Both paths can preserve the server entry's age.

## The bootstrap call that makes server caching work

`getCachedEntry` reads through `getCacheProvider()`, which returns `null` until something registers a
provider. `defineFreshApp()` registers it explicitly:

```ts
// packages/fresh/src/runtime/server/define-fresh-app.ts
import { cacheQuery, setCacheProvider } from '@netscript/sdk/cache';

export function defineFreshApp(options = {}) {
  setCacheProvider(cacheQuery);
  // construct and configure the Fresh app
}
```

`@netscript/sdk` and `@netscript/sdk/cache` are load-time pure: importing them, or
`@netscript/fresh/server`, does not change the provider registry. Calling `defineFreshApp()`
installs the shared engine before it builds the app, so a page loader in a generated Fresh app can
call `getCachedEntry()` with no extra wiring.

Two consequences follow:

- **The registration is process-global.** `setCacheProvider` writes one module-scoped reference, so
  two Fresh apps in one process share the provider.
- **The call registers the provider, not the import.** A module that builds `new App()` itself must
  call `setCacheProvider(cacheQuery)` in its own server composition root. A test that runs a loader in
  isolation must do the same in setup; `resetCacheProvider()` clears the registry between tests.

## What to watch for

- **`getIslandQueryClient()` does not throw on the server**, although its JSDoc says it does. It
  creates a module-scoped client instead, and no guard stops a cross-request leak. Build a
  per-request client with `createNetScriptQueryClient()` for prefetch, as the
  [query cache page](/web-layer/query/#server-prefetch-and-hydration) explains.
- **`getCachedEntry` returns `null` on a cold cache, not an empty payload.** Branch on it; a
  destructure throws.
- **`clientKey()` returns a prefix for any falsy input, not only an omitted one.**
  `clientKey(0)`, `clientKey('')` and `clientKey(false)` all yield `[resource, action]`, while
  `queryOptions(0).queryKey` is `['orders', 'list', { input: 0 }]`. A procedure with no input has the
  same gap: `queryOptions()` registers under `[resource, action, { input: undefined }]`, which
  TanStack hashes as `['orders','list',{}]`, and `clientKey()` does not address it. Prefix matching
  keeps `invalidateQueries` working either way, but exact-key operations (`setQueryData`,
  `getQueryData`, `cancelQueries({ exact: true })`) do not. Use `queryOptions(input).queryKey` when
  you need the exact key, and keep `clientKey()` for prefixes.
- **The island result exposes the common refresh states.** `isFetching` covers the initial request
  and later fetches; `isRefetching` marks a background refresh after data exists. The result is
  intentionally narrower than TanStack's full observer object.

## Next steps

Read [Request-scoped resources](/web-layer/resources/) to share one cache read across every layer of
a page. See also [Typed SDK & client](/services-sdk/sdk/) and the
[live dashboard tutorial](/tutorials/live-dashboard/04-definePage-QueryIsland/), which wires a
loader, a dehydrated prefetch and a hydrated island.
