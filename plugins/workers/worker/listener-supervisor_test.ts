import { assertEquals, assertFalse } from '@std/assert';
import { CHILD_CRASH_LOOP_THRESHOLD, childHealthResponse } from '@netscript/plugin/health';
import { QueueConnectionError } from '@netscript/queue';
import { WorkerListenerSupervisor } from './listener-supervisor.ts';

Deno.test('injected listener crash loop turns the child health route red and stays red on restart', async () => {
  const fourthAttempt = Promise.withResolvers<void>();
  let attempts = 0;
  const listener = new WorkerListenerSupervisor({
    name: 'injected-crash-loop',
    maxRestarts: 5,
    sleep: () => Promise.resolve(),
    run: async (signal) => {
      attempts++;
      if (attempts < 4) throw new Error('password=secret-token https://user:password@db.example');
      fourthAttempt.resolve();
      await new Promise<void>((resolve) =>
        signal.addEventListener('abort', () => resolve(), { once: true })
      );
    },
  });
  listener.start();
  await fourthAttempt.promise;
  try {
    const health = listener.snapshot().childHealth;
    assertEquals(health.state, 'crash-looping');
    assertFalse(listener.snapshot().healthy);
    const response = childHealthResponse(new Request('http://localhost/health'), health);
    assertEquals(response.status, 503);
    const payload = await response.text();
    assertFalse(payload.includes('secret-token'));
    assertFalse(payload.includes('password'));
    assertEquals(health.restartCount, 3);
  } finally {
    await listener.stop();
  }
});

Deno.test('idle and cleanly stopped listener never reports healthy', async () => {
  const started = Promise.withResolvers<void>();
  const listener = new WorkerListenerSupervisor({
    name: 'clean-shutdown',
    run: async (signal) => {
      started.resolve();
      await new Promise<void>((resolve) =>
        signal.addEventListener('abort', () => resolve(), { once: true })
      );
    },
  });
  assertFalse(listener.snapshot().healthy);
  listener.start();
  await started.promise;
  assertEquals(listener.snapshot().healthy, true);
  await listener.stop();
  assertFalse(listener.snapshot().healthy);
  assertEquals(listener.snapshot().childHealth.state, 'stopped');
});

Deno.test('listener shutdown during restart backoff drains without a detached rejection', async () => {
  const sleeping = Promise.withResolvers<void>();
  const listener = new WorkerListenerSupervisor({
    name: 'backoff-shutdown',
    run: () => Promise.reject(new Error('injected failure')),
    sleep: (_ms, signal) =>
      new Promise((_resolve, reject) => {
        sleeping.resolve();
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), {
          once: true,
        });
      }),
  });
  listener.start();
  await sleeping.promise;
  await listener.stop();
  assertEquals(listener.snapshot().childHealth.state, 'stopped');
  assertFalse(listener.snapshot().healthy);
});

Deno.test('a recovered worker listener becomes healthy after a full clean running minute', async () => {
  let now = 0;
  let attempts = 0;
  const running = Promise.withResolvers<void>();
  const listener = new WorkerListenerSupervisor({
    name: 'transient-failover',
    now: () => now,
    maxRestarts: 5,
    sleep: () => Promise.resolve(),
    run: async (signal) => {
      if (++attempts <= 3) throw new Error('temporary dependency failure');
      running.resolve();
      await new Promise<void>((resolve) =>
        signal.addEventListener('abort', () => resolve(), { once: true })
      );
    },
  });
  listener.start();
  await running.promise;
  try {
    assertFalse(listener.snapshot().healthy);
    now = CHILD_CRASH_LOOP_THRESHOLD.windowMs;
    assertEquals(listener.snapshot().healthy, true);
    assertEquals(listener.snapshot().childHealth.state, 'ready');
    assertEquals(listener.snapshot().childHealth.restartCount, 3);
  } finally {
    await listener.stop();
  }
});

Deno.test('spaced listener failures replenish the budget without resetting cumulative restart counts', async () => {
  let now = 0;
  let attempts = 0;
  const running = Promise.withResolvers<void>();
  const budgets: number[] = [];
  const delays: number[] = [];
  const listener = new WorkerListenerSupervisor({
    name: 'spaced-refusals',
    now: () => now,
    healthyResetMs: 100,
    maxRestarts: 1,
    initialBackoffMs: 10,
    sleep: (ms) => {
      delays.push(ms);
      return Promise.resolve();
    },
    onFailure: (_error, snapshot) => budgets.push(snapshot.restartBudgetUsed),
    run: async (signal) => {
      if (++attempts <= 6) {
        now += 100;
        throw new Error('OOM secret-value');
      }
      running.resolve();
      await new Promise<void>((resolve) =>
        signal.addEventListener('abort', () => resolve(), { once: true })
      );
    },
  });
  listener.start();
  await Promise.race([running.promise, listener.completion]);
  try {
    assertEquals(listener.snapshot().restartCount, 6);
    assertEquals(listener.snapshot().childHealth.restartCount, 6);
    assertEquals(budgets, [1, 1, 1, 1, 1, 1]);
    assertEquals(delays, [10, 10, 10, 10, 10, 10]);
    now += 100;
    assertEquals(listener.snapshot().restartBudgetUsed, 0);
    assertEquals(listener.snapshot().restartCount, 6);
  } finally {
    await listener.stop();
  }
});

