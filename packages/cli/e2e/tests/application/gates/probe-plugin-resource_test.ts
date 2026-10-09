import { assertEquals, assertRejects } from '@std/assert';
import {
  type ExchangeProbeEffects,
  HttpExchangeMismatchError,
  probeExchange,
} from '../../../src/application/gates/scaffold/runtime/probe-plugin-resource.ts';
import { AUTH_SESSION_UNAUTHENTICATED_CONTRACT } from '../../../src/application/gates/scaffold/runtime/behavior-gates.ts';

const BASE_URLS = ['http://localhost:8094', 'https://localhost:8095'] as const;
const SESSION_PATH = '/api/v1/auth/session';

Deno.test('exchange probe passes on the exact introspection contract', async () => {
  const effects = new FakeEffects([jsonResponse(200, { authenticated: false })]);

  const baseUrl = await probeExchange(
    BASE_URLS,
    SESSION_PATH,
    AUTH_SESSION_UNAUTHENTICATED_CONTRACT,
    effects,
  );

  assertEquals(baseUrl, 'http://localhost:8094');
  assertEquals(effects.requests, [{
    url: 'http://localhost:8094/api/v1/auth/session',
    method: 'GET',
    headers: undefined,
  }]);
});

Deno.test('exchange probe fails a served wrong status at once without spending retries', async () => {
  const effects = new FakeEffects([new Response('boom', { status: 500 })]);

  await assertRejects(
    () => probeExchange(BASE_URLS, SESSION_PATH, AUTH_SESSION_UNAUTHENTICATED_CONTRACT, effects),
    HttpExchangeMismatchError,
    'expected HTTP 200, served 500',
  );
  assertEquals(effects.requests.length, 1);
  assertEquals(effects.delays, []);
});

Deno.test('exchange probe fails when the introspection body differs (negative control)', async () => {
  const effects = new FakeEffects([
    jsonResponse(200, { authenticated: true, session: { id: 'leaked' } }),
  ]);

  await assertRejects(
    () => probeExchange(BASE_URLS, SESSION_PATH, AUTH_SESSION_UNAUTHENTICATED_CONTRACT, effects),
    HttpExchangeMismatchError,
    'expected body {"authenticated":false}',
  );
  assertEquals(effects.requests.length, 1);
});

Deno.test('exchange probe retries connection failures and not-yet-up statuses', async () => {
  const effects = new FakeEffects([
    new TypeError('error sending request: Connection refused'),
    new TypeError('error sending request: Connection refused'),
    new Response('warming', { status: 503 }),
    new Response('warming', { status: 503 }),
    jsonResponse(200, { authenticated: false }),
  ]);

  const baseUrl = await probeExchange(
    BASE_URLS,
    SESSION_PATH,
    AUTH_SESSION_UNAUTHENTICATED_CONTRACT,
    effects,
  );

  assertEquals(baseUrl, 'http://localhost:8094');
  assertEquals(effects.requests.length, 5);
  assertEquals(effects.delays, [1_000, 1_000]);
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
  const effects = new FakeEffects([new Response('denied', { status: 401 })]);

  await probeExchange(BASE_URLS, '/api/v1/auth/signout', {
    method: 'POST',
    headers: { cookie: 'session=foreign' },
    expectStatus: 401,
  }, effects);

  assertEquals(effects.requests[0].method, 'POST');
  assertEquals(effects.requests[0].headers, { cookie: 'session=foreign' });
});

function jsonResponse(status: number, body: unknown): Response {
  return Response.json(body, { status });
}

interface RecordedRequest {
  readonly url: string;
  readonly method: string | undefined;
  readonly headers: HeadersInit | undefined;
}

class FakeEffects implements ExchangeProbeEffects {
  readonly requests: RecordedRequest[] = [];
  readonly delays: number[] = [];
  readonly retryDelayMs = 1_000;

  constructor(
    private readonly responses: readonly (Response | Error)[],
    private readonly fallback?: Response | Error,
    readonly attempts = 30,
  ) {}

  fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    this.requests.push({ url: String(input), method: init?.method, headers: init?.headers });
    const next = this.responses[this.requests.length - 1] ?? this.fallback;
    if (!next) return Promise.reject(new Error('No fake response configured.'));
    return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
  };

  delay = (milliseconds: number): Promise<void> => {
    this.delays.push(milliseconds);
    return Promise.resolve();
  };
}
