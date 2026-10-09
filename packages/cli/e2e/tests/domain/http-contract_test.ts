import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import {
  HTTP_CONTRACT_BODY_LIMIT_BYTES,
  type HttpExchangeContract,
  judgeHttpResponse,
  parseHttpExchangeContract,
  readBoundedBody,
} from '../../src/domain/http-contract.ts';

const INTROSPECTION: HttpExchangeContract = {
  method: 'GET',
  expectStatus: 200,
  expectBody: { kind: 'json-equals', value: { authenticated: false } },
};

Deno.test('exchange matches only the exact expected status and body', async () => {
  const introspection = await judgeHttpResponse(
    INTROSPECTION,
    Response.json({ authenticated: false }),
  );
  const refusal = await judgeHttpResponse(
    { method: 'GET', expectStatus: 401 },
    new Response('denied', { status: 401 }),
  );

  assertEquals(introspection.kind, 'matched');
  assertEquals(introspection.bodyPreview, '{"authenticated":false}');
  assertEquals(refusal.kind, 'matched');
});

Deno.test('exchange rejects a different 2xx instead of accepting any success', async () => {
  const outcome = await judgeHttpResponse(
    { method: 'GET', expectStatus: 200 },
    new Response(null, { status: 204 }),
  );

  assertEquals(outcome.kind, 'mismatch');
});

Deno.test('exchange treats every unexpected served status as a mismatch, 502/503/504 included', async () => {
  const contract: HttpExchangeContract = { method: 'GET', expectStatus: 401 };

  for (const status of [200, 302, 404, 500, 502, 503, 504]) {
    const outcome = await judgeHttpResponse(contract, new Response('served', { status }));
    assertEquals(outcome.kind, 'mismatch', `served ${status} must not be retryable`);
  }
  const expectedUnavailable = await judgeHttpResponse(
    { method: 'GET', expectStatus: 503 },
    new Response(null, { status: 503 }),
  );
  assertEquals(expectedUnavailable.kind, 'matched');
});

Deno.test('exchange judges the status from headers and cancels a body it never needed', async () => {
  let cancelled = false;
  const stalled = new ReadableStream<Uint8Array>({
    cancel: () => {
      cancelled = true;
    },
  });

  const outcome = await judgeHttpResponse(INTROSPECTION, new Response(stalled, { status: 401 }));

  assertEquals(outcome.kind, 'mismatch');
  assertEquals(cancelled, true);
  if (outcome.kind === 'mismatch') {
    assertStringIncludes(outcome.reason, 'expected HTTP 200, served 401');
  }
});

Deno.test('body cleanup cannot alter or delay a decided mismatch', async () => {
  const errored = new ReadableStream<Uint8Array>({
    start: (controller) => controller.error(new Error('connection reset mid-body')),
  });
  const neverSettles = new ReadableStream<Uint8Array>({ cancel: () => new Promise(() => {}) });
  const contract: HttpExchangeContract = { method: 'GET', expectStatus: 401 };

  const rejected = await judgeHttpResponse(contract, new Response(errored, { status: 503 }));
  const hanging = await withinMs(
    judgeHttpResponse(contract, new Response(neverSettles, { status: 503 })),
    1_000,
  );

  assertEquals(rejected.kind, 'mismatch');
  assertEquals(hanging.kind, 'mismatch');
});

Deno.test('exchange judges a redirect as served, never its target', async () => {
  const outcome = await judgeHttpResponse(
    INTROSPECTION,
    new Response(null, { status: 302, headers: { location: '/session' } }),
  );

  assertEquals(outcome.kind, 'mismatch');
  if (outcome.kind === 'mismatch') {
    assertStringIncludes(outcome.reason, 'served 302 (redirect to /session not followed)');
  }
});

Deno.test('exchange body predicate fails when the served body differs (negative control)', async () => {
  const bodies = [
    JSON.stringify({ authenticated: false, user: null }),
    JSON.stringify({ authenticated: true }),
    '<html></html>',
    'x'.repeat(HTTP_CONTRACT_BODY_LIMIT_BYTES + 1),
  ];

  for (const body of bodies) {
    const outcome = await judgeHttpResponse(INTROSPECTION, new Response(body, { status: 200 }));
    assertEquals(outcome.kind, 'mismatch', body.slice(0, 40));
  }
});

Deno.test('exchange contract parses from its command-line JSON form', () => {
  const headers = { authorization: 'Bearer example' };
  const parsed = parseHttpExchangeContract(JSON.stringify({ ...INTROSPECTION, headers }));

  assertEquals(parsed, { ...INTROSPECTION, headers });
  assertThrows(() => parseHttpExchangeContract('{"method":"PUT","expectStatus":200}'));
  assertThrows(() => parseHttpExchangeContract('{"method":"GET"}'));
  assertThrows(() =>
    parseHttpExchangeContract('{"method":"GET","expectStatus":200,"headers":{"a":1}}')
  );
  assertThrows(() =>
    parseHttpExchangeContract('{"method":"GET","expectStatus":200,"expectBody":{"kind":"x"}}')
  );
});

Deno.test('bounded body read stops at the limit instead of buffering the whole response', async () => {
  const small = await readBoundedBody(new Response('{"authenticated":false}'));
  const large = await readBoundedBody(
    new Response('x'.repeat(HTTP_CONTRACT_BODY_LIMIT_BYTES + 10)),
  );
  const empty = await readBoundedBody(new Response(null, { status: 204 }));

  assertEquals(small, { body: '{"authenticated":false}', bodyTruncated: false });
  assertEquals(large.bodyTruncated, true);
  assertEquals(large.body.length, HTTP_CONTRACT_BODY_LIMIT_BYTES);
  assertEquals(empty, { body: '', bodyTruncated: false });
});

async function withinMs<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`verdict not decided within ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
