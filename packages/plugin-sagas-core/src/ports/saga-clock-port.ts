/** Abortable sleep options for deterministic saga schedulers and tests. */
export type SagaSleepOptions = Readonly<{
  signal?: AbortSignal;
}>;

/** Clock boundary used by runtime, scheduler, retry, and deterministic tests. */
export interface SagaClockPort {
  readonly id: string;
  now(): Date;
  sleep(ms: number, options?: SagaSleepOptions): Promise<void>;
}
