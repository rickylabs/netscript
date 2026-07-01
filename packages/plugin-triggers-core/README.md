# @netscript/plugin-triggers-core

[![JSR](https://jsr.io/badges/@netscript/plugin-triggers-core)](https://jsr.io/@netscript/plugin-triggers-core)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The reusable trigger primitives for NetScript: a handler-first DSL that defines webhook,
scheduled, and file-watch triggers, plus an ack-then-process ingress and a durable processor that
drains them through explicit runtime ports — the core that the deployable
`@netscript/plugin-triggers` plugin binds to the host.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/plugin-triggers-core

# Node.js / Bun
npx jsr add @netscript/plugin-triggers-core
bunx jsr add @netscript/plugin-triggers-core
```

### Usage

Trigger definitions are handler-first: the handler is the first argument, the immutable spec is the
second. Handlers return actions (such as `enqueueJob`) that the processor dispatches after the
ingress has acknowledged the request.

```typescript
import {
  createTriggerIngress,
  createTriggerProcessor,
  defineWebhook,
  enqueueJob,
} from '@netscript/plugin-triggers-core';
import { sendReceiptJob } from './jobs/send-receipt.ts';

export const stripePayments = defineWebhook(
  (event) => [
    enqueueJob(sendReceiptJob, {
      payload: event.payload.body,
      idempotencyKey: event.idempotencyKey,
    }),
  ],
  {
    id: 'stripe-payments',
    path: '/webhooks/stripe',
    verifier: 'hmac-sha256',
    secretEnv: 'STRIPE_WEBHOOK_SECRET',
  },
);

const processor = createTriggerProcessor({ idempotency, dlq, logger, dispatchAction });
const ingress = createTriggerIngress({
  definitions: [stripePayments],
  eventStore,
  processor,
  verifier,
  logger,
});
```

Webhook ingress is **ack-then-process**: `createTriggerIngress` verifies the signature and persists
the event through its `TriggerEventStorePort` before returning the `202` acknowledgement, then hands
the handler's actions to the `TriggerProcessorPort` for dispatch. The two phases are separated so a
slow handler never blocks the acknowledgement and a crash after `202` is recoverable from the
persisted event.

### Scheduled triggers and fire-time preview

`defineScheduledTrigger` takes the handler first and a static cron spec second;
`computeNextFireTimes` previews upcoming fire times for a spec without a running scheduler:

```typescript
import { computeNextFireTimes, defineScheduledTrigger } from '@netscript/plugin-triggers-core';

const nightlyReindex = defineScheduledTrigger(
  // Handlers are async and return trigger actions (e.g. `enqueueJob`).
  async () => [],
  {
    id: 'nightly-reindex',
    cron: '0 2 * * *',
    timezone: 'UTC',
  },
);
console.log(nightlyReindex.id); // "nightly-reindex"

// Preview the next three fire times from a reference instant.
const upcoming = computeNextFireTimes(
  { cron: '0 2 * * *', timezone: 'UTC' },
  3,
  new Date('2026-01-01T00:00:00Z'),
);
console.log(upcoming);
```

---

## 📦 Key Capabilities

- **Handler-first authoring DSL**: `defineWebhook`, `defineScheduledTrigger`, and `defineFileWatch`
  produce frozen, type-safe trigger definitions; handlers emit actions such as `enqueueJob` to hand
  work to the worker pool.
- **Ack-then-process ingress**: `createTriggerIngress` verifies and persists inbound webhook events
  before responding `202`, then dispatches handler work to the processor.
- **Durable processor runtime**: `createTriggerProcessor` and the `TriggerProcessor` class apply
  idempotency, retry policy, bounded concurrency, dead-letter queueing, and circuit-breaking around
  handler dispatch.
- **Explicit runtime ports**: ingress, processor, scheduler, event store, idempotency, DLQ, clock,
  file-watcher, and webhook-verifier boundaries (`TriggerIngressPort`, `TriggerProcessorPort`,
  `TriggerEventStorePort`, `TriggerSchedulerPort`, `WebhookVerifierPort`, and siblings) are
  injected, so adapters stay swappable.
- **Curated sub-path surface**: `./builders`, `./adapters`, `./config`, `./contracts/v1`,
  `./domain`, `./ports`, `./runtime`, `./telemetry`, and `./testing` expose the schemas, branded
  ids, telemetry, and deterministic in-memory test fixtures that back the public
  `@netscript/plugin-triggers` plugin.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/triggers/](https://rickylabs.github.io/netscript/reference/triggers/)
- **Durable Workflows**:
  [rickylabs.github.io/netscript/durable-workflows/](https://rickylabs.github.io/netscript/durable-workflows/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
