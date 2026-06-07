/**
 * Deno KV Queue Adapter
 *
 * Wraps Fedify's DenoKvMessageQueue for NetScript integration.
 *
 * @module
 */

import { DenoKvMessageQueue } from '@fedify/denokv';
import type { EnqueueOptions, ListenOptions, MessageContext, MessageQueue } from '../ports/mod.ts';
import { QueueConnectionError, QueueError, QueueErrorCode } from '../ports/mod.ts';
import { createEnvelope, createMessageContext, isMessageEnvelope } from './_envelope.ts';

/**
 * Options for creating a DenoKvAdapter.
 */
export interface DenoKvAdapterOptions {
  queueName?: string;
  useShared?: boolean;
  kv?: Deno.Kv;
  verbose?: boolean;
}

function getKvConnectionFromAspire(): string | undefined {
  return Deno.env.get('services__kv__http__0') ??
    Deno.env.get('KV_URL') ??
    Deno.env.get('DENO_KV_URL') ??
    Deno.env.get('services__kv__sqlite__0');
}

/**
 * Deno KV queue adapter implementation.
 *
 * @template T - Message payload type
 */
export class DenoKvAdapter<T = unknown> implements MessageQueue<T> {
  private queue!: DenoKvMessageQueue;
  private kvInstance: Deno.Kv | null = null;
  private kvPromise: Promise<Deno.Kv> | null = null;
  private listening = false;
  private abortController?: AbortController;
  private readonly queueName: string;
  private readonly useShared: boolean;
  private readonly explicitKv?: Deno.Kv;
  private readonly verbose: boolean;

  readonly nativeRetrial = true;

  constructor(options: DenoKvAdapterOptions = {}) {
    this.queueName = options.queueName ?? 'default';
    this.useShared = options.useShared ?? true;
    this.explicitKv = options.kv;
    this.verbose = options.verbose ?? false;
  }

  static withKv<T>(kv: Deno.Kv, queueName = 'default'): DenoKvAdapter<T> {
    return new DenoKvAdapter<T>({ kv, queueName });
  }

  private async ensureKv(): Promise<Deno.Kv> {
    if (this.kvInstance) {
      return this.kvInstance;
    }

    if (!this.kvPromise) {
      this.kvPromise = this.initializeKv();
    }

    this.kvInstance = await this.kvPromise;
    this.queue = new DenoKvMessageQueue(this.kvInstance);
    return this.kvInstance;
  }

  private async initializeKv(): Promise<Deno.Kv> {
    try {
      if (this.explicitKv) {
        return this.explicitKv;
      }

      if (this.useShared) {
        const kvPath = getKvConnectionFromAspire();
        if (kvPath) {
          return await Deno.openKv(kvPath);
        }
      }

      return await Deno.openKv();
    } catch (error) {
      throw new QueueConnectionError(
        `Failed to initialize Deno KV queue: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  private log(_message: string, ..._args: unknown[]): void {
    if (!this.verbose) {
      return;
    }
  }

  async enqueue(message: T, options?: EnqueueOptions): Promise<void> {
    try {
      await this.ensureKv();
      const envelope = createEnvelope(message, options);
      this.queue.enqueue(envelope, {
        delay: options?.delay ? Temporal.Duration.from({ milliseconds: options.delay }) : undefined,
      });
    } catch (error) {
      throw new QueueError(
        `Failed to enqueue message: ${error instanceof Error ? error.message : String(error)}`,
        QueueErrorCode.ENQUEUE_FAILED,
        {
          cause: error instanceof Error ? error : undefined,
          context: { queueName: this.queueName },
        },
      );
    }
  }

  async enqueueMany(messages: T[], options?: EnqueueOptions): Promise<void> {
    try {
      await this.ensureKv();
      for (const message of messages) {
        await this.enqueue(message, options);
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
    await this.ensureKv();

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

        const context = this.createContext(messageId, enqueuedAt, headers, deliveryCount);
        await handler(payload, context);
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
      this.log('stopped');
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

  getKv(): Promise<Deno.Kv> {
    return this.ensureKv();
  }

  get isListening(): boolean {
    return this.listening;
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
