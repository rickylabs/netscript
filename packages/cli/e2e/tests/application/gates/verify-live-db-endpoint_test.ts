import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import {
  compareDatabaseEndpointPorts,
  compareSecondReceiptWithLiveTopology,
  correlateUsersTelemetry,
  matchesDatabaseHealthContract,
  pollUsersTelemetryCorrelation,
  verifyGeneratedCrudAcceptance,
} from '../../../src/application/gates/scaffold/verify-live-db-endpoint.ts';

const realHealthResponse = await Deno.readTextFile(
  new URL('./fixtures/users-health-real-response.json', import.meta.url),
);
const unhealthyHealthResponse = await Deno.readTextFile(
  new URL('./fixtures/users-health-unhealthy-response.json', import.meta.url),
);
const aspire1353Describe = JSON.parse(
  await Deno.readTextFile(
    new URL('./fixtures/aspire-13.5.3-describe-postgres.json', import.meta.url),
  ),
);

Deno.test('second receipt accepts the live Aspire 13.5 persistent allocation', () => {
  assertEquals(
    compareSecondReceiptWithLiveTopology(
      'postgres://localhost:10538',
      aspire1353Describe,
      'postgres',
    ),
    {
      ok: true,
      receiptPostgresUrl: 'postgres://localhost:10538',
      livePostgresUrl: 'postgres://localhost:10538',
    },
  );
});

Deno.test('second receipt rejects a literal endpoint absent from the live second start', () => {
  const result = compareSecondReceiptWithLiveTopology(
    'postgres://localhost:5432',
    aspire1353Describe,
    'postgres',
  );

  assertEquals(result.ok, false);
  assertEquals(
    result.error,
    'second receipt Postgres URL "postgres://localhost:5432" did not match live second-start Postgres URL "postgres://localhost:10538"',
  );
});

Deno.test('database endpoint ports match across URL and keyword dialects', () => {
  assertEquals(
    compareDatabaseEndpointPorts(
      'postgres://localhost:45103/app',
      ' Host = localhost ; pOrT = 45103 ; Database = app ; ',
    ),
    { ok: true, livePort: 45103, usersPort: 45103 },
  );
});

Deno.test('database endpoint comparison rejects deliberately mismatched ports', () => {
  const result = compareDatabaseEndpointPorts(
    'postgres://localhost:45103/app',
    'Host=localhost;Port=45104;Database=app',
  );

  assertEquals(result.ok, false);
  assertStringIncludes(result.error ?? '', '45103');
  assertStringIncludes(result.error ?? '', '45104');
});

Deno.test('database endpoint comparison names an unparseable side and its value', () => {
  const liveFailure = compareDatabaseEndpointPorts(
    'postgres://localhost/app',
    'Host=localhost;Port=45103;Database=app',
  );
  assertEquals(liveFailure.ok, false);
  assertStringIncludes(liveFailure.error ?? '', 'live Postgres');
  assertStringIncludes(liveFailure.error ?? '', 'postgres://localhost/app');

  const usersFailure = compareDatabaseEndpointPorts(
    'postgres://localhost:45103/app',
    'Host=localhost;Database=app',
  );
  assertEquals(usersFailure.ok, false);
  assertStringIncludes(usersFailure.error ?? '', 'users DATABASE_URL');
  assertStringIncludes(usersFailure.error ?? '', 'Host=localhost;Database=app');
});

Deno.test('database health matcher accepts the captured users response contract', () => {
  assertEquals(matchesDatabaseHealthContract(realHealthResponse, 'postgres'), true);
});

Deno.test('database health matcher rejects an unhealthy database fixture', () => {
  // The fixture deliberately retains a healthy aggregate so this assertion proves
  // the matcher reads the database check's documented `healthy` boolean too.
  assertEquals(matchesDatabaseHealthContract(unhealthyHealthResponse, 'postgres'), false);
});

