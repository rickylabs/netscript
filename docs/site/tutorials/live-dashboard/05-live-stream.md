---
layout: layouts/base.vto
title: Real-time updates with durable streams
templateEngine: [vento, md]
prev: { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" }
next: { label: "6 · Deploy", href: "/tutorials/live-dashboard/06-deploy/" }
---

# Real-time updates with durable streams

In this chapter the **server** pushes data into an open page. In chapter 4 the table learned about
changes only by asking; here a durable change-stream feeds a `useLiveQuery` hook that re-renders when
data arrives, with no polling loop, no refresh button and no refetch. The worked example is the
sagas stream, which the sagas plugin updates after each durable saga transition.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/live-dashboard/01-scaffold/" },
  { label: "2 · Contract to service", href: "/tutorials/live-dashboard/02-contract-to-service/" },
  { label: "3 · Cache-first query", href: "/tutorials/live-dashboard/03-sdk-cache-first-query/" },
  { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" },
  { label: "5 · Live stream", href: "/tutorials/live-dashboard/05-live-stream/" },
  { label: "6 · Deploy", href: "/tutorials/live-dashboard/06-deploy/" }
] }) }}

## What you will build

A live monitor island that subscribes to a durable StreamDB and re-renders when new events arrive.
You open a `StreamDB` handle pointed at the streams runtime, drive a table with `useLiveQuery`, and
mount it from a `definePage` page that resolves the stream address on the server. The example uses
the **sagas** stream, the durable change-stream the sagas plugin ships with a ready-made typed
collection.

{{ comp callout { type: "note", title: "Why the example uses the sagas stream" } }}
NetScript's durable-streams runtime mirrors execution state, such as saga instances and worker
executions, into change-streams the frontend can subscribe to. The sagas plugin ships a ready-made
<em>typed</em> collection: <code>createSagasStreamDB</code> gives <code>useLiveQuery</code> a StreamDB
it can query with full types. The pattern is the same for any StreamDB collection, and the streams
plugin scaffolds a user-owned durable stream you can point a live table at (see
<a href="#point-it-at-your-own-stream">Point it at your own stream</a>). To follow this chapter
against running data, the workspace needs the <strong>sagas</strong> plugin and its streams runtime:
install it with <code>netscript plugin install @netscript/plugin-sagas</code> if it isn't installed
yet.
{{ /comp }}

## Before you begin

You need [chapter 4](/tutorials/live-dashboard/04-definePage-QueryIsland/)'s orders page rendering
through `definePage` with a hydrated `QueryIsland`, and a reachable streams runtime. With
`aspire start` up, copy the `streams` endpoint from the [dashboard](/explanation/aspire/) resource
list and confirm it answers:

```sh
curl <streams-endpoint>/health
```

The installer picked its host port, so the resource list is the only place to read it. A healthy
response means the durable-streams producer runtime is live. If it doesn't answer, the sagas plugin
(which brings the stream) isn't installed or Aspire hasn't finished booting it: check the resource
list at `:18888`.

{{ comp callout { type: "note", title: "HTTP/2 is opt-in for live subscriptions" } }}
The live subscription is <strong>long-poll by default</strong> (SSE is opt-in) and runs over
plaintext <strong>HTTP/1.1</strong>, which caps how many long-lived connections a browser opens per
origin. HTTP/2 lifts that cap; it is opt-in and requires TLS, through <code>ServiceTlsOptions</code>
or the <code>NETSCRIPT_TLS_CERT_FILE</code> / <code>NETSCRIPT_TLS_KEY_FILE</code> environment
variables. See {{ comp.xref({ key: "cap:streams" }) }} for the connection limit.
{{ /comp }}

## Step 1 — Open a StreamDB handle

`createSagasStreamDB` from `@plugins/sagas/streams` opens a typed StreamDB client against the streams
runtime: you give it the runtime's `baseUrl` and get typed `collections` to query. Build it inside
the island, memoized on the URL, and manage its lifecycle:

```tsx
// apps/dashboard/routes/(dashboard)/dashboard/sagas/(_islands)/SagasLiveIsland.tsx (the StreamDB handle)
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

`preload()` warms the stream so the first frame has data, and `close()` ends the subscription when
the island unmounts. Always pair them: a leaked subscription keeps a connection open.

## Step 2 — Drive a table with useLiveQuery

`useLiveQuery` from `@netscript/fresh/query` runs a query against a StreamDB collection and
**re-renders whenever the underlying data changes**. Query the `sagaInstance` collection:

```tsx
// apps/dashboard/routes/(dashboard)/dashboard/sagas/(_islands)/SagasLiveIsland.tsx (the live query)
import { useLiveQuery } from '@netscript/fresh/query';

