import { assert, assertEquals, assertRejects } from '@std/assert';
import { call } from '@orpc/server';
import { z } from 'zod';
import { getKv, type KvEntry, type KvKey, MemoryKvAdapter, resetKv } from '@netscript/kv';
import { KvSagaStore } from '@netscript/plugin-sagas-core/stores';
import type {
  SagaCorrelationKey,
  SagaId,
  SagaInstanceId,
  SagaStateEnvelope,
} from '@netscript/plugin-sagas-core/domain';
import {
  KvSagaInstanceProjection,
  PrismaSagaInstanceProjection,
  type SagaInstanceProjection,
  type SagaInstanceReadModel,
} from '../../src/runtime/saga-instance-projection.ts';
import { sagasV1 } from './routers/v1-handlers.ts';
import { mapPrismaRecordToInstance } from './routers/v1-helpers.ts';
import type { PrismaRecord, SagaServiceDatabaseClient } from './routers/v1-types.ts';

const sagaId = 'checkout' as SagaId;
const correlationKey = 'order-1' as SagaCorrelationKey;
// Deliberately unrelated to sagaId/correlationKey: the index, not concatenation, owns identity.
const instanceId = 'opaque-instance' as SagaInstanceId;
const businessState = {
  status: 'payment_pending',
  metadata: { status: 'business-only', version: 99 },
  state: { nested: ['untouched'] },
  sagaId: 'business-saga',
  instanceId: 'business-instance',
  correlationKey: 'business-correlation',
  version: 404,
  createdAt: 'business-date',
  lastMessageType: 'business-message',
};

function projection(): SagaInstanceProjection {
  const now = new Date('2030-01-01T00:00:00Z');
  const envelope: SagaStateEnvelope = {
    state: businessState,
    metadata: {
      instanceId,
      version: 3,
      status: 'compensating',
      durability: 't1',
      createdAt: now,
      updatedAt: now,
    },
  };
  return {
    sagaId,
    correlationKey,
    instanceId,
    envelope,
    transition: {
      version: 3,
      transition: {
        from: {},
        to: businessState,
        status: 'compensating',
        message: { type: 'PaymentFailed', payload: {} },
        occurredAt: now,
      },
    },
  };
}

class CountingKv extends MemoryKvAdapter {
  readonly reads: KvKey[] = [];
  override get<T>(key: KvKey): Promise<KvEntry<T> | null> {
    this.reads.push(key);
    return super.get<T>(key);
  }
}

function queryClient(row?: PrismaRecord): SagaServiceDatabaseClient {
  return {
    sagaInstance: {
      findFirst: () => Promise.resolve(row ?? null),
      findMany: () => Promise.resolve(row ? [row] : []),
      count: () => Promise.resolve(row ? 1 : 0),
    },
    sagaExecutionHistory: {
      findMany: () => Promise.resolve([]),
      count: () => Promise.resolve(0),
    },
  };
}

Deno.test('KV projection and list API preserve every business state field beside runtime status', async () => {
  await resetKv();
  try {
    const kv = await getKv({ provider: 'deno-kv', path: ':memory:', skipServiceDiscovery: true });
    const value = projection();
    await new KvSagaInstanceProjection(kv, () => 7).upsert(value);
    const stored = await kv.get<SagaInstanceReadModel>(['saga_instances', sagaId, instanceId]);
    assertEquals(stored?.value.state, businessState);
    assertEquals(stored?.value.status, 'compensating');
    const listed = await call(sagasV1.listInstances, { limit: 10, offset: 0 }, {
      context: { db: queryClient(), useKvProjection: true },
    });
    assertEquals(listed.instances[0]?.state, businessState);
    assertEquals(listed.instances[0]?.status, 'compensating');
  } finally {
    await resetKv();
  }
});

for (const unrelated of [0, 100, 1000]) {
  Deno.test(`GET instance reads exactly index+envelope with ${unrelated} unrelated instances`, async () => {
    await using kv = new CountingKv();
    const store = new KvSagaStore({ kv });
    const value = projection();
    await store.save(value.envelope, { correlation: { sagaId, correlationKey, instanceId } });
    // Populate valid unrelated instances, without assuming IDs can be derived from correlation.
    const projector = new KvSagaInstanceProjection(kv, () => 7);
    for (let i = 0; i < unrelated; i++) {
      const otherId = `unrelated-${i}` as SagaInstanceId;
      const envelope = {
        ...value.envelope,
        metadata: { ...value.envelope.metadata, instanceId: otherId, sagaId: 'unrelated' },
      };
      await store.save(envelope, {
        correlation: {
          sagaId: 'unrelated' as SagaId,
          correlationKey: `${i}` as SagaCorrelationKey,
          instanceId: otherId,
        },
      });
      await projector.upsert({
        ...value,
        sagaId: 'unrelated',
        instanceId: otherId,
        correlationKey: `${i}`,
        envelope,
      });
    }
    kv.reads.length = 0;
    const instance = await call(sagasV1.getInstance, {
      sagaName: sagaId,
      correlationId: correlationKey,
    }, {
      context: { db: queryClient(), useKvProjection: true, sagaStore: store },
    }).finally(() => {
      assertEquals(kv.reads, [
        ['sagas', 'correlation', sagaId, correlationKey],
        ['sagas', 'state', instanceId],
      ]);
    });
    assertEquals(instance.state, businessState);
    assertEquals(instance.status, 'compensating');
    assertEquals(instance.version, 3);
    assertEquals(instance.instanceId, instanceId);
    assertEquals(instance.lastMessageType, undefined);
  });
}

