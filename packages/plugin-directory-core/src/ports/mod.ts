/**
 * Provider-neutral `DirectoryPort` contract, query/result shapes, clock port, deadline helpers,
 * and typed directory errors.
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
export { createSystemDirectoryClock } from './clock.ts';
export type { DirectoryClock } from './clock.ts';
export {
  assertDirectoryCallContext,
  classifyDirectoryAbortError,
  DIRECTORY_MAX_TIMEOUT_MS,
  resolveDirectoryTimeoutMs,
  runWithDirectoryDeadline,
} from './deadline.ts';
export type { DirectoryDeadlineParams } from './deadline.ts';
export {
  DIRECTORY_ERROR_CODES,
  DirectoryError,
  DirectoryTimeout,
  DirectoryUnauthorized,
  DirectoryUnavailable,
  DirectoryUnsupported,
  isDirectoryError,
} from './errors.ts';
export type { DirectoryErrorCode, DirectoryTimeoutOptions } from './errors.ts';

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
  /**
   * Searches users using a bounded mandatory `limit` and protocol-safe escaping.
   * Rejects with {@link DirectoryUnsupported} when `capabilities` does not include `'search'`.
   */
  searchUsers(q: SearchUsersQuery, ctx: CallContext): Promise<Page<DirectoryUser>>;
  /**
   * Searches groups using a bounded mandatory `limit` and protocol-safe escaping.
   * Rejects with {@link DirectoryUnsupported} when `capabilities` does not include `'search'`.
   */
  searchGroups(q: SearchGroupsQuery, ctx: CallContext): Promise<Page<DirectoryGroup>>;
  /**
   * Looks up one user by immutable reference or instance-scoped attribute.
   * Escapes all protocol metacharacters and fails closed (`undefined`) on blank selectors or
   * ambiguous secondary attribute matches.
   */
  getUser(ref: UserLookup, ctx: CallContext): Promise<DirectoryUser | undefined>;
  /**
   * Evaluates which candidate groups an active user belongs to.
   * Includes nested groups and groups nesting the user's primary group when
   * `capabilities.has('transitive-membership')`, or direct and direct primary-group membership
   * only otherwise. Disabled and expired users always evaluate to `[]`.
   */
  memberOfAny(q: MemberOfAnyQuery, ctx: CallContext): Promise<MemberOfAnyResult>;
  /**
   * Probes directory dependency health without exposing credentials or distinguished names.
   * Honors `ctx.timeoutMs` and `ctx.signal` (aborting throws `DirectoryTimeout` or
   * `DirectoryUnavailable` rather than returning `'unhealthy'`).
   */
  health(ctx: CallContext): Promise<DirectoryHealth>;
}
