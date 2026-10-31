import type { KvStore } from '@netscript/kv';
import {
  isPrismaSagaStoreClient,
  KvSagaStore,
  openSagaRuntimeKv,
  PrismaSagaStore,
  resolveSagaProjectionBackend,
  resolveSagaStoreBackend,
  type SagaStoreBackendResolutionInput,
} from '@netscript/plugin-sagas-core/stores';
import { resolveSagaServicePrismaClient, type SagaServicePrismaClient } from './database-client.ts';
import type { SagaServiceContext, SagaServiceDatabaseClient } from './routers/v1-types.ts';

/** Read-side wiring, independent of the optional archive/query projection backend. */
export type SagaInstanceQuery = Readonly<{
  context: SagaServiceContext;
  prisma?: SagaServicePrismaClient;
}>;

/** Compose existing store and projection ports without requiring unused database delegates. */
export async function resolveSagaInstanceQuery(
  input: SagaStoreBackendResolutionInput,
  dependencies: Readonly<{
    loadPrisma: () => Promise<unknown>;
    openKv?: () => Promise<KvStore>;
  }>,
): Promise<SagaInstanceQuery> {
  const backend = resolveSagaStoreBackend({ ...input, defaultBackend: 'kv' });
  const projection = resolveSagaProjectionBackend(input);
  if (projection === 'prisma') {
    const prisma = resolveSagaServicePrismaClient(await dependencies.loadPrisma(), 'prisma');
    if (!prisma) throw new Error('Sagas Prisma projection client is unavailable.');
    return { context: { db: prisma, useKvProjection: false }, prisma };
  }
  const sagaStore = backend === 'kv'
    ? new KvSagaStore({ kv: await (dependencies.openKv ?? openSagaRuntimeKv)() })
    : await loadPrismaStore(dependencies.loadPrisma);
  return {
    context: { db: emptySagaDatabaseClient, useKvProjection: projection === 'kv', sagaStore },
  };
}

async function loadPrismaStore(loadPrisma: () => Promise<unknown>): Promise<PrismaSagaStore> {
  const prisma = await loadPrisma();
  if (!isPrismaSagaStoreClient(prisma)) {
    throw new Error('Sagas database client is missing required Prisma runtime delegates.');
  }
  return new PrismaSagaStore({ prisma });
}

const emptySagaDatabaseClient: SagaServiceDatabaseClient = Object.freeze({
  sagaInstance: Object.freeze({
    findFirst: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    count: () => Promise.resolve(0),
  }),
  sagaExecutionHistory: Object.freeze({
    findMany: () => Promise.resolve([]),
    count: () => Promise.resolve(0),
  }),
});
