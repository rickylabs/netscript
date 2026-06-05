/**
 * Queue Factory - Barrel Export
 *
 * Factory functions for creating queue instances.
 *
 * @module
 */

export { createQueue } from './create-queue.ts';
export { createTypedQueue, type TypedMessageQueue } from './create-typed-queue.ts';
export { createParallelQueue, type ParallelQueueOptions } from './create-parallel-queue.ts';
