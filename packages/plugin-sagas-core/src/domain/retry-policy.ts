/** Retry policy for saga handlers and cascaded messages. */
export type RetryPolicy = Readonly<{
  maximumAttempts: number;
  initialIntervalMs: number;
  maximumIntervalMs: number;
  backoffCoefficient: number;
  nonRetryableErrorTypes: readonly string[];
}>;

/** Default retry policy used when a saga does not override retry behavior. */
export const DEFAULT_RETRY_POLICY: RetryPolicy = Object.freeze({
  maximumAttempts: 5,
  initialIntervalMs: 1000,
  maximumIntervalMs: 60000,
  backoffCoefficient: 2,
  nonRetryableErrorTypes: Object.freeze([]),
});
