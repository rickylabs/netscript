---
layout: layouts/base.vto
title: Durable streams
templateEngine: [vento, md]
order: 3
---

# Durable streams

This page covers durable streams: typed change logs that producers write and HTTP/SSE consumers
read to keep the latest value per key. {{ comp.badge({ status: "alpha" }) }}

{{ comp.diagram({
  src: "/assets/diagrams/streams-pipeline.svg",
  alt: "A producer defines a typed stream schema and writes upsert/delete operations into the durable-stream server on its assigned port; the stream log fans out over HTTP/SSE to Fresh consumers that materialize the latest value per key.",
  caption: "Streams pipeline: producer (defineStreamSchema + createDurableStream) → stream log on its assigned port → HTTP/SSE → Fresh consumers (latest value per key)."
}) }}

Streams use the Durable Streams protocol. You define a typed schema with
[`defineStreamSchema`](/reference/streams/), open a producer with `createDurableStream` or the
service-facing `createServiceStreamProducer`, and `upsert`, `delete` and `flush` entity state on a
durable-stream server. The server runs as an Aspire resource on its assigned port. Workers, sagas,
and the auth service publish their live state this way.

The producer runtime in `@netscript/plugin-streams-core` writes through `@durable-streams/client`
with idempotent delivery. `@netscript/plugin-streams` carries the service manifest and the
`defineStreamTopic` definitions. Consumers read the durable-stream server's HTTP/SSE protocol to
materialize state.

## What it is

A stream is an **entity-oriented change log**. You describe a set of collections, each a named
entity type with a primary key, and the producer publishes `upsert` and `delete` operations keyed by
that primary key. Readers materialize the latest value per key and get a live, replayable view of
your domain state. The schema is the type contract that the producer and every HTTP/SSE consumer
share.

A stream is the read-model fan-out. Use a
{{ comp.xref({ key: "cap:durable-sagas", text: "durable saga" }) }} for message-driven
orchestration with compensation, and a {{ comp.xref({ key: "cap:triggers", text: "trigger" }) }}
when inbound HTTP or a file watch should start work. Workers, sagas, and triggers each run a thin
`streams/producer.ts` that mirrors execution state through `createDurableStream`, so a Fresh
dashboard watches saga, worker, and trigger progress live instead of polling a request/response
API. The [live-dashboard tutorial](/tutorials/live-dashboard/05-live-stream/) builds that page.

For React Native screens, follow [Consume durable streams in Expo](/durable-workflows/expo-streams/).
It uses the same TanStack DB engine through an injected fetch and includes a native runtime probe.

## Minimal example — produce, then consume

