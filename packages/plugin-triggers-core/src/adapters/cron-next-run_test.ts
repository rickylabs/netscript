import { assertEquals } from '@std/assert';
import { stub } from 'jsr:@std/testing@1/mock';
import { FakeTime } from 'jsr:@std/testing@1/time';
import { DenoCronAdapter } from '@netscript/cron/adapters';
import { defineScheduledTrigger } from '../builders/define-scheduled-trigger.ts';
import { CronTriggerSchedulerAdapter } from './cron-trigger-scheduler-adapter.ts';

Deno.test('scheduled hour-step trigger registers through the deno adapter without RangeError', async () => {
  using _time = new FakeTime('2026-10-09T10:17:43Z');
  using _cron = stub(Deno, 'cron', () => Promise.resolve());
  const adapter = new CronTriggerSchedulerAdapter({ schedulerOptions: { provider: 'deno' } });
  const definition = defineScheduledTrigger(() => Promise.resolve([]), {
    id: 'hour-step',
    cron: '0 */12 * * *',
    timezone: 'UTC',
  });
  try {
    const handle = await adapter.schedule(definition.id, definition, () => Promise.resolve());
    assertEquals(handle.nextFireAt, '2026-10-09T12:00:00.000Z');
    assertEquals((await adapter.get(definition.id))?.nextFireAt, handle.nextFireAt);
    assertEquals((await adapter.list())[0].nextFireAt, handle.nextFireAt);
  } finally {
    await adapter.stop();
  }
});

for (const nextRun of [null, new Date(NaN)]) {
  Deno.test(`trigger handles omit nextFireAt for ${nextRun === null ? 'null' : 'invalid'} dates`, async () => {
    using _cron = stub(Deno, 'cron', () => Promise.resolve());
    const adapter = new CronTriggerSchedulerAdapter({ schedulerOptions: { provider: 'deno' } });
    // Inject via the existing factory seam without widening the runtime scheduler's public type.
    const originalSchedule = DenoCronAdapter.prototype.schedule;
    using _schedule = stub(DenoCronAdapter.prototype, 'schedule', async function (...args) {
      const job = await originalSchedule.apply(this, args);
      job.nextRun = nextRun;
      return job;
    });
    const definition = defineScheduledTrigger(() => Promise.resolve([]), {
      id: 'unavailable',
      cron: '* * * * *',
    });
    try {
      const handle = await adapter.schedule(definition.id, definition, () => Promise.resolve());
      assertEquals(handle.nextFireAt, undefined);
      assertEquals((await adapter.get(definition.id))?.nextFireAt, undefined);
      assertEquals((await adapter.list())[0].nextFireAt, undefined);
    } finally {
      await adapter.stop();
    }
  });
}
