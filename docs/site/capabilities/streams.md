---
layout: layouts/base.vto
title: Durable streams
templateEngine: [vento, md]
prev: { label: "Triggers & ingress", href: "/capabilities/triggers/" }
next: { label: "Database & Prisma", href: "/capabilities/database/" }
---

{{ comp.breadcrumb() }}

# Durable streams

NetScript's streams capability is the typed, change-data backbone the other
plugins lean on — workers, sagas, and the auth service all publish their live
state through it. The producer half is **real and shipping today**: you define a
typed stream schema with [`defineStreamSchema`](/reference/streams/), open a
producer with `createDurableStream`, and `upsert`/`delete`/`flush` entity state
over a durable-stream server that runs as an Aspire resource on port **:4437**.

The honest line on this page is narrower than it used to be. The producer
runtime in `@netscript/plugin-streams-core` is genuine — it writes through
`@durable-streams/client` with idempotent delivery. What is *not* live is the
topic-centric **manifest sugar** in `@netscript/plugin-streams`
(`defineStreamProducer` / `defineStreamConsumer`): a producer's `publish()`
returns a **rejected** promise and a consumer's `subscribe()` **throws**
synchronously — both with `StreamUnsupportedOperationError`, pointing you at the
core package. There is also no in-process consumer `subscribe()` yet —
consumption is over the durable-stream server's HTTP/SSE protocol, which Fresh
clients read. This page draws those lines precisely so you build against the
producer surface that exists, not against the manifest helpers that don't.

{{ comp callout { type: "important", title: "Status — producer runtime real, manifest helpers fail loud" } }}
The producer is real: <code>createDurableStream(...)</code> from
<code>@netscript/plugin-streams-core</code> writes <code>upsert</code>/<code>delete</code>/<code>flush</code>
through <code>@durable-streams/client</code> to the <code>:4437</code> Aspire service, and workers,
sagas, and auth already mirror their state through it. What is <strong>not</strong> supported: the
manifest helpers <code>defineStreamProducer</code>/<code>defineStreamConsumer</code> in
<code>@netscript/plugin-streams</code> fail loud — a producer's <code>publish()</code> returns a
<strong>rejected</strong> promise and a consumer's <code>subscribe()</code> <strong>throws</strong>
synchronously, both with <code>StreamUnsupportedOperationError</code> — use
<code>@netscript/plugin-streams-core</code> instead. There is also no
in-process consumer <code>subscribe()</code>; consumption is via the durable-stream HTTP/SSE server
(read by Fresh clients).
{{ /comp }}

## The model

A NetScript stream is an **entity-oriented change log**. You describe a set of
collections — each a named entity type with a primary key — and the producer
publishes `upsert` and `delete` operations keyed by that primary key. Downstream
readers materialize the latest value per key and observe a live, replayable view
of your domain state. This is the same contracts-first instinct as oRPC services,
but applied to *state replication* instead of request/response: the schema is the
type contract that both producer and any HTTP/SSE consumer are locked to.

```text
defineStreamSchema({ execution: { primaryKey: "id" } })   ── the typed contract (REAL)
        │
        ▼
createDurableStream({ streamPath, schema, producerId })   ── the producer (REAL)
        │  .upsert("execution", { id, status })
        │  .delete("execution", id)
        │  await .flush()
        ▼
durable-stream server on :4437  ──HTTP/SSE──▶  Fresh clients (consumption surface)
```

Workers, sagas, and the auth service each run a thin `streams/producer.ts` that
calls `createDurableStream` to mirror their execution state — so the producer
path is exercised by first-party plugins, not just sample code.

## Headline API — the producer that ships