The producer freezes a typed schema, opens a stream, and writes entity state. There is no
in-process `subscribe()` handle: a Fresh island, or any SSE client, reads the same stream path over
HTTP/SSE and materializes the latest value per key. Browser and server consumers therefore share
one path and one wire format.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Define a schema (real)",
    lang: "ts",
    code: "// streams/executions-schema.ts\n// Author against the core package — this is the live surface.\nimport { defineStreamSchema } from '@netscript/plugin-streams-core';\nimport { z } from 'zod';\n\n// Each collection is an entity type with a primary key. The schema is the\n// type contract producers and HTTP/SSE consumers are locked to.\nexport const executionsSchema = defineStreamSchema({\n  execution: {\n    schema: z.object({\n      id: z.string().min(1),\n      status: z.enum(['queued', 'running', 'succeeded', 'failed']),\n      updatedAt: z.string().datetime(),\n    }),\n    type: 'execution',\n    primaryKey: 'id',\n  },\n});"
  },
  {
    label: "Open a producer & write (real)",
    lang: "ts",
    code: "// streams/producer.ts\nimport { createDurableStream } from '@netscript/plugin-streams-core';\nimport { executionsSchema } from './executions-schema.ts';\n\n// createDurableStream returns a singleton producer per streamPath and begins\n// connecting to the durable-stream server immediately.\nconst producer = createDurableStream({\n  streamPath: '/workers/executions',\n  schema: executionsSchema,\n  producerId: 'workers-service',\n});\n\n// upsert/delete are synchronous enqueues keyed by the collection primary key.\nproducer.upsert('execution', {\n  id: 'exec-1',\n  status: 'running',\n  updatedAt: new Date().toISOString(),\n});\nproducer.delete('execution', 'exec-0');\n\n// flush waits for the writes accepted before this call and rejects if\n// any of those writes is not delivered. See producer recovery below.\nawait producer.flush();"
  },
  {
    label: "Consume over HTTP/SSE (Fresh client)",
    lang: "ts",
    code: "// islands/ExecutionsView.tsx — read the durable log directly\nimport { buildStreamUrl, getStreamsUrl } from '@netscript/plugin-streams-core';\nimport { bindStreamEventSourceV1 } from '@netscript/fresh/streams';\n\n// Native EventSource needs the real stream route, an opaque replay offset, and\n// live=sse. It cannot attach arbitrary authorization headers, so use this from\n// a same-origin/cookie-compatible route or proxy when the service is protected.\nconst url = new URL(buildStreamUrl('/workers/executions', getStreamsUrl()));\nurl.searchParams.set('offset', '-1');\nurl.searchParams.set('live', 'sse');\nconst source = new EventSource(url);\n\nconst latest = new Map<string, unknown>();\nconst binding = bindStreamEventSourceV1({\n  source,\n  onEvent(event) {\n    // The helper registers named data/control listeners and validates both\n    // payload schemas before delivering this exhaustive outcome union.\n    if (event.event === 'error') { latest.set('$error', event.payload); return; }\n    if (event.event !== 'data') return; // control / derived heartbeat\n    for (const change of event.payload) { // data is always an ordered array\n      if (change.headers.operation === 'delete') latest.delete(change.key);\n      else latest.set(change.key, change.value);\n    }\n  },\n});\n\n// An island should call binding.dispose() from its effect cleanup. This plain\n// browser example closes on page teardown; W3-A owns reconnect policy.\naddEventListener('pagehide', () => binding.dispose(), { once: true });"
  }
] }) }}

## Breaking migration in 0.0.8

`@netscript/plugin-streams` no longer exports `defineStreamProducer`, `defineStreamConsumer`,
`StreamProducerHandle`, `StreamConsumerHandle`, `StreamUnsupportedOperationError`, or
`unsupportedStreamOperation`. `streamsPlugin`, `defineStreamTopic`, `StreamTopicDefinition`, and
`StreamPayloadSchema` remain available for manifest declarations.

| Concern | Migration |
| --- | --- |
| Producer imports | Import `defineStreamSchema` and `createDurableStream`, or `createServiceStreamProducer` in backend services, from `@netscript/plugin-streams-core`. |
| Payload schema | Convert the topic payload schema to a named collection with a `primaryKey`, as in the example above. |
| Writes | Replace `publish(payload)` with `upsert(collection, payload)` or `delete(collection, key)`. Call `flush()` and `close()` during shutdown. |
| Consumers | Replace `subscribe(handler)` with HTTP/SSE reads of the same stream path. `buildStreamUrl` and `getStreamsUrl` from `@netscript/plugin-streams-core` resolve that URL; `bindStreamEventSourceV1` from `@netscript/fresh/streams` validates named SSE events in browser clients, as in the example above. Dispose the binding when the client tears down. |

This is an entity-state transport: generic message payloads need stable entity ids and a suitable
collection model. There is no in-process topic subscription replacement.

## Stream schema

A stream schema is a map of **collections**. Each collection is a `CollectionDefinition`: a
Standard Schema validator, a State Protocol `type` discriminator, and the `primaryKey` property that
the producer keys writes by. `defineStreamSchema(collections)` freezes that map into a
`StateSchema` that the producer and every HTTP/SSE consumer share.

