/**
 * @module @netscript/plugin-sagas-core/ports
 *
 * Consumed contracts for saga bus, transport, storage, clocks, and reserved
 * T2/T3/agent durability axes.
 */

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
