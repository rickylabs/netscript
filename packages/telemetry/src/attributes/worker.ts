/**
 * Semantic worker attribute names used by worker instrumentation.
 */
export const WorkerAttributes = {
  WORKER_ID: 'netscript.worker.id',
  WORKER_CONCURRENCY: 'netscript.worker.concurrency',
  WORKER_ACTIVE_JOBS: 'netscript.worker.active_jobs',
  WORKER_QUEUE: 'netscript.worker.queue',
} as const;
