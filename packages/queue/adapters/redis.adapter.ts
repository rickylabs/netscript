/**
 * Redis Queue Adapter
 *
 * Uses Redis LIST operations for NetScript queue integration.
 *
 * @module
 */

import { Redis } from 'ioredis';
import { delay } from '@std/async';
import type {
  DeadLetterStorePort,
  EnqueueOptions,
  ListenOptions,
  MessageContext,
  MessageQueue,
} from '../ports/mod.ts';
import { QueueConnectionError, QueueError, QueueErrorCode } from '../ports/mod.ts';
import { createEnvelope, createMessageContext } from './_envelope.ts';
import { RedisLeases } from './_redis-lease.ts';
import type { RedisLease, RedisQueueHealth, RedisQueueMetrics } from './_redis-lease-state.ts';
export type { RedisQueueHealth, RedisQueueMetrics } from './_redis-lease-state.ts';
import { RedisDelayedPromotion } from './_redis-delayed-runtime.ts';
import { DELAYED_PROMOTION_BATCH_SIZE } from './_redis-delayed-promotion.ts';

export type {
  DeadLetterReason,
  DeadLetterRecord,
  DeadLetterStorePort,
  EnqueueOptions,
  ListenOptions,
  MessageContext,
  MessageQueue,
  NackOptions,
} from '../ports/mod.ts';

function getRedisOptions(userOptions?: Record<string, unknown>): Record<string, unknown> {
  return {
    ...userOptions,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 10000,
    keepAlive: 30000,
    lazyConnect: false,
  };
}

const EMPTY_QUEUE_POLL_MS = 50;
const DEFAULT_DELAYED_POLL_MS = 1_000;
const DELAYED_PROMOTION_ATTEMPTS = 3;
const DELAYED_PROMOTION_BATCHES_PER_PASS = 10;
const DELAYED_PROMOTION_JITTER_MS = 5;

interface RedisQueueClients {
  readonly commands: Redis;
  readonly blocking: Redis;
}

/**
 * Redis queue adapter implementation.
 *
 * @template T - Message payload type
 */
export class RedisAdapter<T = unknown> implements MessageQueue<T> {
  private listening = false;
  private abortController?: AbortController;
  private clients: RedisQueueClients | null = null;
  private leaseRuntime?: RedisLeases<T>;
  private leaseTimer?: ReturnType<typeof setInterval>;
  private delayedTimer?: ReturnType<typeof setInterval>;
  private delayedPromotion?: Promise<void>;
  private promotionClient?: Redis;
  private promotionRuntime?: RedisDelayedPromotion;
  private readonly explicitDeadLetterStore?: DeadLetterStorePort<T>;

  /**
   * Redis supports native retry-style redelivery through the processing list.
   */
  readonly nativeRetrial = true;

  /**
   * Create a Redis queue adapter.
   *
   * @param url - Redis connection URL.
   * @param queueName - Queue name used in Redis keys.
   * @param options - Additional ioredis options merged with queue defaults.
   */
  constructor(
    private readonly url: string,
    private readonly queueName = 'default',
    private readonly options: Record<string, unknown> | undefined = undefined,
    explicitDeadLetterStore?: DeadLetterStorePort<T>,
  ) {
    this.explicitDeadLetterStore = explicitDeadLetterStore;
  }

  /**
   * Enqueue one message into Redis or the delayed sorted set.
   *
   * @param message - Message payload to enqueue.
   * @param options - Optional delay and metadata settings.
   */
  async enqueue(message: T, options?: EnqueueOptions): Promise<void> {
    try {
      const envelope = createEnvelope(message, options);
      const encoded = JSON.stringify(envelope);
      const clients = this.ensureClients();

      if (options?.delay && options.delay > 0) {
        await clients.commands.zadd(
          this.delayedKey,
          Date.now() + options.delay,
          JSON.stringify({ queueKey: this.queueKey, envelope: encoded }),
        );
        return;
      }

      await clients.commands.lpush(this.queueKey, encoded);
    } catch (error) {
      throw new QueueError(
        `Failed to enqueue message: ${error instanceof Error ? error.message : String(error)}`,
        QueueErrorCode.ENQUEUE_FAILED,
        {
          cause: error instanceof Error ? error : undefined,
          context: { queueName: this.queueName, url: this.url },
        },
      );
    }
  }

