/**
 * @module kernel/domain/deploy/activation-convention
 *
 * The composite **health-gated activation** primitive for the deploy core
 * (R-DEPLOY-3, D5): the single orchestrator that makes "atomic activate +
 * health-gated cutover + automatic rollback on failure + release retention"
 * true for *any* target. A target's `up` op routes through this; bare-metal
 * (systemd + SERVY) is its reference exercise.
 *
 * Pure module (A11/F-CLI-16/F-4): no `Deno.*` I/O, no `public/**` import; all
 * side effects flow through the injected {@link ActivationPort},
 * {@link HealthProbePort}, and `sleep`.
 */

import {
  type ActivationPort,
  DEFAULT_RELEASE_RETENTION,
  type ReleaseId,
  type ReleaseRecord,
  retainReleases,
} from './rollback-convention.ts';
import {
  type HealthProbePort,
  type HealthProbeSpec,
  runHealthGate,
  type SleepFn,
} from './health-gate.ts';

/** Request to activate a candidate release behind a health gate. */
export interface ActivateWithHealthGateRequest {
  /** Target key the activation runs for. */
  readonly target: string;
  /** Candidate release to activate and health-gate. */
  readonly candidate: ReleaseRecord;
  /** Health-probe contract that gates the candidate taking traffic. */
  readonly spec: HealthProbeSpec;
  /** Prior releases retained after a successful activation (default 3). */
  readonly retain?: number;
}

/** Injected side-effect seams for {@link activateWithHealthGate}. */
export interface ActivateWithHealthGateDeps {
  /** Atomic activation + history seam. */
  readonly activation: ActivationPort;
  /** Health-probe transport. */
  readonly health: HealthProbePort;
  /** Deterministic timer for the health-gate retry loop. */
  readonly sleep: SleepFn;
}

/** Outcome of an {@link activateWithHealthGate} pass. */
export interface ActivateWithHealthGateResult {
  /** Target key the activation ran for. */
  readonly target: string;
  /** Whether the candidate passed the gate and is now the recorded current. */
  readonly activated: boolean;
  /** The candidate release id. */
  readonly release: ReleaseId;
  /** Probe attempts made by the health gate. */
  readonly attempts: number;
  /** When the gate failed, the release the port was rolled back to (if any). */
  readonly rolledBackTo?: ReleaseId;
  /** Release ids pruned by retention after a successful activation. */
  readonly pruned: readonly ReleaseId[];
}

/**
 * Health-gated activation with automatic rollback (D5):
 *
 * 1. capture the prior current (rollback anchor),
 * 2. `activation.activate(candidate)` — the candidate is live **before** probing,
 * 3. `runHealthGate(...)`,
 *    - **pass** → `activation.record(candidate)`, then prune beyond `retain`
 *      (`activation.prune` when provided),
 *    - **fail** → `activation.activate(previous)` (automatic rollback) and return
 *      a failed result.
 *
 * The candidate is always activated before the probe runs, so the gate exercises
 * the real cutover.
 */
export async function activateWithHealthGate(
  request: ActivateWithHealthGateRequest,
  deps: ActivateWithHealthGateDeps,
): Promise<ActivateWithHealthGateResult> {
  const { activation, health, sleep } = deps;
  const { candidate, spec, target } = request;
  const retain = request.retain ?? DEFAULT_RELEASE_RETENTION;

  // (1) Anchor the prior current before the candidate takes over.
  const previous = await activation.current();

  // (2) Activate the candidate before probing it.
  await activation.activate(candidate.id);

  // (3) Health-gate the live candidate.
  const gate = await runHealthGate(spec, health, sleep);

  if (!gate.passed) {
    // (3b) Automatic rollback to the prior current, when there is one.
    if (previous !== undefined) await activation.activate(previous);
    return {
      target,
      activated: false,
      release: candidate.id,
      attempts: gate.attempts,
      rolledBackTo: previous,
      pruned: [],
    };
  }

  // (3a) Record the now-healthy candidate and prune beyond retention.
  await activation.record({ ...candidate, healthy: true });
  const history = await activation.history();
  const prunedIds = retainReleases(history, retain).pruned.map((release) => release.id);
  if (prunedIds.length > 0 && activation.prune) {
    await activation.prune(prunedIds);
  }

  return {
    target,
    activated: true,
    release: candidate.id,
    attempts: gate.attempts,
    pruned: prunedIds,
  };
}
