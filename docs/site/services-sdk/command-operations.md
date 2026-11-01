---
layout: layouts/base.vto
title: Operate commands and relay
description: Reconcile lost responses, inspect leases and prune settled outbox rows safely.
templateEngine: [vento, md]
order: 33
---

# Operate commands and relay

Operate the [command transaction](/services-sdk/commands/) and the [relay](/services-sdk/command-relay/)
as distinct boundaries. A command can commit while delivery is pending; a relay can record worker
acceptance while the job is still running. Inspect durable state before repeating an operation.
The [database reference](/reference/database/#command-persistence) describes shipped store and row
contracts; the framework does not expose a generic receipt/outbox inspection endpoint.

## Reconcile a lost response

Retry the **same command, key, actor, input and expected version** through the normal authenticated
boundary. If the first execution committed, the executor returns `replayed` with its original
value/correlation and performs no handler or side-record writes. If it rolled back, a later attempt
may apply. Do not substitute a new key, the current version or a newly privileged actor while
trying to determine what happened.

This compiled example makes the application-owned inspection seam explicit. It is an integration
function; it requires the same genuine definition and executor used by the service. Authorization
for both retry and inspection must run before calling it. `inspect` is not a NetScript export.

```ts
import type { CommandDefinition, CommandEnvelope, CommandExecutor } from '@netscript/service/commands';

type Input = { amount: number; failAfterWrite: boolean };
type Output = { value: string };
type Business = { compareAndIncrement(expectedVersion: string, amount: number): Promise<boolean> };
type DeliveryObservation = {
  outboxId: string;
  publication: 'pending' | 'leased' | 'published' | 'terminal';
  workerAcceptanceIdentity?: string;
  externalEffect: 'unknown' | 'confirmed';
};
// Application query backed by durable outbox/worker/receiver records, with access control.
interface InspectionPort {
  inspect(originalCorrelationId: string): Promise<readonly DeliveryObservation[]>;
}
async function reconcile(
  executor: CommandExecutor<Business>,
  command: CommandDefinition<'counter.increment', Input, Output, Business>,
  original: CommandEnvelope<Input>,
  inspection: InspectionPort,
) {
  const execution = await executor.execute(command, original);
  const deliveries = await inspection.inspect(execution.correlationId);
  return { execution, deliveries };
}
```

Use the command receipt/`executionId` to disambiguate individual outbox rows in your inspection
implementation; correlation alone is not necessarily unique. Treat an empty result as unproven
rather than delivered. Preserve each `outboxId` and any normalized acceptance identity for further
queries. A worker acceptance receipt is evidence of enqueue/trigger acceptance, not a remote
receiver receipt. For webhooks, reconcile the worker execution and DLQ with the receiver's durable
`(endpointId, deliveryId)` receipt. The
[outbound-webhooks runbook](/orchestration-runtime/how-to/outbound-webhooks/#retry-budget-outcome-and-dead-letters)
describes HTTP exhaustion and replay. Do not restart an external effect from a missing response
without checking its durable deduplication record.

## Read failures by boundary

The executor never automatically retries the handler. `CommandError.failure` is the bounded public
vocabulary; arbitrary application errors retain identity and are handled by your service policy.
A `retryable` flag permits a policy decision; it does not mean an unbounded or blind retry is safe.

| Failure kind | Recovery |
| --- | --- |
| `invalid_envelope` | Correct authentication/actor, correlation, key or W3C fields; do not retry unchanged. |
| `optimistic_conflict` | Read current domain state, resolve the conflict, then issue a new intentional request with its own key/version. |
| `idempotency_key_reuse` | Reject the changed request; preserve the original key-to-request relationship. |
| `in_progress` | Rollback completes before surfacing; honor `retryAfterMs` when present and retry the same request under a bounded policy. |
| `unsupported_capability` | Fix store binding, transaction model or isolation configuration before another attempt. |
| `codec_failure` | Correct the indicated fingerprint, response encode/decode or side-record codec; no silent coercion. |
| `receipt_corrupt` | Preserve evidence and repair/escalate storage compatibility; never delete the receipt to force execution. |
| `store_failure` | Inspect bounded `phase` and `retryable`; for a lost/uncertain commit response use same-key reconciliation. |
| `aborted` | Cancellation is cooperative; reconcile before another attempt because delivery/response loss can obscure completion. |

The database adapter uses `CommandStoreError` with database-owned redacted failures; the executor
translates known store failures into command failures. SQL/driver details remain in trusted causes.
Keep transport status mapping in the service adapter. For example, this compiled function exposes
only a bounded kind and an optional retry delay, while unexpected errors reach existing supervision:

```ts
import { CommandError } from '@netscript/service/commands';

function commandFailureResponse(error: unknown): Response {
  if (!(error instanceof CommandError)) throw error;
  const failure = error.failure;
  const conflict = failure.kind === 'optimistic_conflict' || failure.kind === 'idempotency_key_reuse';
  const invalid = failure.kind === 'invalid_envelope';
  const headers = new Headers({ 'content-type': 'application/json' });
  if (failure.kind === 'in_progress' && failure.retryAfterMs !== undefined) {
    headers.set('retry-after', String(Math.ceil(failure.retryAfterMs / 1000)));
  }
  return new Response(JSON.stringify({ kind: failure.kind }), {
    status: conflict ? 409 : invalid ? 400 : failure.retryable ? 503 : 500,
    headers,
  });
}
```

These statuses are application policy, not an automatic NetScript mapping. Do not serialize the
original error, request, stack, cause or stored response. See [Security](/services-sdk/command-security/).

## Recover relay leases and terminal rows

| Observation | Action |
| --- | --- |
| Pending and due | Let the existing scheduler call `drainOnce`; verify destination/topic registration. |
| Leased by a live claim | Leave ownership intact; monitor the publisher deadline and shutdown behavior. |
| Lease expired | The shipped store can reclaim it; stable IDs and sink dedupe protect crash redelivery. |
| Published with acceptance | Follow the acceptance identity into worker state; do not declare external success from this alone. |
| Terminal | Inspect the finite failure class, repair configuration or downstream state, and use an authorized application recovery policy. No generic relay reset API is shipped. |
| `markPublished` error | Treat settlement as uncertain; preserve the lease and allow expiry/reconciliation. Do not manually release it. |

Relay failure classes are `rejected`, `rate_limited`, `unavailable`, `timeout`, `invalid_response` and
`misconfigured`. Do not store free-form exception text as classification. A zero `drainOnce` result
can mean no due work, stopped/aborted work, failures or lost settlement ownership; it is not a health
verdict. Report scheduler errors and outbox age/backlog from consumer-owned queries. Optional
[command telemetry](/reference/telemetry/#command-telemetry) uses finite definition/outcome/count
attributes and excludes raw IDs and payloads.

## Prune only settled, unleased rows

The shipped PostgreSQL relay store also implements `CommandOutboxRetentionStore.pruneSettled`.
Use a bounded existing maintenance job, persist its cursor and begin the next sweep without a
cursor when `nextAfterId` is absent. This compiled helper performs one page, not a new polling loop:

```ts
import {
  COMMAND_RETENTION_DEFAULT_DAYS,
  COMMAND_RETENTION_MAX_PAGE_SIZE,
  type CommandOutboxRetentionStore,
} from '@netscript/database/commands/postgres';

async function retentionPage(store: CommandOutboxRetentionStore, afterId?: string) {
  const result = await store.pruneSettled({
    now: new Date(),
    limit: COMMAND_RETENTION_MAX_PAGE_SIZE,
    completedRetentionDays: COMMAND_RETENTION_DEFAULT_DAYS,
    ...(afterId === undefined ? {} : { afterId }),
  });
  // Persist nextAfterId, scanned and deleted in your maintenance checkpoint.
  return result;
}
```

The default is seven days and the maximum page size is 100 **examined** rows, including retained
pending rows. Only published or terminal rows strictly older than the cutoff and with both lease
fields empty qualify. All leases, even expired ones, protect rows from pruning; predicates are
rechecked during deletion. This operation does not prune command receipts or audit rows. Choose a
retention window consistent with sink dedupe and authorized operator replay. Do not prune evidence
still needed for reconciliation. Saga atomic replay keys have a separate composed retention seam;
see [bounded outbox retention](/reference/database/#bounded-outbox-retention).
