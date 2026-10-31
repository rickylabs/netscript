import { assert, assertEquals, assertRejects } from '@std/assert';
import { call } from '@orpc/server';
import { MemoryKvAdapter } from '@netscript/kv';
import {
  KvSagaStore,
  PrismaSagaStore,
  type PrismaSagaStoreClient,
} from '@netscript/plugin-sagas-core/stores';
import type {
  SagaCorrelationKey,
  SagaId,
  SagaInstanceId,
} from '@netscript/plugin-sagas-core/domain';
import { loadSagaBackendSettings } from '../../src/runtime/saga-runner.ts';
import { RunnerPrismaClient } from '../../tests/runtime/fixtures/runner-prisma-client.ts';
import { resolveSagaInstanceQuery } from './instance-query.ts';
import { sagasV1 } from './routers/v1-handlers.ts';

for (const backend of ['kv', 'prisma'] as const) {
  for (const projection of ['kv', 'prisma', 'none'] as const) {
    Deno.test(`API read wiring honors canonical ${backend} and projection ${projection}`, async () => {
      await using kv = new MemoryKvAdapter();
      const prisma = new RunnerPrismaClient();
      // Conflicting project settings prove the processor override used by the runner wins.
      const appsettings = await loadSagaBackendSettings('.', {
        Sagas: { Store: { Backend: backend === 'kv' ? 'prisma' : 'kv' } },
        NetScript: {
          BackgroundProcessors: {
            sagas: {
              Sagas: { Store: { Backend: backend }, Projection: { Backend: projection } },
            },
          },
        },
      });
      let kvOpens = 0;
      let dbLoads = 0;
      const { context } = await resolveSagaInstanceQuery({ env: {}, appsettings }, {
        openKv: () => {
          kvOpens++;
          return Promise.resolve(kv);
        },
        loadPrisma: () => {
          dbLoads++;
          return Promise.resolve(prisma);
        },
      });
      assertEquals(context.useKvProjection, projection === 'kv');
      assertEquals(kvOpens, projection !== 'prisma' && backend === 'kv' ? 1 : 0);
      assertEquals(dbLoads, projection === 'prisma' || backend === 'prisma' ? 1 : 0);
      if (projection === 'prisma') {
        assertEquals(context.sagaStore, undefined);
        assertEquals(context.db, prisma);
      } else {
        assert(context.sagaStore instanceof (backend === 'kv' ? KvSagaStore : PrismaSagaStore));
        // Exercise the actual route with the composed store, not just its constructor type.
        const canonical = context.sagaStore;
        const sagaId = 'query-wiring' as SagaId;
        const correlationKey = 'one' as SagaCorrelationKey;
        const instanceId = 'arbitrary-key' as SagaInstanceId;
        const now = new Date();
        await canonical.save({
          metadata: {
            instanceId,
            sagaId,
            version: 1,
            status: 'running',
            durability: 't1',
            createdAt: now,
            updatedAt: now,
          },
          state: { status: 'business' },
        });
        await canonical.saveCorrelation({ sagaId, correlationKey, instanceId });
        const instance = await call(sagasV1.getInstance, {
          sagaName: sagaId,
          correlationId: correlationKey,
        }, { context });
        assertEquals(instance.state, { status: 'business' });
        assertEquals(instance.status, 'running');
        if (projection === 'none') {
          const list = await call(sagasV1.listInstances, { limit: 10, offset: 0 }, { context });
          assertEquals(list.instances, []);
        }
      }
    });
  }
}

Deno.test('API defaults to KV and respects environment overrides without loading Prisma', async () => {
  await using kv = new MemoryKvAdapter();
  for (
    const input of [
      { env: {} },
      {
        env: { NETSCRIPT_SAGA_STORE: 'kv', NETSCRIPT_SAGA_PROJECTION: 'none' },
        appsettings: { Sagas: { Store: { Backend: 'prisma' } } },
      },
    ]
  ) {
    const { context } = await resolveSagaInstanceQuery(input, {
      openKv: () => Promise.resolve(kv),
      loadPrisma: () => {
        throw new Error('KV-only reads must not load Prisma');
      },
    });
    assert(context.sagaStore instanceof KvSagaStore);
  }
});

Deno.test('Prisma canonical GET with KV projection requires only runtime delegates', async () => {
  const client = new RunnerPrismaClient();
  const runtime: PrismaSagaStoreClient = {
    sagaRuntimeState: client.sagaRuntimeState,
    sagaRuntimeTransition: client.sagaRuntimeTransition,
    sagaRuntimeCorrelation: client.sagaRuntimeCorrelation,
    sagaRuntimeCommandAppliedKey: client.sagaRuntimeCommandAppliedKey,
    $transaction: client.$transaction.bind(client),
  };
  const { context } = await resolveSagaInstanceQuery({
    env: { NETSCRIPT_SAGA_STORE: 'prisma', NETSCRIPT_SAGA_PROJECTION: 'kv' },
  }, {
    loadPrisma: () => Promise.resolve(runtime),
    openKv: () => {
      throw new Error('Prisma canonical lookup must not open KV');
    },
  });
  assert(context.sagaStore instanceof PrismaSagaStore);
});

Deno.test('API settings share the runner project-file loader and processor override', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(
      `${root}/appsettings.json`,
      JSON.stringify({
        Sagas: { Store: { Backend: 'kv' } },
        NetScript: {
          BackgroundProcessors: {
            sagas: { Sagas: { Store: { Backend: 'prisma' }, Projection: { Backend: 'none' } } },
          },
        },
      }),
    );
    const input = { env: {}, appsettings: await loadSagaBackendSettings(root) };
    const { context } = await resolveSagaInstanceQuery(input, {
      loadPrisma: () => Promise.resolve(new RunnerPrismaClient()),
    });
    assert(context.sagaStore instanceof PrismaSagaStore);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('Prisma projection fails closed without query delegates', async () => {
  await assertRejects(
    () =>
      resolveSagaInstanceQuery({ env: { NETSCRIPT_SAGA_PROJECTION: 'prisma' } }, {
        loadPrisma: () => Promise.resolve({}),
      }),
    Error,
    'missing required Prisma delegates',
  );
});
