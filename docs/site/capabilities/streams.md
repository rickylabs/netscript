---
layout: layouts/base.vto
title: Durable streams
templateEngine: [vento, md]
prev: { label: "Triggers & ingress", href: "/capabilities/triggers/" }
next: { label: "Database & Prisma", href: "/capabilities/database/" }
---

# Durable streams

A NetScript **stream** is a typed, durable change-log: producers write entity
state into a durable-stream server, and any number of HTTP/SSE consumers
materialize the latest value per key. {{ comp.badge({ status: "alpha" }) }}

{{ comp.diagram({
  src: "/assets/diagrams/streams-pipeline.svg",
  alt: "A producer defines a typed stream schema and writes upsert/delete operations into the durable-stream server on port 4437; the durable log fans out over HTTP/SSE to Fresh consumers that materialize the latest value per key.",
  caption: "Streams pipeline: producer (defineStreamSchema + createDurableStream) → durable log on :4437 → HTTP/SSE → Fresh consumers (latest value per key)."
}) }}

NetScript's streams capability is the typed, change-data backbone the other
plugins lean on — workers, sagas, and the auth service all publish their live
state through it. The producer half is **real and shipping today**: you define a
typed stream schema with [`defineStreamSchema`](/reference/streams/), open a
producer with `createDurableStream`, and `upsert`/`delete`/`flush` entity state
over a durable-stream server that runs as an Aspire resource on port **:4437**.

The scope on this page is narrower than it used to be. The producer
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

## What it is

A NetScript stream is an **entity-oriented change log**. You describe a set of
collections — each a named entity type with a primary key — and the producer
publishes `upsert` and `delete` operations keyed by that primary key. Downstream
readers materialize the latest value per key and observe a live, replayable view
of your domain state. This is the same contracts-first instinct as oRPC services,
but applied to **state replication** instead of request/response: the schema is
the type contract that both producer and any HTTP/SSE consumer are locked to.

Streams sit alongside the other long-running capabilities rather than replacing
them. Reach for a {{ comp.xref({ key: "cap:durable-sagas", text: "durable saga" }) }}
when you need message-driven orchestration with compensation; reach for a
{{ comp.xref({ key: "cap:triggers", text: "trigger" }) }} when inbound HTTP or a
file-watch should kick off work. A stream is the **read-model fan-out**: each of
those plugins runs a thin `streams/producer.ts` that mirrors its execution state
through `createDurableStream`, so a Fresh dashboard can watch saga, worker, and
trigger progress live without polling a request/response API.

## Learn → / Do →

{{ comp.featureGrid({ items: [
  {
    title: "Learn — stream a live dashboard",
    body: "Track D 05: publish execution state from a producer and read it over HTTP/SSE into a live Fresh dashboard.",
    href: "/tutorials/live-dashboard/05-live-stream/",
    icon: "→"
  },
  {
    title: "Do — add the streams plugin",
    body: "Public package dispatch installs the stream plugin; local netscript-dev scaffolding lands samples under plugins/streams/.",
    href: "/how-to/add-a-plugin/",
    icon: "◆"
  },
  {
    title: "Understand — the plugin system",
    body: "How thread-isolated plugins like streams register contributions and wire into the Aspire resource graph.",
    href: "/explanation/plugin-system/",
    icon: "◎"
  }
] }) }}

## Minimal example — produce, then consume

