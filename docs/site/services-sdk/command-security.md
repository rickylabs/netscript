---
layout: layouts/base.vto
title: Command and relay security
description: Authenticate command origin and protect durable replay, audit and delivery boundaries.
templateEngine: [vento, md]
order: 34
---

# Command and relay security

Authenticate and authorize before calling the [command executor](/services-sdk/commands/), including
on replay. `CommandActor` records a narrow durable origin (`principal` or `system`, subject and an
optional principal scheme); it is not a credential, roles list or authorization decision. Derive it
from trusted service authentication, not request JSON. Keep tenant/resource authorization aligned
with the command's semantic scope and business transaction.

## Normalize transport metadata once

The command envelope is explicit. The executor does not automatically read HTTP headers, oRPC
context or outbound webhook headers. Your adapter must validate input, normalize expected version
to a bounded string token, validate W3C context and supply the authoritative idempotency key.

If you accept both an authenticated HTTP `Idempotency-Key` and an envelope `idempotencyKey`, reject
a conflict before execution. This compiled adapter handles that equality check; authentication and
contract parsing must precede it:

```ts
import type { CommandActor, CommandEnvelope } from '@netscript/service/commands';

function envelopeFromVerifiedRequest<T>(
  input: T,
  actor: CommandActor,
  headers: Headers,
  envelopeKey: string | undefined,
  expectedVersion: string,
): CommandEnvelope<T> {
  const key = headers.get('idempotency-key');
  if (key === null || (envelopeKey !== undefined && envelopeKey !== key)) {
    throw new TypeError('Missing or conflicting idempotency key');
  }
  return { input, actor, idempotencyKey: key, expectedVersion, correlationId: crypto.randomUUID() };
}
```

This adapter deliberately supplies no trace context. If carrying W3C fields, validate them with
`commandTraceContext` and retain only supported fields. Executor validation also checks key/header
bounds. Do not use a request key or actor subject as a metric label. An idempotency key is not an
authorization token, and its digest does not hide sensitive domain values stored elsewhere.

## Minimize durable data

The executor stores a key digest rather than the raw key. A receipt still contains a decoded/replayable
response, actor identity and original correlation, while audit and outbox rows carry application
records. Redact audit data before `ctx.audit`, minimize outbox payloads before `ctx.publish`, and
apply storage access control, encryption and retention suited to those values. Avoid secrets,
credentials, bearer tokens, full claims, arbitrary headers and private error messages in all three.

Use `jsonCodec` with a synchronous identity-preserving schema. Its canonical JSON limits default to
depth 64, 10,000 aggregate items and 1 MiB; options may only tighten them. The executor separately
limits audit and outbox buffers to 64 rows each and a shared 64 KiB canonical side-row budget,
including metadata. A safe input size does not imply a safe combined record size. Limit transport
body size before allocation, and validate business input with the service contract as well.

`CommandError.toJSON()` and database `CommandStoreError` serialization expose finite failure fields.
Their trusted causes can contain driver/SQL detail. Keep those in controlled diagnostic channels;
never return stacks/causes or attach exception text to telemetry. See the
[operations error policy](/services-sdk/command-operations/#read-failures-by-boundary).

## Keep the delivery boundary trusted

Select destination/topic from trusted command definitions. The relay snapshots registered sinks;
never construct a sink URL or signing secret from untrusted producer payload. The
[outbound-webhooks recipe](/orchestration-runtime/how-to/outbound-webhooks/)
requires service-owned active endpoints, HTTPS, no redirects/URL credentials, signed raw bodies and
receiver receipts atomically committed with their effects. Resolve signing secrets in worker
configuration, not the outbox or DLQ.

The outbound `Webhook-Id` authenticates the stable command outbox ID. Its HTTP `Idempotency-Key`
matches that ID. The relay's worker acceptance `dedupeKey` is a separate identity and can differ.
Keep those roles explicit when building adapters. Outbound receipt verification does not authorize
an arbitrary command actor or replace resource authorization at the receiving service.

[Inbound webhook verification]({{ 'tut:ingest-webhook' |> xref }}) authenticates events arriving at a
service; it is a separate direction and trust boundary. Do not treat an inbound trigger firing as
proof that an outbound delivery committed.

Only authorized operators should inspect/replay terminal outbox rows or DLQ records. Preserve stable
IDs and raw signed body identity across retries, select current secrets for fresh signatures, and
retain deduplication receipts for the full supported replay window. Follow
[operations](/services-sdk/command-operations/) and [compatibility](/services-sdk/command-compatibility/)
before changing persistent formats or retention.
