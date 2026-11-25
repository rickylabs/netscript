/**
 * Canonical invented `example.test` conformance dataset shared across directory adapters.
 *
 * @module
 */

/**
 * Seed user record used by {@link InMemoryDirectoryOptions} and {@link DIRECTORY_CONFORMANCE_DATASET}.
 *
 * @example
 * ```ts
 * import type { InMemoryDirectoryUser } from '@netscript/plugin-directory-core/testing';
 *
 * const user: InMemoryDirectoryUser = {
 *   immutableId: '20000000-0000-4000-8000-000000000001',
 *   enabled: true,
 *   displayName: 'Alice Example',
 *   userPrincipalName: 'alice@example.test',
 *   primaryGroupId: '10000000-0000-4000-8000-000000000001',
 * };
 * console.log(user.immutableId);
 * ```
 */
export type InMemoryDirectoryUser = Readonly<{
  /** Immutable user identifier (canonical UUID/GUID string). */
  immutableId: string;
  /** Whether the account is enabled. */
  enabled: boolean;
  /** Optional ISO-8601 UTC expiration instant. */
  expiresAt?: string;
  /** Optional display name attribute. */
  displayName?: string;
  /** Optional user principal name attribute. */
  userPrincipalName?: string;
  /** Optional email address attribute. */
  mail?: string;
  /** Optional short account login name attribute. */
  username?: string;
  /** Optional primary group `immutableId` (modeled separately from group `member` lists, as in AD). */
  primaryGroupId?: string;
}>;

/**
 * Seed group record used by {@link InMemoryDirectoryOptions} and {@link DIRECTORY_CONFORMANCE_DATASET}.
 *
 * @example
 * ```ts
 * import type { InMemoryDirectoryGroup } from '@netscript/plugin-directory-core/testing';
 *
 * const group: InMemoryDirectoryGroup = {
 *   immutableId: '10000000-0000-4000-8000-000000000002',
 *   displayName: 'Engineering',
 *   memberGroupIds: ['10000000-0000-4000-8000-000000000003'],
 * };
 * console.log(group.displayName);
 * ```
 */
export type InMemoryDirectoryGroup = Readonly<{
  /** Immutable group identifier (canonical UUID/GUID string). */
  immutableId: string;
  /** Human-readable group name attribute. */
  displayName: string;
  /** Optional group description attribute. */
  description?: string;
  /** Optional email address attribute. */
  mail?: string;
  /** Direct user `immutableId` members explicitly listed on this group. */
  memberUserIds?: readonly string[];
  /** Direct nested child group `immutableId` members explicitly listed on this group. */
  memberGroupIds?: readonly string[];
}>;

/**
 * Named identifiers and seed records for the canonical directory conformance dataset.
 *
 * @example
 * ```ts
 * import { DIRECTORY_CONFORMANCE_DATASET } from '@netscript/plugin-directory-core/testing';
 *
 * console.log(
 *   DIRECTORY_CONFORMANCE_DATASET.directoryInstance,
 *   DIRECTORY_CONFORMANCE_DATASET.users.length,
 *   DIRECTORY_CONFORMANCE_DATASET.groups.length,
 * );
 * ```
 */
export type DirectoryConformanceDataset = Readonly<{
  /** Logical directory instance identifier used across all conformance tests. */
  directoryInstance: string;
  /** Initial UTC clock timestamp for conformance execution. */
  initialTimeIso: string;
  /** Duration in milliseconds to advance the clock to expire `danaExpiringSoon`. */
  advanceToExpireMs: number;
  /** Canonical group immutable identifiers referenced by the conformance assertions. */
  groupIds: Readonly<{
    domainUsers: string;
    engParent: string;
    engChild: string;
    engLeaf: string;
    finance: string;
    cycleA: string;
    cycleB: string;
    opsAlpha: string;
    opsBeta: string;
    opsGamma: string;
    opsDelta: string;
    unknown: string;
  }>;
  /** Canonical user immutable identifiers referenced by the conformance assertions. */
  userIds: Readonly<{
    alice: string;
    bobDisabled: string;
    carolExpired: string;
    danaExpiringSoon: string;
    erinHostile: string;
    frank: string;
    grace: string;
    heidi: string;
    unknown: string;
  }>;
  /** Complete invented `example.test` user records to seed into an adapter under test. */
  users: readonly InMemoryDirectoryUser[];
  /** Complete invented `example.test` group records to seed into an adapter under test. */
  groups: readonly InMemoryDirectoryGroup[];
}>;

