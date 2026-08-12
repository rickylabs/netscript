import { claimPhaseEvaluation, phaseEvalMarker } from './phase-eval-claim.mjs';

/** Manual comment command token. */
export const OPENHANDS_COMMENT_COMMAND = '@openhands-agent';

/** Repository roles permitted to start manual cloud work. */
export const OPENHANDS_COMMENT_AUTHOR_ASSOCIATIONS = Object.freeze([
  'OWNER',
  'MEMBER',
  'COLLABORATOR',
]);

const ALLOWED_ARGUMENTS = new Set([
  'agent',
  'effort',
  'head',
  'iterations',
  'model',
  'output',
  'phase',
  'provider',
]);

/**
 * Decide whether one comment is an authenticated, unambiguous manual command.
 *
 * The command must occupy the beginning of the first line. That line may contain only recognized
 * `name=value` arguments; the prompt, if any, starts on following lines. Quoted commands and prose
 * that merely mention the token never dispatch.
 *
 * @param {{ body: unknown, authorAssociation: unknown }} comment
 * @returns {{ dispatch: boolean, triggerLine: string, reason: string }}
 */
export function evaluateOpenHandsCommentTrigger(comment) {
  return parseOpenHandsCommentTrigger(comment).decision;
}

/**
 * Authorize a parsed manual command and atomically claim formal phase commands before spend.
 *
 * The phase dispatcher's own trigger arrives after it has acquired the claim. It is accepted only
 * when the current comment carries the exact tuple marker and no earlier comment carried it.
 * Subsequent manual copies therefore lose at the existing claim before the paid job starts.
 *
 * @param {{ body: unknown, authorAssociation: unknown }} comment
 * @param {(key: { phase: 'plan' | 'impl', head: string }) => Promise<{
 *   generation: number,
 *   operations: {
 *     createRef: (input: { ref: string, sha: string }) => Promise<void>,
 *     getRef: (input: { ref: string }) => Promise<{ sha: string }>,
 *   },
 *   priorCommentBodies: string[],
 * }>} [resolvePhaseClaim]
 */
export async function authorizeOpenHandsCommentTrigger(comment, resolvePhaseClaim) {
  const { decision, params } = parseOpenHandsCommentTrigger(comment);
  if (!decision.dispatch) return decision;

  const phase = params.get('phase');
  const head = params.get('head');
  if (!phase && !head) return decision;
  if ((phase !== 'plan' && phase !== 'impl') || !head) {
    return denied('incomplete-phase-claim');
  }
  if (!resolvePhaseClaim) return denied('phase-claim-context-required');

  const context = await resolvePhaseClaim({ phase, head });
  const key = { generation: context.generation, phase, head };
  const marker = phaseEvalMarker(key);
  const currentHasMarker = commentLines(comment.body).includes(marker);
  const priorHasMarker = context.priorCommentBodies.some((body) =>
    commentLines(body).includes(marker)
  );
  if (priorHasMarker) return denied('phase-already-recorded');

  const claim = await claimPhaseEvaluation(context.operations, key);
  if (claim.claimed) {
    return { ...decision, reason: 'authorized-new-phase-claim' };
  }

  return currentHasMarker
    ? { ...decision, reason: 'authorized-existing-phase-trigger' }
    : denied('phase-already-claimed');
}

/** @param {{ body: unknown, authorAssociation: unknown }} comment */
function parseOpenHandsCommentTrigger(comment) {
  const authorAssociation = String(comment.authorAssociation ?? '');
  if (!OPENHANDS_COMMENT_AUTHOR_ASSOCIATIONS.includes(authorAssociation)) {
    return { decision: denied('author-not-authorized'), params: new Map() };
  }

  const body = String(comment.body ?? '');
  const firstLine = body.split(/\r?\n/, 1)[0].trimEnd();
  const fields = firstLine.split(/[ \t]+/);
  if (fields[0] !== OPENHANDS_COMMENT_COMMAND) {
    return { decision: denied('command-not-first-token'), params: new Map() };
  }

  const seen = new Set();
  const params = new Map();
  for (const field of fields.slice(1)) {
    const match = /^([a-z][a-z0-9_-]*)=([^\s=]+)$/.exec(field);
    if (!match) return { decision: denied('invalid-command-argument'), params };
    const [, name, value] = match;
    if (!ALLOWED_ARGUMENTS.has(name)) {
      return { decision: denied('unknown-command-argument'), params };
    }
    if (seen.has(name)) return { decision: denied('duplicate-command-argument'), params };
    seen.add(name);
    params.set(name, value);
  }

  return {
    decision: { dispatch: true, triggerLine: firstLine, reason: 'authorized-command' },
    params,
  };
}

/** @param {unknown} body */
function commentLines(body) {
  return String(body ?? '').split(/\r?\n/);
}

/** @param {string} reason */
function denied(reason) {
  return { dispatch: false, triggerLine: '', reason };
}