  /**
   * Enqueue messages in small parallel batches.
   *
   * @param messages - Message payloads to enqueue.
   * @param options - Optional delay and metadata settings applied to each message.
   */
  async enqueueMany(messages: T[], options?: EnqueueOptions): Promise<void> {
    try {
      const batchSize = 10;
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        await Promise.all(batch.map((message) => this.enqueue(message, options)));
      }
    } catch (error) {
      throw new QueueError(
        `Failed to enqueue messages: ${error instanceof Error ? error.message : String(error)}`,
        QueueErrorCode.ENQUEUE_FAILED,
        {
          cause: error instanceof Error ? error : undefined,
          context: { queueName: this.queueName, count: messages.length },
        },
      );
    }
  }

  /**
   * Listen sequentially using atomic Redis claims with receipt-fenced leases.
   *
   * @param handler - Async callback invoked for each decoded message.
   * @param options - Listener cancellation and concurrency settings.
   */
  async listen(
    handler: (message: T, context: MessageContext) => Promise<void>,
    options?: ListenOptions,
  ): Promise<void> {
    if (this.listening) {
      throw new QueueError('Queue is already listening', QueueErrorCode.CONFIGURATION_ERROR);
    }

    if (options?.signal?.aborted) return;
    const leases = this.ensureLeases();
    leases.configure(options);
    this.listening = true;
    this.abortController = new AbortController();

    const signal = options?.signal;
    const onAbort = (): void => {
      this.abortController?.abort();
      this.clients?.blocking.disconnect();
    };
    signal?.addEventListener('abort', onAbort);

    try {
      await leases.ready(this.abortController.signal);
      this.abortController.signal.throwIfAborted();
      this.startDelayedProcessor();
      this.leaseTimer = setInterval(() => {
        void leases.reclaimExpired().catch((error: unknown) => this.reportPromotionError(error));
      }, leases.pollInterval);
      while (!this.abortController.signal.aborted) {
        const claim = await leases.claim(this.abortController.signal);
        this.abortController.signal.throwIfAborted();
        if (!claim) {
          await delay(EMPTY_QUEUE_POLL_MS, { signal: this.abortController.signal });
          continue;
        }

        await this.handleEncodedMessage(claim, handler, leases, this.abortController.signal);
      }
    } catch (error) {
      if (this.abortController.signal.aborted) {
        return;
      }
      throw new QueueError(
        `Queue listener failed: ${error instanceof Error ? error.message : String(error)}`,
        QueueErrorCode.DEQUEUE_FAILED,
        {
          cause: error instanceof Error ? error : undefined,
          context: { queueName: this.queueName },
        },
      );
    } finally {
      signal?.removeEventListener('abort', onAbort);
      this.stopDelayedProcessor();
      this.stopLeaseProcessor();
      this.listening = false;
    }
  }

  /**
   * Stop the listener, delayed processor, and blocking Redis client.
   */
  async stop(): Promise<void> {
    this.abortController?.abort();
    this.listening = false;
    this.stopDelayedProcessor();
    this.stopLeaseProcessor();
    this.leaseRuntime?.stop();
    this.leaseRuntime = undefined;
    this.clients?.blocking.disconnect();
    this.clients?.commands.disconnect();
    if (this.promotionRuntime) this.promotionRuntime.disconnect();
    else this.promotionClient?.disconnect();
    // ioredis need not reject queued work or emit close when already reconnecting.
    // Manual disconnect prevents future execution, so its signal bounds the drain.
    await Promise.race([
      this.delayedPromotion?.catch(() => {}),
      this.promotionRuntime?.disconnected ?? Promise.resolve(),
    ]);
    this.promotionRuntime?.dispose();
    this.promotionRuntime = undefined;
    this.promotionClient = undefined;
    this.clients = null;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Return or initialize the command and blocking Redis clients.
   */
  private ensureClients(): RedisQueueClients {
    if (this.clients) {
      return this.clients;
    }

    try {
      const redisOptions = getRedisOptions(this.options);
      this.clients = {
        commands: new Redis(this.url, redisOptions),
        blocking: new Redis(this.url, {
          ...redisOptions,
          lazyConnect: true,
          enableOfflineQueue: false,
          autoResendUnfulfilledCommands: false,
          maxRetriesPerRequest: 1,
          connectTimeout: 1_000,
          commandTimeout: 2_000,
          retryStrategy: () => null,
        }),
      };
      this.clients.blocking.on('error', () => {});
      this.clients.commands.on('error', (error: unknown) => this.reportPromotionError(error));
      return this.clients;
    } catch (error) {
      throw new QueueConnectionError(
        `Failed to initialize Redis queue: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /** Return durable reclaimed, dead-lettered and refused-settlement counters. */
  getMetrics(): Promise<RedisQueueMetrics> {
    return this.ensureLeases().getMetrics();
  }

  /** Return queue depths and recovery counters for health reporting. */
  getHealth(): Promise<RedisQueueHealth> {
    return this.ensureLeases().getHealth();
  }

  /** Recover a bounded page of expired claims and observe legacy orphans. */
  reclaimExpired(): Promise<number> {
    return this.ensureLeases().reclaimExpired();
  }

  /** Resolve the receipt runtime on the existing bounded claim connection. */
  private ensureLeases(): RedisLeases<T> {
    return this.leaseRuntime ??= new RedisLeases(
      this.ensureClients().blocking,
      this.queueName,
      this.explicitDeadLetterStore,
      (error) => this.reportPromotionError(error),
    );
  }

  /** Clear the independent lease-recovery timer on every listener exit path. */
  private stopLeaseProcessor(): void {
    if (this.leaseTimer) clearInterval(this.leaseTimer);
    this.leaseTimer = undefined;
  }

  /** Invoke a handler only after its unique claim has committed in Redis. */
  private async handleEncodedMessage(
    claim: RedisLease<T>,
    handler: (message: T, context: MessageContext) => Promise<void>,
    leases: RedisLeases<T> = this.ensureLeases(),
    signal?: AbortSignal,
  ): Promise<void> {
    const { envelope } = claim;
    let settled = false;
    const context: MessageContext = {
      ...createMessageContext(
        envelope.messageId,
        new Date(envelope.enqueuedAt),
        envelope.headers,
        envelope.deliveryCount,
        async () => {
          await leases.settle(claim, undefined, signal);
          settled = true;
        },
        async (options = {}) => {
          await leases.settle(claim, options, signal);
          settled = true;
        },
      ),
      extendVisibility: (milliseconds) => leases.extend(claim, milliseconds),
    };
    try {
      await handler(envelope.payload, context);
      if (!settled) await context.ack();
    } catch (error) {
      if (!settled) await context.nack({ requeue: true });
      throw error;
    }
  }

  /**
   * Start polling delayed messages into the ready queue.
   */
  private startDelayedProcessor(): void {
    if (this.delayedTimer) {
      return;
    }
    this.delayedTimer = setInterval(
      () => {
        if (this.delayedPromotion) return;
        void this.moveDueDelayedMessages().catch(() => {});
      },
      DEFAULT_DELAYED_POLL_MS,
    );
  }

  /**
   * Stop the delayed-message polling timer.
   */
  private stopDelayedProcessor(): void {
    if (!this.delayedTimer) {
      return;
    }
    clearInterval(this.delayedTimer);
    this.delayedTimer = undefined;
  }

  /**
   * Move due delayed messages from the sorted set into the ready list.
   */
  private moveDueDelayedMessages(): Promise<void> {
    // WATCH state is connection-local: overlapping polls must share this pass.
    if (!this.delayedPromotion) {
      const promotion = this.promoteDelayedBatch().catch((error: unknown) => {
        this.reportPromotionError(error);
        throw error;
      });
      const disconnected = this.promotionRuntime?.disconnected;
      const active = disconnected ? Promise.race([promotion, disconnected]) : promotion;
      const pass = active.finally(() => {
        if (this.delayedPromotion === pass) this.delayedPromotion = undefined;
      });
      this.delayedPromotion = pass;
    }
    return this.delayedPromotion;
  }

  /** Promote a bounded batch with Lua or retry the checked transaction fallback. */
  private async promoteDelayedBatch(): Promise<void> {
    const runtime = this.promotionRuntime ??= new RedisDelayedPromotion(
      this.ensurePromotionClient(),
      (error) => this.reportPromotionError(error),
    );
    for (let batch = 0; batch < DELAYED_PROMOTION_BATCHES_PER_PASS; batch++) {
      let promoted: number | null = null;
      for (let attempt = 0; attempt < DELAYED_PROMOTION_ATTEMPTS; attempt++) {
        promoted = await runtime.promote(this.delayedKey);
        if (promoted !== null) break;
        if (attempt + 1 < DELAYED_PROMOTION_ATTEMPTS) {
          await delay(1 + Math.floor(Math.random() * DELAYED_PROMOTION_JITTER_MS));
        }
      }
      if (promoted !== DELAYED_PROMOTION_BATCH_SIZE) return;
    }
  }

  /** Create the dedicated WATCH connection only when promotion first runs. */
  private ensurePromotionClient(): Redis {
    if (!this.promotionClient) {
      this.promotionClient = new Redis(this.url, {
        ...getRedisOptions(this.options),
        enableOfflineQueue: false,
      });
      this.promotionClient.on('error', (error: unknown) => this.reportPromotionError(error));
    }
    return this.promotionClient;
  }

  /** Report promotion errors without turning background or shutdown work into a rejection. */
  private reportPromotionError(error: unknown): void {
    if (!isExpectedPromotionError(error)) {
      console.error('[RedisAdapter] Background recovery failed:', error);
    }
  }

  /**
   * Redis key for ready messages.
   */
  private get queueKey(): string {
    return `netscript:queue:${this.queueName}`;
  }

  /**
   * Redis key for delayed messages.
   */
  private get delayedKey(): string {
    return `netscript:delayed:${this.queueName}`;
  }
}

function isExpectedStopError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return error.name === 'AbortError' ||
    error.message.includes('Connection is closed') ||
    error.message.includes('Connection is disconnected');
}

function isExpectedPromotionError(error: unknown): boolean {
  return isExpectedStopError(error) || error instanceof Error &&
      /enableOfflineQueue options is false|ECONNREFUSED|ECONNRESET|EPIPE|EAI_AGAIN|ENOTFOUND|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH/
        .test(error.message);
}
