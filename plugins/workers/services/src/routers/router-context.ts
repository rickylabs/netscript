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

type WorkersRouterContext = ReturnType<typeof workersContractV1.$context<WorkersRequestContext>>;

const workersRouter: WorkersRouterContext = workersContractV1.$context<WorkersRequestContext>();

export const router: typeof workersRouter = workersRouter;

export function getWorkersRuntime(context: unknown): WorkersServiceRuntime {
  const runtime = (context as Partial<WorkersRequestContext>).workers;
  if (!runtime) {
    throw new Error('Workers service runtime missing from request context.');
  }
  return runtime;
}

let jobQueue: ReturnType<typeof createQueue<JobMessage>> | null = null;
let taskQueue: ReturnType<typeof createQueue<TaskMessage>> | null = null;

export function getJobQueue(): ReturnType<typeof createQueue<JobMessage>> {
  if (!jobQueue) {
    jobQueue = createQueue<JobMessage>('jobs');
  }
  return jobQueue;
}

export function getTaskQueue(): ReturnType<typeof createQueue<TaskMessage>> {
  if (!taskQueue) {
    taskQueue = createQueue<TaskMessage>('tasks');
  }
  return taskQueue;
}