{{ comp.apiTable({
  caption: "CollectionDefinition — one entry per collection in defineStreamSchema",
  rows: [
    { name: "schema", type: "unknown (Standard Schema validator)", desc: "Standard-Schema-compatible validator (e.g. a zod object) used by durable-streams to validate the collection payload." },
    { name: "type", type: "string (required)", desc: "State Protocol type discriminator emitted for every event in this collection (e.g. 'execution')." },
    { name: "primaryKey", type: "string (required)", desc: "Property name on the value used as the entity primary key; upsert/delete are keyed by this property." }
  ]
}) }}

The durable-streams runtime attaches per-collection event helpers (`insert`/`update`/`upsert`/
`delete`, the `CollectionEventHelpers`) to the frozen `StateSchema<TDef>`, so the schema both
validates and emits State Protocol `ChangeEvent`s. The supported `Operation` set is
`insert | update | delete | upsert`.

## Producer options — `createDurableStream`

`createDurableStream(options)` takes a `DurableStreamProducerOptions` and returns a
`DurableStreamProducer`. It is a **singleton factory keyed by `streamPath`**: a second call with the
same path and compatible configuration returns the same live producer, and a stopped or failed
one can be replaced. For restart safety, allocate a higher persisted `initialEpoch` for each
recreated producer with the same path and ID. Protocol retries retain the producer identity, epoch
and sequence so a lost acknowledgement does not require a new append identity. A new application write, including a job
retry, is a new operation; use stable entity keys to materialize the latest state.

{{ comp.apiTable({
  caption: "DurableStreamProducerOptions (createDurableStream argument)",
  rows: [
    { name: "streamPath", type: "string (required)", desc: "Stream path relative to the base URL, e.g. '/workers/executions'. This is the singleton key and the path consumers read over HTTP/SSE." },
    { name: "schema", type: "StateSchema<TDef> (required)", desc: "The frozen schema returned by defineStreamSchema; binds the producer to its collection map." },
    { name: "producerId", type: "string (required)", desc: "Stable producer identity used for idempotent delivery. Keep it stable and allocate a higher persisted initialEpoch on each restart." },
    { name: "initialEpoch", type: "number?", desc: "Non-negative safe integer allocated atomically from persistent storage per stream path and producer ID. Increase on restart; explicit epochs fence stale writers instead of auto-claiming." },
    { name: "retention", type: "StreamRetentionPolicyV1?", desc: "TTL or absolute expiry applied when the stream is created. Omit for unbounded retention." },
    { name: "reconnectPolicy", type: "Partial<StreamProducerReconnectPolicyV1>?", desc: "Finite connection and delivery retry overrides. Omitted fields use the exported defaults." },
    { name: "bufferPolicy", type: "Partial<StreamProducerBufferPolicyV1>?", desc: "Bounds accepted pending writes by event count and UTF-8 bytes." },
    { name: "signal", type: "AbortSignal?", desc: "Producer-lifetime cancellation. Aborting stops local work, rejects new writes and settles pending receipts; it does not send durable EOF." }
  ]
}) }}

The returned `DurableStreamProducer` writes with `upsert` and `delete`, drains with `flush`, and
releases local resources with `stop`. Use `close` only to finish the stream with durable EOF. The
[core reference](/reference/plugin-streams-core/) lists the contracts.

### Producer recovery and write outcomes

The producer connects and retries retryable failures automatically, within a **finite** budget.
`DEFAULT_STREAM_PRODUCER_RECONNECT_POLICY_V1` permits eight attempts per connection or delivery
phase, each with a 5,000 ms request timeout, starting at 100 ms backoff, multiplying by two up to 5,000 ms, with 20% jitter. Configure
`reconnectPolicy` to change those bounds. Permanent failures or exhausted attempts fail the producer;
there is no infinite reconnect loop. `waitUntilReady({ signal })` waits for readiness or rejects on
terminal failure/caller cancellation; `state` and `isReady` expose its current condition.

