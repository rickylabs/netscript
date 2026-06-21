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