Deno.test('failures within the healthy window exhaust the burst budget', async () => {
  let now = 0;
  let attempts = 0;
  const listener = new WorkerListenerSupervisor({
    name: 'burst',
    now: () => now,
    healthyResetMs: 100,
    maxRestarts: 2,
    sleep: () => Promise.resolve(),
    run: () => {
      attempts++;
      now += 99;
      return Promise.reject(new Error('burst'));
    },
  });
  listener.start();
  await listener.completion;
  assertEquals(attempts, 3);
  assertEquals(listener.snapshot().status, 'failed');
  assertEquals(listener.snapshot().restartBudgetUsed, 2);
  assertEquals(listener.snapshot().restartCount, 2);
});

Deno.test('backoff time does not replenish the budget and exponential delay stays capped', async () => {
  let now = 0;
  const delays: number[] = [];
  const listener = new WorkerListenerSupervisor({
    name: 'backoff-not-healthy',
    now: () => now,
    healthyResetMs: 100,
    maxRestarts: 3,
    initialBackoffMs: 10,
    maxBackoffMs: 20,
    sleep: (ms) => {
      delays.push(ms);
      now += 10_000;
      return Promise.resolve();
    },
    run: () => Promise.reject(new Error('refused')),
  });
  listener.start();
  await listener.completion;
  assertEquals(delays, [10, 20, 20]);
  assertEquals(listener.snapshot().status, 'failed');
});

Deno.test('Infinity supports more than 1024 restarts with finite capped delays and clean abort', async () => {
  let attempts = 0;
  const delays: number[] = [];
  const running = Promise.withResolvers<void>();
  const listener = new WorkerListenerSupervisor({
    name: 'unlimited',
    maxRestarts: Infinity,
    now: () => 0,
    initialBackoffMs: 0,
    maxBackoffMs: 20,
    sleep: (ms) => {
      delays.push(ms);
      return Promise.resolve();
    },
    run: async (signal) => {
      if (++attempts <= 1_100) throw new Error('transient');
      running.resolve();
      await new Promise<void>((resolve) =>
        signal.addEventListener('abort', () => resolve(), { once: true })
      );
    },
  });
  listener.start();
  await running.promise;
  assertEquals(delays.length, 1_100);
  assertEquals(delays.every((ms) => Number.isFinite(ms) && ms >= 0 && ms <= 20), true);
  assertEquals(listener.snapshot().restartCount, 1_100);
  await listener.stop();
  assertEquals(listener.snapshot().status, 'stopped');
});

for (
  const [error, category, message] of [
    [
      new Error('wrapper secret-url', { cause: new Error('OOM secret-password') }),
      'store-write-refused',
      'Queue store refused a write (details redacted).',
    ],
    [
      new Error('READONLY secret-password'),
      'store-write-refused',
      'Queue store refused a write (details redacted).',
    ],
    [
      new Error('NOPERM secret-password'),
      'store-write-refused',
      'Queue store refused a write (details redacted).',
    ],
    [
      new Error('ECONNREFUSED https://user:secret@private'),
      'connection-unavailable',
      'Queue store connection unavailable (details redacted).',
    ],
    [
      new QueueConnectionError('PostgreSQL connection not found secret-password'),
      'connection-unavailable',
      'Queue store connection unavailable (details redacted).',
    ],
    [
      new Error('wrapper secret-url', {
        cause: new QueueConnectionError('PostgreSQL connection not found secret-password'),
      }),
      'connection-unavailable',
      'Queue store connection unavailable (details redacted).',
    ],
    [
      new Error('arbitrary secret-password'),
      'listener-error',
      'Queue listener failed (details redacted).',
    ],
  ] as const
) {
  Deno.test(`listener health reports safe cause ${category} for ${error.message.split(' ')[0]}`, async () => {
    const listener = new WorkerListenerSupervisor({
      name: 'classified',
      maxRestarts: 0,
      run: () => Promise.reject(error),
    });
    listener.start();
    await listener.completion;
    const snapshot = listener.snapshot();
    assertEquals(snapshot.failureCause, category);
    assertEquals(snapshot.childHealth.lastFatalError?.message, message);
    const response = childHealthResponse(
      new Request('http://localhost/health'),
      snapshot.childHealth,
    );
    assertEquals(response.status, 503);
    const serialized = await response.text();
    for (const secret of ['secret', 'https:', 'password', 'stack']) {
      assertFalse(serialized.includes(secret));
    }
  });
}