The producer side is two calls: freeze a typed schema, open a stream, write
entity state. The consumer side is an HTTP/SSE read of the same `:4437` stream
path — there is no in-process `subscribe()` handle, so a Fresh island (or any
SSE client) reads the durable log directly and materializes the latest value per
key.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Define a schema (real)",
    lang: "ts",
    code: "// streams/executions-schema.ts\n// Author against the core package — this is the live surface.\nimport { defineStreamSchema } from '@netscript/plugin-streams-core';\nimport { z } from 'zod';\n\n// Each collection is an entity type with a primary key. The schema is the\n// type contract producers and HTTP/SSE consumers are locked to.\nexport const executionsSchema = defineStreamSchema({\n  execution: {\n    schema: z.object({\n      id: z.string().min(1),\n      status: z.enum(['queued', 'running', 'succeeded', 'failed']),\n      updatedAt: z.string().datetime(),\n    }),\n    type: 'execution',\n    primaryKey: 'id',\n  },\n});"
  },
  {
    label: "Open a producer & write (real)",
    lang: "ts",
    code: "// streams/producer.ts\nimport { createDurableStream } from '@netscript/plugin-streams-core';\nimport { executionsSchema } from './executions-schema.ts';\n\n// createDurableStream returns a singleton producer per streamPath and begins\n// connecting to the :4437 durable-stream server immediately.\nconst producer = createDurableStream({\n  streamPath: '/workers/executions',\n  schema: executionsSchema,\n  producerId: 'workers-service',\n});\n\n// upsert/delete are synchronous enqueues keyed by the collection primary key.\nproducer.upsert('execution', {\n  id: 'exec-1',\n  status: 'running',\n  updatedAt: new Date().toISOString(),\n});\nproducer.delete('execution', 'exec-0');\n\n// flush before graceful shutdown; it rethrows the connect error if the\n// producer never connected (see known limitations).\nawait producer.flush();"
  },
  {
    label: "Consume over HTTP/SSE (Fresh client)",
    lang: "ts",
    code: "// islands/ExecutionsView.tsx — read the durable log directly\nimport { getStreamsUrl } from '@netscript/plugin-streams-core';\n\n// There is no in-process subscribe(); consumption is an HTTP/SSE read of the\n// same stream path the producer writes to. getStreamsUrl resolves the :4437\n// base from Aspire discovery / VITE env (see runtime resolvers below).\nconst base = getStreamsUrl();\nconst source = new EventSource(`${base}/workers/executions`);\n\nconst latest = new Map<string, unknown>(); // materialize latest value per key\nsource.onmessage = (ev) => {\n  const change = JSON.parse(ev.data) as { key: string; value?: unknown };\n  if (change.value === undefined) latest.delete(change.key);\n  else latest.set(change.key, change.value);\n};"
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

## Key types first — the stream definition API

A stream schema is a map of **collections**. Each collection is a
`CollectionDefinition` — a Standard-Schema validator, a State-Protocol `type`
discriminator, and the `primaryKey` property the producer keys writes by.
`defineStreamSchema(collections)` freezes that map into a `StateSchema` that both
the producer and any HTTP/SSE consumer are locked to.

{{ comp.apiTable({
  caption: "CollectionDefinition — one entry per collection in defineStreamSchema",
  rows: [
    { name: "schema", type: "unknown (Standard Schema validator)", desc: "Standard-Schema-compatible validator (e.g. a zod object) used by durable-streams to validate the collection payload." },
    { name: "type", type: "string (required)", desc: "State Protocol type discriminator emitted for every event in this collection (e.g. 'execution')." },
    { name: "primaryKey", type: "string (required)", desc: "Property name on the value used as the entity primary key; upsert/delete are keyed by this property." }
  ]
}) }}

`defineStreamSchema` returns a frozen `StateSchema<TDef>` — the durable-streams
runtime attaches per-collection event helpers (`insert`/`update`/`upsert`/`delete`,
the `CollectionEventHelpers`) so the schema can both validate and emit
State-Protocol `ChangeEvent`s. The supported `Operation` set is
`insert | update | delete | upsert`.

## Producer options — `createDurableStream`

`createDurableStream(options)` takes a `DurableStreamProducerOptions` and returns
a `DurableStreamProducer`. It is a **singleton factory keyed by `streamPath`**:
calling it twice with the same path returns the same live producer (a closed one
is replaced). Writes are idempotent via `@durable-streams/client`'s
`IdempotentProducer` (stable `producerId` + auto-claim), so duplicate enqueues do
not double-apply downstream.

{{ comp.apiTable({
  caption: "DurableStreamProducerOptions (createDurableStream argument)",
  rows: [
    { name: "streamPath", type: "string (required)", desc: "Stream path relative to the base URL, e.g. '/workers/executions'. This is the singleton key and the path consumers read over HTTP/SSE." },
    { name: "schema", type: "StateSchema<TDef> (required)", desc: "The frozen schema returned by defineStreamSchema; binds the producer to its collection map." },
    { name: "producerId", type: "string (required)", desc: "Stable producer identity used for idempotent delivery (IdempotentProducer auto-claim). Keep it stable across restarts for duplicate-safe writes." },
    { name: "signal", type: "AbortSignal?", desc: "Optional abort signal consulted while opening the stream connection; aborting cancels the connect (an AbortError is treated as expected, not a failure)." }
  ]
}) }}

The `DurableStreamProducer` it returns exposes a small, synchronous-write surface
with an async flush/close for shutdown. (`StreamProducerPort` is the
implemented-by interface — the same four members, with `entityType` widened to
`string`.)

{{ comp.apiTable({
  title: "DurableStreamProducer — methods",
  columns: ["Member", "Shape", "Behavior"],
  rows: [
    ["<code>upsert(entityType, value)</code>", "<code>(K, Record) =&gt; void</code>", "Enqueue an upsert keyed by the collection <code>primaryKey</code>; skipped (warns) if the key is missing/empty or the collection is unknown."],
    ["<code>delete(entityType, key)</code>", "<code>(K, string) =&gt; void</code>", "Enqueue a delete by primary key; skipped (warns) on an empty key."],
    ["<code>flush()</code>", "<code>() =&gt; Promise&lt;void&gt;</code>", "Await pending writes before shutdown; <strong>rethrows</strong> the connect error if the producer never connected."],
    ["<code>close()</code>", "<code>() =&gt; Promise&lt;void&gt;</code>", "Flush, close the underlying handle, and release the singleton for this <code>streamPath</code>."],
    ["<code>streamPath</code>", "<code>string (readonly)</code>", "The stream path this producer owns."],
    ["<code>closed</code>", "<code>boolean (get)</code>", "Whether shutdown has begun; further <code>upsert</code>/<code>delete</code> calls are ignored."]
  ]
}) }}

## Runtime & transport — URL and auth resolution

The producer never hardcodes a host. `createDurableStream` resolves the
durable-stream base URL through `getStreamsUrl()` and the auth header through
`getStreamsAuth()`, both of which read the environment so the same code works
under Aspire, in a browser build, or against an explicit override. `buildStreamUrl`
joins a stream path onto that base, and `inspectStreamTopic` returns a JSON-stable
diagnostic report for a schema (handy in tests and CLI doctors).

{{ comp.apiTable({
  caption: "Runtime resolvers (@netscript/plugin-streams-core)",
  rows: [
    { name: "getStreamsUrl()", type: "() => string", desc: "Resolves the durable-stream base URL. Server: DURABLE_STREAMS_URL override, else Aspire's services__streams__http__0 discovery var. Browser: VITE_services__streams__http__0 (or the VITE_STREAMS_URL shorthand). Throws a descriptive error if none resolve." },
    { name: "getStreamsAuth()", type: "() => Record<string,string>", desc: "Builds the auth header from STREAMS_SECRET (or DURABLE_STREAMS_SECRET) as { Authorization: 'Bearer <secret>' }; returns {} when no secret is set." },
    { name: "buildStreamUrl(path, baseUrl?)", type: "(string, string?) => string", desc: "Joins a stream path onto the resolved base (or an explicit baseUrl), trimming a trailing slash on the base." },
    { name: "inspectStreamTopic(input)", type: "(input) => StreamTopicInspectionReport", desc: "Diagnostic: returns a JSON-stable report (package, target, summary, details with collections/streamPath/producerId) for a schema + optional producer metadata." }
  ]
}) }}

{{ comp.apiTable({
  caption: "Environment variables read by the resolvers",
  rows: [
    { name: "DURABLE_STREAMS_URL", type: "server override", desc: "Explicit base URL; takes precedence over Aspire discovery (e.g. http://localhost:4437)." },
    { name: "services__streams__http__0", type: "Aspire (server)", desc: "Injected by the Aspire resource graph; the default server-side discovery path." },
    { name: "VITE_services__streams__http__0", type: "browser", desc: "Vite-injected reference for browser/Fresh consumers; VITE_STREAMS_URL is the convenience shorthand." },
    { name: "STREAMS_SECRET / DURABLE_STREAMS_SECRET", type: "auth", desc: "Bearer secret for getStreamsAuth(); when set, every connect sends Authorization: Bearer <secret>." }
  ]
}) }}

## Known limitations

Be deliberate about what the alpha producer does and does not guarantee.
<!-- caveat: arch-debt:streams-manifest-helpers-unsupported -->

{{ comp callout { type: "warning", title: "Writes are dropped after a connect failure (no reconnect)" } }}
If the producer cannot reach the <code>:4437</code> durable-stream server at startup, it logs a
<code>console.warn</code> and then <strong>silently skips every subsequent <code>upsert</code>/<code>delete</code></strong>
— there is no reconnect loop in the current alpha. <code>flush()</code> rethrows that connect error so a
graceful shutdown surfaces the failure. (Writes issued <em>before</em> the connection completes are
buffered and drained once it opens; the drop only applies after a connect <em>error</em>.) Treat a healthy
<code>:4437</code> service as a hard precondition for durable delivery; do not assume buffered writes will
be replayed once the server returns.
{{ /comp }}

{{ comp callout { type: "note", title: "No in-process consumer — read over HTTP/SSE" } }}
There is no in-process <code>subscribe()</code> handle. Consumption happens over the durable-stream
server's HTTP/SSE protocol, which Fresh clients read to materialize the latest value per key. Model your
read side as an HTTP/SSE consumer of the <code>:4437</code> stream, not as an in-process callback.
{{ /comp }}

{{ comp callout { type: "note", title: "Operator visibility is console.warn (alpha)" } }}
The producer reports skips and connect failures through <code>console.warn</code> today — tracked as
<strong>AP-13</strong> architecture debt until the telemetry-integration wave supplies a structured
reporter. Until then, scrape the <code>[DurableStreamProducer]</code> warn lines if you need to alert on
dropped writes.
{{ /comp }}

## Endpoints & manifest

The streams plugin is registered as a utility/infra plugin — note it requires
**neither a database nor KV** (`requiresDb=false`, `requiresKv=false`), unlike
workers, sagas, and triggers. Its durable-stream service listens on `:4437` and
is wired into the Aspire resource graph so workers, sagas, and auth can publish
through it. The port is overridable via `STREAMS_PORT` or `PORT`.

{{ comp.apiTable({
  title: "Streams plugin — runtime facts",
  columns: ["Property", "Value"],
  rows: [
    ["Plugin location", "<code>plugins/streams/</code>"],
    ["Real producer package", "<code>@netscript/plugin-streams-core</code> (<code>createDurableStream</code>, <code>defineStreamSchema</code>)"],
    ["Manifest import", "<code>@netscript/plugin-streams</code> — topic helpers <strong>throw</strong> <code>StreamUnsupportedOperationError</code>"],
    ["Transport client", "<code>@durable-streams/client</code> (<code>IdempotentProducer</code>)"],
    ["Dev service port", "<code>:4437</code> (durable-stream Aspire service; override with <code>STREAMS_PORT</code>/<code>PORT</code>)"],
    ["provider.kind", "<code>stream</code> · category <code>plugin</code> · pluginType <code>utility</code>"],
    ["Requires DB / KV", "<code>false</code> / <code>false</code>"],
    ["First-party producers", "workers, sagas, triggers, auth (each <code>streams/producer.ts</code> → <code>createDurableStream</code>)"],
    ["Consumer surface", "HTTP/SSE from the <code>:4437</code> server (Fresh clients) — <strong>no</strong> in-process <code>subscribe()</code>"]
  ]
}) }}

The plugin is referenced from `netscript.config.ts` as
`./plugins/streams/mod.ts`. Because workers, sagas, and triggers each list
`streams` in their `dependencies`, it is installed first in the dependency graph
and its `:4437` service comes up so dependent producers have somewhere to write.

## Production notes

{{ comp callout { type: "important", title: "Footguns before you ship" } }}
<ul>
<li><strong>Build on the core package, not the manifest helpers.</strong>
<code>createDurableStream</code> / <code>defineStreamSchema</code> from
<code>@netscript/plugin-streams-core</code> are real; the
<code>defineStreamProducer</code>/<code>defineStreamConsumer</code> helpers in
<code>@netscript/plugin-streams</code> fail loud with
<code>StreamUnsupportedOperationError</code>.</li>
<li><strong>A healthy <code>:4437</code> server is a hard precondition.</strong> A startup connect
failure drops every later write with no reconnect — bring Aspire (or an explicit
<code>DURABLE_STREAMS_URL</code>) up first, and treat a <code>flush()</code> rejection on shutdown as a
real delivery failure, not noise.</li>
<li><strong>Keep <code>producerId</code> stable across restarts.</strong> Idempotent delivery is keyed
by it; a churning id defeats the duplicate-safety guarantee.</li>
<li><strong>Model the read side as HTTP/SSE.</strong> There is no in-process <code>subscribe()</code>;
resolve the base with <code>getStreamsUrl()</code> and consume the <code>:4437</code> stream path
directly.</li>
<li><strong>Set the auth secret on both ends.</strong> When the server expects a bearer token, export
<code>STREAMS_SECRET</code> (or <code>DURABLE_STREAMS_SECRET</code>) wherever the producer runs so
<code>getStreamsAuth()</code> can attach it.</li>
</ul>
{{ /comp }}

## Reference

This hub is intentionally thin — the full generated API lives in the reference.

{{ comp.xref({ key: "ref:streams" }) }}

{{ comp callout { type: "tip", title: "Where the real surface comes from" } }}
The producer you build on lives in <code>@netscript/plugin-streams-core</code>:
<code>createDurableStream</code>, <code>DurableStreamProducer</code>, <code>defineStreamSchema</code>,
the <code>buildStreamUrl</code>/<code>getStreamsUrl</code>/<code>getStreamsAuth</code> resolvers,
<code>inspectStreamTopic</code>, and the <code>StreamProducerPort</code> /
<code>DurableStreamProducerOptions</code> types. The <code>@netscript/plugin-streams</code> manifest
re-exports <code>streamsPlugin</code> plus the fail-loud topic helpers. See the
<a href="/reference/streams/">full reference</a> for every exported symbol and the
<code>cli</code> / <code>scaffolding</code> / <code>e2e</code> / <code>aspire</code> sub-paths.
{{ /comp }}

{{ comp.featureGrid({ items: [
  {
    title: "Look up — @netscript/plugin-streams-core",
    body: "The generated API for createDurableStream, defineStreamSchema, the URL/auth resolvers, inspectStreamTopic, and the StreamProducerPort type.",
    href: "/reference/streams/",
    icon: "≡"
  },
  {
    title: "Learn — stream a live dashboard",
    body: "Track D 05: publish execution state and read it over HTTP/SSE into a live Fresh dashboard.",
    href: "/tutorials/live-dashboard/05-live-stream/",
    icon: "→"
  },
  {
    title: "Understand — the plugin system",
    body: "How thread-isolated plugins like streams register contributions and wire into the Aspire resource graph.",
    href: "/explanation/plugin-system/",
    icon: "◎"
  },
  {
    title: "Related — durable sagas",
    body: "Message-driven orchestration with compensation; sagas mirror their state through a streams producer.",
    href: "/capabilities/durable-sagas/",
    icon: "◆"
  }
] }) }}

{{ comp.nextPrev({ prev: { label: "Triggers & ingress", href: "/capabilities/triggers/" }, next: { label: "Database & Prisma", href: "/capabilities/database/" } }) }}
