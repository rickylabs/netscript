---
layout: layouts/base.vto
title: Durable checkout
templateEngine: [vento, md]
prev: { label: "3 · Cart contracts", href: "/tutorials/storefront/03-cart-contracts/" }
next: { label: "5 · Shipping webhook", href: "/tutorials/storefront/05-shipping-webhook/" }
---

# Durable checkout

In [chapter 3](/tutorials/storefront/03-cart-contracts/) you designed the cart contract. Checkout is
what turns a cart into an order — and it is the one place in a shop where a crash mid-flight costs
real money. A naive `async` function that charges a card, reserves inventory, then books shipment is a
liability: if the process dies after the charge but before the reservation, you have taken money and
shipped nothing. This chapter rebuilds checkout as a **durable saga** — a state machine that
checkpoints its progress, reacts to payment and inventory messages, and runs a **compensation** path
when a step fails.

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

You will add the runtime plugins checkout depends on, then author a `CheckoutSaga` with
`defineSaga(...)`: typed per-instance state, a correlation key, and message handlers that walk a
checkout from `OrderCreated` through payment toward fulfillment. You will also author the
`process-payment` worker job that a checkout trigger enqueues, and you will wire the **failure path** so a
declined payment cancels the order instead of stranding it. By the end you can drive a checkout to a
**paid** order and watch a failed payment **compensate to cancelled** — both observable on the Sagas
API at `:8092`.

## Before you begin

You should have finished [chapter 3](/tutorials/storefront/03-cart-contracts/), so:

