/** Prefix reserved for the single lifecycle status label. */
export const STATUS_PREFIX = 'status:';

/** Terminal status entered before dispatching IMPL-EVAL. */
export const IMPL_EVAL_STATUS = 'status:impl-eval';

/** GitHub's exact response message when a label is absent from an issue. */
export const MISSING_LABEL_MESSAGE = 'Label does not exist';

/**
 * Decide the idempotent status-label transition from a live issue-label set.
 *
 * @param {readonly string[]} liveLabels
 * @returns {{ remove: string[], add: string[] }}
 */
export function decideImplEvalStatusTransition(liveLabels) {
  return {
    remove: liveLabels.filter((label) => label.startsWith(STATUS_PREFIX)),
    add: [IMPL_EVAL_STATUS],
  };
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
export async function applyImplEvalStatusTransition(operations) {
  const liveLabels = await operations.listLabelsOnIssue();
  const decision = decideImplEvalStatusTransition(liveLabels);

  for (const label of decision.remove) {
    try {
      await operations.removeLabel(label);
    } catch (error) {
      if (!isMissingLabelError(error)) throw error;
    }
  }

  await operations.addLabels(decision.add);
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