`upsert` and `delete` synchronously return a **receipt**, not proof of delivery. The default buffer
accepts at most 256 pending events and 1,048,576 UTF-8 bytes. Check `receipt.accepted` and await
`receipt.completion`: only `status: 'delivered'` confirms acknowledgement. Other outcomes are
`rejected`, `cancelled` or `delivery-unknown`; the last means an attempted append cannot be safely
reported as delivered. It may already exist on the server, so do not treat it as proof of absence.

`flush()` waits for writes accepted before that call and rejects if one of those pending writes
settles without delivery. It is not a history of receipts that already settled: inspect each write's
completion when its outcome matters. At process shutdown, first drain handlers, then flush and
`stop()` the shared producer. `stop()` cancels queued work and may leave an attempted write with
unknown delivery. `close()` drains and sends durable EOF; it is unsuitable for a shared stream that
later jobs must keep writing.

## Bound stream retention

Set `retention: { kind: 'ttl', ttlSeconds: 604800 }` or
`retention: { kind: 'expires-at', expiresAt: '2030-10-08T00:00:00Z' }` on a producer before it
creates its stream. On the shipped server, TTL is a sliding inactivity window renewed by reads and
appends. Absolute expiry does not slide, so use it, or rotating day segments, for a hard bound on an
active stream. Both policies expire the whole stream; entity `producer.delete(...)` appends a
tombstone and does not shrink the log. Omit retention for the current unbounded behavior. The
[stream retention how-to](/durable-workflows/how-to/bound-stream-retention/) covers both policies,
scheduled segment deletion with `deleteDurableStream`, and typed failure handling.

## Service-side producers — `createServiceStreamProducer`

When the writer is a backend **Service**, such as an ingestion worker that emits a `doc.ready`
event when its work finishes, use `createServiceStreamProducer` instead of wiring
`createDurableStream` and the URL and auth resolvers by hand. It wraps `createDurableStream` with
the same singleton producer and Aspire discovery (`getStreamsUrl` / `getStreamsAuth`). It resolves
stream discovery at construction, so a Service without the `streams` plugin reference **throws
immediately** instead of blocking or silently dropping writes.

```ts
// services/ingestion/emit-completion.ts
import {
  createServiceStreamProducer,
  defineStreamSchema,
} from "@netscript/plugin-streams-core";
import { z } from "zod";

const completions = defineStreamSchema({
  completion: {
    schema: z.object({ id: z.string().min(1), status: z.string() }),
    type: "completion",
    primaryKey: "id",
  },
});

// This throws now if neither DURABLE_STREAMS_URL nor
// services__streams__http__0 is wired.
const producer = createServiceStreamProducer({
  streamPath: "/support-chat/completions",
  schema: completions,
  producerId: "support-chat-ingestion",
});

producer.upsert("completion", { id: "run-1", status: "done" });
await producer.flush();
```

The CLI writes the required plugin reference when you install the streams plugin. If construction
reports a missing `streams` reference, install the streams plugin and run
`netscript service generate` to reconcile the generated configuration.
`ServiceStreamProducerOptions` has the same fields as `DurableStreamProducerOptions`, and it returns
the same `DurableStreamProducer`.

## Writes from a worker job

A job handler can call `createServiceStreamProducer` with the same schema and discovered streams
URL as any other backend. It does not need an HTTP request, a Fresh island or a saga to publish.
The [worker delivery lesson](/tutorials/eis-chat/03-deliver-worker/) includes a complete
schema-validated handler, registry setup and an enqueue command.

Keep one compatible producer per path in a process. Pass the job's signal to `waitUntilReady`,
then await the write receipt before returning success; do not bind a shared producer's lifetime to
one job's signal or stop it in each handler's `finally`. The process owns its flush/stop sequence
after handlers drain. Retried jobs can append again, so key the upsert by a stable business id.
Multiple producer processes need distinct producer identities; each identity has one live owner.
Match the job timeout to the finite producer retry budget. Stream delivery and the job's applied-key
mark are separate commits, so the stream is a projection rather than an atomic business transaction.

## URL and auth resolution

