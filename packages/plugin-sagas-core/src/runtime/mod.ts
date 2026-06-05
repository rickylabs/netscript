/**
 * @module @netscript/plugin-sagas-core/runtime
 *
 * Native saga runtime primitives.
 */

export { createSagaEngine, SagaEngine } from './saga-engine.ts';
export { createSagaScheduler, SagaScheduler } from './saga-scheduler.ts';
export { createSagaCompensator, SagaCompensator } from './saga-compensator.ts';
export {
  cascadedMessageIdempotencyTarget,
  MemorySagaIdempotencyStore,
  SagaIdempotencyDedupTable,
  sagaMessageIdempotencyTarget,
} from './saga-idempotency.ts';
export { createSagaRuntime } from './create-saga-runtime.ts';
export { NoopLogger } from './logger.ts';
export type {
  CreateSagaRuntimeOptions,
  SagaRuntime,
  SagaRuntimeAdapter,
  SagaRuntimeNativeOptions,
} from './create-saga-runtime.ts';
export type { LoggerPort } from './logger.ts';
export type {
  SagaIdempotencyClock,
  SagaIdempotencyDedupTableOptions,
  SagaIdempotencyReservation,
  SagaIdempotencyTarget,
} from './saga-idempotency.ts';
export type {
  SagaCompensationRequest,
  SagaCompensationResult,
  SagaCompensatorOptions,
} from './saga-compensator.ts';
export type {
  SagaEngineDispatchEntry,
  SagaEngineHandleResult,
  SagaEngineOptions,
  SagaRetryClassification,
} from './saga-engine.ts';
export type {
  SagaScheduledMessageDispatcher,
  SagaScheduledMessageRecord,
  SagaScheduledMessageStatus,
  SagaSchedulerDrainFailure,
  SagaSchedulerDrainResult,
  SagaSchedulerOptions,
  SagaSchedulerStorePort,
} from './saga-scheduler.ts';
