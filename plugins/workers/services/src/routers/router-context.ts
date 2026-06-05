import { workersContractV1 } from '../../../contracts/v1/mod.ts';
import type { JobMessage, TaskMessage } from '@netscript/plugin-workers-core/runtime';
import type { KvJobRegistry, KvTaskRegistry } from '@netscript/plugin-workers-core/registry';
import type { KvExecutionState } from '@netscript/plugin-workers-core/state';
import { createQueue } from '@netscript/queue';

export type WorkerDatabaseClient = Record<string, unknown>;

export type WorkersServiceRuntime = Readonly<{
  executionState: KvExecutionState;
  jobRegistry: KvJobRegistry;
  taskRegistry: KvTaskRegistry;
}>;

export type WorkersRequestContext = {
  db: WorkerDatabaseClient;
  traceHeaders?: { traceparent?: string; tracestate?: string };
  workers: WorkersServiceRuntime;
};

export const router = workersContractV1.$context<WorkersRequestContext>();

export function getWorkersRuntime(context: unknown): WorkersServiceRuntime {
  const runtime = (context as Partial<WorkersRequestContext>).workers;
  if (!runtime) {
    throw new Error('Workers service runtime missing from request context.');
  }
  return runtime;
}

let jobQueue: ReturnType<typeof createQueue<JobMessage>> | null = null;
let taskQueue: ReturnType<typeof createQueue<TaskMessage>> | null = null;

export function getJobQueue() {
  if (!jobQueue) {
    jobQueue = createQueue<JobMessage>('jobs');
  }
  return jobQueue;
}

export function getTaskQueue() {
  if (!taskQueue) {
    taskQueue = createQueue<TaskMessage>('tasks');
  }
  return taskQueue;
}
