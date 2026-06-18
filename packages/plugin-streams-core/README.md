# @netscript/plugin-streams-core

Schema, producer, configuration, telemetry, testing, and diagnostics primitives for NetScript durable streams.

## Install

```sh
deno add jsr:@netscript/plugin-streams-core
```

## Quick example

Define a type-safe stream schema and create a durable producer that writes entities to a stream path:

```ts
import { createDurableStream, defineStreamSchema } from '@netscript/plugin-streams-core';

const schema = defineStreamSchema({
  execution: {
    schema: {
      '~standard': { version: 1, vendor: 'example', validate: (value) => ({ value }) },
    },
    type: 'execution',
    primaryKey: 'id',
  },
});

const producer = createDurableStream({
  streamPath: '/workers/executions',
  schema,
  producerId: 'workers-service',
});

producer.upsert('execution', { id: 'exec-1', status: 'running' });
```

`getStreamsUrl()` resolves the durable streams server base URL in both Deno and browser contexts, and
`inspectStreamTopic()` produces a JSON-stable diagnostic report for a schema. Telemetry and testing
primitives are available from the `./telemetry` and `./testing` subpath exports.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/plugin-streams-core/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
