# @netscript/plugin-triggers-core

Core trigger authoring, runtime-port, telemetry, contract, config, and testing primitives for the
NetScript triggers plugin family.

This package is framework-layer code.

It owns stable trigger vocabulary and composition boundaries.

It does not own HTTP service wiring, CLI commands, scaffold generation, Aspire resources, or
production process supervision.

Those concerns live in `@netscript/plugin-triggers`.

## What This Package Owns

- Handler-first trigger DSL functions.
- Branded trigger, event, and webhook identifiers.
- Unified trigger event envelopes.
- Trigger definition types for all six known trigger kinds.
- Reserved queue, stream, and manual trigger branches.
- Retry, concurrency, circuit breaker, deduplication, and backfill specs.
- Runtime ports for ingress, processing, scheduling, idempotency, DLQ, event storage, file watching,
  and clocks.
- HMAC and memory webhook verifier adapters.
- The T1 trigger processor.
- The ack-then-process ingress composition root.
- Trigger telemetry names, attributes, meters, and structural tracer boundaries.
- Trigger config schemas for `netscript.config.ts`.
- The oRPC v1 trigger API contract.
- Deterministic testing adapters and fixtures.

## What This Package Does Not Own

- It does not import `@netscript/cron`.
- It does not import `@netscript/watchers`.
- It does not create a trigger registry singleton.
- It does not start HTTP servers.
- It does not inspect the filesystem.
- It does not read process environment secrets by itself.
- It does not enqueue jobs directly without an injected action dispatcher.
- It does not keep trigger telemetry in `@netscript/telemetry`.
- It does not keep trigger config schemas in `@netscript/config`.

## Root Surface

The root barrel is deliberately small.

```ts
import {
  createTriggerIngress,
  createTriggerProcessor,
  defineFileWatch,
  defineScheduledTrigger,
  defineWebhook,
  enqueueJob,
} from '@netscript/plugin-triggers-core';
```

The root exports are curated to stay under the NetScript public-surface budget.

Adapters, contracts, config schemas, telemetry helpers, and testing fixtures are available through
subpaths.

## Subpaths

| Subpath                                        | Purpose                           |
| ---------------------------------------------- | --------------------------------- |
| `@netscript/plugin-triggers-core`              | Curated user-facing root surface  |
| `@netscript/plugin-triggers-core/adapters`     | Webhook verifier adapters         |
| `@netscript/plugin-triggers-core/builders`     | Handler-first DSL builders        |
| `@netscript/plugin-triggers-core/config`       | Trigger config schemas            |
| `@netscript/plugin-triggers-core/contracts/v1` | oRPC trigger API contract         |
| `@netscript/plugin-triggers-core/domain`       | Domain vocabulary and errors      |
| `@netscript/plugin-triggers-core/ports`        | Runtime extension boundaries      |
| `@netscript/plugin-triggers-core/runtime`      | Processor and ingress composition |
| `@netscript/plugin-triggers-core/telemetry`    | Trigger instrumentation facade    |
| `@netscript/plugin-triggers-core/testing`      | Memory/KV/inline testing adapters |

## Handler-First DSL

Trigger definitions are handler-first.

There is no builder-chain trigger API in this package.

```ts
import { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core';
import { sendReceiptJob } from './jobs/send-receipt.ts';

export const stripePayments = defineWebhook(
  async (event) => {
    return [
      enqueueJob(sendReceiptJob, {
        payload: event.payload.body,
        idempotencyKey: event.idempotencyKey,
      }),
    ];
  },
  {
    id: 'stripe-payments',
    path: '/webhooks/stripe',
    verifier: 'hmac-sha256',
    secretEnv: 'STRIPE_WEBHOOK_SECRET',
  },
);
```

The handler is the first argument.

The immutable trigger spec is the second argument.

This keeps the userland surface consistent across webhooks, file watches, and schedules.

## Webhook Triggers

Webhook triggers describe an HTTP ingestion path and verifier kind.

```ts
import { defineWebhook } from '@netscript/plugin-triggers-core';

export const githubWebhook = defineWebhook(
  async () => [],
  {
    id: 'github-events',
    path: '/webhooks/github',
    verifier: 'hmac-sha256',
    secretEnv: 'GITHUB_WEBHOOK_SECRET',
    tags: ['source:github'],
  },
);
```

Webhook ingress follows the ack-then-process model.

Verification, event creation, and persistence happen before the 202 response.

Processor work is dispatched asynchronously after acknowledgement.

## File Watch Triggers

File watch triggers describe filesystem event sources without importing a watcher primitive in core.

```ts
import { defineFileWatch } from '@netscript/plugin-triggers-core';

export const inboxFiles = defineFileWatch(
  async () => [],
  {
    id: 'inbox-files',
    paths: ['./inbox'],
    patterns: ['**/*.json'],
    ignored: ['**/*.tmp'],
    on: ['create', 'modify'],
    debounceMs: 250,
    stabilityThreshold: {
      checkIntervalMs: 100,
      stableChecks: 3,
    },
  },
);
```

The production plugin wraps `@netscript/watchers`.

Tests can use `MemoryFileWatcherAdapter`.

## Scheduled Triggers

Scheduled triggers describe cron-like definitions.

