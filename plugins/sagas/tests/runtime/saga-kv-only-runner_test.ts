import { assert, assertEquals } from '@std/assert';
import { toFileUrl } from '@std/path/to-file-url';
import { DenoKvAdapter, getKv, resetKv } from '@netscript/kv';
import { defineSaga } from '@netscript/plugin-sagas-core';
import type { SagaCorrelationKey } from '@netscript/plugin-sagas-core/domain';
import type { SagaRuntime } from '@netscript/plugin-sagas-core/runtime';
import { MemoryQueueAdapter } from '@netscript/queue/testing';
import { startSagaRunner } from '../../src/runtime/saga-runner.ts';

for (const backend of ['kv', 'none'] as const) {
  Deno.test(`KV-only runner boots with ${backend} projection and a throwing DB port; real KV replay`, async () => {
    await resetKv();
    const kv = await getKv({ provider: 'deno-kv', path: ':memory:', skipServiceDiscovery: true });
    assert(kv instanceof DenoKvAdapter);
    const directory = await Deno.makeTempDir();
    const bootstrap = toFileUrl(`${directory}/bootstrap.ts`).href;
    await Deno.writeTextFile(
      `${directory}/bootstrap.ts`,
      `
export const calls = { db: 0 };
export async function createPluginServiceContext() {
  return {
    appsettings: { Sagas: { Store: { Backend: 'kv' }, Projection: { Backend: '${backend}' } } },
    db: { getClient() { calls.db++; throw new Error('DB must remain untouched'); } },
  };
}
`,
    );
    const { calls } = await import(bootstrap) as { calls: { db: number } };
    const definition = defineSaga('kv-only').state({ count: 0 })
      .on('Increment', (saga) => {
        saga.state.count++;
        return [];
      }).build();
    let running: SagaRuntime | undefined;
    let supervisor: Awaited<ReturnType<typeof startSagaRunner>> | undefined;
    const listener = Promise.withResolvers<void>();
    try {
      supervisor = await startSagaRunner({
        deliveryQueue: new MemoryQueueAdapter(),
        readEnv: (key) =>
          key === 'NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE' ? bootstrap : undefined,
        importer: () => Promise.resolve({ definitions: [definition] }),
        supervisor: {
          delivery: {
            start: (runtime) => {
              running = runtime;
              return Promise.resolve();
            },
            wait: () => listener.promise,
            stop: () => {
              listener.resolve();
              return Promise.resolve();
            },
          },
        },
      });
      assert(running);
      assertEquals(supervisor.snapshot().status, 'running');
      const message = {
        type: 'Increment',
        payload: {},
        correlationKey: 'one' as SagaCorrelationKey,
        idempotencyKey: 'same-delivery',
      };
      await running.publish(message);
      await running.publish(message);
      const state = await kv.get<{ state: { count: number }; metadata: { version: number } }>([
        'sagas',
        'state',
        'kv-only:one',
      ]);
      assertEquals(state?.value.state.count, 1);
      assertEquals(state?.value.metadata.version, 1);
      const projection = await kv.get(['saga_instances', 'kv-only', 'kv-only:one']);
      assertEquals(projection !== null, backend === 'kv');
      assertEquals(calls.db, 0);
    } finally {
      await supervisor?.stop();
      await resetKv();
      await Deno.remove(directory, { recursive: true });
    }
  });
}
