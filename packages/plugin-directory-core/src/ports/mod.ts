/**
 * Provider-neutral `DirectoryPort` contract, query/result shapes, and typed directory errors.
 *
 * @example
 * ```ts
 * import {
 *   DirectoryUnsupported,
 *   type DirectoryPort,
 * } from '@netscript/plugin-directory-core/ports';
 *
 * declare const directory: DirectoryPort;
 *
 * if (!directory.capabilities.has('transitive-membership')) {
 *   throw new DirectoryUnsupported(
 *     directory.name,
 *     'memberOfAny',
 *     'Configured directory does not support transitive membership evaluation.',
 *   );
 * }
 * ```
 *
 * @module
 */

import type {
  CallContext,
  ConsistencyInfo,
  DirectoryCapability,
  DirectoryGroup,
  DirectoryHealth,
  DirectoryRef,
  DirectoryUser,
  Page,
  UserLookup,
} from '../domain/mod.ts';

export type {
  CallContext,
  ConsistencyInfo,
  ConsistencySource,
  DirectoryCapability,
  DirectoryConsistencyBudget,
  DirectoryGroup,
  DirectoryHealth,
  DirectoryHealthProbe,
  DirectoryHealthProbeStatus,
  DirectoryHealthStatus,
  DirectoryRef,
  DirectoryUser,
  Page,
  UserLookup,
} from '../domain/mod.ts';

/**
 * Input query accepted by {@link DirectoryPort.searchUsers}.
 *
 * @example
 * ```ts
 * import type { SearchUsersQuery } from '@netscript/plugin-directory-core/ports';
 *
 * const query: SearchUsersQuery = { text: 'alice', limit: 25 };
 * console.log(query.text, query.limit);
 * ```
 */
export type SearchUsersQuery = Readonly<{
  /** Free-text search term (adapters must escape all protocol metacharacters). */
  text: string;
  /** Mandatory positive integer page size, capped by the adapter ceiling. */
  limit: number;
}>;

/**
 * Input query accepted by {@link DirectoryPort.searchGroups}.
 *
 * @example
 * ```ts
 * import type { SearchGroupsQuery } from '@netscript/plugin-directory-core/ports';
 *
 * const query: SearchGroupsQuery = { text: 'Engineering', limit: 25 };
 * console.log(query.text, query.limit);
 * ```
 */
export type SearchGroupsQuery = Readonly<{
  /** Free-text search term (adapters must escape all protocol metacharacters). */
  text: string;
  /** Mandatory positive integer page size, capped by the adapter ceiling. */
  limit: number;
}>;

/**
 * Input query accepted by {@link DirectoryPort.memberOfAny}.
 *
 * Membership queries are always bounded to an explicit candidate group set instead of
 * enumerating all groups for a user.
 *
 * @example
 * ```ts
 * import type { MemberOfAnyQuery } from '@netscript/plugin-directory-core/ports';
 *
 * const query: MemberOfAnyQuery = {
 *   user: { directoryInstance: 'corp-example', immutableId: '20000000-0000-4000-8000-000000000001' },
 *   candidateGroupIds: ['10000000-0000-4000-8000-000000000002'],
 * };
 * console.log(query.candidateGroupIds.length);
 * ```
 */
export type MemberOfAnyQuery = Readonly<{
  /** Stable directory reference for the user being evaluated. */
  user: DirectoryRef;
  /** Bounded list of candidate group `immutableId` values to test membership against. */
  candidateGroupIds: readonly string[];
}>;

/**
 * Result returned by {@link DirectoryPort.memberOfAny}.
 *
 * @example
 * ```ts
 * import type { MemberOfAnyResult } from '@netscript/plugin-directory-core/ports';
 *
 * const result: MemberOfAnyResult = {
 *   memberOf: ['10000000-0000-4000-8000-000000000002'],
 *   evaluatedAt: '2026-06-01T12:00:00.000Z',
 *   consistency: { source: 'live', ageMs: 0 },
 * };
 * console.log(result.memberOf, result.consistency.source);
 * ```
 */
export type MemberOfAnyResult = Readonly<{
  /** Deduplicated subset of `candidateGroupIds` the active user belongs to. */
  memberOf: readonly string[];
  /** ISO-8601 UTC timestamp recording when membership was evaluated. */
  evaluatedAt: string;
  /** Consistency and staleness metadata for revocation-budget enforcement. */
  consistency: ConsistencyInfo;
}>;

/**
 * Provider-neutral directory query port implemented by LDAP/AD, Entra ID, SCIM, and test adapters.
 *
 * @example
 * ```ts
 * import type { DirectoryPort } from '@netscript/plugin-directory-core/ports';
 *
 * declare const directory: DirectoryPort;
 *
 * const users = await directory.searchUsers({ text: 'alice', limit: 10 }, { timeoutMs: 2_000 });
 * if (users.items[0]) {
 *   const membership = await directory.memberOfAny(
 *     {
 *       user: users.items[0].ref,
 *       candidateGroupIds: ['10000000-0000-4000-8000-000000000002'],
 *     },
 *     { timeoutMs: 2_000 },
 *   );
 *   console.log(membership.memberOf, membership.evaluatedAt);
 * }
 * ```
 */
export interface DirectoryPort {
  /** Stable adapter provider identifier (for example `'ldap'`, `'entra'`, `'scim'`, or `'memory'`). */
  readonly name: string;
  /** Capabilities supported by this adapter instance. */
  readonly capabilities: ReadonlySet<DirectoryCapability>;
  /** Searches users using a bounded mandatory `limit` and protocol-safe escaping. */
  searchUsers(q: SearchUsersQuery, ctx: CallContext): Promise<Page<DirectoryUser>>;
  /** Searches groups using a bounded mandatory `limit` and protocol-safe escaping. */
  searchGroups(q: SearchGroupsQuery, ctx: CallContext): Promise<Page<DirectoryGroup>>;
  /** Looks up one user by immutable reference or instance-scoped attribute. */
  getUser(ref: UserLookup, ctx: CallContext): Promise<DirectoryUser | undefined>;
  /** Evaluates which candidate groups an active user belongs to (including nested and primary groups). */
  memberOfAny(q: MemberOfAnyQuery, ctx: CallContext): Promise<MemberOfAnyResult>;
  /** Probes directory dependency health without exposing credentials or distinguished names. */
  health(ctx: CallContext): Promise<DirectoryHealth>;
}

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
 * Error thrown when a directory backend cannot be reached, fails TLS verification, or returns
 * a transient infrastructure/server error.
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
 * @param value - Unknown thrown value.
 * @returns `true` when `value` is an instance of {@link DirectoryError}.
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
  return value instanceof DirectoryError;
}
