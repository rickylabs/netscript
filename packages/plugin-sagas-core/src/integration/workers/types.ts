import type { JobId, TaskId } from '@netscript/plugin-workers-core';

/** Priority hint forwarded to the workers plugin boundary. */
export type SagaWorkerPriority = 'low' | 'normal' | 'high' | 'critical';

/** Delay accepted by saga-to-worker trigger helpers. */
export type SagaWorkerDelay = Readonly<{
  scheduledFor?: Date;
  delayMs?: number;
}>;

/** Cross-plugin execution metadata forwarded with worker triggers. */
export type SagaWorkerTriggerOptions = Readonly<{
  priority?: SagaWorkerPriority;
  delay?: SagaWorkerDelay;
  correlationId?: string;
  idempotencyKey?: string;
  concurrencyKey?: string;
  traceparent?: string;
  tracestate?: string;
}>;

/** Job trigger request sent from sagas to the workers plugin. */
export type SagaJobTriggerRequest<TJobId extends string, TPayload> = Readonly<
  {
    jobId: JobId<TJobId>;
    payload: TPayload;
  } & SagaWorkerTriggerOptions
>;

/** Task trigger request sent from sagas to the workers plugin. */
export type SagaTaskTriggerRequest<TTaskId extends string, TPayload> = Readonly<
  {
    taskId: TaskId<TTaskId>;
    payload: TPayload;
  } & SagaWorkerTriggerOptions
>;

/** Durable receipt returned after a worker job has been triggered. */
export type SagaJobTriggerReceipt<TJobId extends string, TResult = unknown> = Readonly<{
  jobId: JobId<TJobId>;
  runId: string;
  acceptedAt: Date;
  result?: TResult;
}>;

/** Durable receipt returned after a worker task has been triggered. */
export type SagaTaskTriggerReceipt<TTaskId extends string, TResult = unknown> = Readonly<{
  taskId: TaskId<TTaskId>;
  runId: string;
  acceptedAt: Date;
  result?: TResult;
}>;

/** Explicit worker boundary consumed by saga integrations. */
export interface SagaWorkersClientPort {
  triggerJob<TJobId extends string, TPayload, TResult = unknown>(
    request: SagaJobTriggerRequest<TJobId, TPayload>,
  ): Promise<SagaJobTriggerReceipt<TJobId, TResult>>;
  triggerTask<TTaskId extends string, TPayload, TResult = unknown>(
    request: SagaTaskTriggerRequest<TTaskId, TPayload>,
  ): Promise<SagaTaskTriggerReceipt<TTaskId, TResult>>;
}
