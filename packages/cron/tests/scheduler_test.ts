import { assertEquals, assertNotStrictEquals } from '@std/assert';
import { createScheduler, getScheduler, stopScheduler } from '../mod.ts';

Deno.test('createScheduler returns memory adapter when requested', () => {
  const scheduler = createScheduler({ provider: 'memory' });
  assertEquals(scheduler.provider, 'memory');
});

Deno.test('getScheduler returns a shared instance until stopped', async () => {
  const first = getScheduler({ provider: 'memory' });
  const second = getScheduler();

  assertEquals(first, second);

  await stopScheduler();

  const third = getScheduler({ provider: 'memory' });
  assertNotStrictEquals(first, third);

  await stopScheduler();
});
