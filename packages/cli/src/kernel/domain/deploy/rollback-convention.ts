/**
 * @module kernel/domain/deploy/rollback-convention
 *
 * Target-agnostic **rollback + release-retention convention** for the deploy
 * core (R-DEPLOY-3). Version-retention math and previous-good selection are
 * convention, not platform detail; a target supplies only the atomic swap via
 * an injected {@link ActivationPort} (symlink swap on Linux, dir swap on
 * Windows, platform repoint on Deno Deploy, image-tag redeploy on Aspire).
 *
 * Pure module (A11/F-CLI-16/F-4): no `Deno.*` I/O, no `public/**` import; side
 * effects flow through the injected {@link ActivationPort}.
 */

import { DEFAULT_RELEASE_RETENTION } from '../../constants/deploy.ts';

/**
 * Default number of prior releases retained before pruning. Re-exported from
 * `kernel/constants/deploy.ts` as the domain-facing convention name.
 */
export { DEFAULT_RELEASE_RETENTION };

/** Opaque identifier for a deployed release (e.g. a timestamped release dir). */
export type ReleaseId = string;

/** A recorded release in a target's deployment history. */
export interface ReleaseRecord {
  /** Stable release identifier. */
  readonly id: ReleaseId;
  /** Epoch milliseconds the release was recorded. */
  readonly recordedAt: number;
  /** Whether the release passed its health gate (eligible as a rollback target). */
  readonly healthy: boolean;
}

/** Ordered deployment history, oldest → newest (the last entry is current). */
export type ReleaseHistory = readonly ReleaseRecord[];

/** Result of a {@link retainReleases} retention pass. */
export interface RetainReleasesResult {
  /** Releases kept: the `keep` most-recent prior releases plus the current one. */
  readonly retained: ReleaseHistory;
  /** Prior releases pruned because they fell outside the retention window. */
  readonly pruned: ReleaseHistory;
}

/**
 * Pure retention math. Keeps the `keep` most-recent *prior* releases and always
 * keeps the current (last) release regardless of `keep`; older prior releases
 * are pruned. `keep >= prior-count` is a no-op.
 */
export function retainReleases(history: ReleaseHistory, keep: number): RetainReleasesResult {
  if (history.length === 0) return { retained: [], pruned: [] };

  const current = history[history.length - 1];
  const prior = history.slice(0, -1);
  const keepCount = Math.max(0, Math.trunc(keep));
  const prunedCount = Math.max(0, prior.length - keepCount);

  const pruned = prior.slice(0, prunedCount);
  const retainedPrior = prior.slice(prunedCount);
  return { retained: [...retainedPrior, current], pruned };
}

/**
 * Pure selection: the most-recent **healthy** release strictly before the
 * current one — the release a rollback returns to. Returns `undefined` when
 * there is no prior healthy release (single/empty history).
 */
export function selectRollbackTarget(history: ReleaseHistory): ReleaseRecord | undefined {
  if (history.length < 2) return undefined;
  const prior = history.slice(0, -1);
  for (let index = prior.length - 1; index >= 0; index -= 1) {
    if (prior[index].healthy) return prior[index];
  }
  return undefined;
}

/**
 * Atomic activation seam a target binds. The port owns the only side effects
 * (swap + service restart + history persistence); retention/selection policy
 * stays in the core.
 */
export interface ActivationPort {
  /** Atomically make `releaseId` the active release (swap `current` + restart). */
  activate(releaseId: ReleaseId): Promise<void>;
  /** The currently-active release id, if any. */
  current(): Promise<ReleaseId | undefined>;
  /** The recorded release history, oldest → newest. */
  history(): Promise<ReleaseHistory>;
  /** Append a release to the history after a successful activation. */
  record(release: ReleaseRecord): Promise<void>;
  /**
   * Optional teardown of persisted state for pruned release ids. The core
   * computes which ids to prune (retention math); the binding drops their
   * on-disk/platform artifacts. Optional so a store with no per-release
   * artifacts can omit it.
   */
  prune?(ids: readonly ReleaseId[]): Promise<void>;
}

/** Request to roll a target back to its previous healthy release. */
export interface RollbackRequest {
  /** Target key the rollback runs for. */
  readonly target: string;
}

/** Outcome of a {@link rollbackToPrevious} pass. */
export interface RollbackResult {
  /** Target key the rollback ran for. */
  readonly target: string;
  /** Whether a rollback activation happened. */
  readonly rolledBack: boolean;
  /** Release activated by the rollback (absent when nothing to roll back to). */
  readonly activated?: ReleaseId;
  /** Human-readable reason when `rolledBack` is false. */
  readonly reason?: string;
}

/**
 * Pure orchestrator every target's `rollback` op delegates to. Selects the
 * previous healthy release and activates it via the injected port; when there
 * is nothing to roll back to it returns a structured no-op (no activation call).
 */
export async function rollbackToPrevious(
  request: RollbackRequest,
  activation: ActivationPort,
): Promise<RollbackResult> {
  const history = await activation.history();
  const target = selectRollbackTarget(history);

  if (!target) {
    return {
      target: request.target,
      rolledBack: false,
      reason: 'no previous healthy release to roll back to',
    };
  }

  await activation.activate(target.id);
  return { target: request.target, rolledBack: true, activated: target.id };
}
