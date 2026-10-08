/** Time and disposable scheduling used by an in-process job runner. */
export interface JobRunnerClock {
  /** Current time in epoch milliseconds. */
  now(): number;
  /** Schedule a callback and return a function that cancels it. */
  schedule(delayMs: number, callback: () => void): () => void;
}
