import { Redis } from 'ioredis';
import type { SagaMessage } from '../domain/mod.ts';
import type {
  SagaTransportHandler,
  SagaTransportPort,
  SagaTransportSubscription,
} from '../ports/mod.ts';
import { type ListDelayedClient, ListDelayedMessageProcessor } from './list-transport-delayed.ts';
import {
  decodeListTransportMessage,
  encodeListTransportMessage,
  type ListBlockingClient,
  ListTransportAck,
  ListTransportSubscription,
  ListTransportSubscriptionRecord,
} from './list-transport-subscription.ts';
import type { RedisConnectionOptions, RedisTransportLogger } from './redis-transport.ts';

/** Structural Redis/Garnet client used by `GarnetListTransport`. */
export interface ListTransportClient extends ListDelayedClient, ListBlockingClient {
  /** Create an independent client for blocking reads. */
  duplicate(): ListTransportClient;
  /** Verify that the backing Redis-compatible server is reachable. */
  ping(): Promise<unknown>;
  /** Push a message to the left side of a list. */
  lpush(key: string, value: string): Promise<unknown>;
  /** Remove matching messages from a list. */
  lrem(key: string, count: number, value: string): Promise<unknown>;
  /** Read a range of list entries. */
  lrange(key: string, start: number, stop: number): Promise<readonly string[]>;
  /** Read the current list length. */
  llen(key: string): Promise<number>;
  /** Store metadata fields for a processing message. */
  hset(key: string, value: Readonly<Record<string, string>>): Promise<unknown>;
  /** Read all metadata fields for a processing message. */
  hgetall(key: string): Promise<Readonly<Record<string, string>>>;
  /** Increment a numeric metadata field. */
  hincrby(key: string, field: string, increment: number): Promise<unknown>;
  /** Set a metadata key expiry. */
  expire(key: string, seconds: number): Promise<unknown>;
  /** Delete a metadata key. */
  del(key: string): Promise<unknown>;
}

/** List transport client factory for tests and connection policy injection. */
export type ListTransportClientFactory = (
  connection: RedisConnectionOptions,
) => ListTransportClient;

/** Options for the Garnet-compatible LIST saga transport. */
export type GarnetListTransportOptions = Readonly<{
  id?: string;
  redis?: ListTransportClient;
  connection?: RedisConnectionOptions;
  createRedis?: ListTransportClientFactory;
  keyPrefix?: string;
  consumerGroup?: string;
  consumerName?: string;
  blockTimeoutMs?: number;
  delayedPollIntervalMs?: number;
  delayedSetKey?: string;
  orphanClaimIntervalMs?: number;
  minProcessingTimeMs?: number;
  maxRetries?: number;
  logger?: RedisTransportLogger;
  now?: () => Date;
  createId?: () => string;
}>;

type ResolvedGarnetListTransportOptions = Readonly<{
  id: string;
  redis?: ListTransportClient;
  connection?: RedisConnectionOptions;
  createRedis: ListTransportClientFactory;
  keyPrefix: string;
  consumerGroup: string;
  consumerName: string;
  blockTimeoutMs: number;
  delayedPollIntervalMs: number;
  delayedSetKey: string;
  orphanClaimIntervalMs: number;
  minProcessingTimeMs: number;
  maxRetries: number;
  logger?: RedisTransportLogger;
  now: () => Date;
  createId: () => string;
}>;

/** Garnet-compatible saga transport using Redis LIST operations. */
export class GarnetListTransport implements SagaTransportPort {
  /** Stable transport identifier. */
  readonly id: string;
  readonly #options: ResolvedGarnetListTransportOptions;
  readonly #subscriptions = new Map<string, ListTransportSubscriptionRecord>();
  #redis?: ListTransportClient;
  #started = false;
  #stopping = false;
  #delayed?: ListDelayedMessageProcessor;
  #orphanTimer?: ReturnType<typeof setInterval>;

  /** Create a Garnet-compatible LIST saga transport. */
  constructor(options: GarnetListTransportOptions = {}) {
    if (!options.redis && !options.connection) {
      throw new TypeError('List transport requires either redis or connection options.');
    }

    this.#options = resolveOptions(options);
    this.id = this.#options.id;
  }

