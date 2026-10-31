---
layout: layouts/base.vto
title: Relay committed command intents
description: Compose the shipped outbox relay with PostgreSQL and checked worker acceptance.
templateEngine: [vento, md]
order: 32
---

# Relay committed command intents

The command outbox records delivery intent in the business transaction. The relay later claims due
rows, decodes them, publishes to a registered sink and marks them published under the live claim
token. It uses `@netscript/service/commands/relay`; the shipped PostgreSQL store comes from
`@netscript/database/commands/postgres`. Neither import nor construction starts a timer, connection,
queue or background loop.

Start with the [command guide](/services-sdk/commands/). Use the
[service relay reference](/reference/service/#command-outbox-relay) for symbols and
[operations](/services-sdk/command-operations/) for recovery and retention.

## Compose one relay in your existing backend

This Tier-1 compiled composition example requires your migrated database bridge, existing worker
client and schema-backed job definition. The declared values are integration inputs, not runnable
stand-ins. The checked worker sink validates target kind/id, run identity and acceptance timestamp
before returning normalized acceptance to the relay.

```ts
import { createCommandOutboxRelay } from '@netscript/service/commands/relay';
import type { TransactionClientPort } from '@netscript/database/commands';
import { createPostgresCommandOutboxRelayStore, type PostgresCommandClient } from '@netscript/database/commands/postgres';
import { createWorkerCommandOutboxSink, type WorkerCommandClientPort } from '@netscript/plugin-workers-core/integration/commands';
import type { JobId } from '@netscript/plugin-workers-core';

declare const database: TransactionClientPort<PostgresCommandClient>;
declare const workers: WorkerCommandClientPort;
declare const deliveryJobId: JobId;

const DESTINATION = 'workers';
const TOPIC = 'counter.changed';
const RETRY_DELAY_MS = 1000;
const store = createPostgresCommandOutboxRelayStore(database, { transactionTimeoutMs: 5000 });
const sink = createWorkerCommandOutboxSink({
  id: DESTINATION,
  workers,
  targets: new Map([[TOPIC, { kind: 'job', id: deliveryJobId }]]),
});
const relay = createCommandOutboxRelay({
  store,
  sinks: new Map([[DESTINATION, sink]]),
  clock: { now: () => new Date() },
  ids: { next: () => crypto.randomUUID() },
  batchSize: 8,
  concurrency: 2,
  leaseMs: 30000,
  maxAttempts: 5,
  maxRetryDelayMs: RETRY_DELAY_MS,
  retryAt: (_attempt, now) => new Date(now.getTime() + RETRY_DELAY_MS),
  classify: () => 'unavailable',
});

// Register these callbacks with your existing scheduler and shutdown lifecycle.
async function scheduledDrain(signal: AbortSignal): Promise<number> {
  return await relay.drainOnce(signal);
}
async function shutdown(): Promise<void> {
  await relay.stop();
}
```

The example's classifier conservatively treats unknown publisher failures as `unavailable`. The
checked sink's `CommandRelayError` preserves its finite classification without calling that
fallback. Adapt classification and backoff to your documented transport contract; never persist
raw exception messages. Register the callbacks with the backend that already owns scheduling.
`defineService` does not automatically schedule a relay. Use one composed relay rather than adding
a second outbox polling loop in a worker or browser.

`destination` selects a sink by its `id`; `topic` selects the registered branded job/task target
inside a checked workers sink. Map `counter.changed` to a job whose schema accepts `{ value: string }`
from the command example. A consumer-provided `WorkerCommandClientPort` must implement the existing
explicit worker acceptance protocol; a bare queue acknowledgement or HTTP status is insufficient.
See [Checked command sink](/reference/plugin-workers-core/#checked-command-sink).

## Follow the three boundaries

| Boundary | What is durable | What remains unproven |
| --- | --- | --- |
| Command returns `applied` or `replayed` | Business mutation, receipt (when keyed), audit and outbox intent | Sink acceptance and external effect |
| Checked worker sink accepts | Worker identity and acceptance time, according to its documented durable boundary | Job success and remote receiver effect |
| Relay settlement succeeds | Published marker and normalized acceptance in the same live-token write | Receiver effect; job may still fail |

Publication precedes settlement. A crash after worker acceptance but before outbox settlement can
publish again after lease expiry. Keep the same outbox `id`, `dedupeKey` and correlation on redelivery.
The worker acceptance key is `dedupeKey`; it need not equal the outbox row ID. A generic sink may
return `void` for its documented boundary, but that carries no checked acceptance metadata. Do not
use that to bypass the workers acceptance protocol.

`drainOnce` returns the number of rows successfully settled published, not the number claimed or
the number of completed jobs. Overlapping calls queue and share the relay's concurrency bound.
`stop` prevents new work, signals publishers and awaits every queued/active drain, including a
publisher that ignores cancellation. Await it during shutdown; supply bounded publisher deadlines.

## Bound retries and retain failures

A drain claims at most `batchSize` rows. A failed delivery is released with a finite failure class
and a future `retryAt` while its attempt count is below `maxAttempts`. Otherwise it becomes terminal.
All classes use this attempt policy; the names `rejected` and `misconfigured` do not create a
separate automatic no-retry rule. Backoff must be strictly later than now and within
`maxRetryDelayMs`; an invalid classifier or backoff becomes `misconfigured`.

Expired ownership cannot settle a row. If publication settlement throws, the error reaches the
scheduler and the row remains leased for expiry/recovery: never issue a speculative release after
an uncertain commit. Claim and release errors also surface. Handle those in existing supervision,
keep alerts finite, and reconcile with [durable receipts](/services-sdk/command-operations/#reconcile-a-lost-response).

## Deliver outbound webhooks

The [outbound-webhooks recipe](/orchestration-runtime/how-to/outbound-webhooks/#source-deliveries-from-committed-command-outbox-rows)
wraps a checked worker sink to preserve the command outbox ID as `deliveryId`, select an authorized
endpoint, sign the persisted body and retain exhausted HTTP attempts in a DLQ. Use that adapter
when choosing a webhook-delivery job; the counter job mapping above is a separate payload schema.

A published outbox row records worker acceptance, not remote HTTP delivery. Webhook delivery is
**at-least-once**; receivers must atomically deduplicate the stable delivery identity with their
domain effect. [Inbound webhook verification]({{ 'tut:ingest-webhook' |> xref }}) handles requests
arriving at a service. It neither drains this outbox nor proves outbound delivery. See
[command security](/services-sdk/command-security/) for trusted actor and endpoint boundaries.
