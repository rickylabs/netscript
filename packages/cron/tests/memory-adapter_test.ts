import { assert, assertEquals, assertRejects } from '@std/assert';
import { MemoryCronAdapter } from '../adapters/memory.adapter.ts';
import type { JobRunEvent } from '../ports/types.ts';

Deno.test('MemoryCronAdapter schedules, triggers, and tracks runs', async () => {
  const scheduler = new MemoryCronAdapter();
  const events: JobRunEvent[] = [];

  scheduler.on('jobRun', (event) => {
    events.push(event);
  });

  const job = await scheduler.schedule('cleanup', '* * * * *', async () => {});

  assertEquals(job.id, 'cleanup');
  assertEquals(scheduler.list().length, 1);
  assertEquals(scheduler.get('cleanup')?.runCount, 0);

  const triggered = await scheduler.trigger('cleanup');

  assert(triggered);
  assertEquals(scheduler.get('cleanup')?.runCount, 1);
  assertEquals(events.length, 1);

  await scheduler.stop();
});

Deno.test('MemoryCronAdapter emits jobError and records lastError', async () => {
  const scheduler = new MemoryCronAdapter();
  const events: JobRunEvent[] = [];

  scheduler.on('jobError', (event) => {
    events.push(event);
  });

  await scheduler.schedule('fails', '* * * * *', () => {
    throw new Error('boom');
  });

  const triggered = await scheduler.trigger('fails');

  assertEquals(triggered, false);
  assertEquals(events.length, 1);
  assertEquals(events[0].result.error?.message, 'boom');
  assertEquals(scheduler.get('fails')?.lastError, 'boom');

  await scheduler.stop();
});

Deno.test('MemoryCronAdapter enable and disable toggles job state', async () => {
  const scheduler = new MemoryCronAdapter();

  await scheduler.schedule('toggle', '*/5 * * * *', async () => {}, {
    enabled: false,
  });

  assertEquals(scheduler.get('toggle')?.enabled, false);

  assertEquals(await scheduler.enable('toggle'), true);
  assertEquals(scheduler.get('toggle')?.enabled, true);

  assertEquals(await scheduler.disable('toggle'), true);
  assertEquals(scheduler.get('toggle')?.enabled, false);

  await scheduler.stop();
});

Deno.test('MemoryCronAdapter rejects invalid expressions', async () => {
  const scheduler = new MemoryCronAdapter();

  await assertRejects(
    () => scheduler.schedule('invalid', 'bad cron', async () => {}),
    Error,
    'Invalid cron expression',
  );
});
