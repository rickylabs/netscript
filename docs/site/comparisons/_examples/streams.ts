import { createServiceStreamProducer } from '@netscript/plugin-streams-core';
import { createStateSchema } from '@durable-streams/state';
import { z } from 'zod';

export const schema = createStateSchema({
  order: {
    schema: z.object({ id: z.string(), status: z.string() }),
    type: 'order',
    primaryKey: 'id',
  },
});
const producer = createServiceStreamProducer({
  streamPath: '/ops/orders',
  schema,
  producerId: 'orders-service',
});

export async function publishOrder(id: string, status: string) {
  producer.upsert('order', { id, status });
  await producer.flush();
}
