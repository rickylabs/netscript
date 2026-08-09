/** Clock edge used by reconnect backoff. */
export interface StreamProducerClockPort {
  /** Sleep for a bounded delay or reject when the signal aborts. */
  sleep(delayMs: number, options?: Readonly<{ signal?: AbortSignal }>): Promise<void>;
}
