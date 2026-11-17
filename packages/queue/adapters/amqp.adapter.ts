/**
 * AMQP (RabbitMQ) Queue Adapter
 *
 * Wraps Fedify's AmqpMessageQueue for NetScript integration.
 *
 * @module
 */

import { AmqpMessageQueue } from '@fedify/amqp';
// Fedify 2.4 uses this type surface; its channel operations remain supported by amqplib 2.
// @ts-types="npm:@types/amqplib@^0.10.7"
import { connect } from 'amqplib';
import { Buffer } from 'node:buffer';
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
  type MessageEnvelope,
  toDeadLetterRecord,
} from './_envelope.ts';
import { KvDeadLetterStore } from './kv-dead-letter-store.ts';

export type { EnqueueOptions, ListenOptions, MessageContext, MessageQueue } from '../ports/mod.ts';

type AmqpConnection = Awaited<ReturnType<typeof connect>>;
type AmqpChannel = Awaited<ReturnType<AmqpConnection['createChannel']>>;
type ConfirmChannel = Awaited<ReturnType<AmqpConnection['createConfirmChannel']>>;
type NativeDelivery = NonNullable<Parameters<Parameters<AmqpChannel['consume']>[1]>[0]>;

/**
 * AMQP (RabbitMQ) queue adapter implementation.
 *
 * @template T - Message payload type
 */
