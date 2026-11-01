---
layout: layouts/base.vto
title: Deliver outbound webhooks
description: Send signed events from a worker with bounded retries and a dead-letter queue.
templateEngine: [vento, md]
order: 109
---

# Deliver outbound webhooks

This recipe sends signed outbox events from a background worker, with bounded retries and a
dead-letter queue (DLQ). It uses the existing workers plugin for authenticated delivery, bounded
retries and durable records of terminal failures, and adds no new package, plugin or runtime
primitive. [Inbound `defineWebhook`]({{ 'tut:ingest-webhook' |> xref }}) is the opposite direction:
it verifies events arriving at your service.

{{ comp callout { type: "important", title: "At-least-once delivery" } }}
Delivery is <strong>at-least-once, never exactly-once</strong>. A receiver can commit the effect and lose its HTTP response, or a worker can crash after sending and before recording completion; both allow duplicates. The attempt budget bounds one handler execution, not every crash redelivery. Successful receipt is not an SLA: after exhaustion, the delivery stays in the DLQ for an operator to inspect or reprocess.
{{ /comp }}

## Generate the delivery job

1. Install the workers plugin with [Add a plugin]({{ 'howto:add-a-plugin' |> xref }}).
2. From your workspace root, run the workers plugin CLI:

   ```sh
   deno x -A jsr:@netscript/plugin-workers{{ releaseSpecifier }}/cli add job deliver-webhook --template=webhook-delivery
   ```

   The command emits `workers/jobs/deliver-webhook.ts` and regenerates the static worker registry.
   The file contains a schema-backed handler, a `defineJob` definition and a
   configuration-injected `createDeliveryHandler` factory.
3. Register the exported `deliveryJob` with **maxRetries 0** (the builder uses `.retry(0)`), and
   keep that value in your workers configuration. The handler owns HTTP retries and crash recovery
   belongs to the queue and runtime, so don't multiply this budget with runtime job retries. This
   recipe doesn't guarantee replay after cancellation.

Inject these values into the **worker service**, under a service identity:

| Service setting          | Purpose                                                                  |
| ------------------------ | ------------------------------------------------------------------------ |
| `WEBHOOK_ENDPOINT_ID`    | Consumer-owned endpoint registry key.                                    |
| `WEBHOOK_ENDPOINT_URL`   | Active HTTPS endpoint, supplied by deployment configuration.             |
| `WEBHOOK_SIGNING_SECRET` | Secret resolved by service configuration; never put it in a job payload. |
| `WEBHOOK_DLQ_PATH`       | Persistent Deno KV database path, shared across worker restarts.         |
| `WEBHOOK_MAX_ATTEMPTS`   | Total HTTP attempts per execution, default 5, integer from 1 to 100.     |

The generated default handler opens that configured KV database and closes its connection in
`finally`. It uses the existing `KvDeadLetterStore`, which implements `DeadLetterStorePort`. Mount
persistent storage: an ephemeral worker filesystem can't preserve failures. For a remote queue
backend, replace this composition with an existing durable queue store suited to your deployment;
see the [Queue reference](/reference/queue/).

The default entrypoint shows one active configured endpoint. For multiple endpoints, own registry
rows with `id`, `url`, `secretReference` and `active`. Resolve secret references with your
service's configuration provider, then inject a snapshot map and your existing DLQ store through
`createDeliveryHandler`. Subscription CRUD, secret storage, URL authorization and endpoint lifecycle
stay with you. The template requires HTTPS and refuses redirects and URL credentials.

{{ comp callout { type: "caution", title: "Endpoints and secrets come from your configuration" } }}
Reject missing or inactive endpoints, and never accept a URL or signing secret from an untrusted producer payload.
{{ /comp }}

## Source deliveries from committed command outbox rows

Start with [Transactional commands](/services-sdk/commands/) for the same-commit producer and
[Relay committed command intents](/services-sdk/command-relay/) for the shipped PostgreSQL/worker
composition. Use [Command operations](/services-sdk/command-operations/) to reconcile local commit,
worker acceptance and the receiver effect as separate boundaries.