  /** Start the LIST transport and all registered subscriptions. */
  async start(): Promise<void> {
    if (this.#started) return;

    this.#redis = this.#options.redis ?? this.#options.createRedis(this.#options.connection ?? {});
    await this.#redis.ping();
    this.#started = true;
    this.#startDelayedProcessor();
    this.#startOrphanClaimLoop();
    await Promise.all(
      [...this.#subscriptions.values()].map((record) => this.#startReadLoop(record)),
    );
  }

  /** Stop the LIST transport and release owned Redis clients. */
  async stop(_reason?: string): Promise<void> {
    if (!this.#started || this.#stopping) return;

    this.#stopping = true;
    this.#delayed?.stop();
    this.#stopOrphanClaimLoop();
    await Promise.all([...this.#subscriptions.values()].map((record) => this.#stopRecord(record)));
    if (!this.#options.redis) {
      await this.#redis?.quit();
    }

    this.#delayed = undefined;
    this.#redis = undefined;
    this.#started = false;
    this.#stopping = false;
  }

  /** Publish a message immediately to a topic queue. */
  async publish(topic: string, message: SagaMessage): Promise<void> {
    await this.#publish(topic, message);
  }

  /** Publish a message after the requested delay. */
  async publishDelayed(topic: string, message: SagaMessage, delayMs: number): Promise<void> {
    if (delayMs <= 0) {
      await this.#publish(topic, message);
      return;
    }
    await this.#requireDelayed().enqueue(this.#queueKey(topic), topic, message, delayMs);
  }

  /** Subscribe a handler to one topic queue. */
  async subscribe(
    topic: string,
    handler: SagaTransportHandler,
  ): Promise<SagaTransportSubscription> {
    const record = new ListTransportSubscriptionRecord(
      topic,
      this.#queueKey(topic),
      this.#processingKey(topic),
      handler,
    );
    this.#subscriptions.set(topic, record);
    if (this.#started) {
      await this.#startReadLoop(record);
    }
    return new ListTransportSubscription(topic, (name) => this.#unsubscribe(name));
  }

  /** Return the number of registered topic subscriptions. */
  getSubscriptionCount(): number {
    return this.#subscriptions.size;
  }

  /** Return whether the transport is started and not stopping. */
  isRunning(): boolean {
    return this.#started && !this.#stopping;
  }

  /** Return the ready queue length for one topic. */
  async getQueueLength(topic: string): Promise<number> {
    return await this.#requireRedis().llen(this.#queueKey(topic));
  }

  /** Return the processing-list length for one topic. */
  async getProcessingLength(topic: string): Promise<number> {
    return await this.#requireRedis().llen(this.#processingKey(topic));
  }

  /** Return the dead-letter queue length for one topic. */
  async getDeadLetterLength(topic: string): Promise<number> {
    return await this.#requireRedis().llen(this.#deadLetterKey(topic));
  }

  async #publish(topic: string, message: SagaMessage): Promise<void> {
    await this.#requireRedis().rpush(
      this.#queueKey(topic),
      encodeListTransportMessage(this.#options.createId(), topic, message, this.#options.now()),
    );
  }

  async #startReadLoop(record: ListTransportSubscriptionRecord): Promise<void> {
    if (record.readLoopPromise) return;
    record.attachBlockingClient(this.#createBlockingClient());
    record.resetStop();
    record.attachReadLoop(this.#readLoop(record));
  }

  async #readLoop(record: ListTransportSubscriptionRecord): Promise<void> {
    while (this.#started && !this.#stopping && !record.stopping) {
      await this.#processRecord(record);
    }
  }

  async #processRecord(record: ListTransportSubscriptionRecord): Promise<void> {
    try {
      const messageJson = await this.#moveNext(record);
      if (!messageJson) return;
      await this.#handleMovedMessage(record, messageJson);
    } catch (error) {
      if (this.#stopping || record.stopping) return;
      this.#options.logger?.error('List saga transport read error.', { error });
      await sleep(100);
    }
  }

  async #moveNext(record: ListTransportSubscriptionRecord): Promise<string | undefined> {
    const client = record.blockingClient;
    if (!client) return undefined;
    try {
      return await client.blmove(
        record.queueKey,
        record.processingKey,
        'RIGHT',
        'LEFT',
        this.#options.blockTimeoutMs / 1000,
      ) ?? undefined;
    } catch {
      return await client.brpoplpush(
        record.queueKey,
        record.processingKey,
        this.#options.blockTimeoutMs / 1000,
      ) ?? undefined;
    }
  }

  async #handleMovedMessage(
    record: ListTransportSubscriptionRecord,
    messageJson: string,
  ): Promise<void> {
    const decoded = decodeListTransportMessage(messageJson);
    const metadataKey = this.#metadataKey(decoded.envelopeId);
    await this.#storeMetadata(metadataKey, 0);

    const ack = new ListTransportAck(
      record.processingKey,
      messageJson,
      metadataKey,
      (processingKey, payload, key) => this.#acknowledgeMessage(processingKey, payload, key),
    );

    try {
      await record.handler(decoded.transportMessage, ack);
      if (!ack.settled) await ack.ack();
    } catch (error) {
      this.#options.logger?.error('List saga transport handler error.', { error });
      await this.#requireRedis().hincrby(metadataKey, 'retryCount', 1);
    }
  }

  async #acknowledgeMessage(
    processingKey: string,
    messageJson: string,
    metadataKey: string,
  ): Promise<void> {
    await this.#requireRedis().lrem(processingKey, 1, messageJson);
    await this.#requireRedis().del(metadataKey);
  }

  #startDelayedProcessor(): void {
    if (this.#options.delayedPollIntervalMs <= 0) return;
    this.#delayed = new ListDelayedMessageProcessor({
      client: this.#requireRedis(),
      delayedSetKey: this.#delayedKey(),
      intervalMs: this.#options.delayedPollIntervalMs,
      now: this.#options.now,
      createId: this.#options.createId,
      onError: (error) =>
        this.#options.logger?.error('List delayed saga message error.', { error }),
    });
    this.#delayed.start();
  }

