/**
 * In-memory queue adapter for tests and examples.
 *
 * @module
 */

import type { EnqueueOptions, ListenOptions, MessageContext, MessageQueue } from '../ports/mod.ts';

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
  private listening = false;
  private abortController?: AbortController;

  /**
   * Create an in-memory queue adapter.
   *
   * @param options - Optional polling configuration.
   */
  constructor(options: MemoryQueueAdapterOptions = {}) {
    this.pollInterval = options.pollInterval ?? 5;
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
      if (!item.settled && !this.pendingItems.has(item)) {
        item.settled = true;
      }
    } catch (error) {
      if (!item.settled && !this.pendingItems.has(item)) {
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
      nack: (options = {}) => {
        item.settled = true;
        if (options.requeue ?? true) {
          this.requeue(item);
        }
        return Promise.resolve();
      },
    };
  }

  /**
   * Put a message back at the front of the available queue.
   */
  private requeue(item: MemoryQueueItem<T>): void {
    item.settled = false;
    item.availableAt = Date.now();
    if (this.pendingItems.has(item)) {
      this.sortPending();
      return;
    }
    this.pending.push(item);
    this.pendingItems.add(item);
    this.sortPending();
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
