import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { FetchHttpAdapter } from '../../../src/adapters/http/fetch-http-adapter.ts';
import { HttpGate } from '../../../src/application/gates/http-gate.ts';
import { httpGate } from '../../../src/application/gates/scaffold/gate-factory.ts';
import { GATE, GATE_PHASE } from '../../../src/domain/cli-surface.ts';
import type { HttpGateDefinition } from '../../../src/domain/gate-definition.ts';
import type { RunContext, RunOptions } from '../../../src/domain/run-context.ts';
import type { SmokeProject } from '../../../src/domain/smoke-project.ts';
import type { HttpClient, HttpRequest } from '../../../src/ports/http-client.ts';
import { startContractTestServer } from './contract-test-server.ts';

const SESSION_URL = 'http://127.0.0.1:9181/api/v1/auth/session';
const INTROSPECTION = {
  method: 'GET',
  expectStatus: 200,
  expectBody: { kind: 'json-equals', value: { authenticated: false } },
} as const;

Deno.test('HTTP gate retries connection failures within the gate deadline', async () => {
  const http = new SequenceHttpClient([
    new TypeError('error sending request: Connection refused'),
    () => Response.json({ status: 'ok' }),
  ]);
  const gate = new HttpGate({
    kind: 'http',
    id: GATE.BEHAVIOR_WORKERS_JOBS,
    title: 'List worker jobs',
    phase: GATE_PHASE.BEHAVIOR,
    critical: true,
    method: 'GET',
    expectStatus: 200,
    url: () => 'http://127.0.0.1:9181/api/v1/workers/jobs',
  }, http);

  const result = await gate.execute(createContext());

  assertEquals(result.verdict, 'passed');
  assertEquals(http.requests.length, 2);
  assertEquals(http.requests[0].timeoutMs, 5_000);
});

Deno.test('HTTP gate passes on the exact expected non-2xx status and sends request headers', async () => {
  const http = new SequenceHttpClient([() => new Response('denied', { status: 401 })]);
  const gate = new HttpGate(
    definition({ method: 'GET', expectStatus: 401, headers: { cookie: 'session=foreign' } }),
    http,
  );

  const result = await gate.execute(createContext());

  assertEquals(result.verdict, 'passed');
  assertEquals(http.requests[0].headers, { cookie: 'session=foreign' });
  assertEquals(http.requests[0].method, 'GET');
});

Deno.test('HTTP gate fails a different 2xx instead of accepting any success', async () => {
  const http = new SequenceHttpClient([() => new Response(null, { status: 204 })]);
  const gate = new HttpGate(definition({ method: 'GET', expectStatus: 200 }), http);

  const result = await gate.execute(createContext());

  assertEquals(result.verdict, 'failed');
  assertEquals(result.attempts[0].failureClass, 'assertion');
});

Deno.test('HTTP gate fails a served wrong status at once without consuming the retry deadline', async () => {
  const http = new SequenceHttpClient([() => Response.json({ authenticated: false })]);
  const gate = new HttpGate(definition({ method: 'GET', expectStatus: 401 }), http);
  const deadlineMs = 60_000;

  const started = performance.now();
  const result = await gate.execute(createContext(deadlineMs));
  const elapsedMs = performance.now() - started;

  assertEquals(result.verdict, 'failed');
  assertEquals(http.requests.length, 1);
  assert(elapsedMs < 1_000, `gate waited ${elapsedMs}ms of a ${deadlineMs}ms deadline`);
  assertEquals(result.attempts[0].failureClass, 'assertion');
  assertStringIncludes(result.error ?? '', 'expected HTTP 401, served 200');
});

Deno.test('HTTP gate fails an unexpected served 502/503/504 at once (negative control)', async () => {
  for (const status of [502, 503, 504]) {
    const http = new SequenceHttpClient(
      [() => new Response('warming', { status })],
      () => new Response('denied', { status: 401 }),
    );
    const gate = new HttpGate(definition({ method: 'GET', expectStatus: 401 }), http);

    const result = await gate.execute(createContext(60_000));

    assertEquals(result.verdict, 'failed', `served ${status} must fail, not retry into a pass`);
    assertEquals(http.requests.length, 1);
    assertEquals(result.attempts[0].failureClass, 'assertion');
    assertStringIncludes(result.error ?? '', `served ${status}`);
  }
});

Deno.test('HTTP gate keeps a decided mismatch when cancelling its body rejects (negative control)', async () => {
  const http = new SequenceHttpClient(
    [() => erroredBodyResponse(503)],
    () => new Response('denied', { status: 401 }),
  );
  const gate = new HttpGate(definition({ method: 'GET', expectStatus: 401 }), http);

  const result = await gate.execute(createContext(60_000));

  assertEquals(result.verdict, 'failed');
  assertEquals(http.requests.length, 1);
  assertEquals(result.attempts[0].failureClass, 'assertion');
  assertStringIncludes(result.error ?? '', 'expected HTTP 401, served 503');
});

