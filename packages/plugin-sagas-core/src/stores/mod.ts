/**
 * @module @netscript/plugin-sagas-core/stores
 *
 * Store extension subpath.
 *
 * Group E keeps concrete persistent stores outside the root barrel. The store
 * port is re-exported here so external store implementations can target a
 * stable role-named subpath without importing test-only memory stores.
 */

export { SAGA_DURABILITY_TIERS, SAGA_INSTANCE_STATUSES } from '../domain/mod.ts';
export type {
  SagaCorrelationKey,
  SagaDurabilityTier,
  SagaId,
  SagaInstanceId,
  SagaInstanceStatus,
  SagaState,
  SagaStateEnvelope,
  SagaStateMetadata,
  SagaTransition,
  SagaTransitionRecord,
} from '../domain/mod.ts';
export type {
  SagaIdempotencyReservation,
  SagaIdempotencyTarget,
} from '../runtime/saga-idempotency.ts';
export type {
  SagaAppliedKeyOutcome,
  SagaAppliedKeyStore,
  SagaCorrelationIndexEntry,
  SagaIdempotencyPort,
  SagaStorePort,
  SagaStoreWriteOptions,
} from '../ports/mod.ts';
export { MemorySagaAppliedKeyStore } from '../runtime/mod.ts';
export { KvSagaAppliedKeyStore, KvSagaIdempotencyStore } from './kv-saga-runtime-stores.ts';
export { KvSagaStore, openSagaRuntimeKv } from './kv-saga-store.ts';
export { PrismaSagaStore } from './prisma-saga-store.ts';
export {
  resolveSagaStoreBackend,
  SAGA_STORE_BACKEND_ENV,
  SAGA_STORE_BACKENDS,
} from './saga-store-backend.ts';
export type {
  KvSagaAppliedKeyStoreOptions,
  KvSagaIdempotencyStoreOptions,
  SagaRuntimeKvStoreOptions,
} from './kv-saga-runtime-stores.ts';
export type { KvSagaStoreOptions } from './kv-saga-store.ts';
export type { PrismaSagaStoreClient, PrismaSagaStoreOptions } from './prisma-saga-store.ts';
export type {
  DurableSagaStoreBackend,
  SagaStoreBackendResolutionInput,
} from './saga-store-backend.ts';
