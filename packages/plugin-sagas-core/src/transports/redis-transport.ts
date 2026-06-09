import { Redis } from 'ioredis';
import type { SagaMessage } from '../domain/mod.ts';
import type {
  SagaTransportHandler,
  SagaTransportPort,
  SagaTransportSubscription,
} from '../ports/mod.ts';
import {
  type RedisDelayedClient,
  RedisDelayedMessageProcessor,
} from './redis-transport-delayed.ts';
import {
  decodeRedisTransportMessage,
  encodeRedisTransportMessage,
  type RedisClaimedMessageResult,
  type RedisPendingMessageResult,
  type RedisStreamReadGroupResult,
  RedisTransportAck,
  RedisTransportSubscription,
  type RedisTransportSubscriptionRecord,
} from './redis-transport-subscription.ts';

/** Structural Redis Streams client used by `NetScriptRedisTransport`. */
export interface RedisStreamClient extends RedisDelayedClient {
  /** Create an independent client for subscription reads. */
  duplicate(): RedisStreamClient;
  /** Close the Redis client connection. */
  quit(): Promise<unknown>;
  /** Add a serialized message envelope to a Redis Stream. */
  xadd(...args: (string | number)[]): Promise<unknown>;
  /** Acknowledge one Redis Stream message. */
  xack(streamKey: string, group: string, messageId: string): Promise<unknown>;
  /** Run an XGROUP command used to create consumer groups. */
  xgroup(
    command: 'CREATE',
    streamKey: string,
    group: string,
    id: string,
    mkstream: 'MKSTREAM',
  ): Promise<unknown>;
  /** Read messages for the configured consumer group. */
  xreadgroup(
    groupCommand: 'GROUP',
    group: string,
    consumer: string,
    countCommand: 'COUNT',
    count: number,
    blockCommand: 'BLOCK',
    blockMs: number,
    streamsCommand: 'STREAMS',
    ...keysAndIds: string[]
  ): Promise<RedisStreamReadGroupResult | null>;
  /** Read pending message metadata for recovery. */
  xpending(
    streamKey: string,
    group: string,
    start: string,
    end: string,
    count: number,
  ): Promise<RedisPendingMessageResult>;
  /** Claim one idle pending message for this consumer. */
  xclaim(
    streamKey: string,
    group: string,
    consumer: string,
    minIdleMs: number,
    messageId: string,
  ): Promise<RedisClaimedMessageResult>;
}

/** Redis connection options accepted by the default ioredis factory. */
export type RedisConnectionOptions = Readonly<{
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  tls?: Readonly<{
    rejectUnauthorized?: boolean;
  }>;
}>;

/** Redis client factory for tests and custom connection policies. */
export type RedisStreamClientFactory = (
  connection: RedisConnectionOptions,
) => RedisStreamClient;

/** Transport logger hook; no global console usage in framework code. */
export interface RedisTransportLogger {
  /** Record diagnostic transport details. */
  debug(message: string, metadata?: Readonly<Record<string, unknown>>): void;
  /** Record recoverable transport warnings. */
  warn(message: string, metadata?: Readonly<Record<string, unknown>>): void;
  /** Record transport errors. */
  error(message: string, metadata?: Readonly<Record<string, unknown>>): void;
}

/** Options for the Redis Streams saga transport. */
export type NetScriptRedisTransportOptions = Readonly<{
  id?: string;
  redis?: RedisStreamClient;
  connection?: RedisConnectionOptions;
  createRedis?: RedisStreamClientFactory;
  keyPrefix?: string;
  consumerGroup?: string;
  consumerName?: string;
  autoCreateGroup?: boolean;
  batchSize?: number;
  blockTimeoutMs?: number;
  maxStreamLength?: number;
  approximateMaxLen?: boolean;
  delayedPollIntervalMs?: number;
  delayedSetKey?: string;
  pendingClaimIntervalMs?: number;
  minIdleTimeMs?: number;
  logger?: RedisTransportLogger;
  now?: () => Date;
}>;

