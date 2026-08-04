---
layout: layouts/base.vto
title: Real-time updates with durable streams
templateEngine: [vento, md]
prev: { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" }
next: { label: "6 · Deploy", href: "/tutorials/live-dashboard/06-deploy/" }
---

# Real-time updates with durable streams

In chapter 4 the table was live on the *client* — it refetched and mutated without a navigation.
But it still only knows what it fetched, and it only learns anything by asking. This chapter builds
the other direction: a durable change-stream that the **server** pushes into an open page, read by a
`useLiveQuery` hook that re-renders when data arrives — no polling loop, no refresh button, no
refetch.

Be clear-eyed about how far the shipped plumbing carries that today. The subscription half is
complete: a StreamDB handle, a live query, and rows that appear in an already-open page without a
reload. The *producer* half is where the current runtime stops short — the sagas plugin mirrors its
instances into the stream once, when its service starts, rather than on every transition. So you will
build a genuinely live view and drive a genuinely pushed update through it, and you will see exactly
where the seam ends.

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
You will open a `StreamDB` handle pointed at the streams runtime, drive a table with `useLiveQuery`,
and mount it from a `definePage` page that resolves the stream address on the server. The worked
example is the **sagas** stream — the durable change-stream the sagas plugin ships with a ready-made
typed collection.

{{ comp callout { type: "note", title: "Why the example uses the sagas stream" } }}
NetScript's durable-streams runtime mirrors execution state — saga instances, worker executions — into change-streams that the frontend can subscribe to. The sagas plugin ships the ready-made <em>typed</em> collection for this: <code>createSagasStreamDB</code> gives <code>useLiveQuery</code> a StreamDB it can query with full types, which is why this chapter's worked live table grounds there. The pattern is identical for any StreamDB collection; once you have it, pointing a live table at your own stream is the same three moves — and the producer half of that story is already in reach, because the streams plugin scaffolds a user-owned durable stream into your workspace (see the closing section). To follow this chapter against running data, the workspace needs the <strong>sagas</strong> plugin and its streams runtime — add the published package with <code>netscript plugin install @netscript/plugin-sagas</code> if it is not already installed.
{{ /comp }}

## Before you begin

You should have completed [chapter 4](/tutorials/live-dashboard/04-definePage-QueryIsland/): the
orders page rendering through `definePage` with a hydrated `QueryIsland`. The live layer needs the
streams runtime reachable. With `aspire start` up, find the `streams` resource in the
[dashboard](/explanation/aspire/) resource list, copy its endpoint, and confirm it answers:

```sh
curl <streams-endpoint>/health
```

Its host port was picked by the installer, not fixed by you — the resource list is the only place to
read it. A healthy response means the durable-streams producer runtime is live. If it is dead, the
sagas plugin (which brings the stream) is not installed or Aspire has not finished booting it — check
the [dashboard](/explanation/aspire/) resource list at `:18888`.

{{ comp callout { type: "note", title: "HTTP/2 is opt-in for live subscriptions" } }}
The live subscription is <strong>long-poll by default</strong> (SSE is opt-in) and runs over plaintext <strong>HTTP/1.1</strong>, which caps how many long-lived connections a browser opens per origin. HTTP/2 lifts that cap but is opt-in and requires TLS — via <code>ServiceTlsOptions</code> or the <code>NETSCRIPT_TLS_CERT_FILE</code> / <code>NETSCRIPT_TLS_KEY_FILE</code> environment variables. See {{ comp.xref({ key: "cap:streams" }) }} for the connection-limit detail.
{{ /comp }}

## Step 1 — Open a StreamDB handle

`createSagasStreamDB` from `@plugins/sagas/streams` opens a typed StreamDB client against the streams
runtime. You give it the runtime's `baseUrl`; it gives you typed `collections` you can query. Build
it inside the island, memoized on the URL, and manage its lifecycle:

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

`preload()` warms the stream so the first frame has data; `close()` tears the subscription down when
the island unmounts. Always pair them — a leaked subscription keeps a connection open.

## Step 2 — Drive a table with useLiveQuery

`useLiveQuery` from `@netscript/fresh/query` runs a query against a StreamDB collection and
**re-renders whenever the underlying data changes** — no polling, no manual refetch. Query the
`sagaInstance` collection:

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

The callback shape is a tiny query builder: `query.from({ instance: <collection> })` selects rows
from the `sagaInstance` collection. When the server pushes a change for any of those rows,
`useLiveQuery` returns the new array and the table re-renders. That is the entire push path on the
client — it reacts to whatever the producer sends, as soon as it arrives.

{{ comp callout { type: "tip", title: "Live vs. fetched — when you would run both" } }}
A mature live island often runs <strong>two</strong> kinds of read side by side: a <code>useQuery</code> against a typed service contract for slow-changing reference data, and a <code>useLiveQuery</code> against a StreamDB collection for the fast-changing rows. This chapter builds only the second. The first would need a sagas <em>service</em> client — a <code>createServiceClient</code> + <code>createQueryFactories</code> pair like chapter 3 built for <code>orders</code> — and this track never creates one, so no snippet here pretends to. Chapter 4's orders island is the worked example of the cache-first half.
{{ /comp }}

## Step 3 — Seed the island from the server

The island needs one thing from the server before it can subscribe: the streams runtime's address.
Resolve it in a `definePage` page — the same shape as chapter 4, a request-scoped `.withResource`
feeding a `.withLayer` loader — so the live monitor gets a real page rather than a loose helper
function. `getStreamsUrl` from `@netscript/plugin-streams-core` resolves the runtime address:

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

The layer loader hands the island the one prop Step 1's StreamDB handle needs. Note what is *not*
here: no `withPolicy`, no `partial`, no `staleTime`, and no dehydrated query cache. Chapter 4 needed
all of that because its rows arrive by request and must survive a cold cache; these rows arrive by
**push**, so the same machinery would be dead weight. A live page is the lighter of the two — the
builder does not force you to carry what you are not using. [Partials](/web-layer/partials/) covers
the other side of that choice: what a `partial` layer buys a region whose data arrives by request,
and why a pushed region does not want it.

{{ comp callout { type: "note", title: "Why no dehydrated seed here" } }}
Chapter 4 seeded its island with <code>dehydrateQueryClient</code> because <code>useQuery</code> reads through a query key that the server can pre-populate. <code>useLiveQuery</code> reads from a StreamDB collection instead, and <code>preload()</code> — Step 1 — is its equivalent warm-up: it fills the first frame from the stream itself. Adding a dehydrated TanStack cache here would seed a cache nothing on this page reads.
{{ /comp }}

{{ comp callout { type: "warning", title: "Streams is its own runtime — and it must be up" } }}
The durable-streams producer is a <strong>separate Aspire service</strong> with its own allocated port, not part of your orders service. <code>getStreamsUrl()</code> resolves its address from the environment the same way <code>getServiceUrl</code> does for services — so it only works when <code>aspire start</code> has brought the streams runtime up. With no streams runtime, <code>useLiveQuery</code> has nothing to subscribe to and the live table stays empty. See {{ comp.xref({ key: "cap:streams" }) }}.
{{ /comp }}

## Step 4 — Wrap the island in QueryIsland

`useLiveQuery` needs the TanStack Query context, so the live monitor lives inside a `QueryIsland`
exactly like chapter 4's orders island:

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

The boundary is deliberately thin: `QueryIsland` supplies the context, and `SagasLiveInner` does the
work — open the handle, `preload()`, subscribe with `useLiveQuery`, `close()` on unmount. The island
is now complete — prove it compiles as a unit:

```sh
deno check 'apps/dashboard/routes/(dashboard)/dashboard/sagas/(_islands)/SagasLiveIsland.tsx' --unstable-kv
```

A clean check confirms the StreamDB handle and the live query line up.

## Point it at your own stream

Everything above consumes a stream the framework produces for you. The producer half of the seam is
just as close: if your workspace has the **streams** plugin installed (`netscript plugin install
streams`), its scaffolder wrote `streams/notifications-stream.ts` — a user-owned durable stream you
edit like any other source file. It is the same two primitives this whole chapter rides on:

```ts
// streams/notifications-stream.ts (scaffolded — yours to edit)
// defineStreamSchema declares the typed collections; createDurableStream
// returns the producer. Swap the sample event shape for your own domain
// events — an order.cancelled event is one zod object away.
import { createDurableStream, defineStreamSchema } from '@netscript/plugin-streams-core';
```

The producer publishes with `upsert(collection, row)` and `await flush()`; a browser consumes a
user-defined stream over HTTP at its `streamPath` (long-poll subscription by default, SSE available). The full producer surface, URL resolution,
and current limitations are on {{ comp.xref({ key: "cap:streams", text: "the Durable streams page" }) }} —
when you outgrow the sagas monitor, that is where your own `order-events` stream starts.

## Verify your progress

With `aspire start` up, open the live monitor at `/dashboard/sagas/` — the route Step 3's page
declares. Get the app's host from the [Aspire dashboard](/explanation/aspire/) resource list rather
than a memorized port; a scaffolded Fresh app pins no host port, so Aspire allocates one at each
start.

The table starts empty, because nothing in this track has created a saga instance yet — chapter 2
built a plain oRPC read-model, not a saga producer, so posting an order does **not** publish a saga
message. You create one yourself, and the order of the steps is what makes the push observable.

**Precondition.** The mirror that fills this stream reads saga instances through Prisma delegates, so
the sagas plugin must be installed on the Prisma store backend with its migration applied
(`netscript plugin install @netscript/plugin-sagas --saga-store-backend prisma`, then
`netscript db init`). On the KV backend the sagas service logs `Saga Prisma delegates unavailable`
and never mirrors anything — the table stays empty no matter what you publish.

```sh
# Install the shorthand once (see the storefront track for the full form):
#   deno install -gArf -n ns-sagas jsr:@netscript/plugin-sagas{{ releaseSpecifier }}/cli

# 1. Register a throwaway saga, then restart the graph — the processor loads
#    its registry at boot, so a saga added while it runs is not yet known.
ns-sagas add saga demo --message-type=DemoStarted --durability=t1 --topic=demo

# 2. With the graph back up, publish a message. The engine starts a durable
#    saga instance and writes it to the saga database.
ns-sagas publish DemoStarted --payload='{ "id": "demo_1" }' --correlation-key=demo_1

# 3. Confirm the instance exists in the durable store.
ns-sagas list --instances --saga=DemoSaga --json
```

Now open the monitor page in the browser and **leave it open**. With the page connected and its
subscription live, restart the sagas service one more time. As it finishes starting, its stream
mirror reconciles every saga instance out of the database and upserts each one into the
`sagaInstance` collection — and because your page is already subscribed, that upsert arrives over the
open connection and the row appears **without a page reload**. That is the push path, end to end,
proven with the only mechanism the runtime actually wires today.

{{ comp callout { type: "warning", title: "The sagas mirror reconciles at startup — it is not yet a change feed" } }}
This is the seam this chapter is honest about. <code>startSagasStreamMirror()</code> runs <strong>once</strong>, during the sagas service's post-listen startup, and performs a finite paged reconciliation: it reads saga instances from the database, upserts each into the stream, and returns. No publish or state-transition path writes to the stream afterwards. So an open page receives a genuine server push — the arrival really is unsolicited and reload-free — but it arrives <strong>once per sagas-service start</strong>, not on every saga step. A saga that advances while the service keeps running will not move the row until the next restart reconciles it. The client half you built (StreamDB, subscription, <code>useLiveQuery</code>) is fully live and needs no change; it is the plugin's producer that has room to grow into a per-transition feed.
{{ /comp }}

Type-check the new files:

```sh
deno task check
```

- [ ] `curl <streams-endpoint>/health` (endpoint from the Aspire resource list) returns healthy.
- [ ] The live island opens a `createSagasStreamDB` handle and queries it with `useLiveQuery`.
- [ ] A `definePage` page at `dashboard/sagas/index.tsx` resolves `getStreamsUrl()` in a
      `.withResource` and hands it to the island through a `.withLayer` loader.
- [ ] With the page open, restarting the sagas service makes the published instance's row appear
      through the subscription, with no reload.
- [ ] `deno task check` is clean.

{{ comp callout { type: "tip", title: "No row after the restart?" } }}
Work down the path in order. <code>ns-sagas list --instances --json</code> tells you whether the instance exists at all — if it does not, the saga never registered (<code>ns-sagas list --registered --json</code>) or the publish failed. If the instance exists but no row arrives, the usual cause is the store backend: on KV the sagas service logs <code>Saga Prisma delegates unavailable</code> at startup and the mirror is skipped entirely. After that, check that the streams runtime is up and that <code>getStreamsUrl()</code> resolved — a dead <code>:4437</code>-class endpoint means the producer could not connect, which it logs as a skipped event.
{{ /comp }}

## What you built

A server-pushed table: a durable StreamDB handle (`createSagasStreamDB`) driving `useLiveQuery`,
wrapped in a `QueryIsland` and mounted by a `definePage` page whose `.withResource` resolves the
streams address. You proved the push end to end — state that entered the database through a saga
publish arrived in an already-open browser page with no polling, no refetch and no reload — and you
saw precisely how far the shipped producer carries it: one reconciliation per sagas-service start.
The client half is the durable part; when a plugin's producer grows a per-transition feed, this page
gets finer-grained updates without a line of change. Next you run the whole graph locally under
Aspire.

{{ comp.nextPrev({ prev: { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" }, next: { label: "6 · Deploy", href: "/tutorials/live-dashboard/06-deploy/" } }) }}
