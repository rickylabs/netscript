---
layout: layouts/base.vto
title: Publish a durable stream
templateEngine: [vento, md]
order: 102
oldUrl: /how-to/publish-a-durable-stream/
prev: { label: "Build a validated ingestion queue", href: "/durable-workflows/how-to/build-a-validated-ingestion-queue/" }
next: { label: "Restrict worker task permissions", href: "/background-processing/how-to/restrict-worker-task-permissions/" }
---

# Publish a durable stream

This recipe publishes entity state from a server-side runtime to a durable stream, so browser
clients and other consumers can read it live. It uses `createDurableStream(options)`.

## Prerequisites

- A stream schema from `defineStreamSchema(...)`.
- A stable `streamPath`.
- A stable `producerId` for idempotent delivery.
- The streams runtime service reachable for the stream path.

## Define the schema

`defineStreamSchema(...)` takes collection definitions keyed by collection name. Each collection
declares a `schema`, `type`, and `primaryKey`.

```ts
import { defineStreamSchema } from '@netscript/plugin-streams-core';

const standardShipmentSchema = {
  '~standard': {
    version: 1,
    vendor: 'example',
    validate: (value: unknown) => ({ value }),
  },
} as const;

export const shipmentStreamSchema = defineStreamSchema({
  shipments: {
    schema: standardShipmentSchema,
    type: 'shipment',
    primaryKey: 'id',
  },
});
```

## Create the producer

`createDurableStream({ streamPath, schema, producerId, signal })` returns one producer per stream
path while that producer stays open.

```ts
import { createDurableStream } from '@netscript/plugin-streams-core';
import { shipmentStreamSchema } from './shipment-stream-schema.ts';

const shutdown = new AbortController();

const producer = createDurableStream({
  streamPath: '/shipments',
  schema: shipmentStreamSchema,
  producerId: 'shipping-service',
  signal: shutdown.signal,
});
```

## Upsert and delete state

The producer checks the collection key against the schema and reads the entity primary key from
the configured `primaryKey` field.

```ts
producer.upsert('shipments', {
  id: 'ship_123',
  orderId: 'ord_123',
  status: 'in_transit',
  updatedAt: new Date().toISOString(),
});

producer.delete('shipments', 'ship_123');
```

## Flush on shutdown

Call `flush()` before the process exits so pending writes reach the stream runtime. `close()`
flushes and removes the producer for the stream path.

```ts
addEventListener('unload', async () => {
  shutdown.abort();
  await producer.flush();
  await producer.close();
});
```

## Failure modes

| Failure | Result |
| --- | --- |
| Missing primary key | The producer skips the upsert for that entity. |
| Unknown collection key | TypeScript catches it when the schema is typed. Validate unchecked dynamic values before you call `upsert`. |
| Runtime unavailable | `flush()` can throw the connection error. Treat it as a deploy or runtime failure. |
| Duplicate stream path | `createDurableStream` reuses the open producer for the same `streamPath`. |

## Next step

Read the stream from a page in [Live Dashboard, chapter 05](/tutorials/live-dashboard/05-live-stream/).
The full API is in the [streams reference](/reference/streams/).
