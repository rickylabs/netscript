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

/**
 * Structured detail attached to a rejected receipt when endpoint discovery found nothing.
 *
 * Every entry is a source or key **name**; values are never recorded, so the
 * diagnostic can cross log and telemetry boundaries without leaking URLs or secrets.
 */
export type SagaPublisherEndpointDiagnostic = Readonly<{
  /** Endpoint sources consulted, in resolution order. */
  attempted: readonly string[];
  /** Whether a `services__*` key or the `NETSCRIPT_ASPIRE` marker proved an Aspire environment. */
  aspireDetected: boolean;
  /** Whether environment enumeration was denied, leaving `aspireDetected` inconclusive. */
  envEnumerationDenied: boolean;
}>;

/** Failure receipt returned by non-throwing publisher implementations. */
export type SagaPublisherRejected<TMessageType extends string = string> = Readonly<{
  published: false;
  messageType: TMessageType;
  messageId?: SagaMessageId;
  correlationKey?: SagaCorrelationKey;
  /** Stable machine-readable reason, such as `no-endpoint`, or a transport/HTTP failure message. */
  reason: string;
  retryable: boolean;
  /** Endpoint discovery detail, present when `reason` is `no-endpoint`. */
  diagnostic?: SagaPublisherEndpointDiagnostic;
}>;

/** Publisher result for a single saga message. */
export type SagaPublisherResult<TMessageType extends string = string> =
  | SagaPublisherReceipt<TMessageType>
  | SagaPublisherRejected<TMessageType>;

/**
 * Non-throwing publisher boundary implemented by plugin-layer HTTP clients.
 *
 * Callers must discriminate every returned receipt before continuing. Use
 * `publishSagaOrThrow(...)` when a rejected single-message receipt should
 * cross the caller's boundary as a structured `SagasError`; repository
 * quality policy rejects bare unused `publish(...)` and `publishMany(...)`
 * results from known saga publishers.
 */
export interface SagaPublisherPort<TMessage extends SagaMessage = SagaMessage> {
  /** Stable publisher identifier used in diagnostics. */
  readonly id: string;
  /** Publish one saga message and return an accepted or rejected receipt. */
  publish<TNextMessage extends TMessage>(
    message: TNextMessage,
    options?: SagaPublisherPublishOptions,
  ): Promise<SagaPublisherResult<TNextMessage['type']>>;
  /** Publish multiple saga messages using the requested batch mode. */
  publishMany<TNextMessage extends TMessage>(
    messages: readonly TNextMessage[],
    options?: SagaPublisherPublishManyOptions,
  ): Promise<readonly SagaPublisherResult<TNextMessage['type']>[]>;
}
