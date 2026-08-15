import { assertEquals, assertMatch, assertThrows } from '@std/assert';
import { OPENROUTER_MODEL_IDS } from '../../.llm/tools/agentic/config/models.ts';
import { buildOpenHandsComment } from '../../.llm/tools/agentic/lib/agentic-lib.ts';
import {
  authorizeOpenHandsCommentTrigger,
  buildOpenHandsRefusalReply,
  evaluateOpenHandsCommentTrigger,
  isOpenHandsCommentCandidate,
  isReportableOpenHandsDenial,
  OPENHANDS_COMMENT_COMMAND,
  OPENHANDS_REFUSAL_MARKER_PREFIX,
  OPENHANDS_REPORTABLE_DENIAL_REASONS,
} from './openhands-comment-trigger.mjs';
import { phaseEvalClaimRef, phaseEvalMarker } from './phase-eval-claim.mjs';

function decide(body: string, authorAssociation = 'OWNER') {
  return evaluateOpenHandsCommentTrigger({ body, authorAssociation });
}

const WATCHER_HEURISTIC_TOKEN_RE =
  /\b(PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT|FAIL_PLAN|FAIL)\b(?!\s*\|)/;

Deno.test('literal command candidates reach policy unless a recursion marker excludes them', () => {
  assertEquals(isOpenHandsCommentCandidate(`Please run ${OPENHANDS_COMMENT_COMMAND}`), true);
  assertEquals(isOpenHandsCommentCandidate(`> ${OPENHANDS_COMMENT_COMMAND}`), true);
  assertEquals(
    isOpenHandsCommentCandidate([
      '<!-- openhands-agent-summary -->',
      `Quoted for context: ${OPENHANDS_COMMENT_COMMAND}`,
    ].join('\n')),
    false,
  );
  assertEquals(
    isOpenHandsCommentCandidate([
      `${OPENHANDS_REFUSAL_MARKER_PREFIX}123 -->`,
      `Quoted for context: ${OPENHANDS_COMMENT_COMMAND}`,
    ].join('\n')),
    false,
  );
});

Deno.test('reportable denial vocabulary is exactly the five policy refusal reasons', () => {
  assertEquals(OPENHANDS_REPORTABLE_DENIAL_REASONS, [
    'command-not-first-token',
    'invalid-command-argument',
    'unknown-command-argument',
    'duplicate-command-argument',
    'author-not-authorized',
  ]);
  assertEquals(isReportableOpenHandsDenial('command-not-first-token'), true);
  assertEquals(isReportableOpenHandsDenial('invalid-command-argument'), true);
  assertEquals(isReportableOpenHandsDenial('unknown-command-argument'), true);
  assertEquals(isReportableOpenHandsDenial('duplicate-command-argument'), true);
  assertEquals(isReportableOpenHandsDenial('author-not-authorized'), true);
  assertEquals(isReportableOpenHandsDenial('phase-already-claimed'), false);
  assertEquals(isReportableOpenHandsDenial('not-command-candidate'), false);
});

Deno.test('each malformed or unauthorized literal candidate gets its attributable reason', () => {
  assertEquals(
    decide(`Please run ${OPENHANDS_COMMENT_COMMAND}`).reason,
    'command-not-first-token',
  );
  assertEquals(
    decide(`${OPENHANDS_COMMENT_COMMAND} output`).reason,
    'invalid-command-argument',
  );
  assertEquals(
    decide(`${OPENHANDS_COMMENT_COMMAND} mystery=value`).reason,
    'unknown-command-argument',
  );
  assertEquals(
    decide(`${OPENHANDS_COMMENT_COMMAND} output=pr-comment output=summary-only`).reason,
    'duplicate-command-argument',
  );
  assertEquals(
    decide(`${OPENHANDS_COMMENT_COMMAND} output=pr-comment`, 'CONTRIBUTOR').reason,
    'author-not-authorized',
  );
});

Deno.test('refusal replies are marker-bearing, sanitized, token-free, and non-recursive', () => {
  for (const reason of OPENHANDS_REPORTABLE_DENIAL_REASONS) {
    const refusal = buildOpenHandsRefusalReply({
      sourceCommentId: 4242,
      authorLogin: 'PASS',
      reason,
    });
    assertEquals(refusal.marker, `${OPENHANDS_REFUSAL_MARKER_PREFIX}4242 -->`);
    assertMatch(refusal.body, /@pass/);
    assertMatch(refusal.body, new RegExp(reason));
    assertEquals(refusal.body.includes(OPENHANDS_COMMENT_COMMAND), false);
    assertEquals(WATCHER_HEURISTIC_TOKEN_RE.test(refusal.body), false);
    assertEquals(isOpenHandsCommentCandidate(refusal.body), false);
    assertEquals(decide(refusal.body).reason, 'not-command-candidate');
  }

  const untrustedLogin = buildOpenHandsRefusalReply({
    sourceCommentId: '73',
    authorLogin: 'owner\n@openhands-agent',
    reason: 'author-not-authorized',
  });
  assertEquals(untrustedLogin.body.includes('owner'), false);
  assertEquals(untrustedLogin.body.includes(OPENHANDS_COMMENT_COMMAND), false);
  assertThrows(() =>
    buildOpenHandsRefusalReply({
      sourceCommentId: '73\n<!-- injected -->',
      authorLogin: 'owner',
      reason: 'author-not-authorized',
    })
  );
});

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
