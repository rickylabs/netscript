// Run from an installed local-source project after generating its plugin registries.
import { assertEquals } from '@std/assert';
import { closeKv, getKv, resetKv } from '@netscript/kv';
import { ChildHealthMonitor, type ChildHealthSnapshot } from '@netscript/plugin/health';
import { startTriggerProcessorRuntime } from '@netscript/plugin-triggers/runtime';
import { startCombinedProcess as startWorkers } from '@netscript/plugin-workers/runtime';

Deno.test('installed trigger and worker processors become ready with excluded factory modules', async () => {
  Deno.env.set('NETSCRIPT_PROJECT_ROOT', Deno.cwd());
  await resetKv();
  const kv = await getKv({ provider: 'deno-kv', path: ':memory:', skipServiceDiscovery: true });
  // Startup requires a streams reference; the isolated endpoint is a test double.
  const streams = Deno.serve(
    { hostname: '127.0.0.1', port: 0, onListen() {} },
    () => Response.json({ items: [] }),
  );
  Deno.env.set('DURABLE_STREAMS_URL', `http://${streams.addr.hostname}:${streams.addr.port}`);
  const controller = new AbortController();
  const triggerHealth = new ChildHealthMonitor(() => Date.now());
  let readWorker: (() => ChildHealthSnapshot | Promise<ChildHealthSnapshot>) | undefined;
  let failure: unknown;
  const triggers = startTriggerProcessorRuntime({
    signal: controller.signal,
    health: triggerHealth,
    kv,
  });
  const workers = startWorkers({
    signal: controller.signal,
    queueName: 'registry-opt-out-proof',
    workerId: 'registry-opt-out-proof',
    onStarted: (read) => {
      readWorker = read;
    },
  });
  void triggers.catch((error) => {
    failure = error;
  });
  void workers.catch((error) => {
    failure = error;
  });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 300; attempt++) {
      if (failure) throw failure;
      const trigger = triggerHealth.snapshot();
      const worker = await readWorker?.();
      if (trigger.state === 'ready' && worker?.state === 'ready') {
        assertEquals(trigger.registryReady, true);
        assertEquals(trigger.dependencyReady, true);
        assertEquals(worker.registryReady, true);
        assertEquals(worker.dependencyReady, true);
        ready = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assertEquals(ready, true, 'both installed processors must become ready');
  } finally {
    controller.abort();
    await Promise.allSettled([triggers, workers]);
    await closeKv();
    await streams.shutdown();
  }
});
