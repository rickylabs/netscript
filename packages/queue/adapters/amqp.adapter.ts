/**
 * AMQP (RabbitMQ) Queue Adapter
 *
 * Wraps Fedify's AmqpMessageQueue for NetScript integration.
 *
 * @module
 */

import { AmqpMessageQueue } from '@fedify/amqp';
import { connect } from 'npm:amqplib@^0.10.3';
import type {
  DeadLetterStorePort,
  EnqueueOptions,
  ListenOptions,
  MessageContext,
  MessageQueue,
  NackOptions,
} from '../ports/mod.ts';
import { QueueConnectionError, QueueError, QueueErrorCode } from '../ports/mod.ts';
import {
  createEnvelope,
  createMessageContext,
  isMessageEnvelope,
  toDeadLetterRecord,
} from './_envelope.ts';
import { KvDeadLetterStore } from './kv-dead-letter-store.ts';

export type { EnqueueOptions, ListenOptions, MessageContext, MessageQueue } from '../ports/mod.ts';

/**
 * AMQP (RabbitMQ) queue adapter implementation.
 *
 * @template T - Message payload type
 */
export class AmqpAdapter<T = unknown> implements MessageQueue<T> {
  private queue!: AmqpMessageQueue;
  private readonly connection: Promise<unknown>;
  private listening = false;
  private abortController?: AbortController;
  private deadLetterStore: DeadLetterStorePort<T> | null = null;
  private readonly explicitDeadLetterStore?: DeadLetterStorePort<T>;

  /**
   * RabbitMQ supports native redelivery through broker acknowledgements.
   */
  readonly nativeRetrial = true;

  /**
   * Create an AMQP queue adapter.
   *
   * @param url - RabbitMQ AMQP connection URL.
   * @param queueName - Queue name used by the broker.
   */
  constructor(
    private readonly url: string,
    private readonly queueName = 'default',
    explicitDeadLetterStore?: DeadLetterStorePort<T>,
  ) {
    this.explicitDeadLetterStore = explicitDeadLetterStore;
    try {
      this.connection = connect(url);
      this.connection.then((connection) => {
        this.queue = new AmqpMessageQueue(connection as never);
      }).catch((error) => {
        throw new QueueConnectionError(
          `Failed to connect to RabbitMQ: ${
            error instanceof Error ? error.message : String(error)
          }`,
          error instanceof Error ? error : undefined,
        );
      });
    } catch (error) {
      throw new QueueConnectionError(
        `Failed to initialize AMQP queue: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  private ensureDeadLetterStore(): DeadLetterStorePort<T> {
    if (this.deadLetterStore) {
      return this.deadLetterStore;
    }
    if (this.explicitDeadLetterStore) {
      this.deadLetterStore = this.explicitDeadLetterStore;
      return this.deadLetterStore;
    }
    this.deadLetterStore = new KvDeadLetterStore<T>({ queueName: this.queueName });
    return this.deadLetterStore;
  }

  /**
   * Enqueue one message through the AMQP queue.
   *
   * @param message - Message payload to enqueue.
   * @param options - Optional delay and metadata settings.
   */
  async enqueue(message: T, options?: EnqueueOptions): Promise<void> {
    try {
      await this.connection;
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

  /**
   * Enqueue messages concurrently through the AMQP queue.
   *
   * @param messages - Message payloads to enqueue.
   * @param options - Optional delay and metadata settings applied to each message.
   */
  async enqueueMany(messages: T[], options?: EnqueueOptions): Promise<void> {
    try {
      await this.connection;
      await Promise.all(messages.map((message) => this.enqueue(message, options)));
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
   * Listen for AMQP messages until stopped or aborted.
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

    this.listening = true;
    this.abortController = new AbortController();

    const signal = options?.signal;
    if (signal) {
      signal.addEventListener('abort', () => {
        this.abortController?.abort();
      });
    }

    try {
      await this.connection;
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
          this.createContext(messageId, payload, enqueuedAt, headers, deliveryCount),
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

  /**
   * Stop listening and close the AMQP connection when possible.
   */
  async stop(): Promise<void> {
    if (!this.listening) {
      return;
    }

    this.abortController?.abort();
    this.listening = false;
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const connection = await this.connection;
      if (
        connection && typeof (connection as { close?: () => Promise<void> }).close === 'function'
      ) {
        await (connection as { close: () => Promise<void> }).close();
      }
    } catch {
      // Ignore shutdown errors.
    }
  }

  /**
   * Build the queue context passed to AMQP message handlers.
   */
  private createContext(
    messageId: string,
    payload: T,
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
      async (options: NackOptions = {}) => {
        if (options.requeue ?? true) {
          return;
        }
        const store = this.ensureDeadLetterStore();
        await store.append(toDeadLetterRecord(
          {
            messageId,
            queueName: this.queueName,
            payload,
            headers,
            deliveryCount,
            enqueuedAt,
          },
          options.reason ?? 'nack_without_requeue',
          options,
        ));
      },
    );
  }
}
