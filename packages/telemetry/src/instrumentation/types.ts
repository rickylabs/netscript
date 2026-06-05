import type { Context, Span } from '@opentelemetry/api';

/**
 * Message context provided to queue handlers during message processing.
 */
export interface MessageContext {
  readonly messageId: string;
  readonly deliveryCount: number;
  readonly enqueuedAt: Date;
  readonly headers: Record<string, string>;
  ack(): Promise<void>;
  nack(options?: { requeue?: boolean }): Promise<void>;
}

/**
 * Options for enqueueing messages.
 */
export interface EnqueueOptions {
  delay?: number;
  priority?: number;
  deduplicationId?: string;
  headers?: Record<string, string>;
}

/**
 * Options for listening to queue messages.
 */
export interface ListenOptions {
  concurrency?: number;
  visibilityTimeout?: number;
  prefetchCount?: number;
  signal?: AbortSignal;
}

/**
 * Core queue interface expected by tracing instrumentation.
 */
export interface MessageQueue<T = unknown> {
  readonly nativeRetrial: boolean;
  enqueue(message: T, options?: EnqueueOptions): Promise<void>;
  enqueueMany?(messages: T[], options?: EnqueueOptions): Promise<void>;
  listen(
    handler: (message: T, context: MessageContext) => Promise<void>,
    options?: ListenOptions,
  ): Promise<void>;
  stop(): Promise<void>;
}

/**
 * Options for creating a traced queue wrapper.
 */
export interface TracedQueueOptions {
  queueName: string;
  system?: string;
  propagateContext?: boolean;
  traceAckNack?: boolean;
  attributePrefix?: string;
}

/**
 * Message context enriched with tracing metadata.
 */
export interface TracedMessageContext extends MessageContext {
  readonly span?: Span;
  readonly parentContext?: Context;
}