The real surface lives in `@netscript/plugin-streams-core`. Two functions do the
load-bearing work: `defineStreamSchema` freezes a typed collection map into a
State-Protocol schema, and `createDurableStream` returns a singleton
`DurableStreamProducer` for a stream path that you write entity state through.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Define a schema (real)",
    lang: "ts",
    code: "// Author against the core package — this is the live surface.\nimport { defineStreamSchema } from '@netscript/plugin-streams-core';\nimport { z } from 'zod';\n\n// Each collection is an entity type with a primary key. The schema is the\n// type contract producers and HTTP/SSE consumers are locked to.\nexport const executionsSchema = defineStreamSchema({\n  execution: {\n    schema: z.object({\n      id: z.string().min(1),\n      status: z.enum(['queued', 'running', 'succeeded', 'failed']),\n      updatedAt: z.string().datetime(),\n    }),\n    type: 'execution',\n    primaryKey: 'id',\n  },\n});"
  },
  {
    label: "Open a producer & write (real)",
    lang: "ts",
    code: "import { createDurableStream } from '@netscript/plugin-streams-core';\nimport { executionsSchema } from './executions-schema.ts';\n\n// createDurableStream returns a singleton producer per streamPath and begins\n// connecting to the :4437 durable-stream server immediately.\nconst producer = createDurableStream({\n  streamPath: '/workers/executions',\n  schema: executionsSchema,\n  producerId: 'workers-service',\n});\n\n// upsert/delete are synchronous enqueues keyed by the collection primary key.\nproducer.upsert('execution', {\n  id: 'exec-1',\n  status: 'running',\n  updatedAt: new Date().toISOString(),\n});\nproducer.delete('execution', 'exec-0');\n\n// flush before graceful shutdown; it rethrows the connect error if the\n// producer never connected (see known limitations).\nawait producer.flush();"
  },
  {
    label: "Manifest helpers (fail loud)",
    lang: "ts",
    code: "// @netscript/plugin-streams (the manifest root) re-exports topic-centric\n// helpers that are NOT implemented. They fail loud, by design.\nimport {\n  defineStreamProducer,\n  defineStreamConsumer,\n} from '@netscript/plugin-streams';\n\n// The producer handle is returned, but publish() rejects.\nconst producer = defineStreamProducer(/* topic */);\n// await producer.publish(event) // -> rejects with StreamUnsupportedOperationError\n\n// The consumer's subscribe() throws synchronously the moment you call it.\nconst consumer = defineStreamConsumer(/* topic */);\n// consumer.subscribe(handler) // -> throws StreamUnsupportedOperationError\n\n// Correct path: import createDurableStream / defineStreamSchema from\n// '@netscript/plugin-streams-core' instead (see the other tabs)."
  }
] }) }}

{{ comp callout { type: "warning", title: "Do not call the manifest topic helpers" } }}
<code>defineStreamProducer</code> and <code>defineStreamConsumer</code> exported from
<code>@netscript/plugin-streams</code> are <strong>not</strong> implemented: a producer's
<code>publish()</code> returns a <strong>rejected</strong> promise and a consumer's
<code>subscribe()</code> <strong>throws</strong> synchronously, both with
<code>StreamUnsupportedOperationError</code> — they are not silent no-ops and they will not publish
anything. Always reach
for <code>createDurableStream</code> / <code>defineStreamSchema</code> from
<code>@netscript/plugin-streams-core</code> for real producer work. See the
<a href="/reference/streams/">streams reference</a> for the full export map.
{{ /comp }}

## Producer surface at a glance

The `DurableStreamProducer` returned by `createDurableStream` exposes a small,
synchronous-write surface with an async flush/close for shutdown.

{{ comp.apiTable({
  title: "DurableStreamProducer — methods",
  columns: ["Member", "Shape", "Behavior"],
  rows: [
    ["<code>upsert(entityType, value)</code>", "<code>(K, Record) =&gt; void</code>", "Enqueue an upsert keyed by the collection <code>primaryKey</code>; skipped (warns) if the key is missing/empty."],
    ["<code>delete(entityType, key)</code>", "<code>(K, string) =&gt; void</code>", "Enqueue a delete by primary key; skipped (warns) on an empty key."],
    ["<code>flush()</code>", "<code>() =&gt; Promise&lt;void&gt;</code>", "Await pending writes before shutdown; <strong>rethrows</strong> the connect error if the producer never connected."],
    ["<code>close()</code>", "<code>() =&gt; Promise&lt;void&gt;</code>", "Flush, close the underlying handle, and release the singleton for this <code>streamPath</code>."],
    ["<code>closed</code>", "<code>boolean</code>", "Whether shutdown has begun; further <code>upsert</code>/<code>delete</code> calls are ignored."]
  ]
}) }}

`createDurableStream` is a **singleton factory** keyed by `streamPath`: calling
it twice with the same path returns the same live producer (a closed one is
replaced). Writes are idempotent via `@durable-streams/client`'s
`IdempotentProducer` (stable `producerId` + auto-claim), so duplicate enqueues
do not double-apply downstream.

## Known limitations

Be deliberate about what the alpha producer does and does not guarantee.

