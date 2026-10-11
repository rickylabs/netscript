import { assert, assertEquals, assertRejects } from '@std/assert';
import { toFileUrl } from '@std/path/to-file-url';
import { DenoKvAdapter, getKv, resetKv } from '@netscript/kv';
import { defineSaga } from '@netscript/plugin-sagas-core';
import type { SagaCorrelationKey } from '@netscript/plugin-sagas-core/domain';
import type { SagaRuntime } from '@netscript/plugin-sagas-core/runtime';
import { MemoryQueueAdapter } from '@netscript/queue/testing';
import { startSagaRunner } from '../../src/runtime/saga-runner.ts';

for (
  const { backend, archiveToDb } of [
    { backend: 'kv', archiveToDb: false },
    { backend: 'none', archiveToDb: false },
    { backend: 'kv', archiveToDb: true },
    { backend: 'none', archiveToDb: true },
  ] as const
) {
  Deno.test(`runner boots with ${backend} projection, archiveToDb=${archiveToDb}; real KV replay`, async () => {
    await resetKv();
    const kv = await getKv({ provider: 'deno-kv', path: ':memory:', skipServiceDiscovery: true });
    assert(kv instanceof DenoKvAdapter);
    const directory = await Deno.makeTempDir();
    const previousProjectRoot = Deno.env.get('NETSCRIPT_PROJECT_ROOT');
    Deno.env.set('NETSCRIPT_PROJECT_ROOT', directory);
    await Deno.writeTextFile(
      `${directory}/netscript.config.ts`,
      `export default { name: 'archive-test', databases: { config: [] }, sagas: { groups: [
        { topic: 'archive', retention: { activeDays: 30, completedDays: 7, archiveToDb: ${archiveToDb} },
          sagas: [{ id: 'kv-only', name: 'KV-only', entrypoint: './saga.ts' }] },
        { topic: 'no-archive', retention: { activeDays: 30, completedDays: 7, archiveToDb: false },
          sagas: [{ id: 'no-archive', name: 'No archive', entrypoint: './other.ts' }] },
      ] } };`,
    );
    const bootstrap = toFileUrl(`${directory}/bootstrap.ts`).href;
    await Deno.writeTextFile(
      `${directory}/bootstrap.ts`,
      `
export const calls = { db: 0, archives: [] };
export async function createPluginServiceContext() {
  return {
    appsettings: { Sagas: { Store: { Backend: 'kv' }, Projection: { Backend: '${backend}' } } },
    db: { getClient() {
      calls.db++;
      ${
        archiveToDb
          ? `return Promise.resolve({ sagaInstance: {
        upsert(args) { calls.archives.push(args.create); return Promise.resolve(); },
      } });`
          : `throw new Error('DB must remain untouched');`
      }
    } },
  };
}
`,
    );
    const { calls } = await import(bootstrap) as {
      calls: { db: number; archives: { sagaName: string; state: { count: number } }[] };
    };
    const definition = defineSaga('kv-only').state({ count: 0 })
      .on('Increment', (saga) => {
        saga.state.count++;
        return [];
      }).build();
    const noArchiveDefinition = defineSaga('no-archive').state({ count: 0 })
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
        importer: () => Promise.resolve({ definitions: [definition, noArchiveDefinition] }),
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
      assertEquals(calls.db, archiveToDb && backend === 'kv' ? 1 : 0);
      assertEquals(
        calls.archives.filter((archive) => archive.sagaName === 'kv-only').length,
        archiveToDb && backend === 'kv' ? 1 : 0,
      );
      assertEquals(calls.archives.some((archive) => archive.sagaName === 'no-archive'), false);
      if (archiveToDb && backend === 'kv') assertEquals(calls.archives[0]?.state.count, 1);
    } finally {
      await supervisor?.stop();
      await resetKv();
      if (previousProjectRoot === undefined) Deno.env.delete('NETSCRIPT_PROJECT_ROOT');
      else Deno.env.set('NETSCRIPT_PROJECT_ROOT', previousProjectRoot);
      await Deno.remove(directory, { recursive: true });
    }
  });
}

Deno.test('Prisma projection runner rejects missing host delegates before delivery starts', async () => {
  const directory = await Deno.makeTempDir();
  const bootstrap = toFileUrl(`${directory}/bootstrap.ts`).href;
  await Deno.writeTextFile(
    `${directory}/bootstrap.ts`,
    `export async function createPluginServiceContext() {
      return { appsettings: { Sagas: { Projection: { Backend: 'prisma' } } },
        db: { getClient: () => Promise.resolve({ user: {} }) } };
    }`,
  );
  let deliveryStarted = false;
  try {
    await assertRejects(
      () =>
        startSagaRunner({
          deliveryQueue: new MemoryQueueAdapter(),
          readEnv: (key) =>
            key === 'NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE' ? bootstrap : undefined,
          importer: () => Promise.resolve({ definitions: [] }),
          supervisor: {
            delivery: {
              start: () => {
                deliveryStarted = true;
                return Promise.resolve();
              },
              wait: () => Promise.resolve(),
              stop: () => Promise.resolve(),
            },
          },
        }),
      Error,
      'Sagas database client is missing required Prisma delegates.',
    );
    assertEquals(deliveryStarted, false);
  } finally {
    await Deno.remove(directory, { recursive: true });
  }
});
