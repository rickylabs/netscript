---
layout: layouts/base.vto
title: Deliver a result from a worker
description: Run a queued job and publish its typed result to a durable stream.
templateEngine: [vento, md]
nav_hide: true
---

# Deliver a result from a worker

A queued job can publish application state directly to a durable stream. This lesson takes a
small delivery payload, processes it in a worker, and publishes the result for HTTP/SSE consumers.
The worker owns the queued execution; a page does not have to stay open for it to finish.

For interactive model turns, use the current [AI Chat track](/tutorials/chat/). That track persists
a transcript from a session route. Persisting its output does not turn the route itself into a
background job. This lesson covers a separate worker-owned operation, not a resumable model call.

## Step 1 — Install and register the job

Start with a workspace from the [quickstart](/quickstart/), with the database initialized and Aspire
running. Install workers and streams, then scaffold the job so its metadata and registry entry exist:

```sh
netscript plugin install worker --name workers
netscript plugin install stream --name streams
deno install -gArf -n ns-workers jsr:@netscript/plugin-workers{{ releaseSpecifier }}/cli
ns-workers add job deliver-result
```

`ns-workers` is the installed name of the workers plugin CLI. Author application jobs in
`workers/jobs/`; keep the generated leading metadata comment and its `deliver-result` id. The implementation of
the installed plugin belongs under `plugins/workers/`.

## Step 2 — Validate, work, then confirm delivery

Keep the leading metadata comment and replace the handler below it with this module. The factory is called inside the handler,
so module discovery does not try to connect to streams. Calls reuse one compatible producer per
stream path in this process.

```ts
// workers/jobs/deliver-result.ts
import { createSuccessResult, defineJobHandler } from '@netscript/plugin-workers-core';
import { createServiceStreamProducer, defineStreamSchema } from '@netscript/plugin-streams-core';
import { z } from 'zod';

const DELIVERY_JOB_ID = 'deliver-result';
const DELIVERY_STREAM_PATH = '/deliveries/results';
const DELIVERY_PRODUCER_ID = 'delivery-worker';

const payloadSchema = z.object({
  requestId: z.string().min(1),
  text: z.string().min(1),
});
const resultSchema = defineStreamSchema({
  delivery: {
    schema: z.object({ id: z.string(), text: z.string(), status: z.literal('delivered') }),
    type: 'delivery',
    primaryKey: 'id',
  },
});

const handler = defineJobHandler(payloadSchema, async ({ payload, signal }) => {
  signal.throwIfAborted();
  // Replace this transformation with your application's abort-aware work.
  const text = payload.text.trim();
  const producer = createServiceStreamProducer({
    streamPath: DELIVERY_STREAM_PATH,
    schema: resultSchema,
    producerId: DELIVERY_PRODUCER_ID,
  });
  await producer.waitUntilReady({ signal });
  signal.throwIfAborted();

  const receipt = producer.upsert('delivery', {
    id: payload.requestId,
    text,
    status: 'delivered',
  }, { correlationId: payload.requestId, messageId: payload.requestId });
  const outcome = await receipt.completion;
  if (outcome.status !== 'delivered') {
    throw new Error(`Stream delivery ended with ${outcome.status}`);
  }
  signal.throwIfAborted();
  return createSuccessResult({ requestId: payload.requestId, streamPath: DELIVERY_STREAM_PATH });
});

export default Object.assign(handler, { id: DELIVERY_JOB_ID });
```

`receipt.accepted` means the write entered a bounded local buffer. Its completion also reports a
rejected enqueue, so awaiting completion and checking `delivered` covers both acceptance and
acknowledgement. Returning success before that check would only prove the job queued a local write.
There is no automatic transaction between stream delivery and recording worker success.

This example assumes one producer process owns `delivery-worker`. When scaling to several worker
processes, give each a stable, distinct producer id. A retried job is a new write even with the same
`messageId`; that field carries correlation, not worker deduplication. The stable `requestId` entity
key makes replay materialize the latest result instead of a second row. External effects, such as a
payment, still require the owning service's own idempotency key.

## Step 3 — Enqueue and observe

Refresh generated registries and let Aspire reload the background process:

```sh
netscript generate plugins
ns-workers show-job deliver-result --json
ns-workers trigger deliver-result --payload='{"requestId":"request-1","text":"Ready to deliver"}'
ns-workers executions --limit=10 --json
```

The execution's success result contains `/deliveries/results`. Use that path with the discovered
streams URL and your application's stream auth/proxy to read the log. A State Protocol consumer
reducing by the `delivery` collection's `id` should show one `request-1` row. Follow
[the streams consumer example](/durable-workflows/streams/#minimal-example-produce-then-consume) for named SSE data/control
events; use a server-side proxy when browser clients cannot attach the required credentials.

## Step 4 — Own producer shutdown in the process

The producer is shared across handlers. Do not pass one job's signal as the producer's lifetime
signal, call `stop()` after every job, or call `close()` after each result: another handler may still
be writing, and `close()` sends durable EOF.

The host that owns the producer must stop accepting jobs, drain handlers, then flush and stop its
producers before exiting. `stop()` releases local work without EOF; only use `close()` when the
stream itself is finished. A forced exit can lose buffered writes, and an interrupted attempted
append can have unknown delivery. The handler above awaits its own receipt instead of depending on
asynchronous process-exit hooks. See [producer recovery](/durable-workflows/streams/#producer-recovery-and-write-outcomes)
for the finite retry/buffer bounds, and size the job timeout to include that retry budget.

A stream is a projection of completed work, not its only durable record. Choose a persistent
[streams storage mode](/durable-workflows/streams/#storage-mode-and-restart-operations) when results
must survive a streams-service restart, and apply [retention](/durable-workflows/how-to/bound-stream-retention/)
when the log needs a hard lifetime bound.
