import { assert, assertEquals, assertRejects } from '@std/assert';
import {
  type ExchangeProbeEffects,
  HttpExchangeMismatchError,
  probeExchange,
} from '../../../src/application/gates/scaffold/runtime/probe-plugin-resource.ts';
import { AUTH_SESSION_UNAUTHENTICATED_CONTRACT } from '../../../src/application/gates/scaffold/runtime/behavior-gates.ts';
import { startContractTestServer } from './contract-test-server.ts';

/** Neutral synthetic resource addresses (RFC 6761 `.test`); the fake fetch never resolves them. */
const BASE_URLS = ['http://auth.resource.test', 'https://auth.resource.test'] as const;
const SESSION_PATH = '/api/v1/auth/session';

Deno.test('exchange probe passes on the exact introspection contract', async () => {
  const effects = new FakeEffects([() => Response.json({ authenticated: false })]);

  const baseUrl = await probeExchange(
    BASE_URLS,
    SESSION_PATH,
    AUTH_SESSION_UNAUTHENTICATED_CONTRACT,
    effects,
  );

  assertEquals(baseUrl, 'http://auth.resource.test');
  assertEquals(effects.requests, [{
    url: 'http://auth.resource.test/api/v1/auth/session',
    method: 'GET',
    headers: undefined,
    redirect: 'manual',
  }]);
});

Deno.test('exchange probe fails a served wrong status at once without spending retries', async () => {
  const effects = new FakeEffects([() => new Response('boom', { status: 500 })]);

  await assertRejects(
    () => probeExchange(BASE_URLS, SESSION_PATH, AUTH_SESSION_UNAUTHENTICATED_CONTRACT, effects),
    HttpExchangeMismatchError,
    'expected HTTP 200, served 500',
  );
  assertEquals(effects.requests.length, 1);
  assertEquals(effects.delays, []);
});

Deno.test('exchange probe fails an unexpected served 502/503/504 at once (negative control)', async () => {
  for (const status of [502, 503, 504]) {
    const effects = new FakeEffects(
      [() => new Response('warming', { status })],
      () => new Response('denied', { status: 401 }),
    );

    await assertRejects(
      () =>
        probeExchange(BASE_URLS, '/api/v1/auth/signout', {
          method: 'POST',
          expectStatus: 401,
        }, effects),
      HttpExchangeMismatchError,
      `served ${status}`,
    );
    assertEquals(effects.requests.length, 1, `served ${status} must not be retried`);
    assertEquals(effects.delays, []);
  }
});

Deno.test('exchange probe keeps a decided mismatch when cancelling its body rejects (negative control)', async () => {
  const effects = new FakeEffects(
    [() => erroredBodyResponse(503)],
    () => new Response('denied', { status: 401 }),
  );

  await assertRejects(
    () =>
      probeExchange(BASE_URLS, '/api/v1/auth/signout', {
        method: 'POST',
        expectStatus: 401,
      }, effects),
    HttpExchangeMismatchError,
    'expected HTTP 401, served 503',
  );
  assertEquals(effects.requests.length, 1);
  assertEquals(effects.delays, []);
});

Deno.test('exchange probe fails when the introspection body differs (negative control)', async () => {
  const effects = new FakeEffects([
    () => Response.json({ authenticated: true, session: { id: 'leaked' } }),
  ]);

  await assertRejects(
    () => probeExchange(BASE_URLS, SESSION_PATH, AUTH_SESSION_UNAUTHENTICATED_CONTRACT, effects),
    HttpExchangeMismatchError,
    'expected body {"authenticated":false}',
  );
  assertEquals(effects.requests.length, 1);
});

Deno.test('exchange probe retries connection failures only', async () => {
  const effects = new FakeEffects([
    new TypeError('error sending request: Connection refused'),
    new TypeError('error sending request: Connection refused'),
    new TypeError('error sending request: Connection reset by peer'),
    () => Response.json({ authenticated: false }),
  ]);

  const baseUrl = await probeExchange(
    BASE_URLS,
    SESSION_PATH,
    AUTH_SESSION_UNAUTHENTICATED_CONTRACT,
    effects,
  );

  assertEquals(baseUrl, 'https://auth.resource.test');
  assertEquals(effects.requests.length, 4);
  assertEquals(effects.delays, [1_000]);
});

