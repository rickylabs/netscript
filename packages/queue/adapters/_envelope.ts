/**
 * Shared message envelope helpers for queue adapters.
 *
 * @module
 */

import type { DeadLetterReason, DeadLetterRecord } from '../ports/dead-letter.ts';
import type { EnqueueOptions, MessageContext, NackOptions } from '../ports/message-queue.ts';

/**
 * Queue name assumed for envelopes written before the queue name was recorded.
 */
export const DEFAULT_QUEUE_NAME = 'default';

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
  /**
   * Destination queue name. Transports that multiplex several named queues over one physical
   * queue route by it; envelopes without it belong to {@link DEFAULT_QUEUE_NAME}.
   */
  queueName?: string;
  /** Times the envelope was re-enqueued because no listener for its queue name received it. */
  routingHops?: number;
  /** Monotonic requeue generation used to fence ambiguous requeue commits. */
  requeueEpoch?: number;
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
  queueName?: string,
): MessageEnvelope<T> {
  const envelope: MessageEnvelope<T> = {
    __envelope_version: 1,
    payload: message,
    headers: options?.headers ?? {},
    messageId: crypto.randomUUID(),
    enqueuedAt: new Date().toISOString(),
    deliveryCount: 0,
  };
  return queueName === undefined ? envelope : { ...envelope, queueName };
}

/**
 * Normalize a raw transport message into an envelope addressed to a queue name.
 *
 * Legacy envelopes without a queue name, and raw non-envelope payloads, are addressed to
 * {@link DEFAULT_QUEUE_NAME}. Raw non-envelope payloads receive a deterministic content-derived
 * `messageId` so native redelivery after an ambiguous requeue can be fenced consistently.
 */
export function toAddressedEnvelope<T>(
  rawMessage: unknown,
): MessageEnvelope<T> & { queueName: string } {
  if (isMessageEnvelope<T>(rawMessage)) {
    return {
      ...rawMessage,
      messageId: rawMessage.messageId || deriveLegacyMessageId(rawMessage.payload),
      queueName: rawMessage.queueName ?? DEFAULT_QUEUE_NAME,
    };
  }
  return {
    ...createEnvelope(rawMessage as T),
    messageId: deriveLegacyMessageId(rawMessage),
    queueName: DEFAULT_QUEUE_NAME,
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

const FNV64_MASK = 0xffff_ffff_ffff_ffffn;
const FNV64_PRIME = 0x0000_0100_0000_01b3n;
const FNV64_OFFSET_A = 0xcbf2_9ce4_8422_2325n;
const FNV64_OFFSET_B = 0xaf63_dc4c_8601_ec8cn;

function deriveLegacyMessageId(rawMessage: unknown): string {
  const bytes = new TextEncoder().encode(canonicalizeLegacyValue(rawMessage, new Map()));
  let h1 = FNV64_OFFSET_A;
  let h2 = FNV64_OFFSET_B;
  for (let i = 0; i < bytes.length; i++) {
    const byte = BigInt(bytes[i]);
    h1 = ((h1 ^ byte) * FNV64_PRIME) & FNV64_MASK;
    h2 = ((h2 ^ (byte ^ BigInt((i + 1) & 0xff))) * FNV64_PRIME) & FNV64_MASK;
  }
  return `legacy-${h1.toString(16).padStart(16, '0')}${h2.toString(16).padStart(16, '0')}`;
}

function canonicalizeLegacyValue(value: unknown, seen: Map<object, number>): string {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'undefined':
      return 'undefined';
    case 'boolean':
      return `bool:${value}`;
    case 'number':
      return Object.is(value, -0) ? 'num:-0' : `num:${String(value)}`;
    case 'bigint':
      return `bigint:${value.toString()}`;
    case 'string':
      return `str:${JSON.stringify(value)}`;
    case 'symbol':
      return `sym:${String(value)}`;
    case 'function':
      return `fn:${value.name}`;
    default:
      break;
  }
  const obj = value as object;
  const existing = seen.get(obj);
  if (existing !== undefined) return `ref:${existing}`;
  seen.set(obj, seen.size);

  if (obj instanceof Date) {
    return `date:${Number.isNaN(obj.getTime()) ? 'invalid' : obj.toISOString()}`;
  }
  if (obj instanceof RegExp) {
    return `regexp:${JSON.stringify(obj.source)}/${obj.flags}`;
  }
  if (obj instanceof URL) {
    return `url:${JSON.stringify(obj.href)}`;
  }
  if (obj instanceof ArrayBuffer) {
    return `ab:[${new Uint8Array(obj).join(',')}]`;
  }
  if (ArrayBuffer.isView(obj)) {
    const view = new Uint8Array(obj.buffer, obj.byteOffset, obj.byteLength);
    return `${obj.constructor.name}:[${view.join(',')}]`;
  }
  if (Array.isArray(obj)) {
    return `[${obj.map((item) => canonicalizeLegacyValue(item, seen)).join(',')}]`;
  }
  if (obj instanceof Map) {
    const entries = [...obj.entries()]
      .map(([k, v]) => `${canonicalizeLegacyValue(k, seen)}=>${canonicalizeLegacyValue(v, seen)}`)
      .sort();
    return `map{${entries.join(',')}}`;
  }
  if (obj instanceof Set) {
    const items = [...obj.values()].map((item) => canonicalizeLegacyValue(item, seen)).sort();
    return `set{${items.join(',')}}`;
  }
  const record = obj as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${
    keys.map((k) => `${JSON.stringify(k)}:${canonicalizeLegacyValue(record[k], seen)}`).join(',')
  }}`;
}
