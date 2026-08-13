/** Prefix reserved for the single lifecycle status label. */
export const STATUS_PREFIX = 'status:';

/** Terminal status entered before dispatching IMPL-EVAL. */
export const IMPL_EVAL_STATUS = 'status:impl-eval';

/** GitHub's exact response message when a label is absent from an issue. */
export const MISSING_LABEL_MESSAGE = 'Label does not exist';

/** Recovery text for a queued evaluator event that is no longer current. */
export const PHASE_EVAL_RECOVERY =
  'Cycle away from and back to the phase status label to create a new deliberate generation.';

/**
 * Decide the idempotent status-label transition from a live issue-label set.
 *
 * @param {readonly string[]} liveLabels
 * @returns {{ remove: string[], add: string[] }}
 */
export function decideStatusTransition(liveLabels, destination) {
  if (!destination.startsWith(STATUS_PREFIX)) {
    throw new Error(`Invalid status destination: ${destination}`);
  }
  const statuses = liveLabels.filter((label) => label.startsWith(STATUS_PREFIX));
  return {
    remove: statuses.filter((label) => label !== destination),
    add: statuses.includes(destination) ? [] : [destination],
  };
}

/** Backward-compatible specialized decision used by ready-for-review. */
export function decideImplEvalStatusTransition(liveLabels) {
  return decideStatusTransition(liveLabels, IMPL_EVAL_STATUS);
}

/**
 * Apply the IMPL-EVAL transition through injected GitHub label operations.
 *
 * @param {{
 *   listLabelsOnIssue: () => Promise<string[]>,
 *   removeLabel: (label: string) => Promise<void>,
 *   addLabels: (labels: string[]) => Promise<void>,
 * }} operations
 */
export async function applyStatusTransition(operations, destination) {
  const liveLabels = await operations.listLabelsOnIssue();
  const decision = decideStatusTransition(liveLabels, destination);

  for (const label of decision.remove) {
    try {
      await operations.removeLabel(label);
    } catch (error) {
      if (!isMissingLabelError(error)) throw error;
    }
  }

  if (decision.add.length) await operations.addLabels(decision.add);
  return decision;
}

/** Backward-compatible specialized transition used by ready-for-review. */
export function applyImplEvalStatusTransition(operations) {
  return applyStatusTransition(operations, IMPL_EVAL_STATUS);
}

/**
 * Decide whether a queued phase event still represents the live PR generation.
 * A stale decision is intentionally zero-spend and tells the operator how to create a new one.
 *
 * @param {{ eventHead: string, liveHead: string, expectedStatus: string, liveLabels: readonly string[] }} input
 */
export function decidePhaseEvaluationCurrency(input) {
  if (input.eventHead !== input.liveHead) {
    return {
      dispatch: false,
      reason: `stale head: queued ${input.eventHead}, current ${input.liveHead}`,
      recovery: PHASE_EVAL_RECOVERY,
    };
  }
  if (!input.liveLabels.includes(input.expectedStatus)) {
    return {
      dispatch: false,
      reason: `stale phase: ${input.expectedStatus} is no longer current`,
      recovery: PHASE_EVAL_RECOVERY,
    };
  }
  return { dispatch: true, reason: 'current', recovery: '' };
}

/** @param {unknown} error */
function isMissingLabelError(error) {
  if (!isRecord(error) || error.status !== 404) return false;
  const response = error.response;
  if (!isRecord(response)) return false;
  const data = response.data;
  return isRecord(data) && data.message === MISSING_LABEL_MESSAGE;
}

/** @param {unknown} value */
function isRecord(value) {
  return typeof value === 'object' && value !== null;
}
