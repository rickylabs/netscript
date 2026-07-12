/**
 * Durable stream producer for the Workers plugin.
 *
 * Publishes execution state changes directly via an ExecutionState
 * mutation hook — no KV watcher needed.
 *
 * @module
 */

import {
  createStreamMutationHook as createCoreStreamMutationHook,
  createWorkersStreamProducer,
  emitJobToStream as emitJobToCoreStream,
  type WorkerJob,
  type WorkersStreamProducer,
} from '@netscript/plugin-workers-core/streams';
import type { ExecutionMutationHook } from '@netscript/plugin-workers-core/state';

export type { WorkersStreamProducer } from '@netscript/plugin-workers-core/streams';
export type {
  ExecutionConcept,
  ExecutionMutationHook,
  ExecutionRecord,
  ExecutionStatus,
  ExecutionTriggerType,
} from '@netscript/plugin-workers-core/state';

let producer: WorkersStreamProducer | undefined;

/**
 * Get (or create) the singleton workers execution stream producer.
 *
 * @example
 * ```ts
 * const producer = getWorkersStreamProducer();
 * producer.upsert('execution', { id: 'exec-123', status: 'running', jobId: 'health-check' });
 * ```
 */
export function getWorkersStreamProducer(): WorkersStreamProducer {
  if (!producer) {
    producer = createWorkersStreamProducer();
  }
  return producer;
}

/**
 * Create an ExecutionState mutation hook that publishes to the durable stream.
 */
export function createStreamMutationHook(): ExecutionMutationHook {
  return createCoreStreamMutationHook(
    getWorkersStreamProducer(),
  ) as unknown as ExecutionMutationHook; // quality-allow: durable-stream mutation hook upstream type omits the worker execution extension fields
}

/**
 * Emit a job entity to the durable stream.
 *
 * Call after job registration/update so that stream consumers see
 * the current set of registered jobs.
 */
export function emitJobToStream(job: WorkerJob): void {
  emitJobToCoreStream(getWorkersStreamProducer(), job);
}
