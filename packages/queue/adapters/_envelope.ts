/**
 * Shared message envelope helpers for queue adapters.
 *
 * @module
 */

import type { EnqueueOptions, MessageContext } from '../ports/message-queue.ts';

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
  nack: (options?: { requeue?: boolean }) => Promise<void>,
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
