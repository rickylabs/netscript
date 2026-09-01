import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';

import { generateRegisterInfrastructure } from '../../../../src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts';
import { generateRegisterApps } from '../../../../src/kernel/templates/aspire/helpers/register/generate-register-apps.ts';
import { buildCacheBlock } from '../../../../src/kernel/templates/aspire/generate-appsettings.ts';
import { DATABASE } from '../../../src/domain/extension-axes.ts';
import {
  injectListenerFaultHealthChecks,
  injectReadinessFixtureApps,
  TEST_ONLY_GARNET_HEALTH_KEY,
  TEST_ONLY_POSTGRES_HEALTH_KEY,
} from '../../../src/application/gates/scaffold/runtime/prepare-readiness-fixture.ts';

Deno.test('listener fault splice accepts the E2E two-cache Auto generator output', () => {
  const redis = buildCacheBlock('redis');
  const garnet = buildCacheBlock('garnet');
  const source = generateRegisterInfrastructure({
    databases: {},
    caches: {
      [redis.key]: { ...redis.block, Enabled: true },
      [garnet.key]: { ...garnet.block, Enabled: true, Mode: 'Auto' },
    },
    primaryCache: garnet.key,
  });

  assertEquals(healthAttachmentCount(source, 'redis_resp'), 1);
  assertEquals(healthAttachmentCount(source, 'garnet_resp'), 2);
  const injected = injectListenerFaultHealthChecks(source, DATABASE.SQLITE);
  assertEquals(healthAttachmentCount(injected, TEST_ONLY_GARNET_HEALTH_KEY), 2);
  assertAutoBranchInjectionPlacement(injected);
});

Deno.test('listener fault splice attaches test-only checks at generator-derived markers', () => {
  const source = generatedInfrastructure();
  const cases = [
    { source, postgresBinding: 'db_0_server', garnetBinding: 'cache_0' },
    {
      source: withSingleQuotedHealthKeys(source),
      postgresBinding: 'db_0_server',
      garnetBinding: 'cache_0',
    },
    {
      source: source.replaceAll('db_0_server', 'db_7_server').replaceAll('cache_0', 'cache_3'),
      postgresBinding: 'db_7_server',
      garnetBinding: 'cache_3',
    },
  ];

  for (const { source, postgresBinding, garnetBinding } of cases) {
    const injected = injectListenerFaultHealthChecks(source);
    assertStringIncludes(
      injected,
      `builder.addHealthCheck('${TEST_ONLY_POSTGRES_HEALTH_KEY}', createListenerReadinessCheck({ kind: 'tcp', host: 'localhost', port: 18998 }));`,
    );
    assertStringIncludes(
      injected,
      `await ${postgresBinding}.withHealthCheck('${TEST_ONLY_POSTGRES_HEALTH_KEY}');`,
    );
    assertStringIncludes(
      injected,
      `builder.addHealthCheck('${TEST_ONLY_GARNET_HEALTH_KEY}', createRespPingCheck({ host: 'localhost', port: 18999 }));`,
    );
    assertStringIncludes(
      injected,
      `await ${garnetBinding}.withHealthCheck('${TEST_ONLY_GARNET_HEALTH_KEY}');`,
    );
  }
});

Deno.test('readiness app splice injects the controller once at the generated return marker', () => {
  const source = generateRegisterApps({
    apps: {},
    version: 'e2e',
    denoDefaults: { Permissions: [], WatchMode: false },
  });
  const injected = injectReadinessFixtureApps(source);
  assertStringIncludes(injected, 'apps.set("readiness-dead-port"');
  assertStringIncludes(injected, 'apps.set("listener-fault-controller"');
  assertThrows(
    () => injectReadinessFixtureApps(withSingleQuotedAppNames(injected)),
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
    () => injectListenerFaultHealthChecks(withoutHealthAttachment(source, 'garnet_resp')),
    Error,
    'generated register-infrastructure helper has no garnet health-check attachment',
  );
  assertThrows(
    () => injectListenerFaultHealthChecks(withoutHealthAttachment(source, 'postgres_listener')),
    Error,
    'generated register-infrastructure helper has no postgres health-check attachment',
  );

  const injected = injectListenerFaultHealthChecks(source);
  assertThrows(
    () => injectListenerFaultHealthChecks(injected),
    Error,
    'test-only listener health checks were already registered',
  );
});

Deno.test('listener fault splice supports one Garnet container attachment without Postgres', () => {
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

function withSingleQuotedHealthKeys(source: string): string {
  return source
    .replaceAll('"postgres_listener"', "'postgres_listener'")
    .replaceAll('"garnet_resp"', "'garnet_resp'");
}

function withSingleQuotedAppNames(source: string): string {
  return source
    .replaceAll('"readiness-dead-port"', "'readiness-dead-port'")
    .replaceAll('"listener-fault-controller"', "'listener-fault-controller'");
}

function withoutHealthAttachment(source: string, key: string): string {
  const lines = source.split('\n');
  const matches = lines.filter((line) => line.includes('.withHealthCheck(') && line.includes(key));
  assertEquals(matches.length, 1, `expected one generated ${key} attachment`);
  return lines.filter((line) => line !== matches[0]).join('\n');
}

function healthAttachmentCount(source: string, key: string): number {
  return source.split('\n').filter((line) =>
    line.includes('.withHealthCheck(') && line.includes(key)
  ).length;
}

function assertAutoBranchInjectionPlacement(source: string): void {
  const lines = source.split('\n');
  const realAttachmentLines = lines.flatMap((line, index) =>
    line.includes('.withHealthCheck("garnet_resp")') ? [index] : []
  );
  assertEquals(realAttachmentLines.length, 2);

  for (const realAttachmentLine of realAttachmentLines) {
    assertStringIncludes(
      lines[realAttachmentLine + 1],
      `builder.addHealthCheck('${TEST_ONLY_GARNET_HEALTH_KEY}'`,
    );
    assertStringIncludes(
      lines[realAttachmentLine + 2],
      `await cache_1.withHealthCheck('${TEST_ONLY_GARNET_HEALTH_KEY}');`,
    );
  }

  const elseLine = lines.findIndex((line, index) =>
    index > realAttachmentLines[0] && line.trim() === '} else {'
  );
  assertEquals(elseLine > realAttachmentLines[0], true);
  assertEquals(realAttachmentLines[1] > elseLine, true);
  assertEquals(
    lines.slice(elseLine, realAttachmentLines[1] + 3).filter((line) =>
      line.includes(`builder.addHealthCheck('${TEST_ONLY_GARNET_HEALTH_KEY}'`)
    ).length,
    1,
  );
}
