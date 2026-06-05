/**
 * Internal Queue Utilities
 *
 * This module contains internal implementation details for the queue system.
 * These are NOT part of the public API and should not be imported by users.
 *
 * Users configure queue behavior through netscript.config.ts:
 * - `scaling.concurrency` → wrapWithParallel()
 * - `scaling.mode: 'distributed'` → createDistributedQueue()
 *
 * @internal
 * @module
 */

export { getQueueConcurrency, isParallelQueue, wrapWithParallel } from './parallel-queue.ts';

export {
  createDistributedQueue,
  type DistributedMessageQueue,
  type DistributedQueueOptions,
  type DistributedRole,
  getQueueRole,
  isDistributedQueue,
} from './distributed-queue.ts';
