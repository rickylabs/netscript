import { assertEquals, assertStringIncludes } from '@std/assert';
import {
  compareDatabaseEndpointPorts,
  correlateUsersTelemetry,
  matchesDatabaseHealthContract,
  pollUsersTelemetryCorrelation,
} from '../../../src/application/gates/scaffold/verify-live-db-endpoint.ts';

const realHealthResponse = await Deno.readTextFile(
  new URL('./fixtures/users-health-real-response.json', import.meta.url),
);
const unhealthyHealthResponse = await Deno.readTextFile(
  new URL('./fixtures/users-health-unhealthy-response.json', import.meta.url),
);

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
