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
  assertEquals(resolveTelemetryEndpoint(undefined, {}), {
    endpoint: 'http://localhost:18888',
    source: 'default',
  });
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
