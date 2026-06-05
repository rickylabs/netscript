import type { SagaCorrelationKey, SagaMessage, SagaMessageId } from '../../domain/mod.ts';

/** Topic routing metadata accepted by saga publisher ports. */
export type SagaPublisherPublishOptions = Readonly<{
  topic?: string;
  correlationKey?: SagaCorrelationKey;
  idempotencyKey?: string;
  concurrencyKey?: string;
  traceparent?: string;
  tracestate?: string;
}>;

/** Batch publishing behavior requested by a composition root. */
export type SagaPublisherBatchMode = 'sequential' | 'parallel';

/** Options accepted when publishing multiple saga messages. */
export type SagaPublisherPublishManyOptions = Readonly<{
  mode?: SagaPublisherBatchMode;
  topic?: string;
  traceparent?: string;
  tracestate?: string;
}>;

/** Typed receipt returned when a saga publisher accepts a message. */
export type SagaPublisherReceipt<TMessageType extends string = string> = Readonly<{
  published: true;
  messageType: TMessageType;
  messageId?: SagaMessageId;
  correlationKey?: SagaCorrelationKey;
  acceptedAt: Date;
}>;

/** Failure receipt returned by non-throwing publisher implementations. */
export type SagaPublisherRejected<TMessageType extends string = string> = Readonly<{
  published: false;
  messageType: TMessageType;
  messageId?: SagaMessageId;
  correlationKey?: SagaCorrelationKey;
  reason: string;
  retryable: boolean;
}>;

/** Publisher result for a single saga message. */
export type SagaPublisherResult<TMessageType extends string = string> =
  | SagaPublisherReceipt<TMessageType>
  | SagaPublisherRejected<TMessageType>;

/** Explicit publisher boundary implemented by plugin-layer HTTP clients. */
export interface SagaPublisherPort<TMessage extends SagaMessage = SagaMessage> {
  readonly id: string;
  publish<TNextMessage extends TMessage>(
    message: TNextMessage,
    options?: SagaPublisherPublishOptions,
  ): Promise<SagaPublisherResult<TNextMessage['type']>>;
  publishMany<TNextMessage extends TMessage>(
    messages: readonly TNextMessage[],
    options?: SagaPublisherPublishManyOptions,
  ): Promise<readonly SagaPublisherResult<TNextMessage['type']>[]>;
}
