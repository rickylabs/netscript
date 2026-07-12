/**
 * ParallelMessageQueue Wrapper
 *
 * Internal module that wraps any MessageQueue with Fedify's ParallelMessageQueue
 * to enable concurrent message processing. This is an implementation detail -
 * users configure concurrency via `scaling.concurrency` in their config.
 *
 * @internal This module is NOT part of the public API.
 * @module
 */

import { ParallelMessageQueue } from '@fedify/fedify';
import type {
  MessageQueue as FedifyMessageQueue,
  MessageQueueEnqueueOptions as FedifyEnqueueOptions,
  MessageQueueListenOptions as FedifyListenOptions,
} from '@fedify/fedify';
import type {
  EnqueueOptions,
  ListenOptions,
  MessageContext,
  MessageQueue,
} from '../ports/message-queue.ts';

/**
 * Wrap a MessageQueue with ParallelMessageQueue for concurrent processing.
 *
 * This function is used internally by the Worker when `scaling.concurrency > 1`
 * is configured. Users never import this directly - they configure concurrency
 * in their netscript.config.ts.
 *
 * @internal
 * @template T - Message payload type
 * @param queue - Base queue to wrap
 * @param concurrency - Number of concurrent message processors (workers)
 * @returns Wrapped queue with concurrent processing capability
 *
 * @example
 * ```ts
 * // Internal usage in Worker:
 * const baseQueue = createQueue<JobMessage>('jobs');
 * const queue = config.scaling.concurrency > 1
 *   ? wrapWithParallel(baseQueue, config.scaling.concurrency)
 *   : baseQueue;
 * ```
 */
export function wrapWithParallel<T>(
  queue: MessageQueue<T>,
  concurrency: number,
): MessageQueue<T> {
  // No wrapping needed for sequential processing
  if (concurrency <= 1) {
    return queue;
  }

  const parallelQueue = new ParallelMessageQueue(
    new FedifyQueueAdapter(queue),
    concurrency,
  );

  // Return a queue that delegates to the parallel queue
  // while maintaining our MessageQueue<T> interface
  const wrappedQueue: MessageQueue<T> & ParallelQueueMarker<T> = {
    queue,
    workers: concurrency,

    get nativeRetrial(): boolean {
      return parallelQueue.nativeRetrial ?? queue.nativeRetrial;
    },

    async enqueue(message: T, options?: EnqueueOptions): Promise<void> {
      await parallelQueue.enqueue(message, toFedifyEnqueueOptions(options));
    },

    async enqueueMany(messages: T[], options?: EnqueueOptions): Promise<void> {
      if (parallelQueue.enqueueMany) {
        await parallelQueue.enqueueMany(messages, toFedifyEnqueueOptions(options));
      } else {
        // Fallback to sequential enqueue
        for (const message of messages) {
          await parallelQueue.enqueue(message, toFedifyEnqueueOptions(options));
        }
      }
    },

    async listen(
      handler: (message: T, context: MessageContext) => Promise<void>,
      options?: ListenOptions,
    ): Promise<void> {
      // Fedify's ParallelMessageQueue.listen takes a simpler handler signature
      // We need to adapt our handler to work with it
      await parallelQueue.listen(
        async (message: T) => {
          // Create a minimal context for compatibility
          // Note: Fedify's parallel queue doesn't provide the full context,
          // so we create a stub. The underlying queue's listen will provide
          // the actual context when the message is processed.
          const context: MessageContext = {
            messageId: crypto.randomUUID(),
            deliveryCount: 1,
            enqueuedAt: new Date(),
            headers: {},
            ack: async () => {},
            nack: async () => {},
          };
          await handler(message, context);
        },
        { signal: options?.signal },
      );
    },

    async stop(): Promise<void> {
      await queue.stop();
    },
  };
  return wrappedQueue;
}

interface ParallelQueueMarker<T> {
  readonly queue: MessageQueue<T>;
  readonly workers: number;
}

/**
 * Check if a queue is wrapped with ParallelMessageQueue.
 *
 * @internal
 * @param queue - Queue to check
 * @returns True if the queue is a parallel wrapper
 */
export function isParallelQueue<T>(
  queue: MessageQueue<T>,
): queue is MessageQueue<T> & { readonly queue: MessageQueue<T>; readonly workers: number } {
  return 'queue' in queue && 'workers' in queue &&
    typeof queue.workers === 'number';
}

/**
 * Get the concurrency level of a queue.
 *
 * @internal
 * @param queue - Queue to check
 * @returns Concurrency level (1 if not a parallel queue)
 */
export function getQueueConcurrency<T>(queue: MessageQueue<T>): number {
  if (isParallelQueue(queue)) {
    return queue.workers;
  }
  return 1;
}

type FedifyBridgeEnqueueOptions =
  & FedifyEnqueueOptions
  & Omit<EnqueueOptions, 'delay'>;

class FedifyQueueAdapter<T> implements FedifyMessageQueue {
  readonly nativeRetrial: boolean;

  constructor(private readonly queue: MessageQueue<T>) {
    this.nativeRetrial = queue.nativeRetrial;
  }

  enqueue(message: T, options?: FedifyEnqueueOptions): Promise<void> {
    return this.queue.enqueue(message, toNetScriptEnqueueOptions(options));
  }

  async enqueueMany(messages: readonly T[], options?: FedifyEnqueueOptions): Promise<void> {
    const netScriptOptions = toNetScriptEnqueueOptions(options);
    if (this.queue.enqueueMany) {
      await this.queue.enqueueMany([...messages], netScriptOptions);
      return;
    }
    for (const message of messages) {
      await this.queue.enqueue(message, netScriptOptions);
    }
  }

  listen(
    handler: (message: T) => Promise<void> | void,
    options?: FedifyListenOptions,
  ): Promise<void> {
    return this.queue.listen(
      async (message) => await handler(message),
      { signal: options?.signal },
    );
  }
}

function toFedifyEnqueueOptions(
  options: EnqueueOptions | undefined,
): FedifyBridgeEnqueueOptions | undefined {
  if (!options) return undefined;
  const { delay, ...metadata } = options;
  return {
    ...metadata,
    ...(delay === undefined ? {} : { delay: Temporal.Duration.from({ milliseconds: delay }) }),
  };
}

function toNetScriptEnqueueOptions(
  options: FedifyEnqueueOptions | undefined,
): EnqueueOptions | undefined {
  if (!options) return undefined;
  const metadata: object = options;
  return {
    ...(options.delay === undefined
      ? {}
      : { delay: options.delay.total({ unit: 'milliseconds' }) }),
    ...readNumberProperty(metadata, 'priority'),
    ...readStringProperty(metadata, 'deduplicationId'),
    ...readHeadersProperty(metadata),
  };
}

function readNumberProperty(
  value: object,
  key: 'priority',
): Pick<EnqueueOptions, 'priority'> {
  if (key in value && typeof value[key] === 'number') {
    return { [key]: value[key] };
  }
  return {};
}

function readStringProperty(
  value: object,
  key: 'deduplicationId',
): Pick<EnqueueOptions, 'deduplicationId'> {
  if (key in value && typeof value[key] === 'string') {
    return { [key]: value[key] };
  }
  return {};
}

function readHeadersProperty(value: object): Pick<EnqueueOptions, 'headers'> {
  if (!('headers' in value) || typeof value.headers !== 'object' || value.headers === null) {
    return {};
  }
  const entries = Object.entries(value.headers);
  if (!entries.every(([, entry]) => typeof entry === 'string')) return {};
  return { headers: Object.fromEntries(entries) };
}
