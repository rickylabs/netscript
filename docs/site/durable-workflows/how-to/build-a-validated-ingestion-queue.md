---
layout: layouts/base.vto
title: Build a validated ingestion queue
description: Reject malformed messages before they enter a queue and again before a consumer runs.
templateEngine: [vento, md]
order: 101
oldUrl: /how-to/build-a-validated-ingestion-queue/
---

# Build a validated ingestion queue

This recipe builds a queue that checks each message against a Zod schema before it enters the queue
and again before a consumer handles it. It uses `createTypedQueue(name, schema, options)`.

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

With `validateOnDequeue: true`, the queue parses the raw backend message before it calls your
handler. `onValidationError: 'dlq'` nacks invalid messages with `requeue: false`,
`reason: 'validation_failed'`, and `errorCode: 'VALIDATION_ERROR'`.

```ts
await queue.listen(async (message, context) => {
  await updateShipmentProjection(message);
  await context.ack();
});
```

## Provider notes

| Provider | Use it when |
| --- | --- |
| `QueueProvider.DenoKv` | You want a local default with no external broker. |
| `QueueProvider.Redis` | Redis is already deployed and you need high-throughput queueing. |
| `QueueProvider.RabbitMQ` | Your deployment is broker-centric and uses AMQP. |
| `QueueProvider.Postgres` | You want a transactional queue over the primary database. Select it explicitly. |

## Failure modes

| Failure | Result |
| --- | --- |
| Producer validation fails | `enqueue` throws and no message is stored. |
| Consumer validation fails with `discard` | The message is acknowledged without handler work. |
| Consumer validation fails with `dlq` | The message is nacked without requeue, for dead-letter handling. |
| Consumer validation fails with `throw` | The queue throws `QueueValidationError`, and the backend retry policy decides the next delivery. |

## Next step

Pick a backend with [Choose a queue provider](/data-persistence/how-to/choose-a-queue-provider/).
The full API is in the [queue reference](/reference/queue/).