Deno.test('users telemetry correlation reports the compared ids and candidate spans', () => {
  const result = correlateUsersTelemetry(
    [{ traceId: 'structured-log-trace' }],
    [{
      traceId: 'otel-trace',
      spans: [{ name: 'GET /health' }, { name: 'db.query' }],
    }],
  );

  assertEquals(result.ok, false);
  assertStringIncludes(result.error ?? '', 'structured-log-trace');
  assertStringIncludes(result.error ?? '', 'otel-trace');
  assertStringIncludes(result.error ?? '', 'GET /health');
  assertStringIncludes(result.error ?? '', 'db.query');
});

Deno.test('users telemetry correlation polls until logs and traces converge', async () => {
  let logReads = 0;
  const receipt = await pollUsersTelemetryCorrelation(
    {
      queryLogs: () => {
        logReads++;
        return Promise.resolve(logReads < 3 ? [] : [{ traceId: 'shared-trace' }]);
      },
      queryTraces: () =>
        Promise.resolve([{
          traceId: 'shared-trace',
          spans: [{ name: 'GET /health' }],
        }]),
    },
    { maxAttempts: 3, delayMs: 0 },
  );

  assertEquals(receipt, { traceId: 'shared-trace', attempts: 3 });
});

Deno.test('generated CRUD acceptance checks seed, defined missing rows, and OpenAPI 404s', async () => {
  const requests: Array<{ readonly method: string; readonly url: string }> = [];
  const receipt = await verifyGeneratedCrudAcceptance(
    'http://127.0.0.1:43100',
    (input, init) => {
      const request = new Request(input, init);
      requests.push({ method: request.method, url: request.url });
      const url = new URL(request.url);

      if (url.pathname === '/api/users') {
        return Promise.resolve(jsonResponse({
          data: [{ id: 1, name: 'Seed User' }],
          pagination: { page: 1, limit: 100, total: 1 },
        }));
      }
      if (url.pathname === '/api/openapi.json') {
        return Promise.resolve(jsonResponse(openApiDocument()));
      }
      return Promise.resolve(jsonResponse({ code: 'NOT_FOUND' }, 404));
    },
  );

  assertEquals(receipt, {
    representativeId: 1,
    missingId: 2_147_483_647,
    projected404Methods: ['get', 'patch', 'delete'],
  });
  assertEquals(requests, [
    { method: 'GET', url: 'http://127.0.0.1:43100/api/users?page=1&limit=100' },
    { method: 'GET', url: 'http://127.0.0.1:43100/api/openapi.json' },
    { method: 'GET', url: 'http://127.0.0.1:43100/api/users/2147483647' },
    { method: 'PATCH', url: 'http://127.0.0.1:43100/api/users/2147483647' },
    { method: 'DELETE', url: 'http://127.0.0.1:43100/api/users/2147483647' },
  ]);
});

Deno.test('generated CRUD acceptance rejects a missing OpenAPI 404 projection', async () => {
  const document = openApiDocument(false);
  await assertRejects(
    () =>
      verifyGeneratedCrudAcceptance('http://127.0.0.1:43100', (input, init) => {
        const request = new Request(input, init);
        const url = new URL(request.url);
        if (url.pathname === '/api/users') {
          return Promise.resolve(jsonResponse({ data: [{ id: 1, name: 'Seed User' }] }));
        }
        if (url.pathname === '/api/openapi.json') {
          return Promise.resolve(jsonResponse(document));
        }
        return Promise.resolve(jsonResponse({ code: 'NOT_FOUND' }, 404));
      }),
    Error,
    'PATCH /users/{id} omitted 404',
  );
});

function openApiDocument(includePatch404 = true) {
  return {
    paths: {
      '/users/{id}': {
        get: { responses: { '200': {}, '404': {} } },
        patch: {
          responses: includePatch404 ? { '200': {}, '404': {} } : { '200': {} },
        },
        delete: { responses: { '200': {}, '404': {} } },
      },
    },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