Deno.test('HTTP gate body predicate fails when the served body differs (negative control)', async () => {
  const http = new SequenceHttpClient([() => Response.json({ authenticated: true })]);
  const gate = new HttpGate(definition(INTROSPECTION), http);

  const result = await gate.execute(createContext());

  assertEquals(result.verdict, 'failed');
  assertEquals(http.requests.length, 1);
  assertStringIncludes(result.error ?? '', 'expected body {"authenticated":false}');
});

Deno.test('HTTP gate fails by timeout only when nothing is ever served', async () => {
  const http = new SequenceHttpClient([], new TypeError('Connection refused'));
  const gate = new HttpGate(definition({ method: 'GET', expectStatus: 200 }), http);

  const result = await gate.execute(createContext(600));

  assertEquals(result.verdict, 'failed');
  assert(http.requests.length > 1, 'a connection failure must be retried');
  assertEquals(result.attempts[0].failureClass, 'timeout');
  assertStringIncludes(result.error ?? '', 'not served before the deadline');
});

Deno.test('HTTP gate through the fetch adapter fails a 401 with a stalled body as an assertion, not a timeout', async () => {
  const server = startContractTestServer();
  try {
    const gate = new HttpGate(
      definition(INTROSPECTION, `${server.baseUrl}/stalled-401`),
      new FetchHttpAdapter(),
    );
    const deadlineMs = 500;

    const started = performance.now();
    const result = await gate.execute(createContext(deadlineMs));
    const elapsedMs = performance.now() - started;

    assertEquals(result.verdict, 'failed');
    assertEquals(result.attempts[0].failureClass, 'assertion');
    assertStringIncludes(result.error ?? '', 'expected HTTP 200, served 401');
    assert(elapsedMs < deadlineMs, `gate waited ${elapsedMs}ms on a body it did not need`);
  } finally {
    await server.close();
  }
});

Deno.test('HTTP gate through the fetch adapter does not follow a redirect to a matching route', async () => {
  const server = startContractTestServer();
  try {
    const target = new HttpGate(
      definition(INTROSPECTION, `${server.baseUrl}/session`),
      new FetchHttpAdapter(),
    );
    const redirected = new HttpGate(
      definition(INTROSPECTION, `${server.baseUrl}/redirect-to-session`),
      new FetchHttpAdapter(),
    );

    const targetResult = await target.execute(createContext());
    const redirectedResult = await redirected.execute(createContext());

    assertEquals(targetResult.verdict, 'passed');
    assertEquals(redirectedResult.verdict, 'failed');
    assertEquals(redirectedResult.attempts[0].failureClass, 'assertion');
    assertStringIncludes(redirectedResult.error ?? '', 'served 302');
  } finally {
    await server.close();
  }
});

Deno.test('httpGate factory defaults to an exact GET 200 exchange', () => {
  const gate = httpGate(GATE.BEHAVIOR_WORKERS_JOBS, 'List worker jobs', SESSION_URL);

  assertEquals(gate.method, 'GET');
  assertEquals(gate.expectStatus, 200);
  assertEquals(gate.headers, undefined);
  assertEquals(gate.expectBody, undefined);
});

function definition(
  exchange: Pick<HttpGateDefinition, 'method' | 'expectStatus' | 'headers' | 'expectBody'>,
  url = SESSION_URL,
): HttpGateDefinition {
  return {
    ...httpGate(GATE.BEHAVIOR_AUTH_SESSION_UNAUTHENTICATED, 'Auth session', url),
    ...exchange,
  };
}

function createContext(httpTimeoutMs = 30_000): RunContext {
  return {
    request: {
      suiteId: 'scaffold.runtime',
      options: {
        repoRoot: '.',
        cliEntrypoint: './packages/cli/bin/netscript.ts',
        smokeRoot: '.llm/tmp/cli-e2e',
        projectName: 'http-gate-test',
        database: 'postgres',
        packageSource: 'local',
        plugins: [],
        samples: true,
        cache: true,
        cleanup: true,
        format: 'json',
        commandTimeoutMs: 30_000,
        httpTimeoutMs,
      } satisfies RunOptions,
    },
    project: {
      repoRoot: '.',
      cliEntrypoint: './packages/cli/bin/netscript.ts',
      smokeRoot: '.llm/tmp/cli-e2e',
      projectName: 'http-gate-test',
      projectRoot: '.llm/tmp/cli-e2e/http-gate-test',
      appHost: '.llm/tmp/cli-e2e/http-gate-test/aspire/apphost.mts',
    } satisfies SmokeProject,
  };
}

/** A served response whose body stream already errored, so cancelling it rejects. */
function erroredBodyResponse(status: number): Response {
  const body = new ReadableStream<Uint8Array>({
    start: (controller) => controller.error(new Error('connection reset mid-body')),
  });
  return new Response(body, { status });
}

type FakeReply = Error | (() => Response);

class SequenceHttpClient implements HttpClient {
  readonly requests: HttpRequest[] = [];

  constructor(
    private readonly replies: readonly FakeReply[],
    private readonly fallback?: FakeReply,
  ) {}

  request(request: HttpRequest): Promise<Response> {
    this.requests.push(request);
    const reply = this.replies[this.requests.length - 1] ?? this.fallback;
    if (!reply) throw new Error('No fake HTTP response configured.');
    return reply instanceof Error ? Promise.reject(reply) : Promise.resolve(reply());
  }
}
