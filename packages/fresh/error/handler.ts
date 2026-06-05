/**
 * Error Handling Utilities for Fresh 2 + oRPC
 *
 * SOLID error handling using ONLY built-in types from:
 * - Deno (Error)
 * - Fresh (HttpError)
 * - oRPC (via safe() and isDefinedError() from SDK)
 *
 * Philosophy: KISS - Keep error handling simple and consistent
 */

import { HttpError } from 'fresh';
import { isDefinedError } from '@netscript/sdk/client';

// ============================================================================
// TYPES - Based on HTTP standards and oRPC/Fresh built-ins
// ============================================================================

/**
 * Error type classification based on HTTP status codes
 * - client: 4xx errors (client mistakes, don't retry without changes)
 * - server: 5xx errors (server issues, can retry)
 * - unknown: Other errors
 */
export type ErrorType = 'client' | 'server' | 'unknown';

/**
 * Normalized error data for UI rendering
 * Based on HTTP standards and oRPC error structure
 */
export interface ErrorData {
  /** User-facing message derived from the source error. */
  message: string;
  /** HTTP status associated with the error. */
  status: number;
  /** Optional machine-readable code. */
  code?: string;
  /** HTTP-derived error classification. */
  type: ErrorType;
  /** Whether retry affordances should be shown. */
  retry: boolean;
  /** Unix epoch timestamp in milliseconds. */
  timestamp: number;
}

// ============================================================================
// ERROR TYPE CLASSIFICATION - Following HTTP Standards
// ============================================================================

/**
 * Classify error type based on HTTP status code
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 * - 4xx: Client errors (bad request, auth, not found, etc.)
 * - 5xx: Server errors (internal error, unavailable, etc.)
 */
export function classifyErrorType(status: number): ErrorType {
  if (status >= 400 && status < 500) {
    return 'client';
  }
  if (status >= 500 && status < 600) {
    return 'server';
  }
  return 'unknown';
}

/**
 * Determine if an error is retryable based on HTTP status and type
 *
 * Server errors (5xx) are generally retryable (transient issues)
 * Client errors (4xx) are NOT retryable without fixing the request
 * Exception: Rate limiting (429) and timeouts (408) can be retried
 */
export function isRetryable(status: number, type: ErrorType): boolean {
  // Rate limit - retry after waiting
  if (status === 429) return true;

  // Request timeout - can retry
  if (status === 408) return true;

  // Server errors are typically transient and worth retrying
  if (type === 'server') return true;

  // Client errors won't succeed on retry without changes
  return false;
}

/**
 * Get user-friendly default message for HTTP status codes
 */
export function getDefaultMessage(status: number): string {
  // Standard HTTP status messages
  switch (status) {
    // 4xx Client Errors
    case 400:
      return 'Invalid request';
    case 401:
      return 'Authentication required';
    case 403:
      return 'Access denied';
    case 404:
      return 'Resource not found';
    case 408:
      return 'Request timeout';
    case 422:
      return 'Validation failed';
    case 429:
      return 'Too many requests';

    // 5xx Server Errors
    case 500:
      return 'Internal server error';
    case 502:
      return 'Bad gateway';
    case 503:
      return 'Service unavailable';
    case 504:
      return 'Gateway timeout';

    default: {
      const type = classifyErrorType(status);
      return type === 'server' ? 'Server error' : 'Request failed';
    }
  }
}

// ============================================================================
// ERROR EXTRACTION - Using Fresh and oRPC Built-ins
// ============================================================================

/**
 * Extract error details from any error type
 * Handles: Error, HttpError (Fresh), oRPC errors (via isDefinedError)
 * Returns normalized ErrorData for consistent UI rendering
 *
 * @param error - Any error object (Error, HttpError, oRPC defined error)
 * @returns Normalized error data with HTTP-standard classification
 */
export function extractErrorData(error: unknown): ErrorData {
  const timestamp = Date.now();

  // Handle Fresh HttpError
  if (error instanceof HttpError) {
    const type = classifyErrorType(error.status);
    return {
      message: error.message || getDefaultMessage(error.status),
      status: error.status,
      code: `HTTP_${error.status}`,
      type,
      retry: isRetryable(error.status, type),
      timestamp,
    };
  }

  // Handle oRPC defined errors (type-safe errors from contracts)
  if (error && typeof error === 'object' && isDefinedError(error)) {
    const orpcError = error as {
      code?: string;
      status?: number;
      message?: string;
      data?: unknown;
    };

    const status = orpcError.status ?? 500;
    const code = orpcError.code ?? 'ORPC_ERROR';
    const type = classifyErrorType(status);

    return {
      message: orpcError.message || getDefaultMessage(status),
      status,
      code,
      type,
      retry: isRetryable(status, type),
      timestamp,
    };
  }

  // Handle standard Error (fallback for unknown oRPC errors)
  if (error instanceof Error) {
    // Duck-type check for oRPC error properties
    const orpcError = error as Error & {
      code?: string;
      status?: number;
    };

    const status = orpcError.status ?? 500;
    const code = orpcError.code ?? 'INTERNAL_ERROR';
    const type = classifyErrorType(status);

    return {
      message: error.message || getDefaultMessage(status),
      status,
      code,
      type,
      retry: isRetryable(status, type),
      timestamp,
    };
  }

  // Unknown error type - treat as server error (5xx)
  const type = 'server';
  return {
    message: 'An unexpected error occurred',
    status: 500,
    code: 'UNKNOWN_ERROR',
    type,
    retry: isRetryable(500, type),
    timestamp,
  };
}

