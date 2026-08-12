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
  const authorAssociation = String(comment.authorAssociation ?? '');
  if (!OPENHANDS_COMMENT_AUTHOR_ASSOCIATIONS.includes(authorAssociation)) {
    return denied('author-not-authorized');
  }

  const body = String(comment.body ?? '');
  const firstLine = body.split(/\r?\n/, 1)[0];
  const fields = firstLine.split(/[ \t]+/);
  if (fields[0] !== OPENHANDS_COMMENT_COMMAND) return denied('command-not-first-token');

  const seen = new Set();
  for (const field of fields.slice(1)) {
    const match = /^([a-z][a-z0-9_-]*)=([^\s=]+)$/.exec(field);
    if (!match) return denied('invalid-command-argument');
    const [, name] = match;
    if (!ALLOWED_ARGUMENTS.has(name)) return denied('unknown-command-argument');
    if (seen.has(name)) return denied('duplicate-command-argument');
    seen.add(name);
  }

  return { dispatch: true, triggerLine: firstLine, reason: 'authorized-command' };
}

/** @param {string} reason */
function denied(reason) {
  return { dispatch: false, triggerLine: '', reason };
}
