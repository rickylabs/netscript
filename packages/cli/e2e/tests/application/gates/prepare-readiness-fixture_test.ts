import { assertStringIncludes, assertThrows } from '@std/assert';

import { generateRegisterInfrastructure } from '../../../../src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts';
import { generateRegisterApps } from '../../../../src/kernel/templates/aspire/helpers/register/generate-register-apps.ts';
import { DATABASE } from '../../../src/domain/extension-axes.ts';
import {
  injectListenerFaultHealthChecks,
  injectReadinessFixtureApps,
  TEST_ONLY_GARNET_HEALTH_KEY,
  TEST_ONLY_POSTGRES_HEALTH_KEY,
} from '../../../src/application/gates/scaffold/runtime/prepare-readiness-fixture.ts';

Deno.test('listener fault splice attaches test-only checks at generator-derived markers', () => {
  const source = generatedInfrastructure();
  const injected = injectListenerFaultHealthChecks(source);

  assertStringIncludes(
    injected,
    `builder.addHealthCheck('${TEST_ONLY_POSTGRES_HEALTH_KEY}', createListenerReadinessCheck({ kind: 'tcp', host: 'localhost', port: 18998 }));`,
  );
  assertStringIncludes(
    injected,
    `await postgres_server.withHealthCheck('${TEST_ONLY_POSTGRES_HEALTH_KEY}');`,
  );
  assertStringIncludes(
    injected,
    `builder.addHealthCheck('${TEST_ONLY_GARNET_HEALTH_KEY}', createRespPingCheck({ host: 'localhost', port: 18999 }));`,
  );
  assertStringIncludes(
    injected,
    `await garnet.withHealthCheck('${TEST_ONLY_GARNET_HEALTH_KEY}');`,
  );
});

Deno.test('readiness app splice injects the controller once at the generated return marker', () => {
  const source = generateRegisterApps({
    apps: {},
    version: 'e2e',
    denoDefaults: { Permissions: [], WatchMode: false },
  });
  const injected = injectReadinessFixtureApps(source);
  assertStringIncludes(injected, "apps.set('readiness-dead-port'");
  assertStringIncludes(injected, "apps.set('listener-fault-controller'");
  assertThrows(
    () => injectReadinessFixtureApps(injected),
    Error,
    'readiness-dead-port fixture was already registered',
  );
  assertThrows(
    () => injectReadinessFixtureApps(source.replace('  return apps;', '')),
    Error,
    'generated register-apps helper has no return marker',
  );
});

Deno.test('listener fault splice fails closed on missing markers and double registration', () => {
  const source = generatedInfrastructure();
  assertThrows(
    () =>
      injectListenerFaultHealthChecks(
        source.replace("  await garnet.withHealthCheck('garnet_resp');", ''),
      ),
    Error,
    'generated register-infrastructure helper has no garnet health-check marker',
  );

  const injected = injectListenerFaultHealthChecks(source);
  assertThrows(
    () => injectListenerFaultHealthChecks(injected),
    Error,
    'test-only listener health checks were already registered',
  );
});

Deno.test('listener fault splice injects Garnet only when Postgres is absent', () => {
  const source = generateRegisterInfrastructure({
    databases: {},
    caches: {
      garnet: {
        Enabled: true,
        Engine: 'Garnet',
        Mode: 'Container',
      },
    },
    primaryCache: 'garnet',
  });
  const injected = injectListenerFaultHealthChecks(source, DATABASE.SQLITE);

  assertStringIncludes(injected, TEST_ONLY_GARNET_HEALTH_KEY);
  if (injected.includes(TEST_ONLY_POSTGRES_HEALTH_KEY)) {
    throw new Error('Garnet-only injection unexpectedly registered the Postgres test key');
  }
});

function generatedInfrastructure(): string {
  return generateRegisterInfrastructure({
    databases: {
      postgres: {
        Enabled: true,
        Engine: 'Postgres',
        Mode: 'Container',
        Persistent: false,
      },
    },
    caches: {
      garnet: {
        Enabled: true,
        Engine: 'Garnet',
        Mode: 'Container',
      },
    },
    primaryDatabase: 'postgres',
    primaryCache: 'garnet',
  });
}
