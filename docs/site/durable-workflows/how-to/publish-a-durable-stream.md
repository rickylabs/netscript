---
layout: layouts/base.vto
title: Publish a durable stream
templateEngine: [vento, md]
order: 102
oldUrl: /how-to/publish-a-durable-stream/
---

# Publish a durable stream

Use `createDurableStream(options)` when a server-side runtime owns entity state that browser
clients or other consumers should subscribe to through a durable stream service.

## Prerequisites

- A stream schema from `defineStreamSchema(...)`.
- A stable `streamPath`.
- A stable `producerId` for idempotent delivery.
- The streams runtime service reachable for the stream path.

## Define the schema

`defineStreamSchema(...)` accepts collection definitions keyed by collection name. Each collection
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

`createDurableStream({ streamPath, schema, producerId, signal })` returns a singleton producer for
the stream path while it remains open.

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

The producer validates the collection key against the schema and reads the entity primary key from
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

Call `flush()` before a process exits so pending writes reach the stream runtime. `close()` flushes
and removes the singleton producer for the stream path.

```ts
addEventListener('unload', async () => {
  shutdown.abort();
  await producer.flush();
  await producer.close();
});
```

## Failure modes

- Missing primary key: the producer skips the upsert for that entity.
- Unknown collection key: TypeScript catches it when the schema is typed; unchecked dynamic values
  should be validated before calling `upsert`.
- Runtime unavailable: `flush()` can throw the connection error. Treat this as a deploy/runtime
  failure, not proof of subprocess behavior.
- Duplicate stream path: `createDurableStream` reuses the open producer for the same `streamPath`.

## Next steps

- See the capability model in [Durable streams](/capabilities/streams/).
- Build a live UI in [Live Dashboard, chapter 05](/tutorials/live-dashboard/05-live-stream/).
- Look up the API in [streams reference](/reference/streams/).

{{ comp.nextPrev({
  prev: { label: "Build a validated ingestion queue", href: "/how-to/build-a-validated-ingestion-queue/" },
  next: { label: "Restrict worker task permissions", href: "/how-to/restrict-worker-task-permissions/" }
}) }}
