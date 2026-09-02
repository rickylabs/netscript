import { assertEquals, assertThrows } from '@std/assert';

import { ASPIRE_RESOURCE, GATE, SCAFFOLD } from '../../../src/domain/cli-surface.ts';
import { DATABASE, PACKAGE_SOURCE, REPORT_FORMAT } from '../../../src/domain/extension-axes.ts';
import type { RunContext } from '../../../src/domain/run-context.ts';
import {
  createListenerReadinessGates,
  listenerFaultExpectations,
  listenerReadinessExpectation,
  listenerReadinessWaitCommand,
} from '../../../src/application/gates/scaffold/runtime/listener-readiness-gates.ts';
import { assertOwnedListenerFaultExpectation } from '../../../src/application/gates/scaffold/runtime/listener-unreachable-fixture.ts';
import {
  listenerReadinessFailure,
  readListenerHealthReport,
} from '../../../src/application/gates/scaffold/runtime/verify-listener-readiness.ts';

Deno.test('listener readiness maps database and RESP resources to stable report keys', () => {
  assertEquals(listenerReadinessExpectation(ASPIRE_RESOURCE.POSTGRES), {
    resource: 'postgres',
    healthCheckKey: 'postgres_listener',
    timeoutSeconds: 300,
  });
  assertEquals(listenerReadinessExpectation(ASPIRE_RESOURCE.MSSQL), {
    resource: 'mssql',
    healthCheckKey: 'mssql_listener',
    timeoutSeconds: 600,
  });
  assertEquals(listenerReadinessExpectation(ASPIRE_RESOURCE.GARNET), {
    resource: 'garnet',
    healthCheckKey: 'garnet_resp',
    timeoutSeconds: 30,
  });
  assertEquals(listenerReadinessExpectation(ASPIRE_RESOURCE.AUTH), undefined);
});

Deno.test('describe-derived listener report requires the object-valued 13.5 shape', () => {
  const report = readListenerHealthReport(
    {
      resources: [{
        name: 'postgres-a1b2c3',
        displayName: 'postgres',
        healthReports: {
          postgres_listener: {
            status: 'Healthy',
            description: 'postgres listener ready on localhost:49152',
            data: { host: 'localhost', port: '49152' },
            exception: 'none',
          },
        },
      }],
    },
    'postgres',
    'postgres_listener',
  );
  assertEquals(report, {
    resourceName: 'postgres',
    healthCheckKey: 'postgres_listener',
    status: 'Healthy',
    description: 'postgres listener ready on localhost:49152',
    data: { host: 'localhost', port: '49152' },
    exception: 'none',
  });

  assertThrows(
    () => readListenerHealthReport({ resources: [] }, 'garnet', 'garnet_resp'),
    Error,
    'resource garnet was never published',
  );
  assertThrows(
    () =>
      readListenerHealthReport(
        { resources: [{ displayName: 'garnet', healthReports: {} }] },
        'garnet',
        'garnet_resp',
      ),
    Error,
    'health key garnet_resp was never published',
  );
});

Deno.test('published unhealthy listener report retains actionable diagnostic detail', () => {
  assertEquals(
    listenerReadinessFailure({
      resourceName: 'garnet',
      healthCheckKey: 'test_only_garnet_resp',
      status: 'Unhealthy',
      description: 'RESP listener unhealthy: EPROTO',
      data: {
        code: 'EPROTO',
        host: 'localhost',
        port: '18999',
        elapsedMs: '7',
        received: 'garbage\\r\\n',
      },
      exception: 'protocol mismatch',
    }),
    'garnet health key test_only_garnet_resp exists but is unhealthy: ' +
      'status=Unhealthy description="RESP listener unhealthy: EPROTO" ' +
      'data={"code":"EPROTO","host":"localhost","port":"18999","elapsedMs":"7","received":"garbage\\\\r\\\\n"} ' +
      'exception="protocol mismatch"',
  );
});

Deno.test('listener wait command verifies the named report after Aspire wait', () => {
  const expectation = listenerReadinessExpectation(ASPIRE_RESOURCE.POSTGRES);
  if (!expectation) throw new Error('Postgres listener readiness expectation is missing.');
  assertEquals(listenerReadinessWaitCommand(runContext(), expectation), [
    'deno',
    'run',
    '--allow-run=aspire',
    '/repo/packages/cli/e2e/src/application/gates/scaffold/runtime/verify-listener-readiness.ts',
    '/workspace/app/aspire/apphost.mts',
    'postgres',
    'postgres_listener',
    '300',
  ]);
});

