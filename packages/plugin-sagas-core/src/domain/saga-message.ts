import type { SagaCorrelationKey, SagaMessageId } from './ids.ts';

/** Base event or command delivered to a saga handler. */
export type SagaMessage<TType extends string = string, TPayload = unknown> = Readonly<{
  id?: SagaMessageId;
  type: TType;
  payload: TPayload;
  correlationKey?: SagaCorrelationKey;
  idempotencyKey?: string;
  concurrencyKey?: string;
  occurredAt?: Date;
  traceparent?: string;
  tracestate?: string;
}>;

/** Extracts the message type discriminator from a saga message. */
export type SagaMessageType<TMessage extends SagaMessage> = TMessage['type'];

/** Server-sent event kinds emitted by the saga service. */
export type SagaSSEEventType =
  | 'saga:started'
  | 'saga:message_received'
  | 'saga:state_changed'
  | 'saga:completed'
  | 'saga:failed'
  | 'saga:compensating'
  | 'heartbeat';

/** Server-sent event payload emitted by saga subscriptions. */
export type SagaSSEEvent = Readonly<{
  type: SagaSSEEventType;
  timestamp: string;
  sagaName?: string;
  sagaId?: string;
  instanceId?: string;
  correlationId?: string;
  correlationKey?: string;
  data?: Readonly<Record<string, unknown>>;
}>;
