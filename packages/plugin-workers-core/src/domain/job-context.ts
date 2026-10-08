/** Runtime context supplied to a worker job handler. */
export type JobContext<TPayload = unknown, TResult = unknown> = Readonly<{
  id: string;
  job?: Readonly<{ id: string }>;
  payload: TPayload;
  /** Executor-owned cancellation; reason names distinguish timeout, shutdown and cancel. */
  signal: AbortSignal;
  /** Effective execution deadline in epoch milliseconds, when configured. */
  deadlineAt?: number;
  correlationId?: string;
  traceparent?: string;
  tracestate?: string;
  reportProgress?: (percent: number, message?: string) => void | Promise<void>;
}>;