- `my-shop/` has the `products` service and the `cart` contract.
- `aspire start` is up (the dashboard answers at [https://localhost:18888](https://localhost:18888)).
  The saga registry and durable instance store both depend on Aspire-managed resources — Deno KV for
  the registry, and either KV or Postgres for instance state.

{{ comp callout { type: "important", title: "Aspire must already be running" } }}
The Sagas API service and its KV-backed registry come up as part of the orchestrated app. If you closed your <code>aspire start</code> terminal, restart it from the <code>aspire/</code> folder (<code>cd aspire &amp;&amp; aspire start</code>) <strong>before</strong> running any <code>netscript</code> command in this chapter — the durable store and registry only exist while Aspire is up.
{{ /comp }}

## Step 1 — Add the checkout runtime plugins

Checkout spans four official runtime plugins, and you install each one explicitly: **`sagas`** (the
durable workflow), **`workers`** (background jobs), **`triggers`** (the supported worker enqueue
boundary), and **`streams`** (the durable transport). Add them from the project root, with samples so you
have working modules to adapt:

```sh
netscript plugin install worker --name workers --samples
netscript plugin install saga --name sagas --samples
netscript plugin install trigger --name triggers --samples
netscript plugin install stream --name streams --samples
```

Each plugin lands at its canonical location (**`plugins/sagas/`**, `plugins/workers/`,
`plugins/streams/`), and `netscript.config.ts` is updated to reference each `mod.ts`. A slimmer
top-level staging copy (e.g. `sagas/`) is also created for the background processor — you author
against `plugins/<name>/`.

Confirm they registered:

```sh
netscript plugin list
```

You should see `workers`, `sagas`, `triggers`, and `streams` in the list.

## Step 2 — Read the saga builder

NetScript sagas are authored with a **fluent builder** imported from `@netscript/plugin-sagas-core`.
Each call narrows the saga's type and configuration; `.build()` produces the definition the runtime
consumes. The methods you will use:

{{ comp.apiTable({ caption: "SagaBuilder methods (from @netscript/plugin-sagas-core)", rows: [
  { name: "defineSaga(id)", type: "start the chain", desc: "Begins a saga definition with a stable id used in the registry and instance keys." },
  { name: ".durability(tier)", type: "persistence tier", desc: "Selects the durability tier (defaults to T1). The persisted tier checkpoints instance state so an in-flight workflow survives a restart." },
  { name: ".state(initial)", type: "per-instance state", desc: "Declares the state shape and its initial value. Every correlated instance gets its own copy. Must come before any handler." },
  { name: ".correlate(fn)", type: "instance routing", desc: "Extracts the correlation key from an incoming message so it reaches the right instance — e.g. correlate by orderId." },
  { name: ".on(type, handler)", type: "message handler", desc: "Subscribes to a message type. The handler reads state + message and returns an array of effects." },
  { name: ".compensate(type, handler)", type: "compensation handler", desc: "Registers a handler for a FAILED event type — the undo path. Same shape as .on(), reserved for compensation." },
  { name: ".build()", type: "finalize", desc: "Produces the frozen SagaDefinition the runner executes. Requires at least one handler." }
] }) }}

The other primitive you need is **`send(target, payload)`** — also from `@netscript/plugin-sagas-core`.
It republishes an **internal saga message onto the saga bus**; it does not enqueue a worker job or
task. Handlers return an array of these effects. This chapter uses `send(...)` for saga-to-saga
messages and the triggers API's `enqueueJob(...)` effect for durable worker dispatch.

## Step 3 — Scaffold the checkout saga

Start with the saga definition and config scaffold:

The `add-saga` verb uses the spaced `add saga` shell syntax:

{{ comp callout { type: "note", title: "ns-sagas is a shorthand you install once" } }}
<code>ns-sagas</code> is a name <em>you</em> give the sagas plugin's CLI — the scaffold does
not create it. Install it once, globally, and every <code>ns-sagas</code> command on this page
works as written:
<pre><code class="language-bash">deno install -gArf -n ns-sagas jsr:@netscript/plugin-sagas{{ releaseSpecifier }}/cli</code></pre>
Rather not install it? Each <code>ns-sagas &lt;verb …&gt;</code> is exactly
<code>deno x -A jsr:@netscript/plugin-sagas{{ releaseSpecifier }}/cli &lt;verb …&gt;</code> — run
that full form instead.
{{ /comp }}

```sh
ns-sagas add saga checkout --message-type=OrderCreated --durability=t1 --topic=checkout
```

The command writes `sagas/checkout-saga.ts` plus `sagas/checkout.config.ts`, including a normal
handler and a compensation-handler skeleton, and refreshes the saga registry. Extend that generated
definition with the checkout state and lifecycle below. It correlates by `orderId`, starts `pending`,
and walks the lifecycle. When payment fails, the forward handler returns a
`sagaCompensate(...)` effect and the matching `.compensate(...)` branch performs the undo step.

```ts
// sagas/checkout-saga.ts
import { defineSaga, sagaCompensate, send } from '@netscript/plugin-sagas-core';
import type { SagaState } from '@netscript/plugin-sagas-core/domain';

type OrderStatus =
  | 'pending'
  | 'payment_pending'
  | 'paid'
  | 'inventory_reserved'
  | 'shipped'
  | 'completed'
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
  // Route every message to the instance whose orderId matches.
  .correlate((message) => String((message.payload as { orderId?: string }).orderId ?? ''))

  // OrderCreated → emit the saga's internal payment-requested message.
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
    return [send('CheckoutPaymentRequested', { orderId: msg.orderId, amount: msg.total })];
  })

  // PaymentCompleted → reserve inventory.
  .on('PaymentCompleted', (saga, event) => {
    if (saga.state.status !== 'payment_pending') return [];
    const msg = event.payload as { transactionId: string };
    saga.state = { ...saga.state, status: 'paid', transactionId: msg.transactionId };
    return [send('reserve-inventory', { orderId: saga.state.orderId, items: saga.state.items })];
  })

  // InventoryReserved → book shipment.
  .on('InventoryReserved', (saga) => {
    if (saga.state.status !== 'paid') return [];
    saga.state = { ...saga.state, status: 'inventory_reserved' };
    return [send('create-shipment', { orderId: saga.state.orderId })];
  })

  // ShipmentCreated → done.
  .on('ShipmentCreated', (saga) => {
    if (saga.state.status !== 'inventory_reserved') return [];
    saga.state = { ...saga.state, status: 'completed' };
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
    return [send('OrderCancelled', { orderId: msg.orderId, reason: msg.reason })];
  })

  .build();

export default checkoutSaga;
```

Read the shape, not the line count:

- **State is a typed state machine.** `status` is a union; every handler guards on it
  (`if (saga.state.status !== 'paid') return []`) so a redelivered or out-of-order message is a
  no-op, not a corruption. [Durable workflows are state machines](/explanation/durability-model/) is a
  NetScript axiom, not a slogan.
- **Saga messages are driven by `send(...)` effects.** `send('CheckoutPaymentRequested', { … })`
  republishes an internal message onto the saga bus. It does not address `process-payment` or cross
  into the workers plugin. The trigger below owns that explicit cross-plugin enqueue boundary.
- **Compensation is an explicit effect and registered branch.** The forward `PaymentFailed`
  handler returns `sagaCompensate(...)`; the matching `.compensate('PaymentFailed', ...)` handler
  transitions the same state machine to `cancelled` and emits `OrderCancelled`.

{{ comp callout { type: "note", title: "The durable runtime wires compensation" } }}
An inbound <code>PaymentFailed</code> is first handled by <code>.on(...)</code>. Returning
<code>sagaCompensate(...)</code> from that handler is what routes execution into the matching
<code>.compensate(...)</code> branch. <code>createDurableSagaRuntime(...)</code> installs the
compensator by default; custom composition with lower-level <code>createSagaRuntime(...)</code>
must supply <code>native.compensator</code> explicitly.
{{ /comp }}

## Step 4 — Enqueue payment through the triggers API

Use the supported triggers action to turn checkout ingress into durable background work. The
generated `checkout-payment` webhook can be reduced to this definition (use a signed verifier for a
real public endpoint; `memory` keeps this local tutorial runnable):

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
  (event) => Promise.resolve([enqueueJob(processPaymentJob, { payload: event.payload })]),
  { id: 'checkout-payment', path: 'checkout/payment', verifier: 'memory' },
);
```

Post the same order payload to this webhook when you publish `OrderCreated`. The saga records and
emits its internal `CheckoutPaymentRequested` message; the trigger independently and durably
enqueues `process-payment`. This explicit choreography avoids pretending that a saga cascade is a
workers transport.

## Step 5 — Author the payment worker job

The trigger enqueues `process-payment`; the **worker job** does the work and reports back. It
publishes `PaymentCompleted` (or `PaymentFailed`) to the saga with `createSagaPublisher`, closing
the explicit cross-plugin choreography.

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

    // Tell the saga payment succeeded — it advances to inventory.
    await sagaPublisher.publish({ type: 'PaymentCompleted', payload: { orderId, transactionId } });

    return createSuccessResult({ orderId, transactionId, amount });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    // Tell the saga payment failed — its compensation branch cancels the order.
    await sagaPublisher.publish({ type: 'PaymentFailed', payload: { orderId, reason } });

    return createFailureResult(`${reason} (orderId: ${orderId})`);
  }
});

export default Object.assign(handler, { id: 'process-payment' });
```

The contract between the two halves is the **message type string**. The job publishes
`PaymentCompleted` / `PaymentFailed`; the saga `.on('PaymentCompleted', …)` and
`.on('PaymentFailed', …)` listen for exactly those. There is no shared function call — they are
isolated background processors joined only by the message traveling through the streams transport.
Keep the strings identical on both sides.

{{ comp.apiTable({ caption: "Worker job primitives (from @netscript/plugin-workers-core)", rows: [
  { name: "defineJobHandler(fn)", type: "define a job", desc: "Wraps an async handler that receives a typed ctx (payload, logging, tracing) and returns a result." },
  { name: "createSuccessResult(data)", type: "success", desc: "The handler's return for a completed job; carries result data." },
  { name: "createFailureResult(reason)", type: "failure", desc: "The handler's return for a failed job; the message string is recorded on the execution." },
  { name: "createSagaPublisher<M>()", type: "from @netscript/plugin-sagas/runtime", desc: "Publishes typed messages onto the saga bus so a running saga can react — how the job reports back." }
] }) }}

## Step 6 — Type-check the workflow

The Sagas API service lists sagas from a KV-backed registry, and the scaffold's saga runtime
registers your built definition on startup. Because `aspire start` already brings the sagas processor
and API up together, you do not start anything by hand — your saga is picked up when the orchestrated
app (re)starts. First, prove it compiles against the builder's generic signatures:

```sh
deno task check
```

A clean check means `defineSaga`, `.state()`, `.correlate()`, `.on()`, and `.build()` all line up
with the message and state types you declared, and that the worker job's publish calls match the saga
message types.

## Verify your progress

With Aspire up, confirm the saga registered through the **Sagas API on `:8092`**:

```sh
ns-sagas list --registered --json
```

You should see `CheckoutSaga` in the list, with `OrderCreated`, `PaymentCompleted`, and
`PaymentFailed` among its handled message types. Now drive an instance directly by publishing
messages to the saga bus — `ns-sagas publish` sends `{ type, payload }`, and the saga
correlates on `payload.orderId`. Start an order, then complete its payment:

```sh
# 1. Open the checkout — the saga records payment_pending and emits CheckoutPaymentRequested.
ns-sagas publish OrderCreated \
  --payload='{ "orderId": "ord_1001", "customerId": "cust_1001", "items": [{ "productId": "1", "quantity": 2 }], "total": 4999 }' \
  --correlation-key=ord_1001

# 2. Enqueue the process-payment worker through the supported triggers ingress.
curl -X POST http://localhost:8093/api/v1/webhooks/checkout/payment \
  -H 'content-type: application/json' \
  -d '{ "orderId": "ord_1001", "amount": 4999 }'

# 3. The worker publishes PaymentCompleted; this direct publish is a deterministic local stand-in.
ns-sagas publish PaymentCompleted \
  --payload='{ "orderId": "ord_1001", "transactionId": "txn_777" }' \
  --correlation-key=ord_1001
```

Inspect that instance and confirm it reached `paid`:

```sh
ns-sagas list --instances --saga=CheckoutSaga --json
```

Now prove **compensation**. Open a second order and fail its payment — the `PaymentFailed` branch
walks the state machine to `cancelled`:

```sh
ns-sagas publish OrderCreated \
  --payload='{ "orderId": "ord_2002", "customerId": "cust_2002", "items": [{ "productId": "1", "quantity": 1 }], "total": 1999 }' \
  --correlation-key=ord_2002

ns-sagas publish PaymentFailed \
  --payload='{ "orderId": "ord_2002", "reason": "card_declined" }' \
  --correlation-key=ord_2002

ns-sagas list --instances --saga=CheckoutSaga --json
```

The first instance shows `status: 'paid'` carrying its `transactionId`; the second shows
`status: 'cancelled'` carrying the `cancelReason` your compensation branch stamped. (The forward path
continues to `completed` once you also author the `reserve-inventory` and `create-shipment` jobs the
triggers boundary enqueues — saga `send(...)` cascades remain internal saga-bus messages. This track
stops at the payment leg, so `paid` is checkout's observable checkpoint.)

- [ ] The workers, sagas, triggers, and streams plugins are installed and registered.
- [ ] `checkout-saga.ts` defines state, a correlation key, the forward handlers, and a
      `PaymentFailed` compensation branch.
- [ ] `workers/jobs/process-payment.ts` publishes `PaymentCompleted` / `PaymentFailed` back to the
      saga.
- [ ] `triggers/checkout-payment-trigger.ts` enqueues `process-payment` with `enqueueJob(...)`.
- [ ] `ns-sagas list --registered --json` lists `CheckoutSaga`.
- [ ] Publishing `OrderCreated` + `PaymentCompleted` yields an instance at `status: 'paid'`;
      `PaymentFailed` yields one at `status: 'cancelled'`.
- [ ] `deno task check` passes.

{{ comp callout { type: "warning", title: "Durability is not free correctness" } }}
The durability tier persists instance state so a workflow survives a restart, but it does <strong>not</strong> dedupe inbound messages for you. That is why every handler above guards on <code>saga.state.status</code> before acting — a redelivered <code>PaymentCompleted</code> must not charge twice or double-advance. Make handlers idempotent; durability remembers state, it does not deduplicate delivery.
{{ /comp }}

## What you built

- The workers, sagas, triggers, and streams runtime plugins — the workflow, its explicit worker
  enqueue boundary, its jobs, and the transport between them.
- A `CheckoutSaga` built with `defineSaga().state().correlate().on().build()` — a durable state
  machine that walks order → payment → fulfillment, with a `PaymentFailed` **compensation branch**
  that cancels the order.
- A `process-payment` worker job (`defineJobHandler`, `createSuccessResult` / `createFailureResult`)
  that publishes results back to the saga with `createSagaPublisher`, closing the choreography.
- A workflow observable as instances on the Sagas API at `:8092`.

Checkout is now reliable: it survives restarts and undoes itself on failure. The last piece is letting
the outside world — a shipping or payment provider — tell your shop what happened, which you do with a
verified webhook next.

{{ comp.nextPrev({ prev: { label: "3 · Cart contracts", href: "/tutorials/storefront/03-cart-contracts/" }, next: { label: "5 · Shipping webhook", href: "/tutorials/storefront/05-shipping-webhook/" } }) }}