const { data: instanceRows = [] } = useLiveQuery(
  (query) => query.from({ instance: sagasDb.collections.sagaInstance }),
  [sagasDb],
);

const instances = instanceRows as SagaInstance[];
// Render `instances` as a table — the array is replaced whenever the stream
// pushes a change for one of these rows, and the table re-renders.
```

The callback is a small query builder: `query.from({ instance: <collection> })` selects rows from the
`sagaInstance` collection. When the server pushes a change for any of those rows, `useLiveQuery`
returns the new array and the table re-renders. That is the whole push path on the client.

{{ comp callout { type: "tip", title: "Live and fetched reads together" } }}
A live island often runs <strong>two</strong> kinds of read: a <code>useQuery</code> against a typed
service contract for slow-changing reference data, and a <code>useLiveQuery</code> against a StreamDB
collection for fast-changing rows. This chapter builds only the second. The first would need a sagas
<em>service</em> client, a <code>createServiceClient</code> and <code>createQueryFactories</code> pair
like the one chapter 3 built for <code>orders</code>; chapter 4's orders island shows that
cache-first half.
{{ /comp }}

## Step 3 — Seed the island from the server

Before it can subscribe, the island needs the streams runtime's address from the server. Resolve it
in a `definePage` page with the same shape as chapter 4, a request-scoped `.withResource` feeding a
`.withLayer` loader. `getStreamsUrl` from `@netscript/plugin-streams-core` resolves the runtime
address:

```tsx
// apps/dashboard/routes/(dashboard)/dashboard/sagas/index.tsx
import { definePage } from '@app/utils.ts';
import { getStreamsUrl } from '@netscript/plugin-streams-core';
import SagasLiveIsland from './(_islands)/SagasLiveIsland.tsx';

export const sagasMonitorPage = definePage()
  .withTelemetry({ enabled: true, spanName: 'dashboard.sagas.live' })
  // Resolved once per request; the layer loader below awaits it.
  .withResource('streamsBaseUrl', () => getStreamsUrl())
  .withLayer('monitor', SagasLiveIsland, {
    loader: async (ctx) => ({
      streamsBaseUrl: await ctx.resource('streamsBaseUrl'),
    }),
  })
  .withLayout((slots) => <main class='ns-page'>{slots.monitor()}</main>)
  .withMeta(() => ({ title: 'Saga monitor', description: 'Live saga instances.' }))
  .build();

export const { handler, default: page } = sagasMonitorPage;
export { page as default };
```

The layer loader hands the island the one prop Step 1's StreamDB handle needs. This page has no
`withPolicy`, `partial` or `staleTime`, and no dehydrated query cache. Chapter 4 needed them because
its rows arrive by request and must survive a cold cache; these rows arrive by **push**.
[Partials](/web-layer/partials/) explains what a `partial` layer gives a region whose data arrives by
request, and why a pushed region doesn't need one.

{{ comp callout { type: "note", title: "Why no dehydrated seed here" } }}
Chapter 4 seeded its island with <code>dehydrateQueryClient</code> because <code>useQuery</code>
reads through a query key the server can pre-populate. <code>useLiveQuery</code> reads from a
StreamDB collection, and <code>preload()</code> from Step 1 is its warm-up: it fills the first frame
from the stream. A dehydrated TanStack cache here would seed a cache nothing on the page reads.
{{ /comp }}

{{ comp callout { type: "warning", title: "The streams runtime must be up" } }}
The durable-streams producer is a <strong>separate Aspire service</strong> with its own allocated
port, not part of your orders service. <code>getStreamsUrl()</code> resolves its address from the
environment, as <code>getServiceUrl</code> does for services, so it works only when
<code>aspire start</code> has brought the streams runtime up. Without it, <code>useLiveQuery</code>
has nothing to subscribe to and the live table stays empty. See
{{ comp.xref({ key: "cap:streams" }) }}.
{{ /comp }}

## Step 4 — Wrap the island in QueryIsland

`useLiveQuery` needs the TanStack Query context, so the live monitor sits inside a `QueryIsland`, like
chapter 4's orders island:

```tsx
// apps/dashboard/routes/(dashboard)/dashboard/sagas/(_islands)/SagasLiveIsland.tsx (the island boundary)
import { QueryIsland } from '@netscript/fresh/query';

export default function SagasLiveIsland(props: { streamsBaseUrl: string }) {
  return (
    <QueryIsland>
      <SagasLiveInner streamsBaseUrl={props.streamsBaseUrl} />
    </QueryIsland>
  );
}

