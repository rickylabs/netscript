import { assert, assertEquals } from '@std/assert';
import { stub } from 'jsr:@std/testing@1/mock';
import { FakeTime } from 'jsr:@std/testing@1/time';
import { DenoCronAdapter } from '../adapters/deno.adapter.ts';
import { MemoryCronAdapter } from '../adapters/memory.adapter.ts';
import type { ContextualJobHandler, ScheduleOptions } from '../ports/types.ts';

const BACKOFF_MS = 25;

interface RegisteredRetryRun {
  invoke(): Promise<unknown>;
  stop(): Promise<void>;
}

type RegisterRetryRun = (
  handler: ContextualJobHandler,
  options: ScheduleOptions,
) => Promise<RegisteredRetryRun>;

async function assertConfiguredRetry(register: RegisterRetryRun): Promise<void> {
  using time = new FakeTime('2026-08-04T12:00:00Z');
  const attempts: number[] = [];
  const run = await register((context) => {
    attempts.push(context.attempt);
    if (context.attempt === 0) {
      throw new Error('retry me');
    }
  }, {
    maxRetries: 1,
    backoff: { type: 'fixed', initialDelay: BACKOFF_MS },
  });

  try {
    const execution = run.invoke();
    await time.tickAsync(BACKOFF_MS);
    await execution;

    assertEquals(attempts, [0, 1]);
  } finally {
    await run.stop();
  }
}

Deno.test('MemoryCronAdapter retries with configured backoff and increments attempt', async () => {
  await assertConfiguredRetry(async (handler, options) => {
    const scheduler = new MemoryCronAdapter();
    await scheduler.schedule('memory-retry', '* * * * *', handler, options);

    return {
      invoke: () => scheduler.trigger('memory-retry'),
      stop: () => scheduler.stop(),
    };
  });
});

Deno.test('DenoCronAdapter retries with configured backoff and increments attempt', async () => {
  await assertConfiguredRetry(async (handler, options) => {
    const scheduler = new DenoCronAdapter();
    let cronCallback: (() => void | Promise<void>) | undefined;

    using _cron = stub(Deno, 'cron', (_name, _schedule, _options, callback) => {
      cronCallback = callback;
      return Promise.resolve();
    });

    await scheduler.schedule('deno-retry', '* * * * *', handler, options);
    assert(cronCallback);
    const invokeCron = cronCallback;

    return {
      invoke: async () => await invokeCron(),
      stop: () => scheduler.stop(),
    };
  });
});
