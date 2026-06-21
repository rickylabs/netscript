/**
 * In-memory queue adapter for tests and examples.
 *
 * @module
 */

import type { EnqueueOptions, ListenOptions, MessageContext, MessageQueue } from '../ports/mod.ts';
import type { DeadLetterRecord, DeadLetterStorePort } from '../ports/dead-letter.ts';
import { toDeadLetterRecord } from '../adapters/_envelope.ts';

export type { EnqueueOptions, ListenOptions, MessageContext, MessageQueue } from '../ports/mod.ts';

type MemoryQueueItem<T> = {
  readonly id: string;
  readonly message: T;
  readonly enqueuedAt: Date;
  availableAt: number;
  readonly headers: Record<string, string>;
  deliveryCount: number;
  settled: boolean;
};

/**
 * Options for {@link MemoryQueueAdapter}.
 */
export interface MemoryQueueAdapterOptions {
  /**
   * Delay in milliseconds between empty queue polls while listening.
   */
  pollInterval?: number;

  /**
   * Optional store for terminal nacks.
   */
  deadLetterStore?: DeadLetterStorePort;
}

/**
 * In-memory dead-letter store for queue contract tests.
 *
 * @template T - Original message payload type.
 */
export class MemoryDeadLetterStore<T = unknown> implements DeadLetterStorePort<T> {
  private readonly records: DeadLetterRecord<T>[] = [];

  /**
   * Append a dead-letter record.
   *
   * @param record - Record to append.
   */
  append(record: DeadLetterRecord<T>): Promise<void> {
    this.records.push(record);
    return Promise.resolve();
  }

  /**
   * List stored records.
   *
   * @param options - Optional maximum number of records.
   * @returns Stored records.
   */
  list(options: { limit?: number } = {}): Promise<DeadLetterRecord<T>[]> {
    return Promise.resolve(this.records.slice(0, options.limit));
  }

  /**
   * Re-enqueue records and remove successfully re-enqueued entries.
   *
   * @param reenqueue - Callback that requeues a record.
   * @param options - Optional maximum number of records.
   * @returns Number of records reprocessed.
   */
  async reprocess(
    reenqueue: (record: DeadLetterRecord<T>) => Promise<void>,
    options: { limit?: number } = {},
  ): Promise<number> {
    const selected = this.records.slice(0, options.limit);
    for (const record of selected) {
      await reenqueue(record);
    }
    this.records.splice(0, selected.length);
    return selected.length;
  }

  /**
   * Count stored records.
   *
   * @returns Number of stored records.
   */
  depth(): Promise<number> {
    return Promise.resolve(this.records.length);
  }
}

/**
 * In-memory implementation of {@link MessageQueue} for port-contract tests.
 *
 * @template T - Message payload type.
 */
export class MemoryQueueAdapter<T = unknown> implements MessageQueue<T> {
  /**
   * The memory adapter retries messages in-process rather than through backend-native delivery.
   */
  readonly nativeRetrial = false;

  private readonly pending: MemoryQueueItem<T>[] = [];
  private readonly pendingItems = new Set<MemoryQueueItem<T>>();
  private readonly pollInterval: number;
  private readonly deadLetterStore: DeadLetterStorePort<T>;
  private listening = false;
  private abortController?: AbortController;

  /**
   * Create an in-memory queue adapter.
   *
   * @param options - Optional polling configuration.
   */
  constructor(options: MemoryQueueAdapterOptions = {}) {
    this.pollInterval = options.pollInterval ?? 5;
    this.deadLetterStore = options.deadLetterStore as DeadLetterStorePort<T> | undefined ??
      new MemoryDeadLetterStore<T>();
  }

  /**
   * Enqueue one message in memory.
   *
   * @param message - Message payload to enqueue.
   * @param options - Optional delay and metadata settings.
   */
  enqueue(message: T, options: EnqueueOptions = {}): Promise<void> {
    const item = {
      id: crypto.randomUUID(),
      message,
      enqueuedAt: new Date(),
      availableAt: Date.now() + (options.delay ?? 0),
      headers: options.headers ?? {},
      deliveryCount: 0,
      settled: false,
    };
    this.pending.push(item);
    this.pendingItems.add(item);
    this.sortPending();
    return Promise.resolve();
  }

