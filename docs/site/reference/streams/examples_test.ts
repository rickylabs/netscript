import { assertEquals, assertExists } from '@std/assert';
import { MemoryStreamProducer } from '@netscript/plugin-streams-core/testing';
import { createStreamsInstrumentation } from '@netscript/plugin-streams-core/telemetry';

Deno.test('stream socket-free testing with MemoryStreamProducer and telemetry facade', async () => {
  // 1. Socket-free testing using MemoryStreamProducer
  const producer = new MemoryStreamProducer();

  // Publish some mock events
  producer.upsert('orders', { id: 'order_123', total: 100 });
  producer.delete('orders', 'order_123');
  await producer.flush();

  // Assert events are recorded synchronously in memory without network sockets
  assertEquals(producer.events(), [
    {
      entityType: 'orders',
      operation: 'upsert',
      key: 'order_123',
      value: { id: 'order_123', total: 100 },
    },
    {
      entityType: 'orders',
      operation: 'delete',
      key: 'order_123',
    },
  ]);

  await producer.close();

  // 2. Using the Telemetry Facade to publish and inject trace context
  const telemetry = createStreamsInstrumentation();
  let traceHeaders: Record<string, string> = {};

  telemetry.publish({
    streamPath: '/orders/updates',
    collection: 'orders',
    operation: 'upsert',
    producerId: 'orders-service',
    messageId: 'order_123',
    emit: (headers) => {
      traceHeaders = headers;
    },
  });

  // Assert traceparent is generated and injected by the telemetry facade
  assertExists(traceHeaders.traceparent);
});
