/**
 * Curated root exports for `@netscript/plugin-directory-core`.
 *
 * @module
 */

export {
  computeRevocationBoundMs,
  DIRECTORY_MAX_SEARCH_LIMIT,
  DIRECTORY_MIN_SEARCH_LIMIT,
  isDirectoryUserActive,
  normalizeDirectorySearchLimit,
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
export {
  DIRECTORY_ERROR_CODES,
  DirectoryError,
  DirectoryTimeout,
  DirectoryUnauthorized,
  DirectoryUnavailable,
  DirectoryUnsupported,
  isDirectoryError,
} from '../ports/mod.ts';
export type {
  DirectoryErrorCode,
  DirectoryPort,
  DirectoryTimeoutOptions,
  MemberOfAnyQuery,
  MemberOfAnyResult,
  SearchGroupsQuery,
  SearchUsersQuery,
} from '../ports/mod.ts';