/** Initial UTC timestamp used when starting a conformance run. */
export const DIRECTORY_CONFORMANCE_INITIAL_TIME_ISO: string = '2026-06-01T12:00:00.000Z';

/** Milliseconds to advance the deterministic clock so `danaExpiringSoon` transitions to expired. */
export const DIRECTORY_CONFORMANCE_ADVANCE_EXPIRE_MS: number = 3_600_000;

const GROUP_IDS = {
  domainUsers: '10000000-0000-4000-8000-000000000001',
  engParent: '10000000-0000-4000-8000-000000000002',
  engChild: '10000000-0000-4000-8000-000000000003',
  engLeaf: '10000000-0000-4000-8000-000000000004',
  finance: '10000000-0000-4000-8000-000000000005',
  cycleA: '10000000-0000-4000-8000-000000000006',
  cycleB: '10000000-0000-4000-8000-000000000007',
  opsAlpha: '10000000-0000-4000-8000-000000000008',
  opsBeta: '10000000-0000-4000-8000-000000000009',
  opsGamma: '10000000-0000-4000-8000-000000000010',
  opsDelta: '10000000-0000-4000-8000-000000000011',
  unknown: '19999999-0000-4000-8000-000000000099',
} as const;

const USER_IDS = {
  alice: '20000000-0000-4000-8000-000000000001',
  bobDisabled: '20000000-0000-4000-8000-000000000002',
  carolExpired: '20000000-0000-4000-8000-000000000003',
  danaExpiringSoon: '20000000-0000-4000-8000-000000000004',
  erinHostile: '20000000-0000-4000-8000-000000000005',
  frank: '20000000-0000-4000-8000-000000000006',
  grace: '20000000-0000-4000-8000-000000000007',
  heidi: '20000000-0000-4000-8000-000000000008',
  unknown: '29999999-0000-4000-8000-000000000099',
} as const;

/**
 * Canonical invented dataset on `example.test` used by `runDirectoryConformanceSuite`.
 *
 * Covers direct, 3-level nested, cyclic, and AD-style primary-group membership,
 * disabled and expired accounts, hostile literal search characters, and multi-item pagination.
 */
