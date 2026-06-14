import { extractErrorData } from './extract.ts';
import type { ErrorData } from './types.ts';

/** Loader result returned by `errorHandler()`. */
export type LoaderResult<T, HasFallback extends boolean = true> = HasFallback extends true
  ? T | { error: ErrorData; data: T }
  : T | { error: ErrorData };

/** Wrap a loader and return fallback data when it throws. */
export function errorHandler<T>(
  loader: () => Promise<T>,
  fallback: T,
): () => Promise<LoaderResult<T, true>>;

/** Wrap a loader and return only normalized error data when it throws. */
export function errorHandler<T>(
  loader: () => Promise<T>,
): () => Promise<LoaderResult<T, false>>;

/** Wrap a loader with Fresh error normalization. */
export function errorHandler<T>(
  loader: () => Promise<T>,
  fallback?: T,
): () => Promise<LoaderResult<T, boolean>> {
  return async () => {
    try {
      return await loader();
    } catch (error) {
      const errorData = extractErrorData(error);
      if (fallback !== undefined) {
        return { error: errorData, data: fallback };
      }
      return { error: errorData };
    }
  };
}

/** Return whether a loader result contains normalized error data and fallback data. */
export function hasError<T>(
  result: LoaderResult<T, true>,
): result is { error: ErrorData; data: T };

/** Return whether a loader result contains normalized error data. */
export function hasError<T>(
  result: LoaderResult<T, false>,
): result is { error: ErrorData };

/** Return whether a loader result contains normalized error data. */
export function hasError<T>(
  result: LoaderResult<T, boolean>,
): result is { error: ErrorData } | { error: ErrorData; data: T } {
  return typeof result === 'object' && result !== null && 'error' in result;
}

/** Extract success data after the caller has checked `hasError()`. */
export function extractData<T>(result: LoaderResult<T, false>): T {
  if (hasError(result)) {
    throw new Error('Cannot extract data from error result. Check hasError() first.');
  }
  return result as T;
}

/** Extract fallback data from an errored loader result. */
export function extractDataWithFallback<T>(result: LoaderResult<T, true>): T {
  if (hasError(result)) {
    return result.data;
  }
  return result as T;
}

/** Extract normalized error data and fallback data from an errored loader result. */
export function extractErrorWithFallback<T>(
  result: LoaderResult<T, true>,
): { error: ErrorData; data: T } {
  if (!hasError(result)) {
    throw new Error('Cannot extract error from success result. Check hasError() first.');
  }
  return result;
}

/** Return success data or `null` when the loader result contains an error. */
export function safeParseData<T>(result: LoaderResult<T, false>): T | null {
  if (hasError(result)) {
    return null;
  }
  return result as T;
}

/** Return success data or fallback data from a loader result. */
export function safeParseDataWithFallback<T>(result: LoaderResult<T, true>): T {
  if (hasError(result)) {
    return result.data;
  }
  return result as T;
}
