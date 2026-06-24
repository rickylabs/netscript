# @netscript/plugin-triggers-core

[![JSR](https://jsr.io/badges/@netscript/plugin-triggers-core)](https://jsr.io/@netscript/plugin-triggers-core)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The handler-first trigger DSL and runtime substrate for the NetScript `@netscript/plugin-triggers`
family: define webhook, scheduled, and file-watch triggers, then process them through an
ack-then-process ingress and a processor with idempotency, retry, DLQ, and circuit-breaker
handling.**

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
second. Handlers return actions that the processor dispatches after the ingress acknowledges the
request.

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

Webhook ingress is ack-then-process: verification and persistence complete before the `202`
response, and handler actions are dispatched after acknowledgement.

---

## 📦 Key Capabilities

- **Handler-first authoring DSL**: `defineWebhook`, `defineScheduledTrigger`, and `defineFileWatch`
  produce frozen, type-safe trigger definitions; handlers emit actions such as `enqueueJob` to hand
  work to the worker pool.
- **Ack-then-process ingress**: `createTriggerIngress` verifies and persists inbound webhook events
  before responding, then dispatches handler work to the processor.
- **Durable processor runtime**: `createTriggerProcessor` and the `TriggerProcessor` class apply
  idempotency, retry policy, bounded concurrency, dead-letter queueing, and circuit-breaking around
  handler dispatch.
- **Explicit runtime ports**: ingress, processor, scheduler, event store, idempotency, DLQ, and
  webhook-verifier boundaries (`TriggerIngressPort`, `TriggerProcessorPort`,
  `TriggerEventStorePort`, and siblings) are injected, so adapters stay swappable.
- **Curated sub-path surface**: `./builders`, `./config`, `./contracts/v1`, `./domain`, `./ports`,
  `./runtime`, `./telemetry`, and `./testing` expose the schemas, branded ids, telemetry, and
  deterministic in-memory test fixtures that back the public `@netscript/plugin-triggers` plugin.

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