{{ comp callout { type: "warning", title: "Writes are dropped after a connect failure (no reconnect)" } }}
If the producer cannot reach the <code>:4437</code> durable-stream server at startup, it logs a
<code>console.warn</code> and then <strong>silently skips every subsequent <code>upsert</code>/<code>delete</code></strong>
— there is no reconnect loop in the current alpha. <code>flush()</code> rethrows that connect error so a
graceful shutdown surfaces the failure. Treat a healthy <code>:4437</code> service as a hard precondition
for durable delivery; do not assume buffered writes will be replayed once the server returns.
{{ /comp }}

{{ comp callout { type: "note", title: "No in-process consumer — read over HTTP/SSE" } }}
There is no in-process <code>subscribe()</code> handle. Consumption happens over the durable-stream
server's HTTP/SSE protocol, which Fresh clients read to materialize the latest value per key. Model your
read side as an HTTP/SSE consumer of the <code>:4437</code> stream, not as an in-process callback.
{{ /comp }}

## Endpoints & manifest

The streams plugin is registered as a utility/infra plugin — note it requires
**neither a database nor KV** (`requiresDb=false`, `requiresKv=false`), unlike
workers, sagas, and triggers. Its durable-stream service listens on `:4437` and
is wired into the Aspire resource graph so workers, sagas, and auth can publish
through it.

{{ comp.apiTable({
  title: "Streams plugin — runtime facts",
  columns: ["Property", "Value"],
  rows: [
    ["Plugin location", "<code>plugins/streams/</code>"],
    ["Real producer package", "<code>@netscript/plugin-streams-core</code> (<code>createDurableStream</code>, <code>defineStreamSchema</code>)"],
    ["Manifest import", "<code>@netscript/plugin-streams</code> — topic helpers <strong>throw</strong> <code>StreamUnsupportedOperationError</code>"],
    ["Transport client", "<code>@durable-streams/client</code> (<code>IdempotentProducer</code>)"],
    ["Dev service port", "<code>:4437</code> (durable-stream Aspire service)"],
    ["provider.kind", "<code>stream</code> · category <code>plugin</code> · pluginType <code>utility</code>"],
    ["Requires DB / KV", "<code>false</code> / <code>false</code>"],
    ["First-party producers", "workers, sagas, auth (each <code>streams/producer.ts</code> → <code>createDurableStream</code>)"],
    ["Consumer surface", "HTTP/SSE from the <code>:4437</code> server (Fresh clients) — <strong>no</strong> in-process <code>subscribe()</code>"]
  ]
}) }}

The plugin is referenced from `netscript.config.ts` as
`./plugins/streams/mod.ts`. Because workers, sagas, triggers, and auth each list
`streams` in their `dependencies`, it is installed first in the dependency graph
and its `:4437` service comes up so dependent producers have somewhere to write.

## Learn · Do · Reference

{{ comp.card({ items: [
  {
    title: "Learn — the plugin model",
    body: "How thread-isolated plugins like streams register contributions and wire into the Aspire resource graph.",
    href: "/explanation/plugin-model/",
    icon: "◆"
  },
  {
    title: "Do — add the streams plugin",
    body: "netscript plugin add stream --samples lands the plugin under plugins/streams/ with stream-schema samples.",
    href: "/how-to/add-a-plugin/",
    icon: "→"
  },
  {
    title: "Reference — @netscript/plugin-streams-core",
    body: "The generated API for createDurableStream, defineStreamSchema, the URL/auth resolvers, and StreamProducerPort.",
    href: "/reference/streams/",
    icon: "≡"
  }
] }) }}

{{ comp callout { type: "tip", title: "Where the real surface comes from" } }}
The producer you build on lives in <code>@netscript/plugin-streams-core</code>:
<code>createDurableStream</code>, <code>DurableStreamProducer</code>, <code>defineStreamSchema</code>,
the <code>buildStreamUrl</code>/<code>getStreamsUrl</code>/<code>getStreamsAuth</code> resolvers,
<code>inspectStreamTopic</code>, and the <code>StreamProducerPort</code> type. The
<code>@netscript/plugin-streams</code> manifest re-exports <code>streamsPlugin</code> plus the
fail-loud topic helpers. See the <a href="/reference/streams/">full reference</a> for every exported
symbol and the <code>cli</code> / <code>scaffolding</code> / <code>e2e</code> / <code>aspire</code> sub-paths.
{{ /comp }}

{{ comp.nextPrev({ prev: { label: "Triggers & ingress", href: "/capabilities/triggers/" }, next: { label: "Database & Prisma", href: "/capabilities/database/" } }) }}
