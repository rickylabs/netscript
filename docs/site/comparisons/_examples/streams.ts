import { createServiceStreamProducer } from '@netscript/plugin-streams-core';
import { schema } from './schema.ts';

const producer = createServiceStreamProducer({
  streamPath: '/ops/orders',
  schema,
  producerId: 'orders-service',
});

export async function publishOrder(id: string, status: string) {
  producer.upsert('order', { id, status });
  await producer.flush();
}
