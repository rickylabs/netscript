/**
 * Shared message envelope helpers for queue adapters.
 *
 * @module
 */

import type { DeadLetterReason, DeadLetterRecord } from '../ports/dead-letter.ts';
import type { EnqueueOptions, MessageContext, NackOptions } from '../ports/message-queue.ts';

/**
 * Internal message envelope that preserves transport metadata.
 *
 * @template T - Message payload type
 */
export interface MessageEnvelope<T> {
  /** Version marker for envelope format. */
  __envelope_version: 1;
  /** The actual message payload. */
  payload: T;
  /** Message headers such as trace context. */
  headers: Record<string, string>;
  /** Unique message identifier. */
  messageId: string;
  /** When the message was enqueued. */
  enqueuedAt: string;
  /** Delivery attempt counter. */
  deliveryCount: number;
}

/**
 * Message metadata required to create a dead-letter record.
 */
export interface DeadLetterMessageMetadata<T> {
  /** Provider or envelope message identifier. */
  readonly messageId: string;
  /** Queue namespace where the message was consumed. */
  readonly queueName: string;
  /** Original payload. */
  readonly payload: T;
  /** Message headers such as trace context. */
  readonly headers: Record<string, string>;
  /** Number of delivery attempts before terminal failure. */
  readonly deliveryCount: number;
  /** Original enqueue timestamp. */
  readonly enqueuedAt: Date | string;
}

/**
 * Create a message envelope that preserves metadata through provider adapters.
 */
export function createEnvelope<T>(
  message: T,
  options?: EnqueueOptions,
): MessageEnvelope<T> {
  return {
    __envelope_version: 1,
    payload: message,
    headers: options?.headers ?? {},
    messageId: crypto.randomUUID(),
    enqueuedAt: new Date().toISOString(),
    deliveryCount: 0,
  };
}

/**
 * Type guard for the internal envelope format.
 */
export function isMessageEnvelope<T>(message: unknown): message is MessageEnvelope<T> {
  return (
    typeof message === 'object' &&
    message !== null &&
    '__envelope_version' in message &&
    (message as MessageEnvelope<T>).__envelope_version === 1 &&
    'payload' in message &&
    'headers' in message
  );
}

/**
 * Create a queue message context from normalized metadata.
 */
export function createMessageContext(
  messageId: string,
  enqueuedAt: Date,
  headers: Record<string, string>,
  deliveryCount: number,
  ack: () => Promise<void>,
  nack: (options?: NackOptions) => Promise<void>,
): MessageContext {
  return {
    messageId,
    deliveryCount,
    enqueuedAt,
    headers,
    ack,
    nack,
  };
}

/**
 * Convert queue message metadata into a structured dead-letter record.
 */
export function toDeadLetterRecord<T>(
  message: DeadLetterMessageMetadata<T>,
  reason: DeadLetterReason,
  options: Pick<NackOptions, 'errorCode' | 'errorMessage'> = {},
): DeadLetterRecord<T> {
  return {
    messageId: message.messageId,
    queueName: message.queueName,
    payload: message.payload,
    headers: message.headers,
    deliveryCount: message.deliveryCount,
    enqueuedAt: formatIso(message.enqueuedAt),
    failedAt: new Date().toISOString(),
    reason,
    errorCode: options.errorCode,
    errorMessage: options.errorMessage,
  };
}

function formatIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
