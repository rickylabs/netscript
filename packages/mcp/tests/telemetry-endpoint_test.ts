import { assertEquals } from '@std/assert';
import { resolveTelemetryEndpoint } from '../src/domain/telemetry-endpoint.ts';

Deno.test('telemetry endpoint precedence is explicit, env, Aspire port, default', () => {
  assertEquals(
    resolveTelemetryEndpoint(' https://explicit.test/path ', {
      NETSCRIPT_TELEMETRY_ENDPOINT: 'http://env.test',
      ASPIRE_DASHBOARD_PORT: '19999',
    }),
    { endpoint: 'https://explicit.test', source: 'explicit' },
  );
  assertEquals(
    resolveTelemetryEndpoint(undefined, {
      NETSCRIPT_TELEMETRY_ENDPOINT: 'http://env.test/path',
      ASPIRE_DASHBOARD_PORT: '19999',
    }),
    { endpoint: 'http://env.test', source: 'netscript_env' },
  );
  assertEquals(resolveTelemetryEndpoint(undefined, { ASPIRE_DASHBOARD_PORT: '19999' }), {
    endpoint: 'http://localhost:19999',
    httpsFallback: 'https://localhost:19999',
    source: 'aspire_port',
  });
  assertEquals(
    resolveTelemetryEndpoint(undefined, {}, {
      readDashboardUrl: () => 'https://localhost:42501/?resource=dashboard',
    }),
    {
      endpoint: 'https://localhost:42501',
      source: 'aspire_ps',
    },
  );
  assertEquals(
    resolveTelemetryEndpoint(undefined, {}, {
      readDashboardUrl: () => undefined,
    }),
    {
      endpoint: 'http://localhost:18888',
      source: 'default',
    },
  );
});

Deno.test('Aspire port outranks aspire ps and aspire ps outranks default', () => {
  let reads = 0;
  const aspirePs = {
    readDashboardUrl: (): string => {
      reads++;
      return 'https://localhost:42501';
    },
  };

  assertEquals(
    resolveTelemetryEndpoint(undefined, { ASPIRE_DASHBOARD_PORT: '19999' }, aspirePs).source,
    'aspire_port',
  );
  assertEquals(reads, 0);
  assertEquals(resolveTelemetryEndpoint(undefined, {}, aspirePs).source, 'aspire_ps');
  assertEquals(reads, 1);
});

Deno.test('telemetry endpoint resolver ignores invalid and empty values', () => {
  assertEquals(
    resolveTelemetryEndpoint('file:///tmp/no', {
      NETSCRIPT_TELEMETRY_ENDPOINT: ' ',
      ASPIRE_DASHBOARD_PORT: '70000',
    }).source,
    'default',
  );
});