Deno.test('direct GET returns NOT_FOUND for missing and dangling correlations without scanning', async () => {
  await using kv = new CountingKv();
  const store = new KvSagaStore({ kv });
  const context = { db: queryClient(), useKvProjection: true, sagaStore: store };
  for (const dangling of [false, true]) {
    if (dangling) await kv.set(['sagas', 'correlation', sagaId, correlationKey], instanceId);
    kv.reads.length = 0;
    const error = await assertRejects(() =>
      call(sagasV1.getInstance, {
        sagaName: sagaId,
        correlationId: correlationKey,
      }, { context })
    );
    assert(error instanceof Error && 'code' in error);
    assertEquals(error.code, 'NOT_FOUND');
    assertEquals(kv.reads.length, dangling ? 2 : 1);
  }
});

Deno.test('Prisma projection, GET and list preserve business status with one indexed GET query', async () => {
  let row: PrismaRecord | undefined;
  const queries: unknown[] = [];
  const client = queryClient();
  client.sagaInstance.findFirst = (args) => {
    queries.push(args);
    return Promise.resolve(row ?? null);
  };
  client.sagaInstance.findMany = () => {
    throw new Error('Single-instance GET must not list or sort all instances');
  };
  client.sagaInstance.count = () => {
    throw new Error('Single-instance GET must not count instances');
  };
  const projected = new PrismaSagaInstanceProjection({
    sagaInstance: {
      upsert(args) {
        const created = args.create;
        assert(typeof created === 'object' && created !== null);
        // Validate the boundary with the same JSON representation Prisma persists.
        const data = z.object({
          id: z.string(),
          sagaName: z.string(),
          correlationId: z.string(),
          version: z.number(),
          isCompleted: z.boolean(),
          state: z.record(z.string(), z.unknown()),
          createdAt: z.string(),
          updatedAt: z.string(),
        }).parse(JSON.parse(JSON.stringify(created)));
        row = {
          id: data.id,
          sagaName: data.sagaName,
          correlationId: data.correlationId,
          state: data.state,
          version: data.version,
          isCompleted: data.isCompleted,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        };
        return Promise.resolve();
      },
    },
  });
  await projected.upsert(projection());
  assert(row);
  assertEquals(row.state.state, businessState);
  assertEquals(row.state.status, 'compensating');
  const context = { db: client, useKvProjection: false };
  const instance = await call(sagasV1.getInstance, {
    sagaName: sagaId,
    correlationId: correlationKey,
  }, { context });
  assertEquals(queries, [{ where: { sagaName: sagaId, correlationId: correlationKey } }]);
  assertEquals(instance.state, businessState);
  assertEquals(instance.status, 'compensating');
  assertEquals(instance.lastMessageType, 'PaymentFailed');
  client.sagaInstance.findMany = () => Promise.resolve(row ? [row] : []);
  client.sagaInstance.count = () => Promise.resolve(1);
  const listed = await call(sagasV1.listInstances, { limit: 10, offset: 0 }, { context });
  assertEquals(listed.instances[0]?.state, businessState);
  assertEquals(listed.instances[0]?.status, 'compensating');
  row = undefined;
  const error = await assertRejects(() =>
    call(sagasV1.getInstance, {
      sagaName: sagaId,
      correlationId: 'absent',
    }, { context })
  );
  assert(error instanceof Error && 'code' in error);
  assertEquals(error.code, 'NOT_FOUND');
});

Deno.test('legacy Prisma state with state/metadata keys is never mistaken for the new projection', () => {
  const state = { ...businessState, status: 'running' };
  const now = new Date('2030-01-01T00:00:00Z');
  const response = mapPrismaRecordToInstance({
    id: instanceId,
    sagaName: sagaId,
    correlationId: correlationKey,
    state,
    version: 3,
    isCompleted: false,
    createdAt: now,
    updatedAt: now,
  });
  assertEquals(response.state, state);
  assertEquals(response.status, 'running');
  assertEquals(response.version, 3);
});
