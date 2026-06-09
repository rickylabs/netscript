import type { SagaMessage } from '../domain/mod.ts';
import { encodeListTransportMessage } from './list-transport-subscription.ts';

/** Minimal sorted-set/list client needed by delayed LIST delivery. */
export interface ListDelayedClient {
  /** Push a serialized envelope onto the ready queue. */
  rpush(key: string, value: string): Promise<unknown>;
  /** Store a delayed envelope under its delivery timestamp. */
  zadd(key: string, score: number, member: string): Promise<unknown>;
  /** Read delayed entries with scores inside the requested range. */
  zrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
  ): Promise<readonly string[]>;
  /** Remove one delayed entry after it has been queued. */
  zrem(key: string, member: string): Promise<unknown>;
}

/** Delayed LIST message entry. */
export type ListDelayedMessageEntry = Readonly<{
  queueKey: string;
  envelope: string;
  deliverAt: number;
}>;

/** Delayed LIST processor options. */
export type ListDelayedMessageProcessorOptions = Readonly<{
  client: ListDelayedClient;
  delayedSetKey: string;
  intervalMs: number;
  now?: () => Date;
  createId?: () => string;
  onError?: (error: unknown) => void;
}>;

/** Moves due delayed LIST entries into queue lists. */
export class ListDelayedMessageProcessor {
  readonly #client: ListDelayedClient;
  readonly #delayedSetKey: string;
  readonly #intervalMs: number;
  readonly #now: () => Date;
  readonly #createId: () => string;
  readonly #onError?: (error: unknown) => void;
  #timer?: ReturnType<typeof setInterval>;

  /** Create a delayed LIST processor. */
  constructor(options: ListDelayedMessageProcessorOptions) {
    this.#client = options.client;
    this.#delayedSetKey = options.delayedSetKey;
    this.#intervalMs = options.intervalMs;
    this.#now = options.now ?? (() => new Date());
    this.#createId = options.createId ?? (() => crypto.randomUUID());
    this.#onError = options.onError;
  }

  /** Start polling for due delayed messages. */
  start(): void {
    if (this.#timer || this.#intervalMs <= 0) return;
    this.#timer = setInterval(() => void this.processDue(), this.#intervalMs);
  }

  /** Stop polling for due delayed messages. */
  stop(): void {
    if (!this.#timer) return;
    clearInterval(this.#timer);
    this.#timer = undefined;
  }

  /** Enqueue a message for delayed LIST delivery. */
  enqueue(
    queueKey: string,
    topic: string,
    message: SagaMessage,
    delayMs: number,
  ): Promise<unknown> {
    const deliverAt = this.#now().getTime() + delayMs;
    const entry = encodeListDelayedEntry({
      queueKey,
      envelope: encodeListTransportMessage(this.#createId(), topic, message, this.#now()),
      deliverAt,
    });
    return this.#client.zadd(this.#delayedSetKey, deliverAt, entry);
  }

  /** Move all currently due delayed entries into their ready queues. */
  async processDue(): Promise<void> {
    const now = this.#now().getTime();
    const entries = await this.#client.zrangebyscore(this.#delayedSetKey, '-inf', now);
    await Promise.all(entries.map((entry) => this.#processEntry(entry)));
  }

  async #processEntry(entryJson: string): Promise<void> {
    try {
      const entry = decodeListDelayedEntry(entryJson);
      await this.#client.rpush(entry.queueKey, entry.envelope);
      await this.#client.zrem(this.#delayedSetKey, entryJson);
    } catch (error) {
      this.#onError?.(error);
    }
  }
}

/** Encode delayed LIST entry storage. */
export function encodeListDelayedEntry(entry: ListDelayedMessageEntry): string {
  return JSON.stringify(entry);
}

/** Decode delayed LIST entry storage. */
export function decodeListDelayedEntry(value: string): ListDelayedMessageEntry {
  const parsed: unknown = JSON.parse(value);
  if (!isListDelayedMessageEntry(parsed)) {
    throw new TypeError('List delayed message entry is invalid.');
  }
  return parsed;
}

function isListDelayedMessageEntry(value: unknown): value is ListDelayedMessageEntry {
  if (!isRecord(value)) return false;
  return typeof value.queueKey === 'string' &&
    typeof value.envelope === 'string' &&
    typeof value.deliverAt === 'number';
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null;
}
