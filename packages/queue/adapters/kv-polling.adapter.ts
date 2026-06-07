/**
 * KV Polling Queue Adapter
 *
 * A queue implementation built on top of regular KV operations (set, get, list, delete).
 * This adapter works with any KV backend including KV Connect, which doesn't support
 * native Deno KV queue operations (enqueue/listenQueue).
 *
 * Features:
 * - Delayed messages
 * - Retries with exponential backoff
 * - Visibility timeout
 * - Dead letter queue
 * - Priority queues
 * - Distributed consumers (atomic claiming)
 *
 * @module
 */

import { delay } from '@std/async/delay';
import { getKv, type KvKey, type WatchableKv } from '@netscript/kv';
import type { EnqueueOptions, ListenOptions, MessageContext, MessageQueue } from '../ports/mod.ts';
import { QueueError, QueueErrorCode } from '../ports/mod.ts';

export type {
  AtomicCheck,
  AtomicMutation,
  AtomicResult,
  KvEntry,
  KvKey,
  KvListOptions,
  KvSetOptions,
  KvStore,
  WatchableKv,
  WatchEvent,
  WatchOptions,
  WatchPrefixOptions,
} from '@netscript/kv';
export type { EnqueueOptions, ListenOptions, MessageContext, MessageQueue } from '../ports/mod.ts';

/**
 * Internal message structure stored in KV
 */
interface QueueMessage<T> {
  /** Unique message ID */
  id: string;
  /** Message payload */
  payload: T;
  /** Queue name */
  queue: string;
  /** When the message was enqueued */
  enqueuedAt: string;
  /** When the message becomes available (for delayed messages) */
  availableAt: string;
  /** Number of delivery attempts */
  attempts: number;
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Priority (higher = more important) */
  priority: number;
  /** Custom headers */
  headers: Record<string, string>;
  /** Deduplication ID */
  deduplicationId?: string;
  /** When the message was claimed for processing */
  claimedAt?: string;
  /** Which worker claimed the message */
  claimedBy?: string;
  /** Visibility timeout (when the claim expires) */
  visibilityTimeout?: string;
}

/**
 * Options for creating a KvPollingAdapter
 */
export interface KvPollingAdapterOptions {
  /**
   * Queue name for namespacing messages.
   * @default 'default'
   */
  queueName?: string;

  /**
   * Polling interval in milliseconds when no messages are available.
   * @default 1000
   */
  pollInterval?: number;

  /**
   * Visibility timeout in milliseconds.
   * How long a message is hidden from other consumers while being processed.
   * @default 30000 (30 seconds)
   */
  visibilityTimeout?: number;

  /**
   * Maximum number of retry attempts before sending to DLQ.
   * @default 3
   */
  maxRetries?: number;

  /**
   * Base delay for exponential backoff in milliseconds.
   * @default 1000
   */
  retryBaseDelay?: number;

  /**
   * Maximum delay for exponential backoff in milliseconds.
   * @default 300000 (5 minutes)
   */
  retryMaxDelay?: number;

  /**
   * Deduplication window in milliseconds.
   * Messages with the same deduplicationId within this window are ignored.
   * @default 300000 (5 minutes)
   */
  deduplicationWindow?: number;

  /**
   * Worker ID for distributed processing.
   * Auto-generated if not provided.
   */
  workerId?: string;

  /**
   * Enable verbose logging for debugging.
   * @default false
   */
  verbose?: boolean;

  /**
   * Explicit KV instance to use.
   * If not provided, uses the shared KV from @netscript/kv.
   */
  kv?: WatchableKv;
}

/**
 * KV key prefixes for queue data
 */
const KvPrefixes = {
  /** Pending messages ready for processing */
  pending: 'queue:pending',
  /** Messages currently being processed */
  processing: 'queue:processing',
  /** Dead letter queue for failed messages */
  dlq: 'queue:dlq',
  /** Deduplication tracking */
  dedup: 'queue:dedup',
} as const;

