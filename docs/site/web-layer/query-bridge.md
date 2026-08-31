---
layout: layouts/base.vto
title: The query bridge
templateEngine: [vento, md]
order: 15
---

# The query bridge

A NetScript page reads its data twice. The server loader reads it to render HTML; the island reads it
again to stay interactive. Those are two different caches — a KV store on the server, a TanStack
`QueryClient` in the browser — and the whole art of the bridge is getting the second one to accept
what the first one already knows, so the island does not throw away a rendered table and refetch it.

The SDK's query factory is what spans them. One `createQueryFactories` call gives every contract
procedure a server-side cache-first read *and* a client-side TanStack options object, keyed
consistently, typed from the same contract. This page is about how the two halves connect, where the
keys deliberately diverge, and which parts of the handoff the type system covers.

The island-side hooks themselves — `QueryIsland`, `useQuery`, mutations, polling — are in
[Data loading and the query cache](/web-layer/query/). This page assumes them.

## What bare Fresh makes you write

Fresh already carries the loader's value into the island: island props are serializable, and Fresh
owns their transport and escaping. So the handoff itself is not the problem — this is the whole of
it:

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

Fresh carries the value into the island, but three coordination seams remain: the service response
contract, the request/input construction, and the TanStack query key.

**The response type is written twice and checked never.** The handler asserts `{ items: Order[] }`,
the island's prop type asserts it again, and the service is free to disagree with both.

**The URL is written twice.** `?limit=20&offset=0` appears in the handler and in the island's
`queryFn`, so a changed default silently produces two different result sets on one page.

**The key is invented, not derived.** `['orders', 20, 0]` exists only in the island. Nothing ties it
to what the loader fetched, so a second island — or a mutation invalidating "the orders list" — has
to guess the same literal, and a mismatch shows up as a spinner where a table should be, or a stale
table that never refreshes.

Nothing above coordinates the server's cache with the browser's, either: the handler's `fetch` and
the island's `fetch` are two independent round trips to the same service, with no shared freshness
policy between them.

## One factory, two halves

`createQueryFactory(resource, contract, client, defaultOptions?)` — usually reached through
`createQueryFactories({ … })` — attaches a set of helpers to every procedure on the contract. The
important structure is that those helpers split cleanly by environment:

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

The explicit server methods go through `getCacheProvider()`. `queryOptions()` is the bridge: its
`queryFn` selects that same provider when server bootstrap has registered one, and falls back to the
typed client when no provider exists in the browser. The key, mutation options, and client-key
helpers remain pure functions over the resource name, action name, and input. Call an explicitly
provider-backed method from client code and the error tells you so:

The angle-bracket token `<resolved import.meta.url>` stands for the install-specific resolved module URL.

```text
[NetScript SDK] Cache provider not initialized in module <resolved import.meta.url>. Call `setCacheProvider(cacheQuery)` during server bootstrap. `defineFreshApp()` does this for NetScript-managed Fresh apps. If initialization already ran, one possibility is that two `@netscript/sdk` module instances are loaded; check that `@netscript/fresh`, its subpaths, and `@netscript/sdk` resolve to one version. If you see this in the browser, a server-only cache method (query, prefetch, getCachedData, getCachedEntry, invalidate) was called from client-side code — use queryOptions/mutationOptions/clientKey instead.
```

## Two key tiers, deliberately not merged

The server key and the client key for the same call are different shapes, on purpose:

```ts no-check:pseudocode compares key shapes rather than defining runnable values
// server tier — packages/sdk/src/ports/query-key.ts
createActionQueryKey(resource, action, input); // => [resource, action, JSON.stringify(input)]

// client tier — packages/sdk/src/query/query-factory.ts
clientKey(props?); // => [resource, action, { input: props }]  ·  [resource, action] when falsy
```

The server key is **serialized** because it addresses a KV entry: the store writes it under
`['cache_query', ...key.map(String)]`, and a KV key part has to be a primitive. The client key stays
**structured** because TanStack's `invalidateQueries` matches by prefix, and prefix matching only
works if the leading segments are real array elements rather than one opaque JSON string.

`key-bridge.ts` states the rule directly: the two tiers *"live in separate cache tiers and are
intentionally **not merged**"*. Do not try to make one serve the other. Bridge them instead:

```ts no-check:partial invalidation fragment uses surrounding query utilities
import { bridgeInvalidation, toClientKeyPrefix } from '@netscript/sdk/query-client';

toClientKeyPrefix('orders'); // ['orders']          — every orders query
toClientKeyPrefix('orders', 'list'); // ['orders', 'list']  — every orders.list query

await ordersQueryUtils.list.invalidate(); // server tier: drops the KV entries
queryClient.invalidateQueries(bridgeInvalidation('orders', 'list')); // client tier
```

An island cannot call the server-only `.invalidate()` method directly. Fresh owns the HTTP edge for
that hop: `defineFreshApp()` registers a same-origin, JSON-only POST route at
`/_netscript/query-cache/invalidate`, and the browser helper sends the canonical server key to it.
After a committed mutation, invalidate the tiers in this order:

```ts no-check:partial invalidation fragment uses surrounding cache values
import { invalidateServerQueryCache } from '@netscript/fresh/query';

await invalidateServerQueryCache(ordersQueryUtils.list.key(input));
await queryClient.invalidateQueries({ queryKey: ordersQueryUtils.list.clientKey() });
```

The endpoint accepts an exact key or prefix made from JSON primitives. Existing app middleware is
applied to it, so put authentication and authorization middleware on the app as usual. Apps that
need a different path can set
`queryCacheInvalidation: { path: '/internal/cache/invalidate' }`; set it to `false` to disable the
route.

The one thing that *must* line up is the client key on both sides of hydration: the entries the
server prefetched land in the island's `QueryClient` under the keys the server used, so
`queryOptions(input)` in the island only finds them if it produces the same key. Since both come from
the same factory and the same input, that holds by construction — which is the whole reason not to
hand-write either one.

## The loader half: a read, not a fetch

`getCachedEntry(input)` is exactly what it says. It resolves the server key, reads KV once, and
returns `{ data, cachedAt }` or `null`. There is no fetch, no revalidation, and no waiting on the
service:

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

Declaring it as a resource matters, because the island layer wants the same entry — one KV read, two
consumers. That is the pattern in [Request-scoped resources](/web-layer/resources/).

Contrast the callable action, `ordersQueryUtils.list(input)`, which is the stale-while-revalidate
path: fresh entry (within `staleTime`, default **30 s**) returns immediately; expired entry (past
`cacheTime`, default **5 min**) refetches and waits; stale-but-live returns the cached value and
kicks off a background revalidation, unless `preferFreshOnStale` says to wait. Concurrent callers for
one key share a single in-flight promise.

Pick by what a cold cache should do to the page. `getCachedEntry` never blocks and hands you `null`
to render a skeleton against; the callable blocks on a cold cache but guarantees data.

## The island half: `queryOptions` plus `initialData`

`queryOptions(input)` returns three fields and nothing more:

```ts no-check:object-shape pseudocode documents generated query options
{
  queryKey: [resource, action, { input }],
  queryFn: () => invokeClientProcedure(client, action, input),
  staleTime,
}
```

The island spreads that and adds the seed the loader produced:

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

Because `initialData` is present and the island client's default `staleTime` is 30 s (the same
constant as the server's `DEFAULT_QUERY_STALE_TIME`, with `gcTime` matching the server's cache time
and `refetchOnWindowFocus` off), hydration paints the rows the server already rendered and does not
immediately refetch. That is the refetch flash, removed.

`queryOptions()` never sets `initialData` itself. Its return type — `QueryOptionsWithInitialData` —
declares `initialData?` and `initialDataUpdatedAt?`, and the module comment describes the intended
flow: *"The server loader calls `getCachedEntry()` and passes the result as island props. The island
then sets `initialData` and `initialDataUpdatedAt` on the returned query options."* The factory
populates neither field; supplying them is the island's job, by design.

Fresh accepts both fields and seeds them into the shared QueryClient before the observer reads it.
That mount-time server snapshot wins even when a previous island left an older entry under the same
key. It wins only once for that hook mount: later optimistic writes and refetches take precedence.
When `cachedAt` is already outside `staleTime`, the rows still paint immediately while
`isFetching`/`isRefetching` report the background refresh.

## Dehydrate, or props?

Both routes exist and the package is explicit about the default. `hydration.ts` says the
`initialData`-plus-props pattern is *"simpler and recommended"* and that the dehydration utilities
are *"for advanced scenarios where a full QueryClient dehydration/hydration cycle is needed."*
`hydration-script.tsx` repeats it: the dehydration components are for *"when a route needs to prefetch
several queries into one serialized state."*

The mechanical differences behind that advice:

| | `initialData` props | dehydrate / hydrate |
| --- | --- | --- |
| Payload | one value per island prop | every prefetched query in one state object |
| Age | `initialDataUpdatedAt` from the server entry | `dataUpdatedAt` per query, plus a `dehydratedAt` stamp |
| Source of the data | whatever the loader has — typically the KV entry | whatever the server `QueryClient` fetched |
| Wiring | a prop and one option | a per-request client, a dehydrate call, a hydrate call |

On the server, dehydration means building a per-request client, prefetching into it, and serializing:

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

`createNetScriptQueryClient()` returns the real TanStack `QueryClient` it constructs, with
NetScript's defaults of 30 s stale, 5 min gc, no focus refetch, and one retry. Its full contract
therefore includes both `prefetchQuery` and the type Fresh accepts for dehydration. SDK internals
that need fewer capabilities depend on a narrower `QueryClientPort`, derived from that same client
type so the two contracts cannot drift apart.

On the server, that prefetch runs `queryOptions().queryFn` through the registered CacheProvider, so
it reads and revalidates the same KV entry as the generated action. In the browser, where no provider
is registered, the identical options object refetches through the typed client.

On the client, when the state is hydrated decides whether the first render sees it:

- `HydrationBoundary` hydrates inside a `useEffect`, so children render once against an empty cache
  before the data arrives. Fine when the island's own fallback is acceptable for one frame.