  #startOrphanClaimLoop(): void {
    if (this.#orphanTimer || this.#options.orphanClaimIntervalMs <= 0) return;
    this.#orphanTimer = setInterval(
      () => void this.#reclaimOrphanedMessages(),
      this.#options.orphanClaimIntervalMs,
    );
  }

  #stopOrphanClaimLoop(): void {
    if (!this.#orphanTimer) return;
    clearInterval(this.#orphanTimer);
    this.#orphanTimer = undefined;
  }

  async #reclaimOrphanedMessages(): Promise<void> {
    await Promise.all(
      [...this.#subscriptions.values()].map((record) => this.#reclaimRecord(record)),
    );
  }

  async #reclaimRecord(record: ListTransportSubscriptionRecord): Promise<void> {
    try {
      const messages = await this.#requireRedis().lrange(record.processingKey, 0, -1);
      await Promise.all(messages.map((messageJson) => this.#reclaimMessage(record, messageJson)));
    } catch (error) {
      this.#options.logger?.error('List saga transport orphan reclaim error.', { error });
    }
  }

  async #reclaimMessage(
    record: ListTransportSubscriptionRecord,
    messageJson: string,
  ): Promise<void> {
    const decoded = decodeListTransportMessage(messageJson);
    const metadataKey = this.#metadataKey(decoded.envelopeId);
    const metadata = await this.#requireRedis().hgetall(metadataKey);
    const retryCount = Number.parseInt(metadata.retryCount ?? '0', 10);
    const startedAt = Number.parseInt(metadata.startedAt ?? '0', 10);
    const processingTime = this.#options.now().getTime() - startedAt;
    if (processingTime <= this.#options.minProcessingTimeMs) return;

    if (retryCount >= this.#options.maxRetries) {
      await this.#moveToDeadLetter(record, messageJson, metadataKey);
      return;
    }

    await this.#requeueMessage(record, messageJson, metadataKey, retryCount + 1);
  }

  async #requeueMessage(
    record: ListTransportSubscriptionRecord,
    messageJson: string,
    metadataKey: string,
    retryCount: number,
  ): Promise<void> {
    await this.#storeMetadata(metadataKey, retryCount);
    await this.#requireRedis().lrem(record.processingKey, 1, messageJson);
    await this.#requireRedis().lpush(record.queueKey, messageJson);
  }

  async #moveToDeadLetter(
    record: ListTransportSubscriptionRecord,
    messageJson: string,
    metadataKey: string,
  ): Promise<void> {
    await this.#requireRedis().lrem(record.processingKey, 1, messageJson);
    await this.#requireRedis().rpush(this.#deadLetterKey(record.topic), messageJson);
    await this.#requireRedis().del(metadataKey);
  }

  async #storeMetadata(metadataKey: string, retryCount: number): Promise<void> {
    await this.#requireRedis().hset(metadataKey, {
      startedAt: this.#options.now().getTime().toString(),
      retryCount: retryCount.toString(),
    });
    await this.#requireRedis().expire(metadataKey, 86400);
  }

  async #stopRecord(record: ListTransportSubscriptionRecord): Promise<void> {
    record.requestStop();
    await record.readLoopPromise;
    await record.blockingClient?.quit();
    record.clearRuntime();
  }

  #requireDelayed(): ListDelayedMessageProcessor {
    if (!this.#delayed) {
      throw new TypeError('List delayed message processor is not started.');
    }
    return this.#delayed;
  }

  #requireRedis(): ListTransportClient {
    if (!this.#redis) {
      throw new TypeError('List saga transport is not started.');
    }
    return this.#redis;
  }

  #createBlockingClient(): ListTransportClient {
    return this.#options.redis?.duplicate() ??
      this.#options.createRedis(this.#options.connection ?? {});
  }

  #queueKey(topic: string): string {
    return `${this.#options.keyPrefix}queue:${topic}`;
  }

  #processingKey(topic: string): string {
    return `${this.#options.keyPrefix}processing:${topic}:${this.#options.consumerGroup}:${this.#options.consumerName}`;
  }

  #deadLetterKey(topic: string): string {
    return `${this.#options.keyPrefix}dlq:${topic}`;
  }

  #metadataKey(envelopeId: string): string {
    return `${this.#options.keyPrefix}meta:${envelopeId}`;
  }

  #delayedKey(): string {
    return `${this.#options.keyPrefix}${this.#options.delayedSetKey}`;
  }

  async #unsubscribe(topic: string): Promise<void> {
    const record = this.#subscriptions.get(topic);
    if (record) {
      await this.#stopRecord(record);
    }
    this.#subscriptions.delete(topic);
  }
}

