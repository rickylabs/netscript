---
layout: layouts/base.vto
title: Examples and sandbox
templateEngine: [vento, md]
order: 11
---

# Examples and sandbox

A curated index of runnable Web Layer examples built on `@netscript/fresh`. Start
here when you want to see the meta-framework end to end rather than one capability
at a time. Each entry below points to a tutorial or how-to that composes the
documented Web Layer surface — page builders, routing, data loading, forms, and
streaming UI — into something you can run.

## Where to start

The flagship example is the **live dashboard** tutorial. It walks through the full
page model: defining a page with the builder, loading data through the query
cache, wiring a server-validated form, and streaming deferred regions into the
response. It is the most complete demonstration of how the Web Layer fits
together.

- [Live dashboard tutorial](/tutorials/live-dashboard/) — the end-to-end Web Layer example.

From there, the Web Layer how-to guides isolate each capability so you can lift a
single pattern into your own project.

## The smallest typed example, end to end

The shortest path from a contract to a rendered island: a typed route reference,
a contract-derived query, and a `QueryIsland`. It composes three documented
surfaces — [routing](/web-layer/route/), the [query cache](/web-layer/query/), and
the [SDK bridge](/services-sdk/sdk/) — and nothing in it is hand-typed:

```tsx
// apps/dashboard/islands/OrdersPanel.tsx
import { QueryIsland, useIslandQuery } from "@netscript/fresh/query";
import { createRouteReference } from "@netscript/fresh/route";
import { orders } from "../lib/api-clients.ts"; // createServiceQueryUtils(ordersClient)

const ordersRoute = createRouteReference("/orders");

function OrdersList() {
  const query = useIslandQuery({
    ...orders.list.queryOptions({ input: { limit: 20 } }),
    staleTime: 15_000,
  });

  return (
    <section>
      <a href={ordersRoute.href()}>Orders</a>
      <ul>
        {query.data?.map((order) => <li key={order.id}>{order.reference}</li>)}
      </ul>
    </section>
  );
}

export default function OrdersPanel() {
  return (
    <QueryIsland>
      <OrdersList />
    </QueryIsland>
  );
}
```

The `orders` query utils come from the single `lib/api-clients.ts` module the
[query cache page](/web-layer/query/) builds — `createServiceClient` →
`createServiceQueryUtils` — so a renamed contract field is a compile error here,
not a runtime blank. For the full read/write pair (typed query plus optimistic
mutation) see that page.

## The package surface

`@netscript/fresh` keeps its capabilities on explicit subpaths. The package root
exposes only the cross-cutting page-loader cache helpers; everything else lives
behind a dedicated import. Reading the root module is the fastest way to see how
the pieces are organised before opening any one guide.

The documented subpaths are `./builders`, `./route`, `./form`, `./defer`,
`./query`, `./server`, `./streams`, `./interactive`, `./vite`, `./error`, and
`./testing`.

The root entry itself centres on cache projection — composing a derived
cache entry from a cached list response so a detail view can reuse a list query's
data without a second round trip:

```ts
import {
  hasAllCacheEntries,
  minCachedAt,
  projectCachedItemFromList,
} from "@netscript/fresh";

// `listEntry` is a cached list response loaded by a page query.
const itemEntry = projectCachedItemFromList(
  listEntry,
  (item) => item.id === selectedId,
);

// Gate rendering on every required cache entry being present.
const ready = hasAllCacheEntries([listEntry, itemEntry]);

// Oldest timestamp across the entries, for staleness display.
const oldest = minCachedAt([listEntry, itemEntry]);
```

`projectCachedItemFromList` preserves the list entry's `cachedAt` timestamp on the
projected item, so the detail view stays consistent with the list it was derived
from.

## API summary

| Symbol | Description |
| --- | --- |
| `hasAllCacheEntries` | Return `true` when every supplied entry is present. |
| `minCachedAt` | Return the oldest `cachedAt` timestamp across the supplied entries. |
| `projectCachedItemFromList` | Project a single cached item from a cached list response while preserving the list timestamp. |
| `CacheEntryLike` | Cached-entry shape shared by page loaders and partial orchestration. |
| `CachedListEntryLike` | Cached list-entry shape used when projecting a single list item. |

`CacheEntryLike<T>` carries a readonly `data` payload and a readonly `cachedAt`
Unix-epoch timestamp in milliseconds. `CachedListEntryLike<TItem>` is the same
shape over a `{ items: TItem[] }` payload.

{{ comp callout { type: "note" } }}
**StackBlitz sandboxes**

Hosted, one-click sandboxes for the Web Layer examples are a planned addition.
Until they ship, clone the tutorial source and run it locally with the
project's build task.
<!-- caveat: arch-debt:fresh-hosted-example-sandboxes -->
{{ /comp }}

## Related

{{ comp.cardsGrid({ columns: 3, cards: [
  { title: "Live dashboard tutorial", body: "The flagship end-to-end Web Layer example.", href: "/tutorials/live-dashboard/" },
  { title: "The Fresh page model", body: "How a Fresh page is shaped and served.", href: "/web-layer/server/" },
  { title: "Pages and the builder", body: "Define a page with the define-page builder.", href: "/web-layer/builders/" },
  { title: "Routing and route contracts", body: "Map URLs to page contracts.", href: "/web-layer/route/" },
  { title: "Data loading and the query cache", body: "Load data through the page query cache.", href: "/web-layer/query/" },
  { title: "Server-validated forms", body: "Validate form submissions on the server.", href: "/web-layer/form/" },
  { title: "Deferred and streaming UI", body: "Stream deferred regions into the response.", href: "/web-layer/defer-streaming-ui/" },
  { title: "Interactive islands", body: "Add client interactivity to a page.", href: "/web-layer/interactive/" },
  { title: "Build and Vite integration", body: "The build pipeline and Vite setup.", href: "/web-layer/vite/" },
  { title: "Error handling and diagnostics", body: "Surface and diagnose page errors.", href: "/web-layer/error/" },
  { title: "Testing Fresh pages", body: "Test pages built with the Web Layer.", href: "/web-layer/testing/" }
] }) }}

Return to the [Web Layer hub](/web-layer/) for the full pillar overview.
