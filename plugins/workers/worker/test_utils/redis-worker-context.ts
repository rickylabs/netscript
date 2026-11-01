import type { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import type { WorkerDispatchContext, WorkerTaskExecutor } from '../worker-options.ts';
import { WorkerPool } from '../job-runner-pool.ts';

/** Minimal first-party dispatch wiring shared by real-broker recovery tests and their child. */
export function recoveryContext(
  idempotency: KvWorkerIdempotencyStore,
  taskExecutor: WorkerTaskExecutor,
  shutdownSignal?: AbortSignal,
): WorkerDispatchContext {
  return {
    workerId: 'lease-recovery-test',
    concurrency: 1,
    registry: {
      get: (id) =>
        Promise.resolve({
          id,
          topic: 'jobs',
          enabled: true,
          executionType: 'python',
          entrypoint: './unused.py',
          maxRetries: 0,
        }),
    },
    taskRegistry: {
      get: (id) =>
        Promise.resolve({
          id,
          topic: 'tasks',
          enabled: true,
          type: 'deno',
          timeout: 60_000,
          entrypoint: new URL('./redis-worker-task.ts', import.meta.url).pathname,
          permissions: { env: true },
        }),
    },
    executionState: {
      create: () => Promise.resolve({ id: crypto.randomUUID() }),
      start: () => Promise.resolve(null),
      progress: () => Promise.resolve(null),
      complete: () => Promise.resolve(null),
    },
    taskExecutor,
    idempotency,
    workerPool: new WorkerPool(),
    jobsDir: '.',
    activeJobs: new Map(),
    workerSpan: null,
    shutdownSignal,
  };
}
