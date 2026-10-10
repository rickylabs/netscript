---
layout: layouts/base.vto
title: Deliver outbound webhooks
templateEngine: [vento, md]
order: 112
---

# Deliver outbound webhooks

**Goal:** deliver signed outbox events with retries and a DLQ.

Use the existing workers plugin for authenticated delivery, bounded retries, and durable
terminal-failure records. This recipe creates no new package, plugin, or runtime primitive.

Delivery is **at-least-once, never exactly-once**. A receiver can commit the effect and lose its
HTTP response, or a worker can crash after sending and before recording completion. Both permit
duplicates. The attempt budget bounds one handler execution, not all crash redeliveries. Successful
receipt is not an SLA: after exhaustion the delivery remains in the DLQ for an operator to inspect
or reprocess.

[Inbound `defineWebhook`]({{ 'tut:ingest-webhook' |> xref }}) is the **opposite direction**: it
verifies events arriving at your service. This recipe sends events from your background worker.

## Generate the delivery job

Install the workers plugin using [Add a plugin]({{ 'howto:add-a-plugin' |> xref }}), then run its
plugin CLI from your workspace root:

```sh
deno x -A jsr:@netscript/plugin-workers{{ releaseSpecifier }}/cli add job deliver-webhook --template=webhook-delivery
```

The command emits `workers/jobs/deliver-webhook.ts` and regenerates the static worker registry. It
contains a schema-backed handler, a `defineJob` definition, and a configuration-injected
`createDeliveryHandler` factory. Register the exported `deliveryJob` with **maxRetries 0** (the
builder uses `.retry(0)`); keep that value in your workers configuration as well. The handler owns
HTTP retries. Crash recovery belongs to the queue/runtime; this recipe does not guarantee replay
after cancellation. Do not multiply this budget with runtime job retries.

Inject these values into the **worker service**, under a service identity:

| Service setting          | Purpose                                                                  |
| ------------------------ | ------------------------------------------------------------------------ |
| `WEBHOOK_ENDPOINT_ID`    | Consumer-owned endpoint registry key.                                    |
| `WEBHOOK_ENDPOINT_URL`   | Active HTTPS endpoint, supplied by deployment configuration.             |
| `WEBHOOK_SIGNING_SECRET` | Secret resolved by service configuration; never put it in a job payload. |
| `WEBHOOK_DLQ_PATH`       | Persistent Deno KV database path, shared across worker restarts.         |
| `WEBHOOK_MAX_ATTEMPTS`   | Total HTTP attempts per execution, default 5, integer from 1 to 100.     |

The generated default handler opens that configured KV database and closes its connection in
`finally`. It uses the existing `KvDeadLetterStore`, implementing `DeadLetterStorePort`. Mount
persistent storage; an ephemeral worker filesystem cannot preserve failures. For a remote queue
backend, replace this composition with an existing durable queue store suited to your deployment.
See [Queue reference](/reference/queue/).

For multiple endpoints, own registry rows with `id`, `url`, `secretReference`, and `active`. Resolve
secret references using your service's configuration provider, then inject a snapshot map and your
existing DLQ store through `createDeliveryHandler`. Reject missing/inactive endpoints; never accept
a URL or signing secret from an untrusted producer payload. The default entrypoint illustrates one
active configured endpoint. Subscription CRUD, secret storage, URL authorization and endpoint
lifecycle remain consumer-owned. The template requires HTTPS and refuses redirects and URL
credentials.

## Source deliveries from committed command outbox rows

The command outbox relay is available now through `@netscript/service/commands/relay` and the
checked worker sink through `@netscript/plugin-workers-core/integration/commands`. Use the existing
service transaction and relay, rather than sending HTTP during a request or starting a second
polling loop.

At the relay boundary, **deliveryId = `CommandOutboxDelivery.id`**, the stable command-outbox ID.
Persist the raw JSON body once, reuse it across attempts, and keep `enqueuedAt` from the durable
producer record. Do not substitute the worker run ID or generate a fresh UUID on redelivery. The
relay's `dedupeKey` is the worker command acceptance key; it may differ from the outbox row ID.

This adapter wraps the checked worker sink to pass the outbox ID in the selected job's payload while
preserving the existing worker acceptance protocol. `checkedWorkerSink` must already target the
schema-backed delivery job; `resolveEndpointId` selects a consumer-owned active endpoint and
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
at-most-once**: the service can commit then crash before enqueueing. The worker may retry an
accepted job, but cannot recover an announcement it never received. The phone and web application
only issue commands; delivery never depends on an open application or an owner session.

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

Persist a unique `(endpointId, deliveryId)` receipt **atomically with the receiver's domain
effect**. On a duplicate return a successful 2xx response without repeating the effect. A read
followed by a separate write is racy; use a unique constraint/transaction or an atomic
compare-and-set. Keep dedup records at least as long as the producer's retry and operator replay
retention. Checking signatures alone does not prevent authenticated retries from repeating effects.

## Retry budget, outcome and dead letters

The generated policy defaults to 5 total attempts, a 1-second base, a 30-second cap and a 10-second
per-attempt timeout. After failure number `n`, full jitter selects a delay in
`[0, min(30000, 1000 * 2^(n - 1)))`. Every non-2xx response and network failure consumes an attempt;
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
in the record. Protect DLQ access because the original event payload can contain private data.

Use the existing store's `list`, `depth` and `reprocess` methods to inspect and replay failures.
Replays keep the original delivery ID and body; resolve the current service secret and generate a
fresh signature timestamp. Operators own replay authorization and retention.

## Non-goals and verification

This recipe is not a delivery SLA, subscription management API, receiver-side framework, new plugin,
or an exactly-once primitive. It changes no inbound trigger behavior. Runtime retry/DLQ ownership
could be reconsidered when workers expose attempts and a terminal-store seam; this recipe uses the
current handler context and existing queue vocabulary.

The generated-worker tests prove raw-body signatures, capped jitter, the attempt cap, durable-store
routing, cancellation, deadlines, and rejection of a hardcoded endpoint. The page's TypeScript
fences are extracted and checked against package export entrypoints. Full scaffold runtime E2E and a
later consumer observation are separate release evidence; local template execution does not
establish them.
