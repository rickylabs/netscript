---
layout: layouts/base.vto
title: Data loading and the query cache
templateEngine: [vento, md]
order: 4
---

# Data loading and the query cache

The `@netscript/fresh/query` subpath gives islands a package-owned data layer
built on TanStack Query, while the package root exposes a small set of
cache-entry helpers that page loaders and islands share. Reach for this surface
when an island needs cached, refetchable, or live data, and when a server loader
wants to prime that cache before the island hydrates.

## The two surfaces

Data loading in NetScript Fresh spans two import points:

- **`@netscript/fresh/query`** — TanStack Query hooks for islands. Island code
  imports from this subpath rather than from `@tanstack/preact-query` directly,
  which centralizes the dependency and enables framework-level enhancements.
  It provides the island provider (`QueryIsland`), the shared `QueryClient`
  singleton (`getIslandQueryClient`), the query and mutation hooks
  (`useIslandQuery`, `useIslandMutation`, and friends), live-query hooks
  (`useLiveQuery`, `useLiveSuspenseQuery`), and hydration utilities for
  streaming SSR.
- **`@netscript/fresh`** (root) — the cross-cutting page-loader cache helpers.
  These operate on plain `CacheEntryLike` values: a `data` payload plus a
  `cachedAt` Unix-epoch timestamp in milliseconds. They let a loader reason
  about whether its cache is complete and how fresh it is before deciding to
  serve cached data or refetch.

Every other capability lives on its own explicit subpath (`./builders`,
`./route`, `./form`, `./defer`, `./server`, `./streams`, `./interactive`,
`./vite`, `./error`, and `./testing`).

## Cache entries at the loader

A `CacheEntryLike<T>` is the shared cache shape across page loaders and partial
orchestration:

```ts
interface CacheEntryLike<T> {
  readonly data: T;
  readonly cachedAt: number; // Unix epoch ms
}
```

The root helpers operate over arrays of these entries:

- `hasAllCacheEntries(entries)` returns `true` when every supplied entry is
  present. `null` and `undefined` entries count as missing, so a loader can pass
  the raw results of several cache reads and learn in one call whether the page
  can be served entirely from cache.
- `minCachedAt(entries)` returns the oldest `cachedAt` timestamp across the
  supplied entries, or `undefined` when there are none. Use it to compute the
  effective freshness of a composed page — the page is only as fresh as its
  stalest entry.
- `projectCachedItemFromList(listEntry, predicate)` projects a single cached
  item out of a `CachedListEntryLike<TItem>` (an entry whose `data` holds an
  `items` array) while preserving the list's `cachedAt` timestamp. This lets a
  detail view reuse a list response already in cache instead of issuing a new
  fetch.

### A cache-first load pattern

A loader can read its cache entries, check completeness, and derive freshness
before deciding whether to refetch:

```ts
import {
  hasAllCacheEntries,
  minCachedAt,
  projectCachedItemFromList,
  type CacheEntryLike,
  type CachedListEntryLike,
} from "@netscript/fresh";

interface Widget {
  id: string;
  name: string;
}

// Cache entries gathered earlier in the request.
const widgetList: CachedListEntryLike<Widget> | undefined = readWidgetList();
const summary: CacheEntryLike<number> | undefined = readSummary();

const entries = [widgetList, summary];

if (hasAllCacheEntries(entries)) {
  const oldest = minCachedAt(entries); // freshness floor, in epoch ms
  const selected = projectCachedItemFromList(
    widgetList,
    (item) => item.id === "w-1",
  );

  // Serve cached data along with its freshness floor.
  return { widget: selected?.data, cachedAt: oldest };
}

// Otherwise, fall through to a fresh load.
```

## Querying inside an island

Islands wrap their content in `QueryIsland`, the island-level TanStack Query
provider, then call the package-owned hooks. `useIslandQuery` runs a query
through the shared client; its options come from `IslandQueryOptions`:

| Option        | Meaning                                              |
| ------------- | ---------------------------------------------------- |
| `queryKey`    | Stable cache key (`QueryKey`, a `readonly unknown[]`). |
| `queryFn`     | Function that loads query data.                      |
| `initialData` | Initial data supplied from a Fresh server loader.    |
| `enabled`     | Whether the query should run automatically.          |
| `staleTime`   | Cache freshness duration in milliseconds.            |
| `gcTime`      | Cache garbage-collection duration in milliseconds.   |
| `select`      | Optional projection applied by the query adapter.    |
| `onError`     | Optional error callback.                             |
| `refetchInterval` | Polling cadence in milliseconds (`number \| false`). When set, the query refetches on this cadence; `false` disables polling. Defaults to `false`. |
| `refetchIntervalInBackground` | Whether polling continues while the tab or window is backgrounded (`boolean`). Only relevant when `refetchInterval` is set. Defaults to `false`. |

The hook returns an `IslandQueryResult` with `data`, `error`, `status`,
`isLoading`, `isSuccess`, `isError`, and a `refetch()` method.

### From contract to island: the typed query chain

`queryFn` can be any function that returns data — but on a NetScript service it
should almost never be a hand-written `fetch`. A raw `fetch("/api/widgets")`
re-types the response by hand, hardcodes the path, and drifts silently the moment
the service changes. The [`@netscript/sdk`](/services-sdk/sdk/) bridge removes
that gap: derive the `queryFn` (and its `queryKey`) straight from the same oRPC
contract the service implements, so the island cannot drift from the API.

The chain has three links, and it lives in **one module** per app — the single
source of typed clients every loader and island imports:

```ts
// apps/dashboard/lib/api-clients.ts
import { createServiceClient } from "@netscript/sdk/client";
import { createServiceQueryUtils } from "@netscript/sdk/query-client";
import { docsContract, todosContract, widgetsContract } from "@contracts";

// 1. A typed client per service. `serviceName` resolves a URL via Aspire
//    discovery; the contract drives every method signature.
export const widgetsClient = createServiceClient<typeof widgetsContract>({
  contract: widgetsContract,
  serviceName: "widgets",
});
export const docsClient = createServiceClient<typeof docsContract>({
  contract: docsContract,
  serviceName: "docs",
});
export const todosClient = createServiceClient<typeof todosContract>({
  contract: todosContract,
  serviceName: "todos",
});

// 2. Frontend query utils per client. Each exposes `.queryOptions()`,
//    `.mutationOptions()`, `.infiniteOptions()`, and `.key()` for every
//    procedure on the contract — all inferred, no manual annotations.
export const widgets = createServiceQueryUtils(widgetsClient, { path: ["widgets"] });
export const docs = createServiceQueryUtils(docsClient, { path: ["docs"] });
export const todos = createServiceQueryUtils(todosClient, { path: ["todos"] });
```

Islands then import from that module and spread the generated options into the
island hooks. `queryOptions({ input })` supplies both the `queryKey` and a
`queryFn` bound to the contract, so the hook call only adds island concerns like
`staleTime`:

```tsx
// apps/dashboard/islands/WidgetIsland.tsx
import { QueryIsland, useIslandQuery } from "@netscript/fresh/query";
import { widgets } from "../lib/api-clients.ts";

function WidgetView() {
  // queryKey + queryFn come from the contract; the input is typed, too.
  const query = useIslandQuery({
    ...widgets.list.queryOptions({ input: {} }),
    staleTime: 30_000,
  });

  if (query.isLoading) return <p>Loading…</p>;
  if (query.isError) return <p>Could not load widgets.</p>;

  return (
    <ul>
      {query.data?.map((widget) => <li key={widget.id}>{widget.name}</li>)}
    </ul>
  );
}

export default function WidgetIsland() {
  return (
    <QueryIsland>
      <WidgetView />
    </QueryIsland>
  );
}
```