export class AmqpAdapter<T = unknown> implements MessageQueue<T> {
  private queue!: AmqpMessageQueue;
  private readonly connection: ReturnType<typeof connect>;
  private listening = false;
  private listenerDone?: Promise<void>;
  private stopping?: Promise<void>;
  private publisher?: Promise<ConfirmChannel>;
  private closed = false;
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
    this.connection = connect(url).then((connection) => {
      connection.on('error', () => {}); // Active operations observe their own failure boundary.
      this.queue = new AmqpMessageQueue(connection, { queue: queueName, nativeRetrial: true });
      return connection;
    }, (error: unknown) => {
      throw new QueueConnectionError(
        'Failed to connect to RabbitMQ.',
        error instanceof Error ? error : undefined,
      );
    });
    void this.connection.catch(() => {});
  }

  /**
   * Resolve the configured DLQ store or lazily create the KV-backed default.
   */
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

  /** Consume with native cancellation, keeping admitted callbacks alive through intake stop. */
  listen(
    handler: (message: T, context: MessageContext) => Promise<void>,
    options?: ListenOptions,
  ): Promise<void> {
    if (this.listening || this.closed) {
      return Promise.reject(
        new QueueError('Queue is not available for listening.', QueueErrorCode.CONFIGURATION_ERROR),
      );
    }
    const concurrency = options?.concurrency ?? 1;
    if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
      return Promise.reject(
        new QueueError(
          'concurrency must be a positive integer.',
          QueueErrorCode.CONFIGURATION_ERROR,
        ),
      );
    }
    this.listening = true;
    const controller = new AbortController();
    this.abortController = controller;
    const signal = options?.signal
      ? AbortSignal.any([options.signal, controller.signal])
      : controller.signal;
    const done = this.consume(handler, signal, concurrency).finally(() => {
      this.listening = false;
    });
    this.listenerDone = done;
    return done;
  }

  /** Stop the consumer, then close only the publisher and connection owned by this adapter. */
  stop(): Promise<void> {
    return this.stopping ??= (async () => {
      this.closed = true;
      this.abortController?.abort();
      try {
        await this.listenerDone;
      } finally {
        await (await this.connection).close();
      }
    })();
  }

  /** Own native consumer cancellation, callback joining, and channel failure. */
  private async consume(
    handler: (message: T, context: MessageContext) => Promise<void>,
    signal: AbortSignal,
    concurrency: number,
  ): Promise<void> {
    if (signal.aborted) return;
    const connection = await this.connection;
    const channel = await connection.createChannel();
    const stopped = Promise.withResolvers<void>();
    const failed = Promise.withResolvers<never>();
    void failed.promise.catch(() => {});
    const active = new Set<Promise<void>>();
    let failure: { error: unknown } | undefined;
    let closing = false;
    let usable = true;
    let tag: string | undefined;
    const onAbort = () => stopped.resolve();
    const onError = (error: unknown) => {
      failure ??= { error };
      usable = false;
      failed.reject(error);
    };
    const onClose = () => {
      usable = false;
      if (!closing) onError(new QueueConnectionError('AMQP consumer closed.'));
    };
    channel.on('error', onError);
    channel.on('close', onClose);
    connection.on('close', onClose);
    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) onAbort();
    try {
      await channel.assertQueue(this.queueName, { durable: true });
      await channel.prefetch(concurrency);
      tag = (await channel.consume(this.queueName, (message) => {
        if (!message) {
          if (!closing) onError(new QueueConnectionError('AMQP consumer cancelled.'));
          return;
        }
        if (signal.aborted) {
          if (usable) {
            try {
              channel.nack(message, false, true);
            } catch (error) {
              onError(error);
            }
          }
          return;
        }
        const task = this.deliver(message, channel, () => usable, handler)
          .catch(onError).finally(() => active.delete(task));
        active.add(task);
      }, { noAck: false })).consumerTag;
      await Promise.race([stopped.promise, failed.promise]);
    } finally {
      closing = true;
      try {
        if (tag) await channel.cancel(tag).catch(() => {});
        if (!failure) await Promise.race([Promise.allSettled([...active]), failed.promise]);
      } finally {
        usable = false;
        await channel.close().catch(() => {});
        signal.removeEventListener('abort', onAbort);
        channel.removeListener('close', onClose);
        connection.removeListener('close', onClose);
      }
    }
  }

  /** Dispatch one native receipt with exactly one terminal settlement. */
  private async deliver(
    message: NativeDelivery,
    channel: AmqpChannel,
    usable: () => boolean,
    handler: (message: T, context: MessageContext) => Promise<void>,
  ): Promise<void> {
    const raw: unknown = JSON.parse(message.content.toString('utf8'));
    const envelope = isMessageEnvelope<T>(raw) ? raw : createEnvelope(raw as T);
    const context = this.createContext(
      envelope.messageId,
      envelope.payload,
      new Date(envelope.enqueuedAt),
      envelope.headers,
      envelope.deliveryCount + 1,
      {
        ack: () => {
          if (!usable()) throw new QueueConnectionError('AMQP receipt is no longer owned.');
          channel.ack(message);
          return Promise.resolve();
        },
        requeue: async (preserve) => {
          if (!usable()) throw new QueueConnectionError('AMQP receipt is no longer owned.');
          await this.publishRetry({
            ...envelope,
            deliveryCount: preserve ? envelope.deliveryCount : envelope.deliveryCount + 1,
          });
          if (!usable()) throw new QueueConnectionError('AMQP receipt is no longer owned.');
          channel.ack(message);
        },
      },
    );
    try {
      await handler(envelope.payload, context);
      await context.ack();
    } catch {
      try {
        await context.nack({ requeue: true });
      } catch (error) {
        if (usable()) channel.nack(message, false, true);
        else throw error;
      }
    }
  }

  /** Confirm the retry before acknowledging its predecessor; uncertain outcomes are at-least-once. */
  private async publishRetry(envelope: MessageEnvelope<T>): Promise<void> {
    if (this.closed) throw new QueueConnectionError('AMQP adapter is stopped.');
    const pending = this.publisher ??= this.connection.then(async (connection) => {
      const channel = await connection.createConfirmChannel();
      channel.on('error', () => {});
      await channel.assertQueue(this.queueName, { durable: true });
      return channel;
    });
    try {
      const channel = await pending;
      await new Promise<void>((resolve, reject) => {
        channel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(envelope)), {
          persistent: true,
          contentType: 'application/json',
        }, (error: unknown) => error ? reject(error) : resolve());
      });
    } catch (error) {
      if (this.publisher === pending) this.publisher = undefined;
      await pending.then((channel) => channel.close()).catch(() => {});
      throw error;
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
    io?: Readonly<{ ack(): Promise<void>; requeue(preserve: boolean): Promise<void> }>,
  ): MessageContext {
    let settlement: Promise<void> | undefined;
    const settle = (operation: () => Promise<void>): Promise<void> =>
      settlement ??= operation().catch((error: unknown) => {
        settlement = undefined;
        throw error;
      });
    return createMessageContext(
      messageId,
      enqueuedAt,
      headers,
      deliveryCount,
      () => settle(() => io?.ack() ?? Promise.resolve()),
      (options: NackOptions = {}) =>
        settle(async () => {
          if (options.requeue ?? true) {
            await io?.requeue(options.preserveDeliveryCount === true);
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
          await io?.ack();
        }),
    );
  }
}