/**
 * KV Polling Queue Adapter
 *
 * Implements queue semantics using regular KV operations, providing
 * feature parity with Redis and RabbitMQ queues.
 *
 * @template T - Message payload type
 *
 * @example
 * ```ts
 * const queue = new KvPollingAdapter<MyMessage>({ queueName: 'jobs' });
 *
 * // Enqueue with delay
 * await queue.enqueue({ type: 'email' }, { delay: 5000 });
 *
 * // Listen for messages
 * await queue.listen(async (message, context) => {
 *   await processMessage(message);
 *   // Auto-ack on success, auto-nack on error
 * });
 * ```
 */
export class KvPollingAdapter<T = unknown> implements MessageQueue<T> {
  private kv: WatchableKv | null = null;
  private kvPromise: Promise<WatchableKv> | null = null;
  private running = false;
  private abortController?: AbortController;

  private readonly queueName: string;
  private readonly pollInterval: number;
  private readonly visibilityTimeout: number;
  private readonly maxRetries: number;
  private readonly retryBaseDelay: number;
  private readonly retryMaxDelay: number;
  private readonly deduplicationWindow: number;
  private readonly workerId: string;
  private readonly verbose: boolean;
  private readonly explicitKv?: WatchableKv;

  /**
   * This adapter handles retries manually with exponential backoff.
   */
  readonly nativeRetrial = false;

  /**
   * Create a polling KV queue adapter.
   *
   * @param options - Adapter configuration and optional caller-owned KV instance.
   */
  constructor(options: KvPollingAdapterOptions = {}) {
    this.queueName = options.queueName ?? 'default';
    this.pollInterval = options.pollInterval ?? 1000;
    this.visibilityTimeout = options.visibilityTimeout ?? 30000;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryBaseDelay = options.retryBaseDelay ?? 1000;
    this.retryMaxDelay = options.retryMaxDelay ?? 300000;
    this.deduplicationWindow = options.deduplicationWindow ?? 300000;
    this.workerId = options.workerId ?? `worker-${crypto.randomUUID().slice(0, 8)}`;
    this.verbose = options.verbose ?? false;
    this.explicitKv = options.kv;
  }

  /**
   * Ensure KV is initialized and get the instance.
   */
  private async ensureKv(): Promise<WatchableKv> {
    if (this.kv) {
      return this.kv;
    }

    if (this.kvPromise) {
      return this.kvPromise;
    }

    this.kvPromise = this.initializeKv();
    this.kv = await this.kvPromise;

    return this.kv;
  }

  /**
   * Initialize the KV connection.
   */
  private async initializeKv(): Promise<WatchableKv> {
    if (this.explicitKv) {
      this.log('Using explicit KV instance');
      return this.explicitKv;
    }

    this.log('Using shared KV instance');
    return await getKv();
  }

  /**
   * Log a message if verbose mode is enabled.
   */
  private log(message: string, ...args: unknown[]): void {
    if (this.verbose) {
      console.log(`[KvPollingAdapter:${this.queueName}] ${message}`, ...args);
    }
  }

  /**
   * Generate a unique message ID.
   */
  private generateMessageId(): string {
    return crypto.randomUUID();
  }

  /**
   * Create a KV key for a pending message.
   * Format: ['queue:pending', queueName, priority (inverted), timestamp, id]
   * Priority is inverted so higher priority sorts first.
   */
  private pendingKey(priority: number, timestamp: string, id: string): KvKey {
    // Invert priority so higher priority (100) sorts before lower (0)
    const invertedPriority = String(1000 - priority).padStart(4, '0');
    return [KvPrefixes.pending, this.queueName, invertedPriority, timestamp, id];
  }

  /**
   * Create a KV key for a processing message.
   */
  private processingKey(id: string): KvKey {
    return [KvPrefixes.processing, this.queueName, id];
  }

  /**
   * Create a KV key for a DLQ message.
   */
  private dlqKey(timestamp: string, id: string): KvKey {
    return [KvPrefixes.dlq, this.queueName, timestamp, id];
  }

  /**
   * Create a KV key for deduplication.
   */
  private dedupKey(deduplicationId: string): KvKey {
    return [KvPrefixes.dedup, this.queueName, deduplicationId];
  }

