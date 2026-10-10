# @netscript/plugin-streams-core

[![JSR](https://jsr.io/badges/@netscript/plugin-streams-core)](https://jsr.io/@netscript/plugin-streams-core)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The schema and producer primitives behind NetScript durable streams: define a type-safe stream
schema, then write change events through an idempotent, flushable producer.**

Publishing change events sounds trivial until you need it to be safe: typed payloads, idempotent
appends, one producer per stream path, and a clean flush on shutdown. This package is that safety
layer. `defineStreamSchema` declares the collections a stream carries with standard-schema
validation and a configured primary key; `createDurableStream` returns a path-singleton producer
whose `upsert`/`delete` appends are idempotent and auto-claimed; and the diagnostics helpers inspect
a schema or resolve the stream endpoint without opening a socket.

This is the layer the [`@netscript/plugin-streams`](https://jsr.io/@netscript/plugin-streams)
plugin's service and the other NetScript plugins build on when they project entities — executions,
sagas, sessions — into durable topics.

## Why teams use it

- **Type-safe stream schemas** — `defineStreamSchema` builds a state schema from
  standard-schema-validated collections, keyed by collection name with a configured `primaryKey`.
- **Idempotent, singleton producers** — `createDurableStream` returns one `DurableStreamProducer`
  per stream path, appending `upsert`/`delete` change events with idempotent, auto-claimed delivery
  and graceful `flush`/`close`.
- **One versioned SSE authority** — `./sse` validates the named `data`/`control` wire frames and
  exposes typed heartbeat/error outcomes plus replay state for durable consumers.
- **Endpoint resolution across contexts** — `getStreamsUrl`, `getStreamsAuth`, and `buildStreamUrl`
  resolve the durable-streams base URL and auth headers in both Deno and browser contexts.
- **Diagnostics without a socket** — `inspectStreamTopic` produces a JSON-stable inspection report
  for a schema and optional producer metadata.
- **Test without a server** — `./testing` ships `MemoryStreamProducer` and
  `createStreamTopicFixture` for socket-free tests; `./telemetry` exposes span names and
  instrumentation registration.

## Install

```bash
deno add jsr:@netscript/plugin-streams-core@<version>
```

Pin `<version>` to match your installed CLI; bare `jsr:@netscript/*` specifiers do not resolve on
the pre-release line.

## Quick example

```typescript
import { createDurableStream, defineStreamSchema } from '@netscript/plugin-streams-core';

// Declare the collections this stream carries.
const schema = defineStreamSchema({
  execution: {
    schema: {
      '~standard': { version: 1, vendor: 'workers', validate: (value) => ({ value }) },
    },
    type: 'execution',
    primaryKey: 'id',
  },
});

// Open (or reuse) a singleton producer for the stream path.
const producer = createDurableStream({
  streamPath: '/workers/executions',
  schema,
  producerId: 'workers-service',
});

// Publish change events; flush before shutdown.
producer.upsert(
  'execution',
  { id: 'exec-1', status: 'running' },
  { correlationId: 'request-42', messageId: 'execution-started-1' },
);
await producer.flush();
```

## Producer reconnect contract

`DurableStreamProducer` uses a finite lifecycle:
`connecting → ready ↔ backoff/reconnecting → stopping → stopped`, with terminal `failed` when a
bounded operation exhausts its retry budget or the server reports a non-retryable protocol failure.
The default policy makes eight total attempts with exponential delay from 100 ms, capped at five
seconds and jittered by 20 percent. Each transport request also has a five-second timeout, so a
connected proxy with an unavailable backend cannot hold an attempt open forever. Infinite retry
or request duration is not supported.

Writes enter a FIFO bounded to 256 events and 1 MiB of serialized UTF-8 by default. The producer
rejects the newest write when either bound would be exceeded; it never evicts an already accepted
write. `upsert` and `delete` return a receipt immediately. Its `accepted` flag reports whether the
write entered the FIFO, while `completion` settles exactly once as `delivered`, `rejected`,
`cancelled`, or `delivery-unknown`. A lost acknowledgement is reported as `delivery-unknown`, never
as a false delivery or silent rejection.

`waitUntilReady()` observes the next ready transition. `flush()` waits only for writes accepted
before that call. `stop()` cancels local work without sending durable EOF; `close()` drains accepted
writes and resolves only after the server acknowledges terminal `streamClosed`. SSE offsets remain
consumer-owned opaque tokens and are never parsed or advanced by the producer.

Resolve the endpoint and inspect a schema before wiring a producer:

```typescript
import {
  buildStreamUrl,
  defineStreamSchema,
  getStreamsUrl,
  inspectStreamTopic,
} from '@netscript/plugin-streams-core';

const schema = defineStreamSchema({
  execution: {
    schema: {
      '~standard': { version: 1, vendor: 'workers', validate: (value: unknown) => ({ value }) },
    },
    type: 'execution',
    primaryKey: 'id',
  },
});

// Resolve the server base URL, then the concrete path for this stream.
const streamPath = '/workers/executions';
const url = buildStreamUrl(streamPath, getStreamsUrl());

// Inspect the schema without opening a socket.
const report = inspectStreamTopic({ target: url, schema, streamPath });
console.log(report.summary); // e.g. ".../workers/executions: 1 stream collection(s)"
```

## Public surface

| Entry         | What it gives you                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `.`           | `defineStreamSchema`, `createDurableStream`, per-write correlation context, endpoint resolution, and `inspectStreamTopic` |
| `./sse`       | Versioned wire schemas, named-frame parser, replay reducer, and native `EventSource` binding                              |
| `./telemetry` | Span names, attribute keys, and instrumentation registration                                                              |
| `./testing`   | `MemoryStreamProducer` and `createStreamTopicFixture` for socket-free tests                                               |

The always-current symbol list is
[`deno doc jsr:@netscript/plugin-streams-core@<version>`](https://jsr.io/@netscript/plugin-streams-core/doc)
(pin `<version>` on the pre-release line, as above).

## Docs

- **Streams reference — the streams family surface**:
  [rickylabs.github.io/netscript/reference/streams/](https://rickylabs.github.io/netscript/reference/streams/)
- **Streams capability — durable topics end to end**:
  [rickylabs.github.io/netscript/capabilities/streams/](https://rickylabs.github.io/netscript/capabilities/streams/)
- **API docs on JSR**:
  [jsr.io/@netscript/plugin-streams-core/doc](https://jsr.io/@netscript/plugin-streams-core/doc)

## Compatibility

Schemas and producers are plain TypeScript and resolve their endpoint in both Deno and browser
contexts; publishing requires a reachable Durable Streams service. The testing surface runs with
zero permissions.

## License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.

## Checked command relay sink

`./integration/commands` exports `createStreamCommandOutboxSink`. Supply an existing
`StreamProducerPort`; topic selects a collection and payload is either
`{ operation: 'upsert', value: { id: 'entity', ... } }` or
`{ operation: 'delete', key: 'entity' }`. The adapter forwards the stable outbox id as
`StreamWriteContextV1.messageId` and the command correlation. The existing producer serializes
both into State Protocol headers and owns W3C producer context, buffering and bounded retries.
Only eventual `delivered` completion acknowledges the relay, including native duplicate-tuple
acknowledgements. Local FIFO acceptance alone, rejection, cancellation or delivery-unknown cannot
settle the outbox. Cancellation is cooperative around completion; this sink never stops the
consumer-owned producer. Native transport retries retain their producer tuple; relay redelivery
is a new producer operation with the same message id. Downstream processing must be idempotent.
No producer, queue or resource starts on sink construction.

```ts
import {
  createStreamCommandOutboxSink,
  type StreamProducerPort,
} from '@netscript/plugin-streams-core/integration/commands';
declare const producer: StreamProducerPort;
const sink = createStreamCommandOutboxSink({ id: 'streams', producer });
```

## Stream retention and administration

Set `retention: { kind: 'ttl', ttlSeconds: 604800 }` or an `expires-at` RFC3339 timestamp on
producer options. Retention applies at creation, expires the whole stream, and is validated before
IO; reconnecting does not renew it. Without retention, existing behavior is preserved.

`headDurableStream(path)` returns metadata or null; `deleteDurableStream(path)` returns true when
deleted and false when already absent. Both resolve discovery/auth through the existing streams
service configuration and throw `StreamAdminError` with typed authorization, timeout, cancellation,
or transport failures. Requests default to a 5,000 ms deadline and emit administrative spans.
Use these helpers in a background worker or scheduled trigger under a service identity.

The `./admin` subpath exports `DurableStreamAdmin` and the versioned administrative port contracts
for injection. Stop segment producers before deleting their streams. Entity-level producer delete
only appends a tombstone. Offset trim and server-side listing are not implemented.

See the [retention how-to](https://rickylabs.github.io/netscript/durable-workflows/how-to/bound-stream-retention/).
