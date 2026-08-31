import { claimPhaseEvaluation, phaseEvalMarker } from './phase-eval-claim.mjs';

/** Manual comment command token. */
export const OPENHANDS_COMMENT_COMMAND = '@openhands-agent';

/** Marker prefix used to make one refusal reply attributable to its source comment. */
export const OPENHANDS_REFUSAL_MARKER_PREFIX = '<!-- openhands-command-refusal:';

/** Policy denials that require one author-visible, pre-spend refusal reply. */
export const OPENHANDS_REPORTABLE_DENIAL_REASONS = Object.freeze([
  'command-not-first-token',
  'invalid-command-argument',
  'unknown-command-argument',
  'duplicate-command-argument',
  'author-not-authorized',
]);

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

const OPENHANDS_STATUS_MARKERS = Object.freeze([
  '<!-- openhands-agent-summary -->',
  '<!-- openhands-run:',
]);

const REFUSAL_DETAILS = Object.freeze({
  'command-not-first-token': 'the command token must be the first token on the first line',
  'invalid-command-argument': 'every first-line argument must use non-empty name=value syntax',
  'unknown-command-argument': 'the first line contains an unrecognized argument name',
  'duplicate-command-argument': 'each first-line argument name may appear only once',
  'author-not-authorized': 'the comment author does not have a trusted repository role',
});

const MANUAL_COMMAND_GRAMMAR_URL =
  'https://github.com/rickylabs/netscript/blob/main/.llm/harness/workflow/agent-handoff.md#trigger-contract';

/** Decide whether a literal command candidate should reach trusted policy evaluation. */
export function isOpenHandsCommentCandidate(body) {
  const text = String(body ?? '');
  if (!text.includes(OPENHANDS_COMMENT_COMMAND)) return false;
  if (OPENHANDS_STATUS_MARKERS.some((marker) => text.includes(marker))) return false;
  return !text.includes(OPENHANDS_REFUSAL_MARKER_PREFIX);
}

/** Return whether a policy reason requires an author-visible refusal reply. */
export function isReportableOpenHandsDenial(reason) {
  return OPENHANDS_REPORTABLE_DENIAL_REASONS.includes(String(reason ?? ''));
}

/** Build controlled refusal metadata without reflecting raw command text. */
export function buildOpenHandsRefusalReply({ sourceCommentId, authorLogin, reason }) {
  const id = String(sourceCommentId ?? '');
  if (!/^[1-9][0-9]*$/.test(id)) throw new Error('sourceCommentId must be a positive integer');
  if (!isReportableOpenHandsDenial(reason)) {
    throw new Error(`Unreportable OpenHands denial reason: ${String(reason ?? '')}`);
  }

  const normalizedLogin = String(authorLogin ?? '').toLowerCase();
  const mention = /^[a-z0-9](?:[a-z0-9-]{0,38})$/.test(normalizedLogin)
    ? `@${normalizedLogin}, `
    : '';
  const marker = `${OPENHANDS_REFUSAL_MARKER_PREFIX}${id} -->`;
  const body = [
    marker,
    `${mention}OpenHands did not start for source comment ${id}.`,
    `Reason: \`${reason}\` — ${REFUSAL_DETAILS[reason]}.`,
    `Recovery: follow the [manual command grammar](${MANUAL_COMMAND_GRAMMAR_URL}) and submit a new comment.`,
  ].join('\n');
  return { marker, body, reason, sourceCommentId: id };
}

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
 *   currentHead: string,
 *   liveLabels: string[],
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
  const expectedStatus = phase === 'plan' ? 'status:plan-eval' : 'status:impl-eval';
  if (context.currentHead !== head) return denied('stale-phase-head');
  if (!context.liveLabels.includes(expectedStatus)) return denied('phase-not-current');
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
  const body = String(comment.body ?? '');
  if (!isOpenHandsCommentCandidate(body)) {
    return { decision: denied('not-command-candidate'), params: new Map() };
  }

  const authorAssociation = String(comment.authorAssociation ?? '');
  if (!OPENHANDS_COMMENT_AUTHOR_ASSOCIATIONS.includes(authorAssociation)) {
    return { decision: denied('author-not-authorized'), params: new Map() };
  }

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
