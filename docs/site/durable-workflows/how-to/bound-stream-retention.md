---
layout: layouts/base.vto
title: Bound stream retention
templateEngine: [vento, md]
order: 103
---

# Bound stream retention

Use absolute expiry or rotating day segments for a hard bound on a durable stream without an
application session. A TTL is a sliding inactivity window: it expires idle streams, but cannot bound
a stream that stays active. The streams server expires the whole stream. For existing day-segmented
logs, a scheduled trigger can enqueue a background worker that deletes known expired segment paths.

## Choose absolute expiry for a hard bound

Declare `retention` on `createServiceStreamProducer` or `createDurableStream` before the stream is
created. On the shipped reference server, TTL is a sliding inactivity window renewed by reads and
appends. HEAD and reopening with PUT do not renew it. A continuously accessed stream can therefore
live indefinitely. Absolute expiry does not slide and gives a hard deadline even while the stream is
active. Both policies expire the entire stream rather than individual events. Omitting retention
preserves the existing unbounded server policy.

```ts
import { createServiceStreamProducer, defineStreamSchema } from '@netscript/plugin-streams-core';
import { z } from 'zod';

const schema = defineStreamSchema({
  observations: {
    schema: z.object({ id: z.string(), detail: z.string() }),
    type: 'observation',
    primaryKey: 'id',
  },
});
const producer = createServiceStreamProducer({
  streamPath: '/observations/2030-10-01',
  schema,
  producerId: 'observations-service',
  retention: { kind: 'expires-at', expiresAt: '2030-10-08T00:00:00Z' },
});
await producer.waitUntilReady();
const receipt = producer.upsert('observations', { id: 'event-1', detail: 'received' });
await receipt.completion;
await producer.stop();
```

For cleanup after inactivity use `retention: { kind: 'ttl', ttlSeconds: 7 * 24 * 60 * 60 }` instead.
This is seven days since the latest read or append, not seven days since creation. The versioned
`StreamRetentionPolicyV1` union makes TTL and expiry mutually exclusive. TTL must be a positive safe
integer number of seconds; expiry must be a valid RFC3339 timestamp with a timezone. Invalid
retention throws at producer construction before transport IO.

The transport maps these options through the upstream client's `ttlSeconds` / `expiresAt` to
`Stream-TTL` / `Stream-Expires-At` on the create PUT. Appends and durable close carry no retention
headers. Reopening with PUT preserves the policy and last-access time. Later reads and appends renew
a TTL, but never move an absolute expiry. To change policy, rotate to a new segment path. A path
singleton rejects conflicting retention options. Stop old producers before deleting a segment: a
live producer can recreate an absent stream on a later reconnect.

## Delete known segments in a background worker

`headDurableStream(path)` returns bounded metadata or `null`; `deleteDurableStream(path)` returns
`true` when deleted and `false` when already absent. `DurableStreamProducer.delete(collection, key)`
only appends an entity tombstone and grows the log; use the whole-stream helper to release storage.
No application needs to import the protocol client directly.

This worker receives one known expired segment path from a service-owned segment index. Validate
ownership and age in that index before enqueueing; never accept an arbitrary path from a browser.

```ts
// Worker contribution: jobs/delete-observation-segment.ts
import { defineJobHandler } from '@netscript/plugin-workers-core';
import { deleteDurableStream, StreamAdminError } from '@netscript/plugin-streams-core';
import { z } from 'zod';

export default defineJobHandler(
  z.object({ segmentPath: z.string().regex(/^\/observations\/\d{4}-\d{2}-\d{2}$/) }),
  async ({ payload, signal }) => {
    try {
      const deleted = await deleteDurableStream(payload.segmentPath, {
        requestTimeoutMs: 5000,
        signal,
      });
      return { success: true, data: { deleted } };
    } catch (error) {
      if (error instanceof StreamAdminError && error.failure.kind === 'unauthorized') {
        throw new Error('The retention worker service identity cannot administer streams');
      }
      throw error; // The workers runtime owns retry and dead-letter policy.
    }
  },
);
```

The trigger processor runs the cron schedule and hands work to the workers runtime. In this
self-contained example the path is a known expired segment; production code reads a bounded page
from its service-owned index and enqueues each expired path with a stable idempotency key.

```ts
// Trigger contribution: triggers/delete-observation-segment.ts
import { defineScheduledTrigger, enqueueJob } from '@netscript/plugin-triggers-core/builders';
import { defineJob } from '@netscript/plugin-workers-core';
import { z } from 'zod';

const deleteSegment = defineJob('delete-observation-segment')
  .payload(z.object({ segmentPath: z.string() }))
  .entrypoint('./jobs/delete-observation-segment.ts')
  .build();

export default defineScheduledTrigger(
  () =>
    Promise.resolve([
      enqueueJob(deleteSegment, {
        payload: { segmentPath: '/observations/2026-10-01' },
        idempotencyKey: 'delete-observation-segment:2026-10-01',
      }),
    ]),
  { id: 'observation-retention', cron: '0 2 * * *', timezone: 'UTC' },
);
```

Register both contributions through the existing plugin generation flow. Give the workers service
the streams reference, network permission, and environment access for discovery and auth.
`buildStreamUrl` resolves the stream path and `getStreamsAuth` uses `STREAMS_SECRET` or
`DURABLE_STREAMS_SECRET` from the service process. Keep this credential in the backend service;
retention runs even when every phone and web application is closed.

## Errors, cancellation, and instrumentation

The administrative helpers accept `signal`, positive integer `requestTimeoutMs` (default 5,000), an
injectable `StreamAdminPort`, and `StreamsInstrumentation`. They emit `stream.head` and
`stream.delete` client spans, finishing both successful and failed requests. The port uses the same
`StreamProducerTransportResultV1<T>` as producer transports. Helpers throw `StreamAdminError` with
its typed `failure` for authorization, timeout, cancellation, and transport failures.

| Result                       | Helper behavior           | Port outcome    |
| ---------------------------- | ------------------------- | --------------- |
| Present / deleted            | Metadata / `true`         | `ok: true`      |
| Not found                    | `null` / `false`          | `ok: true`      |
| HTTP 401 or 403              | Throws `StreamAdminError` | `unauthorized`  |
| Request deadline or HTTP 408 | Throws `StreamAdminError` | `timeout`       |
| Caller cancellation          | Throws `StreamAdminError` | `aborted`       |
| Network, HTTP 429 or 5xx     | Throws `StreamAdminError` | `retryable`     |
| Other HTTP 4xx               | Throws `StreamAdminError` | `non-retryable` |

Administrative adapters perform one bounded attempt. The background runtime owns retry decisions;
missing segments are already-successful deletions and need no retry. Reading HEAD before DELETE is
optional, adds a request, and cannot prove a segment will still exist when deleted.

## Retention and trim limits

This API expires or deletes whole streams. Offset-based trim and server-side segment listing are
future protocol capabilities and have no NetScript API today. Keep a service-owned bounded segment
index when deletion needs discovery. For document streams, publish a complete baseline into each new
day segment before incremental changes so consumers can reconstruct retained state after an older
segment expires.

See
[Bounded streams: retention and trim](/reference/plugin-streams-core/#bounded-streams-retention-and-trim)
for the public contract and
[scheduled triggers](/durable-workflows/triggers/#scheduled-triggers-cron-without-a-daemon) for the background
scheduler.
