import { assertEquals, assertStrictEquals } from '@std/assert';
import type {
  RuntimeHostBudget,
  RuntimeHostBudgetTimer,
} from '../src/adapters/runtime-host-budget-timer.ts';
import { ComposedRuntimeHost, createRuntimeHost } from '../src/runtime/runtime-host.ts';

class ControlledBudgetTimer implements RuntimeHostBudgetTimer {
  startedWith?: number;
  cancelled = false;
  #expire?: () => void;

  start(timeoutMs: number): RuntimeHostBudget {
    this.startedWith = timeoutMs;
    return {
      expired: new Promise<void>((resolve) => {
        this.#expire = resolve;
      }),
      cancel: () => {
        this.cancelled = true;
      },
    };
  }

  expire(): void {
    this.#expire?.();
  }
}

Deno.test('runtime host drains phases deterministically and preserves registration order', async () => {
  const calls: string[] = [];
  const host = createRuntimeHost({
    timeoutMs: 1_000,
    drains: [
      { id: 'db', phase: 'database', drain: () => void calls.push('db') },
      { id: 'queue-a', phase: 'queue', drain: () => void calls.push('queue-a') },
      { id: 'service', phase: 'service', drain: () => void calls.push('service') },
      { id: 'queue-b', phase: 'queue', drain: () => void calls.push('queue-b') },
      { id: 'workers', phase: 'workers', drain: () => void calls.push('workers') },
    ],
  });

  const report = await host.shutdown('deploy');

  assertEquals(calls, ['service', 'workers', 'queue-a', 'queue-b', 'db']);
  assertEquals(report.outcomes.map(({ id, status }) => ({ id, status })), [
    { id: 'service', status: 'stopped' },
    { id: 'workers', status: 'stopped' },
    { id: 'queue-a', status: 'stopped' },
    { id: 'queue-b', status: 'stopped' },
    { id: 'db', status: 'stopped' },
  ]);
  assertEquals(report.timedOut, false);
  assertStrictEquals(host.shutdown('ignored'), host.shutdown('ignored-again'));
});

Deno.test('runtime host returns at the shared budget without awaiting a slow drain', async () => {
  const timer = new ControlledBudgetTimer();
  const calls: string[] = [];
  const never = new Promise<void>(() => {});
  const host = new ComposedRuntimeHost({
    timeoutMs: 75,
    drains: [
      {
        id: 'service',
        phase: 'service',
        drain: () => {
          calls.push('service');
          return never;
        },
      },
      { id: 'queue', phase: 'queue', drain: () => void calls.push('queue') },
    ],
  }, timer);

  const shutdown = host.shutdown('budget-test');
  await Promise.resolve();
  await Promise.resolve();
  assertEquals(calls, ['service']);
  assertEquals(timer.startedWith, 75);

  timer.expire();
  const report = await shutdown;

  assertEquals(report.timedOut, true);
  assertEquals(report.outcomes, [
    { id: 'service', phase: 'service', status: 'timed-out' },
    { id: 'queue', phase: 'queue', status: 'skipped' },
  ]);
  assertEquals(calls, ['service']);
  assertEquals(timer.cancelled, true);
});

Deno.test('runtime host reports partial failures and continues later drains', async () => {
  const calls: string[] = [];
  const host = createRuntimeHost({
    drains: [
      { id: 'service', phase: 'service', drain: () => void calls.push('service') },
      {
        id: 'workers',
        phase: 'workers',
        drain: () => {
          calls.push('workers');
          throw new Error('worker drain failed');
        },
      },
      { id: 'db', phase: 'database', drain: () => void calls.push('db') },
    ],
  });

  const report = await host.shutdown();

  assertEquals(calls, ['service', 'workers', 'db']);
  assertEquals(report.outcomes, [
    { id: 'service', phase: 'service', status: 'stopped' },
    { id: 'workers', phase: 'workers', status: 'failed', error: 'worker drain failed' },
    { id: 'db', phase: 'database', status: 'stopped' },
  ]);
});