export const DIRECTORY_CONFORMANCE_DATASET: DirectoryConformanceDataset = {
  directoryInstance: 'corp-example',
  initialTimeIso: DIRECTORY_CONFORMANCE_INITIAL_TIME_ISO,
  advanceToExpireMs: DIRECTORY_CONFORMANCE_ADVANCE_EXPIRE_MS,
  groupIds: GROUP_IDS,
  userIds: USER_IDS,
  users: [
    {
      immutableId: USER_IDS.alice,
      enabled: true,
      expiresAt: '2027-01-01T00:00:00.000Z',
      displayName: 'Alice Example',
      userPrincipalName: 'alice@example.test',
      mail: 'alice@example.test',
      username: 'alice',
      primaryGroupId: GROUP_IDS.domainUsers,
    },
    {
      immutableId: USER_IDS.bobDisabled,
      enabled: false,
      displayName: 'Bob Disabled',
      userPrincipalName: 'bob@example.test',
      mail: 'bob@example.test',
      username: 'bob',
      primaryGroupId: GROUP_IDS.domainUsers,
    },
    {
      immutableId: USER_IDS.carolExpired,
      enabled: true,
      expiresAt: '2026-05-01T00:00:00.000Z',
      displayName: 'Carol Expired',
      userPrincipalName: 'carol@example.test',
      mail: 'carol@example.test',
      username: 'carol',
      primaryGroupId: GROUP_IDS.domainUsers,
    },
    {
      immutableId: USER_IDS.danaExpiringSoon,
      enabled: true,
      expiresAt: '2026-06-01T13:00:00.000Z',
      displayName: 'Dana Example',
      userPrincipalName: 'dana@example.test',
      mail: 'dana@example.test',
      username: 'dana',
      primaryGroupId: GROUP_IDS.domainUsers,
    },
    {
      immutableId: USER_IDS.erinHostile,
      enabled: true,
      displayName: 'Erin (O*Connor) \\ Ops',
      userPrincipalName: 'erin@example.test',
      mail: 'erin@example.test',
      username: 'erin',
      primaryGroupId: GROUP_IDS.domainUsers,
    },
    {
      immutableId: USER_IDS.frank,
      enabled: true,
      displayName: 'Frank Example',
      userPrincipalName: 'frank@example.test',
      mail: 'frank@example.test',
      username: 'frank',
      primaryGroupId: GROUP_IDS.domainUsers,
    },
    {
      immutableId: USER_IDS.grace,
      enabled: true,
      displayName: 'Grace Example',
      userPrincipalName: 'grace@example.test',
      mail: 'grace@example.test',
      username: 'grace',
      primaryGroupId: GROUP_IDS.domainUsers,
    },
    {
      immutableId: USER_IDS.heidi,
      enabled: true,
      displayName: 'Heidi Example',
      userPrincipalName: 'heidi@example.test',
      mail: 'heidi@example.test',
      username: 'heidi',
      primaryGroupId: GROUP_IDS.domainUsers,
    },
  ],
  groups: [
    {
      immutableId: GROUP_IDS.domainUsers,
      displayName: 'Domain Users',
      description: 'Primary group assigned via primaryGroupId rather than explicit member entries.',
    },
    {
      immutableId: GROUP_IDS.engParent,
      displayName: 'Engineering',
      description: 'Top-level engineering group.',
      memberUserIds: [USER_IDS.bobDisabled, USER_IDS.carolExpired],
      memberGroupIds: [GROUP_IDS.engChild],
    },
    {
      immutableId: GROUP_IDS.engChild,
      displayName: 'Platform Team',
      description: 'Mid-tier nested engineering group.',
      memberGroupIds: [GROUP_IDS.engLeaf],
    },
    {
      immutableId: GROUP_IDS.engLeaf,
      displayName: 'Core Runtime Squad',
      description: 'Leaf engineering group with direct user members.',
      memberUserIds: [USER_IDS.alice],
    },
    {
      immutableId: GROUP_IDS.finance,
      displayName: 'Finance',
      description: 'Finance reviewers.',
      memberUserIds: [USER_IDS.bobDisabled, USER_IDS.carolExpired, USER_IDS.danaExpiringSoon],
    },
    {
      immutableId: GROUP_IDS.cycleA,
      displayName: 'Cycle Group A',
      description: 'Mutually nested with Cycle Group B.',
      memberGroupIds: [GROUP_IDS.cycleB],
    },
    {
      immutableId: GROUP_IDS.cycleB,
      displayName: 'Cycle Group B',
      description: 'Mutually nested with Cycle Group A.',
      memberUserIds: [USER_IDS.alice],
      memberGroupIds: [GROUP_IDS.cycleA],
    },
    {
      immutableId: GROUP_IDS.opsAlpha,
      displayName: 'Ops Alpha',
      description: 'Operations squad alpha.',
    },
    {
      immutableId: GROUP_IDS.opsBeta,
      displayName: 'Ops Beta',
      description: 'Operations squad beta.',
    },
    {
      immutableId: GROUP_IDS.opsGamma,
      displayName: 'Ops Gamma',
      description: 'Operations squad gamma.',
    },
    {
      immutableId: GROUP_IDS.opsDelta,
      displayName: 'Ops Delta',
      description: 'Operations squad delta.',
    },
  ],
};
