import { assert, assertEquals } from '@std/assert';
import { delay } from 'jsr:@std/async@^1';
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

Deno.test('real cron provider gives repeated fireNow calls and separate processors one minute identity', async () => {
  // Avoid crossing a wall-clock minute while exercising real provider timestamps.
  const remainingMs = 60_000 - Date.now() % 60_000;
  if (remainingMs < 1_000) await delay(remainingMs + 1);
  const adapters = [0, 1].map(() =>
    new CronTriggerSchedulerAdapter({ schedulerOptions: { provider: 'memory' } })
  );
  const events: TriggerEvent<'scheduled'>[] = [];
  const id = 'real-provider' as TriggerId;
  try {
    for (const adapter of adapters) {
      await adapter.schedule(id, { cron: '* * * * *', timezone: 'UTC' }, (event) => {
        events.push(event);
        return Promise.resolve();
      });
    }
    assert(await adapters[0].fireNow(id));
    await delay(5);
    assert(await adapters[0].fireNow(id));
    await delay(5);
    assert(await adapters[1].fireNow(id));

    assertEquals(events.length, 3);
    assertEquals(new Set(events.map((event) => event.detectedAt)).size, 3);
    assertEquals(new Set(events.map((event) => event.id)).size, 1);
    for (const event of events) {
      assertEquals(event.idempotencyKey, event.id);
      assert('scheduledAt' in event.payload);
      assertEquals(event.payload.scheduledAt.slice(-7), '00.000Z');
    }
  } finally {
    await Promise.all(adapters.map((adapter) => adapter.stop()));
  }
});
