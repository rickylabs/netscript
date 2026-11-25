/**
 * Directory domain invariants: bounded search limits, fail-closed account liveness,
 * and revocation-budget arithmetic.
 *
 * @module
 */

import type { DirectoryConsistencyBudget } from './consistency.ts';
import type { DirectoryUser } from './entities.ts';

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

const RFC3339_WITH_OFFSET_RE =
  /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:[Zz]|([+-])(\d{2}):(\d{2}))$/;

function parseStrictRfc3339Ms(value: string): number | undefined {
  const match = RFC3339_WITH_OFFSET_RE.exec(value);
  if (!match) {
    return undefined;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  if (
    month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59
  ) {
    return undefined;
  }
  if (match[8] !== undefined && match[9] !== undefined) {
    const offsetHour = Number(match[8]);
    const offsetMinute = Number(match[9]);
    if (offsetHour > 23 || offsetMinute > 59) {
      return undefined;
    }
  }
  const calendarCheck = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarCheck.getUTCFullYear() !== year ||
    calendarCheck.getUTCMonth() !== month - 1 ||
    calendarCheck.getUTCDate() !== day
  ) {
    return undefined;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Evaluates whether a directory user account is active at `nowMs`.
 *
 * Fails closed: returns `false` unless `user.enabled === true` and, when `user.expiresAt` is
 * present, `user.expiresAt` is a valid RFC 3339 timestamp with explicit timezone (`Z` or
 * `±HH:MM`) strictly in the future relative to `nowMs`.
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
  if (user.enabled !== true) {
    return false;
  }
  if (user.expiresAt !== undefined) {
    if (typeof user.expiresAt !== 'string') {
      return false;
    }
    const expiresAtMs = parseStrictRfc3339Ms(user.expiresAt);
    if (expiresAtMs === undefined || expiresAtMs <= nowMs) {
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
