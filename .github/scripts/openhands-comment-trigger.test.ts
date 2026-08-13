import { assertEquals } from '@std/assert';
import { OPENROUTER_MODEL_IDS } from '../../.llm/tools/agentic/config/models.ts';
import { buildOpenHandsComment } from '../../.llm/tools/agentic/lib/agentic-lib.ts';
import {
  authorizeOpenHandsCommentTrigger,
  evaluateOpenHandsCommentTrigger,
  OPENHANDS_COMMENT_COMMAND,
} from './openhands-comment-trigger.mjs';
import { phaseEvalClaimRef, phaseEvalMarker } from './phase-eval-claim.mjs';

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

Deno.test('agentic dispatcher output round-trips through the production predicate', () => {
  const body = buildOpenHandsComment({
    model: `openrouter/${OPENROUTER_MODEL_IDS.qwen}`,
    provider: 'openrouter',
    effort: 'medium',
    outputMode: 'pr-comment',
    iterations: 800,
    prompt: 'use harness\n\n## SKILL\n\n- netscript-harness',
  });
  assertEquals(decide(body).dispatch, true);
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

Deno.test('manual command permits trailing horizontal whitespace but not leading whitespace', () => {
  const command = `${OPENHANDS_COMMENT_COMMAND} output=summary-only`;
  assertEquals(decide(`${command} \t\nPrompt`).dispatch, true);
  assertEquals(decide(` ${command}\nPrompt`).dispatch, false);
});

Deno.test('manual phase commands atomically claim once before dispatch', async () => {
  const head = 'a'.repeat(40);
  const generation = 1594001;
  const refs = new Map<string, string>();
  let arrivals = 0;
  let release!: () => void;
  const ready = new Promise<void>((resolve) => release = resolve);
  const operations = {
    async createRef({ ref, sha }: { ref: string; sha: string }) {
      arrivals += 1;
      if (arrivals === 2) release();
      await ready;
      if (refs.has(ref)) {
        throw {
          status: 422,
          response: { data: { message: 'Reference already exists' } },
        };
      }
      refs.set(ref, sha);
    },
    getRef({ ref }: { ref: string }) {
      return Promise.resolve({ sha: refs.get(`refs/${ref}`)! });
    },
  };
  const command = `${OPENHANDS_COMMENT_COMMAND} phase=impl head=${head}`;
  const context = () =>
    Promise.resolve({
      generation,
      operations,
      priorCommentBodies: [],
      currentHead: head,
      liveLabels: ['status:impl-eval'],
    });

  const outcomes: Array<{ dispatch: boolean }> = await Promise.all([
    authorizeOpenHandsCommentTrigger({ body: command, authorAssociation: 'OWNER' }, context),
    authorizeOpenHandsCommentTrigger({ body: command, authorAssociation: 'MEMBER' }, context),
  ]);
  assertEquals(outcomes.filter((outcome) => outcome.dispatch).length, 1);
  assertEquals(outcomes.filter((outcome) => !outcome.dispatch).length, 1);
  assertEquals(refs.get(phaseEvalClaimRef({ generation, phase: 'impl', head })), head);
  assertEquals(
    (await authorizeOpenHandsCommentTrigger({
      body: command,
      authorAssociation: 'OWNER',
    }, context)).dispatch,
    false,
  );
});

Deno.test('phase dispatcher marker authorizes only the first claimed trigger comment', async () => {
  const head = 'a'.repeat(40);
  const generation = 1594001;
  const ref = phaseEvalClaimRef({ generation, phase: 'impl', head });
  const marker = phaseEvalMarker({ generation, phase: 'impl', head });
  const body = `${OPENHANDS_COMMENT_COMMAND} phase=impl head=${head}\n${marker}`;
  const operations = {
    createRef: () =>
      Promise.reject({
        status: 422,
        response: { data: { message: 'Reference already exists' } },
      }),
    getRef: ({ ref: shortRef }: { ref: string }) => {
      assertEquals(shortRef, ref.slice('refs/'.length));
      return Promise.resolve({ sha: head });
    },
  };

  assertEquals(
    (await authorizeOpenHandsCommentTrigger({
      body,
      authorAssociation: 'OWNER',
    }, () =>
      Promise.resolve({
        generation,
        operations,
        priorCommentBodies: [],
        currentHead: head,
        liveLabels: ['status:impl-eval'],
      }))).dispatch,
    true,
  );
  assertEquals(
    (await authorizeOpenHandsCommentTrigger({
      body,
      authorAssociation: 'OWNER',
    }, () =>
      Promise.resolve({
        generation,
        operations,
        priorCommentBodies: [body],
        currentHead: head,
        liveLabels: ['status:impl-eval'],
      }))).dispatch,
    false,
  );
});

Deno.test('existing generation marker blocks manual dispatch even when its claim ref is absent', async () => {
  const head = 'a'.repeat(40);
  const generation = 1594001;
  const marker = phaseEvalMarker({ generation, phase: 'impl', head });
  let createCalls = 0;
  const decision = await authorizeOpenHandsCommentTrigger({
    body: `${OPENHANDS_COMMENT_COMMAND} phase=impl head=${head}`,
    authorAssociation: 'OWNER',
  }, () =>
    Promise.resolve({
      generation,
      operations: {
        createRef: () => {
          createCalls += 1;
          return Promise.resolve();
        },
        getRef: () => Promise.resolve({ sha: head }),
      },
      priorCommentBodies: [marker],
      currentHead: head,
      liveLabels: ['status:impl-eval'],
    }));

  assertEquals(decision.dispatch, false);
  assertEquals(createCalls, 0);
});

Deno.test('formal phase command is zero-spend when live head or phase is stale', async () => {
  const head = 'a'.repeat(40);
  let createCalls = 0;
  const operations = {
    createRef: () => {
      createCalls += 1;
      return Promise.resolve();
    },
    getRef: () => Promise.resolve({ sha: head }),
  };
  const command = `${OPENHANDS_COMMENT_COMMAND} phase=impl head=${head}`;

  const staleHead = await authorizeOpenHandsCommentTrigger(
    { body: command, authorAssociation: 'OWNER' },
    () =>
      Promise.resolve({
        generation: 1,
        operations,
        priorCommentBodies: [],
        currentHead: 'b'.repeat(40),
        liveLabels: ['status:impl-eval'],
      }),
  );
  assertEquals(staleHead, { dispatch: false, triggerLine: '', reason: 'stale-phase-head' });

  const stalePhase = await authorizeOpenHandsCommentTrigger(
    { body: command, authorAssociation: 'OWNER' },
    () =>
      Promise.resolve({
        generation: 1,
        operations,
        priorCommentBodies: [],
        currentHead: head,
        liveLabels: ['status:impl'],
      }),
  );
  assertEquals(stalePhase, { dispatch: false, triggerLine: '', reason: 'phase-not-current' });
  assertEquals(createCalls, 0);
});
