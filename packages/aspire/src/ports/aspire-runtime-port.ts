/** Lifecycle port for an Aspire AppHost runtime adapter. */
export interface AspireRuntime {
  /** Starts the Aspire runtime. */
  start(): Promise<void>;
  /** Stops the Aspire runtime with an optional reason. */
  stop(reason?: string): Promise<void>;
  /** Reports the current runtime lifecycle state. */
  status(): 'idle' | 'running' | 'stopped';
}
