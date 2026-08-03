import { assert, assertEquals } from '@std/assert';
import { LOOPBACK_HOST, LOOPBACK_HTTP_PROTOCOL } from '../config/endpoints.ts';
import { OPEN_EVALUATOR_MODEL_IDS } from '../config/models.ts';
import {
  createEvaluatorModelGuardHandler,
  type EvaluatorModelAttempt,
  evaluatorModelAuditPath,
} from './evaluator-model-guard.ts';

const session = '019f9fc7-349e-7bf4-b6f9-084a40e20f92';
const upstream = 'https://gateway.example.test/api';

function request(model: string, secret = 'SYNTHETIC_SECRET_MUST_NOT_BE_LOGGED'): Request {
  return new Request(`${LOOPBACK_HTTP_PROTOCOL}//${LOOPBACK_HOST}:9999/v1/messages?beta=true`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: secret }] }),
  });
}

Deno.test('evaluator model guard forwards an approved open model without changing the request', async () => {
  const seen: Request[] = [];
  const audits: EvaluatorModelAttempt[] = [];
  const handler = createEvaluatorModelGuardHandler(session, upstream, {
    fetch: (input) => {
      seen.push(input);
      return Promise.resolve(new Response('stream', { status: 200 }));
    },
    audit: (attempt) => {
      audits.push(attempt);
      return Promise.resolve();
    },
    abortEvaluation: () => {
      throw new Error('approved request attempted to abort');
    },
    now: () => '2026-08-03T00:00:00.000Z',
  });
  const model = OPEN_EVALUATOR_MODEL_IDS[0];
  const response = await handler(request(model));
  assertEquals(response.status, 200);
  assertEquals(seen.length, 1);
  assertEquals(seen[0]?.url, `${upstream}/v1/messages?beta=true`);
  assertEquals((await seen[0]?.json())?.model, model);
  assertEquals(audits, []);
});

Deno.test('evaluator model guard rejects, audits, and aborts a prohibited child model request', async () => {
  const secret = 'SYNTHETIC_SECRET_MUST_NOT_BE_LOGGED';
  const audits: EvaluatorModelAttempt[] = [];
  const aborted: EvaluatorModelAttempt[] = [];
  let forwarded = false;
  const handler = createEvaluatorModelGuardHandler(session, upstream, {
    fetch: () => {
      forwarded = true;
      return Promise.resolve(new Response('unexpected'));
    },
    audit: (attempt) => {
      audits.push(attempt);
      return Promise.resolve();
    },
    abortEvaluation: (attempt) => aborted.push(attempt),
    now: () => '2026-08-03T00:00:00.000Z',
  });
  const response = await handler(request('closed/provider-model', secret));
  assertEquals(response.status, 403);
  assertEquals(forwarded, false);
  assertEquals(audits, [{
    event: 'evaluator_model_request_denied',
    model: 'closed/provider-model',
    requestingSession: session,
    timestamp: '2026-08-03T00:00:00.000Z',
  }]);
  assertEquals(aborted, audits);
  assert(!JSON.stringify(audits).includes(secret));
});

Deno.test('evaluator model guard fails closed when a model-bearing request omits its model id', async () => {
  const audits: EvaluatorModelAttempt[] = [];
  const handler = createEvaluatorModelGuardHandler(session, upstream, {
    fetch: () => Promise.resolve(new Response('unexpected')),
    audit: (attempt) => {
      audits.push(attempt);
      return Promise.resolve();
    },
    abortEvaluation: () => undefined,
    now: () => '2026-08-03T00:00:00.000Z',
  });
  const response = await handler(
    new Request(
      `${LOOPBACK_HTTP_PROTOCOL}//${LOOPBACK_HOST}:9999/v1/messages`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      },
    ),
  );
  assertEquals(response.status, 403);
  assertEquals(audits[0]?.model, '<missing>');
  assertEquals(audits[0]?.requestingSession, session);
});

Deno.test('evaluator model guard aborts even when its durable audit write fails', async () => {
  let aborted = false;
  const handler = createEvaluatorModelGuardHandler(session, upstream, {
    fetch: () => Promise.resolve(new Response('unexpected')),
    audit: () => Promise.reject(new Error('synthetic audit failure')),
    abortEvaluation: () => {
      aborted = true;
    },
    now: () => '2026-08-03T00:00:00.000Z',
  });
  let failed = false;
  try {
    await handler(request('closed/provider-model'));
  } catch {
    failed = true;
  }
  assertEquals(failed, true);
  assertEquals(aborted, true);
});

Deno.test('evaluator audit paths cannot escape their dedicated root', () => {
  assertEquals(
    evaluatorModelAuditPath('../foreign/session'),
    '.llm/tmp/agentic/evaluator-policy/.._foreign_session.jsonl',
  );
});
