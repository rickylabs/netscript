---
layout: layouts/base.vto
title: Examples and sandbox
templateEngine: [vento, md]
order: 11
---

# Examples and sandbox

This page points you to runnable Web Layer examples built on `@netscript/fresh` and shows the
smallest typed example end to end.

## Where to start

The [live dashboard tutorial](/tutorials/live-dashboard/) is the most complete example. It defines a
page with the builder, loads data through the query cache, wires a server-validated form and streams
deferred regions into the response. The [Web Layer recipes](/web-layer/how-to/) each isolate one
capability that you can lift into your own project.

{{ comp callout { type: "note", title: "No hosted sandboxes" } }}
Hosted one-click playgrounds such as StackBlitz are not available for these examples. Clone the
tutorial source repository and run it locally with the project's build tasks.
<!-- caveat: arch-debt:fresh-hosted-example-sandboxes -->
{{ /comp }}

## The smallest typed example, end to end

The shortest path from a contract to a rendered island combines a typed route reference from
[routing](/web-layer/route/), a contract-derived query from the [query cache](/web-layer/query/) and
the [SDK bridge](/services-sdk/sdk/), and a `QueryIsland`. Nothing in it is typed by hand:

```tsx
// apps/dashboard/islands/OrdersPanel.tsx
import { QueryIsland, useIslandQuery } from "@netscript/fresh/query";
import { createRouteReference } from "@netscript/fresh/route";
import { ordersQueries } from "../lib/orders.ts";

const ordersRoute = createRouteReference("/orders");

function OrdersList() {
  const query = useIslandQuery({
    ...ordersQueries.list.queryOptions({ limit: 20 }),
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

`ordersQueries` comes from a per-service `lib/orders.ts` module built the way
[Data loading and the query cache](/web-layer/query/) shows, with `createServiceClient` and then
`createQueryFactories`. A renamed contract field is therefore a compile error here. That page also
pairs the query with an optimistic mutation.

## The package surface

The `@netscript/fresh` root exports only the page-loader cache helpers; every other capability has
its own subpath. The helpers let a detail view reuse a cached list response without a second round
trip:

```ts no-check:uses cached values supplied by the surrounding page loader
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

`projectCachedItemFromList` keeps the list entry's `cachedAt` on the projected item, so the detail
view stays consistent with its list. The helper and type reference is in
[Cache entries at the loader](/web-layer/query/#cache-entries-at-the-loader).

## Next steps

Work through the [live dashboard tutorial](/tutorials/live-dashboard/). See also
[Pages and the define-page builder](/web-layer/builders/) and
[Interactive islands](/web-layer/interactive/).
