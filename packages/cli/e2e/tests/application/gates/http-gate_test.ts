import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { HttpGate } from '../../../src/application/gates/http-gate.ts';
import { httpGate } from '../../../src/application/gates/scaffold/gate-factory.ts';
import { GATE, GATE_PHASE } from '../../../src/domain/cli-surface.ts';
import type { HttpGateDefinition } from '../../../src/domain/gate-definition.ts';
import type { RunContext, RunOptions } from '../../../src/domain/run-context.ts';
import type { SmokeProject } from '../../../src/domain/smoke-project.ts';
import type { HttpClient, HttpRequest, HttpResult } from '../../../src/ports/http-client.ts';

const SESSION_URL = 'http://127.0.0.1:9181/api/v1/auth/session';

Deno.test('HTTP gate retries transient request failures within the gate deadline', async () => {
  const http = new SequenceHttpClient([
    new Error('The signal has been aborted'),
    served(200, '{"status":"ok"}'),
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
  const http = new SequenceHttpClient([served(401, '{"error":"unauthenticated"}')]);
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
  const http = new SequenceHttpClient([served(204)]);
  const gate = new HttpGate(definition({ method: 'GET', expectStatus: 200 }), http);

  const result = await gate.execute(createContext());

  assertEquals(result.verdict, 'failed');
  assertEquals(result.attempts[0].failureClass, 'assertion');
});

Deno.test('HTTP gate fails a served wrong status at once without consuming the retry deadline', async () => {
  const http = new SequenceHttpClient([served(200, '{"authenticated":false}')]);
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

Deno.test('HTTP gate body predicate fails when the served body differs (negative control)', async () => {
  const http = new SequenceHttpClient([served(200, '{"authenticated":true}')]);
  const gate = new HttpGate(
    definition({
      method: 'GET',
      expectStatus: 200,
      expectBody: { kind: 'json-equals', value: { authenticated: false } },
    }),
    http,
  );

  const result = await gate.execute(createContext());

  assertEquals(result.verdict, 'failed');
  assertEquals(http.requests.length, 1);
  assertStringIncludes(result.error ?? '', 'expected body {"authenticated":false}');
});

Deno.test('HTTP gate retries a not-yet-up endpoint and fails by timeout when it never comes up', async () => {
  const http = new SequenceHttpClient([served(503), served(503), served(503)], served(503));
  const gate = new HttpGate(definition({ method: 'GET', expectStatus: 200 }), http);

  const result = await gate.execute(createContext(600));

  assertEquals(result.verdict, 'failed');
  assert(http.requests.length > 1, 'a not-yet-up endpoint must be retried');
  assertEquals(result.attempts[0].failureClass, 'timeout');
  assertStringIncludes(result.error ?? '', 'not served before the deadline');
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
): HttpGateDefinition {
  return {
    ...httpGate(GATE.BEHAVIOR_AUTH_SESSION_UNAUTHENTICATED, 'Auth session', SESSION_URL),
    ...exchange,
  };
}

function served(status: number, body = ''): HttpResult {
  return {
    status,
    ok: status >= 200 && status < 300,
    bodyPreview: body,
    body,
    bodyTruncated: false,
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

class SequenceHttpClient implements HttpClient {
  readonly requests: HttpRequest[] = [];

  constructor(
    private readonly responses: readonly (Error | HttpResult)[],
    private readonly fallback?: HttpResult,
  ) {}

  request(request: HttpRequest): Promise<HttpResult> {
    this.requests.push(request);
    const response = this.responses[this.requests.length - 1] ?? this.fallback;
    if (response instanceof Error) return Promise.reject(response);
    if (!response) throw new Error('No fake HTTP response configured.');
    return Promise.resolve(response);
  }
}
