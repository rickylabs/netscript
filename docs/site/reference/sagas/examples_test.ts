import { assertEquals } from '@std/assert';
import { defineSaga, send, type SagaState } from '@netscript/plugin-sagas-core';
import { createTestSagaRuntime } from '@netscript/plugin-sagas-core/testing';

Deno.test('Saga testing with createTestSagaRuntime and controllable clock', async () => {
  const runtime = createTestSagaRuntime();

  // Define a simple saga using the recommended SagaState type for registration compatibility
  const checkoutSaga = defineSaga('CheckoutSaga')
    .state<SagaState>({ orderId: '', total: 0, status: 'pending' })
    .on<string, unknown>('OrderCreated', (saga, event) => {
      const payload = event.payload as { orderId: string; total: number };
      saga.state = {
        ...saga.state,
        orderId: payload.orderId,
        total: payload.total,
        status: 'processing',
      };
      return [send('PaymentRequested', { orderId: payload.orderId, total: payload.total })];
    })
    .build();

  // Start the test runtime
  await runtime.start();
  await runtime.register([checkoutSaga]);

  // Publish a starting event
  const event = {
    type: 'OrderCreated',
    payload: { orderId: 'ord_123', total: 500 },
  };
  await runtime.publish(event);

  // Assert that the message was recorded on the test bus
  const published = runtime.bus.published();
  assertEquals(published.length, 1);
  assertEquals(published[0].message.type, 'OrderCreated');
  assertEquals(published[0].message.payload, { orderId: 'ord_123', total: 500 });

  // Controllable clock assertion
  // The test saga clock starts at a default time, and sleep advances it.
  assertEquals(runtime.clock.now().toISOString(), '2026-01-01T00:00:00.000Z');
  
  await runtime.clock.sleep(500);
  assertEquals(runtime.clock.now().toISOString(), '2026-01-01T00:00:00.500Z');
  assertEquals(runtime.clock.sleeps(), [500]);

  // Stop the runtime
  await runtime.stop();
});