// ============================================================================
// ERROR HANDLER - Dependency Inversion Principle
// ============================================================================

/**
 * Result type for error handlers
 * - With fallback: T | { error: ErrorData; data: T }
 * - Without fallback: T | { error: ErrorData }
 */
export type LoaderResult<T, HasFallback extends boolean = true> = HasFallback extends true
  ? T | { error: ErrorData; data: T }
  : T | { error: ErrorData };

/**
 * Handle errors with fallback data
 */
export function errorHandler<T>(
  loader: () => Promise<T>,
  fallback: T,
): () => Promise<LoaderResult<T, true>>;

/**
 * Handle errors without fallback (for pages that show full error UI)
 */
export function errorHandler<T>(
  loader: () => Promise<T>,
): () => Promise<LoaderResult<T, false>>;

/**
 * Implementation
 */
export function errorHandler<T>(
  loader: () => Promise<T>,
  fallback?: T,
): () => Promise<LoaderResult<T, boolean>> {
  return async () => {
    try {
      return await loader();
    } catch (error) {
      const errorData = extractErrorData(error);

      console.error('❌ Loader error:', {
        message: errorData.message,
        status: errorData.status,
        code: errorData.code,
        type: errorData.type,
        retry: errorData.retry,
        timestamp: new Date(errorData.timestamp).toISOString(),
      });

      // Return error with optional fallback data
      if (fallback !== undefined) {
        return {
          error: errorData,
          data: fallback,
        };
      } else {
        return {
          error: errorData,
        };
      }
    }
  };
}

// ============================================================================
// TYPE GUARDS - Interface Segregation Principle
// ============================================================================

/**
 * Check if loader result contains an error (with fallback)
 */
export function hasError<T>(
  result: LoaderResult<T, true>,
): result is { error: ErrorData; data: T };

/**
 * Check if loader result contains an error (without fallback)
 */
export function hasError<T>(
  result: LoaderResult<T, false>,
): result is { error: ErrorData };

/**
 * Implementation
 */
export function hasError<T>(
  result: LoaderResult<T, boolean>,
): result is { error: ErrorData } | { error: ErrorData; data: T } {
  return typeof result === 'object' && result !== null && 'error' in result;
}

// ============================================================================
// DATA EXTRACTION - Type-safe parsing without assertions
// ============================================================================

/**
 * Extract success data from LoaderResult (without fallback)
 * Use this when you've already checked hasError() and know the result is success
 *
 * @example
 * ```ts
 * const result = await loader(ctx);
 * if (hasError(result)) {
 *   return <ErrorUI error={result.error} />;
 * }
 * const data = extractData(result); // Typed as T
 * return <SuccessUI {...data} />;
 * ```
 */
export function extractData<T>(result: LoaderResult<T, false>): T {
  if (hasError(result)) {
    throw new Error('Cannot extract data from error result. Check hasError() first.');
  }
  return result as T;
}

/**
 * Extract success data from LoaderResult (with fallback)
 * Use this when you've already checked hasError() and know the result is success
 *
 * @example
 * ```ts
 * const result = await loader(ctx);
 * if (hasError(result)) {
 *   const { error, data } = extractErrorWithFallback(result);
 *   return <PartialErrorUI error={error} fallbackData={data} />;
 * }
 * const data = extractData(result); // Typed as T
 * return <SuccessUI {...data} />;
 * ```
 */
export function extractDataWithFallback<T>(result: LoaderResult<T, true>): T {
  if (hasError(result)) {
    return result.data;
  }
  return result as T;
}

/**
 * Extract error and fallback data from LoaderResult (with fallback)
 * Use this when hasError() is true and you want both error and fallback data
 *
 * @example
 * ```ts
 * const result = await loader(ctx);
 * if (hasError(result)) {
 *   const { error, data } = extractErrorWithFallback(result);
 *   return <PartialErrorUI error={error} fallbackData={data} />;
 * }
 * ```
 */
export function extractErrorWithFallback<T>(
  result: LoaderResult<T, true>,
): { error: ErrorData; data: T } {
  if (!hasError(result)) {
    throw new Error('Cannot extract error from success result. Check hasError() first.');
  }
  return result as { error: ErrorData; data: T };
}

/**
 * Safe data parser - returns either success data or null
 * Use this when you want to handle success/error inline without branching
 *
 * @example
 * ```ts
 * const result = await loader(ctx);
 * const data = safeParseData(result);
 * if (!data) {
 *   return <ErrorUI error={result.error} />;
 * }
 * return <SuccessUI {...data} />;
 * ```
 */
export function safeParseData<T>(result: LoaderResult<T, false>): T | null {
  if (hasError(result)) {
    return null;
  }
  return result as T;
}

/**
 * Safe data parser with fallback - always returns data (either success or fallback)
 * Use this when you always want to show something, even on error
 *
 * @example
 * ```ts
 * const result = await loader(ctx);
 * const data = safeParseDataWithFallback(result);
 * const error = hasError(result) ? result.error : null;
 * return <UI data={data} error={error} />;
 * ```
 */
export function safeParseDataWithFallback<T>(result: LoaderResult<T, true>): T {
  if (hasError(result)) {
    return result.data;
  }
  return result as T;
}
