import { assert, assertEquals } from '@std/assert';
import { stub } from 'jsr:@std/testing@1/mock';
import { FakeTime } from 'jsr:@std/testing@1/time';
import { DenoCronAdapter } from '../adapters/deno.adapter.ts';
import { MemoryCronAdapter } from '../adapters/memory.adapter.ts';
import type { CronScheduler } from '../ports/scheduler.ts';
import type {
  BackoffStrategy,
  ContextualJobHandler,
  JobRunEvent,
  ScheduledJob,
  ScheduleOptions,
} from '../ports/types.ts';

const PROVIDERS = ['memory', 'deno'] as const;
type Provider = (typeof PROVIDERS)[number];

interface RegisteredRun {
  readonly scheduler: CronScheduler;
  readonly job: ScheduledJob;
  invoke(): Promise<unknown>;
  abort(): Promise<boolean>;
  stop(): Promise<void>;
}

interface BackoffCase {
  readonly name: string;
  readonly backoff: BackoffStrategy;
  readonly waits: readonly number[];
}

let registrationSequence = 0;

async function registerRun(
  provider: Provider,
  handler: ContextualJobHandler,
  options?: ScheduleOptions,
): Promise<RegisteredRun> {
  const id = `${provider}-retry-${++registrationSequence}`;

  if (provider === 'memory') {
    const scheduler = new MemoryCronAdapter();
    const job = await scheduler.schedule(id, '* * * * *', handler, options);
    return {
      scheduler,
      job,
      invoke: () => scheduler.trigger(id),
      abort: () => scheduler.unschedule(id),
      stop: () => scheduler.stop(),
    };
  }

  const scheduler = new DenoCronAdapter();
  let cronCallback: (() => void | Promise<void>) | undefined;

  using _cron = stub(Deno, 'cron', (_name, _schedule, _options, callback) => {
    cronCallback = callback;
    return Promise.resolve();
  });

  const job = await scheduler.schedule(id, '* * * * *', handler, options);
  assert(cronCallback);
  const invokeCron = cronCallback;

  return {
    scheduler,
    job,
    invoke: async () => await invokeCron(),
    abort: () => scheduler.unschedule(id),
    stop: () => scheduler.stop(),
  };
}

async function advanceBackoffs(time: FakeTime, waits: readonly number[]): Promise<void> {
  for (const wait of waits) {
    await time.tickAsync(wait);
    await time.runMicrotasks();
  }
}

function cumulativeTimestamps(waits: readonly number[]): number[] {
  let elapsed = 0;
  return [0, ...waits.map((wait) => elapsed += wait)];
}

