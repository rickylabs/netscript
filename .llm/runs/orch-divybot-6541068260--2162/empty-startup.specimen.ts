import { assertEquals } from '@std/assert';
import { closeKv, getKv, resetKv } from '@netscript/kv';
import { ChildHealthMonitor, type ChildHealthSnapshot } from '@netscript/plugin/health';
import { type SagaRuntimeSupervisor, startSagaRunner } from '@netscript/plugin-sagas/runtime';
import { startTriggerProcessorRuntime } from '@netscript/plugin-triggers/runtime';
import { startCombinedProcess as startWorkers } from '@netscript/plugin-workers/runtime';
import { registry as sagas } from './.netscript/generated/plugin-sagas/sagas.registry.ts';
import { registry as triggers } from './.netscript/generated/plugin-triggers/triggers.registry.ts';
import {
  jobDefinitions,
  registry as workers,
} from './.netscript/generated/plugin-workers/job-registry.ts';

Deno.test('installed empty plugin runtimes reach normal readiness with zero definitions', async () => {
  assertEquals([sagas.size, triggers.size, workers.size, jobDefinitions.size], [0, 0, 0, 0]);
  Deno.env.set('NETSCRIPT_PROJECT_ROOT', Deno.cwd());
  Deno.env.set('NETSCRIPT_SAGA_KV_PATH', ':memory:');
  Deno.env.set('NETSCRIPT_SAGA_STORE', 'kv');
  await resetKv();
  const kv = await getKv({ provider: 'deno-kv', path: ':memory:', skipServiceDiscovery: true });
  const streams = Deno.serve(
    { hostname: '127.0.0.1', port: 0, onListen() {} },
    () => Response.json({ items: [] }),
  );
  Deno.env.set('DURABLE_STREAMS_URL', `http://${streams.addr.hostname}:${streams.addr.port}`);
  const controller = new AbortController();
  const triggerHealth = new ChildHealthMonitor();
  let readWorker: (() => ChildHealthSnapshot | Promise<ChildHealthSnapshot>) | undefined;
  let failure: unknown;
  let saga: SagaRuntimeSupervisor | undefined;
  const triggerProcess = startTriggerProcessorRuntime({
    signal: controller.signal,
    health: triggerHealth,
    kv,
  });
  const workerProcess = startWorkers({
    signal: controller.signal,
    queueName: 'empty-registry-proof',
    workerId: 'empty-registry-proof',
    onStarted: (read) => {
      readWorker = read;
    },
  });
  void triggerProcess.catch((error) => {
    failure = error;
  });
  void workerProcess.catch((error) => {
    failure = error;
  });
  try {
    saga = await startSagaRunner();
    assertEquals(saga.snapshot().definitionCount, 0);
    assertEquals(saga.snapshot().status, 'running');
    let ready = false;
    for (let attempt = 0; attempt < 500; attempt++) {
      if (failure) throw failure;
      const snapshots = [
        saga.snapshot().childHealth,
        triggerHealth.snapshot(),
        await readWorker?.(),
      ];
      if (snapshots.every((snapshot) => snapshot?.state === 'ready')) {
        for (const snapshot of snapshots) {
          assertEquals(snapshot?.registryReady, true);
          assertEquals(snapshot?.dependencyReady, true);
        }
        ready = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assertEquals(ready, true, 'all three production startup APIs must become ready');
  } finally {
    controller.abort();
    await saga?.stop('empty registry proof complete');
    await Promise.allSettled([triggerProcess, workerProcess]);
    await closeKv();
    await streams.shutdown();
  }
});
