import type {
  DurableSagaStoreBackend,
  PrismaSagaStoreClient,
} from '@netscript/plugin-sagas-core/stores';
import type { SagaStreamPrismaClient } from '../../streams/server.ts';
import type { SagaServiceDatabaseClient } from './routers/v1-types.ts';

/** Full Prisma surface used by saga query, durable-store, and stream projections. */
export type SagaServicePrismaClient =
  & SagaServiceDatabaseClient
  & PrismaSagaStoreClient
  & SagaStreamPrismaClient;

/**
 * Resolve optional saga Prisma delegates for a selected durable backend.
 *
 * KV-backed runtimes do not require saga models in the host Prisma client; their query surface can
 * remain on the empty adapter while lifecycle state is persisted in KV. Prisma-backed runtimes must
 * fail closed because those delegates are the durable store.
 */
export function resolveSagaServicePrismaClient(
  value: unknown,
  backend: DurableSagaStoreBackend,
): SagaServicePrismaClient | undefined {
  if (isSagaServicePrismaClient(value)) {
    return value;
  }
  if (backend === 'prisma') {
    throw new Error('Sagas database client is missing required Prisma delegates.');
  }
  return undefined;
}

function isSagaServicePrismaClient(value: unknown): value is SagaServicePrismaClient {
  if (!isObject(value)) return false;

  const sagaInstance = Reflect.get(value, 'sagaInstance');
  const sagaExecutionHistory = Reflect.get(value, 'sagaExecutionHistory');
  const sagaRuntimeState = Reflect.get(value, 'sagaRuntimeState');
  const sagaRuntimeTransition = Reflect.get(value, 'sagaRuntimeTransition');
  const sagaRuntimeCorrelation = Reflect.get(value, 'sagaRuntimeCorrelation');

  return isObject(sagaInstance) &&
    hasMethod(sagaInstance, 'findMany') &&
    hasMethod(sagaInstance, 'count') &&
    isObject(sagaExecutionHistory) &&
    hasMethod(sagaExecutionHistory, 'findMany') &&
    hasMethod(sagaExecutionHistory, 'count') &&
    isObject(sagaRuntimeState) &&
    isObject(sagaRuntimeTransition) &&
    isObject(sagaRuntimeCorrelation) &&
    hasMethod(value, '$transaction');
}

function hasMethod(value: object, key: string): boolean {
  return typeof Reflect.get(value, key) === 'function';
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}