Deno.test('exchange probe gives up after its attempt budget when nothing is served', async () => {
  const effects = new FakeEffects([], new TypeError('Connection refused'), 3);

  await assertRejects(
    () => probeExchange(BASE_URLS, SESSION_PATH, AUTH_SESSION_UNAUTHENTICATED_CONTRACT, effects),
    Error,
    'was not served after 3 attempts',
  );
  assertEquals(effects.requests.length, 6);
  assertEquals(effects.delays.length, 2);
});

Deno.test('exchange probe sends the contract request headers', async () => {
  const effects = new FakeEffects([() => new Response('denied', { status: 401 })]);

  await probeExchange(BASE_URLS, '/api/v1/auth/signout', {
    method: 'POST',
    headers: { cookie: 'session=foreign' },
    expectStatus: 401,
  }, effects);

  assertEquals(effects.requests[0].method, 'POST');
  assertEquals(effects.requests[0].headers, { cookie: 'session=foreign' });
});

Deno.test('exchange probe over real fetch fails a 401 with a stalled body as a mismatch, not a timeout', async () => {
  const server = startContractTestServer();
  try {
    const effects = realFetchEffects(500);

    const started = performance.now();
    await assertRejects(
      () =>
        probeExchange(
          [server.baseUrl],
          '/stalled-401',
          AUTH_SESSION_UNAUTHENTICATED_CONTRACT,
          effects,
        ),
      HttpExchangeMismatchError,
      'expected HTTP 200, served 401',
    );
    const elapsedMs = performance.now() - started;

    assert(elapsedMs < effects.attemptTimeoutMs, `probe waited ${elapsedMs}ms on the body`);
    assertEquals(effects.delays, []);
  } finally {
    await server.close();
  }
});

Deno.test('exchange probe over real fetch does not follow a redirect to a matching route', async () => {
  const server = startContractTestServer();
  try {
    const target = await probeExchange(
      [server.baseUrl],
      '/session',
      AUTH_SESSION_UNAUTHENTICATED_CONTRACT,
      realFetchEffects(2_000),
    );
    assertEquals(target, server.baseUrl);

    await assertRejects(
      () =>
        probeExchange(
          [server.baseUrl],
          '/redirect-to-session',
          AUTH_SESSION_UNAUTHENTICATED_CONTRACT,
          realFetchEffects(2_000),
        ),
      HttpExchangeMismatchError,
      'served 302 (redirect to /session not followed)',
    );
  } finally {
    await server.close();
  }
});

/** A served response whose body stream already errored, so cancelling it rejects. */
function erroredBodyResponse(status: number): Response {
  const body = new ReadableStream<Uint8Array>({
    start: (controller) => controller.error(new Error('connection reset mid-body')),
  });
  return new Response(body, { status });
}

interface RecordedRequest {
  readonly url: string;
  readonly method: string | undefined;
  readonly headers: HeadersInit | undefined;
  readonly redirect: RequestRedirect | undefined;
}

type FakeReply = Error | (() => Response);

class FakeEffects implements ExchangeProbeEffects {
  readonly requests: RecordedRequest[] = [];
  readonly delays: number[] = [];
  readonly retryDelayMs = 1_000;
  readonly attemptTimeoutMs = 5_000;

  constructor(
    private readonly replies: readonly FakeReply[],
    private readonly fallback?: FakeReply,
    readonly attempts = 30,
  ) {}

  fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    this.requests.push({
      url: String(input),
      method: init?.method,
      headers: init?.headers,
      redirect: init?.redirect,
    });
    const reply = this.replies[this.requests.length - 1] ?? this.fallback;
    if (!reply) return Promise.reject(new Error('No fake response configured.'));
    return reply instanceof Error ? Promise.reject(reply) : Promise.resolve(reply());
  };

  delay = (milliseconds: number): Promise<void> => {
    this.delays.push(milliseconds);
    return Promise.resolve();
  };
}

function realFetchEffects(attemptTimeoutMs: number) {
  const delays: number[] = [];
  return {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
    delay: (milliseconds: number) => {
      delays.push(milliseconds);
      return Promise.resolve();
    },
    delays,
    attempts: 30,
    retryDelayMs: 1_000,
    attemptTimeoutMs,
  } satisfies ExchangeProbeEffects & { readonly delays: number[] };
}