```ts
import { defineScheduledTrigger, enqueueJob } from '@netscript/plugin-triggers-core';
import { dailyDigestJob } from './jobs/daily-digest.ts';

export const dailyDigest = defineScheduledTrigger(
  async () => [enqueueJob(dailyDigestJob)],
  {
    id: 'daily-digest',
    cron: '0 8 * * *',
    timezone: 'UTC',
    persistent: false,
    backfill: {
      policy: 'fire-once',
      maxExecutions: 1,
      sequential: true,
    },
  },
);
```

Core only defines `TriggerSchedulerPort`.

The production plugin wraps `@netscript/cron`.

The `persistent` flag is forward-compatible with future Deno persistent cron support.

## Known Trigger Kinds

The known discriminator values are:

- `webhook`
- `file-watch`
- `scheduled`
- `queue`
- `stream`
- `manual`

The first three are implemented by the Group F runtime.

The last three are reserved public branches.

Reserved branches produce types but throw `TriggerKindNotImplementedError` if executed by the T1
processor.

## Unified Event Pipeline

Every trigger kind produces a `TriggerEvent`.

The processor does not have separate webhook, file-watch, or scheduled execution paths.

Kind-specific concerns live in ingress, scheduler, or watcher adapters.

The common event envelope carries:

- event id
- trigger id
- trigger kind
- status
- payload
- attempt number
- detection and update timestamps
- optional idempotency key
- optional request headers
- optional trace context
- optional metadata

## Idempotency

The T1 idempotency model resolves keys in this order:

1. Caller-provided key on the event.
2. Request header key.
3. SHA-256 payload hash fallback.

The memory idempotency store implements this behavior for tests.

Production stores can use KV, Redis, or another durable backend behind `TriggerIdempotencyPort`.

## Processor Runtime

Create processors through the composition root.

```ts
import { createTriggerProcessor } from '@netscript/plugin-triggers-core';

const processor = createTriggerProcessor({
  idempotency,
  dlq,
  logger,
  dispatchAction,
});
```

There is no global processor registry.

There is no `getTriggerRegistry()`.

All collaborators are injected.

The processor handles:

- idempotency claims
- retry policy
- retry exhaustion to DLQ
- concurrency keys
- circuit breaker state
- action dispatch
- graceful `stop()` draining

## Ingress Runtime

`createTriggerIngress()` builds an ack-then-process webhook ingress boundary.

```ts
import { createTriggerIngress } from '@netscript/plugin-triggers-core';

const ingress = createTriggerIngress({
  definitions: [stripePayments],
  eventStore,
  processor,
  verifier,
  logger,
});
```

The ingress returns a 202 response for accepted events.

Processing continues after the response path.

Invalid signatures fail before acceptance.

## Telemetry

Trigger telemetry lives in this package.

```ts
import { createTriggerInstrumentation } from '@netscript/plugin-triggers-core/telemetry';

const instrumentation = createTriggerInstrumentation({ tracer, meter });
```

Required span names are:

- `trigger.ingress`
- `trigger.detect`
- `trigger.process`
- `trigger.action.dispatch`
- `trigger.dlq.enqueue`
- `trigger.ingress.response`

The facade is structural.

It can wrap OpenTelemetry without forcing a global telemetry singleton.

## Config

Trigger config schemas are exported from the config subpath.

```ts
import { TriggersConfigSchema } from '@netscript/plugin-triggers-core/config';
```

The central `@netscript/config` package treats `triggers` as plugin-owned data.

Plugin-specific validation belongs here.

## Contracts

The v1 oRPC contract is available from `contracts/v1`.

```ts
import { triggersContractV1 } from '@netscript/plugin-triggers-core/contracts/v1';
```

The contract includes:

- trigger definition listing
- trigger definition lookup
- event listing
- event lookup
- manual fire
- webhook test
- schedule preview
- enable trigger
- disable trigger
- event subscription

## Testing

Testing utilities are exported from `@netscript/plugin-triggers-core/testing`.

```ts
import {
  InlineTriggerProcessor,
  MemoryTriggerEventStore,
  MemoryTriggerIdempotencyStore,
  TriggerTestClock,
} from '@netscript/plugin-triggers-core/testing';
```

The testing subpath includes:

- `MemoryTriggerEventStore`
- `RecordingTriggerEventStore`
- `KvTriggerEventStore`
- `MemoryTriggerIdempotencyStore`
- `TriggerTestClock`
- `InlineTriggerProcessor`
- `MemoryTriggerSchedulerAdapter`
- `MemoryFileWatcherAdapter`

These adapters are deterministic and require no production services.

`KvTriggerEventStore` uses Deno KV and requires the caller to open and pass the KV handle.

## Logging

Runtime code uses `LoggerPort`.

If no logger is supplied, `NoopLogger` is used.

Runtime code does not call `console.log`.

This keeps framework behavior testable and lets the plugin package decide how logs are routed.

## Permissions

The core package performs no process-level I/O by default.

Adapters that need permissions receive their resources from callers.

Examples:

- KV stores receive a `Deno.Kv` handle.
- Webhook verifier secrets are supplied by the plugin or application.
- Scheduler and watcher production primitives live in the plugin package.

## Publishability

This package is designed for JSR publication.

The public API must avoid slow types.

Run:

```sh
deno publish --dry-run --allow-dirty
```

The root barrel must remain within the public export budget.

At F21 the root surface is 21 named exports out of a budget of 25.

## Stability

This package is introduced as `0.0.1-alpha.0`.

The DSL and port names are locked by the Group F architecture.

Queue, stream, and manual runtime execution remain reserved for future work.
