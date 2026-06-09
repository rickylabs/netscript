/**
 * @module
 *
 * Curated root exports for `@netscript/plugin-sagas-core`.
 *
 * This barrel starts empty in slice E1. Later slices add only stable,
 * documented root exports that fit the 25-export budget in the v2 plan.
 */

export { defineQuery, defineSaga, defineSignal } from '../builders/mod.ts';
export { CASCADED_MESSAGE_KINDS, SAGA_DURABILITY_TIERS } from '../domain/mod.ts';
export type {
  QueryDefinition,
  SagaBuilder,
  SagaBuilderPhase,
  SagaConcurrencyOptions,
  SagaEvent,
  SignalDefinition,
  SyncQueryResult,
} from '../builders/mod.ts';
export type {
  CascadedMessage,
  CascadedMessageKind,
  CascadedMessageOptions,
  CascadedMessageTarget,
  RetryPolicy,
  SagaConcurrencyPolicy,
  SagaContext,
  SagaCorrelationKey,
  SagaCorrelationRule,
  SagaDefinition,
  SagaDurabilityTier,
  SagaHandler,
  SagaId,
  SagaInstanceId,
  SagaMessageId,
  SagaMessage,
  SagaQueryHandler,
  SagaSignalHandler,
  SagaState,
} from '../domain/mod.ts';
export { sagaCompensate, sagaComplete, sagaFail, schedule, send, spawn } from './messages.ts';
export type { SagaScheduleDelay, SendOptions, SpawnOptions } from './messages.ts';
