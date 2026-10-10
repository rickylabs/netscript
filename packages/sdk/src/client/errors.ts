/**
 * Error helpers re-exposed by the SDK for consumer convenience.
 *
 * @module
 */

import { isDefinedError as orpcIsDefinedError } from '@orpc/client';
import type { SdkClientContributionId } from '../ports/sdk-client-contribution.ts';

/** Stable failure codes emitted by SDK client contribution handling. */
export type SdkClientContributionErrorCode =
  | 'SDK_CONTRIBUTION_INVALID'
  | 'SDK_CONTRIBUTION_VERSION'
  | 'SDK_CONTRIBUTION_CONFLICT'
  | 'SDK_CONTRIBUTION_LIMIT'
  | 'SDK_CONTRIBUTION_RUNTIME'
  | 'SDK_CONTEXT_MISSING'
  | 'SDK_HEADER_INVALID'
  | 'SDK_CACHE_PARTITION_INVALID'
  | 'SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED'
  | 'SDK_PREPARATION_FAILED';

/** Redacted diagnostic shape exposed by SDK client contribution failures. */
export interface SdkClientContributionDiagnostic {
  /** Stable machine-readable failure code. */
  readonly code: SdkClientContributionErrorCode;
  /** Lifecycle phase in which the failure occurred. */
  readonly phase: 'construction' | 'partition' | 'preparation';
  /** Safe contribution identifier, when known. */
  readonly contributionId?: SdkClientContributionId;
  /** Earlier owner or opposing contribution identifier, when relevant. */
  readonly conflictingContributionId?: SdkClientContributionId;
  /** Dot-separated procedure path, when known. */
  readonly procedurePath?: string;
  /** Declared header name, when relevant. */
  readonly headerName?: string;
}

/** Package-owned, redacted error for SDK client contribution failures. */
export class SdkClientContributionError extends Error {
  /** Stable machine-readable failure code. */
  readonly code: SdkClientContributionErrorCode;
  /** Lifecycle phase in which the failure occurred. */
  readonly phase: 'construction' | 'partition' | 'preparation';
  /** Safe contribution identifier, when known. */
  readonly contributionId?: SdkClientContributionId;
  /** Earlier owner or opposing contribution identifier, when relevant. */
  readonly conflictingContributionId?: SdkClientContributionId;
  /** Dot-separated procedure path, when known. */
  readonly procedurePath?: string;
  /** Declared header name, when relevant. */
  readonly headerName?: string;

  /**
   * Create a framework-authored contribution failure from redacted fields.
   *
   * @param diagnostic - Stable diagnostic fields safe for consumer observation.
   */
  constructor(diagnostic: SdkClientContributionDiagnostic) {
    super(`SDK client contribution failure: ${diagnostic.code}`);
    this.name = 'SdkClientContributionError';
    this.code = diagnostic.code;
    this.phase = diagnostic.phase;
    this.contributionId = diagnostic.contributionId;
    this.conflictingContributionId = diagnostic.conflictingContributionId;
    this.procedurePath = diagnostic.procedurePath;
    this.headerName = diagnostic.headerName;
  }

  /** Return the stable redacted diagnostic representation. */
  toJSON(): SdkClientContributionDiagnostic {
    return {
      code: this.code,
      phase: this.phase,
      ...(this.contributionId === undefined ? {} : { contributionId: this.contributionId }),
      ...(this.conflictingContributionId === undefined
        ? {}
        : { conflictingContributionId: this.conflictingContributionId }),
      ...(this.procedurePath === undefined ? {} : { procedurePath: this.procedurePath }),
      ...(this.headerName === undefined ? {} : { headerName: this.headerName }),
    };
  }
}

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
 * Failure branch returned by {@link safe}; after checking `isSuccess`, use `isDefined` to narrow the error.
 *
 * Tuple destructuring remains supported: `[error, undefined, isDefined, false]`.
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
 * Result returned by {@link safe}; narrow with `isSuccess` first, then `isDefined` on failure.
 *
 * Tuple destructuring remains supported: `[error, data, isDefined, isSuccess]`.
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
 * Narrow a typed failure error to its defined members; prefer `isSuccess` then `isDefined` on `safe` results.
 *
 * Use this predicate when you already have a typed error union. It preserves the
 * defined members of that union; it does not infer contract errors from `unknown`.
 *
 * @param error - Error value to test.
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
 * Resolve a promise into a result narrowed with `isSuccess` first, then `isDefined` on failure.
 *
 * Tuple destructuring remains supported: `[error, data, isDefined, isSuccess]`.
 * The named discriminants distinguish success, contract-defined errors and other
 * failures. A service-client promise preserves the contract error codes and data;
 * a bare promise without error typing has no statically reachable defined arm.
 *
 * @example
 * ```ts
 * import { baseContract } from '@netscript/contracts';
 * import { createServiceClient, safe } from '@netscript/sdk/client';
 * import { z } from 'zod';
 *
 * const contract = {
 *   getUser: baseContract
 *     .input(z.object({ id: z.string() }))
 *     .output(z.object({ name: z.string() })),
 * };
 * const client = createServiceClient({ contract, serviceName: 'users' });
 * const result = await safe(client.getUser({ id: 'user-1' }));
 * if (result.isSuccess) {
 *   console.log(result.data.name);
 * } else if (result.isDefined) {
 *   if (result.error.code === 'NOT_FOUND') {
 *     console.error(result.error.data.resourceType, result.error.data.resourceId);
 *   }
 * } else {
 *   throw result.error;
 * }
 * ```
 *
 * @param promise - Promise to resolve safely.
 * @returns Discriminated result with named properties and supported tuple destructuring.
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
