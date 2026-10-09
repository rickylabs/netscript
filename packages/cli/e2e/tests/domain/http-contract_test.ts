import { assertEquals, assertThrows } from '@std/assert';
import {
  evaluateHttpExchange,
  HTTP_CONTRACT_BODY_LIMIT_BYTES,
  type HttpExchangeContract,
  parseHttpExchangeContract,
  readBoundedBody,
} from '../../src/domain/http-contract.ts';

const INTROSPECTION: HttpExchangeContract = {
  method: 'GET',
  expectStatus: 200,
  expectBody: { kind: 'json-equals', value: { authenticated: false } },
};

function served(status: number, body = '', bodyTruncated = false) {
  return { status, body, bodyTruncated };
}

Deno.test('exchange matches only the exact expected status and body', () => {
  assertEquals(
    evaluateHttpExchange(INTROSPECTION, served(200, '{"authenticated":false}')).kind,
    'matched',
  );
  assertEquals(
    evaluateHttpExchange({ method: 'GET', expectStatus: 401 }, served(401, 'denied')).kind,
    'matched',
  );
});

Deno.test('exchange rejects a different 2xx instead of accepting any success', () => {
  const outcome = evaluateHttpExchange({ method: 'GET', expectStatus: 200 }, served(204));

  assertEquals(outcome.kind, 'mismatch');
});

Deno.test('exchange treats a served wrong status as final and a gateway status as not up yet', () => {
  const contract: HttpExchangeContract = { method: 'GET', expectStatus: 401 };

  assertEquals(evaluateHttpExchange(contract, served(200, '{}')).kind, 'mismatch');
  assertEquals(evaluateHttpExchange(contract, served(500)).kind, 'mismatch');
  assertEquals(evaluateHttpExchange(contract, served(404)).kind, 'mismatch');
  for (const status of [502, 503, 504]) {
    assertEquals(evaluateHttpExchange(contract, served(status)).kind, 'pending');
  }
  assertEquals(
    evaluateHttpExchange({ method: 'GET', expectStatus: 503 }, served(503)).kind,
    'matched',
  );
});

Deno.test('exchange body predicate fails when the served body differs (negative control)', () => {
  const extraField = evaluateHttpExchange(
    INTROSPECTION,
    served(200, '{"authenticated":false,"user":null}'),
  );
  const authenticated = evaluateHttpExchange(INTROSPECTION, served(200, '{"authenticated":true}'));
  const notJson = evaluateHttpExchange(INTROSPECTION, served(200, '<html></html>'));
  const truncated = evaluateHttpExchange(
    INTROSPECTION,
    served(200, '{"authenticated":false}', true),
  );

  assertEquals(extraField.kind, 'mismatch');
  assertEquals(authenticated.kind, 'mismatch');
  assertEquals(notJson.kind, 'mismatch');
  assertEquals(truncated.kind, 'mismatch');
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
