/**
 * Dead-letter queue contract for terminal message failures.
 *
 * @module
 */

/**
 * Stable reason that explains why a message entered the dead-letter queue.
 */
export type DeadLetterReason =
  | 'max_attempts_exceeded'
  | 'nack_without_requeue'
  | 'validation_failed';

/**
 * Structured dead-letter record written by queue adapters before discarding poison messages.
 *
 * @template T - Original message payload type.
 */
export interface DeadLetterRecord<T = unknown> {
  /** Provider or envelope message identifier. */
  readonly messageId: string;
  /** Queue namespace where the message was consumed. */
  readonly queueName: string;
  /** Original message payload. */
  readonly payload: T;
  /** Message headers such as trace context. */
  readonly headers: Record<string, string>;
  /** Number of delivery attempts observed before terminal failure. */
  readonly deliveryCount: number;
  /** ISO timestamp when the message was originally enqueued. */
  readonly enqueuedAt: string;
  /** ISO timestamp when the terminal failure was recorded. */
  readonly failedAt: string;
  /** Stable failure reason. */
  readonly reason: DeadLetterReason;
  /** Optional structured error code, such as QueueErrorCode or adapter-specific code. */
  readonly errorCode?: string;
  /** Optional human-readable failure summary. */
  readonly errorMessage?: string;
}

/**
 * Minimal durable store port for dead-letter queue records.
 *
 * @template T - Original message payload type.
 */
export interface DeadLetterStorePort<T = unknown> {
  /**
   * Append a terminal failure record idempotently.
   *
   * @param record - Dead-letter record to persist.
   */
  append(record: DeadLetterRecord<T>): Promise<void>;

  /**
   * List records in store order.
   *
   * @param options - Optional maximum number of records.
   * @returns Dead-letter records.
   */
  list(options?: { limit?: number }): Promise<DeadLetterRecord<T>[]>;

  /**
   * Re-enqueue records and remove successfully re-enqueued entries from the store.
   *
   * @param reenqueue - Adapter-owned callback that puts a record back on the queue.
   * @param options - Optional maximum number of records to process.
   * @returns Number of records reprocessed.
   */
  reprocess(
    reenqueue: (record: DeadLetterRecord<T>) => Promise<void>,
    options?: { limit?: number },
  ): Promise<number>;

  /**
   * Count stored dead-letter records.
   *
   * @returns Number of stored records.
   */
  depth(): Promise<number>;
}
