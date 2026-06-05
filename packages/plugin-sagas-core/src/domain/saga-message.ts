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
