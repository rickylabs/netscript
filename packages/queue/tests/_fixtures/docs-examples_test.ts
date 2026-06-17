import { assertEquals } from '@std/assert';
import { z } from 'zod';
import { MemoryQueueAdapter } from '../../testing/mod.ts';
import { withValidation } from '../../validation/mod.ts';

Deno.test('README typed queue example validates and processes a message', async () => {
  const MessageSchema = z.object({
    type: z.enum(['email', 'sms']),
    to: z.string(),
    body: z.string(),
  });
  type Message = z.infer<typeof MessageSchema>;
  const queue = new MemoryQueueAdapter<Message>();

  const processed: Message[] = [];
  const controller = new AbortController();
  const listening = queue.listen(
    withValidation(MessageSchema, async (message) => {
      processed.push(message);
      controller.abort();
      await Promise.resolve();
    }),
    { signal: controller.signal },
  );

  await queue.enqueue({
    type: 'email',
    to: 'user@example.com',
    body: 'Hello!',
  });
  await listening;

  assertEquals(processed, [{
    type: 'email',
    to: 'user@example.com',
    body: 'Hello!',
  }]);
});
