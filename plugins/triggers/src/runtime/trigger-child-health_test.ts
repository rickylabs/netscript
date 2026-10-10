import { assertEquals, assertRejects } from '@std/assert';
import { ChildHealthMonitor } from '@netscript/plugin/health';
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
  const kv = { get: () => Promise.reject(new Error('secret dependency failure')) };
  await assertRejects(() =>
    startTriggerProcessorRuntime({
      health,
      definitions: [],
      kv: kv as never,
    })
  );
  assertEquals(health.snapshot().registryReady, true);
  assertEquals(health.snapshot().dependencyReady, false);
  assertEquals(health.snapshot().state, 'failed');
});
