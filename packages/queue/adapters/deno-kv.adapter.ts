/**
 * Deno KV Queue Adapter
 *
 * Wraps Fedify's DenoKvMessageQueue for NetScript integration.
 *
 * @module
 */

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
  type MessageEnvelope,
  toDeadLetterRecord,
} from './_envelope.ts';
import {
  acquireKvQueueDispatcher,
  type KvDatabaseTarget,
  type KvQueueDispatcher,
  type KvQueueDispatcherLease,
} from './_kv-queue/dispatcher.ts';
import { KvDeadLetterStore } from './kv-dead-letter-store.ts';

export type { EnqueueOptions, ListenOptions, MessageContext, MessageQueue } from '../ports/mod.ts';

/**
 * Options for creating a DenoKvAdapter.
 */
export interface DenoKvAdapterOptions {
  /**
   * Queue name. Envelopes carry it, and only listeners for the same name receive them.
   */
  queueName?: string;
  /**
   * Deno KV path or URL to open when no explicit `kv` is given. Takes precedence over
   * environment discovery.
   */
  path?: string;
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
 * Deno KV has one queue per database. Every adapter on the same database in a process shares one
 * listen loop that routes each message to the listener for the message's queue name, so named
 * queues on one database never consume each other's messages. A message whose queue name has no
 * listener in the receiving process is re-enqueued a bounded number of times, then dead-lettered
 * with reason `unroutable`; while no listener is registered at all, messages stay queued. Listen to
 * every queue of one local database from one process: a local database wakes other processes only
 * on a periodic poll. `stop()` waits for this adapter's in-flight handlers.
 *
 * @template T - Message payload type
 */
export class DenoKvAdapter<T = unknown> implements MessageQueue<T> {
  private lease: KvQueueDispatcherLease | null = null;
  private activeListener:
    | { readonly controller: AbortController; readonly done: Promise<void> }
    | null = null;
  private readonly queueName: string;
  private readonly path?: string;
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
    this.path = options.path;
    this.useShared = options.useShared ?? true;
    this.explicitKv = options.kv;
    this.verbose = options.verbose ?? false;
    this.explicitDeadLetterStore = options.deadLetterStore as DeadLetterStorePort<T> | undefined;
  }

  /**
   * Create an adapter around a caller-owned KV instance.
   *
   * The queue never closes the instance. Deno KV stops a queue listener only by closing its
   * connection, so once an adapter on it has listened, its queue stays consumed until the caller
   * closes it; messages that arrive while no adapter listens are held by delayed re-enqueue.
   *
   * @param kv - KV instance whose lifecycle is owned by the caller.
   * @param queueName - Queue name used for routing, diagnostics, and message metadata.
   * @returns Adapter bound to the provided KV instance.
   */
  static withKv<T>(kv: Deno.Kv, queueName = 'default'): DenoKvAdapter<T> {
    return new DenoKvAdapter<T>({ kv, queueName });
  }

  /**
   * Claim the shared dispatcher for this adapter's database and open its connection.
   */
  private async ensureDispatcher(): Promise<KvQueueDispatcher> {
    this.lease ??= acquireKvQueueDispatcher(this.resolveTarget());
    const lease = this.lease;
    try {
      await lease.dispatcher.kv();
      return lease.dispatcher;
    } catch (error) {
      if (this.lease === lease) {
        this.lease = null;
      }
      await lease.release();
      throw new QueueConnectionError(
        `Failed to initialize Deno KV queue: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Identify the database: the explicit instance, the configured path, or the discovered one.
   */
  private resolveTarget(): KvDatabaseTarget {
    if (this.explicitKv) {
      return { kv: this.explicitKv };
    }
    return { path: this.path ?? (this.useShared ? getKvConnectionFromAspire() : undefined) };
  }

  /**
   * Resolve the configured DLQ store or lazily create the KV-backed default.
   */
  private async ensureDeadLetterStore(): Promise<DeadLetterStorePort<T>> {
    if (this.deadLetterStore) {
      return this.deadLetterStore;
    }
    if (this.explicitDeadLetterStore) {
      this.deadLetterStore = this.explicitDeadLetterStore;
      return this.deadLetterStore;
    }
    const dispatcher = await this.ensureDispatcher();
    this.deadLetterStore = new KvDeadLetterStore<T>({
      queueName: this.queueName,
      denoKv: await dispatcher.kv(),
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
      const dispatcher = await this.ensureDispatcher();
      await dispatcher.enqueue(createEnvelope(message, options, this.queueName), options?.delay);
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
      await this.ensureDispatcher();
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
   * Listen for messages addressed to this queue name until stopped or aborted.
   *
   * @param handler - Async callback invoked for each message.
   * @param options - Listener concurrency and cancellation options.
   */
  async listen(
    handler: (message: T, context: MessageContext) => Promise<void>,
    options?: ListenOptions,
  ): Promise<void> {
    const dispatcher = await this.ensureDispatcher();

    if (this.activeListener) {
      throw new QueueError('Queue is already listening', QueueErrorCode.CONFIGURATION_ERROR);
    }

    const controller = new AbortController();
    const signal = options?.signal;
    const stopListening = () => controller.abort();
    signal?.addEventListener('abort', stopListening, { once: true });
    if (signal?.aborted) {
      controller.abort();
    }
    const done = dispatcher.listen(
      this.queueName,
      (envelope) => this.deliver(envelope, handler),
      controller.signal,
    );
    const listener = { controller, done };
    this.activeListener = listener;

    try {
      await done;
    } catch (error) {
      throw new QueueError(
        `Queue listener failed: ${error instanceof Error ? error.message : String(error)}`,
        QueueErrorCode.DEQUEUE_FAILED,
        {
          cause: error instanceof Error ? error : undefined,
          context: { queueName: this.queueName },
        },
      );
    } finally {
      signal?.removeEventListener('abort', stopListening);
      if (this.activeListener === listener) {
        this.activeListener = null;
      }
      this.log('stopped');
    }
  }

  /**
   * Stop the active listener, wait for its in-flight handlers to finish, and release this
   * adapter's claim on the shared database connection.
   */
  async stop(): Promise<void> {
    const listener = this.activeListener;
    this.activeListener = null;
    if (listener) {
      listener.controller.abort();
      await listener.done.catch(() => undefined);
    }
    const lease = this.lease;
    this.lease = null;
    if (!this.explicitDeadLetterStore) {
      this.deadLetterStore = null;
    }
    await lease?.release();
  }

  /**
   * Return the initialized KV instance for advanced inspection.
   *
   * @returns The Deno KV instance used by this adapter.
   */
  async getKv(): Promise<Deno.Kv> {
    const dispatcher = await this.ensureDispatcher();
    return dispatcher.kv();
  }

  /**
   * Whether the adapter currently has an active listener.
   */
  get isListening(): boolean {
    return this.activeListener !== null;
  }

  /**
   * Hand one routed envelope to the caller's handler.
   */
  private async deliver(
    envelope: MessageEnvelope<unknown>,
    handler: (message: T, context: MessageContext) => Promise<void>,
  ): Promise<void> {
    const payload = envelope.payload as T;
    const context = this.createContext(
      envelope.messageId,
      payload,
      new Date(envelope.enqueuedAt),
      envelope.headers,
      envelope.deliveryCount + 1,
    );
    await handler(payload, context);
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
