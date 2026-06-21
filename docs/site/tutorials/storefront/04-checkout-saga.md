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
  { label: "6 · Deploy", href: "/tutorials/storefront/06-deploy/" }
] }) }}

## What you will build

You will add the official `sagas` plugin, then author a `CheckoutSaga` with `defineSaga(...)`: typed
per-instance state, a correlation key, and message handlers that walk a checkout from
`OrderCreated` → payment → inventory → shipment to completion. You will also author the
`process-payment` worker job that the saga drives, and you will wire the **failure path** so a
declined payment cancels the order instead of stranding it. By the end you can drive a checkout to
completion and watch a failure compensate, all observable on the Sagas API at `:8092`.

## Before you begin

You should have finished [chapter 3](/tutorials/storefront/03-cart-contracts/), so:

- `my-shop/` has the `products` service and the `cart` contract.
- `aspire run` is up (the dashboard answers at [http://localhost:18888](http://localhost:18888)).
  The saga registry and durable instance store both depend on Aspire-managed resources — Deno KV for
  the registry, and either KV or Postgres for instance state.

{{ comp callout { type: "important", title: "Aspire must already be running" } }}
The Sagas API service and its KV-backed registry come up as part of the orchestrated app. If you closed your <code>aspire run</code> terminal, restart it from the <code>aspire/</code> folder (<code>cd aspire &amp;&amp; aspire run</code>) <strong>before</strong> running any <code>netscript</code> command in this chapter — the durable store and registry only exist while Aspire is up.
{{ /comp }}

## Step 1 — Add the sagas plugin

Sagas ship as an official NetScript plugin. Add it from the project root, with its sample saga
included so you have a working module to adapt:

```sh
netscript plugin add saga --samples
```

The plugin lands at the canonical location **`plugins/sagas/`**, and `netscript.config.ts` is updated
to reference `./plugins/sagas/mod.ts`. A slimmer top-level `sagas/` directory is also created as the
background-processor staging copy — you author against `plugins/sagas/`. Adding `saga` also pulls in
its `streams` dependency, which is how cross-plugin messages travel.

Confirm it registered:

```sh
netscript plugin list
```

You should see `sagas` in the list.

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

The other primitive you need is **`send(target, payload)`** — also from `@netscript/plugin-sagas-core`
— which a handler returns to drive the next step: it sends a command (to a worker job) or emits an
event. Handlers return an **array** of these effects.

## Step 3 — Author the checkout saga

Now write the saga. It correlates by `orderId`, starts `pending`, and walks the lifecycle. Crucially,
it has explicit **failure branches**: if payment fails or inventory is unavailable, it transitions to
`cancelled` and emits a cancellation — this is compensation. Open the sample under `plugins/sagas/`
and replace it:

```ts
// plugins/sagas/checkout-saga.ts
import { defineSaga, send } from '@netscript/plugin-sagas-core';
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

  // OrderCreated → charge the card via the process-payment worker job.
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
    return [send('process-payment', { orderId: msg.orderId, amount: msg.total })];
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

  // === Compensation: PaymentFailed → cancel the order. ===
  .on('PaymentFailed', (saga, event) => {
    if (saga.state.status !== 'payment_pending') return [];
    const msg = event.payload as { reason: string };
    saga.state = { ...saga.state, status: 'cancelled', cancelReason: `Payment failed: ${msg.reason}` };
    return [send('OrderCancelled', { orderId: saga.state.orderId, reason: msg.reason })];
  })

  .build();

export default checkoutSaga;
```

Read the shape, not the line count:

- **State is a typed state machine.** `status` is a union; every handler guards on it
  (`if (saga.state.status !== 'paid') return []`) so a redelivered or out-of-order message is a
  no-op, not a corruption. [Durable workflows are state machines](/explanation/durability-model/) is a
  NetScript axiom, not a slogan.
- **Steps are driven by `send(...)` effects.** A handler does not call the payment service directly —
  it returns `send('process-payment', { … })`, and the runtime delivers that command to the worker
  job. This is what lets the workflow be paused, checkpointed, and resumed.
- **Compensation is a failure branch.** The `PaymentFailed` handler is the undo path: it transitions
  the same state machine to `cancelled` and emits `OrderCancelled`. The scaffolded order saga in the
  playground models compensation exactly this way — as failure-event handlers that walk the state
  machine backward.

{{ comp callout { type: "note", title: "Two ways to express compensation" } }}
The builder also exposes a dedicated <code>.compensate(eventType, handler)</code> method — same handler shape as <code>.on()</code>, but registered as the compensation path for a failed event type. You can write <code>.compensate('PaymentFailed', ...)</code> instead of an <code>.on('PaymentFailed', ...)</code> branch to make the undo intent explicit in the chain. The playground's order saga uses plain <code>.on()</code> failure handlers; both compile and both run. Choose the one that reads clearest for your team — see <a href="/explanation/durability-model/">Durability model</a>.
{{ /comp }}

## Step 4 — Author the payment worker job

The saga `send`s a `process-payment` command; a **worker job** is what actually does the work and
reports back. The job processes the payment, then publishes `PaymentCompleted` (or `PaymentFailed`)
back to the saga. This is the half of the choreography that closes the loop.

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

## Step 5 — Type-check the workflow

The Sagas API service lists sagas from a KV-backed registry, and the scaffold's saga runtime
registers your built definition on startup. Because `aspire run` already brings the sagas processor
and API up together, you do not start anything by hand — your saga is picked up when the orchestrated
app (re)starts. First, prove it compiles against the builder's generic signatures:

```sh
deno task check
```

A clean check means `defineSaga`, `.state()`, `.correlate()`, `.on()`, and `.build()` all line up
with the message and state types you declared, and that the worker job's publish calls match the saga
message types.

## Verify your progress

With Aspire up, confirm the saga registered. Against the **Sagas API on `:8092`**:

```sh
curl http://localhost:8092/api/v1/sagas/sagas
```

You should see `CheckoutSaga` in the list, with `OrderCreated`, `PaymentCompleted`, and
`PaymentFailed` among its handled message types. After driving a checkout through the orchestrated
app, inspect the resulting instances:

```sh
curl http://localhost:8092/api/v1/sagas/instances
```

A completed checkout shows an instance at `status: 'completed'` carrying its `transactionId`; a
failed payment shows one at `status: 'cancelled'` carrying the `cancelReason` your compensation
branch stamped.

- [ ] `netscript plugin add saga --samples` landed `plugins/sagas/`.
- [ ] `checkout-saga.ts` defines state, a correlation key, the forward handlers, and a
      `PaymentFailed` compensation branch.
- [ ] `workers/jobs/process-payment.ts` publishes `PaymentCompleted` / `PaymentFailed` back to the
      saga.
- [ ] `GET /api/v1/sagas/sagas` lists `CheckoutSaga`.
- [ ] `deno task check` passes.

{{ comp callout { type: "warning", title: "Durability is not free correctness" } }}
The durability tier persists instance state so a workflow survives a restart, but it does <strong>not</strong> dedupe inbound messages for you. That is why every handler above guards on <code>saga.state.status</code> before acting — a redelivered <code>PaymentCompleted</code> must not charge twice or double-advance. Make handlers idempotent; durability remembers state, it does not deduplicate delivery.
{{ /comp }}

## What you built

- The `sagas` plugin at `plugins/sagas/`, added with `netscript plugin add saga --samples`.
- A `CheckoutSaga` built with `defineSaga().state().correlate().on().build()` — a durable state
  machine that walks order → payment → inventory → shipment, with a `PaymentFailed` **compensation
  branch** that cancels the order.
- A `process-payment` worker job (`defineJobHandler`, `createSuccessResult` / `createFailureResult`)
  that publishes results back to the saga with `createSagaPublisher`, closing the choreography.
- A workflow observable as instances on the Sagas API at `:8092`.

Checkout is now reliable: it survives restarts and undoes itself on failure. The last piece is letting
the outside world — a shipping or payment provider — tell your shop what happened, which you do with a
verified webhook next.

{{ comp.nextPrev({ prev: { label: "3 · Cart contracts", href: "/tutorials/storefront/03-cart-contracts/" }, next: { label: "5 · Shipping webhook", href: "/tutorials/storefront/05-shipping-webhook/" } }) }}
