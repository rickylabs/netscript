import { assertEquals, assertRejects } from '@std/assert';
import { z } from 'zod';
import { createTypedQueue } from '../factory/create-typed-queue.ts';
import { QueueProvider, QueueValidationError } from '../ports/mod.ts';

Deno.test('createTypedQueue exposes the schema and native retrial flag', () => {
  const schema = z.object({ id: z.string() });
  const queue = createTypedQueue('jobs', schema, {
    provider: QueueProvider.Postgres,
  });

  assertEquals(queue.schema, schema);
  assertEquals(queue.nativeRetrial, false);
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
