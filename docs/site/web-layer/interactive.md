---
layout: layouts/base.vto
title: Interactive islands
templateEngine: [vento, md]
order: 7
---

# Interactive islands

This page covers the two ways interactivity enters a NetScript page: reading an in-flight promise
during render with `@netscript/fresh/interactive`, and hydrating a contract-typed query in a
`QueryIsland`. Most data-driven islands use the second.

## The interactive entrypoint

`@netscript/fresh/interactive` holds only the browser-side seams the package owns. Route builders,
server helpers and copy-based UI registry code stay on their own subpaths. The entrypoint exports two
functions:

- `usePromise<T>` reads a promise during render with the Suspense throw-promise protocol. While the
  promise is pending, the call throws it so a surrounding Suspense boundary shows its fallback; once
  the promise is fulfilled, the call returns the resolved value of type `T`.
- `resolvedPromise<T>` creates a promise that is already fulfilled with a given value. Pass it to
  `usePromise()` when the value is available up front, so the read path needs no special case.

Render an island that calls `usePromise` inside a Suspense boundary with a fallback.
[Deferred and streaming UI](/web-layer/defer-streaming-ui/) covers how those boundaries are wired
across the server render.

## Reading a promise inside an island

`usePromise` reads the promise's resolved value, and `resolvedPromise` supplies an already-fulfilled
promise for a value known up front:

```tsx
import { resolvedPromise, usePromise } from "@netscript/fresh/interactive";

interface Metric {
  label: string;
  value: number;
}

function MetricReadout({ data }: { data: Promise<Metric> }) {
  // Suspends while `data` is pending; returns the resolved Metric once fulfilled.
  const metric = usePromise(data);
  return (
    <p>
      {metric.label}: {metric.value}
    </p>
  );
}

// An already-fulfilled promise, suitable for synchronous values.
const seeded = resolvedPromise<Metric>({ label: "Sessions", value: 42 });

export default function MetricIsland() {
  return <MetricReadout data={seeded} />;
}
```

## Typed query islands

A plain Fresh island is hydrated Preact, and you bring your own data fetching. A NetScript island
hydrates contract-typed data instead: a typed route reference names the page, and a `QueryIsland`
renders the result of a contract-derived query. Neither the URL nor the response shape is typed by
hand, so the island cannot drift from the service.

The route reference comes from [`@netscript/fresh/route`](/web-layer/route/). The query factory
comes from the per-service `lib/widgets.ts` module described in
[Data loading and the query cache](/web-layer/query/):

```tsx
// apps/dashboard/islands/WidgetPanel.tsx
import { QueryIsland, useIslandQuery } from "@netscript/fresh/query";
import { createRouteReference } from "@netscript/fresh/route";
import { widgetsQueries } from "../lib/widgets.ts";

// A typed reference to the page this island lives on — hrefs are checked
// against the pattern, so a broken link is a compile error.
const widgetsRoute = createRouteReference("/widgets");

function WidgetList() {
  // queryKey + queryFn are derived from the widgets contract.
  const query = useIslandQuery({
    ...widgetsQueries.list.queryOptions({}),
    staleTime: 15_000,
  });

  if (query.isLoading) return <p>Loading…</p>;

  return (
    <div>
      <a href={widgetsRoute.href()}>All widgets</a>
      <ul>
        {query.data?.map((widget) => <li key={widget.id}>{widget.name}</li>)}
      </ul>
    </div>
  );
}

export default function WidgetPanel() {
  return (
    <QueryIsland>
      <WidgetList />
    </QueryIsland>
  );
}
```

## API summary

| Symbol | Description |
| --- | --- |
| `usePromise<T>(promise: Promise<T>): T` | Read a promise using the Suspense throw-promise protocol. |
| `resolvedPromise<T>(value: T): Promise<T>` | Create a promise already primed as fulfilled for `usePromise()`. |

## Companion UI helpers

The copy-based registry components of `@netscript/fresh-ui` live on workspace-local paths, so your
application owns them after copy. The package root exposes only helpers that are safe to use as
runtime dependencies, including:

| Helper | Purpose |
| --- | --- |
| `cn(...inputs: ClassValue[]): string` | Merge classes with clsx and tailwind-merge. |
| `getToast(url: URL): RegistryToast \| undefined` | Read a toast payload from a URL that carries redirect-flash query parameters. |
| `withToast(path: string, toast: RegistryToast): string` | Append a toast payload to a relative application path. |
| `stripToastFromUrl(url: URL): string` | Remove all toast query parameters and keep the path and hash. |

## Next steps

Read [Deferred and streaming UI](/web-layer/defer-streaming-ui/) to wire the Suspense boundaries
that `usePromise` relies on. See also [Data loading and the query cache](/web-layer/query/),
[Fresh UI & design](/web-layer/fresh-ui/) and the [live dashboard tutorial](/tutorials/live-dashboard/).
