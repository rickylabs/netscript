/**
 * Error helpers re-exposed by the SDK for consumer convenience.
 *
 * @module
 */

import { isDefinedError as orpcIsDefinedError } from '@orpc/client';

/**
 * Public shape of an oRPC defined error.
 *
 * @typeParam TCode - Stable error code string.
 * @typeParam TData - Structured error payload.
 */
export interface DefinedError<TCode extends string = string, TData = unknown> extends Error {
  /** Marker used by oRPC to flag defined errors. */
  readonly defined: true;
  /** Stable contract error code. */
  readonly code: TCode;
  /** HTTP status associated with the error. */
  readonly status: number;
  /** Structured error payload. */
  readonly data: TData;
}

/**
 * Success branch returned by {@link safe}.
 */
export type SafeSuccess<TOutput> = [null, TOutput, false, true] & {
  error: null;
  data: TOutput;
  isDefined: false;
  isSuccess: true;
};

/**
 * Failure branch returned by {@link safe}.
 */
export type SafeFailure<TError = unknown> = [TError, null, boolean, false] & {
  error: TError;
  data: null;
  isDefined: boolean;
  isSuccess: false;
};

/**
 * Tuple/object result returned by {@link safe}.
 */
export type SafeResult<TOutput, TError = unknown> = SafeSuccess<TOutput> | SafeFailure<TError>;

function createSafeSuccess<TOutput>(data: TOutput): SafeSuccess<TOutput> {
  const tuple = [null, data, false, true] as SafeSuccess<TOutput>;
  tuple.error = null;
  tuple.data = data;
  tuple.isDefined = false;
  tuple.isSuccess = true;
  return tuple;
}

function createSafeFailure<TError>(error: TError, isDefined: boolean): SafeFailure<TError> {
  const tuple = [error, null, isDefined, false] as SafeFailure<TError>;
  tuple.error = error;
  tuple.data = null;
  tuple.isDefined = isDefined;
  tuple.isSuccess = false;
  return tuple;
}

/**
 * Narrow an unknown error to an oRPC defined error.
 *
 * @param error - Unknown thrown value.
 * @returns `true` when the error is an oRPC defined error.
 */
export function isDefinedError<T>(error: T): error is Extract<T, DefinedError> {
  return orpcIsDefinedError(error);
}

/**
 * Resolve a promise into a tuple/object result that mirrors the ergonomics of
 * oRPC's `safe()` helper without exposing its private internal types.
 *
 * @param promise - Promise to resolve safely.
 * @returns Safe tuple/object result.
 */
export async function safe<TOutput>(promise: PromiseLike<TOutput>): Promise<SafeResult<TOutput>> {
  try {
    return createSafeSuccess(await promise);
  } catch (error) {
    return createSafeFailure(error, isDefinedError(error));
  }
}
