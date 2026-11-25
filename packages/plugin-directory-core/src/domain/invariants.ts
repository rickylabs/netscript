/**
 * Directory domain invariants: bounded search limits, fail-closed account liveness,
 * and revocation-budget arithmetic.
 *
 * @module
 */

import type { DirectoryConsistencyBudget, DirectoryUser } from './entities.ts';

/** Minimum positive page size accepted by bounded directory searches. */
export const DIRECTORY_MIN_SEARCH_LIMIT: number = 1;

/** Default upper bound applied to directory search page sizes when an adapter sets no tighter cap. */
export const DIRECTORY_MAX_SEARCH_LIMIT: number = 100;

/**
 * Validates and caps a mandatory directory search `limit`.
 *
 * Rejects missing, non-integer, non-finite, or non-positive values with a `RangeError`
 * so callers cannot request unbounded scans, and caps larger values to `maxLimit`.
 *
 * @param limit - Caller-requested page limit (must be a finite integer >= 1).
 * @param maxLimit - Adapter ceiling in records (defaults to {@link DIRECTORY_MAX_SEARCH_LIMIT}).
 * @returns Effective bounded limit in `[1, maxLimit]`.
 *
 * @example
 * ```ts
 * import { normalizeDirectorySearchLimit } from '@netscript/plugin-directory-core/domain';
 *
 * const applied = normalizeDirectorySearchLimit(500, 50);
 * console.log(applied); // 50
 * ```
 */
export function normalizeDirectorySearchLimit(
  limit: number,
  maxLimit: number = DIRECTORY_MAX_SEARCH_LIMIT,
): number {
  if (!Number.isInteger(maxLimit) || maxLimit < DIRECTORY_MIN_SEARCH_LIMIT) {
    throw new RangeError(
      `Directory max search limit must be a finite integer >= ${DIRECTORY_MIN_SEARCH_LIMIT}.`,
    );
  }
  if (!Number.isInteger(limit) || limit < DIRECTORY_MIN_SEARCH_LIMIT) {
    throw new RangeError(
      `Directory search limit must be a finite integer >= ${DIRECTORY_MIN_SEARCH_LIMIT}.`,
    );
  }
  return Math.min(limit, maxLimit);
}

/**
 * Evaluates whether a directory user account is active at `nowMs`.
 *
 * Fails closed: returns `false` when `user.enabled` is false, when `user.expiresAt` is
 * unparseable, or when `Date.parse(user.expiresAt) <= nowMs`.
 *
 * @param user - Normalized directory user record.
 * @param nowMs - Current epoch timestamp in milliseconds.
 * @returns `true` only when the account is enabled and not expired.
 *
 * @example
 * ```ts
 * import {
 *   isDirectoryUserActive,
 *   type DirectoryUser,
 * } from '@netscript/plugin-directory-core/domain';
 *
 * const user: DirectoryUser = {
 *   ref: { directoryInstance: 'corp-example', immutableId: '20000000-0000-4000-8000-000000000001' },
 *   immutableId: '20000000-0000-4000-8000-000000000001',
 *   enabled: true,
 *   expiresAt: '2026-06-01T13:00:00.000Z',
 * };
 * console.log(isDirectoryUserActive(user, Date.parse('2026-06-01T12:00:00.000Z'))); // true
 * console.log(isDirectoryUserActive(user, Date.parse('2026-06-01T13:00:00.000Z'))); // false
 * ```
 */
export function isDirectoryUserActive(user: DirectoryUser, nowMs: number): boolean {
  if (!Number.isFinite(nowMs)) {
    return false;
  }
  if (!user.enabled) {
    return false;
  }
  if (user.expiresAt !== undefined) {
    const expiresAtMs = Date.parse(user.expiresAt);
    if (!Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs) {
      return false;
    }
  }
  return true;
}

/**
 * Computes the effective revocation bound (`replicationAllowanceMs + membershipCacheTtlMs`).
 *
 * Rejects negative or non-finite budget fields with a `RangeError`.
 *
 * @param budget - Directory consistency budget fields.
 * @returns Effective revocation window in milliseconds.
 *
 * @example
 * ```ts
 * import { computeRevocationBoundMs } from '@netscript/plugin-directory-core/domain';
 *
 * const boundMs = computeRevocationBoundMs({
 *   replicationAllowanceMs: 15_000,
 *   membershipCacheTtlMs: 45_000,
 *   maxStalenessMs: 90_000,
 * });
 * console.log(boundMs); // 60000
 * ```
 */
export function computeRevocationBoundMs(budget: DirectoryConsistencyBudget): number {
  const fields: ReadonlyArray<readonly [string, number]> = [
    ['replicationAllowanceMs', budget.replicationAllowanceMs],
    ['membershipCacheTtlMs', budget.membershipCacheTtlMs],
    ['maxStalenessMs', budget.maxStalenessMs],
  ];
  for (const [name, value] of fields) {
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError(`Directory consistency budget "${name}" must be a finite number >= 0.`);
    }
  }
  return budget.replicationAllowanceMs + budget.membershipCacheTtlMs;
}
