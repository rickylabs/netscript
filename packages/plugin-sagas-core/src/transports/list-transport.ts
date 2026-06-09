import type { SagaMessage } from '../domain/mod.ts';
import type {
  SagaTransportHandler,
  SagaTransportPort,
  SagaTransportSubscription,
} from '../ports/mod.ts';
import {
  acknowledgeListMessage,
  type GarnetListTransportOptions,
  listDeadLetterKey,
  listDelayedKey,
  listMetadataKey,
  listProcessingKey,
  listQueueKey,
  type ListTransportClient,
  moveNextListMessage,
  publishListMessage,
  reclaimListRecords,
  type ResolvedGarnetListTransportOptions,
  resolveGarnetListTransportOptions,
  storeListMetadata,
} from './list-transport-commands.ts';
import { ListDelayedMessageProcessor } from './list-transport-delayed.ts';
import {
  decodeListTransportMessage,
  ListTransportAck,
  ListTransportSubscription,
  ListTransportSubscriptionRecord,
} from './list-transport-subscription.ts';

export type {
  GarnetListTransportOptions,
  ListTransportClient,
  ListTransportClientFactory,
} from './list-transport-commands.ts';

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

    this.#options = resolveGarnetListTransportOptions(options);
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
    await publishListMessage(
      this.#requireRedis(),
      this.#queueKey(topic),
      topic,
      message,
      this.#options.now(),
      this.#options.createId,
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
    return await moveNextListMessage(record.blockingClient, record, this.#options.blockTimeoutMs);
  }

  async #handleMovedMessage(
    record: ListTransportSubscriptionRecord,
    messageJson: string,
  ): Promise<void> {
    const decoded = decodeListTransportMessage(messageJson);
    const metadataKey = this.#metadataKey(decoded.envelopeId);
    await storeListMetadata(this.#requireRedis(), metadataKey, 0, this.#options.now());

    const ack = new ListTransportAck(
      record.processingKey,
      messageJson,
      metadataKey,
      (processingKey, payload, key) =>
        acknowledgeListMessage(this.#requireRedis(), processingKey, payload, key),
    );

    try {
      await record.handler(decoded.transportMessage, ack);
      if (!ack.settled) await ack.ack();
    } catch (error) {
      this.#options.logger?.error('List saga transport handler error.', { error });
      await this.#requireRedis().hincrby(metadataKey, 'retryCount', 1);
    }
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
    await reclaimListRecords(
      this.#requireRedis(),
      [...this.#subscriptions.values()],
      this.#options,
    );
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
    return listQueueKey(this.#options.keyPrefix, topic);
  }

  #processingKey(topic: string): string {
    return listProcessingKey(
      this.#options.keyPrefix,
      this.#options.consumerGroup,
      this.#options.consumerName,
      topic,
    );
  }

  #deadLetterKey(topic: string): string {
    return listDeadLetterKey(this.#options.keyPrefix, topic);
  }

  #metadataKey(envelopeId: string): string {
    return listMetadataKey(this.#options.keyPrefix, envelopeId);
  }

  #delayedKey(): string {
    return listDelayedKey(this.#options.keyPrefix, this.#options.delayedSetKey);
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
