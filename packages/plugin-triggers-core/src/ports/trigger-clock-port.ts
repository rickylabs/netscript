/** Clock boundary for deterministic trigger runtime tests. */
export interface TriggerClockPort {
  /** Return the current runtime time. */
  now(): Date;
  /** Sleep for the requested duration or until aborted. */
  sleep(ms: number, options?: Readonly<{ signal?: AbortSignal }>): Promise<void>;
}
