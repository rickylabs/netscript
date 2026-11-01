import { assert, assertEquals } from '@std/assert';
import { call } from '@orpc/server';
import { getKv, resetKv } from '@netscript/kv';
import { SAGA_INSTANCE_STATUSES } from '@netscript/plugin-sagas-core/domain';
import type { SagaInstanceId, SagaInstanceStatus } from '@netscript/plugin-sagas-core/domain';
import { z } from 'zod';
import {
  KvSagaInstanceProjection,
  PrismaSagaInstanceProjection,
  type SagaInstanceProjection,
} from '../../src/runtime/saga-instance-projection.ts';
import { sagasV1 } from './routers/v1-handlers.ts';
import { mapPrismaRecordToInstance } from './routers/v1-helpers.ts';
import type {
  PrismaRecord,
  SagaInstanceWhereInput,
  SagaServiceDatabaseClient,
} from './routers/v1-types.ts';

const now = new Date('2030-01-01T00:00:00Z');
const businessState = { status: 'payment_pending', metadata: { status: 'business' } };
const RowSchema = z.object({
  id: z.string(),
  sagaName: z.string(),
  correlationId: z.string(),
  version: z.number(),
  status: z.enum(SAGA_INSTANCE_STATUSES),
  isCompleted: z.boolean(),
  state: z.record(z.string(), z.unknown()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

function projection(status: SagaInstanceStatus): SagaInstanceProjection {
  const instanceId = `opaque-${status}` as SagaInstanceId;
  return {
    sagaId: 'status-parity',
    instanceId,
    correlationKey: status,
    envelope: {
      state: businessState,
      metadata: {
        instanceId,
        status,
        version: 2,
        durability: 't1',
        createdAt: now,
        updatedAt: now,
      },
    },
    transition: {
      version: 2,
      transition: {
        from: {},
        to: businessState,
        status,
        message: { type: 'LifecycleChanged', payload: {} },
        occurredAt: now,
      },
    },
  };
}

/** In-memory Prisma delegate boundary; reject obsolete JSON/boolean list filtering. */
function prismaClient(rows: Map<string, PrismaRecord>) {
  function matching(where: SagaInstanceWhereInput = {}): PrismaRecord[] {
    assertEquals(Object.keys(where).filter((key) => !['sagaName', 'status'].includes(key)), []);
    return [...rows.values()].filter((row) =>
      (!where.sagaName || row.sagaName === where.sagaName) &&
      (!where.status || row.status === where.status)
    );
  }
  return {
    sagaInstance: {
      upsert(args: Readonly<Record<string, unknown>>): Promise<void> {
        const create = RowSchema.parse(args.create);
        const previous = rows.get(create.id);
        const row = previous
          ? RowSchema.parse({
            ...previous,
            ...z.object({
              status: z.enum(SAGA_INSTANCE_STATUSES),
              version: z.number(),
              isCompleted: z.boolean(),
              state: z.record(z.string(), z.unknown()),
              updatedAt: z.date(),
            }).parse(args.update),
          })
          : create;
        rows.set(row.id, structuredClone(row));
        return Promise.resolve();
      },
      findFirst: ({ where }: { where: { sagaName: string; correlationId: string } }) =>
        Promise.resolve(
          [...rows.values()].find((row) =>
            row.sagaName === where.sagaName && row.correlationId === where.correlationId
          ) ?? null,
        ),
      findMany: (
        { where, take, skip }: Parameters<SagaServiceDatabaseClient['sagaInstance']['findMany']>[0],
      ) => Promise.resolve(matching(where).slice(skip ?? 0, (skip ?? 0) + (take ?? rows.size))),
      count: ({ where }: { where?: SagaInstanceWhereInput }) =>
        Promise.resolve(matching(where).length),
    },
    sagaExecutionHistory: {
      findMany: () => Promise.resolve([]),
      count: () => Promise.resolve(0),
    },
  } satisfies SagaServiceDatabaseClient & {
    sagaInstance: { upsert(args: Readonly<Record<string, unknown>>): Promise<void> };
  };
}

Deno.test('KV and Prisma lists agree for every canonical lifecycle on create and update', async () => {
  await resetKv();
  try {
    const kv = await getKv({ provider: 'deno-kv', path: ':memory:', skipServiceDiscovery: true });
    const rows = new Map<string, PrismaRecord>();
    const db = prismaClient(rows);
    const prismaProjection = new PrismaSagaInstanceProjection(db);
    const kvProjection = new KvSagaInstanceProjection(kv, () => 7, () => now);
    for (const status of SAGA_INSTANCE_STATUSES) {
      const value = projection(status);
      await prismaProjection.upsert(value);
      assertEquals(rows.get(value.instanceId)?.status, status);
      // Start with a different lifecycle on this same row so omitted update.status goes red.
      await prismaProjection.upsert({
        ...value,
        envelope: {
          ...value.envelope,
          metadata: { ...value.envelope.metadata, status: 'pending' },
        },
      });
      assertEquals(rows.get(value.instanceId)?.status, 'pending');
      await prismaProjection.upsert(value);
      await kvProjection.upsert(value);
    }
    const contexts = [{ db, useKvProjection: true }, { db, useKvProjection: false }];
    for (const status of [undefined, ...SAGA_INSTANCE_STATUSES]) {
      const input = { sagaName: 'status-parity', status, limit: 100, offset: 0 };
      const [kvList, prismaList] = await Promise.all(
        contexts.map((context) => call(sagasV1.listInstances, input, { context })),
      );
      const statuses = (instances: typeof kvList.instances) =>
        Object.fromEntries(instances.map((instance) => [instance.instanceId, instance.status]));
      assertEquals(statuses(prismaList.instances), statuses(kvList.instances));
      assertEquals(prismaList.total, status ? 1 : SAGA_INSTANCE_STATUSES.length);
      assertEquals(prismaList.total, kvList.total);
      for (const instance of prismaList.instances) assertEquals(instance.state, businessState);
      if (status) {
        assertEquals(prismaList.instances[0]?.status, status);
        const page = await call(sagasV1.listInstances, { ...input, limit: 1, offset: 1 }, {
          context: contexts[1],
        });
        assertEquals(page.total, 1);
        assertEquals(page.instances, []);
      }
    }
  } finally {
    await resetKv();
  }
});

Deno.test('pre-fix flat rows remain readable and migrated rows use canonical list filters', async () => {
  for (const status of SAGA_INSTANCE_STATUSES) {
    const row: PrismaRecord = {
      id: `legacy-${status}`,
      sagaName: 'legacy',
      correlationId: status,
      state: { status, untouched: { customer: 'one' } },
      isCompleted: status === 'completed',
      version: 9,
      createdAt: now,
      updatedAt: now,
    };
    assertEquals(mapPrismaRecordToInstance(row).status, status);
    const migrated = { ...row, status };
    const db = prismaClient(new Map([[row.id, migrated]]));
    const list = await call(sagasV1.listInstances, {
      sagaName: row.sagaName,
      status,
      limit: 10,
      offset: 0,
    }, { context: { db, useKvProjection: false } });
    assertEquals(list.total, 1);
    assertEquals(list.instances[0]?.status, status);
    assertEquals(list.instances[0]?.state, row.state);
  }
  // The migrated scalar is authoritative; compatibility flags and JSON are not new writes.
  const value = projection('failed');
  const rows = new Map<string, PrismaRecord>();
  const db = prismaClient(rows);
  await new PrismaSagaInstanceProjection(db).upsert(value);
  const persisted = rows.get(value.instanceId);
  assert(persisted);
  const stale = {
    ...persisted,
    isCompleted: true,
    state: { ...persisted.state, status: 'running' },
  };
  assertEquals(mapPrismaRecordToInstance(stale).status, 'failed');
  assertEquals(mapPrismaRecordToInstance(stale).state, businessState);
});
