import { assertEquals } from '@std/assert';
import { OPENROUTER_MODEL_IDS } from '../../.llm/tools/agentic/config/models.ts';
import {
  evaluateOpenHandsCommentTrigger,
  OPENHANDS_COMMENT_COMMAND,
} from './openhands-comment-trigger.mjs';

function decide(body: string, authorAssociation = 'OWNER') {
  return evaluateOpenHandsCommentTrigger({ body, authorAssociation });
}

Deno.test('fallback-running comment can quote command vocabulary without dispatch', () => {
  const body = [
    'Fallback evaluator is running in a separate native session.',
    `Quoted cloud syntax for context only: \`${OPENHANDS_COMMENT_COMMAND} model=example\`.`,
  ].join('\n');
  assertEquals(decide(body).dispatch, false);
});

Deno.test('final fallback provenance can quote the original command without dispatch', () => {
  const body = [
    'Final fallback provenance: native evaluation completed.',
    'Original cloud request, quoted for audit:',
    `> ${OPENHANDS_COMMENT_COMMAND} model=openrouter/example output=pr-comment`,
  ].join('\n');
  assertEquals(decide(body).dispatch, false);
});

Deno.test('workflow acknowledgement and summary bodies cannot recursively dispatch', () => {
  const acknowledgement = [
    '<!-- openhands-agent-summary -->',
    '<!-- openhands-run: {"state":"running"} -->',
    '## OpenHands Agent — Running',
    `Trigger vocabulary: ${OPENHANDS_COMMENT_COMMAND}`,
  ].join('\n');
  const summary = [
    '<!-- openhands-agent-summary -->',
    '<!-- openhands-run: {"state":"completed"} -->',
    '## OpenHands Agent — Completed',
    `The request began with \`${OPENHANDS_COMMENT_COMMAND}\`.`,
  ].join('\n');
  assertEquals(decide(acknowledgement).dispatch, false);
  assertEquals(decide(summary, 'MEMBER').dispatch, false);
});

Deno.test('explicit authenticated first-line command dispatches exactly once', () => {
  const body = [
    `${OPENHANDS_COMMENT_COMMAND} output=pr-comment iterations=500`,
    '',
    'use harness',
    'Evaluate this bounded change.',
  ].join('\n');
  assertEquals(decide(body), {
    dispatch: true,
    triggerLine: body.split('\n')[0],
    reason: 'authorized-command',
  });
});

Deno.test('automatic phase command shape remains accepted', () => {
  const head = 'a'.repeat(40);
  const body = [
    `${OPENHANDS_COMMENT_COMMAND} model=openrouter/${OPENROUTER_MODEL_IDS.deepseekV4Flash0731} output=pr-comment iterations=800 phase=impl head=${head}`,
    '<!-- phase generation metadata -->',
    'Trusted evaluator prompt follows.',
  ].join('\n');
  assertEquals(decide(body).dispatch, true);
});

Deno.test('manual command rejects prose, quoting, invalid grammar, and unauthorized authors', () => {
  const valid = `${OPENHANDS_COMMENT_COMMAND} output=summary-only`;
  for (
    const body of [
      `Please run ${valid}`,
      `> ${valid}`,
      `\`${valid}\``,
      `${OPENHANDS_COMMENT_COMMAND} is the command to use`,
      `${OPENHANDS_COMMENT_COMMAND} unknown=value`,
      `${OPENHANDS_COMMENT_COMMAND} output=pr-comment output=summary-only`,
      `\n${valid}`,
    ]
  ) {
    assertEquals(decide(body).dispatch, false, body);
  }
  assertEquals(decide(valid, 'CONTRIBUTOR').dispatch, false);
  assertEquals(decide(valid, 'NONE').dispatch, false);
});
