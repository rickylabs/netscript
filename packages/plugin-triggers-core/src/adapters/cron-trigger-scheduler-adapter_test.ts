import { assert, assertEquals } from '@std/assert';
import type { TriggerEvent, TriggerId } from '../domain/mod.ts';
import {
  CronTriggerSchedulerAdapter,
  type RuntimeCronJobContext,
  type RuntimeCronScheduler,
} from './cron-trigger-scheduler-adapter.ts';

Deno.test('CronTriggerSchedulerAdapter forwards the cron attempt to scheduled events', async () => {
  let cronHandler: ((context: RuntimeCronJobContext) => void | Promise<void>) | undefined;
  const scheduler: RuntimeCronScheduler = {
    schedule: (_id, _cron, handler) => {
      cronHandler = handler;
      return Promise.resolve({ enabled: true });
    },
    unschedule: () => Promise.resolve(false),
    get: () => undefined,
    disable: () => Promise.resolve(false),
    enable: () => Promise.resolve(false),
    trigger: () => Promise.resolve(false),
    stop: () => Promise.resolve(),
  };
  const adapter = new CronTriggerSchedulerAdapter({ scheduler });
  const events: TriggerEvent<'scheduled'>[] = [];

  await adapter.schedule(
    'retry-consumer' as TriggerId,
    { cron: '* * * * *', timezone: 'UTC' },
    (event) => {
      events.push(event);
      return Promise.resolve();
    },
  );

  assert(cronHandler);
  await cronHandler({
    scheduledTime: new Date('2026-08-04T12:00:00Z'),
    actualTime: new Date('2026-08-04T12:00:01Z'),
    attempt: 2,
  });

  assertEquals(events.length, 1);
  assertEquals(events[0].attempt, 2);
  assertEquals(events[0].payload, {
    scheduledAt: '2026-08-04T12:00:00.000Z',
    firedAt: '2026-08-04T12:00:01.000Z',
    cron: '* * * * *',
    timezone: 'UTC',
  });
});
