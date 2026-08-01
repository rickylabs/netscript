import { isAbsolute, relative, resolve } from '@std/path';

export type Ownership = 'owned' | 'foreign' | 'unproven';

export interface AppHostCandidate {
  readonly kind: 'apphost';
  readonly appHostPath: string;
  readonly appHostPid?: number;
  readonly appHostStartedAt?: string;
  readonly commandLine?: string;
}

export interface ContainerCandidate {
  readonly kind: 'container';
  readonly id: string;
  readonly name?: string;
  readonly creatorPid?: number;
  readonly creatorProcessStartTime?: string;
  /** Realpath-resolved `src=` from Aspire's mounts label, when parseable. */
  readonly mountSource?: string;
  readonly commandLine?: string;
}

export type ResourceCandidate = AppHostCandidate | ContainerCandidate;

export interface RegistryIdentityView {
  readonly appHosts: readonly {
    readonly appHostPid: number;
    readonly appHostStartedAt: string;
  }[];
  readonly containers: readonly {
    readonly creatorPid: number;
    readonly creatorProcessStartTime: string;
  }[];
}

const WORKTREE_PREFIX = resolve('/home/codex/repos');
const MCP_COMMAND = /(?:^|\s)aspire\s+mcp\b/i;

/** Returns true only when an absolute candidate path is contained by root on path boundaries. */
export function pathContained(candidate: string, root: string): boolean {
  if (!isAbsolute(candidate) || !isAbsolute(root)) return false;
  const delta = relative(resolve(root), resolve(candidate));
  return delta === '' || (!delta.startsWith('..') && !isAbsolute(delta));
}

function foreignWorktree(path: string | undefined, root: string): boolean {
  if (!path || !isAbsolute(path) || !pathContained(path, WORKTREE_PREFIX)) return false;
  const candidatePart = relative(WORKTREE_PREFIX, resolve(path)).split(/[\\/]/)[0];
  const rootPart = relative(WORKTREE_PREFIX, resolve(root)).split(/[\\/]/)[0];
  return Boolean(candidatePart && rootPart && candidatePart !== rootPart);
}

function registryMatches(candidate: ResourceCandidate, registry: RegistryIdentityView): boolean {
  if (candidate.kind === 'apphost') {
    if (candidate.appHostPid === undefined || !candidate.appHostStartedAt) return false;
    return registry.appHosts.some((entry) =>
      entry.appHostPid === candidate.appHostPid &&
      entry.appHostStartedAt === candidate.appHostStartedAt
    );
  }
  if (candidate.creatorPid === undefined || !candidate.creatorProcessStartTime) return false;
  return registry.containers.some((entry) =>
    entry.creatorPid === candidate.creatorPid &&
    entry.creatorProcessStartTime === candidate.creatorProcessStartTime
  );
}

/** Classifies authorization from positive path or registry identity proof, failing closed. */
export function classify(
  candidate: ResourceCandidate,
  registry: RegistryIdentityView,
  worktreeRoot: string,
): Ownership {
  if (candidate.commandLine && MCP_COMMAND.test(candidate.commandLine)) return 'unproven';
  const evidencePath = candidate.kind === 'apphost' ? candidate.appHostPath : candidate.mountSource;
  if (evidencePath && pathContained(evidencePath, worktreeRoot)) return 'owned';
  if (registryMatches(candidate, registry)) return 'owned';
  if (foreignWorktree(evidencePath, worktreeRoot)) return 'foreign';
  return 'unproven';
}

/** Selects the only candidates authorized for mutation. */
export function actionable(
  candidates: readonly ResourceCandidate[],
  registry: RegistryIdentityView,
  worktreeRoot: string,
): ResourceCandidate[] {
  return candidates.filter((candidate) => classify(candidate, registry, worktreeRoot) === 'owned');
}
