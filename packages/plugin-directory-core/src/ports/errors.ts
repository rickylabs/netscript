/**
 * Typed directory errors and cross-realm error guard shared across all directory adapters.
 *
 * @module
 */

/**
 * Stable machine-readable error codes emitted by directory adapters.
 *
 * @example
 * ```ts
 * import { DIRECTORY_ERROR_CODES } from '@netscript/plugin-directory-core/ports';
 *
 * console.log(DIRECTORY_ERROR_CODES.timeout);
 * ```
 */
export const DIRECTORY_ERROR_CODES: Readonly<{
  unavailable: 'DIRECTORY_UNAVAILABLE';
  unauthorized: 'DIRECTORY_UNAUTHORIZED';
  timeout: 'DIRECTORY_TIMEOUT';
  unsupported: 'DIRECTORY_UNSUPPORTED';
}> = {
  unavailable: 'DIRECTORY_UNAVAILABLE',
  unauthorized: 'DIRECTORY_UNAUTHORIZED',
  timeout: 'DIRECTORY_TIMEOUT',
  unsupported: 'DIRECTORY_UNSUPPORTED',
};

/**
 * Union of machine-readable directory error codes.
 *
 * @example
 * ```ts
 * import type { DirectoryErrorCode } from '@netscript/plugin-directory-core/ports';
 *
 * const code: DirectoryErrorCode = 'DIRECTORY_UNAVAILABLE';
 * console.log(code);
 * ```
 */
export type DirectoryErrorCode = (typeof DIRECTORY_ERROR_CODES)[keyof typeof DIRECTORY_ERROR_CODES];

const VALID_DIRECTORY_ERROR_CODES: ReadonlySet<string> = new Set(
  Object.values(DIRECTORY_ERROR_CODES),
);

/**
 * Options accepted by {@link DirectoryTimeout}.
 *
 * @example
 * ```ts
 * import type { DirectoryTimeoutOptions } from '@netscript/plugin-directory-core/ports';
 *
 * const options: DirectoryTimeoutOptions = { timeoutMs: 2_000 };
 * console.log(options.timeoutMs);
 * ```
 */
export interface DirectoryTimeoutOptions extends ErrorOptions {
  /** Timeout budget in milliseconds that was exceeded, when known. */
  readonly timeoutMs?: number;
}

/**
 * Base typed error shared by {@link DirectoryUnavailable}, {@link DirectoryUnauthorized},
 * {@link DirectoryTimeout}, and {@link DirectoryUnsupported}.
 *
 * Security note: `options?.cause` is preserved verbatim and is NOT redacted; default runtime
 * inspectors print `cause`. Adapters MUST NOT pass raw upstream errors containing bind passwords,
 * tokens, or distinguished names as `cause`.
 *
 * @example
 * ```ts
 * import {
 *   DirectoryUnavailable,
 *   isDirectoryError,
 * } from '@netscript/plugin-directory-core/ports';
 *
 * const error = new DirectoryUnavailable('ldap', 'health', 'No configured hosts answered.');
 * console.log(isDirectoryError(error), error.code);
 * ```
 */
export class DirectoryError extends Error {
  /** Machine-readable classification for callers and telemetry. */
  readonly code: DirectoryErrorCode;
  /** Adapter name that produced the error. */
  readonly directoryName: string;
  /** Port operation that failed. */
  readonly operation: string;
  /** Redacted explanation containing no credentials or distinguished names. */
  readonly reason: string;

  /** Creates a typed directory error. */
  constructor(
    code: DirectoryErrorCode,
    directoryName: string,
    operation: string,
    reason: string,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'DirectoryError';
    this.code = code;
    this.directoryName = directoryName;
    this.operation = operation;
    this.reason = reason;
  }
}

/**
 * Error thrown when a directory backend cannot be reached, fails TLS verification, is aborted by
 * the caller, or returns a transient infrastructure/server error.
 *
 * @example
 * ```ts
 * import { DirectoryUnavailable } from '@netscript/plugin-directory-core/ports';
 *
 * const error = new DirectoryUnavailable(
 *   'ldap',
 *   'searchUsers',
 *   'All configured directory hosts failed connection or TLS handshake.',
 * );
 * console.log(error.name, error.code);
 * ```
 */
export class DirectoryUnavailable extends DirectoryError {
  /** Creates a directory-unavailable error. */
  constructor(
    directoryName: string,
    operation: string,
    reason: string,
    options?: ErrorOptions,
  ) {
    super(
      DIRECTORY_ERROR_CODES.unavailable,
      directoryName,
      operation,
      reason,
      `${directoryName} is unavailable during ${operation}: ${reason}`,
      options,
    );
    this.name = 'DirectoryUnavailable';
  }
}

