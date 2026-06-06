import type { Context, Span } from '../core/mod.ts';

/**
 * Message context provided to queue handlers during message processing.
 */
export interface MessageContext {
  /** Unique message identifier. */
  readonly messageId: string;
  /** Number of delivery attempts for the message. */
  readonly deliveryCount: number;
  /** Time the message entered the queue. */
  readonly enqueuedAt: Date;
  /** Message propagation and application headers. */
  readonly headers: Record<string, string>;
  /** Acknowledge successful processing. */
  ack(): Promise<void>;
  /** Reject processing and optionally request requeue. */
  nack(options?: { requeue?: boolean }): Promise<void>;
}

/**
 * Options for enqueueing messages.
 */
export interface EnqueueOptions {
  /** Delay before the message becomes visible, in milliseconds. */
  delay?: number;
  /** Queue priority hint. */
  priority?: number;
  /** Deduplication identifier for idempotent enqueue operations. */
  deduplicationId?: string;
  /** Message propagation and application headers. */
  headers?: Record<string, string>;
}

/**
 * Options for listening to queue messages.
 */
export interface ListenOptions {
  /** Maximum number of messages handled concurrently. */
  concurrency?: number;
  /** Visibility timeout while a message is being processed, in milliseconds. */
  visibilityTimeout?: number;
  /** Number of messages to prefetch, when supported. */
  prefetchCount?: number;
  /** Abort signal for stopping the listener. */
  signal?: AbortSignal;
}

/**
 * Core queue interface expected by tracing instrumentation.
 */
export interface MessageQueue<T = unknown> {
  /** Whether the queue supports native retry behavior. */
  readonly nativeRetrial: boolean;
  /** Enqueue a single message. */
  enqueue(message: T, options?: EnqueueOptions): Promise<void>;
  /** Enqueue several messages when the backend supports batching. */
  enqueueMany?(messages: T[], options?: EnqueueOptions): Promise<void>;
  /** Start listening for messages. */
  listen(
    handler: (message: T, context: MessageContext) => Promise<void>,
    options?: ListenOptions,
  ): Promise<void>;
  /** Stop listening for messages. */
  stop(): Promise<void>;
}

/**
 * Options for creating a traced queue wrapper.
 */
export interface TracedQueueOptions {
  /** Logical queue name used on span attributes. */
  queueName: string;
  /** Messaging system name used on span attributes. */
  system?: string;
  /** Whether trace context is propagated through message headers. */
  propagateContext?: boolean;
  /** Whether acknowledgement operations receive their own spans. */
  traceAckNack?: boolean;
  /** Optional attribute prefix for custom integrations. */
  attributePrefix?: string;
}

/**
 * Message context enriched with tracing metadata.
 */
export interface TracedMessageContext extends MessageContext {
  /** Span representing the current message processing operation. */
  readonly span?: Span;
  /** Parent context extracted from message headers. */
  readonly parentContext?: Context;
}