/** Create a Garnet-compatible LIST saga transport. */
export function createGarnetListTransport(
  options: GarnetListTransportOptions = {},
): GarnetListTransport {
  return new GarnetListTransport(options);
}

function resolveOptions(
  options: GarnetListTransportOptions,
): ResolvedGarnetListTransportOptions {
  return Object.freeze({
    id: options.id ?? 'garnet-list-saga-transport',
    redis: options.redis,
    connection: options.connection,
    createRedis: options.createRedis ?? createDefaultListClient,
    keyPrefix: options.keyPrefix ?? 'saga-bus:',
    consumerGroup: options.consumerGroup ?? 'saga-processor',
    consumerName: options.consumerName ?? `consumer-${crypto.randomUUID()}`,
    blockTimeoutMs: options.blockTimeoutMs ?? 100,
    delayedPollIntervalMs: options.delayedPollIntervalMs ?? 1000,
    delayedSetKey: options.delayedSetKey ?? 'delayed',
    orphanClaimIntervalMs: options.orphanClaimIntervalMs ?? 30000,
    minProcessingTimeMs: options.minProcessingTimeMs ?? 60000,
    maxRetries: options.maxRetries ?? 5,
    logger: options.logger,
    now: options.now ?? (() => new Date()),
    createId: options.createId ?? (() => crypto.randomUUID()),
  });
}

function createDefaultListClient(connection: RedisConnectionOptions): ListTransportClient {
  return new Redis({
    host: connection.host ?? 'localhost',
    port: connection.port ?? 6379,
    password: connection.password,
    db: connection.db ?? 0,
    tls: connection.tls,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  }) as unknown as ListTransportClient;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
