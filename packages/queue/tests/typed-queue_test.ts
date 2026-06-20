import { assertEquals, assertRejects } from '@std/assert';
import { delay } from '@std/async';
import { z } from 'zod';
import { createTypedQueue } from '../factory/create-typed-queue.ts';
import { QueueProvider, QueueValidationError } from '../ports/mod.ts';
import { MemoryDeadLetterStore } from '../testing/mod.ts';

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

Deno.test('createTypedQueue sends invalid dequeue messages to the configured DLQ store', async () => {
  const schema = z.object({ id: z.string() });
  const deadLetters = new MemoryDeadLetterStore<unknown>();
  const queue = createTypedQueue('typed-dlq', schema, {
    provider: QueueProvider.DenoKv,
    autoDiscover: false,
    validateOnEnqueue: false,
    onValidationError: 'dlq',
    connection: { denoKv: { path: ':memory:' } },
    deadLetterStore: deadLetters,
    disableAutoTracing: true,
  });

  await queue.enqueue({ id: 123 } as never);
  const controller = new AbortController();
  const listening = queue.listen(() => {
    throw new Error('handler should not receive invalid message');
  }, { signal: controller.signal });

  for (let attempt = 0; attempt < 20 && await deadLetters.depth() === 0; attempt++) {
    await delay(10);
  }
  controller.abort();
  await listening;
  await queue.stop();

  const records = await deadLetters.list();
  assertEquals(records.length, 1);
  assertEquals(records[0].reason, 'validation_failed');
  assertEquals(records[0].errorCode, 'VALIDATION_ERROR');
});
