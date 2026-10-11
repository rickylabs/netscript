import { assert, assertEquals, assertRejects } from '@std/assert';
import { toFileUrl } from '@std/path/to-file-url';
import { DenoKvAdapter, getKv, resetKv } from '@netscript/kv';
import { defineSaga } from '@netscript/plugin-sagas-core';
import type { SagaCorrelationKey, SagaInstanceId } from '@netscript/plugin-sagas-core/domain';
import type { SagaRuntime } from '@netscript/plugin-sagas-core/runtime';
import { PrismaSagaStore, resolveSagaProjectionBackend } from '@netscript/plugin-sagas-core/stores';
import { MemoryQueueAdapter } from '@netscript/queue/testing';
import { startSagaRunner } from '../../src/runtime/saga-runner.ts';
import createSagasService from '../../services/src/main.ts';
import type { RunnerPrismaClient } from './fixtures/runner-prisma-client.ts';

for (const backend of ['kv', 'prisma'] as const) {
  for (const source of ['env', 'appsettings'] as const) {
    Deno.test(`canonical runner ${backend} from ${source} matches API selection and persists replay`, async () => {
      await resetKv();
      const kv = await getKv({ provider: 'deno-kv', path: ':memory:', skipServiceDiscovery: true });
      assert(kv instanceof DenoKvAdapter);
      const directory = await Deno.makeTempDir();
      const fixtureUrl = new URL('./fixtures/runner-prisma-client.ts', import.meta.url).href;
      const bootstrap = toFileUrl(`${directory}/bootstrap.ts`).href;
      // A capable Prisma client must not determine the backend: the selector does.
      const env: Record<string, string> = source === 'env' ? { NETSCRIPT_SAGA_STORE: backend } : {};
      const opposite = backend === 'kv' ? 'prisma' : 'kv';
      const appsettings = { Sagas: { Store: { Backend: source === 'env' ? opposite : backend } } };
      await Deno.writeTextFile(
        `${directory}/bootstrap.ts`,
        `
        import { RunnerPrismaClient } from ${JSON.stringify(fixtureUrl)};
        export const client = new RunnerPrismaClient();
        export const calls = { context: 0, db: 0 };
        export async function createPluginServiceContext() {
          calls.context++;
          return { env: ${JSON.stringify(env)}, appsettings: ${JSON.stringify(appsettings)},
            db: { getClient() { calls.db++; return Promise.resolve(client); } } };
        }
      `,
      );
      const { client, calls } = await import(bootstrap) as {
        client: RunnerPrismaClient;
        calls: { context: number; db: number };
      };
      let running: SagaRuntime | undefined;
      const listener = Promise.withResolvers<void>();
      const definition = defineSaga('backend-counter').state({ count: 0 })
        .on('Increment', (saga) => {
          saga.state.count++;
          return [];
        }).build();
      let supervisor: Awaited<ReturnType<typeof startSagaRunner>> | undefined;
      let api: Awaited<ReturnType<typeof createSagasService>> | undefined;
      const registryEnv = Deno.env.get('SAGAS_REGISTRY_MODULE');
      Deno.env.set(
        'SAGAS_REGISTRY_MODULE',
        'data:application/typescript,export const definitions = [];',
      );
      try {
        supervisor = await startSagaRunner({
          deliveryQueue: new MemoryQueueAdapter(),
          readEnv: (name) =>
            name === 'NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE'
              ? bootstrap
              : name === 'NETSCRIPT_SAGA_PROJECTION' && backend === 'prisma'
              ? 'none'
              : undefined,
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
        // This is the exact selector used by createSagasService for its default query backend.
        assertEquals(resolveSagaProjectionBackend({ env, appsettings }), backend);
        assertEquals(calls.context, 1);
        assertEquals(calls.db, backend === 'prisma' ? 1 : 0);
        assertEquals(supervisor.snapshot().childHealth.state, 'ready');
        assert(running);
        const message = {
          type: 'Increment',
          payload: {},
          correlationKey: 'one' as SagaCorrelationKey,
          idempotencyKey: 'backend-delivery',
        };
        await running.publish(message);
        await running.publish(message);
        const instanceId = 'backend-counter:one' as SagaInstanceId;
        const kvState = await kv.get<{ state: { count: number } }>(['sagas', 'state', instanceId]);
        const prismaState = await new PrismaSagaStore({ prisma: client }).load(instanceId);
        assertEquals(kvState?.value.state.count, backend === 'kv' ? 1 : undefined);
        assertEquals(prismaState?.state.count, backend === 'prisma' ? 1 : undefined);
        assertEquals(prismaState?.metadata.version, backend === 'prisma' ? 1 : undefined);
        assertEquals(calls.context, 1);
        assertEquals(
          (await client.sagaRuntimeTransition.findMany({
            where: { instanceId },
            orderBy: { version: 'asc' },
          })).length,
          backend === 'prisma' ? 1 : 0,
        );
        let apiDbCalls = 0;
        api = await createSagasService({
          env: { ...env, PORT: '0' },
          appsettings,
          db: {
            getClient: () => {
              apiDbCalls++;
              return Promise.resolve(client);
            },
          },
          contracts: undefined,
          kv,
          logger: undefined,
        });
        const response = await api.app.request('/api/v1/sagas/instances');
        assertEquals(response.status, 200);
        await response.json();
        assertEquals(apiDbCalls, backend === 'prisma' ? 1 : 0);
        assertEquals(client.queryReads > 0, backend === 'prisma');
      } finally {
        await api?.stop();
        await supervisor?.stop();
        await resetKv();
        if (registryEnv === undefined) Deno.env.delete('SAGAS_REGISTRY_MODULE');
        else Deno.env.set('SAGAS_REGISTRY_MODULE', registryEnv);
        await Deno.remove(directory, { recursive: true });
      }
    });
  }
}

for (
  const { value, error } of [
    { value: undefined, error: 'Saga store backend is required.' },
    { value: 'sqlite', error: 'Invalid saga store backend' },
    {
      value: 'prisma',
      error: 'Prisma saga store backend requires a plugin service bootstrap module.',
    },
  ]
) {
  Deno.test(`canonical runner rejects ${value ?? 'missing'} selector before delivery`, async () => {
    let started = false;
    await assertRejects(
      () =>
        startSagaRunner({
          deliveryQueue: new MemoryQueueAdapter(),
          projection: false,
          readEnv: (name) => name === 'NETSCRIPT_SAGA_STORE' ? value : undefined,
          importer: () => Promise.resolve({ definitions: [] }),
          supervisor: {
            delivery: {
              start: () => {
                started = true;
                return Promise.resolve();
              },
              stop: () => Promise.resolve(),
              wait: () => new Promise<void>(() => undefined),
            },
          },
        }),
      Error,
      error,
    );
    assertEquals(started, false);
  });
}

Deno.test('canonical Prisma rejects missing runtime delegates despite projection none', async () => {
  const bootstrap = `data:application/typescript,${
    encodeURIComponent(`
    export function createPluginServiceContext() {
      return Promise.resolve({ env: { NETSCRIPT_SAGA_STORE: 'prisma', NETSCRIPT_SAGA_PROJECTION: 'none' },
        db: { getClient: () => Promise.resolve({ sagaInstance: { upsert() {} } }) } });
    }
  `)
  }`;
  await assertRejects(
    () =>
      startSagaRunner({
        deliveryQueue: new MemoryQueueAdapter(),
        readEnv: (name) =>
          name === 'NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE' ? bootstrap : undefined,
        importer: () => Promise.resolve({ definitions: [] }),
      }),
    Error,
    'Sagas database client is missing required Prisma runtime delegates.',
  );
});