type ResolvedRedisTransportOptions = Readonly<{
  id: string;
  redis?: RedisStreamClient;
  connection?: RedisConnectionOptions;
  createRedis: RedisStreamClientFactory;
  keyPrefix: string;
  consumerGroup: string;
  consumerName: string;
  autoCreateGroup: boolean;
  batchSize: number;
  blockTimeoutMs: number;
  maxStreamLength: number;
  approximateMaxLen: boolean;
  delayedPollIntervalMs: number;
  delayedSetKey: string;
  pendingClaimIntervalMs: number;
  minIdleTimeMs: number;
  logger?: RedisTransportLogger;
  now: () => Date;
}>;

/** Redis Streams transport for saga message delivery. */
export class NetScriptRedisTransport implements SagaTransportPort {
  /** Stable transport identifier. */
  readonly id: string;
  readonly #options: ResolvedRedisTransportOptions;
  readonly #subscriptions = new Map<string, RedisTransportSubscriptionRecord>();
  #redis?: RedisStreamClient;
  #subscriberRedis?: RedisStreamClient;
  #started = false;
  #stopping = false;
  #readLoopPromise?: Promise<void>;
  #delayed?: RedisDelayedMessageProcessor;
  #pendingTimer?: ReturnType<typeof setInterval>;

  /** Create a Redis Streams saga transport. */
  constructor(options: NetScriptRedisTransportOptions = {}) {
    if (!options.redis && !options.connection) {
      throw new TypeError('Redis transport requires either redis or connection options.');
    }

    this.#options = resolveOptions(options);
    this.id = this.#options.id;
  }

