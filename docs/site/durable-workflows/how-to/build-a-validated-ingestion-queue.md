---
layout: layouts/base.vto
title: Build a validated ingestion queue
templateEngine: [vento, md]
order: 101
oldUrl: /how-to/build-a-validated-ingestion-queue/
---

# Build a validated ingestion queue

Use `createTypedQueue(name, schema, options)` when inbound messages must be checked before they
enter the queue and again before a consumer handles them.

## Prerequisites

- A Zod schema for the message payload.
- A queue provider decision: auto-discovery, Deno KV, Redis, RabbitMQ, or Postgres.
- A dead-letter policy for invalid messages.

## Create the queue

`TypedQueueOptions` extends the normal queue options with `validateOnEnqueue`,
`validateOnDequeue`, and `onValidationError`.

```ts
import { createTypedQueue, QueueProvider } from '@netscript/queue';
import { z } from 'zod';

const ShipmentEventSchema = z.object({
  shipmentId: z.string().min(1),
  orderId: z.string().min(1),
  status: z.enum(['created', 'in_transit', 'delivered']),
});

const queue = createTypedQueue('shipment-events', ShipmentEventSchema, {
  provider: QueueProvider.Postgres,
  validateOnEnqueue: true,
  validateOnDequeue: true,
  onValidationError: 'dlq',
});
```

## Produce validated messages

With `validateOnEnqueue: true`, invalid producer input throws `QueueValidationError` before the
message reaches the backend.

```ts
await queue.enqueue({
  shipmentId: 'ship_123',
  orderId: 'ord_123',
  status: 'in_transit',
});
```

## Consume validated messages

With `validateOnDequeue: true`, the queue parses the raw backend message before calling your
handler. `onValidationError: 'dlq'` nacks invalid messages with `requeue: false`,
`reason: 'validation_failed'`, and `errorCode: 'VALIDATION_ERROR'`.

```ts
await queue.listen(async (message, context) => {
  await updateShipmentProjection(message);
  await context.ack();
});
```

## Provider notes

- `QueueProvider.DenoKv`: good local default, no external broker.
- `QueueProvider.Redis`: high-throughput queueing when Redis is already deployed.
- `QueueProvider.RabbitMQ`: AMQP path for broker-centric deployments.
- `QueueProvider.Postgres`: transactional queue over the primary database; select it explicitly.

## Failure modes

- Producer validation failure: enqueue throws and no message is stored.
- Consumer validation failure with `discard`: the message is acknowledged without handler work.
- Consumer validation failure with `dlq`: the message is nacked without requeue for dead-letter
  handling.
- Consumer validation failure with `throw`: the queue throws `QueueValidationError` so the backend
  retry policy decides the next delivery.

## Next steps

- Compare providers in [Choose a queue provider](/data-persistence/how-to/choose-a-queue-provider/).
- Use queues with KV and cron in [Queue / KV / cron](/data-persistence/how-to/queue-kv-cron/).
- Look up the full API in [queue reference](/reference/queue/).

{{ comp.nextPrev({
  prev: { label: "Build a server-validated form", href: "/web-layer/how-to/build-a-server-validated-form/" },
  next: { label: "Publish a durable stream", href: "/durable-workflows/how-to/publish-a-durable-stream/" }
}) }}
