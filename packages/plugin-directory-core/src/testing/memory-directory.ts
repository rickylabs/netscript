/**
 * In-memory `DirectoryPort` test double with deterministic time, nested and primary-group
 * evaluation, bounded search truncation, and controllable failure/timeout hooks.
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
  type DirectoryPort,
  DirectoryTimeout,
  DirectoryUnavailable,
  DirectoryUnsupported,
  type MemberOfAnyQuery,
  type MemberOfAnyResult,
  type SearchGroupsQuery,
  type SearchUsersQuery,
} from '../ports/mod.ts';
import { createDeterministicClock, type DirectoryClock } from './clock.ts';
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

type TimerHandle = ReturnType<typeof setTimeout>;

function isTimeoutReason(reason: unknown): boolean {
  if (reason instanceof DirectoryTimeout) return true;
  if (reason instanceof DOMException && reason.name === 'TimeoutError') return true;
  if (reason instanceof Error && reason.name === 'TimeoutError') return true;
  return false;
}

function abortError(
  directoryName: string,
  operation: DirectoryOperationName,
  reason: unknown,
  timeoutMs?: number,
): Error {
  if (isTimeoutReason(reason)) {
    return new DirectoryTimeout(
      directoryName,
      operation,
      'Directory call aborted due to timeout.',
      {
        cause: reason,
        timeoutMs,
      },
    );
  }
  return new DirectoryUnavailable(
    directoryName,
    operation,
    'Directory call was aborted by the caller.',
    { cause: reason },
  );
}

function checkContext(
  directoryName: string,
  operation: DirectoryOperationName,
  ctx: CallContext,
): void {
  if (ctx.timeoutMs !== undefined && (!Number.isFinite(ctx.timeoutMs) || ctx.timeoutMs <= 0)) {
    throw new DirectoryTimeout(
      directoryName,
      operation,
      'Call timeout budget must be a positive finite number.',
      { timeoutMs: ctx.timeoutMs },
    );
  }
  if (ctx.signal?.aborted) {
    throw abortError(directoryName, operation, ctx.signal.reason, ctx.timeoutMs);
  }
}

async function applyOperationDelay(
  directoryName: string,
  operation: DirectoryOperationName,
  delayMs: number,
  ctx: CallContext,
): Promise<void> {
  if (delayMs <= 0) return;
  const effectiveTimeoutMs = ctx.timeoutMs;
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    let timeoutTimer: TimerHandle | undefined;

    const cleanup = (delayTimer?: TimerHandle): void => {
      if (delayTimer !== undefined) clearTimeout(delayTimer);
      if (timeoutTimer !== undefined) clearTimeout(timeoutTimer);
      ctx.signal?.removeEventListener('abort', onAbort);
    };

    const fail = (error: Error, delayTimer?: TimerHandle): void => {
      if (settled) return;
      settled = true;
      cleanup(delayTimer);
      reject(error);
    };

    const onAbort = (): void => {
      fail(
        abortError(directoryName, operation, ctx.signal?.reason, effectiveTimeoutMs),
        delayTimer,
      );
    };

    const delayTimer: TimerHandle = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    }, delayMs);

    if (ctx.signal) {
      if (ctx.signal.aborted) {
        onAbort();
        return;
      }
      ctx.signal.addEventListener('abort', onAbort, { once: true });
    }

    if (effectiveTimeoutMs !== undefined) {
      timeoutTimer = setTimeout(() => {
        fail(
          new DirectoryTimeout(
            directoryName,
            operation,
            `Directory call exceeded timeout budget of ${effectiveTimeoutMs}ms.`,
            { timeoutMs: effectiveTimeoutMs },
          ),
          delayTimer,
        );
      }, effectiveTimeoutMs);
    }
  });
}

function normalizeId(value: string): string {
  return value.trim().toLowerCase();
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

/**
 * Creates an in-memory {@link DirectoryPort} suitable for unit tests and contract verification.
 *
 * Implements mandatory capped search limits, literal non-injectable substring matching,
 * direct + primary + cycle-safe transitive group membership, fail-closed disabled/expired checks,
 * and deterministic wall-clock timestamps.
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

  const usersById = new Map(users.map((u) => [normalizeId(u.immutableId), u]));
  const groupsById = new Map(groups.map((g) => [normalizeId(g.immutableId), g]));

  async function enterOperation(
    operation: DirectoryOperationName,
    ctx: CallContext,
  ): Promise<void> {
    checkContext(name, operation, ctx);
    const simulated = options.simulateFailure?.(operation, ctx);
    if (simulated) throw simulated;
    if (delayMs > 0) await applyOperationDelay(name, operation, delayMs, ctx);
    checkContext(name, operation, ctx);
  }

  function isMemberOfGroup(
    user: InMemoryDirectoryUser,
    candidateGroupId: string,
    allowTransitive: boolean,
  ): boolean {
    const normalizedUserId = normalizeId(user.immutableId);
    const normalizedPrimary = user.primaryGroupId !== undefined
      ? normalizeId(user.primaryGroupId)
      : undefined;
    const targetId = normalizeId(candidateGroupId);
    const rootGroup = groupsById.get(targetId);
    if (!rootGroup) return false;

    const visited = new Set<string>([targetId]);
    const queue: InMemoryDirectoryGroup[] = [rootGroup];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentId = normalizeId(current.immutableId);
      if (normalizedPrimary !== undefined && normalizedPrimary === currentId) return true;
      if (current.memberUserIds?.some((id) => normalizeId(id) === normalizedUserId)) return true;
      if (!allowTransitive) break;
      for (const childId of current.memberGroupIds ?? []) {
        const normalizedChild = normalizeId(childId);
        if (visited.has(normalizedChild)) continue;
        visited.add(normalizedChild);
        const child = groupsById.get(normalizedChild);
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

      let found: InMemoryDirectoryUser | undefined;
      if ('immutableId' in ref && typeof ref.immutableId === 'string') {
        const key = normalizeId(ref.immutableId);
        if (key.length > 0) found = usersById.get(key);
      } else if ('userPrincipalName' in ref) {
        const needle = ref.userPrincipalName.trim().toLowerCase();
        if (needle.length > 0) {
          found = users.find((u) => u.userPrincipalName?.toLowerCase() === needle);
        }
      } else if ('mail' in ref) {
        const needle = ref.mail.trim().toLowerCase();
        if (needle.length > 0) found = users.find((u) => u.mail?.toLowerCase() === needle);
      } else if ('username' in ref) {
        const needle = ref.username.trim().toLowerCase();
        if (needle.length > 0) found = users.find((u) => u.username?.toLowerCase() === needle);
      }
      return found ? toDirectoryUser(directoryInstance, found) : undefined;
    },

    async memberOfAny(q: MemberOfAnyQuery, ctx: CallContext): Promise<MemberOfAnyResult> {
      await enterOperation('memberOfAny', ctx);
      const nowMs = clock.nowMs();
      const evaluatedAt = clock.nowIso();
      const consistency = { source: 'live', ageMs: 0 } as const;

      if (q.user.directoryInstance !== directoryInstance) {
        return { memberOf: [], evaluatedAt, consistency };
      }
      const userKey = normalizeId(q.user.immutableId);
      const seedUser = userKey.length > 0 ? usersById.get(userKey) : undefined;
      if (
        !seedUser || !isDirectoryUserActive(toDirectoryUser(directoryInstance, seedUser), nowMs)
      ) {
        return { memberOf: [], evaluatedAt, consistency };
      }

      const seen = new Set<string>();
      const memberOf: string[] = [];
      const allowTransitive = capabilities.has('transitive-membership');
      for (const rawGroupId of q.candidateGroupIds) {
        const normalizedCandidate = normalizeId(rawGroupId);
        if (normalizedCandidate.length === 0 || seen.has(normalizedCandidate)) continue;
        seen.add(normalizedCandidate);
        const group = groupsById.get(normalizedCandidate);
        if (group && isMemberOfGroup(seedUser, group.immutableId, allowTransitive)) {
          memberOf.push(group.immutableId);
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
        reachableHosts: options.reachableHosts ?? (healthStatus === 'unhealthy' ? 0 : 1),
        totalHosts: options.totalHosts ?? 1,
        probes,
      };
    },
  };
}
