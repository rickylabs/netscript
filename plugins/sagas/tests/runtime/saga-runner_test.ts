import { assertEquals, assertFalse } from 'jsr:@std/assert@^1';
import { defineSaga } from '@netscript/plugin-sagas-core';
import { createSagaEngine, createSagaRuntime } from '@netscript/plugin-sagas-core/runtime';
import { MemoryQueueAdapter } from '@netscript/queue/testing';
import { startSagaRunner } from '../../src/runtime/saga-runner.ts';

Deno.test('startSagaRunner loads a non-empty dependency-shaped registry from the project root', async () => {
  const packageModuleUrl =
    'https://jsr.io/@netscript/plugin-sagas/0.0.2/src/runtime/saga-runner.ts';
  const definition = defineSaga('dependency-shaped')
    .state({ status: 'pending' })
    .on('dependency.started', () => [])
    .build();
  const imported: string[] = [];

  const supervisor = await startSagaRunner({
    deliveryQueue: new MemoryQueueAdapter({ pollInterval: 1 }),
    readEnv: () => undefined,
    cwd: () => '/consumer/project',
    importer: (specifier) => {
      imported.push(specifier);
      return Promise.resolve({ definitions: [definition] });
    },
    supervisor: {
      createRuntime: () => createSagaRuntime(),
    },
  });

  try {
    assertEquals(imported, [
      'file:///consumer/project/.netscript/generated/plugin-sagas/sagas.registry.ts',
    ]);
    assertFalse(imported[0].startsWith(new URL('.', packageModuleUrl).href));
    assertEquals(supervisor.snapshot().definitionCount, 1);
  } finally {
    await supervisor.stop('dependency-shaped test complete');
  }
});

for (const mode of ['injected engine', 'custom factory'] as const) {
  Deno.test(`startSagaRunner supports ${mode} with its default queues`, async () => {
    const directory = await Deno.makeTempDir();
    const previous = Deno.env.get('DENO_KV_URL');
    Deno.env.set('DENO_KV_URL', `${directory}/queue.kv`);
    let runtime: ReturnType<typeof createSagaRuntime> | undefined;
    const definition = defineSaga('startup-regression').state({ status: 'running' })
      .on('Start', () => []).build();
    let supervisor: Awaited<ReturnType<typeof startSagaRunner>> | undefined;
    try {
      supervisor = await startSagaRunner({
        projection: false,
        readEnv: () => undefined,
        importer: () => Promise.resolve({ definitions: [definition] }),
        ...(mode === 'injected engine'
          ? { runtimeOptions: { native: { engine: createSagaEngine() } } }
          : {
            supervisor: {
              createRuntime: (options) => {
                runtime = createSagaRuntime(options);
                return runtime;
              },
            },
          }),
      });
      assertEquals(supervisor.snapshot().status, 'running');
      if (runtime) await runtime.publish({ type: 'Start', payload: {} });
    } finally {
      await supervisor?.stop();
      if (previous === undefined) Deno.env.delete('DENO_KV_URL');
      else Deno.env.set('DENO_KV_URL', previous);
      await Deno.remove(directory, { recursive: true });
    }
  });
}
