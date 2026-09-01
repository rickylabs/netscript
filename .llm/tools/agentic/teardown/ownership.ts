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

/**
 * A Docker volume. Aspire does not label anonymous volumes and carries no creator identity for
 * them, so attribution comes from `classifyVolume` (who mounts it), not from `classify`.
 */
export interface VolumeCandidate {
  readonly kind: 'volume';
  readonly id: string;
  readonly name?: string;
  readonly creatorPid?: number;
  readonly creatorProcessStartTime?: string;
  /** Wall-clock creation timestamp from `docker volume inspect`, when exposed. */
  readonly createdAt?: string;
  /** Full container ids observed mounting the volume at probe time. */
  readonly mountedBy: readonly string[];
}

/**
 * A Docker network. DCP's `ContainerNetworkSpec` carries no per-run creator identity, so a
 * network can never be positively owned by this run — only registered-creator or nothing.
 * Aspire-management is recognized from the DCP label namespace, never from the network name.
 */
export interface NetworkCandidate {
  readonly kind: 'network';
  readonly id: string;
  readonly name?: string;
  readonly creatorPid?: number;
  readonly creatorProcessStartTime?: string;
  /** Wall-clock creation timestamp from `docker network inspect`, when exposed. */
  readonly createdAt?: string;
  /** Full container ids observed attached to the network at probe time. */
  readonly attachedContainers: readonly string[];
}

export type ResourceCandidate =
  | AppHostCandidate
  | ContainerCandidate
  | VolumeCandidate
  | NetworkCandidate;

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
const MCP_COMMAND = /(?:^|\s)aspire\s+mcp\b/i;
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
  if (
    'commandLine' in candidate && candidate.commandLine && MCP_COMMAND.test(candidate.commandLine)
  ) {
    return 'unproven';
  }
  const evidencePath = candidate.kind === 'apphost'
    ? candidate.appHostPath
    : candidate.kind === 'container'
    ? candidate.mountSource
    : undefined;
  if (evidencePath && ownedByPath(evidencePath, worktreeRoot, registry.ownedRoots)) return 'owned';
  if (registryMatches(candidate, registry)) return 'owned';
  if (foreignWorktree(evidencePath, worktreeRoot)) return 'foreign';
  return 'unproven';
}

/**
 * Attributes a volume to the run only when every container mounting it is positively owned.
 *
 * Anonymous volumes carry no labels or creator identity, so the mount relationship is the only
 * positive evidence: Docker creates an anonymous volume with the container that first mounts it.
 * The claim fails closed — a volume mounted by any container without a candidate (a non-Aspire or
 * foreign container) or by nothing at all stays `unproven`, and a volume with its own registered
 * creator identity keeps the `classify` verdict.
 */
export function classifyVolume(
  volume: VolumeCandidate,
  containers: readonly ContainerCandidate[],
  registry: RegistryIdentityView,
  worktreeRoot: string,
): Ownership {
  const direct = classify(volume, registry, worktreeRoot);
  if (direct === 'owned' || volume.mountedBy.length === 0) return direct;
  const mounters = containers.filter((container) => volume.mountedBy.includes(container.id));
  if (mounters.length !== volume.mountedBy.length) return direct;
  return mounters.every((mounter) => classify(mounter, registry, worktreeRoot) === 'owned')
    ? 'owned'
    : direct;
}

/** Selects the only candidates authorized for mutation. */
export function actionable(
  candidates: readonly ResourceCandidate[],
  registry: RegistryIdentityView,
  worktreeRoot: string,
): ResourceCandidate[] {
  return candidates.filter((candidate) => classify(candidate, registry, worktreeRoot) === 'owned');
}