/**
 * Error thrown when the directory rejects service-account authentication or denies read access.
 *
 * @example
 * ```ts
 * import { DirectoryUnauthorized } from '@netscript/plugin-directory-core/ports';
 *
 * const error = new DirectoryUnauthorized(
 *   'ldap',
 *   'getUser',
 *   'Service-account bind credentials were rejected.',
 * );
 * console.log(error.name, error.code);
 * ```
 */
export class DirectoryUnauthorized extends DirectoryError {
  /** Creates a directory-unauthorized error. */
  constructor(
    directoryName: string,
    operation: string,
    reason: string,
    options?: ErrorOptions,
  ) {
    super(
      DIRECTORY_ERROR_CODES.unauthorized,
      directoryName,
      operation,
      reason,
      `${directoryName} rejected authorization for ${operation}: ${reason}`,
      options,
    );
    this.name = 'DirectoryUnauthorized';
  }
}

/**
 * Error thrown when a directory call exceeds its caller or server timeout budget.
 *
 * @example
 * ```ts
 * import { DirectoryTimeout } from '@netscript/plugin-directory-core/ports';
 *
 * const error = new DirectoryTimeout(
 *   'ldap',
 *   'memberOfAny',
 *   'Directory query exceeded the 2000ms timeout budget.',
 *   { timeoutMs: 2_000 },
 * );
 * console.log(error.name, error.timeoutMs);
 * ```
 */
export class DirectoryTimeout extends DirectoryError {
  /** Timeout budget in milliseconds that elapsed, when known. */
  readonly timeoutMs?: number;

  /** Creates a directory-timeout error. */
  constructor(
    directoryName: string,
    operation: string,
    reason: string,
    options?: DirectoryTimeoutOptions,
  ) {
    super(
      DIRECTORY_ERROR_CODES.timeout,
      directoryName,
      operation,
      reason,
      `${directoryName} timed out during ${operation}: ${reason}`,
      options,
    );
    this.name = 'DirectoryTimeout';
    this.timeoutMs = options?.timeoutMs;
  }
}

/**
 * Error thrown when a requested operation or capability is outside an adapter's upstream boundary.
 *
 * Follows the `AuthBackendOperationUnsupportedError` pattern: adapters fail explicitly instead
 * of silently falling back to partial semantics.
 *
 * @example
 * ```ts
 * import { DirectoryUnsupported } from '@netscript/plugin-directory-core/ports';
 *
 * const error = new DirectoryUnsupported(
 *   'ldap',
 *   'memberOfAny',
 *   'Server does not support transitive in-chain matching.',
 * );
 * console.log(error.name, error.directoryName, error.operation);
 * ```
 */
export class DirectoryUnsupported extends DirectoryError {
  /** Creates a directory-unsupported error. */
  constructor(
    directoryName: string,
    operation: string,
    reason: string,
    options?: ErrorOptions,
  ) {
    super(
      DIRECTORY_ERROR_CODES.unsupported,
      directoryName,
      operation,
      reason,
      `${directoryName} does not support ${operation}: ${reason}`,
      options,
    );
    this.name = 'DirectoryUnsupported';
  }
}

/**
 * Type guard that narrows an unknown caught value to {@link DirectoryError}.
 *
 * Matches both direct `instanceof DirectoryError` instances and structurally equivalent
 * `DirectoryError` instances across duplicate package copies or realms by validating `code`,
 * `directoryName`, `operation`, and `reason`.
 *
 * @param value - Unknown thrown value.
 * @returns `true` when `value` is a {@link DirectoryError}.
 *
 * @example
 * ```ts
 * import { DirectoryTimeout, isDirectoryError } from '@netscript/plugin-directory-core/ports';
 *
 * const err: unknown = new DirectoryTimeout('ldap', 'searchUsers', 'Timed out.');
 * if (isDirectoryError(err)) {
 *   console.log(err.code, err.directoryName);
 * }
 * ```
 */
export function isDirectoryError(value: unknown): value is DirectoryError {
  if (value instanceof DirectoryError) {
    return true;
  }
  if (!(value instanceof Error)) {
    return false;
  }
  const candidate = value as Partial<DirectoryError>;
  return (
    typeof candidate.code === 'string' &&
    VALID_DIRECTORY_ERROR_CODES.has(candidate.code) &&
    typeof candidate.directoryName === 'string' &&
    typeof candidate.operation === 'string' &&
    typeof candidate.reason === 'string'
  );
}
