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

/** Execution-state surface needed to mirror worker changes into streams. */
export interface WorkersStreamMirrorState {
  /** Register the mutation hook invoked by execution-state writes. */
  setMutationHook(hook: ExecutionMutationHook): void;
}

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
  ) as unknown as ExecutionMutationHook;
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

/**
 * Wire the durable stream producer to the shared ExecutionState singleton.
 * Call once at service startup.
 *
 * This is synchronous — no KV watch loop, no async setup. The function name
 * is kept for backward compatibility with existing `main.ts` imports.
 */
export function startWorkersStreamMirror(state: WorkersStreamMirrorState): void {
  state.setMutationHook(createStreamMutationHook());
}
