/** Abortable sleep options for deterministic saga schedulers and tests. */
export type SagaSleepOptions = Readonly<{
  signal?: AbortSignal;
}>;

/** Clock boundary used by runtime, scheduler, retry, and deterministic tests. */
export interface SagaClockPort {
  /** Stable adapter identifier used by runtime diagnostics and plugin registration. */
  readonly id: string;
  /** Return the current saga clock time. */
  now(): Date;
  /** Resolve after the requested duration or reject if aborted. */
  sleep(ms: number, options?: SagaSleepOptions): Promise<void>;
}
