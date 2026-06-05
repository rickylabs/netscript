/**
 * @module @netscript/plugin-sagas-core/domain
 *
 * Pure saga domain vocabulary: branded identifiers, finite constants, message
 * shapes, state envelopes, definitions, retry policy, transitions, and errors.
 */

export {
  CASCADED_MESSAGE_KINDS,
  DEFAULT_IDEMPOTENCY_WINDOW_MS,
  DEFAULT_RETRY_MAX_ATTEMPTS,
  DEFAULT_SAGA_DURABILITY_TIER,
  SAGA_ADAPTER_KINDS,
  SAGA_DURABILITY_TIERS,
  SAGA_INSTANCE_STATUSES,
  SAGAS_ERROR_CODES,
} from './constants.ts';
export type {
  CascadedMessageKind,
  SagaAdapterKind,
  SagaDurabilityTier,
  SagaInstanceStatus,
  SagasErrorCode,
} from './constants.ts';
export { DEFAULT_RETRY_POLICY } from './retry-policy.ts';
export { SagasError } from './errors.ts';
export type { SagasErrorOptions } from './errors.ts';
export type { SagaCorrelationKey, SagaId, SagaInstanceId, SagaMessageId } from './ids.ts';
export type { RetryPolicy } from './retry-policy.ts';
export type { SagaState, SagaStateEnvelope, SagaStateMetadata } from './saga-state.ts';
export type { SagaMessage, SagaMessageType } from './saga-message.ts';
export type {
  CascadedMessage,
  CascadedMessageOptions,
  CascadedMessageTarget,
  SagaSignal,
} from './cascaded-message.ts';
export type { SagaContext, SagaHandler } from './saga-context.ts';
export type {
  RunSagaResult,
  SagaHandlerResult,
  SagaTransition,
  SagaTransitionRecord,
} from './saga-transition.ts';
export type { SagaCorrelation, SagaCorrelationRule } from './saga-correlation.ts';
export type {
  QueryDefinition,
  SagaConcurrencyPolicy,
  SagaDefinition,
  SagaQueryHandler,
  SagaSignalHandler,
  SignalDefinition,
} from './saga-definition.ts';
