import { assertEquals } from 'jsr:@std/assert@^1';

import { observabilityEnv } from './observability-convention.ts';

Deno.test('observabilityEnv emits OTEL_DENO=true with the derived service name and default protocol', () => {
  const env = observabilityEnv({ serviceName: 'workers-api' });

  // Canonical Deno-runtime flag value is the string 'true', never '1'.
  assertEquals(env.OTEL_DENO, 'true');
  assertEquals(env.OTEL_SERVICE_NAME, 'workers-api');
  assertEquals(env.OTEL_EXPORTER_OTLP_PROTOCOL, 'http/protobuf');
  // Endpoint + resource attrs are omitted when unconfigured.
  assertEquals(env.OTEL_EXPORTER_OTLP_ENDPOINT, undefined);
  assertEquals(env.OTEL_RESOURCE_ATTRIBUTES, undefined);
});

Deno.test('observabilityEnv wires the exporter endpoint and protocol when configured', () => {
  const env = observabilityEnv({
    serviceName: 'sagas-api',
    endpoint: 'http://otel-collector:4318',
    protocol: 'grpc',
  });

  assertEquals(env.OTEL_EXPORTER_OTLP_ENDPOINT, 'http://otel-collector:4318');
  assertEquals(env.OTEL_EXPORTER_OTLP_PROTOCOL, 'grpc');
});

Deno.test('observabilityEnv applies the service-name prefix', () => {
  const env = observabilityEnv({ serviceName: 'workers-api', serviceNamePrefix: 'acme-' });
  assertEquals(env.OTEL_SERVICE_NAME, 'acme-workers-api');
});

Deno.test('observabilityEnv emits the service-version resource attribute and optional standalone var', () => {
  const withoutVar = observabilityEnv({ serviceName: 'app', serviceVersion: '1.2.3' });
  assertEquals(withoutVar.OTEL_RESOURCE_ATTRIBUTES, 'service.version=1.2.3');
  assertEquals(withoutVar.OTEL_SERVICE_VERSION, undefined);

  const withVar = observabilityEnv({
    serviceName: 'workers-api',
    serviceVersion: '1.2.3',
    emitServiceVersionVar: true,
  });
  assertEquals(withVar.OTEL_RESOURCE_ATTRIBUTES, 'service.version=1.2.3');
  assertEquals(withVar.OTEL_SERVICE_VERSION, '1.2.3');
});

Deno.test('observabilityEnv returns an empty map when disabled', () => {
  assertEquals(observabilityEnv({ serviceName: 'workers-api', enabled: false }), {});
});
