/**
 * In-memory `DirectoryPort` test double with deterministic time, nested and primary-group
 * evaluation, bounded search truncation, exact-id semantics, and controllable failure/timeout hooks.
 *
 * @module
 */

import {
  type CallContext,
  DIRECTORY_MAX_SEARCH_LIMIT,
  type DirectoryCapability,
  type DirectoryGroup,
  type DirectoryHealth,
  type DirectoryHealthProbe,
  type DirectoryHealthStatus,
  type DirectoryUser,
  isDirectoryUserActive,
  normalizeDirectorySearchLimit,
  type Page,
  type UserLookup,
} from '../domain/mod.ts';
import {
  assertDirectoryCallContext,
  type DirectoryClock,
  type DirectoryPort,
  DirectoryUnsupported,
  type MemberOfAnyQuery,
  type MemberOfAnyResult,
  runWithDirectoryDeadline,
  type SearchGroupsQuery,
  type SearchUsersQuery,
} from '../ports/mod.ts';
import { createDeterministicClock } from './clock.ts';
import type { InMemoryDirectoryGroup, InMemoryDirectoryUser } from './conformance-dataset.ts';

/**
 * Port method names exposed to {@link InMemoryDirectoryOptions.simulateFailure}.
 *
 * @example
 * ```ts
 * import type { DirectoryOperationName } from '@netscript/plugin-directory-core/testing';
 *
 * const op: DirectoryOperationName = 'memberOfAny';
 * console.log(op);
 * ```
 */
export type DirectoryOperationName =
  | 'searchUsers'
  | 'searchGroups'
  | 'getUser'
  | 'memberOfAny'
  | 'health';

/**
 * Configuration accepted by {@link createInMemoryDirectoryPort}.
 *
 * @example
 * ```ts
 * import {
 *   createDeterministicClock,
 *   createInMemoryDirectoryPort,
 *   DIRECTORY_CONFORMANCE_DATASET,
 * } from '@netscript/plugin-directory-core/testing';
 *
 * const port = createInMemoryDirectoryPort({
 *   directoryInstance: DIRECTORY_CONFORMANCE_DATASET.directoryInstance,
 *   clock: createDeterministicClock(DIRECTORY_CONFORMANCE_DATASET.initialTimeIso),
 *   users: DIRECTORY_CONFORMANCE_DATASET.users,
 *   groups: DIRECTORY_CONFORMANCE_DATASET.groups,
 * });
 * console.log(port.name, port.capabilities.has('transitive-membership'));
 * ```
 */
export type InMemoryDirectoryOptions = Readonly<{
  /** Adapter provider name (defaults to `'memory'`). */
  name?: string;
  /** Logical directory instance identifier (defaults to `'memory-example'`). */
  directoryInstance?: string;
  /** Declared capabilities (defaults to `['search', 'transitive-membership']`). */
  capabilities?: Iterable<DirectoryCapability>;
  /** Wall clock used for `evaluatedAt`, `checkedAt`, and expiry checks. */
  clock?: DirectoryClock;
  /** Maximum search page size cap (defaults to {@link DIRECTORY_MAX_SEARCH_LIMIT}). */
  maxSearchLimit?: number;
  /** Seed users stored in memory. */
  users?: readonly InMemoryDirectoryUser[];
  /** Seed groups stored in memory. */
  groups?: readonly InMemoryDirectoryGroup[];
  /** Aggregate health status returned by `health()` (defaults to `'healthy'`). */
  healthStatus?: DirectoryHealthStatus;
  /** Optional reachable host count returned by `health()`. */
  reachableHosts?: number;
  /** Optional total host count returned by `health()`. */
  totalHosts?: number;
  /** Optional redacted health probes returned by `health()`. */
  healthProbes?: readonly DirectoryHealthProbe[];
  /** Optional artificial delay in milliseconds for testing timeout budgets. */
  operationDelayMs?: number;
  /** Optional hook that returns an error to throw for a given operation and context. */
  simulateFailure?: (operation: DirectoryOperationName, ctx: CallContext) => Error | undefined;
}>;

