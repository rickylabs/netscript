import type { SagaMessage } from '../domain/mod.ts';
import type {
  SagaTransportAck,
  SagaTransportMessage,
  SagaTransportSubscription,
} from '../ports/mod.ts';

/** Redis Streams read result shape used by the transport boundary. */
export type RedisStreamReadGroupResult = readonly (readonly [
  streamKey: string,
  messages: readonly (readonly [messageId: string, fields: readonly string[]])[],
])[];

/** Redis XPENDING result shape used for pending-message recovery. */
export type RedisPendingMessageResult = readonly (readonly [
  messageId: string,
  consumer: string,
  idleMs: number,
  deliveries: number,
])[];

/** Redis XCLAIM result shape used after pending-message recovery. */
export type RedisClaimedMessageResult = readonly (readonly [
  messageId: string,
  fields: readonly string[],
])[];

/** Subscription record held by the Redis transport. */
export type RedisTransportSubscriptionRecord = Readonly<{
  topic: string;
  streamKey: string;
  handler: (
    envelope: SagaTransportMessage,
    ack: SagaTransportAck,
  ) => Promise<void>;
}>;

/** Stored Redis stream envelope. */
export type RedisStoredEnvelope = Readonly<{
  schemaVersion: 1;
  topic: string;
  message: SagaMessage;
  timestamp: string;
}>;

/** Ack handle for one Redis Streams message. */
export class RedisTransportAck implements SagaTransportAck {
  #settled = false;

  constructor(
    private readonly streamKey: string,
    private readonly messageId: string,
    private readonly acknowledge: (streamKey: string, messageId: string) => Promise<void>,
  ) {}

  get settled(): boolean {
    return this.#settled;
  }

  async ack(): Promise<void> {
    if (this.#settled) return;
    await this.acknowledge(this.streamKey, this.messageId);
    this.#settled = true;
  }

  nack(_reason?: string): Promise<void> {
    this.#settled = true;
    return Promise.resolve();
  }
}

/** Runtime subscription returned to callers. */
export class RedisTransportSubscription implements SagaTransportSubscription {
  constructor(
    readonly topic: string,
    private readonly remove: (topic: string) => Promise<void>,
  ) {}

  unsubscribe(): Promise<void> {
    return this.remove(this.topic);
  }
}

/** Convert Redis fields into a typed saga transport message. */
export function decodeRedisTransportMessage(
  topic: string,
  fields: readonly string[],
): SagaTransportMessage {
  const data = fieldsToRecord(fields).data;
  if (!data) {
    throw new TypeError('Redis stream message is missing the data field.');
  }

  const parsed: unknown = JSON.parse(data);
  if (!isRedisStoredEnvelope(parsed)) {
    throw new TypeError('Redis stream message envelope is invalid.');
  }

  return Object.freeze({
    topic,
    message: parsed.message,
    receivedAt: new Date(parsed.timestamp),
    deliveryAttempt: 1,
  });
}

/** Encode a saga message for Redis Stream storage. */
export function encodeRedisTransportMessage(
  topic: string,
  message: SagaMessage,
  now: Date,
): string {
  const envelope: RedisStoredEnvelope = Object.freeze({
    schemaVersion: 1,
    topic,
    message,
    timestamp: now.toISOString(),
  });
  return JSON.stringify(envelope);
}

function fieldsToRecord(fields: readonly string[]): Readonly<Record<string, string>> {
  return Object.freeze(Object.fromEntries(fieldEntries(fields)));
}

function fieldEntries(
  fields: readonly string[],
  index = 0,
): readonly (readonly [string, string])[] {
  if (index >= fields.length) return [];
  return [
    [fields[index] ?? '', fields[index + 1] ?? ''],
    ...fieldEntries(fields, index + 2),
  ];
}

function isRedisStoredEnvelope(value: unknown): value is RedisStoredEnvelope {
  if (!isRecord(value)) return false;
  return value.schemaVersion === 1 &&
    typeof value.topic === 'string' &&
    typeof value.timestamp === 'string' &&
    isSagaMessage(value.message);
}

function isSagaMessage(value: unknown): value is SagaMessage {
  return isRecord(value) && typeof value.type === 'string' && 'payload' in value;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null;
}