for (const provider of PROVIDERS) {
  Deno.test(`${provider} retries to success with aggregate invocation semantics`, async () => {
    using time = new FakeTime('2026-08-04T12:00:00Z');
    const attempts: number[] = [];
    const jobRuns: JobRunEvent[] = [];
    const jobErrors: JobRunEvent[] = [];
    const run = await registerRun(provider, (context) => {
      attempts.push(context.attempt);
      if (context.attempt < 2) {
        throw new Error(`boom ${context.attempt}`);
      }
    }, {
      maxRetries: 2,
      backoff: { type: 'fixed', initialDelay: 10 },
    });

    run.scheduler.on('jobRun', (event) => {
      jobRuns.push(event);
    });
    run.scheduler.on('jobError', (event) => {
      jobErrors.push(event);
    });

    try {
      const execution = run.invoke();
      await advanceBackoffs(time, [10, 10]);
      await execution;

      assertEquals(attempts, [0, 1, 2]);
      assertEquals(jobRuns.length, 1);
      assertEquals(jobErrors.length, 0);
      assertEquals(jobRuns[0].result.attempt, 2);
      assertEquals(run.job.runCount, 1);
      assertEquals(run.job.lastError, undefined);
    } finally {
      await run.stop();
    }
  });

  Deno.test(`${provider} reports exhausted retries once at the terminal attempt`, async () => {
    using time = new FakeTime('2026-08-04T12:00:00Z');
    const attempts: number[] = [];
    const jobRuns: JobRunEvent[] = [];
    const jobErrors: JobRunEvent[] = [];
    const run = await registerRun(provider, (context) => {
      attempts.push(context.attempt);
      throw new Error(`boom ${context.attempt}`);
    }, {
      maxRetries: 2,
      backoff: { type: 'fixed', initialDelay: 5 },
    });

    run.scheduler.on('jobRun', (event) => {
      jobRuns.push(event);
    });
    run.scheduler.on('jobError', (event) => {
      jobErrors.push(event);
    });

    try {
      const execution = run.invoke();
      await advanceBackoffs(time, [5, 5]);
      await execution;

      assertEquals(attempts, [0, 1, 2]);
      assertEquals(jobRuns.length, 0);
      assertEquals(jobErrors.length, 1);
      assertEquals(jobErrors[0].result.attempt, 2);
      assertEquals(jobErrors[0].result.error?.message, 'boom 2');
      assertEquals(run.job.runCount, 1);
      assertEquals(run.job.lastError, 'boom 2');
    } finally {
      await run.stop();
    }
  });

  Deno.test(`${provider} applies fixed, exponential, linear, and capped backoff`, async () => {
    using time = new FakeTime('2026-08-04T12:00:00Z');
    const cases: readonly BackoffCase[] = [
      {
        name: 'fixed',
        backoff: { type: 'fixed', initialDelay: 11 },
        waits: [11, 11, 11],
      },
      {
        name: 'exponential',
        backoff: { type: 'exponential', initialDelay: 3, multiplier: 3 },
        waits: [3, 9, 27],
      },
      {
        name: 'linear',
        backoff: { type: 'linear', initialDelay: 4 },
        waits: [4, 8, 12],
      },
      {
        name: 'maxDelay cap',
        backoff: { type: 'exponential', initialDelay: 5, multiplier: 3, maxDelay: 8 },
        waits: [5, 8, 8],
      },
    ];

    for (const backoffCase of cases) {
      const startedAt = Date.now();
      const timestamps: number[] = [];
      const run = await registerRun(provider, (context) => {
        timestamps.push(Date.now() - startedAt);
        if (context.attempt < backoffCase.waits.length) {
          throw new Error('retry');
        }
      }, {
        maxRetries: backoffCase.waits.length,
        backoff: backoffCase.backoff,
      });

      try {
        const execution = run.invoke();
        await advanceBackoffs(time, backoffCase.waits);
        await execution;

        assertEquals(
          timestamps,
          cumulativeTimestamps(backoffCase.waits),
          `${provider} ${backoffCase.name}`,
        );
      } finally {
        await run.stop();
      }
    }
  });

  Deno.test(`${provider} aborts a registration during backoff without another attempt`, async () => {
    using time = new FakeTime('2026-08-04T12:00:00Z');
    const attempts: number[] = [];
    const jobErrors: JobRunEvent[] = [];
    const run = await registerRun(provider, (context) => {
      attempts.push(context.attempt);
      throw new Error('retry');
    }, {
      maxRetries: 2,
      backoff: { type: 'fixed', initialDelay: 50 },
    });

    run.scheduler.on('jobError', (event) => {
      jobErrors.push(event);
    });

    try {
      const execution = run.invoke();
      await time.runMicrotasks();
      assertEquals(await run.abort(), true);
      await time.runMicrotasks();
      await execution;

      assertEquals(attempts, [0]);
      assertEquals(jobErrors.length, 1);
      assertEquals(jobErrors[0].result.attempt, 0);
      assertEquals(jobErrors[0].result.error?.name, 'AbortError');
      assertEquals(run.job.runCount, 1);
    } finally {
      await run.stop();
    }
  });

  Deno.test(`${provider} stop aborts backoff without another attempt`, async () => {
    using time = new FakeTime('2026-08-04T12:00:00Z');
    const attempts: number[] = [];
    const run = await registerRun(provider, (context) => {
      attempts.push(context.attempt);
      throw new Error('retry');
    }, {
      maxRetries: 2,
      backoff: { type: 'fixed', initialDelay: 50 },
    });

    try {
      const execution = run.invoke();
      await time.runMicrotasks();
      await run.stop();
      await time.runMicrotasks();
      await execution;

      assertEquals(attempts, [0]);
      assertEquals(run.job.runCount, 1);
    } finally {
      await run.stop();
    }
  });

  Deno.test(`${provider} defaults to zero retries`, async () => {
    using _time = new FakeTime('2026-08-04T12:00:00Z');
    const attempts: number[] = [];
    const jobErrors: JobRunEvent[] = [];
    const run = await registerRun(provider, (context) => {
      attempts.push(context.attempt);
      throw new Error('once');
    });

    run.scheduler.on('jobError', (event) => {
      jobErrors.push(event);
    });

    try {
      await run.invoke();

      assertEquals(attempts, [0]);
      assertEquals(jobErrors.length, 1);
      assertEquals(jobErrors[0].result.attempt, 0);
      assertEquals(run.job.runCount, 1);
    } finally {
      await run.stop();
    }
  });
}
