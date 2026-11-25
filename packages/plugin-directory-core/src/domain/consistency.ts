/**
 * Consistency, freshness, and revocation-budget value types for directory membership evaluations.
 *
 * @module
 */

/**
 * Origin of a membership evaluation result.
 *
 * @example
 * ```ts
 * import type { ConsistencySource } from '@netscript/plugin-directory-core/domain';
 *
 * const source: ConsistencySource = 'live';
 * console.log(source);
 * ```
 */
export type ConsistencySource = 'live' | 'cache';

/**
 * Freshness metadata returned alongside every `memberOfAny` evaluation.
 *
 * @example
 * ```ts
 * import type { ConsistencyInfo } from '@netscript/plugin-directory-core/domain';
 *
 * const consistency: ConsistencyInfo = { source: 'live', ageMs: 0 };
 * console.log(consistency.source, consistency.ageMs);
 * ```
 */
export type ConsistencyInfo = Readonly<{
  /** Whether the evaluation came directly from the directory or from a cache. */
  source: ConsistencySource;
  /** Age of the evaluated result in milliseconds (`0` for live directory queries). */
  ageMs: number;
}>;

/**
 * Revocation and staleness budget configuration for directory membership consumers.
 *
 * `revocation_bound = replicationAllowanceMs + membershipCacheTtlMs`.
 *
 * @example
 * ```ts
 * import {
 *   computeRevocationBoundMs,
 *   type DirectoryConsistencyBudget,
 * } from '@netscript/plugin-directory-core/domain';
 *
 * const budget: DirectoryConsistencyBudget = {
 *   replicationAllowanceMs: 30_000,
 *   membershipCacheTtlMs: 60_000,
 *   maxStalenessMs: 120_000,
 * };
 * console.log(computeRevocationBoundMs(budget));
 * ```
 */
export type DirectoryConsistencyBudget = Readonly<{
  /** Expected directory replication lag allowance in milliseconds. */
  replicationAllowanceMs: number;
  /** Maximum membership cache TTL in milliseconds. */
  membershipCacheTtlMs: number;
  /** Maximum acceptable result staleness in milliseconds. */
  maxStalenessMs: number;
}>;
