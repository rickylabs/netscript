/**
 * Testing primitives for directory adapters: deterministic clock, in-memory `DirectoryPort`,
 * canonical `example.test` conformance dataset, and one-call conformance suite.
 *
 * @example
 * ```ts
 * import {
 *   createDeterministicClock,
 *   createInMemoryDirectoryPort,
 *   DIRECTORY_CONFORMANCE_DATASET,
 * } from '@netscript/plugin-directory-core/testing';
 *
 * const clock = createDeterministicClock(DIRECTORY_CONFORMANCE_DATASET.initialTimeIso);
 * const directory = createInMemoryDirectoryPort({
 *   directoryInstance: DIRECTORY_CONFORMANCE_DATASET.directoryInstance,
 *   clock,
 *   users: DIRECTORY_CONFORMANCE_DATASET.users,
 *   groups: DIRECTORY_CONFORMANCE_DATASET.groups,
 * });
 * const res = await directory.memberOfAny(
 *   {
 *     user: {
 *       directoryInstance: DIRECTORY_CONFORMANCE_DATASET.directoryInstance,
 *       immutableId: DIRECTORY_CONFORMANCE_DATASET.userIds.alice,
 *     },
 *     candidateGroupIds: [DIRECTORY_CONFORMANCE_DATASET.groupIds.engParent],
 *   },
 *   {},
 * );
 * console.log(res.memberOf, res.evaluatedAt);
 * ```
 *
 * @module
 */

export type {
  CallContext,
  ConsistencyInfo,
  ConsistencySource,
  DirectoryCapability,
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
export type {
  DirectoryPort,
  MemberOfAnyQuery,
  MemberOfAnyResult,
  SearchGroupsQuery,
  SearchUsersQuery,
} from '../ports/mod.ts';
export {
  createDeterministicClock,
  createSystemDirectoryClock,
  DEFAULT_DETERMINISTIC_CLOCK_ISO,
} from './clock.ts';
export type { DeterministicDirectoryClock, DirectoryClock } from './clock.ts';
export {
  DIRECTORY_CONFORMANCE_ADVANCE_EXPIRE_MS,
  DIRECTORY_CONFORMANCE_DATASET,
  DIRECTORY_CONFORMANCE_INITIAL_TIME_ISO,
} from './conformance-dataset.ts';
export type {
  DirectoryConformanceDataset,
  InMemoryDirectoryGroup,
  InMemoryDirectoryUser,
} from './conformance-dataset.ts';
export { createInMemoryDirectoryPort } from './memory-directory.ts';
export type { DirectoryOperationName, InMemoryDirectoryOptions } from './memory-directory.ts';
export { runDirectoryConformanceSuite, verifyDirectoryConformance } from './conformance.ts';
export type {
  DirectoryConformanceCaseResult,
  DirectoryConformanceFixture,
  DirectoryConformanceReport,
  DirectoryConformanceSuiteOptions,
} from './conformance.ts';
