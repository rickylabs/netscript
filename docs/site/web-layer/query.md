---
layout: layouts/base.vto
title: Data loading and the query cache
templateEngine: [vento, md]
order: 10
---

# Data loading and the query cache

This page shows how islands load cached, refetchable and live data with the
TanStack Query hooks in `@netscript/fresh/query`, and how a page loader checks
its cache with the root cache-entry helpers.

## The two surfaces

| Import | What it provides |
| --- | --- |
| `@netscript/fresh/query` | TanStack Query for islands: the `QueryIsland` provider, the shared `QueryClient` (`getIslandQueryClient`), query and mutation hooks (`useIslandQuery`, `useIslandMutation` and the rest), live-query hooks (`useLiveQuery`, `useLiveSuspenseQuery`), and hydration utilities for streaming SSR. |
| `@netscript/fresh` (root) | Page-loader cache helpers over plain `CacheEntryLike` values (a `data` payload plus a `cachedAt` Unix-epoch timestamp in milliseconds). A loader uses them to check whether its cache is complete and how fresh it is before it serves cached data or refetches. |

Import island hooks from `@netscript/fresh/query`, not from
`@tanstack/preact-query`. The subpath centralizes the dependency and keeps
framework-level enhancements available.

## Cache entries at the loader

A `CacheEntryLike<T>` is the cache shape shared by page loaders and partial
orchestration:

```ts
interface CacheEntryLike<T> {
  readonly data: T;
  readonly cachedAt: number; // Unix epoch ms
}
```

The root helpers operate over arrays of these entries:

- `hasAllCacheEntries(entries)` returns `true` when every supplied entry is
  present. `null` and `undefined` count as missing, so a loader can pass the raw
  results of several cache reads and learn in one call whether the page can be
  served from cache.
- `minCachedAt(entries)` returns the oldest `cachedAt` across the supplied
  entries, or `undefined` when there are none. A composed page is only as fresh
  as its stalest entry.
- `projectCachedItemFromList(listEntry, predicate)` projects one cached item out
  of a `CachedListEntryLike<TItem>` (an entry whose `data` holds an `items`
  array) and keeps the list's `cachedAt`. A detail view can then reuse a cached
  list response instead of fetching again.

### A cache-first load pattern

A loader can read its cache entries, check completeness, and derive freshness
before deciding whether to refetch:

```ts no-check:uses cache entries defined earlier in the surrounding application
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

An island wraps its content in `QueryIsland`, the island-level TanStack Query
provider, and then calls the package hooks. `useIslandQuery` runs a query
through the shared client and takes `IslandQueryOptions`:

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

For a NetScript service, derive `queryFn` and `queryKey` from the service's oRPC
contract with [`@netscript/sdk`](/services-sdk/sdk/) instead of writing a
`fetch`. A hand-written `fetch("/api/widgets")` re-types the response, hardcodes
the path, and drifts when the service changes.

Give each service one module under `lib/` that builds its typed client and
query factories. Every loader and island imports from that module:

```ts
// apps/dashboard/lib/widgets.ts
import { createServiceClient } from "@netscript/sdk/client";
import { createQueryFactories } from "@netscript/sdk/query";
import { WidgetsContractV1 } from "@my-app/contracts";

// 1. A typed client per service. `serviceName` resolves a URL via Aspire
//    discovery; the contract drives every method signature.
export const widgetsClient = createServiceClient<typeof WidgetsContractV1>({
  contract: WidgetsContractV1,
  serviceName: "widgets",
});

// 2. The cache-aware query factory exposes queryOptions(input),
//    mutationOptions(), clientKey(input?), and the server KV helpers.
export const widgetsQueries = createQueryFactories({
  widgets: { contract: WidgetsContractV1, client: widgetsClient },
}).widgets;
```

An island spreads the generated options into the hook. `queryOptions(input)`
supplies the `queryKey` and a contract-bound `queryFn`, so the hook call adds
only island concerns such as `staleTime`:

```tsx
// apps/dashboard/islands/WidgetIsland.tsx
import { QueryIsland, useIslandQuery } from "@netscript/fresh/query";
import { widgetsQueries } from "../lib/widgets.ts";

