import { assertEquals, assertRejects } from '@std/assert';
import { createSagaRuntime, type SagaRuntime } from '@netscript/plugin-sagas-core/runtime';
import { ChildHealthMonitor } from '@netscript/plugin/health';
import { startSagaRunner } from './saga-runner.ts';
import { SagaRuntimeSupervisor } from './saga-supervisor.ts';

function runtime(start?: () => Promise<void>): SagaRuntime {
  const instance = createSagaRuntime();
  return { ...instance, start: start ?? instance.start };
}

Deno.test('saga child health covers startup race, registry failure and unavailable dependency', async () => {
  const registry = Promise.withResolvers<[]>();
  const supervisor = new SagaRuntimeSupervisor({
    loadDefinitions: () => registry.promise,
    createRuntime: () => runtime(),
  });
  const startup = supervisor.start();
  assertEquals(supervisor.snapshot().childHealth.state, 'starting');
  assertEquals(supervisor.snapshot().childHealth.registryReady, false);
  registry.resolve([]);
  await startup;
  assertEquals(supervisor.snapshot().childHealth.state, 'ready');
  await supervisor.stop();
  assertEquals(supervisor.snapshot().childHealth.state, 'stopped');

  const registryFailed = new SagaRuntimeSupervisor({
    loadDefinitions: () => Promise.reject(new Error('secret-registry-failure')),
    createRuntime: () => runtime(),
  });
  await assertRejects(() => registryFailed.start());
  assertEquals(registryFailed.snapshot().childHealth.state, 'failed');
  assertEquals(registryFailed.snapshot().childHealth.registryReady, false);
  assertEquals(JSON.stringify(registryFailed.snapshot().childHealth).includes('secret'), false);

  const dependencyFailed = new SagaRuntimeSupervisor({
    definitions: [],
    createRuntime: () => runtime(() => Promise.reject(new Error('db unavailable'))),
  });
  await assertRejects(() => dependencyFailed.start());
  assertEquals(dependencyFailed.snapshot().childHealth.registryReady, true);
  assertEquals(dependencyFailed.snapshot().childHealth.dependencyReady, false);
});

Deno.test('saga delivery death changes a previously ready background child to failed', async () => {
  const delivery = Promise.withResolvers<void>();
  const supervisor = new SagaRuntimeSupervisor({
    definitions: [],
    createRuntime: () => runtime(),
    delivery: {
      start: () => Promise.resolve(),
      wait: () => delivery.promise,
      stop: () => Promise.resolve(),
    },
  });
  await supervisor.start();
  assertEquals(supervisor.snapshot().childHealth.state, 'ready');
  delivery.reject(new Error('secret-token'));
  await Promise.resolve();
  assertEquals(supervisor.snapshot().childHealth.state, 'failed');
  assertEquals(supervisor.snapshot().childHealth.dependencyReady, false);
  await supervisor.stop();
});

Deno.test('concurrent saga startup shares registry load and shutdown waits for bootstrap', async () => {
  const registry = Promise.withResolvers<[]>();
  let loads = 0;
  const supervisor = new SagaRuntimeSupervisor({
    loadDefinitions: () => {
      loads++;
      return registry.promise;
    },
    createRuntime: () => runtime(),
  });
  const first = supervisor.start();
  const second = supervisor.start();
  const stopped = supervisor.stop();
  assertEquals(first, second);
  assertEquals(loads, 1);
  registry.resolve([]);
  await first;
  await stopped;
  assertEquals(supervisor.snapshot().childHealth.state, 'stopped');
});

Deno.test('saga factory failure preserves loaded registry readiness', async () => {
  const supervisor = new SagaRuntimeSupervisor({
    loadDefinitions: () => Promise.resolve([]),
    createRuntime: () => Promise.reject(new Error('secret KV unavailable')),
  });
  await assertRejects(() => supervisor.start());
  assertEquals(supervisor.snapshot().childHealth.registryReady, true);
  assertEquals(supervisor.snapshot().childHealth.dependencyReady, false);
  assertEquals(supervisor.snapshot().childHealth.state, 'failed');
});

Deno.test('saga runner startup failure updates the process monitor before returning a supervisor', async () => {
  const health = new ChildHealthMonitor();
  await assertRejects(() =>
    startSagaRunner({
      registryModule: 'file:///generated-sagas.ts',
      importer: () => Promise.resolve({ sagaRegistry: [] }),
      readEnv: () => undefined,
      projection: false,
      supervisor: {
        health,
        createRuntime: () => Promise.reject(new Error('secret KV unavailable')),
      },
    })
  );
  assertEquals(health.snapshot().registryReady, true);
  assertEquals(health.snapshot().dependencyReady, false);
  assertEquals(health.snapshot().state, 'failed');
  assertEquals(JSON.stringify(health.snapshot()).includes('secret'), false);
});
