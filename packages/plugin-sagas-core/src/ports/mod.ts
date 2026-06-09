/**
 * @module @netscript/plugin-sagas-core/ports
 *
 * Consumed contracts for saga bus, transport, storage, clocks, and reserved
 * T2/T3/agent durability axes.
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
  SagaIdempotencyReservation,
  SagaIdempotencyTarget,
} from '../runtime/saga-idempotency.ts';
export type {
  SagaBusPort,
  SagaPublishOptions,
  SagaQueryDispatch,
  SagaSignalDispatch,
} from './saga-bus-port.ts';
export type { SagaClockPort, SagaSleepOptions } from './saga-clock-port.ts';
export type {
  SagaAgentConversationId,
  SagaAgentId,
  SagaAgentInput,
  SagaAgentRuntimePort,
  SagaAgentRuntimeState,
  SagaAgentStepResult,
} from './saga-agent-runtime-port.ts';
export type {
  SagaHistoryEvent,
  SagaHistoryEventType,
  SagaHistoryStorePort,
} from './saga-history-store-port.ts';
export type { SagaIdempotencyPort } from './saga-idempotency-port.ts';
export type { SagaOutboxPort, SagaOutboxRecord } from './saga-outbox-port.ts';
export type {
  SagaCorrelationIndexEntry,
  SagaStorePort,
  SagaStoreWriteOptions,
} from './saga-store-port.ts';
export type {
  SagaTransportAck,
  SagaTransportHandler,
  SagaTransportMessage,
  SagaTransportPort,
  SagaTransportSubscription,
} from './saga-transport-port.ts';
