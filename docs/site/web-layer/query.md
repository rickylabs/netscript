---
layout: layouts/base.vto
title: Data loading and the query cache
templateEngine: [vento, md]
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

The hook returns an `IslandQueryResult` with `data`, `error`, `status`,
`isLoading`, `isSuccess`, `isError`, and a `refetch()` method.

```tsx
import { QueryIsland, useIslandQuery } from "@netscript/fresh/query";

interface Widget {
  id: string;
  name: string;
}

function WidgetView() {
  const query = useIslandQuery<Widget[]>({
    queryKey: ["widgets"],
    queryFn: () => fetch("/api/widgets").then((res) => res.json()),
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

`initialData` is the bridge between a server loader and the island: pass the
loader's cached payload as `initialData` so the island renders with data
immediately and only refetches once `staleTime` elapses.

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
  { title: "Interactive islands", body: "Where query hooks run on the client.", href: "/web-layer/interactive/" },
  { title: "Deferred and streaming UI", body: "Stream data into hydrating islands.", href: "/web-layer/defer-streaming-ui/" },
  { title: "Server-validated forms", body: "Pair mutations with form handling.", href: "/web-layer/form/" },
  { title: "Live dashboard tutorial", body: "Build a cache-first, live-updating page.", href: "/tutorials/live-dashboard/" }
] }) }}

See also the [Web Layer hub](/web-layer/).