Deno.test('failure/recovery gate owns exactly the synthetic Postgres and Garnet checks', () => {
  assertEquals(listenerFaultExpectations(DATABASE.POSTGRES), [
    {
      resource: 'postgres',
      healthCheckKey: 'test_only_postgres_listener',
      realHealthCheckKey: 'postgres_listener',
      controllerListener: 'postgres',
      timeoutSeconds: 300,
    },
    {
      resource: 'garnet',
      healthCheckKey: 'test_only_garnet_resp',
      realHealthCheckKey: 'garnet_resp',
      controllerListener: 'garnet',
      timeoutSeconds: 300,
    },
  ]);
  for (const database of [DATABASE.SQLITE, DATABASE.MYSQL, DATABASE.MSSQL]) {
    assertEquals(listenerFaultExpectations(database), [{
      resource: 'garnet',
      healthCheckKey: 'test_only_garnet_resp',
      realHealthCheckKey: 'garnet_resp',
      controllerListener: 'garnet',
      timeoutSeconds: 300,
    }]);
  }
  assertThrows(
    () =>
      assertOwnedListenerFaultExpectation({
        ...listenerFaultExpectations(DATABASE.POSTGRES)[0],
        healthCheckKey: 'postgres_listener',
      }),
    Error,
    'refused a non-test-only health-check target',
  );

  const gate = createListenerReadinessGates()[0];
  if (gate.kind !== 'command') throw new Error('Expected listener failure/recovery command gate.');
  assertEquals(gate.id, GATE.RUNTIME_HEALTH_LISTENER_UNREACHABLE);
  const command = gate.command(runContext());
  assertEquals(command.slice(0, 5), [
    'deno',
    'run',
    '--allow-read',
    '--allow-write',
    '--allow-run=aspire,docker',
  ]);
  assertEquals(
    command.at(-4),
    '/repo/packages/cli/e2e/src/application/gates/scaffold/runtime/listener-unreachable-fixture.ts',
  );
  assertEquals(command.at(-3), '/workspace/app/aspire/apphost.mts');
  assertEquals(command.at(-2), '/workspace/app');
  assertEquals(command.at(-1), DATABASE.POSTGRES);
});

function runContext(): RunContext {
  return {
    request: {
      suiteId: SCAFFOLD.RUNTIME,
      options: {
        repoRoot: '/repo',
        cliEntrypoint: 'packages/cli/bin/netscript-dev.ts',
        smokeRoot: '/workspace',
        projectName: 'app',
        database: DATABASE.POSTGRES,
        packageSource: PACKAGE_SOURCE.LOCAL,
        plugins: [],
        samples: true,
        cache: true,
        cleanup: true,
        format: REPORT_FORMAT.PRETTY,
        commandTimeoutMs: 900_000,
        httpTimeoutMs: 30_000,
      },
    },
    project: {
      repoRoot: '/repo',
      cliEntrypoint: 'packages/cli/bin/netscript-dev.ts',
      smokeRoot: '/workspace',
      projectName: 'app',
      projectRoot: '/workspace/app',
      appHost: '/workspace/app/aspire/apphost.mts',
    },
  };
}

Deno.test('an unpublished health report is absent, not an error', async () => {
  // Hosted regression: run 33629394228 failed at `runtime.health.listener-unreachable` with
  // "resource postgres health key postgres_listener was never published" after only 56 gates.
  // The wait loop used the throwing reader, so a report that had not appeared *yet* was fatal on
  // the first poll — inside a loop written to wait for that very report to change.
  const { findListenerHealthReport, readListenerHealthReport } = await import(
    '../../../src/application/gates/scaffold/runtime/verify-listener-readiness.ts'
  );
  const topology = { resources: [{ name: 'postgres', healthReports: {} }] };

  assertEquals(findListenerHealthReport(topology, 'postgres', 'postgres_listener'), undefined);
  assertThrows(
    () => readListenerHealthReport(topology, 'postgres', 'postgres_listener'),
    Error,
    'was never published',
  );

  const published = {
    resources: [{
      name: 'postgres',
      healthReports: { postgres_listener: { status: 'Unhealthy', description: 'ECONNREFUSED' } },
    }],
  };
  assertEquals(
    findListenerHealthReport(published, 'postgres', 'postgres_listener')?.status,
    'Unhealthy',
  );
});
