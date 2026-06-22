/**
 * @module @netscript/plugin-sagas-core/adapters
 *
 * Saga bus adapter implementations.
 */

export {
  CASCADED_MESSAGE_KINDS,
  SAGA_DURABILITY_TIERS,
  SAGA_INSTANCE_STATUSES,
} from '../domain/mod.ts';
export type {
  CascadedMessage,
  CascadedMessageKind,
  CascadedMessageOptions,
  CascadedMessageTarget,
  QueryDefinition,
  RetryPolicy,
  SagaConcurrencyPolicy,
  SagaContext,
  SagaCorrelation,
  SagaCorrelationKey,
  SagaCorrelationRule,
  SagaDefinition,
  SagaDurabilityTier,
  SagaHandler,
  SagaId,
  SagaInstanceId,
  SagaInstanceStatus,
  SagaMessage,
  SagaMessageId,
  SagaQueryHandler,
  SagaSignal,
  SagaSignalHandler,
  SagaState,
  SagaStateEnvelope,
  SagaStateMetadata,
  SagaTransition,
  SagaTransitionRecord,
  SignalDefinition,
} from '../domain/mod.ts';
export type {
  SagaBusPort,
  SagaClockPort,
  SagaCorrelationIndexEntry,
  SagaIdempotencyPort,
  SagaPublishOptions,
  SagaQueryDispatch,
  SagaSignalDispatch,
  SagaSleepOptions,
  SagaStorePort,
  SagaStoreWriteOptions,
} from '../ports/mod.ts';
export type { LoggerPort } from '../runtime/logger.ts';
export { SagaIdempotencyDedupTable } from '../runtime/saga-idempotency.ts';
export type {
  SagaCompensationRequest,
  SagaCompensationResult,
  SagaCompensator,
  SagaCompensatorOptions,
} from '../runtime/saga-compensator.ts';
export type {
  SagaEngine,
  SagaEngineDispatchEntry,
  SagaEngineHandleResult,
  SagaEngineOptions,
  SagaRetryClassification,
} from '../runtime/saga-engine.ts';
export type {
  SagaIdempotencyClock,
  SagaIdempotencyDedupTableOptions,
  SagaIdempotencyReservation,
  SagaIdempotencyTarget,
} from '../runtime/saga-idempotency.ts';
export type {
  SagaScheduledMessageDispatcher,
  SagaScheduledMessageRecord,
  SagaScheduledMessageStatus,
  SagaScheduler,
  SagaSchedulerDrainFailure,
  SagaSchedulerDrainResult,
  SagaSchedulerOptions,
  SagaSchedulerStorePort,
} from '../runtime/saga-scheduler.ts';
export { createSagaBusBridge, SagaBusBridge } from './saga-bus-bridge.ts';
export type { SagaBridgeCompensationResolver, SagaBusBridgeOptions } from './saga-bus-bridge.ts';
