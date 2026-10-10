/**
 * @module @netscript/plugin-sagas-core/stores
 *
 * Store extension subpath.
 *
 * Concrete persistent stores live outside the root module. The store port is
 * re-exported here so external store implementations can target a stable
 * role-named subpath without importing test-only memory stores.
 */

export { SAGA_DURABILITY_TIERS, SAGA_INSTANCE_STATUSES } from '../domain/mod.ts';
export type {
  SagaCompensationError,
  SagaCorrelationKey,
  SagaDurabilityTier,
  SagaId,
  SagaInstanceId,
  SagaInstanceStatus,
  SagaMessage,
  SagaMessageId,
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
export type {
  AtomicCheck,
  AtomicMutation,
  AtomicResult,
  KvEntry,
  KvKey,
  KvListOptions,
  KvSetOptions,
  KvStore,
} from '@netscript/kv';
export { MemorySagaAppliedKeyStore } from '../runtime/mod.ts';
export { KvSagaAppliedKeyStore, KvSagaIdempotencyStore } from './kv-saga-runtime-stores.ts';
export { KvSagaStore, openSagaRuntimeKv } from './kv-saga-store.ts';
export { PrismaSagaStore, SAGA_RUNTIME_CORRELATION_SELECTOR } from './prisma-saga-store.ts';
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
export type {
  PrismaSagaStoreClient,
  PrismaSagaStoreOptions,
  SagaRuntimeCorrelationDelegate,
  SagaRuntimeCorrelationRow,
  SagaRuntimeCorrelationWrite,
  SagaRuntimeStateDelegate,
  SagaRuntimeStateRow,
  SagaRuntimeStateUpdate,
  SagaRuntimeStateWrite,
  SagaRuntimeTransitionDelegate,
  SagaRuntimeTransitionRow,
  SagaRuntimeTransitionWrite,
  WriteResult,
} from './prisma-saga-store.ts';
export type {
  DurableSagaStoreBackend,
  SagaStoreBackendResolutionInput,
} from './saga-store-backend.ts';

export {
  createPrismaSagaTransitionStore,
  type PrismaSagaTransitionStore,
  type PrismaSagaTransitionStoreOptions,
} from './prisma-saga-transition-store.ts';
export type {
  SagaTransitionCommitPort,
  SagaTransitionCommitRequest,
  SagaTransitionCommitResult,
  SagaTransitionStore,
} from '../ports/saga-transition-commit-port.ts';
export type {
  DatabaseProvider,
  IsolationLevel,
  PostgresCommandClient,
  StoredCommandOutbox,
  TransactionClientPort,
  TransactionOptions,
} from '@netscript/database/commands/postgres';
