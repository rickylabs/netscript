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
- **Endpoint resolution across contexts** — `getStreamsUrl`, `getStreamsAuth`, and `buildStreamUrl`
  resolve the durable-streams base URL and auth headers in both Deno and browser contexts.
- **Diagnostics without a socket** — `inspectStreamTopic` produces a JSON-stable inspection report
  for a schema and optional producer metadata.
- **Test without a server** — `./testing` ships `MemoryStreamProducer` and
  `createStreamTopicFixture` for socket-free tests; `./telemetry` exposes span names and
  instrumentation registration.

## Install

```bash
deno add jsr:@netscript/plugin-streams-core
```

For version pins in configuration, use the `@<version>` placeholder pinned to your installed CLI;
bare `jsr:@netscript/*` specifiers do not resolve on the pre-release line.

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
producer.upsert('execution', { id: 'exec-1', status: 'running' });
await producer.flush();
```

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
| `.`           | `defineStreamSchema`, `createDurableStream`, `createServiceStreamProducer`, endpoint resolution, and `inspectStreamTopic` |
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
