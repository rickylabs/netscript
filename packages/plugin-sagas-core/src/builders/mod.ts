/**
 * @module @netscript/plugin-sagas-core/builders
 *
 * Userland saga DSL builders.
 */

export { defineSaga } from './define-saga.ts';
export { defineQuery } from './define-query.ts';
export { defineSignal } from './define-signal.ts';
export { CASCADED_MESSAGE_KINDS, SAGA_DURABILITY_TIERS } from '../domain/mod.ts';
export type {
  SagaBuilder,
  SagaBuilderPhase,
  SagaConcurrencyOptions,
  SagaEvent,
  SyncQueryResult,
} from './define-saga.ts';
export type {
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
  SagaInstanceId,
  SagaMessage,
  SagaMessageId,
  SagaQueryHandler,
  SagaSignalHandler,
  SagaState,
  SignalDefinition,
} from '../domain/mod.ts';
