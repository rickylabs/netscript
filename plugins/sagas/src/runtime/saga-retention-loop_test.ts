import { assertEquals } from '@std/assert';
import { MemoryKvAdapter } from '@netscript/kv';
import { createDurableSagaRuntime } from './create-durable-saga-runtime.ts';
import { runSagaRetentionCleanup } from './saga-retention-loop.ts';

Deno.test('retention loop retries transient failures, drains backlog without delay and backs off when idle', async () => {
  const controller = new AbortController();
  const sleeps: number[] = [];
  const warnings: string[] = [];
  const pages: (boolean | Error)[] = [
    new Error('temporary'),
    new Error('temporary'),
    true,
    true,
    false,
    false,
    false,
    true,
    false,
  ];
  await runSagaRetentionCleanup(
    {
      cleanupRetention: () => {
        const page = pages.shift();
        if (page instanceof Error) return Promise.reject(page);
        if (page === undefined) controller.abort();
        return Promise.resolve(page ?? false);
      },
    },
    controller.signal,
    (ms) => {
      sleeps.push(ms);
      return Promise.resolve();
    },
    (message) => warnings.push(message),
  );
  assertEquals(warnings, ['temporary', 'temporary']);
  assertEquals(sleeps, [100, 200, 100, 200, 400, 100]);
});

Deno.test('retention startup failure cannot prevent durable runtime creation or start', async () => {
  class UnavailableRetentionKv extends MemoryKvAdapter {
    override async *list<T>(options: Parameters<MemoryKvAdapter['list']>[0]) {
      if (options.prefix?.includes('retention')) throw new Error('temporary retention outage');
      yield* super.list<T>(options);
    }
  }
  const durable = await createDurableSagaRuntime({ kv: new UnavailableRetentionKv() });
  try {
    await durable.runtime.start();
  } finally {
    await durable.runtime.stop();
    await durable.dispose();
  }
});
