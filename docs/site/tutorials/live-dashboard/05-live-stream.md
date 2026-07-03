---
layout: layouts/base.vto
title: Real-time updates with durable streams
templateEngine: [vento, md]
prev: { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" }
next: { label: "6 · Deploy", href: "/tutorials/live-dashboard/06-deploy/" }
---

# Real-time updates with durable streams

In chapter 4 the table was live on the *client* — it refetched and mutated without a navigation.
Now you make it live from the *server*: a durable StreamDB pushes change events to the browser, and a
`useLiveQuery` hook re-renders rows the instant their state changes. This is the payoff of the whole
track: a table that updates by itself.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/live-dashboard/01-scaffold/" },
  { label: "2 · Contract to service", href: "/tutorials/live-dashboard/02-contract-to-service/" },
  { label: "3 · Cache-first query", href: "/tutorials/live-dashboard/03-sdk-cache-first-query/" },
  { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" },
  { label: "5 · Live stream", href: "/tutorials/live-dashboard/05-live-stream/" },
  { label: "6 · Deploy", href: "/tutorials/live-dashboard/06-deploy/" }
] }) }}

## What you will build

A live monitor island that subscribes to a durable StreamDB and renders rows that update in
real time. You will open a `StreamDB` handle pointed at the streams runtime on port **4437**, drive a
table with `useLiveQuery`, and seed the island from the server so the first paint is instant. The
worked example is the **sagas** stream — the durable change-stream the showcase ships and the same
mechanism your order dashboard uses to go live.

{{ comp callout { type: "note", title: "Why the example uses the sagas stream" } }}
NetScript's durable-streams runtime mirrors execution state — saga instances, worker executions — into change-streams that the frontend can subscribe to. The showcase's canonical live table is the saga instance monitor, so that is what this chapter grounds in. The <code>createSagasStreamDB</code> → <code>useLiveQuery</code> pattern is identical for any StreamDB collection; once you have it, pointing a live table at your own stream is the same three moves. To follow this chapter against running data, the workspace needs the <strong>sagas</strong> plugin and its streams runtime — add the published package with <code>netscript plugin install @netscript/plugin-sagas</code> if it is not already installed.
{{ /comp }}

## Before you begin

You should have completed [chapter 4](/tutorials/live-dashboard/04-definePage-QueryIsland/): the
orders page rendering through `definePage` with a hydrated `QueryIsland`. The live layer needs the
streams runtime reachable. With `aspire start` up, confirm it answers on **4437**:

```sh
curl http://localhost:4437/health
```

A healthy response means the durable-streams producer runtime is live. If the port is dead, the
sagas plugin (which brings the stream) is not installed or Aspire has not finished booting it — check
the [dashboard](/explanation/aspire/) resource list at `:18888`.

{{ comp callout { type: "note", title: "HTTP/2 is opt-in for live subscriptions" } }}
The live subscription runs over plaintext <strong>HTTP/1.1</strong> by default, which caps how many concurrent SSE connections a browser opens per origin. HTTP/2 lifts that cap but is opt-in and requires TLS — via <code>ServiceTlsOptions</code> or the <code>NETSCRIPT_TLS_CERT_FILE</code> / <code>NETSCRIPT_TLS_KEY_FILE</code> environment variables. See <a href="/capabilities/streams/">Durable streams</a> for the connection-limit detail.
{{ /comp }}

## Step 1 — Open a StreamDB handle

`createSagasStreamDB` from `@plugins/sagas/streams` opens a typed StreamDB client against the streams
runtime. You give it the runtime's `baseUrl`; it gives you typed `collections` you can query. Build
it inside the island, memoized on the URL, and manage its lifecycle:

