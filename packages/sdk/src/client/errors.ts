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

type DefinedErrorLike = Error & {
  readonly defined: boolean;
  readonly code: string;
  readonly status: number;
  readonly data: unknown;
};

type NarrowDefined<TError> = Extract<TError, DefinedErrorLike> & DefinedError;

type NonDefinedSafeFailure<TError> = [
  Exclude<TError, DefinedErrorLike>,
  undefined,
  false,
  false,
] & {
  error: Exclude<TError, DefinedErrorLike>;
  data: undefined;
  isDefined: false;
  isSuccess: false;
};

type DefinedSafeFailure<TError> = [NarrowDefined<TError>, undefined, true, false] & {
  error: NarrowDefined<TError>;
  data: undefined;
  isDefined: true;
  isSuccess: false;
};

/**
 * Failure branch returned by {@link safe}.
 */
export type SafeFailure<TError = Error> =
  | ([
    Exclude<
      TError,
      Error & {
        readonly defined: boolean;
        readonly code: string;
        readonly status: number;
        readonly data: unknown;
      }
    >,
    undefined,
    false,
    false,
  ] & {
    error: Exclude<
      TError,
      Error & {
        readonly defined: boolean;
        readonly code: string;
        readonly status: number;
        readonly data: unknown;
      }
    >;
    data: undefined;
    isDefined: false;
    isSuccess: false;
  })
  | ([
    Extract<
      TError,
      Error & {
        readonly defined: boolean;
        readonly code: string;
        readonly status: number;
        readonly data: unknown;
      }
    > & DefinedError,
    undefined,
    true,
    false,
  ] & {
    error:
      & Extract<
        TError,
        Error & {
          readonly defined: boolean;
          readonly code: string;
          readonly status: number;
          readonly data: unknown;
        }
      >
      & DefinedError;
    data: undefined;
    isDefined: true;
    isSuccess: false;
  });

/**
 * Tuple/object result returned by {@link safe}.
 */
export type SafeResult<TOutput, TError = Error> =
  | SafeSuccess<TOutput>
  | SafeFailure<TError>;

function createSafeSuccess<TOutput>(data: TOutput): SafeSuccess<TOutput> {
  const tuple = [null, data, false, true] as SafeSuccess<TOutput>;
  tuple.error = null;
  tuple.data = data;
  tuple.isDefined = false;
  tuple.isSuccess = true;
  return tuple;
}

function createSafeFailure<TError>(error: TError): SafeFailure<TError> {
  if (isDefinedError(error)) {
    const tuple = [error, undefined, true, false] as DefinedSafeFailure<TError>;
    tuple.error = error;
    tuple.data = undefined;
    tuple.isDefined = true;
    tuple.isSuccess = false;
    return tuple;
  }

  const tuple = [error, undefined, false, false] as NonDefinedSafeFailure<TError>;
  tuple.error = error as Exclude<TError, DefinedErrorLike>;
  tuple.data = undefined;
  tuple.isDefined = false;
  tuple.isSuccess = false;
  return tuple;
}

/**
 * Narrow an unknown error to an oRPC defined error.
 *
 * @param error - Unknown thrown value.
 * @returns `true` when the error is an oRPC defined error.
 */
export function isDefinedError<T>(error: T): error is
  & Extract<
    T,
    Error & {
      readonly defined: boolean;
      readonly code: string;
      readonly status: number;
      readonly data: unknown;
    }
  >
  & DefinedError {
  return orpcIsDefinedError(error);
}

/**
 * Resolve a promise into a tuple/object result that mirrors the ergonomics of
 * oRPC's `safe()` helper without exposing its private internal types.
 *
 * @param promise - Promise to resolve safely.
 * @returns Safe tuple/object result.
 */
export async function safe<TOutput, TError = Error>(
  promise: Promise<TOutput> & { __error?: { type: TError } },
): Promise<SafeResult<TOutput, TError>> {
  try {
    return createSafeSuccess(await promise);
  } catch (error) {
    return createSafeFailure<TError>(error as TError);
  }
}
