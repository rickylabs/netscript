import type { JobDefinition } from './job-definition.ts';

/** Runtime context supplied to a worker job handler. */
export type JobContext<TPayload = unknown, TResult = unknown> = Readonly<{
  id: string;
  job: JobDefinition<string, TPayload, TResult>;
  payload: TPayload;
  correlationId?: string;
  traceparent?: string;
  tracestate?: string;
  reportProgress?: (percent: number, message?: string) => void | Promise<void>;
}>;