  /** Start the Redis transport and its read loop. */
  async start(): Promise<void> {
    if (this.#started) return;

    this.#redis = this.#options.redis ?? this.#options.createRedis(this.#options.connection ?? {});
    this.#subscriberRedis = this.#redis.duplicate();
    await Promise.all([...this.#subscriptions.values()].map((item) => this.#ensureGroup(item)));

    this.#started = true;
    this.#startDelayedProcessor();
    this.#startPendingClaimLoop();
    this.#startReadLoop();
    this.#options.logger?.debug('Redis saga transport started.', {
      id: this.id,
      subscriptionCount: this.#subscriptions.size,
    });
  }

  /** Stop the Redis transport and release owned clients. */
  async stop(_reason?: string): Promise<void> {
    if (!this.#started || this.#stopping) return;

    this.#stopping = true;
    this.#delayed?.stop();
    this.#stopPendingClaimLoop();
    await this.#readLoopPromise;
    await this.#subscriberRedis?.quit();
    if (!this.#options.redis) {
      await this.#redis?.quit();
    }

    this.#readLoopPromise = undefined;
    this.#delayed = undefined;
    this.#subscriberRedis = undefined;
    this.#redis = undefined;
    this.#started = false;
    this.#stopping = false;
  }

  /** Publish a message immediately to a Redis Stream. */
  async publish(topic: string, message: SagaMessage): Promise<void> {
    await this.#publish(topic, message);
  }

  /** Publish a message after the requested delay. */
  async publishDelayed(topic: string, message: SagaMessage, delayMs: number): Promise<void> {
    if (delayMs <= 0) {
      await this.#publish(topic, message);
      return;
    }
    await this.#requireDelayed().enqueue(this.#streamKey(topic), topic, message, delayMs);
  }

  /** Subscribe a handler to one topic stream. */
  async subscribe(
    topic: string,
    handler: SagaTransportHandler,
  ): Promise<SagaTransportSubscription> {
    const record: RedisTransportSubscriptionRecord = Object.freeze({
      topic,
      streamKey: this.#streamKey(topic),
      handler,
    });
    this.#subscriptions.set(topic, record);

    if (this.#started) {
      await this.#ensureGroup(record);
      this.#startReadLoop();
    }

    return new RedisTransportSubscription(topic, (name) => this.#unsubscribe(name));
  }

  /** Return the number of registered topic subscriptions. */
  getSubscriptionCount(): number {
    return this.#subscriptions.size;
  }

  /** Return whether the transport is started and not stopping. */
  isRunning(): boolean {
    return this.#started && !this.#stopping;
  }

  async #publish(topic: string, message: SagaMessage): Promise<void> {
    await this.#addToStream(
      this.#streamKey(topic),
      encodeRedisTransportMessage(topic, message, this.#options.now()),
    );
  }

  async #addToStream(streamKey: string, envelope: string): Promise<void> {
    const redis = this.#requireRedis();
    await redis.xadd(...this.#xaddArgs(streamKey, envelope));
  }

  #xaddArgs(streamKey: string, envelope: string): (string | number)[] {
    if (this.#options.maxStreamLength <= 0) {
      return [streamKey, '*', 'data', envelope];
    }
    if (this.#options.approximateMaxLen) {
      return [streamKey, 'MAXLEN', '~', this.#options.maxStreamLength, '*', 'data', envelope];
    }
    return [streamKey, 'MAXLEN', this.#options.maxStreamLength, '*', 'data', envelope];
  }

  async #ensureGroup(record: RedisTransportSubscriptionRecord): Promise<void> {
    if (!this.#options.autoCreateGroup) return;
    try {
      await this.#requireRedis().xgroup(
        'CREATE',
        record.streamKey,
        this.#options.consumerGroup,
        '0',
        'MKSTREAM',
      );
    } catch (error) {
      if (!isBusyGroupError(error)) throw error;
    }
  }

  #startReadLoop(): void {
    if (this.#readLoopPromise || this.#subscriptions.size === 0) return;
    this.#readLoopPromise = this.#readLoop();
  }

  async #readLoop(): Promise<void> {
    while (this.#started && !this.#stopping) {
      await this.#readOnce();
    }
  }

  async #readOnce(): Promise<void> {
    const subscriptions = [...this.#subscriptions.values()];
    if (subscriptions.length === 0) {
      await sleep(100);
      return;
    }

    try {
      const streams = subscriptions.map((item) => item.streamKey);
      const results = await this.#requireSubscriberRedis().xreadgroup(
        'GROUP',
        this.#options.consumerGroup,
        this.#options.consumerName,
        'COUNT',
        this.#options.batchSize,
        'BLOCK',
        this.#options.blockTimeoutMs,
        'STREAMS',
        ...streams,
        ...streams.map(() => '>'),
      );

      await Promise.all(
        (results ?? []).map(([streamKey, messages]) =>
          Promise.all(
            messages.map(([messageId, fields]) =>
              this.#processMessage(streamKey, messageId, fields)
            ),
          )
        ),
      );
    } catch (error) {
      if (this.#stopping) return;
      this.#options.logger?.error('Redis saga transport read error.', { error });
      await sleep(1000);
    }
  }

  async #processMessage(
    streamKey: string,
    messageId: string,
    fields: readonly string[],
  ): Promise<void> {
    const record = [...this.#subscriptions.values()].find((item) => item.streamKey === streamKey);
    if (!record) return;

    const ack = new RedisTransportAck(
      streamKey,
      messageId,
      (key, id) => this.#acknowledgeMessage(key, id),
    );

    try {
      await record.handler(decodeRedisTransportMessage(record.topic, fields), ack);
      if (!ack.settled) await ack.ack();
    } catch (error) {
      this.#options.logger?.error('Redis saga transport handler error.', { error });
    }
  }

  async #acknowledgeMessage(streamKey: string, messageId: string): Promise<void> {
    await this.#requireRedis().xack(streamKey, this.#options.consumerGroup, messageId);
  }

