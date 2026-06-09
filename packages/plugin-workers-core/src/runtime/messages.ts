import type { JobDefinition, JobResult } from './runtime-types.ts';

/** Message sent to a runner to execute a job. */
export type ExecuteJobMessage<TPayload = unknown> = Readonly<{
  type: 'execute';
  jobId: string;
  executionId: string;
  topic: string;
  attempt: number;
  jobDefinition: JobDefinition<string, TPayload, unknown>;
  payload: TPayload;
  traceContext?: Readonly<{
    traceparent: string;
    tracestate?: string;
  }>;
}>;

/** Message emitted when a job completes successfully. */
export type JobCompleteMessage<TResult = unknown> = Readonly<{
  type: 'complete';
  executionId: string;
  jobId: string;
  result: JobResult<TResult> & { success: true };
  duration: number;
}>;

/** Message emitted when a job fails. */
export type JobErrorMessage<TResult = unknown> = Readonly<{
  type: 'error';
  executionId: string;
  jobId: string;
  error: string;
  data?: TResult;
  duration: number;
}>;

/** Message emitted to report job progress. */
export type JobProgressMessage = Readonly<{
  type: 'progress';
  executionId: string;
  jobId: string;
  percent: number;
  message?: string;
}>;

/** Message emitted for job logs. */
export type JobLogMessage = Readonly<{
  type: 'log';
  executionId: string;
  jobId: string;
  level: 'debug' | 'error' | 'info' | 'warn';
  message: string;
  data?: Readonly<Record<string, unknown>>;
}>;

/** Message used to stop a long-lived runner. */
export type TerminateMessage = Readonly<{
  type: 'terminate';
  reason?: string;
}>;

/** Messages accepted by a job runner. */
export type WorkerInboundMessage<TPayload = unknown> =
  | ExecuteJobMessage<TPayload>
  | TerminateMessage;

/** Messages emitted by a job runner. */
export type WorkerOutboundMessage<TResult = unknown> =
  | JobCompleteMessage<TResult>
  | JobErrorMessage<TResult>
  | JobProgressMessage
  | JobLogMessage;

/** State update emitted by runtimes that expose execution progress. */
export type StateUpdateMessage<TResult = unknown> = Readonly<{
  type:
    | 'execution.started'
    | 'execution.progress'
    | 'execution.completed'
    | 'execution.failed';
  jobId: string;
  executionId: string;
  topic: string;
  timestamp: string;
  percent?: number;
  message?: string;
  success?: boolean;
  result?: TResult;
  error?: string;
  duration?: number;
}>;

/** Broadcast channel name for job execution state updates. */
export const JOB_STATE_CHANNEL = 'netscript:job-state';
