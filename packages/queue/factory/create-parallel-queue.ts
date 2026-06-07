/**
 * Parallel Queue Factory
 *
 * Factory function for wrapping queues with Fedify's ParallelMessageQueue
 * to enable concurrent message processing.
 *
 * This is the PUBLIC API for creating parallel queues. The internal
 * `wrapWithParallel` function in `internal/parallel-queue.ts` does the
 * actual wrapping - this factory provides a cleaner interface.
 *
 * @module
 */

import type { MessageQueue } from '../ports/message-queue.ts';
import { wrapWithParallel } from '../internal/parallel-queue.ts';
import { createQueue } from './create-queue.ts';
import type { QueueOptions } from '../ports/options.ts';

/**
 * Options for creating a parallel queue.
 */
export interface ParallelQueueOptions extends QueueOptions {
  /**
   * Number of concurrent message processors (workers).
   * Must be >= 1. Values > 1 enable parallel processing.
   * @default 1
   */
  concurrency?: number;
}

/**
 * Create a message queue with parallel processing capability.
 *
 * When concurrency > 1, wraps the queue with Fedify's ParallelMessageQueue
 * which enables multiple messages to be processed concurrently on a single
 * queue listener.
 *
 * This is the recommended way to enable parallelism for I/O-bound work like:
 * - HTTP API calls
 * - Database queries
 * - File operations
 *
 * For CPU-bound work, consider Web Workers instead (see workers architecture docs).
 *
 * @template T - Message payload type
 * @param name - Queue name for namespacing
 * @param options - Queue configuration with concurrency
 * @returns MessageQueue instance (optionally wrapped for parallelism)
 *
 * @example
 * ```ts
 * // Create a queue that processes 4 messages concurrently
 * const queue = createParallelQueue<JobMessage>('jobs', { concurrency: 4 });
 *
 * // Listen processes up to 4 messages at a time
 * await queue.listen(async (message) => {
 *   await processJob(message); // These run in parallel
 * });
 * ```
 *
 * @example
 * ```ts
 * // With specific provider
 * const queue = createParallelQueue<NotificationMessage>('notifications', {
 *   concurrency: 8,
 *   provider: QueueProvider.Redis,
 * });
 * ```
 */
export function createParallelQueue<T = unknown>(
  name: string,
  options: ParallelQueueOptions = {},
): MessageQueue<T> {
  const { concurrency = 1, ...queueOptions } = options;

  // Create the base queue
  const baseQueue = createQueue<T>(name, queueOptions);

  // No wrapping needed for sequential processing
  if (concurrency <= 1) {
    return baseQueue;
  }

  return wrapWithParallel(baseQueue, concurrency);
}