The command outbox relay comes from `@netscript/service/commands/relay` and the checked worker sink
from `@netscript/plugin-workers-core/integration/commands`. Use the existing service transaction
and relay instead of sending HTTP during a request or starting a second polling loop.

At the relay boundary, **deliveryId = `CommandOutboxDelivery.id`**, the stable command-outbox ID.
Persist the raw JSON body once, reuse it across attempts, and keep `enqueuedAt` from the durable
producer record. Do not substitute the worker run ID or generate a fresh UUID on redelivery. The
relay's `dedupeKey` is the worker command acceptance key; it may differ from the outbox row ID.

This adapter wraps the checked worker sink to pass the outbox ID in the selected job's payload and
keeps the existing worker acceptance protocol. `checkedWorkerSink` must already target the
schema-backed delivery job, `resolveEndpointId` selects a consumer-owned active endpoint, and
`readEnqueuedAt` reads its durable creation timestamp.

```ts
import type { CommandOutboxDelivery, CommandOutboxSink } from '@netscript/service/commands/relay';

declare const checkedWorkerSink: CommandOutboxSink;
declare const resolveEndpointId: (message: CommandOutboxDelivery) => string;
declare const readEnqueuedAt: (id: string) => string;

const outboundSink: CommandOutboxSink = {
  id: checkedWorkerSink.id,
  publish(message, signal) {
    return checkedWorkerSink.publish({
      ...message,
      payload: {
        deliveryId: message.id,
        endpointId: resolveEndpointId(message),
        enqueuedAt: readEnqueuedAt(message.id),
        body: JSON.stringify(message.payload),
      },
    }, signal);
  },
};
```

