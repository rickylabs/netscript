---
layout: layouts/base.vto
title: Durable checkout
templateEngine: [vento, md]
prev: { label: "3 · Cart contracts", href: "/tutorials/storefront/03-cart-contracts/" }
next: { label: "5 · Shipping webhook", href: "/tutorials/storefront/05-shipping-webhook/" }
---

# Durable checkout

In this chapter you build checkout as a **durable saga**: a state machine that checkpoints its
progress, reacts to payment messages, and runs a **compensation** path when a step fails. A plain
`async` function that charges a card and then reserves inventory can die between the two and keep
the money without shipping anything; a saga records each transition, so a restart resumes from the
last checkpoint.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/storefront/01-scaffold/" },
  { label: "2 · Catalog service", href: "/tutorials/storefront/02-catalog-service/" },
  { label: "3 · Cart contracts", href: "/tutorials/storefront/03-cart-contracts/" },
  { label: "4 · Checkout saga", href: "/tutorials/storefront/04-checkout-saga/" },
  { label: "5 · Shipping webhook", href: "/tutorials/storefront/05-shipping-webhook/" },
  { label: "6 · Storefront UI", href: "/tutorials/storefront/06-storefront-ui/" },
  { label: "7 · Deploy", href: "/tutorials/storefront/07-deploy/" }
] }) }}

## What you will build

The runtime plugins checkout depends on, and a `CheckoutSaga` written with `defineSaga(...)`: typed
per-instance state, a correlation key, and message handlers that move a checkout from `OrderCreated`
to payment. You also write the `process-payment` worker job that a checkout trigger enqueues, and a
**failure path** that cancels the order when payment is declined. At the end you drive one checkout to
**paid** and watch a failed payment **compensate to cancelled**, both visible on the Sagas API.

## Before you begin

From [chapter 3](/tutorials/storefront/03-cart-contracts/), check that:

