/** Lifecycle port for an Aspire AppHost runtime adapter. */
export interface AspireRuntime {
  start(): Promise<void>;
  stop(reason?: string): Promise<void>;
  status(): 'idle' | 'running' | 'stopped';
}