Register `outboundSink` in the existing relay's sink map. Run `drainOnce` from existing backend
scheduling and await `stop` during shutdown. The checked sink settles publication only after durable
worker acceptance, not after the remote HTTP effect. The relay may publish again after a crash;
receiver deduplication is still required. See
[Command outbox relay](/reference/service/#command-outbox-relay) and
[Checked worker command sink](/reference/plugin-workers-core/#checked-command-sink).

If you enqueue directly in a request without the transactional outbox, the **announcement is
at-most-once**: the service can commit, then crash before enqueueing. The worker may retry an
accepted job, but can't recover an announcement it never received. Client applications only issue
commands; delivery never depends on an open application or a user session.

## Signing and receiver deduplication

Each request is a POST of the persisted raw UTF-8 JSON body. Headers are:

| Header              | Meaning                                                                                |
| ------------------- | -------------------------------------------------------------------------------------- |
| `Webhook-Id`        | Stable command-outbox ID; authenticated receiver delivery identity.                    |
| `Webhook-Timestamp` | Unix seconds refreshed for each attempt.                                               |
| `Webhook-Signature` | `v1=` followed by hex HMAC-SHA256 over `timestamp + '.' + deliveryId + '.' + rawBody`. |
| `Idempotency-Key`   | Same delivery ID for receivers using this conventional HTTP carrier.                   |

Verify the **raw body before parsing**. Limit the request body to 64 KiB before reading it; the
sender also enforces 64 KiB. Check timestamp skew (five minutes here), a single signature version,
and equal `Webhook-Id` / `Idempotency-Key` values. `crypto.subtle.verify` performs cryptographic
verification without a timing-sensitive string comparison. The delivery ID is included in the
authenticated input, so an attacker cannot relabel a signed delivery to bypass deduplication.

```ts
async function verifyDelivery(
  rawBody: string,
  headers: Headers,
  secret: string,
  nowSeconds: number,
): Promise<string> {
  const id = headers.get('webhook-id');
  const timestamp = headers.get('webhook-timestamp') ?? '';
  const signature = headers.get('webhook-signature') ?? '';
  if (
    !id || id.length > 256 || headers.get('idempotency-key') !== id ||
    !/^\d{1,12}$/.test(timestamp) || Math.abs(nowSeconds - Number(timestamp)) > 300 ||
    !/^v1=[0-9a-f]{64}$/.test(signature) || new TextEncoder().encode(rawBody).length > 65536
  ) {
    throw new Error('Invalid webhook headers or timestamp');
  }
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const bytes = Uint8Array.from(signature.slice(3).match(/../g)!, (hex) => parseInt(hex, 16));
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    bytes,
    new TextEncoder().encode(timestamp + '.' + id + '.' + rawBody),
  );
  if (!valid) throw new Error('Invalid webhook signature');
  return id;
}
```

The **authenticated HTTP `Idempotency-Key` is authoritative** for this recipe's receiver. If the
body also carries a command-envelope `idempotencyKey`, require equality and reject a conflict before
invoking a command handler; never silently prefer the unsigned envelope value. The receiving service
adapter must explicitly supply this verified key to its command boundary. Do not assume NetScript
automatically reads these outbound headers as command metadata.

{{ comp callout { type: "warning", title: "Signatures don't stop duplicate effects" } }}
Checking signatures alone doesn't prevent authenticated retries from repeating effects. Persist a unique <code>(endpointId, deliveryId)</code> receipt <strong>atomically with the receiver's domain effect</strong>, and on a duplicate return a successful 2xx response without repeating the effect.
{{ /comp }}

A read followed by a separate write is racy; use a unique constraint or transaction, or an atomic
compare-and-set. Keep deduplication records at least as long as the producer's retry and operator
replay retention.

## Retry budget, outcome and dead letters

The generated retry policy defaults:

| Setting | Default |
| --- | --- |
| Total attempts | 5 |
| Base delay | 1 second |
| Delay cap | 30 seconds |
| Per-attempt timeout | 10 seconds |

After failure number `n`, full jitter selects a delay in `[0, min(30000, 1000 * 2^(n - 1)))`. Every non-2xx response and network failure consumes an attempt;
there is no sleep after the last failure. Response bodies are canceled without being read. Attempt
count and HTTP outcome are reported through the existing job progress callback; completion returns
`delivered` or `dead_lettered` with the delivery ID and count.

The loop propagates `ctx.signal` to fetch and waits. Each fetch timeout is capped by
`ctx.deadlineAt`; it refuses a retry that cannot fit the remaining job budget. When the handler
observes an exhausted deadline or cannot fit the next retry delay, it awaits a DLQ append with
`errorCode: 'job_deadline_exceeded'`. An aborted `ctx.signal`, including a runtime timeout abort,
still propagates without dead-lettering; cancellation recovery depends on the runtime and is not
proven by this recipe. Configure the overall job timeout for the intended budget (five attempts need
up to 50 seconds of HTTP time plus capped jitter).

After the configured maximum attempts or handler-observed deadline exhaustion, the handler
**awaits** `deadLetters.append` with the existing `DeadLetterRecord`: `messageId` is the outbox ID,
`deliveryCount` is the attempt count, the original payload is retained, and `reason` is
`max_attempts_exceeded`. Only a successful append completes the job. A store failure propagates; it
never acknowledges a silently dropped delivery. The delivery ID stays stable; the existing KV store
keys terminal records by namespace, failure time and message ID, so separate exhausted executions
can retain separate failure records. No signing secret or arbitrary receiver response text is stored
in the record.

{{ comp callout { type: "caution", title: "Protect DLQ access" } }}
Dead-letter records keep the original event payload, which can contain private data.
{{ /comp }}

Use the existing store's `list`, `depth` and `reprocess` methods to inspect and replay failures.
Replays keep the original delivery ID and body; resolve the current service secret and generate a
fresh signature timestamp. Operators own replay authorization and retention.

## Non-goals

This recipe is not a delivery SLA, a subscription management API, a receiver-side framework, a new
plugin or an exactly-once primitive. It changes no inbound trigger behavior.

## Next steps

To handle the opposite direction, verify inbound events in the
[webhook ingestion tutorial]({{ 'tut:ingest-webhook' |> xref }}).
