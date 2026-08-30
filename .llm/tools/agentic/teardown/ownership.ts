import { isAbsolute, relative, resolve } from '@std/path';

export type Ownership = 'owned' | 'foreign' | 'unproven';

export interface AppHostCandidate {
  readonly kind: 'apphost';
  readonly appHostPath: string;
  readonly appHostPid?: number;
  readonly appHostStartedAt?: string;
  /** Wall-clock creation timestamp from the read-only probe, when exposed. */
  readonly createdAt?: string;
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
  /** Wall-clock creation timestamp from Docker inspect, when exposed. */
  readonly createdAt?: string;
  readonly commandLine?: string;
}

export type ProcessEvidenceKind = 'dcp-label' | 'apphost-argv' | 'socket-path';

export interface ProcessEvidence {
  readonly kind: ProcessEvidenceKind;
  readonly path: string;
}

export interface ProcessCandidate {
  readonly kind: 'process';
  readonly pid: number;
  readonly ppid: number;
  readonly processStartedAt?: string;
  readonly observedAgeMs?: number;
  readonly commandLine: string;
  readonly cwd?: string;
  readonly evidence: readonly ProcessEvidence[];
}

export type ResourceCandidate = AppHostCandidate | ContainerCandidate | ProcessCandidate;

export interface RegistryIdentityView {
  readonly appHosts: readonly {
    readonly appHostPid: number;
    readonly appHostStartedAt: string;
  }[];
  readonly containers: readonly {
    readonly creatorPid: number;
    readonly creatorProcessStartTime: string;
  }[];
  /**
   * Absolute directories the run created outside its own worktree, so their resources still have
   * path proof. Clean-clone verification is the motivating case: the clone lives under `/tmp`, so
   * Aspire labels its containers with a mount source no worktree contains.
   */
  readonly ownedRoots?: readonly string[];
}

const WORKTREE_PREFIX = resolve('/home/codex/repos');
export const MCP_COMMAND: RegExp = /(?:^|\s)aspire\s+(?:agent\s+)?mcp\b/i;
/** A root shallower than this (`/`, `/tmp`, `/home`) would claim other runs' resources. */
const MIN_OWNED_ROOT_SEGMENTS = 2;

/** Returns true only when an absolute candidate path is contained by root on path boundaries. */
export function pathContained(candidate: string, root: string): boolean {
  if (!isAbsolute(candidate) || !isAbsolute(root)) return false;
  const delta = relative(resolve(root), resolve(candidate));
  return delta === '' || (!delta.startsWith('..') && !isAbsolute(delta));
}

/** Rejects declared roots too broad to be one run's own directory. */
export function validOwnedRoot(root: string): boolean {
  if (!isAbsolute(root)) return false;
  return resolve(root).split(/[\\/]/).filter(Boolean).length >= MIN_OWNED_ROOT_SEGMENTS;
}

function ownedByPath(
  path: string,
  worktreeRoot: string,
  ownedRoots: readonly string[] = [],
): boolean {
  if (pathContained(path, worktreeRoot)) return true;
  return ownedRoots.some((root) => validOwnedRoot(root) && pathContained(path, root));
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
  if (candidate.kind === 'process') return false;
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
  const evidencePaths = candidate.kind === 'apphost'
    ? [candidate.appHostPath]
    : candidate.kind === 'container'
    ? candidate.mountSource ? [candidate.mountSource] : []
    : candidate.evidence.map((entry) => entry.path);
  if (evidencePaths.some((path) => ownedByPath(path, worktreeRoot, registry.ownedRoots))) {
    return 'owned';
  }
  if (registryMatches(candidate, registry)) return 'owned';
  if (evidencePaths.some((path) => foreignWorktree(path, worktreeRoot))) return 'foreign';
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
