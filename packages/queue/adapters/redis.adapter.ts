/**
 * Redis Queue Adapter
 *
 * Uses Redis LIST operations for NetScript queue integration.
 *
 * @module
 */

import { Redis } from 'ioredis';
import type {
  EnqueueOptions,
  ListenOptions,
  MessageContext,
  MessageQueue,
} from '../interfaces/mod.ts';
import { QueueConnectionError, QueueError, QueueErrorCode } from '../interfaces/mod.ts';
import { createEnvelope, createMessageContext, isMessageEnvelope } from './_envelope.ts';

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

const DEFAULT_BLOCK_TIMEOUT_SECONDS = 1;
const DEFAULT_DELAYED_POLL_MS = 1_000;

interface RedisQueueClients {
  readonly commands: Redis;
  readonly blocking: Redis;
}

interface DelayedQueueEntry {
  readonly queueKey: string;
  readonly envelope: string;
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
  private delayedTimer?: ReturnType<typeof setInterval>;

  readonly nativeRetrial = true;

  constructor(
    private readonly url: string,
    private readonly queueName = 'default',
    private readonly options: Record<string, unknown> | undefined = undefined,
  ) {
  }

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

  async listen(
    handler: (message: T, context: MessageContext) => Promise<void>,
    options?: ListenOptions,
  ): Promise<void> {
    if (this.listening) {
      throw new QueueError('Queue is already listening', QueueErrorCode.CONFIGURATION_ERROR);
    }

    this.listening = true;
    this.abortController = new AbortController();
    const clients = this.ensureClients();
    this.startDelayedProcessor();

    const signal = options?.signal;
    if (signal) {
      signal.addEventListener('abort', () => {
        this.abortController?.abort();
        this.clients?.blocking.disconnect();
      });
    }

    try {
      while (!this.abortController.signal.aborted) {
        const encoded = await clients.blocking.brpoplpush(
          this.queueKey,
          this.processingKey,
          DEFAULT_BLOCK_TIMEOUT_SECONDS,
        );
        if (!encoded) {
          continue;
        }

        await this.handleEncodedMessage(encoded, handler);
      }
    } catch (error) {
      if (this.abortController.signal.aborted || isExpectedStopError(error)) {
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
      this.stopDelayedProcessor();
      this.listening = false;
    }
  }

  async stop(): Promise<void> {
    if (!this.listening) {
      return;
    }

    this.abortController?.abort();
    this.listening = false;
    this.stopDelayedProcessor();
    this.clients?.blocking.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private ensureClients(): RedisQueueClients {
    if (this.clients) {
      return this.clients;
    }

    try {
      const redisOptions = getRedisOptions(this.options);
      this.clients = {
        commands: new Redis(this.url, redisOptions),
        blocking: new Redis(this.url, redisOptions),
      };
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

  private async handleEncodedMessage(
    encoded: string,
    handler: (message: T, context: MessageContext) => Promise<void>,
  ): Promise<void> {
    let payload: T;
    let headers: Record<string, string> = {};
    let messageId: string;
    let enqueuedAt: Date;
    let deliveryCount: number;

    const rawMessage = JSON.parse(encoded) as unknown;
    if (isMessageEnvelope<T>(rawMessage)) {
      payload = rawMessage.payload;
      headers = rawMessage.headers;
      messageId = rawMessage.messageId;
      enqueuedAt = new Date(rawMessage.enqueuedAt);
      deliveryCount = rawMessage.deliveryCount + 1;
    } else {
      payload = rawMessage as T;
      messageId = crypto.randomUUID();
      enqueuedAt = new Date();
      deliveryCount = 1;
    }

    let settled = false;
    const context = this.createContext(
      messageId,
      enqueuedAt,
      headers,
      deliveryCount,
      encoded,
      () => settled = true,
    );

    try {
      await handler(payload, context);
      if (!settled) {
        await context.ack();
      }
    } catch (error) {
      if (!settled) {
        await context.nack({ requeue: true });
      }
      throw error;
    }
  }

  private startDelayedProcessor(): void {
    if (this.delayedTimer) {
      return;
    }
    this.delayedTimer = setInterval(
      () => void this.moveDueDelayedMessages(),
      DEFAULT_DELAYED_POLL_MS,
    );
  }

  private stopDelayedProcessor(): void {
    if (!this.delayedTimer) {
      return;
    }
    clearInterval(this.delayedTimer);
    this.delayedTimer = undefined;
  }

  private async moveDueDelayedMessages(): Promise<void> {
    const clients = this.ensureClients();
    const entries = await clients.commands.zrangebyscore(this.delayedKey, '-inf', Date.now());
    for (const entry of entries) {
      const parsed = JSON.parse(entry) as DelayedQueueEntry;
      await clients.commands.lpush(parsed.queueKey, parsed.envelope);
      await clients.commands.zrem(this.delayedKey, entry);
    }
  }

  private createContext(
    messageId: string,
    enqueuedAt: Date,
    headers: Record<string, string>,
    deliveryCount: number,
    encoded: string,
    markSettled: () => void,
  ): MessageContext {
    return createMessageContext(
      messageId,
      enqueuedAt,
      headers,
      deliveryCount,
      async () => {
        await this.ensureClients().commands.lrem(this.processingKey, 1, encoded);
        markSettled();
      },
      async (options) => {
        await this.ensureClients().commands.lrem(this.processingKey, 1, encoded);
        if (options?.requeue ?? true) {
          await this.ensureClients().commands.lpush(this.queueKey, encoded);
        }
        markSettled();
      },
    );
  }

  private get queueKey(): string {
    return `netscript:queue:${this.queueName}`;
  }

  private get processingKey(): string {
    return `netscript:processing:${this.queueName}`;
  }

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
