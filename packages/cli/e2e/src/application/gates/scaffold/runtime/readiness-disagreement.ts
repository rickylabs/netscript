import type { ListenerHealthReport } from './verify-listener-readiness.ts';

/**
 * #863 gate 2 (#1880): evidence for the `Running`/`Unhealthy`-with-ready-log state.
 *
 * The two signals answer different questions and can both be correct at once:
 *
 * - the container log reports whether the database process finished its own startup, observed
 *   **inside** the container's network namespace;
 * - the `<name>_listener` health check reports whether the resource is reachable at its published
 *   endpoint, observed **from where consumers connect** — it is a bounded TCP connect
 *   (`createListenerReadinessCheck`).
 *
 * A published port that is not yet mapped, or that resolves somewhere nothing is listening, makes
 * the first true while the second is false. That window is the false negative gate 2 names, and it
 * is a readiness *contract*, not a probe defect: the probe measures what consumers depend on.
 *
 * Stating it as the inverse of the skill's rule zero: **`Unhealthy` is not disproof that the
 * database is up — it is proof it is not reachable where you will connect.**
 */

/** Postgres announces its own readiness with this line once, on the socket it will serve. */
export const POSTGRES_READY_LOG_MARKER = 'database system is ready to accept connections';

/** How the two readiness signals related to each other at one observed moment. */
export type ReadinessAgreement =
  /** Log says ready, listener check says unhealthy — the gate-2 false negative, reproduced. */
  | 'disagreement'
  /** Both agree the resource is serving. */
  | 'agreed-ready'
  /** Neither claims readiness yet; ordinary startup. */
  | 'agreed-not-ready'
  /** Listener is reachable but the log has not announced readiness — reachable before announce. */
  | 'listener-ahead-of-log';

export interface ReadinessObservation {
  readonly agreement: ReadinessAgreement;
  readonly logAnnouncesReady: boolean;
  readonly listenerHealthy: boolean;
  readonly healthStatus: string;
  /** Present only for a disagreement, so a receipt records why the probe disagreed. */
  readonly listenerFailure?: string;
}

/**
 * Classify one observed moment from a resource's health report and its container log.
 *
 * Pure by design: the reproduction is deterministic and unit-testable, so gate 2's box 1 does not
 * depend on catching a live race.
 */
export function observeReadiness(
  report: ListenerHealthReport,
  containerLog: string,
  readyMarker: string = POSTGRES_READY_LOG_MARKER,
): ReadinessObservation {
  const logAnnouncesReady = containerLog.toLowerCase().includes(readyMarker.toLowerCase());
  const listenerHealthy = report.status.toLowerCase() === 'healthy';
  const listenerFailure = listenerHealthy ? undefined : failureDetail(report);

  const agreement: ReadinessAgreement = logAnnouncesReady
    ? (listenerHealthy ? 'agreed-ready' : 'disagreement')
    : (listenerHealthy ? 'listener-ahead-of-log' : 'agreed-not-ready');

  return {
    agreement,
    logAnnouncesReady,
    listenerHealthy,
    healthStatus: report.status,
    ...(listenerFailure === undefined ? {} : { listenerFailure }),
  };
}

/**
 * Assert the gate-2 state was actually reproduced.
 *
 * Deliberately strict about *why* it failed: an observation that never saw the ready log
 * demonstrates a failing probe, not the false negative, and must not be recorded as gate-2
 * evidence.
 */
export function assertReadinessDisagreement(observation: ReadinessObservation): void {
  if (observation.agreement === 'disagreement') return;
  if (!observation.logAnnouncesReady) {
    throw new Error(
      `readiness disagreement not reproduced: the container log never announced readiness, so ` +
        `health status ${observation.healthStatus} is an ordinary not-ready observation`,
    );
  }
  throw new Error(
    `readiness disagreement not reproduced: log announced ready and the listener was ` +
      `${observation.healthStatus}`,
  );
}

function failureDetail(report: ListenerHealthReport): string {
  const description = typeof report.description === 'string' ? report.description : undefined;
  if (description) return description;
  const exception = report.exception;
  if (typeof exception === 'string') return exception;
  return `listener check ${report.healthCheckKey} reported ${report.status}`;
}