`widgets.list.queryOptions(...)` returns a typed `{ queryKey, queryFn }`; the
`widget` element is inferred from the contract's output, so a renamed field is a
compile error, not a runtime surprise. The `@netscript/sdk/query-client` bridge
(`createServiceQueryUtils`) is the pure client-to-island path; when you also want
KV-backed server SWR and prefetch, `createQueryFactories` from the SDK adds a
cache-first layer over the same contract — see the
[Typed SDK & client](/services-sdk/sdk/) pillar for that variant.

`initialData` is the bridge between a server loader and the island: pass the
loader's cached payload as `initialData` so the island renders with data
immediately and only refetches once `staleTime` elapses.

### Polling an island with `refetchInterval`

When an island needs to poll for a changing status — a document moving from
`pending` to `embedding` to `ready`, say — set `refetchInterval` rather than
wiring a manual `setInterval`. The hook refetches on that cadence and cleans the
timer up on unmount. Add `refetchIntervalInBackground: true` when polling must
continue while the tab is backgrounded (the default stops polling on blur).

```tsx
import { useIslandQuery } from "@netscript/fresh/query";
import { docs } from "../lib/api-clients.ts";

function DocStatus({ id }: { id: string }) {
  const query = useIslandQuery({
    // Contract-derived queryKey + queryFn; `id` is the typed procedure input.
    ...docs.getById.queryOptions({ input: { id } }),
    // Poll every 2s; flip to false from state once the status reaches "ready".
    refetchInterval: 2_000,
    refetchIntervalInBackground: true,
  });

  return <span>{query.data?.status ?? "loading…"}</span>;
}
```

`refetchInterval` is typed `number | false`: pass a millisecond cadence to poll,
or `false` to disable it (for example, flip it to `false` from state once the
status reaches `ready` to stop polling).

### Mutations, infinite queries, and live data

- `useIslandMutation` runs a mutation through the shared client. Its options
  (`IslandMutationOptions`) take a `mutationFn` plus optional `onMutate`,
  `onSuccess`, `onError`, and `onSettled` callbacks; the result exposes
  `mutate`, `mutateAsync`, `status`, `isPending`, `data`, and `error`.
  `onMutate` runs before the mutation fires and can return context (for
  example, a snapshot of prior data) that `onSuccess`, `onError`, and
  `onSettled` receive back — the seam for optimistic updates with rollback.
  `onSettled` runs after either a success or an error.
- `useIslandInfiniteQuery` loads paged data. Its options extend the query
  options with `initialPageParam` and `getNextPageParam`; the result adds
  `hasNextPage`, `isFetchingNextPage`, and `fetchNextPage()`.
- `useIslandSuspenseQuery` and `useIslandSuspenseInfiniteQuery` are the
  Suspense variants; the suspense query result guarantees `data` is present for
  rendered consumers.
- `useLiveQuery` and `useLiveSuspenseQuery` accept an `IslandLiveQueryFactory`
  and an optional dependency array, returning an `IslandLiveQueryResult` with
  `data`, `status`, `error`, and a `details` record of preserved upstream
  fields.

Shorter aliases — `useQuery`, `useMutation`, `useInfiniteQuery`,
`useSuspenseQuery`, and `useSuspenseInfiniteQuery` — map to their `useIsland*`
counterparts for backward compatibility.

#### A worked mutation: optimistic toggle with rollback

This island toggles a todo's `done` flag through `useIslandMutation`, applying the
change optimistically and rolling back if the server rejects it. `onMutate` snapshots
the cached list and returns it as context, `onError` restores that snapshot, and
`onSettled` re-syncs with the server:

```tsx
// apps/dashboard/islands/TodoIsland.tsx
import {
  QueryIsland,
  useIslandMutation,
  useQueryClient,
} from "@netscript/fresh/query";
import { todos } from "../lib/api-clients.ts";

interface Todo {
  id: string;
  title: string;
  done: boolean;
}

function TodoToggle({ todo }: { todo: Todo }) {
  const queryClient = useQueryClient();
  const listKey = todos.list.queryKey({ input: {} });

  const toggle = useIslandMutation({
    // 1. The round-trip: mutationOptions() supplies the contract-bound
    //    mutationFn and mutationKey; `mutate` takes the typed procedure input.
    ...todos.update.mutationOptions(),

    // 2. Optimistic update: snapshot prior state, write the expected next state.
    onMutate: async (variables: { id: string; done: boolean }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Todo[]>(listKey);
      queryClient.setQueryData<Todo[]>(
        listKey,
        (list) =>
          (list ?? []).map((item) =>
            item.id === variables.id ? { ...item, done: variables.done } : item
          ),
      );
      return { previous };
    },

    // 3. Roll back to the snapshot when the server rejects the change.
    onError: (_error, _variables, context) => {
      const snapshot = context as { previous?: Todo[] } | undefined;
      if (snapshot?.previous) queryClient.setQueryData(listKey, snapshot.previous);
    },

    // 4. Re-sync with the server once the mutation settles, either way.
    onSettled: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });

  return (
    <button
      type="button"
      disabled={toggle.isPending}
      onClick={() => toggle.mutate({ id: todo.id, done: !todo.done })}
    >
      {todo.done ? "Mark undone" : "Mark done"}
    </button>
  );
}

export default function TodoIsland({ todo }: { todo: Todo }) {
  return (
    <QueryIsland>
      <TodoToggle todo={todo} />
    </QueryIsland>
  );
}
```

Spreading `todos.update.mutationOptions()` supplies the contract-bound
`mutationFn` and `mutationKey`; the optimistic seam — `onMutate`, `onError`,
`onSettled` — is added on the island hook, exactly where the query cache lives.
`mutate` takes the typed procedure input (`{ id, done }` here), and the
`todos.list.queryKey({ input })` helper builds the same key the list query uses,
so the snapshot, rollback, and invalidation all target the right cache entry.
Call `mutate` for fire-and-forget UI updates, or `mutateAsync` when you need to
await the result.

### Endpoints without a NetScript contract

Sometimes an island calls something that has no oRPC contract — a third-party
REST API, a legacy endpoint, or a webhook receiver. That is the one case where a
hand-written `queryFn` is correct: there is no contract to derive from, so you own
the request and its type. Keep it explicit and isolated so it does not read as the
default pattern:

```tsx
import { useIslandQuery } from "@netscript/fresh/query";

interface Rate {
  base: string;
  value: number;
}

// No NetScript contract exists for this external endpoint, so the fetch and its
// response type are written by hand — the deliberate exception, not the norm.
function ExchangeRate() {
  const query = useIslandQuery<Rate>({
    queryKey: ["exchange-rate", "USD"],
    queryFn: () =>
      fetch("https://api.example.com/rates/USD").then(
        (res) => res.json() as Promise<Rate>,
      ),
    staleTime: 60_000,
  });

  return <span>{query.data ? `1 ${query.data.base} = ${query.data.value}` : "…"}</span>;
}
```

For any endpoint that *does* have a NetScript contract, reach for the typed chain
above instead — the raw `fetch` here exists only because there is nothing typed to
bind to.

## Server prefetch and hydration

For streaming SSR, prefetch on the server and hand the cache to the island:

1. Prefetch into a per-request `QueryClient`, then call
   `dehydrateQueryClient(queryClient)` to produce a serializable
   `DehydratedState` (its `queries` and `mutations` arrays).
2. Serialize that state into the document with `QueryHydrationScript`, or pass
   it directly to an island.
3. On the client, restore it with `HydrationBoundary` (which reads either a
   `state` prop or a script tag by `id`) or call `hydrateFromDehydrated` against
   the island client.

