import { assert, assertEquals } from '@std/assert';
import { call } from '@orpc/server';
import { defineSaga, sagaComplete } from '@netscript/plugin-sagas-core';
import { SagaEngine } from '@netscript/plugin-sagas-core/runtime';
import { MemorySagaStore } from '@netscript/plugin-sagas-core/testing';
import type { SagaCorrelationKey, SagaState } from '@netscript/plugin-sagas-core/domain';
import {
  PrismaSagaInstanceProjection,
  ProjectingSagaStore,
} from '../../src/runtime/saga-instance-projection.ts';
import { sagasV1 } from './routers/v1-handlers.ts';
import type { PrismaRecord, SagaServiceDatabaseClient } from './routers/v1-types.ts';

Deno.test('Prisma-backed saga API retains its query model when optional archiveToDb is false', async () => {
  const records: PrismaRecord[] = [];
  const client = {
    sagaInstance: {
      upsert(args: Readonly<Record<string, unknown>>): Promise<void> {
        const row = args.create;
        assert(typeof row === 'object' && row !== null);
        assert('id' in row && typeof row.id === 'string');
        assert('sagaName' in row && typeof row.sagaName === 'string');
        assert('correlationId' in row && typeof row.correlationId === 'string');
        assert('version' in row && typeof row.version === 'number');
        assert('isCompleted' in row && typeof row.isCompleted === 'boolean');
        assert('state' in row && typeof row.state === 'object' && row.state !== null);
        assert('createdAt' in row && row.createdAt instanceof Date);
        assert('updatedAt' in row && row.updatedAt instanceof Date);
        records.splice(0, records.length, {
          id: row.id,
          sagaName: row.sagaName,
          correlationId: row.correlationId,
          version: row.version,
          isCompleted: row.isCompleted,
          state: { ...row.state },
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        });
        return Promise.resolve();
      },
      findMany: () => Promise.resolve(records),
      count: () => Promise.resolve(records.length),
    },
    sagaExecutionHistory: {
      findMany: () => Promise.resolve([]),
      count: () => Promise.resolve(0),
    },
  } satisfies SagaServiceDatabaseClient & {
    sagaInstance: { upsert(args: Readonly<Record<string, unknown>>): Promise<void> };
  };
  const projection = new PrismaSagaInstanceProjection(client, () => false, 'prisma');
  const engine = new SagaEngine({
    store: new ProjectingSagaStore(new MemorySagaStore(), projection),
  });
  const definition = defineSaga('prisma-query').state<SagaState>({ status: 'pending' })
    .on('Done', () => [sagaComplete()]).build();
  await engine.register([definition]);
  await engine.start();
  try {
    await engine.handle({ type: 'Done', payload: {}, correlationKey: 'one' as SagaCorrelationKey });
    const context = { db: client, useKvProjection: false };
    const result = await call(sagasV1.listInstances, { limit: 10, offset: 0 }, { context });
    assertEquals(result.total, 1);
    assertEquals(result.instances[0]?.status, 'completed');
    const instance = await call(sagasV1.getInstance, {
      sagaName: 'prisma-query',
      correlationId: 'one',
    }, { context });
    assertEquals(instance.version, 1);
    assertEquals(instance.status, 'completed');
  } finally {
    await engine.stop();
  }
});
