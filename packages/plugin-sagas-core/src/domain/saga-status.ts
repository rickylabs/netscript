import type { SagaInstanceStatus } from './constants.ts';
import type { CascadedMessage } from './cascaded-message.ts';

const TERMINAL_STATUSES: ReadonlySet<SagaInstanceStatus> = new Set<SagaInstanceStatus>([
  'completed',
  'failed',
  'compensated',
  'cancelled',
]);

/** Whether a status is a final outcome. `compensating` is in flight, not final. */
export function isTerminalSagaStatus(status: SagaInstanceStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

/**
 * Resolve the status an `.on()` transition persists.
 *
 * An explicit terminal or compensation effect wins. Otherwise a terminal or in-flight
 * `compensating` instance keeps its status: an ordinary handler never silently reopens it.
 */
export function resolveTransitionStatus(
  cascaded: readonly CascadedMessage[],
  previousStatus?: SagaInstanceStatus,
): SagaInstanceStatus {
  if (cascaded.some((item) => item.kind === 'fail')) return 'failed';
  if (cascaded.some((item) => item.kind === 'compensate')) return 'compensating';
  if (cascaded.some((item) => item.kind === 'complete')) return 'completed';
  if (
    previousStatus &&
    (isTerminalSagaStatus(previousStatus) || previousStatus === 'compensating')
  ) {
    return previousStatus;
  }
  return 'running';
}

/**
 * Resolve the status a returned `.compensate()` branch outcome persists.
 *
 * `sagaFail` fails the instance, `sagaComplete` completes it, a nested `sagaCompensate` keeps it
 * `compensating`, and any other outcome finishes as `compensated`.
 */
export function resolveCompensationStatus(
  cascaded: readonly CascadedMessage[],
): SagaInstanceStatus {
  if (cascaded.some((item) => item.kind === 'fail')) return 'failed';
  if (cascaded.some((item) => item.kind === 'compensate')) return 'compensating';
  if (cascaded.some((item) => item.kind === 'complete')) return 'completed';
  return 'compensated';
}