- `my-shop/` has the `products` service and the `cart` contract;
- `aspire start` is up (the dashboard answers at [https://localhost:18888](https://localhost:18888)).
  The saga registry and the durable instance store exist only while Aspire runs: Deno KV holds the
  registry, and KV or Postgres holds instance state. If you closed the `aspire start` terminal,
  restart it from `aspire/` before you run any `netscript` command in this chapter.

## Step 1 — Add the checkout runtime plugins

Checkout uses four official runtime plugins: **`sagas`** (the durable workflow), **`workers`**
(background jobs), **`triggers`** (the supported way to enqueue worker jobs) and **`streams`** (the
durable transport). Install each one from the project root, with samples to adapt:

```sh
netscript plugin install worker --name workers --samples
netscript plugin install saga --name sagas --samples
netscript plugin install trigger --name triggers --samples
netscript plugin install stream --name streams --samples
```

Each plugin lands at its canonical location (**`plugins/sagas/`**, `plugins/workers/`,
`plugins/streams/`), and `netscript.config.ts` references each `mod.ts`. The installer also creates a
slimmer top-level staging copy (for example `sagas/`) for the background processor; you write code
against `plugins/<name>/`.

Confirm they registered:

```sh
netscript plugin list
```

The list shows `workers`, `sagas`, `triggers` and `streams`.

## Step 2 — Read the saga builder

You write a saga with the **fluent builder** from `@netscript/plugin-sagas-core`. Each call narrows
the saga's type and configuration, and `.build()` produces the definition the runtime runs:

{{ comp.apiTable({ caption: "SagaBuilder methods (from @netscript/plugin-sagas-core)", rows: [
  { name: "defineSaga(id)", type: "start the chain", desc: "Begins a saga definition with a stable id used in the registry and instance keys." },
  { name: ".durability(tier)", type: "persistence tier", desc: "Selects the durability tier (defaults to T1). The persisted tier checkpoints instance state so an in-flight workflow survives a restart." },
  { name: ".state(initial)", type: "per-instance state", desc: "Declares the state shape and its initial value. Every correlated instance gets its own copy. Must come before any handler." },
  { name: ".correlate(fn)", type: "instance routing", desc: "Extracts the correlation key from an incoming message so it reaches the right instance — e.g. correlate by orderId." },
  { name: ".on(type, handler)", type: "message handler", desc: "Subscribes to a message type. The handler reads state + message and returns an array of effects." },
  { name: ".compensate(type, handler)", type: "compensation handler", desc: "Registers a handler for a FAILED event type — the undo path. Same shape as .on(), reserved for compensation." },
  { name: ".build()", type: "finalize", desc: "Produces the frozen SagaDefinition the runner executes. Requires at least one handler." }
] }) }}

The saga DSL also exports **`send(target, payload)`** for cascaded messages that registered saga
definitions handle. It doesn't call a service, enqueue a worker job or run a task. The payment leg
needs no cascade: its trigger uses `enqueueJob(...)` for durable worker dispatch, and the worker
publishes a typed result back to the saga.

## Step 3 — Scaffold the checkout saga

Generate the saga definition and its config with the sagas CLI. The CLI's `add-saga` verb is written
as `add saga` on the command line.

{{ comp callout { type: "note", title: "ns-sagas is a shorthand you install once" } }}
<code>ns-sagas</code> is a name <em>you</em> give the sagas plugin's CLI; the scaffold doesn't
create it. Install it once, globally, and every <code>ns-sagas</code> command on this page works as
written:
<pre><code class="language-bash">deno install -gArf -n ns-sagas jsr:@netscript/plugin-sagas{{ releaseSpecifier }}/cli</code></pre>
To skip the install, run each <code>ns-sagas &lt;verb …&gt;</code> as
<code>deno x -A jsr:@netscript/plugin-sagas{{ releaseSpecifier }}/cli &lt;verb …&gt;</code>.
{{ /comp }}

```sh
ns-sagas add saga checkout --message-type=OrderCreated --durability=t1 --topic=checkout
```

The command writes `sagas/checkout-saga.ts` and `sagas/checkout.config.ts`, with a normal handler and
a compensation-handler skeleton, and refreshes the saga registry. Extend the generated definition with
the checkout state and lifecycle below. The saga correlates by `orderId` and starts as `pending`. When
payment fails, the forward handler returns a `sagaCompensate(...)` effect and the matching
`.compensate(...)` branch records the cancellation.

```ts
// sagas/checkout-saga.ts
import { defineSaga, sagaCompensate } from '@netscript/plugin-sagas-core';
import type { SagaCorrelationKey, SagaState } from '@netscript/plugin-sagas-core/domain';

type OrderStatus =
  | 'pending'
  | 'payment_pending'
  | 'paid'
  | 'cancelled';

// Per-instance checkout state. Runtime metadata is handled for you.
interface CheckoutState extends SagaState {
  orderId: string;
  customerId: string;
  status: OrderStatus;
  items: Array<{ productId: string; quantity: number }>;
  total: number;
  transactionId?: string;
  cancelReason?: string;
}

const initialState: CheckoutState = {
  orderId: '',
  customerId: '',
  status: 'pending',
  items: [],
  total: 0,
};

export const checkoutSaga = defineSaga('CheckoutSaga')
  .state(initialState)
  // OrderCreated records the workflow. The trigger below owns worker dispatch.
  .on('OrderCreated', (saga, event) => {
    const msg = event.payload as { orderId: string; customerId: string; items: CheckoutState['items']; total: number };
    saga.state = {
      ...saga.state,
      orderId: msg.orderId,
      customerId: msg.customerId,
      items: msg.items,
      total: msg.total,
      status: 'payment_pending',
    };
    return [];
  })

  // The payment worker publishes this result back to the saga.
  .on('PaymentCompleted', (saga, event) => {
    if (saga.state.status !== 'payment_pending') return [];
    const msg = event.payload as { transactionId: string };
    saga.state = { ...saga.state, status: 'paid', transactionId: msg.transactionId };
    return [];
  })

  // Request compensation using the message type registered below.
  .on('PaymentFailed', (saga, event) => {
    if (saga.state.status !== 'payment_pending') return [];
    const msg = event.payload as { orderId: string; reason: string };
    return [sagaCompensate({ type: 'PaymentFailed', payload: msg }, msg.reason)];
  })

  // The default durable runtime routes the returned effect here.
  .compensate('PaymentFailed', (saga, event) => {
    const msg = event.payload as { orderId: string; reason: string };
    saga.state = {
      ...saga.state,
      status: 'cancelled',
      cancelReason: `Payment failed: ${msg.reason}`,
    };
    return [];
  })

  // Route every handled message to the instance whose orderId matches.
  .correlate((message) =>
    String((message.payload as { orderId?: string }).orderId ?? '') as SagaCorrelationKey
  )

  .build();

export default checkoutSaga;
```

Three things to notice:

- **State is a typed state machine.** `status` is a union, and every handler guards on it
  (`if (saga.state.status !== 'payment_pending') return []`), so a redelivered or out-of-order
  message is a no-op, not a corruption. See
  [the durability model](/explanation/durability-model/).
- **The saga doesn't dispatch worker jobs.** The trigger in Step 4 owns the cross-plugin enqueue.
- **Compensation is an explicit effect and a registered branch.** The forward `PaymentFailed`
  handler returns `sagaCompensate(...)`, and the matching `.compensate('PaymentFailed', ...)` handler
  moves the same state machine to `cancelled` without another unhandled message.

{{ comp callout { type: "warning", title: "Durability does not deduplicate delivery" } }}
The durability tier persists instance state so a workflow survives a restart, but it does
<strong>not</strong> deduplicate inbound messages. That is why every handler above checks
<code>saga.state.status</code> before acting: a redelivered <code>PaymentCompleted</code> must not
charge twice or advance twice. Keep handlers idempotent.
{{ /comp }}

{{ comp callout { type: "note", title: "The durable runtime wires compensation" } }}
An inbound <code>PaymentFailed</code> is first handled by <code>.on(...)</code>. Returning
<code>sagaCompensate(...)</code> from that handler is what routes execution into the matching
<code>.compensate(...)</code> branch. <code>createDurableSagaRuntime(...)</code> installs the
compensator by default; custom composition with lower-level <code>createSagaRuntime(...)</code>
must supply <code>native.compensator</code> explicitly.
{{ /comp }}

## Step 4 — Enqueue payment through the triggers API

A triggers action turns checkout ingress into durable background work. Reduce the generated
`checkout-payment` webhook to this definition:

```ts
// triggers/checkout-payment-trigger.ts
import { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core/builders';
import type { JobDefinition } from '@netscript/plugin-workers-core';

const processPaymentJob = {
  id: 'process-payment' as JobDefinition<'process-payment'>['id'],
  name: 'Process payment',
  topic: 'default',
} satisfies JobDefinition<'process-payment'>;

export default defineWebhook(
  (event) => Promise.resolve([enqueueJob(processPaymentJob, { payload: event.payload.body })]),
  { id: 'checkout-payment', path: 'checkout/payment', verifier: 'memory' },
);
```

{{ comp callout { type: "caution", title: "Use a signed verifier on a public endpoint" } }}
<code>verifier: 'memory'</code> accepts unsigned requests, which keeps this local tutorial runnable.
A real public endpoint needs a signed verifier.
{{ /comp }}

Post the same order payload to this webhook when you publish `OrderCreated`. The saga records the
order as `payment_pending`, and the trigger independently and durably enqueues `process-payment`.
A saga cascade is not a workers transport, so the trigger owns this step.

## Step 5 — Author the payment worker job

The trigger enqueues `process-payment`; the **worker job** does the work and reports back by
publishing `PaymentCompleted` or `PaymentFailed` to the saga with `createSagaPublisher`.

```ts
// workers/jobs/process-payment.ts
import {
  createFailureResult,
  createSuccessResult,
  defineJobHandler,
} from '@netscript/plugin-workers-core';
import { createSagaPublisher } from '@netscript/plugin-sagas/runtime';
import { z } from 'zod';
import type { OrderSagaMessage } from '../saga-message-types.ts';

// Publishes results back to the saga bus.
const sagaPublisher = createSagaPublisher<OrderSagaMessage>();

const PayloadSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive(),
});

const handler = defineJobHandler(async (ctx) => {
  const { orderId, amount } = PayloadSchema.parse(ctx.payload ?? {});

  try {
    // ... charge the card via your provider (mock here) ...
    const transactionId = `txn_${Date.now()}`;

    // Tell the saga payment succeeded — it advances to paid.
    const published = await sagaPublisher.publish({
      type: 'PaymentCompleted',
      payload: { orderId, transactionId },
    });
    if (!published.published) {
      return createFailureResult(
        `Payment succeeded, but saga publish was rejected: ${published.reason}`,
        { orderId, retryable: published.retryable },
      );
    }

    return createSuccessResult({ orderId, transactionId, amount });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    // Tell the saga payment failed — its compensation branch cancels the order.
    const published = await sagaPublisher.publish({
      type: 'PaymentFailed',
      payload: { orderId, reason },
    });
    if (!published.published) {
      return createFailureResult(
        `${reason} (orderId: ${orderId}); saga publish rejected: ${published.reason}`,
        { orderId, retryable: published.retryable },
      );
    }

    return createFailureResult(`${reason} (orderId: ${orderId})`);
  }
});

export default Object.assign(handler, { id: 'process-payment' });
```

The **message type string** is the contract between the two halves. The job publishes
`PaymentCompleted` / `PaymentFailed`, and the saga's `.on('PaymentCompleted', …)` and
`.on('PaymentFailed', …)` listen for exactly those. There is no shared function call: they are
isolated background processors joined only by the message on the streams transport. Keep the strings
identical on both sides.

{{ comp.apiTable({ caption: "Worker job primitives (from @netscript/plugin-workers-core)", rows: [
  { name: "defineJobHandler(fn)", type: "define a job", desc: "Wraps an async handler that receives a typed ctx (payload, logging, tracing) and returns a result." },
  { name: "createSuccessResult(data)", type: "success", desc: "The handler's return for a completed job; carries result data." },
  { name: "createFailureResult(reason)", type: "failure", desc: "The handler's return for a failed job; the message string is recorded on the execution." },
  { name: "createSagaPublisher<M>()", type: "from @netscript/plugin-sagas/runtime", desc: "Publishes typed messages onto the saga bus so a running saga can react — how the job reports back." }
] }) }}

## Step 6 — Type-check the workflow

The Sagas API lists sagas from a KV-backed registry, and the scaffold's saga runtime registers your
definition on startup. `aspire start` runs the sagas processor and API together, so your saga is
picked up when the app (re)starts; you don't start anything by hand. First, check it compiles against
the builder's generic signatures:

```sh
deno task check
```

A clean check means `defineSaga`, `.state()`, `.correlate()`, `.on()` and `.build()` line up with the
message and state types you declared, and the worker job's publish calls match the saga message
types.

## Verify your progress

With Aspire up, drive one checkout to `paid` and one to `cancelled`. `ns-sagas` resolves the Sagas
API's allocated endpoint for you.

1. Confirm the saga registered:

   ```sh
   ns-sagas list --registered --json
   ```

   The list shows `CheckoutSaga`, with `OrderCreated`, `PaymentCompleted` and `PaymentFailed` among
   its handled message types.

2. Start an order and enqueue its payment. `ns-sagas publish` sends `{ type, payload }` to the saga
   bus, and the saga correlates on `payload.orderId`:

   ```sh
   # 1. Open the checkout — the saga records payment_pending and emits CheckoutPaymentRequested.
   ns-sagas publish OrderCreated \
     --payload='{ "orderId": "ord_1001", "customerId": "cust_1001", "items": [{ "productId": "1", "quantity": 2 }], "total": 4999 }' \
     --correlation-key=ord_1001

   # 2. Enqueue the process-payment worker through the supported triggers ingress.
   #    Take <triggers-endpoint> from the Aspire resource list.
   curl -X POST <triggers-endpoint>/api/v1/webhooks/checkout/payment \
     -H 'content-type: application/json' \
     -d '{ "orderId": "ord_1001", "amount": 4999 }'
   ```

   The worker runs `process-payment`, which publishes `PaymentCompleted` back to the correlated saga
   instance. The happy path needs no direct `PaymentCompleted` command.

3. Confirm the instance reached `paid`:

   ```sh
   ns-sagas list --instances --saga=CheckoutSaga --json
   ```

4. Prove **compensation**: open a second order and fail its payment. The `PaymentFailed` branch moves
   the state machine to `cancelled`:

   ```sh
   ns-sagas publish OrderCreated \
     --payload='{ "orderId": "ord_2002", "customerId": "cust_2002", "items": [{ "productId": "1", "quantity": 1 }], "total": 1999 }' \
     --correlation-key=ord_2002

   ns-sagas publish PaymentFailed \
     --payload='{ "orderId": "ord_2002", "reason": "card_declined" }' \
     --correlation-key=ord_2002

   ns-sagas list --instances --saga=CheckoutSaga --json
   ```

The first instance shows `status: 'paid'` with its `transactionId`; the second shows
`status: 'cancelled'` with the `cancelReason` your compensation branch set. This chapter stops at the
payment leg, so `paid` is checkout's observable checkpoint. The forward path continues once you write
separate inventory and shipment triggers and jobs; saga `send(...)` cascades remain internal saga-bus
messages.

- [ ] The workers, sagas, triggers, and streams plugins are installed and registered.
- [ ] `checkout-saga.ts` defines state, a correlation key, the forward handlers, and a
      `PaymentFailed` compensation branch.
- [ ] `workers/jobs/process-payment.ts` publishes `PaymentCompleted` / `PaymentFailed` back to the
      saga.
- [ ] `triggers/checkout-payment-trigger.ts` enqueues `process-payment` with `enqueueJob(...)`.
- [ ] `ns-sagas list --registered --json` lists `CheckoutSaga`.
- [ ] Publishing `OrderCreated` and invoking the checkout trigger yields an instance at
      `status: 'paid'`; publishing `PaymentFailed` directly exercises the isolated compensation
      branch and yields one at `status: 'cancelled'`.
- [ ] `deno task check` passes.

## What you built

A durable checkout. A `CheckoutSaga` built with `defineSaga().state().correlate().on().build()` moves
an order to payment and cancels it through a `PaymentFailed` compensation branch. A trigger enqueues
the `process-payment` worker job, which reports back with `createSagaPublisher`, and every instance
is visible on the Sagas API. Next, you accept events from outside providers with a verified webhook.