// SagasLiveInner holds Step 1's StreamDB handle and Step 2's useLiveQuery.
```

`QueryIsland` supplies the context, and `SagasLiveInner` does the work: open the handle, `preload()`,
subscribe with `useLiveQuery`, and `close()` on unmount. The island is complete; check it compiles on
its own:

```sh
deno check 'apps/dashboard/routes/(dashboard)/dashboard/sagas/(_islands)/SagasLiveIsland.tsx' --unstable-kv
```

A clean check confirms the StreamDB handle and the live query line up.

## Point it at your own stream

Everything above consumes a stream the framework produces. You can also produce your own: if the
**streams** plugin is installed (`netscript plugin install streams`), its scaffolder wrote
`streams/notifications-stream.ts`, a user-owned durable stream you edit like any other source file.
It uses the same two primitives as this chapter:

```ts
// streams/notifications-stream.ts (scaffolded — yours to edit)
// defineStreamSchema declares the typed collections; createDurableStream
// returns the producer. Swap the sample event shape for your own domain
// events — an order.cancelled event is one zod object away.
import { createDurableStream, defineStreamSchema } from '@netscript/plugin-streams-core';
```

The producer publishes with `upsert(collection, row)` and `await flush()`, and a browser consumes a
user-defined stream over HTTP at its `streamPath` (long-poll subscription by default, SSE available).
{{ comp.xref({ key: "cap:streams", text: "The Durable streams page" }) }} covers the full producer
surface, URL resolution and current limitations; start your own `order-events` stream there.

## Verify your progress

With `aspire start` up, open the live monitor at `/dashboard/sagas/`, the route Step 3's page
declares. Take the app's host from the [Aspire dashboard](/explanation/aspire/) resource list: a
scaffolded Fresh app pins no host port, so Aspire allocates one at each start.

The table starts empty. Chapter 2 built a plain oRPC read-model, not a saga producer, so posting an
order does **not** publish a saga message. You create a saga instance yourself, in the order below,
so the push is observable.

The live producer runs in the saga processor after each durable transition, on either the Prisma or
the KV store backend. Prisma also reconciles, at startup, instances created before the stream
producer was available. When you need that historical backfill, install the plugin with
`netscript plugin install @netscript/plugin-sagas --saga-store-backend prisma`, then run
`netscript db init`.

```sh
# Install the shorthand once (see the storefront track for the full form):
#   deno install -gArf -n ns-sagas jsr:@netscript/plugin-sagas{{ releaseSpecifier }}/cli

# 1. Register a throwaway saga, then restart the graph — the processor loads
#    its registry at boot, so a saga added while it runs is not yet known.
ns-sagas add saga demo --message-type=DemoStarted --durability=t1 --topic=demo

# 2. With the graph back up, open the monitor page and leave it connected.

# 3. Publish a message. The engine durably records the transition and then
#    upserts the latest instance state into the live stream.
ns-sagas publish DemoStarted --payload='{ "id": "demo_1" }' --correlation-key=demo_1

# 4. Confirm the instance exists in the durable store.
ns-sagas list --instances --saga=DemoSaga --json
```

With the subscription live, the first transition's upsert arrives over the open connection and the
row appears **without a page reload**. Every later step, including failure and compensation steps,
updates the same `sagaInstance` row once its transition is durable. Restarting the saga processor
doesn't erase progress; on Prisma, the service's startup reconciliation also backfills historical
rows into the stream.

Type-check the new files:

```sh
deno task check
```

- [ ] `curl <streams-endpoint>/health` (endpoint from the Aspire resource list) returns healthy.
- [ ] The live island opens a `createSagasStreamDB` handle and queries it with `useLiveQuery`.
- [ ] A `definePage` page at `dashboard/sagas/index.tsx` resolves `getStreamsUrl()` in a
      `.withResource` and hands it to the island through a `.withLayer` loader.
- [ ] With the page open, publishing and advancing a saga updates its row through the subscription,
      with no reload.
- [ ] `deno task check` is clean.

{{ comp callout { type: "tip", title: "No row after the restart?" } }}
Work down the path in order. <code>ns-sagas list --instances --json</code> shows whether the instance
exists; if it doesn't, the saga never registered (<code>ns-sagas list --registered --json</code>) or
the publish failed. If the instance exists but no row arrives, check that the streams runtime is up
and that both the processor's durable-stream producer and the page's <code>getStreamsUrl()</code>
resolved the streams service; with a dead streams endpoint, no transition event reaches the stream.
The Prisma-only <code>Saga Prisma delegates unavailable</code> startup warning means historical
reconciliation is skipped; it doesn't disable live per-transition upserts on KV.
{{ /comp }}

## What you built

A server-pushed table: a durable StreamDB handle (`createSagasStreamDB`) driving `useLiveQuery`,
wrapped in a `QueryIsland` and mounted by a `definePage` page whose `.withResource` resolves the
streams address. State that entered the store through a saga publish arrived in an already-open page
with no polling, refetch or reload, and each later transition updates the same row. Next, you run
the whole graph locally under Aspire.
