# @netscript/plugin-streams-core

[![JSR](https://jsr.io/badges/@netscript/plugin-streams-core)](https://jsr.io/@netscript/plugin-streams-core)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The schema, producer, and diagnostics primitives that the NetScript `@netscript/plugin-streams`
plugin builds on: define a type-safe durable stream schema, then write change events to a State
Protocol stream through an idempotent producer.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/plugin-streams-core

# Node.js / Bun
npx jsr add @netscript/plugin-streams-core
bunx jsr add @netscript/plugin-streams-core
```

### Usage

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

### Endpoint resolution and diagnostics

Resolve the durable-streams base URL, build a concrete stream URL, and produce a JSON-stable
inspection report for a schema before wiring a producer:

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

---

## 📦 Key Capabilities

- **Type-safe schemas**: `defineStreamSchema` builds a State Protocol schema from
  `~standard`-validated collections, keyed by collection name with a configured `primaryKey`.
- **Idempotent producers**: `createDurableStream` returns a path-singleton `DurableStreamProducer`
  that appends `upsert`/`delete` change events with idempotent, auto-claimed delivery and graceful
  `flush`/`close`.
- **Endpoint resolution**: `getStreamsUrl`, `getStreamsAuth`, and `buildStreamUrl` resolve the
  durable streams server base URL and auth headers across Deno and browser contexts.
- **Diagnostics**: `inspectStreamTopic` produces a JSON-stable inspection report for a schema and
  optional producer metadata.
- **Telemetry and testing subpaths**: `/telemetry` exposes span names, attribute keys, and the
  instrumentation registration; `/testing` ships `MemoryStreamProducer` and
  `createStreamTopicFixture` for socket-free tests.

---

## 📖 Documentation

- **Reference (Streams family, Internals section)**:
  [rickylabs.github.io/netscript/reference/streams/](https://rickylabs.github.io/netscript/reference/streams/)
- **Durable Workflows pillar**:
  [rickylabs.github.io/netscript/durable-workflows/](https://rickylabs.github.io/netscript/durable-workflows/)

---

## 📝 License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
