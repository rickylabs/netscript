/**
 * Provider-neutral directory domain types, bounded search limits, consistency metadata,
 * health shapes, and fail-closed account predicates.
 *
 * @example
 * ```ts
 * import {
 *   isDirectoryUserActive,
 *   normalizeDirectorySearchLimit,
 *   type DirectoryUser,
 * } from '@netscript/plugin-directory-core/domain';
 *
 * const user: DirectoryUser = {
 *   ref: { directoryInstance: 'corp-example', immutableId: '20000000-0000-4000-8000-000000000001' },
 *   immutableId: '20000000-0000-4000-8000-000000000001',
 *   enabled: true,
 *   displayName: 'Alice Example',
 * };
 * const effectiveLimit = normalizeDirectorySearchLimit(250);
 * const active = isDirectoryUserActive(user, Date.parse('2026-06-01T12:00:00.000Z'));
 * console.log(effectiveLimit, active);
 * ```
 *
 * @module
 */

export type {
  ConsistencyInfo,
  ConsistencySource,
  DirectoryConsistencyBudget,
} from './consistency.ts';
export type {
  CallContext,
  DirectoryCapability,
  DirectoryGroup,
  DirectoryRef,
  DirectoryUser,
  Page,
  UserLookup,
} from './entities.ts';
export type {
  DirectoryHealth,
  DirectoryHealthProbe,
  DirectoryHealthProbeStatus,
  DirectoryHealthStatus,
} from './health.ts';
export {
  computeRevocationBoundMs,
  DIRECTORY_MAX_SEARCH_LIMIT,
  DIRECTORY_MIN_SEARCH_LIMIT,
  isDirectoryUserActive,
  normalizeDirectorySearchLimit,
} from './invariants.ts';