function WidgetView() {
  // queryKey + queryFn come from the contract; the input is typed, too.
  const query = useIslandQuery({
    ...widgetsQueries.list.queryOptions({}),
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

`widgetsQueries.list.queryOptions(...)` returns a typed `{ queryKey, queryFn }`.
The `widget` type comes from the contract's output, so a renamed field is a
compile error. The same factory supplies the KV-backed server helpers described
in [Typed SDK & client](/services-sdk/sdk/), so loaders and islands share one
input shape and one query-key vocabulary. Seeding the island with the loader's
payload through `initialData` is covered in
[the query bridge](/web-layer/query-bridge/).

### Polling an island with `refetchInterval`

To poll a changing status, such as a document moving from `pending` to
`embedding` to `ready`, set `refetchInterval` instead of wiring a `setInterval`.
The hook refetches on that cadence and clears the timer on unmount. Add
`refetchIntervalInBackground: true` when polling must continue while the tab is
in the background; by default it stops on blur.

```tsx
import { useIslandQuery } from "@netscript/fresh/query";
import { docsQueries } from "../lib/docs.ts";

function DocStatus({ id }: { id: string }) {
  const query = useIslandQuery({
    // Contract-derived queryKey + queryFn; `id` is the typed procedure input.
    ...docsQueries.getById.queryOptions({ id }),
    // Poll every 2s; flip to false from state once the status reaches "ready".
    refetchInterval: 2_000,
    refetchIntervalInBackground: true,
  });

  return <span>{query.data?.status ?? "loading…"}</span>;
}
```

### Mutations, infinite queries, and live data

- `useIslandMutation` runs a mutation through the shared client. Its options
  (`IslandMutationOptions`) take a `mutationFn` and optional `onMutate`,
  `onSuccess`, `onError` and `onSettled` callbacks. The result exposes
  `mutate`, `mutateAsync`, `status`, `isPending`, `data` and `error`.
  `onMutate` runs before the mutation and can return context, such as a
  snapshot of prior data, which the other callbacks receive. That is the seam
  for optimistic updates with rollback. `onSettled` runs after success or error.
- `useIslandInfiniteQuery` loads paged data. Its options add
  `initialPageParam` and `getNextPageParam`; the result adds `hasNextPage`,
  `isFetchingNextPage` and `fetchNextPage()`.
- `useIslandSuspenseQuery` and `useIslandSuspenseInfiniteQuery` are the
  Suspense variants. The Suspense query result guarantees `data` for rendered
  consumers.
- `useLiveQuery` and `useLiveSuspenseQuery` take an `IslandLiveQueryFactory`
  and an optional dependency array. They return an `IslandLiveQueryResult` with
  `data`, `status`, `error` and a `details` record of preserved upstream fields.

The shorter aliases `useQuery`, `useMutation`, `useInfiniteQuery`,
`useSuspenseQuery` and `useSuspenseInfiniteQuery` map to their `useIsland*`
counterparts for backward compatibility.

#### A worked mutation: optimistic toggle with rollback

This island toggles a todo's `done` flag optimistically and rolls back if the
server rejects the change. `onMutate` snapshots the cached list and returns it
as context, `onError` restores the snapshot, and `onSettled` re-syncs with the
server:

```tsx
// apps/dashboard/islands/TodoIsland.tsx
import {
  QueryIsland,
  useIslandMutation,
  useQueryClient,
} from "@netscript/fresh/query";
import { todosQueries } from "../lib/todos.ts";

interface Todo {
  id: string;
  title: string;
  done: boolean;
}

function TodoToggle({ todo }: { todo: Todo }) {
  const queryClient = useQueryClient();
  const listKey = todosQueries.list.clientKey({});

  const toggle = useIslandMutation({
    // 1. The round-trip: mutationOptions() supplies the contract-bound
    //    mutationFn and mutationKey; `mutate` takes the typed procedure input.
    ...todosQueries.update.mutationOptions(),

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

`todosQueries.update.mutationOptions()` supplies the contract-bound `mutationFn`
and `mutationKey`. The optimistic callbacks sit on the island hook, next to the
query cache. `mutate` takes the typed procedure input (`{ id, done }` here).
`todosQueries.list.clientKey(input)` builds the key the list query uses, so the
snapshot, rollback and invalidation target the same cache entry. Call `mutate`
for fire-and-forget updates, or `mutateAsync` when you need to await the result.

### Endpoints without a NetScript contract

A third-party REST API, a legacy endpoint or a webhook receiver has no oRPC
contract to derive from. Only then is a hand-written `queryFn` correct: you own
the request and its type. Keep it explicit and isolated:

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

For an endpoint that has a NetScript contract, use the typed chain above.

## Server prefetch and hydration

For streaming SSR, the server prefetches into a per-request `QueryClient`,
`dehydrateQueryClient` serializes it to a `DehydratedState`, and the island
restores it with `HydrationBoundary` or `hydrateFromDehydrated`.
`QueryHydrationScript` writes the state into the document as a script tag.
[The query bridge](/web-layer/query-bridge/#dehydrate-or-props) explains when to
dehydrate and when to pass `initialData` props instead.

`getIslandQueryClient()` returns the shared island client, `useQueryClient`
returns the active handle inside an island, and `resetIslandQueryClient()`
clears the singleton, mainly for tests.

> [!CAUTION]
> The island `QueryClient` is a module-scoped singleton. Calling
> `getIslandQueryClient()` on the server creates a client that is then shared
> across requests. Build a per-request client for SSR prefetch and treat the
> singleton as browser-only.

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

## Next steps

Read [the query bridge](/web-layer/query-bridge/) to hand a server loader's cache
entry to an island without a refetch. See also
[Typed SDK & client](/services-sdk/sdk/) and the
[live dashboard tutorial](/tutorials/live-dashboard/).
