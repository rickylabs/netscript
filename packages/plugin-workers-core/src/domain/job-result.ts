/** Successful job result. */
export type JobSuccess<TResult = unknown> = Readonly<{
  success: true;
  data?: TResult;
}>;

/** Failed job result. */
export type JobFailure<TResult = unknown> = Readonly<{
  success: false;
  error: string;
  data?: TResult;
}>;

/** Result returned by worker job handlers. */
export type JobResult<TResult = unknown> = JobSuccess<TResult> | JobFailure<TResult>;

/**
 * Create a successful job result.
 *
 * @param data - Optional result payload.
 * @returns A success-shaped job result.
 */
export function createSuccessResult<TResult = unknown>(data?: TResult): JobSuccess<TResult> {
  return data === undefined
    ? Object.freeze({ success: true })
    : Object.freeze({ success: true, data });
}

/**
 * Create a failed job result.
 *
 * @param error - Error or message returned by the job.
 * @param data - Optional structured failure data.
 * @returns A failure-shaped job result.
 */
export function createFailureResult<TResult = unknown>(
  error: string | Error,
  data?: TResult,
): JobFailure<TResult> {
  const message = error instanceof Error ? error.message : error;
  return data === undefined
    ? Object.freeze({ success: false, error: message })
    : Object.freeze({ success: false, error: message, data });
}
