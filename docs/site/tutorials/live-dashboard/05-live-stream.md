---
layout: layouts/base.vto
title: Real-time updates with durable streams
templateEngine: [vento, md]
prev: { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" }
next: { label: "6 · Deploy", href: "/tutorials/live-dashboard/06-deploy/" }
---

# Real-time updates with durable streams

In chapter 4 the table was live on the *client* — it refetched and mutated without a navigation.
But it still only knows what it fetched: between revalidations, a cancelled order sits on the screen
looking shippable. This chapter closes that gap from the *server* side: a durable change-stream
pushes state changes to the browser, and a `useLiveQuery` hook re-renders rows the instant they
change — no polling loop, no refresh button, no window where the screen and the database disagree.
This is the payoff of the whole track: a table that updates by itself.

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
real time. You will open a `StreamDB` handle pointed at the streams runtime, drive a
table with `useLiveQuery`, and seed the island from the server so the first paint is instant. The
worked example is the **sagas** stream — the durable change-stream the showcase ships and the same
mechanism your order dashboard uses to go live.

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
The live subscription runs over plaintext <strong>HTTP/1.1</strong> by default, which caps how many concurrent SSE connections a browser opens per origin. HTTP/2 lifts that cap but is opt-in and requires TLS — via <code>ServiceTlsOptions</code> or the <code>NETSCRIPT_TLS_CERT_FILE</code> / <code>NETSCRIPT_TLS_KEY_FILE</code> environment variables. See {{ comp.xref({ key: "cap:streams" }) }} for the connection-limit detail.
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
// Render `instances` as a table — each row updates the moment its saga advances.
```

The callback shape is a tiny query builder: `query.from({ instance: <collection> })` selects rows
from the `sagaInstance` collection. When the server pushes a change for any of those rows,
`useLiveQuery` returns the new array and the table re-renders. That is the entire real-time path on
the client.

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
builder does not force you to carry what you are not using.

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
user-defined stream over HTTP/SSE at its `streamPath`. The full producer surface, URL resolution,
and current limitations are on {{ comp.xref({ key: "cap:streams", text: "the Durable streams page" }) }} —
when you outgrow the sagas monitor, that is where your own `order-events` stream starts.

## Verify your progress

With `aspire start` up, open the live monitor at `/dashboard/sagas/` — the route Step 3's page
declares. Get the app's host from the [Aspire dashboard](/explanation/aspire/) resource list rather
than a memorized port; a scaffolded Fresh app pins no host port, so Aspire allocates one at each
start.

The table starts empty, because nothing in this track has created a saga instance yet — chapter 2
built a plain oRPC read-model, not a saga producer, so posting an order does **not** publish a saga
message. To *see* rows move you publish one yourself, through the sagas plugin's CLI. Register a
throwaway saga and send it a message:

```sh
# Install the shorthand once (see the storefront track for the full form):
#   deno install -gArf -n ns-sagas jsr:@netscript/plugin-sagas{{ releaseSpecifier }}/cli
ns-sagas add saga demo --message-type=DemoStarted --durability=t1 --topic=demo
ns-sagas publish DemoStarted --payload='{ "id": "demo_1" }' --correlation-key=demo_1
```

`add saga` writes the definition and refreshes the saga registry, so restart `aspire start` once
before publishing — the sagas processor loads its registry at boot. `publish` then writes a message
onto the saga bus; the engine starts an instance for it and mirrors that instance into the
`sagaInstance` stream collection your island is subscribed to. Within a moment a
new row appears and advances through its steps **without a page reload** — that is the push path,
proven with the only mechanism this track actually wires. Type-check the new files:

```sh
deno task check
```

- [ ] `curl <streams-endpoint>/health` (endpoint from the Aspire resource list) returns healthy.
- [ ] The live island opens a `createSagasStreamDB` handle and queries it with `useLiveQuery`.
- [ ] A `definePage` page at `dashboard/sagas/index.tsx` resolves `getStreamsUrl()` in a
      `.withResource` and hands it to the island through a `.withLayer` loader.
- [ ] `ns-sagas publish` makes a row appear and advance live, with no reload.
- [ ] `deno task check` is clean.

{{ comp callout { type: "tip", title: "Nothing moves after you publish?" } }}
Three usual causes: the sagas plugin (and its streams runtime) is not installed/booted — check the <a href="/explanation/aspire/">dashboard</a> resource list; <code>getStreamsUrl()</code> resolved nothing because <code>aspire start</code> is down; or the saga never registered, which <code>ns-sagas list --registered --json</code> tells you immediately. An empty table with a healthy streams runtime means no instance exists yet, not that the subscription is broken.
{{ /comp }}

## What you built

A real-time table: a durable StreamDB handle (`createSagasStreamDB`) driving `useLiveQuery`, wrapped
in a `QueryIsland` and mounted by a `definePage` page whose `.withResource` resolves the streams
address. The refresh button is now irrelevant: the moment a saga advances on the server, the row your
operations team is looking at changes with it — no polling, no refetch, no reload.
Next you run the whole graph locally under Aspire.

{{ comp.nextPrev({ prev: { label: "4 · definePage + island", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" }, next: { label: "6 · Deploy", href: "/tutorials/live-dashboard/06-deploy/" } }) }}