  /**
   * Enqueue a single message.
   */
  async enqueue(message: T, options?: EnqueueOptions): Promise<void> {
    try {
      const kv = await this.ensureKv();
      const now = new Date();
      const id = this.generateMessageId();

      // Handle deduplication
      if (options?.deduplicationId) {
        const dedupEntry = await kv.get<{ expiresAt: string }>(
          this.dedupKey(options.deduplicationId),
        );

        if (dedupEntry && dedupEntry.value) {
          const expiresAt = new Date(dedupEntry.value.expiresAt);
          if (expiresAt > now) {
            this.log(`Message deduplicated: ${options.deduplicationId}`);
            return; // Skip duplicate
          }
        }

        // Set deduplication marker
        await kv.set(
          this.dedupKey(options.deduplicationId),
          { expiresAt: new Date(now.getTime() + this.deduplicationWindow).toISOString() },
          { expireIn: this.deduplicationWindow },
        );
      }

      // Calculate availability time
      const availableAt = options?.delay ? new Date(now.getTime() + options.delay) : now;

      const queueMessage: QueueMessage<T> = {
        id,
        payload: message,
        queue: this.queueName,
        enqueuedAt: now.toISOString(),
        availableAt: availableAt.toISOString(),
        attempts: 0,
        maxAttempts: this.maxRetries + 1, // Initial attempt + retries
        priority: options?.priority ?? 50,
        headers: options?.headers ?? {},
        deduplicationId: options?.deduplicationId,
      };

      const key = this.pendingKey(
        queueMessage.priority,
        queueMessage.availableAt,
        id,
      );

      await kv.set(key, queueMessage);

      this.log(`Enqueued message ${id}`, {
        delay: options?.delay,
        priority: queueMessage.priority,
        availableAt: queueMessage.availableAt,
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
   * Enqueue multiple messages.
   */
  async enqueueMany(messages: T[], options?: EnqueueOptions): Promise<void> {
    // Enqueue sequentially to maintain order within same priority/delay
    for (const message of messages) {
      await this.enqueue(message, options);
    }
  }

  /**
   * Try to claim a message for processing.
   * Uses get + set pattern since KV Connect may not support atomic operations.
   */
  private async claimMessage(
    kv: WatchableKv,
    key: KvKey,
    message: QueueMessage<T>,
    versionstamp: string | null,
  ): Promise<boolean> {
    const now = new Date();
    const visibilityExpires = new Date(now.getTime() + this.visibilityTimeout);

    const claimedMessage: QueueMessage<T> = {
      ...message,
      attempts: message.attempts + 1,
      claimedAt: now.toISOString(),
      claimedBy: this.workerId,
      visibilityTimeout: visibilityExpires.toISOString(),
    };

    // Try atomic operation if available
    if (kv.atomic) {
      const result = await kv.atomic(
        [{ key, versionstamp }],
        [
          { type: 'delete', key },
          { type: 'set', key: this.processingKey(message.id), value: claimedMessage },
        ],
      );
      return result.ok;
    }

    // Fallback: non-atomic (less safe but works with all KV backends)
    // Check if message still exists
    const current = await kv.get<QueueMessage<T>>(key);
    if (!current || !current.value || current.versionstamp !== versionstamp) {
      return false; // Message was claimed by another worker
    }

    // Delete from pending and add to processing
    await kv.delete(key);
    await kv.set(this.processingKey(message.id), claimedMessage);

    return true;
  }

  /**
   * Find and claim the next available message.
   */
  private async dequeueOne(kv: WatchableKv): Promise<QueueMessage<T> | null> {
    const now = new Date();
    const prefix: KvKey = [KvPrefixes.pending, this.queueName];

    // List pending messages (sorted by priority then time)
    for await (const entry of kv.list<QueueMessage<T>>({ prefix, limit: 10 })) {
      const message = entry.value;

      // Skip if not yet available (delayed)
      if (new Date(message.availableAt) > now) {
        continue;
      }

      // Try to claim this message atomically
      const claimed = await this.claimMessage(kv, entry.key, message, entry.versionstamp);

      if (claimed) {
        this.log(`Claimed message ${message.id}`);
        return {
          ...message,
          attempts: message.attempts + 1,
          claimedAt: now.toISOString(),
          claimedBy: this.workerId,
        };
      }

      // Another worker claimed it, try next
      this.log(`Message ${message.id} claimed by another worker`);
    }

    return null;
  }

  /**
   * Acknowledge successful message processing.
   */
  private async ack(messageId: string): Promise<void> {
    const kv = await this.ensureKv();
    await kv.delete(this.processingKey(messageId));
    this.log(`Acked message ${messageId}`);
  }

  /**
   * Negative acknowledge - return message to queue or send to DLQ.
   */
  private async nack(
    message: QueueMessage<T>,
    requeue: boolean,
  ): Promise<void> {
    const kv = await this.ensureKv();
    const now = new Date();

    // Delete from processing
    await kv.delete(this.processingKey(message.id));

    if (!requeue || message.attempts >= message.maxAttempts) {
      // Send to dead letter queue
      const dlqMessage = {
        ...message,
        failedAt: now.toISOString(),
        reason: message.attempts >= message.maxAttempts
          ? 'max_attempts_exceeded'
          : 'nack_without_requeue',
      };

      await kv.set(
        this.dlqKey(now.toISOString(), message.id),
        dlqMessage,
      );

      this.log(`Message ${message.id} sent to DLQ after ${message.attempts} attempts`);
    } else {
      // Requeue with exponential backoff
      const backoffDelay = Math.min(
        this.retryBaseDelay * Math.pow(2, message.attempts - 1),
        this.retryMaxDelay,
      );

      const availableAt = new Date(now.getTime() + backoffDelay);

      const requeuedMessage: QueueMessage<T> = {
        ...message,
        availableAt: availableAt.toISOString(),
        claimedAt: undefined,
        claimedBy: undefined,
        visibilityTimeout: undefined,
      };

      await kv.set(
        this.pendingKey(message.priority, availableAt.toISOString(), message.id),
        requeuedMessage,
      );

      this.log(
        `Message ${message.id} requeued with ${backoffDelay}ms delay (attempt ${message.attempts})`,
      );
    }
  }

  /**
   * Recover messages that exceeded visibility timeout.
   * These are messages where the worker crashed or took too long.
   */
  private async recoverTimedOutMessages(kv: WatchableKv): Promise<void> {
    const now = new Date();
    const prefix: KvKey = [KvPrefixes.processing, this.queueName];

    for await (const entry of kv.list<QueueMessage<T>>({ prefix })) {
      const message = entry.value;

      if (message.visibilityTimeout && new Date(message.visibilityTimeout) < now) {
        this.log(`Recovering timed-out message ${message.id}`);
        await this.nack(message, true);
      }
    }
  }

  /**
   * Create a message context for the handler.
   */
  private createContext(message: QueueMessage<T>): MessageContext {
    return {
      messageId: message.id,
      deliveryCount: message.attempts,
      enqueuedAt: new Date(message.enqueuedAt),
      headers: message.headers,
      ack: async () => {
        await this.ack(message.id);
      },
      nack: async (options?: { requeue?: boolean }) => {
        await this.nack(message, options?.requeue ?? true);
      },
    };
  }

  /**
   * Start listening for messages and process them with the handler.
   */
  async listen(
    handler: (message: T, context: MessageContext) => Promise<void>,
    options?: ListenOptions,
  ): Promise<void> {
    if (this.running) {
      throw new QueueError(
        'Queue listener is already running',
        QueueErrorCode.CONFIGURATION_ERROR,
      );
    }

    this.running = true;
    this.abortController = new AbortController();

    const kv = await this.ensureKv();
    const concurrency = options?.concurrency ?? 1;
    const signal = options?.signal ?? this.abortController.signal;

    this.log(`Starting listener with concurrency ${concurrency}`);

    // Track active processing
    const activeProcessing = new Set<string>();

    // Recovery loop - run periodically to recover timed-out messages
    const recoveryInterval = setInterval(async () => {
      try {
        await this.recoverTimedOutMessages(kv);
      } catch (error) {
        console.error('[KvPollingAdapter] Recovery error:', error);
      }
    }, this.visibilityTimeout / 2);

    try {
      while (!signal.aborted) {
        // Wait if at concurrency limit
        while (activeProcessing.size >= concurrency && !signal.aborted) {
          await delay(100);
        }

        if (signal.aborted) break;

        // Try to get a message
        const message = await this.dequeueOne(kv);

        if (!message) {
          // No messages available, wait before polling again
          await delay(this.pollInterval);
          continue;
        }

        // Process message concurrently
        activeProcessing.add(message.id);

        (async () => {
          const context = this.createContext(message);

          try {
            await handler(message.payload, context);
            // Auto-ack on success
            await this.ack(message.id);
          } catch (error) {
            console.error(
              `[KvPollingAdapter:${this.queueName}] Handler error for message ${message.id}:`,
              error,
            );
            // Auto-nack with requeue on error
            await this.nack(message, true);
          } finally {
            activeProcessing.delete(message.id);
          }
        })();
      }
    } finally {
      clearInterval(recoveryInterval);

      // Wait for active processing to complete (with timeout)
      const timeout = this.visibilityTimeout;
      const startTime = Date.now();

      while (activeProcessing.size > 0 && Date.now() - startTime < timeout) {
        await delay(100);
      }

      this.running = false;
      this.log('Listener stopped');
    }
  }

  /**
   * Stop listening for messages gracefully.
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.log('Stopping listener...');
    this.abortController?.abort();

    // Wait for running flag to be cleared
    while (this.running) {
      await delay(100);
    }

    this.log('Listener stopped');
  }

  /**
   * Get queue statistics.
   */
  async getStats(): Promise<{
    pending: number;
    processing: number;
    dlq: number;
  }> {
    const kv = await this.ensureKv();

    let pending = 0;
    let processing = 0;
    let dlq = 0;

    for await (const _ of kv.list({ prefix: [KvPrefixes.pending, this.queueName] })) {
      pending++;
    }

    for await (const _ of kv.list({ prefix: [KvPrefixes.processing, this.queueName] })) {
      processing++;
    }

    for await (const _ of kv.list({ prefix: [KvPrefixes.dlq, this.queueName] })) {
      dlq++;
    }

    return { pending, processing, dlq };
  }

  /**
   * Purge all messages from the queue (pending, processing, and DLQ).
   * Use with caution!
   */
  async purge(): Promise<void> {
    const kv = await this.ensureKv();

    const prefixes: KvKey[] = [
      [KvPrefixes.pending, this.queueName],
      [KvPrefixes.processing, this.queueName],
      [KvPrefixes.dlq, this.queueName],
      [KvPrefixes.dedup, this.queueName],
    ];

    for (const prefix of prefixes) {
      for await (const entry of kv.list({ prefix })) {
        await kv.delete(entry.key);
      }
    }

    this.log('Queue purged');
  }

  /**
   * Reprocess messages from the dead letter queue.
   */
  async reprocessDlq(limit?: number): Promise<number> {
    const kv = await this.ensureKv();
    const now = new Date();
    let count = 0;

    for await (
      const entry of kv.list<QueueMessage<T>>({
        prefix: [KvPrefixes.dlq, this.queueName],
        limit,
      })
    ) {
      const message = entry.value;

      // Reset attempts and requeue
      const requeuedMessage: QueueMessage<T> = {
        ...message,
        attempts: 0,
        availableAt: now.toISOString(),
        claimedAt: undefined,
        claimedBy: undefined,
        visibilityTimeout: undefined,
      };

      await kv.set(
        this.pendingKey(message.priority, now.toISOString(), message.id),
        requeuedMessage,
      );

      await kv.delete(entry.key);
      count++;
    }

    this.log(`Reprocessed ${count} messages from DLQ`);
    return count;
  }
}
