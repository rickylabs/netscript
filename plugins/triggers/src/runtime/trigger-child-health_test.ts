import { assertEquals, assertRejects } from '@std/assert';
import { ChildHealthMonitor } from '@netscript/plugin/health';
import { type KvEntry, type KvKey, MemoryKvAdapter } from '@netscript/kv';
import { startTriggerProcessorRuntime } from './trigger-processor.ts';

Deno.test('trigger background health includes startup readiness and clean shutdown', async () => {
  const health = new ChildHealthMonitor();
  const controller = new AbortController();
  let stopCount = 0;
  const stopped = () => {
    stopCount++;
    return Promise.resolve();
  };
  const completion = startTriggerProcessorRuntime({
    health,
    signal: controller.signal,
    definitions: [],
    processor: { process: () => Promise.reject(new Error('unused')), stop: stopped },
    scheduler: {
      schedule: () => Promise.reject(new Error('unused')),
      stop: stopped,
      unschedule: () => Promise.resolve(false),
      list: () => Promise.resolve([]),
      get: () => Promise.resolve(undefined),
      pause: () => Promise.resolve(false),
      resume: () => Promise.resolve(false),
      fireNow: () => Promise.resolve(false),
    },
    fileWatcher: {
      watch: () => Promise.reject(new Error('unused')),
      stop: stopped,
      unwatch: () => Promise.resolve(false),
      list: () => Promise.resolve([]),
      get: () => Promise.resolve(undefined),
      pause: () => Promise.resolve(false),
      resume: () => Promise.resolve(false),
    },
  });
  await Promise.resolve();
  assertEquals(health.snapshot().state, 'ready');
  assertEquals(health.snapshot().registryReady, true);
  assertEquals(health.snapshot().dependencyReady, true);
  controller.abort();
  await completion;
  assertEquals(health.snapshot().state, 'stopped');
  assertEquals(stopCount, 3);
});

Deno.test('trigger dependency unavailable cannot turn background health green', async () => {
  const health = new ChildHealthMonitor();
  class UnavailableKv extends MemoryKvAdapter {
    override get<T>(_key: KvKey): Promise<KvEntry<T> | null> {
      return Promise.reject(new Error('secret dependency failure'));
    }
  }
  const kv = new UnavailableKv();
  await assertRejects(() =>
    startTriggerProcessorRuntime({
      health,
      definitions: [],
      kv,
    })
  );
  assertEquals(health.snapshot().registryReady, true);
  assertEquals(health.snapshot().dependencyReady, false);
  assertEquals(health.snapshot().state, 'failed');
});

Deno.test('default trigger processor logs a real watch failure and later recovery', async () => {
  const directory = await Deno.makeTempDir();
  const root = `${directory}/incoming`;
  const controller = new AbortController();
  const log: Array<Readonly<{ message: string; attributes?: Readonly<Record<string, unknown>> }>> =
    [];
  const record = (message: string, attributes?: Readonly<Record<string, unknown>>) => {
    log.push({ message, attributes });
  };
  const completion = startTriggerProcessorRuntime({
    signal: controller.signal,
    definitions: [{
      id: 'incoming' as import('@netscript/plugin-triggers-core/domain').TriggerId,
      kind: 'file-watch',
      durability: 't1',
      paths: [root],
      patterns: ['*.txt'],
      on: ['create'],
      handler: () => Promise.resolve([]),
    }],
    processor: {
      process: (event) => Promise.resolve({ event, status: 'completed', actionsDispatched: 0 }),
      stop: () => Promise.resolve(),
    },
    logger: { debug: record, info: record, warn: record, error: record },
  });
  async function waitFor(predicate: () => boolean): Promise<void> {
    for (let attempt = 0; attempt < 500; attempt++) {
      if (predicate()) return;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assertEquals(predicate(), true, 'watch log was not emitted');
  }
  try {
    await waitFor(() => log.some((entry) => entry.message === 'trigger.file_watch.error'));
    assertEquals(
      log.find((entry) => entry.message === 'trigger.file_watch.error')?.attributes?.triggerId,
      'incoming',
    );
    await Deno.mkdir(root);
    await waitFor(() => log.some((entry) => entry.attributes?.state === 'watching'));
  } finally {
    controller.abort();
    await completion;
    await Deno.remove(directory, { recursive: true });
  }
});
