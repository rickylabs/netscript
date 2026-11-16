/** Private durable polling-queue message and keys. @module */
import type { KvKey } from '@netscript/kv';

/**
 * Internal message structure stored in KV
 */
export interface QueueMessage<T> {
  /** Unique message ID */
  id: string;
  /** Message payload */
  payload: T;
  /** Queue name */
  queue: string;
  /** When the message was enqueued */
  enqueuedAt: string;
  /** When the message becomes available (for delayed messages) */
  availableAt: string;
  /** Number of delivery attempts */
  attempts: number;
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Priority (higher = more important) */
  priority: number;
  /** Custom headers */
  headers: Record<string, string>;
  /** Deduplication ID */
  deduplicationId?: string;
  /** When the message was claimed for processing */
  claimedAt?: string;
  /** Which worker claimed the message */
  claimedBy?: string;
  /** Identity of this delivery, independent of its worker or refunded count. */
  claimReceipt?: string;
  /** Visibility timeout (when the claim expires) */
  visibilityTimeout?: string;
  /** Originating durable identity, independent of payload/deduplication identity. */
  retentionId?: string;
}

/**
 * KV key prefixes for queue data
 */
export const KvPrefixes = {
  /** Pending messages ready for processing */
  pending: 'queue:pending',
  /** Messages currently being processed */
  processing: 'queue:processing',
  /** Dead letter queue for failed messages */
  dlq: 'queue:dlq',
  /** Deduplication tracking */
  dedup: 'queue:dedup',
} as const;

/** Pending key preserves the adapter's priority/time ordering. */
export function pollingPendingKey(
  queue: string,
  priority: number,
  timestamp: string,
  id: string,
): KvKey {
  return [KvPrefixes.pending, queue, String(1000 - priority).padStart(4, '0'), timestamp, id];
}
/** One processing slot per durable message identity. */
export function pollingProcessingKey(queue: string, id: string): KvKey {
  return [KvPrefixes.processing, queue, id];
}
