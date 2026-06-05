/**
 * Redis Queue Adapter
 *
 * Wraps Fedify's RedisMessageQueue for NetScript integration.
 *
 * @module
 */

import { RedisMessageQueue } from '@fedify/redis';
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
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    connectTimeout: 10000,
    keepAlive: 30000,
    lazyConnect: false,
  };
}

/**
 * Redis queue adapter implementation.
 *
 * @template T - Message payload type
 */
export class RedisAdapter<T = unknown> implements MessageQueue<T> {
  private readonly queue: RedisMessageQueue;
  private listening = false;
  private abortController?: AbortController;

  readonly nativeRetrial = true;

  constructor(
    private readonly url: string,
    private readonly queueName = 'default',
    private readonly options?: Record<string, unknown>,
  ) {
    try {
      const redisOptions = getRedisOptions(options);
      const createRedis = () => new Redis(url, redisOptions);
      this.queue = new RedisMessageQueue(createRedis, {
        queueKey: `netscript:queue:${this.queueName}`,
        channelKey: `netscript:channel:${this.queueName}`,
        workerId: crypto.randomUUID(),
      });
    } catch (error) {
      throw new QueueConnectionError(
        `Failed to initialize Redis queue: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async enqueue(message: T, options?: EnqueueOptions): Promise<void> {
    try {
      const envelope = createEnvelope(message, options);
      await this.queue.enqueue(envelope, {
        delay: options?.delay ? Temporal.Duration.from({ milliseconds: options.delay }) : undefined,
      });
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

    const signal = options?.signal;
    if (signal) {
      signal.addEventListener('abort', () => {
        this.abortController?.abort();
      });
    }

    try {
      await this.queue.listen(async (rawMessage) => {
        let payload: T;
        let headers: Record<string, string> = {};
        let messageId: string;
        let enqueuedAt: Date;
        let deliveryCount: number;

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

        await handler(
          payload,
          this.createContext(messageId, enqueuedAt, headers, deliveryCount),
        );
      }, { signal: this.abortController.signal });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
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
      this.listening = false;
    }
  }

  async stop(): Promise<void> {
    if (!this.listening) {
      return;
    }

    this.abortController?.abort();
    this.listening = false;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private createContext(
    messageId: string,
    enqueuedAt: Date,
    headers: Record<string, string>,
    deliveryCount: number,
  ): MessageContext {
    return createMessageContext(
      messageId,
      enqueuedAt,
      headers,
      deliveryCount,
      async () => {},
      async () => {},
    );
  }
}