```tsx
// apps/dashboard/islands/SagasLiveIsland.tsx (the StreamDB handle)
import { useEffect, useMemo } from 'preact/hooks';
import { createSagasStreamDB, type SagaInstance } from '@plugins/sagas/streams';

function SagasLiveInner(props: { streamsBaseUrl: string }) {
  const sagasDb = useMemo(
    () => createSagasStreamDB({ baseUrl: props.streamsBaseUrl }),
    [props.streamsBaseUrl],
  );

  // Preload the stream on mount; close it on unmount.
  useEffect(() => {
    void sagasDb.preload();
    return () => sagasDb.close();
  }, [sagasDb]);

  // … useLiveQuery below
}
```

`preload()` warms the stream so the first frame has data; `close()` tears the subscription down when
the island unmounts. Always pair them — a leaked subscription keeps a connection open.

## Step 2 — Drive a table with useLiveQuery

`useLiveQuery` from `@netscript/fresh/query` runs a query against a StreamDB collection and
**re-renders whenever the underlying data changes** — no polling, no manual refetch. Query the
`sagaInstance` collection:

```tsx
// apps/dashboard/islands/SagasLiveIsland.tsx (the live query)
import { useLiveQuery } from '@netscript/fresh/query';

const { data: instanceRows = [] } = useLiveQuery(
  (query) => query.from({ instance: sagasDb.collections.sagaInstance }),
  [sagasDb],
);

const instances = instanceRows as SagaInstance[];
// Render `instances` as a table — each row updates the moment its saga advances.
```

The callback shape is a tiny query builder: `query.from({ instance: <collection> })` selects rows
from the `sagaInstance` collection. When the server pushes a change for any of those rows,
`useLiveQuery` returns the new array and the table re-renders. That is the entire real-time path on
the client.

{{ comp callout { type: "tip", title: "Live vs. fetched, side by side" } }}
A live island typically runs <strong>both</strong> kinds of read: a <code>useQuery</code> for the slow-changing inventory (the list of sagas), and a <code>useLiveQuery</code> for the fast-changing instance rows. The first is cache-first and revalidated; the second is pushed in real time. The showcase island does exactly this — the inventory comes from <code>useQuery</code>, the live rows from <code>useLiveQuery</code>.
{{ /comp }}

## Step 3 — Seed the island from the server

Real time should not mean a blank first paint. Seed the island on the server: resolve the streams
URL, pre-warm the SDK cache, and dehydrate a TanStack Query client so the island hydrates with data
already in hand. `getStreamsUrl` from `@netscript/plugin-streams-core` resolves the runtime address:

```ts
// apps/dashboard/routes/(dashboard)/dashboard/plugin/(_shared)/stream-loaders.ts
import { dehydrateQueryClient } from '@netscript/fresh/query';
import { createNetScriptQueryClient } from '@netscript/sdk/query-client';
import { getStreamsUrl } from '@netscript/plugin-streams-core';
import { sagasQueryUtils } from '@app/lib/api-clients.ts';

const INVENTORY_INPUT = { limit: '12', offset: '0' } as const;

export async function sagasStreamSeedLoader() {
  // 1. Fetch through the SDK (also warms the KV cache for getCachedEntry hits).
  const sagasData = await sagasQueryUtils.listSagas(INVENTORY_INPUT);

  // 2. Populate a temporary QueryClient and dehydrate it for the island.
  const queryClient = createNetScriptQueryClient();
  queryClient.setQueryData(sagasQueryUtils.listSagas.clientKey(INVENTORY_INPUT), sagasData);
  const dehydratedState = dehydrateQueryClient(queryClient);

  return {
    inventoryInput: INVENTORY_INPUT,
    streamsBaseUrl: getStreamsUrl(),
    dehydratedState,
  };
}
```

The island receives `streamsBaseUrl` (for Step 1's StreamDB handle), `inventoryInput` (for the
`useQuery` inventory read), and `dehydratedState` (the pre-warmed TanStack cache). On mount the
island rehydrates from `dehydratedState`, so the inventory is present immediately and the live rows
stream in on top.

