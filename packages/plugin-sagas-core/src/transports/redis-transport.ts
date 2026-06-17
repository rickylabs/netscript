import type { SagaMessage } from '../domain/mod.ts';
import type {
  SagaTransportHandler,
  SagaTransportPort,
  SagaTransportSubscription,
} from '../ports/mod.ts';
import {
  acknowledgeRedisStreamMessage,
  addRedisStreamMessage,
  claimRedisPendingMessages,
  ensureRedisGroup,
  readRedisGroupMessages,
  type RedisConnectionOptions,
  type RedisStreamClient,
  type RedisStreamClientFactory,
  redisStreamKey,
  type RedisTransportLogger,
  type ResolvedRedisTransportOptions,
  resolveRedisTransportOptions,
} from './redis-transport-commands.ts';
import { RedisDelayedMessageProcessor } from './redis-transport-delayed.ts';
import {
  decodeRedisTransportMessage,
  encodeRedisTransportMessage,
  RedisTransportAck,
  RedisTransportSubscription,
  type RedisTransportSubscriptionRecord,
} from './redis-transport-subscription.ts';

export type {
  RedisConnectionOptions,
  RedisStreamClient,
  RedisStreamClientFactory,
  RedisTransportLogger,
} from './redis-transport-commands.ts';

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

    this.#options = resolveRedisTransportOptions(options) as ResolvedRedisTransportOptions;
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
    await addRedisStreamMessage(this.#requireRedis(), streamKey, envelope, this.#options);
  }

  async #ensureGroup(record: RedisTransportSubscriptionRecord): Promise<void> {
    await ensureRedisGroup(this.#requireRedis(), record, this.#options);
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
      const results = await readRedisGroupMessages(
        this.#requireSubscriberRedis(),
        subscriptions,
        this.#options,
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
      (key, id) => acknowledgeRedisStreamMessage(this.#requireRedis(), key, id, this.#options),
    );

    try {
      await record.handler(decodeRedisTransportMessage(record.topic, fields), ack);
      if (!ack.settled) await ack.ack();
    } catch (error) {
      this.#options.logger?.error('Redis saga transport handler error.', { error });
    }
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
    await claimRedisPendingMessages(
      this.#requireRedis(),
      [...this.#subscriptions.values()],
      this.#options,
      (record, messageId, fields) => this.#processMessage(record.streamKey, messageId, fields),
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
    return redisStreamKey(this.#options.keyPrefix, topic);
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