function validateHealthConfig(
  healthStatus: DirectoryHealthStatus,
  reachableHosts: number,
  totalHosts: number,
): void {
  if (!Number.isInteger(totalHosts) || totalHosts < 1) {
    throw new RangeError('InMemoryDirectoryOptions.totalHosts must be a positive integer.');
  }
  if (!Number.isInteger(reachableHosts) || reachableHosts < 0 || reachableHosts > totalHosts) {
    throw new RangeError(
      'InMemoryDirectoryOptions.reachableHosts must be an integer in [0, totalHosts].',
    );
  }
  if (healthStatus === 'healthy' && reachableHosts < totalHosts) {
    throw new RangeError(
      'InMemoryDirectoryOptions.healthStatus="healthy" requires reachableHosts === totalHosts.',
    );
  }
  if (healthStatus === 'unhealthy' && reachableHosts > 0) {
    throw new RangeError(
      'InMemoryDirectoryOptions.healthStatus="unhealthy" requires reachableHosts === 0.',
    );
  }
}

function toDirectoryUser(directoryInstance: string, seed: InMemoryDirectoryUser): DirectoryUser {
  return {
    ref: { directoryInstance, immutableId: seed.immutableId },
    immutableId: seed.immutableId,
    enabled: seed.enabled,
    ...(seed.expiresAt !== undefined ? { expiresAt: seed.expiresAt } : {}),
    ...(seed.displayName !== undefined ? { displayName: seed.displayName } : {}),
    ...(seed.userPrincipalName !== undefined ? { userPrincipalName: seed.userPrincipalName } : {}),
    ...(seed.mail !== undefined ? { mail: seed.mail } : {}),
    ...(seed.username !== undefined ? { username: seed.username } : {}),
  };
}

function toDirectoryGroup(
  directoryInstance: string,
  seed: InMemoryDirectoryGroup,
): DirectoryGroup {
  return {
    ref: { directoryInstance, immutableId: seed.immutableId },
    immutableId: seed.immutableId,
    displayName: seed.displayName,
    ...(seed.description !== undefined ? { description: seed.description } : {}),
    ...(seed.mail !== undefined ? { mail: seed.mail } : {}),
  };
}

function includesLiteral(haystack: string | undefined, needleLower: string): boolean {
  return haystack !== undefined && haystack.toLowerCase().includes(needleLower);
}

function delayWithCancel(delayMs: number): { promise: Promise<void>; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const promise = new Promise<void>((resolve) => {
    timer = setTimeout(() => {
      timer = undefined;
      resolve();
    }, delayMs);
  });
  const cancel = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };
  return { promise, cancel };
}

/**
 * Creates an in-memory {@link DirectoryPort} suitable for unit tests and contract verification.
 *
 * Implements mandatory capped search limits, literal non-injectable substring matching,
 * fail-closed ambiguous attribute lookups, exact opaque immutable identifiers, direct + primary +
 * cycle-safe transitive group membership, fail-closed disabled/expired checks, shared deadline
 * handling, and deterministic wall-clock timestamps.
 *
 * @param options - Optional seed records, clock, capabilities, limits, and failure hooks.
 * @returns An in-memory {@link DirectoryPort}.
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
 * const health = await directory.health({});
 * console.log(health.status, health.checkedAt);
 * ```
 */
