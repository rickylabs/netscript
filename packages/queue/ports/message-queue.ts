/**
 * Message Queue Interface
 *
 * Core abstraction for message queue operations across different providers.
 * Based on Fedify's MessageQueue interface with NetScript enhancements.
 *
 * @module
 */

/**
 * Message context provided to handlers during message processing.
 * Contains metadata and control methods for message acknowledgment.
 */
export interface MessageContext {
  /**
   * Unique message identifier assigned by the provider.
   */
  readonly messageId: string;

  /**
   * Number of times this message has been delivered.
   * Useful for implementing retry limits and dead-letter queue logic.
   */
  readonly deliveryCount: number;

  /**
   * Timestamp when the message was originally enqueued.
   */
  readonly enqueuedAt: Date;

  /**
   * Custom headers/metadata attached to the message.
   */
  readonly headers: Record<string, string>;

  /**
   * Acknowledge successful message processing.
   * Called automatically on handler success in most cases.
   */
  ack(): Promise<void>;

  /**
   * Negative acknowledge - signal message processing failure.
   * Called automatically on handler error if native retry is supported.
   *
   * @param options - Requeue options
   */
  nack(options?: { requeue?: boolean }): Promise<void>;
}

/**
 * Core message queue interface that all adapters must implement.
 * Provides a unified API for enqueuing and consuming messages.
 *
 * @template T - Message payload type
 */
export interface MessageQueue<T = unknown> {
  /**
   * Indicates whether the backend supports native retry mechanisms.
   * When true, failed messages are automatically retried by the backend.
   * When false, the application must handle retries.
   */
  readonly nativeRetrial: boolean;

  /**
   * Enqueue a single message for processing.
   *
   * @param message - Message payload to enqueue
   * @param options - Optional enqueue configuration
   * @throws {QueueError} If enqueue operation fails
   */
  enqueue(message: T, options?: EnqueueOptions): Promise<void>;

  /**
   * Enqueue multiple messages in a batch.
   * Not all backends support this natively - falls back to sequential enqueue.
   *
   * @param messages - Array of message payloads to enqueue
   * @param options - Optional enqueue configuration applied to all messages
   * @throws {QueueError} If batch enqueue operation fails
   */
  enqueueMany?(messages: T[], options?: EnqueueOptions): Promise<void>;

  /**
   * Start listening for messages and process them with the handler.
   * This is typically a long-running operation that continues until stopped.
   *
   * @param handler - Function to process each message
   * @param options - Optional listen configuration
   * @throws {QueueError} If listen operation fails
   */
  listen(
    handler: (message: T, context: MessageContext) => Promise<void>,
    options?: ListenOptions,
  ): Promise<void>;

  /**
   * Stop listening for messages gracefully.
   * Allows in-flight messages to complete before shutting down.
   *
   * @throws {QueueError} If stop operation fails
   */
  stop(): Promise<void>;
}

/**
 * Options for enqueueing messages.
 */
export interface EnqueueOptions {
  /**
   * Delay in milliseconds before the message becomes available for processing.
   * Useful for scheduling and implementing cron-like patterns.
   *
   * @example
   * ```ts
   * // Process message in 5 minutes
   * await queue.enqueue(message, { delay: 5 * 60 * 1000 });
   * ```
   */
  delay?: number;

  /**
   * Message priority (provider-specific).
   * Higher values typically mean higher priority.
   * Not all providers support priority queues.
   */
  priority?: number;

  /**
   * Deduplication ID to prevent duplicate messages.
   * Messages with the same ID within a time window are deduplicated.
   * Provider-specific behavior.
   */
  deduplicationId?: string;

  /**
   * Custom headers/metadata attached to the message.
   * Useful for tracing, routing, or application-specific metadata.
   */
  headers?: Record<string, string>;
}

/**
 * Options for listening to messages.
 */
export interface ListenOptions {
  /**
   * Number of messages to process concurrently.
   * Default: 1 (sequential processing)
   *
   * @example
   * ```ts
   * // Process up to 5 messages in parallel
   * await queue.listen(handler, { concurrency: 5 });
   * ```
   */
  concurrency?: number;

  /**
   * Visibility timeout in milliseconds.
   * How long a message is hidden from other consumers while processing.
   * Provider-specific behavior.
   */
  visibilityTimeout?: number;

  /**
   * Maximum number of messages to prefetch.
   * Provider-specific optimization for throughput.
   */
  prefetchCount?: number;

  /**
   * Abort signal to stop listening.
   * Allows graceful shutdown of message processing.
   */
  signal?: AbortSignal;
}
