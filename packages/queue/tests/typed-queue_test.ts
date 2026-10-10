import { assertEquals, assertRejects } from '@std/assert';
import { z } from 'zod';
import { createTypedQueue } from '../factory/create-typed-queue.ts';
import { QueueProvider, QueueValidationError } from '../ports/mod.ts';
import { typedDlqDrain, typedDlqRedelivery } from './_fixtures/typed-dlq.ts';

Deno.test('createTypedQueue exposes the schema and native retrial flag', () => {
  const schema = z.object({ id: z.string() });
  const queue = createTypedQueue('jobs', schema, {
    provider: QueueProvider.Postgres,
  });

  assertEquals(queue.schema, schema);
  assertEquals(queue.nativeRetrial, true);
});

Deno.test('createTypedQueue rejects invalid messages before touching the backend', async () => {
  const schema = z.object({ id: z.string() });
  const queue = createTypedQueue('jobs', schema, {
    provider: QueueProvider.Postgres,
  });

  await assertRejects(
    () => queue.enqueue({ id: 123 } as never),
    QueueValidationError,
    'Message validation failed on enqueue',
  );
});

Deno.test(
  'createTypedQueue sends invalid dequeue messages to the configured DLQ store',
  typedDlqDrain,
);

for (const backend of ['memory', 'kv'] as const) {
  Deno.test(`createTypedQueue ${backend} DLQ deduplicates native redelivery across abort`, () =>
    typedDlqRedelivery(backend));
}