  #startPendingClaimLoop(): void {
    if (this.#pendingTimer || this.#options.pendingClaimIntervalMs <= 0) return;
    this.#pendingTimer = setInterval(
      () => void this.#claimPendingMessages(),
      this.#options.pendingClaimIntervalMs,
    );
  }

  #stopPendingClaimLoop(): void {
    if (!this.#pendingTimer) return;
    clearInterval(this.#pendingTimer);
    this.#pendingTimer = undefined;
  }

  async #claimPendingMessages(): Promise<void> {
    await Promise.all(
      [...this.#subscriptions.values()].map((record) => this.#claimPendingFor(record)),
    );
  }

  async #claimPendingFor(record: RedisTransportSubscriptionRecord): Promise<void> {
    try {
      const pending = await this.#requireRedis().xpending(
        record.streamKey,
        this.#options.consumerGroup,
        '-',
        '+',
        this.#options.batchSize,
      );
      await Promise.all(pending.map((entry) => this.#claimPendingEntry(record, entry)));
    } catch (error) {
      this.#options.logger?.error('Redis saga transport pending-claim error.', { error });
    }
  }

  async #claimPendingEntry(
    record: RedisTransportSubscriptionRecord,
    entry: RedisPendingMessageResult[number],
  ): Promise<void> {
    const [messageId, , idleMs] = entry;
    if (idleMs < this.#options.minIdleTimeMs) return;

    const claimed = await this.#requireRedis().xclaim(
      record.streamKey,
      this.#options.consumerGroup,
      this.#options.consumerName,
      this.#options.minIdleTimeMs,
      messageId,
    );
    await Promise.all(
      claimed.map(([claimedId, fields]) =>
        this.#processMessage(record.streamKey, claimedId, fields)
      ),
    );
  }

  #startDelayedProcessor(): void {
    if (this.#options.delayedPollIntervalMs <= 0) return;
    this.#delayed = new RedisDelayedMessageProcessor({
      client: this.#requireRedis(),
      delayedSetKey: this.#options.delayedSetKey,
      intervalMs: this.#options.delayedPollIntervalMs,
      now: this.#options.now,
      addToStream: (streamKey, envelope) => this.#addToStream(streamKey, envelope),
      onError: (error) =>
        this.#options.logger?.error('Redis delayed saga message error.', { error }),
    });
    this.#delayed.start();
  }

  #requireDelayed(): RedisDelayedMessageProcessor {
    if (!this.#delayed) {
      throw new TypeError('Redis delayed message processor is not started.');
    }
    return this.#delayed;
  }

  #requireRedis(): RedisStreamClient {
    if (!this.#redis) {
      throw new TypeError('Redis saga transport is not started.');
    }
    return this.#redis;
  }

  #requireSubscriberRedis(): RedisStreamClient {
    if (!this.#subscriberRedis) {
      throw new TypeError('Redis saga transport subscriber is not started.');
    }
    return this.#subscriberRedis;
  }

  #streamKey(topic: string): string {
    return `${this.#options.keyPrefix}stream:${topic}`;
  }

  #unsubscribe(topic: string): Promise<void> {
    this.#subscriptions.delete(topic);
    return Promise.resolve();
  }
}

/** Create a Redis Streams transport for saga delivery. */
export function createNetScriptRedisTransport(
  options: NetScriptRedisTransportOptions = {},
): NetScriptRedisTransport {
  return new NetScriptRedisTransport(options);
}

function resolveOptions(options: NetScriptRedisTransportOptions): ResolvedRedisTransportOptions {
  return Object.freeze({
    id: options.id ?? 'redis-saga-transport',
    redis: options.redis,
    connection: options.connection,
    createRedis: options.createRedis ?? createDefaultRedisClient,
    keyPrefix: options.keyPrefix ?? 'saga-bus:',
    consumerGroup: options.consumerGroup ?? 'saga-processor',
    consumerName: options.consumerName ?? `consumer-${crypto.randomUUID()}`,
    autoCreateGroup: options.autoCreateGroup ?? true,
    batchSize: options.batchSize ?? 10,
    blockTimeoutMs: options.blockTimeoutMs ?? 5000,
    maxStreamLength: options.maxStreamLength ?? 0,
    approximateMaxLen: options.approximateMaxLen ?? true,
    delayedPollIntervalMs: options.delayedPollIntervalMs ?? 1000,
    delayedSetKey: options.delayedSetKey ?? 'saga-bus:delayed',
    pendingClaimIntervalMs: options.pendingClaimIntervalMs ?? 30000,
    minIdleTimeMs: options.minIdleTimeMs ?? 60000,
    logger: options.logger,
    now: options.now ?? (() => new Date()),
  });
}

function createDefaultRedisClient(connection: RedisConnectionOptions): RedisStreamClient {
  return new Redis(connection) as unknown as RedisStreamClient;
}

function isBusyGroupError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('BUSYGROUP');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