`getIslandQueryClient()` returns the shared singleton (it throws if called
during SSR outside island hydration — use a per-request client for prefetch).
`useQueryClient` returns the active handle inside an island, and
`resetIslandQueryClient()` clears the singleton, primarily for tests.

{{ comp callout { type: "note" } }}
`getIslandQueryClient()` throws when called during server-side rendering outside
island hydration. For SSR prefetch, build a per-request `QueryClient`, dehydrate
it, and hydrate inside the island.
{{ /comp }}

## API summary

Root cache helpers (`@netscript/fresh`):

| Symbol                      | Description                                                                 |
| --------------------------- | --------------------------------------------------------------------------- |
| `hasAllCacheEntries`        | Return `true` when every supplied entry is present.                         |
| `minCachedAt`               | Return the oldest `cachedAt` timestamp across the supplied entries.         |
| `projectCachedItemFromList` | Project a single cached item from a cached list while preserving the timestamp. |
| `CacheEntryLike<T>`         | Cached-entry shape: `data` payload plus `cachedAt` epoch-ms timestamp.      |
| `CachedListEntryLike<TItem>`| Cached list-entry shape with a `data.items` array, used for projection.     |

Query subpath (`@netscript/fresh/query`):

| Symbol                       | Description                                              |
| ---------------------------- | -------------------------------------------------------- |
| `QueryIsland`                | Island-level TanStack Query provider.                    |
| `useIslandQuery`             | Run an island query through the shared QueryClient.      |
| `useIslandMutation`          | Run an island mutation through the shared QueryClient.   |
| `useIslandInfiniteQuery`     | Run an island infinite (paged) query.                    |
| `useIslandSuspenseQuery`     | Suspense variant of the island query.                    |
| `useLiveQuery`               | Run an island live query through the query surface.      |
| `useLiveSuspenseQuery`       | Suspense variant of the live query.                      |
| `getIslandQueryClient`       | Get (or create) the shared island `QueryClient`.         |
| `useQueryClient`             | Return the active island QueryClient handle.             |
| `resetIslandQueryClient`     | Reset the island QueryClient singleton (testing).        |
| `useIsFetching` / `useIsMutating` | Count active island queries / mutations.            |
| `dehydrateQueryClient`       | Dehydrate a QueryClient into serializable state.         |
| `hydrateFromDehydrated`      | Hydrate a client from server-dehydrated state.           |
| `QueryHydrationScript`       | Render a JSON script tag of dehydrated state.            |
| `HydrationBoundary`          | Hydrate the island client from state or a script tag.    |
| `IslandQueryOptions`         | Options for `useIslandQuery`.                            |
| `IslandQueryResult`          | Result of an island query hook call.                     |
| `DehydratedState`            | State produced by server-side query dehydration.         |
| `QueryKey`                   | Stable query-key shape (`readonly unknown[]`).           |
| `LoaderData`                 | Resolve the awaited return value of a Fresh route loader. |

## Related

{{ comp.cardsGrid({ columns: 3, cards: [
  { title: "The Fresh page model", body: "How server pages compose and load.", href: "/web-layer/server/" },
  { title: "Routing and route contracts", body: "Route definitions and loaders.", href: "/web-layer/route/" },
  { title: "Typed SDK & client", body: "The contract → client → query-utils bridge queryFn is built on.", href: "/services-sdk/sdk/" },
  { title: "Interactive islands", body: "Where query hooks run on the client.", href: "/web-layer/interactive/" },
  { title: "Deferred and streaming UI", body: "Stream data into hydrating islands.", href: "/web-layer/defer-streaming-ui/" },
  { title: "Server-validated forms", body: "Pair mutations with form handling.", href: "/web-layer/form/" },
  { title: "Live dashboard tutorial", body: "Build a cache-first, live-updating page.", href: "/tutorials/live-dashboard/" }
] }) }}

See also the [Web Layer hub](/web-layer/).
