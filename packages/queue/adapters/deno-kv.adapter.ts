/**
 * Deno KV Queue Adapter
 *
 * Wraps Fedify's DenoKvMessageQueue for NetScript integration.
 *
 * @module
 */

import { DenoKvMessageQueue } from '@fedify/denokv';
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
 * Options for creating a DenoKvAdapter.
 */
export interface DenoKvAdapterOptions {
  /**
   * Queue name used for diagnostics and message metadata.
   */
  queueName?: string;
  /**
   * Whether to discover a shared KV instance from the environment before opening the default KV.
   */
  useShared?: boolean;
  /**
   * Explicit KV instance for tests or caller-owned lifecycle management.
   */
  kv?: Deno.Kv;
  /**
   * Enables adapter debug hooks without emitting console output from published code.
   */
  verbose?: boolean;
  /**
   * Optional dead-letter store. Defaults to a KV-backed store using this adapter's KV instance.
   */
  deadLetterStore?: DeadLetterStorePort;
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
  private readonly explicitDeadLetterStore?: DeadLetterStorePort<T>;
  private deadLetterStore: DeadLetterStorePort<T> | null = null;

  /**
   * Deno KV provides native retry support through Fedify's queue implementation.
   */
  readonly nativeRetrial = true;

  /**
   * Create a Deno KV queue adapter.
   *
   * @param options - Adapter configuration and optional caller-owned KV instance.
   */
  constructor(options: DenoKvAdapterOptions = {}) {
    this.queueName = options.queueName ?? 'default';
    this.useShared = options.useShared ?? true;
    this.explicitKv = options.kv;
    this.verbose = options.verbose ?? false;
    this.explicitDeadLetterStore = options.deadLetterStore as DeadLetterStorePort<T> | undefined;
  }

  /**
   * Create an adapter around a caller-owned KV instance.
   *
   * @param kv - KV instance whose lifecycle is owned by the caller.
   * @param queueName - Queue name used for diagnostics and message metadata.
   * @returns Adapter bound to the provided KV instance.
   */
  static withKv<T>(kv: Deno.Kv, queueName = 'default'): DenoKvAdapter<T> {
    return new DenoKvAdapter<T>({ kv, queueName });
  }

  /**
   * Return the initialized KV instance, creating it on first use.
   */
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

  /**
   * Open the explicit, discovered, or default Deno KV connection.
   */
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

  private async ensureDeadLetterStore(): Promise<DeadLetterStorePort<T>> {
    if (this.deadLetterStore) {
      return this.deadLetterStore;
    }
    if (this.explicitDeadLetterStore) {
      this.deadLetterStore = this.explicitDeadLetterStore;
      return this.deadLetterStore;
    }
    this.deadLetterStore = new KvDeadLetterStore<T>({
      queueName: this.queueName,
      denoKv: await this.ensureKv(),
    });
    return this.deadLetterStore;
  }

  /**
   * Reserved debug hook for verbose mode.
   */
  private log(_message: string, ..._args: unknown[]): void {
    if (!this.verbose) {
      return;
    }
  }

  /**
   * Enqueue one message for later processing.
   *
   * @param message - Message payload to enqueue.
   * @param options - Optional delay and metadata settings.
   */
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

  /**
   * Enqueue messages sequentially using the same options.
   *
   * @param messages - Message payloads to enqueue.
   * @param options - Optional delay and metadata settings applied to each message.
   */
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

  /**
   * Listen for queued messages until stopped or aborted.
   *
   * @param handler - Async callback invoked for each message.
   * @param options - Listener concurrency and cancellation options.
   */
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

        const context = this.createContext(messageId, payload, enqueuedAt, headers, deliveryCount);
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

  /**
   * Stop the active listener and wait briefly for Fedify to observe cancellation.
   */
  async stop(): Promise<void> {
    if (!this.listening) {
      return;
    }

    this.abortController?.abort();
    this.listening = false;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Return the initialized KV instance for advanced inspection.
   *
   * @returns The Deno KV instance used by this adapter.
   */
  getKv(): Promise<Deno.Kv> {
    return this.ensureKv();
  }

  /**
   * Whether the adapter currently has an active listener.
   */
  get isListening(): boolean {
    return this.listening;
  }

  /**
   * Build the queue context passed to message handlers.
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
        const store = await this.ensureDeadLetterStore();
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
