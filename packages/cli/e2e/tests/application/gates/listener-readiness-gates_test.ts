import { assertEquals, assertThrows } from '@std/assert';

import { ASPIRE_RESOURCE, GATE, SCAFFOLD } from '../../../src/domain/cli-surface.ts';
import { DATABASE, PACKAGE_SOURCE, REPORT_FORMAT } from '../../../src/domain/extension-axes.ts';
import type { RunContext } from '../../../src/domain/run-context.ts';
import {
  createListenerReadinessGates,
  listenerReadinessExpectation,
  listenerReadinessWaitCommand,
  listenerUnreachableExpectations,
} from '../../../src/application/gates/scaffold/runtime/listener-readiness-gates.ts';
import { readListenerHealthReport } from '../../../src/application/gates/scaffold/runtime/evidence/listener-readiness.ts';

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
    timeoutSeconds: 300,
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
  });

  assertThrows(
    () =>
      readListenerHealthReport(
        { resources: [{ displayName: 'postgres', healthReports: [] }] },
        'postgres',
        'postgres_listener',
      ),
    Error,
    'healthReports is not an object',
  );
});

Deno.test('listener wait command verifies the named report after Aspire wait', () => {
  const expectation = listenerReadinessExpectation(ASPIRE_RESOURCE.POSTGRES);
  if (!expectation) throw new Error('Postgres listener readiness expectation is missing.');
  assertEquals(listenerReadinessWaitCommand(runContext(), expectation), [
    'deno',
    'run',
    '--allow-run=aspire',
    '/repo/packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/listener-readiness.ts',
    '/workspace/app/aspire/apphost.mts',
    'postgres',
    'postgres_listener',
    '300',
  ]);
});

Deno.test('failure/recovery gate selects database plus Garnet, and SQLite only Garnet', () => {
  assertEquals(listenerUnreachableExpectations(DATABASE.POSTGRES).map((entry) => entry.resource), [
    'postgres',
    'garnet',
  ]);
  assertEquals(listenerUnreachableExpectations(DATABASE.SQLITE).map((entry) => entry.resource), [
    'garnet',
  ]);

  const gate = createListenerReadinessGates(DATABASE.POSTGRES)[0];
  if (gate.kind !== 'command') throw new Error('Expected listener failure/recovery command gate.');
  assertEquals(gate.id, GATE.RUNTIME_HEALTH_LISTENER_UNREACHABLE);
  const command = gate.command(runContext());
  assertEquals(command.slice(0, 5), [
    'deno',
    'run',
    '--allow-run=aspire',
    '--allow-write',
    '/repo/packages/cli/e2e/src/application/gates/scaffold/runtime/listener-unreachable-fixture.ts',
  ]);
  assertEquals(command.at(-2), '/workspace/app');
  assertEquals(
    command.at(-1),
    '[{"resource":"postgres","healthCheckKey":"postgres_listener","timeoutSeconds":300},{"resource":"garnet","healthCheckKey":"garnet_resp","timeoutSeconds":300}]',
  );
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
