import type { SagaMessage } from '../domain/mod.ts';
import { encodeRedisTransportMessage } from './redis-transport-subscription.ts';

/** Minimal Redis sorted-set client needed by delayed saga delivery. */
export interface RedisDelayedClient {
  zadd(key: string, score: number, member: string): Promise<unknown>;
  zrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
  ): Promise<readonly string[]>;
  zrem(key: string, member: string): Promise<unknown>;
}

/** Delayed message entry stored in Redis. */
export type RedisDelayedMessageEntry = Readonly<{
  streamKey: string;
  envelope: string;
  deliverAt: number;
}>;

/** Delayed message processor options. */
export type RedisDelayedMessageProcessorOptions = Readonly<{
  client: RedisDelayedClient;
  delayedSetKey: string;
  intervalMs: number;
  now?: () => Date;
  addToStream: (streamKey: string, envelope: string) => Promise<void>;
  onError?: (error: unknown) => void;
}>;

/** Polls Redis delayed-message sorted sets and moves due entries to streams. */
export class RedisDelayedMessageProcessor {
  readonly #client: RedisDelayedClient;
  readonly #delayedSetKey: string;
  readonly #intervalMs: number;
  readonly #now: () => Date;
  readonly #addToStream: (streamKey: string, envelope: string) => Promise<void>;
  readonly #onError?: (error: unknown) => void;
  #timer?: ReturnType<typeof setInterval>;

  constructor(options: RedisDelayedMessageProcessorOptions) {
    this.#client = options.client;
    this.#delayedSetKey = options.delayedSetKey;
    this.#intervalMs = options.intervalMs;
    this.#now = options.now ?? (() => new Date());
    this.#addToStream = options.addToStream;
    this.#onError = options.onError;
  }

  start(): void {
    if (this.#timer || this.#intervalMs <= 0) return;
    this.#timer = setInterval(() => void this.processDue(), this.#intervalMs);
  }

  stop(): void {
    if (!this.#timer) return;
    clearInterval(this.#timer);
    this.#timer = undefined;
  }

  enqueue(
    streamKey: string,
    topic: string,
    message: SagaMessage,
    delayMs: number,
  ): Promise<unknown> {
    const deliverAt = this.#now().getTime() + delayMs;
    const entry = encodeRedisDelayedEntry({
      streamKey,
      envelope: encodeRedisTransportMessage(topic, message, this.#now()),
      deliverAt,
    });
    return this.#client.zadd(this.#delayedSetKey, deliverAt, entry);
  }

  async processDue(): Promise<void> {
    const now = this.#now().getTime();
    const entries = await this.#client.zrangebyscore(this.#delayedSetKey, '-inf', now);
    await Promise.all(entries.map((entry) => this.#processEntry(entry)));
  }

  async #processEntry(entryJson: string): Promise<void> {
    try {
      const entry = decodeRedisDelayedEntry(entryJson);
      await this.#addToStream(entry.streamKey, entry.envelope);
      await this.#client.zrem(this.#delayedSetKey, entryJson);
    } catch (error) {
      this.#onError?.(error);
    }
  }
}

/** Encode a delayed Redis entry with runtime validation on decode. */
export function encodeRedisDelayedEntry(entry: RedisDelayedMessageEntry): string {
  return JSON.stringify(entry);
}

/** Decode a delayed Redis entry. */
export function decodeRedisDelayedEntry(value: string): RedisDelayedMessageEntry {
  const parsed: unknown = JSON.parse(value);
  if (!isRedisDelayedMessageEntry(parsed)) {
    throw new TypeError('Redis delayed message entry is invalid.');
  }
  return parsed;
}

function isRedisDelayedMessageEntry(value: unknown): value is RedisDelayedMessageEntry {
  if (!isRecord(value)) return false;
  return typeof value.streamKey === 'string' &&
    typeof value.envelope === 'string' &&
    typeof value.deliverAt === 'number';
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null;
}
