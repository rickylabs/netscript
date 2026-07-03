/**
 * @module kernel/domain/deploy/health-gate
 *
 * Target-agnostic **health-gate convention** for the deploy core (R-DEPLOY-3):
 * a new release only takes traffic after a health probe passes. The retry loop
 * is shared convention; the transport (an HTTP `fetch`, a platform status call)
 * is the only per-target binding, injected as a {@link HealthProbePort}.
 *
 * Pure module (A11/F-CLI-16/F-4): no `Deno.*` I/O, no `public/**` import; the
 * probe transport and the `sleep` timer are injected so tests are deterministic.
 */

/** Contract that defines "healthy" for a gated activation. */
export interface HealthProbeSpec {
  /** Absolute URL to probe; when absent the binding derives it from path/port. */
  readonly url?: string;
  /** HTTP path probed when `url` is derived (e.g. `/health`). */
  readonly path?: string;
  /** Port the health endpoint listens on when `url` is derived. */
  readonly port?: number;
  /** Per-probe timeout in milliseconds. */
  readonly timeoutMs: number;
  /** Delay between probe attempts in milliseconds. */
  readonly intervalMs: number;
  /** Number of probe attempts before the gate fails (min 1). */
  readonly retries: number;
  /** HTTP status that signals healthy (the binding compares against it). */
  readonly expectStatus: number;
}

/** Result of a single probe attempt. */
export interface HealthProbeOutcome {
  /** Whether the probe observed the healthy condition (`status === expectStatus`). */
  readonly healthy: boolean;
  /** Observed HTTP status when the probe completed, for diagnostics. */
  readonly status?: number;
}

/** Injected transport that performs one health probe against a spec. */
export interface HealthProbePort {
  /** Perform a single probe; a thrown error (timeout/transport) is a failed attempt. */
  probe(spec: HealthProbeSpec): Promise<HealthProbeOutcome>;
}

/** Injected timer so the retry loop is deterministic under test. */
export type SleepFn = (ms: number) => Promise<void>;

/** Outcome of a full {@link runHealthGate} pass. */
export interface HealthGateResult {
  /** Whether the gate passed within the allotted attempts. */
  readonly passed: boolean;
  /** Number of probe attempts made. */
  readonly attempts: number;
}

/**
 * Pure health-gate orchestrator. Probes up to `spec.retries` times, sleeping
 * `spec.intervalMs` between attempts; returns as soon as a probe is healthy. A
 * thrown probe (timeout / transport error) counts as a failed attempt, never a
 * throw. Sleeps only *between* attempts, never after the last one.
 */
export async function runHealthGate(
  spec: HealthProbeSpec,
  probe: HealthProbePort,
  sleep: SleepFn,
): Promise<HealthGateResult> {
  const maxAttempts = Math.max(1, Math.trunc(spec.retries));

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let healthy = false;
    try {
      const outcome = await probe.probe(spec);
      healthy = outcome.healthy;
    } catch {
      healthy = false;
    }

    if (healthy) return { passed: true, attempts: attempt };
    if (attempt < maxAttempts) await sleep(spec.intervalMs);
  }

  return { passed: false, attempts: maxAttempts };
}
