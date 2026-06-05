/** Clock boundary for deterministic trigger runtime tests. */
export interface TriggerClockPort {
  now(): Date;
  sleep(ms: number, options?: Readonly<{ signal?: AbortSignal }>): Promise<void>;
}