{{ comp callout { type: "warning", title: "Streams is its own runtime — and it must be up" } }}
The durable-streams producer is a <strong>separate Aspire service on :4437</strong>, not part of your orders service. <code>getStreamsUrl()</code> resolves its address from the environment the same way <code>getServiceUrl</code> does for services — so it only works when <code>aspire start</code> has brought the streams runtime up. With no streams runtime, <code>useLiveQuery</code> has nothing to subscribe to and the live table stays empty (the <code>useQuery</code> inventory still renders from cache). See <a href="/capabilities/streams/">Durable streams</a>.
{{ /comp }}

## Step 4 — Wrap the island in QueryIsland

`useLiveQuery` and `useQuery` both need the TanStack Query context, so the live monitor lives inside
a `QueryIsland` exactly like chapter 4's orders island. Hydrate the dehydrated state on first render:

```tsx
// apps/dashboard/islands/SagasLiveIsland.tsx (the island boundary)
import { getIslandQueryClient, hydrateFromDehydrated, QueryIsland } from '@netscript/fresh/query';

export default function SagasLiveIsland(props) {
  return (
    <QueryIsland>
      <SagasLiveInner {...props} />
    </QueryIsland>
  );
}

// Inside SagasLiveInner, once, before the queries:
//   const islandQueryClient = getIslandQueryClient();
//   if (props.dehydratedState) hydrateFromDehydrated(islandQueryClient, props.dehydratedState);
```

`getIslandQueryClient()` returns the island's QueryClient; `hydrateFromDehydrated` seeds it from the
server's `dehydratedState`. After that, `useQuery` reads the seeded inventory and `useLiveQuery`
takes over the live rows.

## Verify your progress

With `aspire start` up, open the live monitor in the browser and watch it update. The showcase serves
it at the plugin route; in your workspace the live saga monitor renders wherever you mount
`SagasLiveIsland`. To *see* it move, trigger a saga — creating an order publishes an `OrderCreated`
saga message (chapter 2's service does this), which advances a saga instance and pushes a change down
the stream:

```sh
curl -X POST http://localhost:3002/api/v1/orders/create \
  -H 'content-type: application/json' \
  -d '{ "userId": 1, "total": 49.9, "status": "pending", "shippingStreet": "1 Main", "shippingCity": "Berlin", "shippingCountry": "DE", "shippingZipCode": "10115", "items": [{ "productId": 1, "quantity": 1 }] }'
```

Within a moment a new saga instance row should appear and advance through its steps **without a page
reload**. Type-check the new files:

```sh
deno task check
```

- [ ] `curl http://localhost:4437/health` returns healthy (streams runtime up).
- [ ] The live island opens a `createSagasStreamDB` handle and queries it with `useLiveQuery`.
- [ ] The island is seeded server-side (`getStreamsUrl` + `dehydrateQueryClient`) and hydrates on
      mount.
- [ ] Creating an order makes a row appear/advance live, with no reload.
- [ ] `deno task check` is clean.

{{ comp callout { type: "tip", title: "Nothing moves when you create an order?" } }}
Two usual causes: the sagas plugin (and its streams runtime on :4437) is not installed/booted — check the <a href="/explanation/aspire/">dashboard</a> resource list; or <code>getStreamsUrl()</code> resolved nothing because <code>aspire start</code> is down. The <code>useQuery</code> inventory still renders from cache, which is why the panel looks alive but never moves.
{{ /comp }}

## What you built

A real-time table: a durable StreamDB handle (`createSagasStreamDB`) driving `useLiveQuery`, seeded
from the server with `getStreamsUrl` + dehydration, wrapped in a `QueryIsland`. Your dashboard now
updates the instant server state changes — the full contract → client → query → island → stream
spine, end to end. Next you run the whole graph locally under Aspire.

{{ comp.nextPrev({ prev: { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" }, next: { label: "6 · Deploy", href: "/tutorials/live-dashboard/06-deploy/" } }) }}
