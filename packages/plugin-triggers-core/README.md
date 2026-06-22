# @netscript/plugin-triggers-core

Handler-first trigger DSL, runtime ports, adapters, telemetry, config, and testing primitives for NetScript trigger plugins.

This is framework-layer substrate for the `@netscript/plugin-triggers` family. It owns the stable
trigger vocabulary and composition boundaries; HTTP wiring, CLI, scaffold, and process supervision
live in the public plugin package.

## Install

```sh
deno add jsr:@netscript/plugin-triggers-core
```

Adapters, contracts, config schemas, telemetry, and testing fixtures are available through curated
subpaths such as `@netscript/plugin-triggers-core/testing` and
`@netscript/plugin-triggers-core/telemetry`.

## Quick example

Trigger definitions are handler-first: the handler is the first argument, the immutable spec is the
second. Compose the processor and ingress runtime from explicit dependencies.

```ts
import {
  createTriggerIngress,
  createTriggerProcessor,
  defineWebhook,
  enqueueJob,
} from '@netscript/plugin-triggers-core';
import { sendReceiptJob } from './jobs/send-receipt.ts';

export const stripePayments = defineWebhook(
  async (event) => [
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

Webhook ingress is ack-then-process: verification and persistence happen before the 202 response,
and processor work is dispatched after acknowledgement.

## Docs

- [API reference](https://rickylabs.github.io/netscript/reference/triggers/)
- [Concepts & guides](https://rickylabs.github.io/netscript/)