The producer never hardcodes a host. `createDurableStream` resolves the durable-stream base URL with
`getStreamsUrl()` and the auth header with `getStreamsAuth()`. Both read the environment, so the
same code works under Aspire, in a browser build, or against an explicit override. `buildStreamUrl`
joins a stream path onto that base, and `inspectStreamTopic` returns a JSON-stable diagnostic report
for a schema, useful in tests and CLI doctors.

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
    { name: "DURABLE_STREAMS_URL", type: "server override", desc: "Explicit base URL; takes precedence over Aspire discovery (e.g. your custom stream server URL)." },
    { name: "services__streams__http__0", type: "Aspire (server)", desc: "Injected by the Aspire resource graph; the default server-side discovery path." },
    { name: "VITE_services__streams__http__0", type: "browser", desc: "Vite-injected reference for browser/Fresh consumers; VITE_STREAMS_URL is the convenience shorthand." },
    { name: "STREAMS_SECRET / DURABLE_STREAMS_SECRET", type: "auth", desc: "Bearer secret for getStreamsAuth(); when set, every connect sends Authorization: Bearer <secret>." }
  ]
}) }}

### Caller-provided reader headers

Fresh `createNetScriptStreamDB` and workers `createWorkersStreamDB` accept native
`HeadersRecord` values from `@durable-streams/client`: each value is a string or
a sync/async callback. The native client resolves callbacks per request, including
reads after a Fresh reconnect.

```ts
import { createWorkersStreamDB } from "@netscript/plugin-workers/streams";
declare const readReaderToken: () => Promise<string>;
const workers = createWorkersStreamDB({
  headers: { authorization: async () => `Bearer ${await readReaderToken()}` },
});
```

Any supplied record, including `{}`, replaces ambient producer auth completely;
only omission or `undefined` selects `getStreamsAuth()`. Fresh's exported custom
`createStreamDB` port now accepts native header values instead of strings only:
external serializers must forward the record unchanged to the native client.
Header forwarding neither issues credentials nor authenticates a reader; callers
still own reader credential and browser bootstrap policy.

### Resolved stream URLs

`buildStreamUrl` prepends `STREAMS_URL_PREFIX = '/v1/stream/netscript'` to the `streamPath`:

| Input | Value |
| --- | --- |
| `streamPath` | `'/workers/executions'` |
| `baseUrl` | `'https://streams.example.test'` |
| Resolved endpoint | `'https://streams.example.test/v1/stream/netscript/workers/executions'` |

## Producer sessions across restarts