export function createInMemoryDirectoryPort(
  options: InMemoryDirectoryOptions = {},
): DirectoryPort {
  const name = options.name ?? 'memory';
  const directoryInstance = options.directoryInstance ?? 'memory-example';
  const clock = options.clock ?? createDeterministicClock();
  const maxSearchLimit = options.maxSearchLimit ?? DIRECTORY_MAX_SEARCH_LIMIT;
  normalizeDirectorySearchLimit(1, maxSearchLimit);

  const capabilities: ReadonlySet<DirectoryCapability> = new Set(
    options.capabilities ?? ['search', 'transitive-membership'],
  );
  const users: readonly InMemoryDirectoryUser[] = [...(options.users ?? [])];
  const groups: readonly InMemoryDirectoryGroup[] = [...(options.groups ?? [])];
  const delayMs = options.operationDelayMs ?? 0;
  const healthStatus: DirectoryHealthStatus = options.healthStatus ?? 'healthy';
  const totalHosts = options.totalHosts ?? 1;
  const reachableHosts = options.reachableHosts ?? (healthStatus === 'unhealthy' ? 0 : totalHosts);
  validateHealthConfig(healthStatus, reachableHosts, totalHosts);

  const usersById = new Map(users.map((u) => [u.immutableId, u]));
  const groupsById = new Map(groups.map((g) => [g.immutableId, g]));

  async function enterOperation(
    operation: DirectoryOperationName,
    ctx: CallContext,
  ): Promise<void> {
    const timeoutMs = assertDirectoryCallContext(name, operation, ctx);
    const simulated = options.simulateFailure?.(operation, ctx);
    if (simulated) throw simulated;
    if (delayMs > 0) {
      const waiter = delayWithCancel(delayMs);
      await runWithDirectoryDeadline({
        directoryName: name,
        operation,
        timeoutMs,
        signal: ctx.signal,
        onCancel: waiter.cancel,
        task: () => waiter.promise,
      });
    }
    assertDirectoryCallContext(name, operation, ctx);
  }

  function isMemberOfGroup(
    user: InMemoryDirectoryUser,
    candidateGroupId: string,
    allowTransitive: boolean,
  ): boolean {
    const rootGroup = groupsById.get(candidateGroupId);
    if (!rootGroup) return false;

    const visited = new Set<string>([candidateGroupId]);
    const queue: InMemoryDirectoryGroup[] = [rootGroup];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (user.primaryGroupId !== undefined && user.primaryGroupId === current.immutableId) {
        return true;
      }
      if (current.memberUserIds?.includes(user.immutableId)) return true;
      if (!allowTransitive) break;
      for (const childId of current.memberGroupIds ?? []) {
        if (visited.has(childId)) continue;
        visited.add(childId);
        const child = groupsById.get(childId);
        if (child) queue.push(child);
      }
    }
    return false;
  }

  return {
    name,
    capabilities,

    async searchUsers(q: SearchUsersQuery, ctx: CallContext): Promise<Page<DirectoryUser>> {
      const effectiveLimit = normalizeDirectorySearchLimit(q.limit, maxSearchLimit);
      await enterOperation('searchUsers', ctx);
      if (!capabilities.has('search')) {
        throw new DirectoryUnsupported(name, 'searchUsers', 'Search capability is not enabled.');
      }
      const evaluatedAt = clock.nowIso();
      if (q.text.trim().length === 0) return { items: [], truncated: false, evaluatedAt };

      const needle = q.text.toLowerCase();
      const matched: DirectoryUser[] = [];
      let truncated = false;
      for (const user of users) {
        if (
          includesLiteral(user.displayName, needle) ||
          includesLiteral(user.userPrincipalName, needle) ||
          includesLiteral(user.mail, needle) ||
          includesLiteral(user.username, needle)
        ) {
          if (matched.length < effectiveLimit) {
            matched.push(toDirectoryUser(directoryInstance, user));
          } else {
            truncated = true;
            break;
          }
        }
      }
      return { items: matched, truncated, evaluatedAt };
    },

    async searchGroups(q: SearchGroupsQuery, ctx: CallContext): Promise<Page<DirectoryGroup>> {
      const effectiveLimit = normalizeDirectorySearchLimit(q.limit, maxSearchLimit);
      await enterOperation('searchGroups', ctx);
      if (!capabilities.has('search')) {
        throw new DirectoryUnsupported(name, 'searchGroups', 'Search capability is not enabled.');
      }
      const evaluatedAt = clock.nowIso();
      if (q.text.trim().length === 0) return { items: [], truncated: false, evaluatedAt };

      const needle = q.text.toLowerCase();
      const matched: DirectoryGroup[] = [];
      let truncated = false;
      for (const group of groups) {
        if (
          includesLiteral(group.displayName, needle) ||
          includesLiteral(group.description, needle) ||
          includesLiteral(group.mail, needle)
        ) {
          if (matched.length < effectiveLimit) {
            matched.push(toDirectoryGroup(directoryInstance, group));
          } else {
            truncated = true;
            break;
          }
        }
      }
      return { items: matched, truncated, evaluatedAt };
    },

    async getUser(ref: UserLookup, ctx: CallContext): Promise<DirectoryUser | undefined> {
      await enterOperation('getUser', ctx);
      if (ref.directoryInstance !== directoryInstance) return undefined;

      if ('immutableId' in ref && typeof ref.immutableId === 'string') {
        if (ref.immutableId.trim().length === 0) return undefined;
        const found = usersById.get(ref.immutableId);
        return found ? toDirectoryUser(directoryInstance, found) : undefined;
      }

      let matches: InMemoryDirectoryUser[] = [];
      if ('userPrincipalName' in ref && typeof ref.userPrincipalName === 'string') {
        const needle = ref.userPrincipalName.trim().toLowerCase();
        if (needle.length > 0) {
          matches = users.filter((u) => u.userPrincipalName?.toLowerCase() === needle);
        }
      } else if ('mail' in ref && typeof ref.mail === 'string') {
        const needle = ref.mail.trim().toLowerCase();
        if (needle.length > 0) {
          matches = users.filter((u) => u.mail?.toLowerCase() === needle);
        }
      } else if ('username' in ref && typeof ref.username === 'string') {
        const needle = ref.username.trim().toLowerCase();
        if (needle.length > 0) {
          matches = users.filter((u) => u.username?.toLowerCase() === needle);
        }
      }
      return matches.length === 1 ? toDirectoryUser(directoryInstance, matches[0]!) : undefined;
    },

    async memberOfAny(q: MemberOfAnyQuery, ctx: CallContext): Promise<MemberOfAnyResult> {
      await enterOperation('memberOfAny', ctx);
      const nowMs = clock.nowMs();
      const evaluatedAt = clock.nowIso();
      const consistency = { source: 'live', ageMs: 0 } as const;

      if (q.user.directoryInstance !== directoryInstance) {
        return { memberOf: [], evaluatedAt, consistency };
      }
      const seedUser = q.user.immutableId.trim().length > 0
        ? usersById.get(q.user.immutableId)
        : undefined;
      if (
        !seedUser || !isDirectoryUserActive(toDirectoryUser(directoryInstance, seedUser), nowMs)
      ) {
        return { memberOf: [], evaluatedAt, consistency };
      }

      const seen = new Set<string>();
      const memberOf: string[] = [];
      const allowTransitive = capabilities.has('transitive-membership');
      for (const candidateId of q.candidateGroupIds) {
        if (candidateId.trim().length === 0 || seen.has(candidateId)) continue;
        seen.add(candidateId);
        if (isMemberOfGroup(seedUser, candidateId, allowTransitive)) {
          memberOf.push(candidateId);
        }
      }
      return { memberOf, evaluatedAt, consistency };
    },

    async health(ctx: CallContext): Promise<DirectoryHealth> {
      await enterOperation('health', ctx);
      const probes: readonly DirectoryHealthProbe[] = options.healthProbes ?? [
        {
          name: 'memory',
          status: healthStatus === 'healthy'
            ? 'pass'
            : healthStatus === 'degraded'
            ? 'warn'
            : 'fail',
          message: `In-memory directory "${name}" is ${healthStatus}.`,
        },
      ];
      return {
        status: healthStatus,
        checkedAt: clock.nowIso(),
        reachableHosts,
        totalHosts,
        probes,
      };
    },
  };
}
