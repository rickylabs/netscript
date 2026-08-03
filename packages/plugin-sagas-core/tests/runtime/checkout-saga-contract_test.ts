import { assertEquals, assertRejects } from '@std/assert';

import { defineSaga, send, spawn } from '../../mod.ts';
import type { CascadedMessage, SagaState } from '../../src/domain/mod.ts';
import { SagasError } from '../../src/domain/mod.ts';
import { createSagaEngine, createSagaRuntime } from '../../src/runtime/mod.ts';

Deno.test('checkout tutorial sends and delivers only internal saga messages', async () => {
  const delivered: string[] = [];
  const engine = createSagaEngine();
  const runtime = createSagaRuntime({ native: { engine } });
  const checkout = defineSaga('CheckoutSaga')
    .state<SagaState>({ orderId: '', status: 'pending' })
    .on<string, unknown>('OrderCreated', (saga, event) => {
      const payload = event.payload as { orderId: string; total: number };
      saga.state = {
        ...saga.state,
        orderId: payload.orderId,
        status: 'payment_pending',
      };
      return [send('CheckoutPaymentRequested', payload)];
    })
    .on<string, unknown>(
      'CheckoutPaymentRequested',
      (_saga, event) => {
        delivered.push(event.type);
        return [];
      },
    )
    .on<string, unknown>(
      'PaymentCompleted',
      (saga, event) => {
        saga.state = { ...saga.state, status: 'paid' };
        const payload = event.payload as { orderId: string };
        return [send('InventoryReservationRequested', { orderId: payload.orderId })];
      },
    )
    .on<string, unknown>(
      'InventoryReservationRequested',
      (_saga, event) => {
        delivered.push(event.type);
        return [];
      },
    )
    .on<string, unknown>(
      'PaymentFailed',
      (saga, event) => {
        saga.state = { ...saga.state, status: 'cancelled' };
        return [send('OrderCancelled', event.payload)];
      },
    )
    .on<string, unknown>(
      'OrderCancelled',
      (_saga, event) => {
        delivered.push(event.type);
        return [];
      },
    )
    .build();

  await runtime.start();
  try {
    await runtime.register([checkout]);
    const opened = await engine.handle({
      type: 'OrderCreated',
      payload: { orderId: 'ord_1001', total: 4999 },
    });
    assertEquals(opened[0].cascaded, [
      send('CheckoutPaymentRequested', { orderId: 'ord_1001', total: 4999 }),
    ]);
    await runtime.dispatchCascaded(opened[0].cascaded);

    const paid = await engine.handle({
      type: 'PaymentCompleted',
      payload: { orderId: 'ord_1001', transactionId: 'txn_777' },
    });
    assertEquals(paid[0].cascaded, [
      send('InventoryReservationRequested', { orderId: 'ord_1001' }),
    ]);
    await runtime.dispatchCascaded(paid[0].cascaded);

    const failed = await engine.handle({
      type: 'PaymentFailed',
      payload: { orderId: 'ord_2002', reason: 'card_declined' },
    });
    assertEquals(failed[0].cascaded, [
      send('OrderCancelled', { orderId: 'ord_2002', reason: 'card_declined' }),
    ]);
    await runtime.dispatchCascaded(failed[0].cascaded);

    assertEquals(delivered, [
      'CheckoutPaymentRequested',
      'InventoryReservationRequested',
      'OrderCancelled',
    ]);
  } finally {
    await runtime.stop('checkout contract test complete');
  }
});

Deno.test('dispatching spawn rejects with the documented unsupported error', async () => {
  const runtime = createSagaRuntime();
  const error = await assertRejects(
    () => runtime.dispatchCascaded([spawn('ChildSaga', {})]),
    SagasError,
    'Spawn cascades are unsupported.',
  );

  assertEquals(error.code, 'SAGA_NOT_IMPLEMENTED');
});

Deno.test('dispatching an unknown cascade kind fails loudly with the effect name', async () => {
  const runtime = createSagaRuntime();
  const messages: CascadedMessage[] = JSON.parse('[{"kind":"mystery"}]');
  const error = await assertRejects(
    () => runtime.dispatchCascaded(messages),
    SagasError,
    'Unhandled saga cascade effect kind "mystery"; no dispatcher option is registered.',
  );

  assertEquals(error.code, 'SAGA_NOT_IMPLEMENTED');
});
