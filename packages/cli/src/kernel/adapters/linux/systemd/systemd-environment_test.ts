import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';

import { withObservabilityEnvironment } from './systemd-environment.ts';
import { renderSystemdUnit } from './systemd-unit.ts';

Deno.test('withObservabilityEnvironment merges the core OTEL env over a base record', () => {
  const merged = withObservabilityEnvironment(
    { NETSCRIPT_PROJECT_ROOT: '/opt/netscript' },
    { serviceName: 'workers-api', endpoint: 'http://otel:4318', serviceVersion: '1.2.3' },
  );

  assertEquals(merged.NETSCRIPT_PROJECT_ROOT, '/opt/netscript');
  assertEquals(merged.OTEL_DENO, 'true');
  assertEquals(merged.OTEL_SERVICE_NAME, 'workers-api');
  assertEquals(merged.OTEL_EXPORTER_OTLP_ENDPOINT, 'http://otel:4318');
  assertEquals(merged.OTEL_EXPORTER_OTLP_PROTOCOL, 'http/protobuf');
  assertEquals(merged.OTEL_RESOURCE_ATTRIBUTES, 'service.version=1.2.3');
});

Deno.test('renderSystemdUnit emits the merged OTEL vars as Environment= directives', () => {
  const unit = renderSystemdUnit({
    description: 'NetScript workers-api',
    execStart: '/opt/netscript/releases/current/workers-api',
    workingDirectory: '/opt/netscript/releases/current',
    environment: withObservabilityEnvironment({}, {
      serviceName: 'workers-api',
      endpoint: 'http://otel:4318',
    }),
    after: ['network.target'],
    wants: [],
  });

  assertStringIncludes(unit, 'Environment="OTEL_DENO=true"');
  assertStringIncludes(unit, 'Environment="OTEL_SERVICE_NAME=workers-api"');
  assertStringIncludes(unit, 'Environment="OTEL_EXPORTER_OTLP_ENDPOINT=http://otel:4318"');
  assertStringIncludes(unit, 'Environment="OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf"');
});
