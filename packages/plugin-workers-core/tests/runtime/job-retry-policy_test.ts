import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import { defineJob } from '../../src/builders/job-builder.ts';
import {
  jobRetryDelay,
  jobRetryRegistration,
  resolveJobRetryPolicy,
} from '../../src/domain/job-retry-policy.ts';
import { executeJobWithRetry } from '../../src/runtime/job-retry.ts';
import { KvJobRegistry } from '../../src/registry/kv-job-registry.ts';
import { MemoryKvAdapter } from '@netscript/kv';

Deno.test('builder retry delay and behavior resolve through the canonical policy', () => {
  const job = defineJob('retry-builder').handler(() => ({ success: true }))
    .retry(2, { delayMs: 12, backoff: 'linear', maxDelayMs: 20 }).build();
  assertEquals(job.retryDelay, 12);
  assertEquals(resolveJobRetryPolicy(job), {
    maxRetries: 2,
    delayMs: 12,
    backoff: 'linear',
    maxDelayMs: 20,
  });
  assertEquals(jobRetryDelay(resolveJobRetryPolicy(job), 2), 20);
});

Deno.test('handler retry fields override metadata and legacy defaults and persist for registration', () => {
  const definition = {
    maxRetries: 3,
    retryDelay: 1000,
    metadata: { owner: 'billing', retry: { delayMs: 50, backoff: 'linear' } },
  };
  const handler = Object.assign(() => undefined, { retry: { maxRetries: 0, delayMs: 10 } });
  const retry = jobRetryRegistration(definition, handler);
  assertEquals(retry, {
    maxRetries: 0,
    retryDelay: 10,
    metadata: {
      owner: 'billing',
      retry: {
        maxRetries: 0,
        delayMs: 10,
        backoff: 'linear',
        maxDelayMs: 300_000,
      },
    },
  });
  assertEquals(resolveJobRetryPolicy(retry), resolveJobRetryPolicy(definition, handler));
});

Deno.test('retry declarations reject invalid counts, unbounded delays and invalid caps', () => {
  for (const maxRetries of [-1, 1.5, 101, Infinity, NaN]) {
    assertThrows(() => resolveJobRetryPolicy({ maxRetries }));
    assertThrows(() => defineJob('invalid-retry').retry(maxRetries));
  }
  for (
    const retry of [
      { delayMs: -1 },
      { delayMs: Infinity },
      { delayMs: NaN },
      { delayMs: 10, maxDelayMs: 9 },
      { backoff: 'silent-unknown' },
    ]
  ) {
    assertThrows(() => resolveJobRetryPolicy({}, { retry }));
  }
  const policy = resolveJobRetryPolicy({
    maxRetries: 100,
    metadata: {
      retry: {
        backoff: 'exponential',
        delayMs: 5,
        maxDelayMs: 100,
      },
    },
  });
  assertEquals(jobRetryDelay(policy, 100), 100);
});

Deno.test('KV job registration validates retry policy before writing the definition', async () => {
  await using kv = new MemoryKvAdapter();
  const registry = new KvJobRegistry({ kv });
  await assertRejects(() =>
    registry.registerJob({
      id: 'bad-retry',
      name: 'Bad retry',
      maxRetries: 1.5,
    })
  );
  await assertRejects(() =>
    registry.registerJob({
      id: 'bad-cap',
      name: 'Bad cap',
      metadata: { retry: { delayMs: 10, maxDelayMs: 1 } },
    })
  );
  assertEquals(await registry.get('bad-retry'), undefined);
  assertEquals(await registry.get('bad-cap'), undefined);
});

Deno.test('thrown job failures retry, while cancellation disposes a pending retry timer', async () => {
  let attempts = 0;
  const delays: number[] = [];
  const signal = new AbortController().signal;
  const result = await executeJobWithRetry(
    () => {
      if (++attempts < 3) return Promise.reject(new Error('temporary'));
      return Promise.resolve({ success: true });
    },
    resolveJobRetryPolicy({ maxRetries: 2, retryDelay: 2 }),
    {
      signal,
      clock: {
        now: () => 0,
        schedule: (delay, callback) => {
          delays.push(delay);
          queueMicrotask(callback);
          return () => undefined;
        },
      },
    },
  );
  assertEquals(result, { success: true, attempts: 3 });
  assertEquals(delays, [2, 2]);
  const controller = new AbortController();
  let disposed = 0;
  const scheduled = Promise.withResolvers<void>();
  const outcome = executeJobWithRetry(
    () => Promise.resolve({ success: false }),
    resolveJobRetryPolicy({ maxRetries: 1 }),
    {
      signal: controller.signal,
      clock: {
        now: () => 0,
        schedule: () => {
          scheduled.resolve();
          return () => {
            disposed++;
          };
        },
      },
    },
  );
  await scheduled.promise;
  controller.abort(new DOMException('shutdown', 'ShutdownError'));
  await assertRejects(() => outcome, DOMException, 'shutdown');
  assertEquals(disposed, 1);
});