- Calling `hydrateFromDehydrated(getIslandQueryClient(), state)` during render — guarded so it runs
  once — puts the entries in before the children render at all. This is what the
  [live dashboard tutorial](/tutorials/live-dashboard/04-definePage-QueryIsland/) does, and it is why
  its island paints without a spinner.

`QueryHydrationScript` is the other delivery route: it writes the state into a
`<script type="application/json">` tag (default id `__netscript_query_state__`) and replaces every
`<` in the serialized JSON with the escape `\u003c` on the way out — the escaping the bare-Fresh version above
forgot.

Guidance that holds: **props by default; dehydrate when one island needs several prefetched
queries.** Both paths can preserve server entry age.

## The bootstrap call that makes server caching work

`getCachedEntry` reaches `getCacheProvider()`, and the provider is `null` until something registers
it. NetScript-managed Fresh apps make that registration explicit inside `defineFreshApp()`:

```ts
// packages/fresh/src/runtime/server/define-fresh-app.ts
import { cacheQuery, setCacheProvider } from '@netscript/sdk/cache';

export function defineFreshApp(options = {}) {
  setCacheProvider(cacheQuery);
  // construct and configure the Fresh app
}
```

Both `@netscript/sdk` and `@netscript/sdk/cache` are load-time pure. Merely evaluating the SDK root,
the cache entry, or `@netscript/fresh/server` does not mutate the provider registry. Calling
`defineFreshApp()` installs the shared engine before it constructs or configures the app, so a page
loader can call `getCachedEntry()` without additional wiring in a generated Fresh app.

Two consequences follow from the explicit call:

- **The registration is process-global, not per-app.** `setCacheProvider` writes one module-scoped
  reference. Two Fresh apps in one process share the provider.
- **The trigger is the call, not the import.** A module that hand-rolls `new App()` must call
  `setCacheProvider(cacheQuery)` in its own server composition root. A test that exercises a loader
  in isolation must do the same in setup; `resetCacheProvider()` clears the registry between tests.

## What to watch for

- **Import islands from `@netscript/fresh/query`, not `@tanstack/preact-query`.** The barrel states
  it as a rule: it centralizes the dependency and keeps framework-level enhancements available.
  `useQuery` is a straight alias of `useIslandQuery` — name whichever reads better, they are the same
  function.
- **`getIslandQueryClient()` does not throw on the server.** Its JSDoc says it does; the
  implementation lazily constructs a module-scoped client instead. The guidance behind that JSDoc is
  still right — a shared client is a cross-request data-leak risk — so build a per-request client with
  `createNetScriptQueryClient()` for prefetch, and treat the singleton as browser-only. There is no
  guard that will catch you.
- **`getCachedEntry` returns `null` on a cold cache, not an empty payload.** Branch on it; a
  destructure will throw.
- **Invalidation is two ordered operations.** `invalidateServerQueryCache(action.key(input))`
  clears KV through the Fresh endpoint; the browser's `QueryClient` is untouched until
  `invalidateQueries` runs. Await the server operation first so a reload cannot repopulate the page
  from the entry the mutation just made stale.
- **`clientKey()` returns a prefix for any falsy input, not just an omitted one.** The implementation
  branches on truthiness, so `clientKey(0)`, `clientKey('')`, and `clientKey(false)` all yield
  `[resource, action]` — while `queryOptions(0).queryKey` is `['orders', 'list', { input: 0 }]`. The
  same gap opens for a procedure with no input at all: `queryOptions()` registers under
  `[resource, action, { input: undefined }]`, which TanStack hashes as `['orders','list',{}]`, and
  `clientKey()` does not address it. Prefix matching means `invalidateQueries` still works either
  way; an exact-key operation — `setQueryData`, `getQueryData`, `cancelQueries({ exact: true })` —
  does not. **Use `queryOptions(input).queryKey` whenever you need the exact key**, and reserve
  `clientKey()` for the prefix it reliably produces.
- **The island result exposes the common refresh states.** `isFetching` covers the initial request
  and later fetches; `isRefetching` distinguishes a background refresh after data already exists.
  The package-owned result remains intentionally narrower than TanStack's full observer object.

## Related

{{ comp.cardsGrid({ columns: 3, cards: [
  { title: "Data loading and the query cache", body: "QueryIsland, the island hooks, and mutations.", href: "/web-layer/query/" },
  { title: "Request-scoped resources", body: "Read the cache entry once, share it across layers.", href: "/web-layer/resources/" },
  { title: "Typed SDK & client", body: "createServiceClient and the contract the factory is built from.", href: "/services-sdk/sdk/" },
  { title: "The Fresh page model", body: "defineFreshApp and its explicit server-cache registration.", href: "/web-layer/server/" },
  { title: "Interactive islands", body: "Where island code runs and what it may import.", href: "/web-layer/interactive/" },
  { title: "Live dashboard tutorial", body: "A loader, a dehydrated prefetch, and a hydrated island.", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" }
] }) }}

See the [Web Layer overview](/web-layer/) for the full pillar map.