A stable `producerId` identifies a writer; it does **not** persist its epoch or next sequence.
Follow the [Durable Streams restart flow](https://github.com/durable-streams/durable-streams/blob/main/PROTOCOL.md#521-idempotent-producers):
atomically allocate and persist a monotonically increasing epoch for each `(streamPath, producerId)`
session, then pass it as `initialEpoch` before producing the first changed document. Epoch 0 is
valid for the first session. Each recreated session starts its sequence at 0 under its new epoch.
The first append establishes that epoch on the server; construction, readiness, flush of an empty
queue, and `stop()` append no claim event and do not advance the stream offset.

```ts
// Application-owned storage must allocate a strictly higher epoch atomically.
// Keep the epoch counter for as long as the stream's producer state exists.
const initialEpoch = await feedStore.allocateNextEpoch(streamPath, producerId);
const producer = createServiceStreamProducer({ streamPath, producerId, initialEpoch, schema });
await producer.waitUntilReady();
try {
  // Compare against the application's persisted checkpoint before producing.
  if (await feedStore.hasChanged(document)) {
    const outcome = await producer.upsert("execution", document).completion;
    if (outcome.status !== "delivered") throw new Error(`Feed write: ${outcome.status}`);
    await feedStore.checkpoint(document);
  }
} finally {
  await producer.stop(); // Leave the stream open for the next session.
}
```

`feedStore` is your application's storage contract, not a streams-core API. Allocate once per
session, never once per retry or repeated singleton lookup. A live path singleton rejects a
changed epoch configuration; await `stop()` before replacing it. Do not expire or reset the epoch
counter while the stream retains producer state, and do not infer epochs from wall clocks or random
numbers. `initialEpoch` must be an integer between 0 and `Number.MAX_SAFE_INTEGER` inclusive;
invalid values throw before network IO.

With an explicit epoch, a `403` stale-epoch response is terminal: the producer reports failure
instead of taking over another session. A lost acknowledgement retries the same serialized bytes
and `(producerId, epoch, sequence)` tuple, so the server's duplicate response appends nothing.
Without `initialEpoch`, legacy producers start at epoch 0 and auto-claim only after a stale-epoch
response. **That default is insufficient for stable-ID restart safety:** if epoch 0 already exists,
a different first document at sequence 0 may be acknowledged as a duplicate without an append.
Migrate stable restarted producers to explicit persisted epochs.

Unchanged documents append nothing **when the caller skips `upsert` using its checkpoint**.
Streams core does not compare document contents: each explicit `upsert` is a new operation, even
for an identical entity value. Transport retry deduplication applies within a session; an operation
with an unknown result before a process crash can be emitted again under a new epoch. Coordinate
checkpoints and make downstream processing idempotent where that crash window matters. The consumer
HTTP/SSE State Protocol contract and opaque offset format are unchanged.

## Storage mode and restart operations

{{ comp callout { type: "caution", title: "Memory storage loses data on restart" } }}
When <code>STREAMS_DATA_DIR</code> is unset, the streams service uses <strong>in-memory, non-durable storage</strong>, and all stream history is lost when the process restarts. "Durable Streams" names the protocol, not a persistence guarantee for memory storage.
{{ /comp }}

The plugin manifest declares memory as the ephemeral default. The detailed `/health` payload
reports the mode in `checks[name="streams-storage"].storage`, with `mode: "memory" | "file"`,
`durable`, and `probe: "not-applicable" | "passed"`. Memory storage can be healthy while it reports
`durable: false`.

To let the generated AppHost provision file storage, add this to the existing
`NetScript.Plugins.streams` entry in `appsettings.json`:

```json
{
  "DataDirectories": {
    "STREAMS_DATA_DIR": ".netscript/data/streams"
  }
}
```

Run `netscript generate aspire`, then start the AppHost. Its generated registration creates the
directory and missing parents, retains existing data, and sets `STREAMS_DATA_DIR` to the absolute
path before starting streams. Relative paths resolve from the streams resource's `Workdir`
(the project root in the default scaffold). Ignore `.netscript/data/` in Git. Omitting this
opt-in keeps storage ephemeral. Directory bindings override conflicting `Environment` values.

Programmatic hosts use `new StreamsAspireContribution({ dataDir: '.netscript/data/streams' })`
from `@netscript/plugin-streams/aspire`; the contribution declares the directory and environment
binding for the host builder without provisioning it during import.

The existing `Environment.STREAMS_DATA_DIR` opt-in still requires a manually created directory.
An empty, missing or unwritable manually configured path fails startup; there is no memory fallback.
For AppHost-provisioned paths, a file at the target or an unwritable location fails composition.
A startup write/read probe must pass before health reports file mode. The probe verifies directory
I/O, not historical integrity or repair. Deployments must mount persistent storage separately;
a folder in a disposable container does not provide persistence.

To return to memory storage, remove the directory binding and any manual environment opt-in,
regenerate the helpers and restart the AppHost. Retained files are not deleted. The full
`scaffold.runtime` acceptance includes an ephemeral control and compares real producer document
and tombstone history before and after an Aspire restart of the file-backed streams resource.

File mode survives an orderly process restart. It does not cover power loss, replication, or
multiple concurrent owners: one process owns a directory. Retention is unbounded until you
configure expiry or deletion; there is no automatic compaction or archival, so monitor disk space.

Recovery stops at the last complete native frame, so an incomplete final append can be lost.
Missing segment files can read empty, and corrupt LMDB metadata may refuse startup. If recovery
fails, preserve the damaged files and restore a known-good backup.

Live file copies are not a consistent backup. To back up and restore:

1. Stop producers and the streams service.
2. Copy the **entire** data directory, metadata and segments.
3. Restore the complete copy while streams is stopped, with compatible storage and protocol
   versions.
4. Verify replay before you restart producers.

## Worker execution progress

Worker handlers report progress through an execution-local outbound channel. Calls are persisted in
invocation order for that execution, including repeated percentages and decreasing values; the
runtime does not debounce, deduplicate, or coalesce them. A terminal success or failure waits for
all accepted progress writes to drain, so an unawaited progress call cannot race past completion.
Progress persistence failures fail the execution instead of being reduced to log messages.

Each accepted transition publishes the full execution-record upsert, so durable-stream replay stays
entity replay. Offsets order the retained updates, and reducing by execution id materializes the
newest record with its last progress value and terminal status. Intermediate updates may be visible
in the retained log, but this is not a separate progress-history API.

## Known limitations

{{ comp callout { type: "warning", title: "Local HTTP limits stream consumers" } }}
The local AppHost serves the generated app over <code>http://</code>. Under HTTP/1.1, browsers typically allow about six concurrent connections per origin, so several long-lived HTTP/SSE streams from one Fresh page can starve later requests or stream subscriptions. Use HTTPS for HTTP/2 when a local dashboard needs many simultaneous stream consumers.
{{ /comp }}

## Endpoints and manifest

The streams plugin is a utility plugin. It requires **neither a database nor KV**
(`requiresDb=false`, `requiresKv=false`), unlike workers, sagas, and triggers. Its durable-stream
service listens on its assigned port, which `STREAMS_PORT` or `PORT` overrides, and joins the Aspire
resource graph so workers, sagas, and auth can publish through it.

{{ comp.apiTable({
  title: "Streams plugin — runtime facts",
  columns: ["Property", "Value"],
  rows: [
    ["Plugin location", "<code>plugins/streams/</code>"],
    ["Producer package", "<code>@netscript/plugin-streams-core</code> (<code>createDurableStream</code>, <code>createServiceStreamProducer</code>, <code>defineStreamSchema</code>)"],
    ["Manifest import", "<code>@netscript/plugin-streams</code> — <code>streamsPlugin</code> and typed topic definitions"],
    ["Transport client", "<code>@durable-streams/client</code>"],
    ["Dev service port", "its assigned port (durable-stream Aspire service; override with <code>STREAMS_PORT</code>/<code>PORT</code>)"],
    ["provider.kind", "<code>stream</code> · category <code>plugin</code> · pluginType <code>utility</code>"],
    ["Requires DB / KV", "<code>false</code> / <code>false</code>"],
    ["First-party producers", "workers, sagas, triggers, auth (each <code>streams/producer.ts</code> → <code>createDurableStream</code>)"],
    ["Consumer surface", "HTTP/SSE from the server (Fresh clients) — <strong>no</strong> in-process <code>subscribe()</code>"]
  ]
}) }}

`netscript.config.ts` references the plugin as `./plugins/streams/mod.ts`. Workers, sagas, and
triggers each list `streams` in their `dependencies`, so it installs first and its service is up
before dependent producers write.

## Production notes

- **Keep `producerId` stable and allocate a higher persisted `initialEpoch` on restart.** A
  stable ID alone cannot distinguish a new session from a duplicate retry. Filter unchanged source
  documents with an application checkpoint before calling `upsert`.
- **Treat a `flush()` rejection on shutdown as a real delivery failure**, not noise. Bring Aspire,
  or an explicit `DURABLE_STREAMS_URL`, up before producers start.
- **Set the auth secret on both ends.** When the server expects a bearer token, export
  `STREAMS_SECRET` (or `DURABLE_STREAMS_SECRET`) wherever the producer runs, so `getStreamsAuth()`
  can attach it.

## Next steps

Publish execution state and read it into a live Fresh page in the
[live-dashboard tutorial](/tutorials/live-dashboard/05-live-stream/). The full API is in
the {{ comp.xref({ key: "ref:streams", text: "streams reference" }) }}.
