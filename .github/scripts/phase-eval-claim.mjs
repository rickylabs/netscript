/** Git namespace reserved for immutable evaluator claims. */
export const PHASE_EVAL_CLAIM_NAMESPACE = 'refs/openhands-phase-eval-claims';

/** GitHub's validation message when a reference already exists. */
export const REFERENCE_ALREADY_EXISTS_MESSAGE = 'Reference already exists';

/**
 * Build the immutable claim ref for one evaluator generation.
 *
 * @param {{ generation: number, phase: 'plan' | 'impl', head: string }} key
 */
export function phaseEvalClaimRef(key) {
  if (!Number.isSafeInteger(key.generation) || key.generation <= 0) {
    throw new Error(`Invalid evaluator generation: ${key.generation}`);
  }
  if (key.phase !== 'plan' && key.phase !== 'impl') {
    throw new Error(`Invalid evaluator phase: ${key.phase}`);
  }
  if (!/^[0-9a-f]{40}$/.test(key.head)) {
    throw new Error(`Invalid evaluator head SHA: ${key.head}`);
  }
  return `${PHASE_EVAL_CLAIM_NAMESPACE}/${key.generation}-${key.phase}-${key.head}`;
}

/**
 * Atomically claim one evaluator generation through GitHub's create-ref operation.
 *
 * @param {{
 *   createRef: (input: { ref: string, sha: string }) => Promise<void>,
 *   getRef: (input: { ref: string }) => Promise<{ sha: string }>,
 * }} operations
 * @param {{ generation: number, phase: 'plan' | 'impl', head: string }} key
 * @returns {Promise<{ claimed: boolean, ref: string }>}
 */
export async function claimPhaseEvaluation(operations, key) {
  const ref = phaseEvalClaimRef(key);
  try {
    await operations.createRef({ ref, sha: key.head });
    return { claimed: true, ref };
  } catch (error) {
    if (!isAlreadyExistingRefError(error)) throw error;
  }

  const existing = await operations.getRef({ ref: ref.slice('refs/'.length) });
  if (existing.sha !== key.head) {
    throw new Error(`Evaluator claim ref ${ref} points to unexpected SHA ${existing.sha}`);
  }
  return { claimed: false, ref };
}

/**
 * Claim one evaluator generation and create its paid trigger.
 *
 * A trigger failure releases the claim so a transient API error can be retried. A process crash
 * cannot run this cleanup; recovery from that residual case requires a new status generation.
 *
 * @template T
 * @param {{
 *   createRef: (input: { ref: string, sha: string }) => Promise<void>,
 *   getRef: (input: { ref: string }) => Promise<{ sha: string }>,
 *   deleteRef: (input: { ref: string }) => Promise<void>,
 * }} operations
 * @param {{ generation: number, phase: 'plan' | 'impl', head: string }} key
 * @param {() => Promise<T>} createTrigger
 * @returns {Promise<
 *   { claimed: false, ref: string } |
 *   { claimed: true, ref: string, trigger: T }
 * >}
 */
export async function dispatchClaimedPhaseEvaluation(operations, key, createTrigger) {
  const claim = await claimPhaseEvaluation(operations, key);
  if (!claim.claimed) return claim;

  try {
    return { ...claim, trigger: await createTrigger() };
  } catch (triggerError) {
    try {
      await operations.deleteRef({ ref: claim.ref.slice('refs/'.length) });
    } catch (releaseError) {
      throw new AggregateError(
        [triggerError, releaseError],
        `Evaluator trigger failed and claim ${claim.ref} could not be released`,
      );
    }
    throw triggerError;
  }
}

/** @param {unknown} error */
function isAlreadyExistingRefError(error) {
  if (!isRecord(error) || error.status !== 422) return false;
  const response = error.response;
  if (!isRecord(response)) return false;
  const data = response.data;
  return isRecord(data) && data.message === REFERENCE_ALREADY_EXISTS_MESSAGE;
}

/** @param {unknown} value */
function isRecord(value) {
  return typeof value === 'object' && value !== null;
}
