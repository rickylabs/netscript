# @netscript/plugin-streams

Durable Streams plugin for NetScript — declares the streams service manifest, CLI, Aspire, and E2E
contributions, plus typed stream-topic helper definitions.

## Install

```sh
deno add jsr:@netscript/plugin-streams
```

Focused subpath imports are available for the plugin's framework integrations:

```ts
import { StreamsCli } from '@netscript/plugin-streams/cli';
import { StreamsAspireContribution } from '@netscript/plugin-streams/aspire';
import { getStreamsE2eGates } from '@netscript/plugin-streams/e2e';
import { streamsScaffolder } from '@netscript/plugin-streams/scaffolding';
```

## Quick example

Add the plugin to your `netscript.config.ts` and inspect the manifest it contributes:

```ts
import { streamsPlugin } from '@netscript/plugin-streams';

console.log(streamsPlugin.name);
console.log(streamsPlugin.contributions.services?.[0]?.name);
```

Define a typed topic and derive producer and consumer handles at the manifest layer:

```ts
import {
  defineStreamConsumer,
  defineStreamProducer,
  defineStreamTopic,
} from '@netscript/plugin-streams';

const topic = defineStreamTopic('orders', schema);
const producer = defineStreamProducer(topic);
const consumer = defineStreamConsumer(topic);
```

Runtime stream primitives (`createDurableStream`, `defineStreamSchema`, producers, and consumers)
live in `@netscript/plugin-streams-core`. The default streams service listens on port `4437`; set
`STREAMS_PORT` or `PORT` to override it and `STREAMS_DATA_DIR` for file-backed storage.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/streams/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
