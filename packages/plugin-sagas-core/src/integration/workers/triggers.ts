import type { JobId, TaskId } from '@netscript/plugin-workers-core';
import type {
  SagaJobTriggerReceipt,
  SagaTaskTriggerReceipt,
  SagaWorkersClientPort,
  SagaWorkerTriggerOptions,
} from './types.ts';
import { triggerJob } from './trigger-job.ts';
import { triggerTask } from './trigger-task.ts';

/** Saga helper set bound to a concrete workers client port. */
export type SagaWorkerTriggers = Readonly<{
  triggerJob<TJobId extends string, TPayload, TResult = unknown>(
    jobId: JobId<TJobId>,
    payload: TPayload,
    options?: SagaWorkerTriggerOptions,
  ): Promise<SagaJobTriggerReceipt<TJobId, TResult>>;
  triggerTask<TTaskId extends string, TPayload, TResult = unknown>(
    taskId: TaskId<TTaskId>,
    payload: TPayload,
    options?: SagaWorkerTriggerOptions,
  ): Promise<SagaTaskTriggerReceipt<TTaskId, TResult>>;
}>;

/** Bind worker trigger helpers to an explicitly supplied workers port. */
export function createWorkerTriggers(workers: SagaWorkersClientPort): SagaWorkerTriggers {
  return Object.freeze({
    triggerJob<TJobId extends string, TPayload, TResult = unknown>(
      jobId: JobId<TJobId>,
      payload: TPayload,
      options?: SagaWorkerTriggerOptions,
    ): Promise<SagaJobTriggerReceipt<TJobId, TResult>> {
      return triggerJob<TJobId, TPayload, TResult>(workers, jobId, payload, options);
    },
    triggerTask<TTaskId extends string, TPayload, TResult = unknown>(
      taskId: TaskId<TTaskId>,
      payload: TPayload,
      options?: SagaWorkerTriggerOptions,
    ): Promise<SagaTaskTriggerReceipt<TTaskId, TResult>> {
      return triggerTask<TTaskId, TPayload, TResult>(workers, taskId, payload, options);
    },
  });
}
