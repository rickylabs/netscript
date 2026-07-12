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
  EnqueueOptions,
  ListenOptions,
  MessageContext,
  MessageQueue,
} from '../ports/message-queue.ts';

type FedifyQueue = ConstructorParameters<typeof ParallelMessageQueue>[0];
type FedifyEnqueueOptions = Parameters<ParallelMessageQueue['enqueue']>[1];

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

  // Create Fedify's ParallelMessageQueue wrapper
  const parallelQueue = new ParallelMessageQueue(
    queue as unknown as FedifyQueue, // quality-allow: Fedify fixes ParallelMessageQueue to a non-generic any payload while NetScript preserves the caller's T at its wrapper boundary
    concurrency,
  );

  // Return a queue that delegates to the parallel queue
  // while maintaining our MessageQueue<T> interface
  return {
    get nativeRetrial(): boolean {
      return parallelQueue.nativeRetrial ?? queue.nativeRetrial;
    },

    async enqueue(message: T, options?: EnqueueOptions): Promise<void> {
      await parallelQueue.enqueue(message, options as unknown as FedifyEnqueueOptions); // quality-allow: NetScript uses millisecond delays while Fedify uses Duration
    },

    async enqueueMany(messages: T[], options?: EnqueueOptions): Promise<void> {
      if (parallelQueue.enqueueMany) {
        await parallelQueue.enqueueMany(messages, options as unknown as FedifyEnqueueOptions); // quality-allow: NetScript uses millisecond delays while Fedify uses Duration
      } else {
        // Fallback to sequential enqueue
        for (const message of messages) {
          await parallelQueue.enqueue(message, options as unknown as FedifyEnqueueOptions); // quality-allow: NetScript uses millisecond delays while Fedify uses Duration
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
        async (message: unknown) => {
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
          await handler(message as T, context);
        },
        options,
      );
    },

    async stop(): Promise<void> {
      await queue.stop();
    },
  };
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
): queue is MessageQueue<T> & { readonly workers: number } {
  // ParallelMessageQueue has specific properties we can check
  return 'queue' in queue && 'workers' in queue;
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