  /**
   * Enqueue messages sequentially using the same options.
   *
   * @param messages - Message payloads to enqueue.
   * @param options - Optional delay and metadata settings applied to each message.
   */
  async enqueueMany(messages: T[], options?: EnqueueOptions): Promise<void> {
    for (const message of messages) {
      await this.enqueue(message, options);
    }
  }

  /**
   * Listen for memory messages until stopped or aborted.
   *
   * @param handler - Async callback invoked for each message.
   * @param options - Listener cancellation options.
   */
  async listen(
    handler: (message: T, context: MessageContext) => Promise<void>,
    options: ListenOptions = {},
  ): Promise<void> {
    if (this.listening) {
      throw new Error('Memory queue is already listening');
    }

    this.listening = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    const externalSignal = options.signal;
    const onAbort = (): void => this.abortController?.abort();
    if (externalSignal?.aborted) {
      this.abortController.abort();
    } else {
      externalSignal?.addEventListener('abort', onAbort, { once: true });
    }

    try {
      while (!signal.aborted) {
        const item = this.takeAvailable();
        if (!item) {
          await wait(this.pollInterval, signal);
          continue;
        }

        await this.processItem(item, handler);
      }
    } finally {
      externalSignal?.removeEventListener('abort', onAbort);
      this.listening = false;
    }
  }

  /**
   * Stop the active memory listener.
   */
  stop(): Promise<void> {
    this.abortController?.abort();
    this.listening = false;
    return Promise.resolve();
  }

  /**
   * Return and remove all pending messages.
   *
   * @returns Pending message payloads in delivery order.
   */
  drain(): T[] {
    const drained = this.pending.splice(0, this.pending.length);
    this.pendingItems.clear();
    return drained.map((item) => item.message);
  }

  /**
   * Deliver one queued item and apply default settlement behavior.
   */
  private async processItem(
    item: MemoryQueueItem<T>,
    handler: (message: T, context: MessageContext) => Promise<void>,
  ): Promise<void> {
    item.deliveryCount++;
    const context = this.createContext(item);

    try {
      await handler(item.message, context);
      const wasRequeued = this.isPending(item);
      if (!item.settled && !wasRequeued) {
        item.settled = true;
      }
    } catch (error) {
      const wasRequeued = this.isPending(item);
      if (!item.settled && !wasRequeued) {
        this.requeue(item);
      }
      throw error;
    }
  }

  /**
   * Build the message context passed to memory queue handlers.
   */
  private createContext(item: MemoryQueueItem<T>): MessageContext {
    return {
      messageId: item.id,
      deliveryCount: item.deliveryCount,
      enqueuedAt: item.enqueuedAt,
      headers: item.headers,
      ack: () => {
        item.settled = true;
        return Promise.resolve();
      },
      nack: async (options = {}) => {
        item.settled = true;
        if (options.requeue ?? true) {
          this.requeue(item);
        }
        if (!(options.requeue ?? true)) {
          await this.deadLetterStore.append(toDeadLetterRecord(
            {
              messageId: item.id,
              queueName: 'memory',
              payload: item.message,
              headers: item.headers,
              deliveryCount: item.deliveryCount,
              enqueuedAt: item.enqueuedAt,
            },
            options.reason ?? 'nack_without_requeue',
            options,
          ));
        }
      },
    };
  }

  /**
   * Put a message back at the front of the available queue.
   */
  private requeue(item: MemoryQueueItem<T>): void {
    item.settled = false;
    item.availableAt = Date.now();
    if (this.isPending(item)) {
      this.sortPending();
      return;
    }
    this.pending.push(item);
    this.pendingItems.add(item);
    this.sortPending();
  }

  /**
   * Return whether an item is currently waiting for delivery.
   */
  private isPending(item: MemoryQueueItem<T>): boolean {
    return this.pendingItems.has(item);
  }

  /**
   * Remove and return the next currently available message.
   */
  private takeAvailable(): MemoryQueueItem<T> | undefined {
    const now = Date.now();
    const index = this.pending.findIndex((item) => item.availableAt <= now);
    if (index < 0) {
      return undefined;
    }
    const item = this.pending.splice(index, 1)[0];
    this.pendingItems.delete(item);
    return item;
  }

  /**
   * Sort pending messages by availability time.
   */
  private sortPending(): void {
    this.pending.sort((left, right) => left.availableAt - right.availableAt);
  }
}

function wait(milliseconds: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const onAbort = (): void => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, milliseconds);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}
