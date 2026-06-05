# Authoring Sagas

Saga authoring uses one public DSL:

```ts
defineSaga(id).state(initialState).on(messageType, handler).build();
```

The chain is deliberately narrow. It gives application authors a stable syntax while keeping the
definition value owned by the core package. Do not expose a public flat object factory from consumer
code or plugin code.

## Basic Shape

```ts
import { defineSaga, sagaComplete, send } from '@netscript/plugin-sagas-core';

type State = {
  phase: 'waiting' | 'shipping' | 'complete';
};

type OrderPaidPayload = {
  orderId: string;
  customerId: string;
};

export const orderSaga = defineSaga('order-fulfillment')
  .state<State>({ phase: 'waiting' })
  .on<'OrderPaid', OrderPaidPayload>('OrderPaid', (saga, event) => {
    saga.state.phase = 'shipping';

    return [
      send('reserve-inventory', { orderId: event.payload.orderId }, {
        idempotencyKey: `inventory:${event.payload.orderId}`,
        concurrencyKey: `customer:${event.payload.customerId}`,
      }),
    ];
  })
  .on('InventoryReserved', (saga) => {
    saga.state.phase = 'complete';
    return [sagaComplete()];
  })
  .build();
```

`.state()` must appear before `.on()`. `.build()` produces the definition consumed by runtime
composition, tests, and presets.

## Cascaded Messages

Handlers return cascaded messages rather than calling transports directly:

- `send(target, payload, options)` emits a message or command.
- `schedule(message, delay)` schedules a future message.
- `spawn(childSaga, input, options)` starts a child saga.
- `sagaComplete(result)` marks the current saga successful.
- `sagaFail(reason)` marks the current saga failed.
- `sagaCompensate(message, reason)` requests compensation.

Every cascaded message that can leave the current saga accepts first-class idempotency and
concurrency keys where appropriate. Prefer deterministic keys derived from business identifiers:

```ts
send('charge-payment', { orderId }, {
  idempotencyKey: `payment:${orderId}`,
  concurrencyKey: `order:${orderId}`,
});
```

## Compensation

Use compensation handlers for effects that need an explicit rollback path:

```ts
type PaymentState = {
  charged: boolean;
};

export const paymentSaga = defineSaga('payment')
  .state<PaymentState>({ charged: false })
  .on('ChargeRequested', (saga, event) => {
    saga.state.charged = true;
    return [send('charge-card', event)];
  })
  .compensate('ChargeRequested', (_saga, event) => {
    return [send('refund-card', event)];
  })
  .build();
```

Compensation is part of the definition. Runtime implementations decide when to invoke it through the
bus adapter and compensator.

## Signals And Queries

Signals and queries are reserved public syntax:

```ts
import { defineQuery, defineSaga, defineSignal } from '@netscript/plugin-sagas-core';

const approve = defineSignal<{ approverId: string }, 'ApproveOrder'>('ApproveOrder');
const status = defineQuery<{ phase: string }, 'OrderStatus'>('OrderStatus');

export const approvalSaga = defineSaga('order-approval')
  .state<{ phase: string }>({ phase: 'waiting' })
  .on('ApprovalRequested', () => [])
  .onSignal(approve, (saga, payload) => {
    saga.state.phase = `approved:${payload.approverId}`;
  })
  .onQuery(status, (saga) => ({ phase: saga.state.phase }))
  .build();
```

Dispatch support is intentionally deferred to Phase 7d. Runtime calls to `signal()` and `query()`
throw `SagasError.notImplemented()` in the current Group E runtime.

## Config-Time DSL

Application configuration uses a separate builder from the `./config` subpath:

```ts
import { defineSagaConfig } from '@netscript/plugin-sagas-core/config';

export const sagaConfig = defineSagaConfig('order-fulfillment', './sagas/order.ts')
  .group('orders')
  .topic('orders.paid')
  .build();
```

Keep this separate from userland saga authoring. `defineSagaConfig()` describes discovery and
configuration metadata; `defineSaga()` describes executable saga behavior.
