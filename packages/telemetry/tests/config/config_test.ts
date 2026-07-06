import { assertEquals } from '@std/assert';
import { describeTelemetryConfig, getTelemetryConfig, resetConfig } from '../../config.ts';

Deno.test('getTelemetryConfig reads OTEL environment values', () => {
  Deno.env.set('OTEL_DENO', 'true');
  Deno.env.set('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318');
  Deno.env.set('OTEL_SERVICE_NAME', 'telemetry-test');
  Deno.env.set('OTEL_RESOURCE_ATTRIBUTES', 'service.version=2.0.0,deployment.environment=dev');
  Deno.env.set('OTEL_TRACES_SAMPLER', 'always_on');
  Deno.env.set('OTEL_LOG_LEVEL', 'debug');

  try {
    resetConfig();
    const config = getTelemetryConfig();
    const description = describeTelemetryConfig();

    assertEquals(config.enabled, true);
    assertEquals(config.endpoint, 'http://localhost:4318');
    assertEquals(
      config.semconvStabilityOptIn,
      'messaging,rpc,gen_ai_latest_experimental',
    );
    assertEquals(config.serviceName, 'telemetry-test');
    assertEquals(config.serviceVersion, '2.0.0');
    assertEquals(config.resourceAttributes['deployment.environment'], 'dev');
    assertEquals(config.sampler, 'always_on');
    assertEquals(config.debug, true);
    assertEquals(description.endpoint, 'http://localhost:4318');
    assertEquals(
      description.semconvStabilityOptIn,
      'messaging,rpc,gen_ai_latest_experimental',
    );
  } finally {
    Deno.env.delete('OTEL_DENO');
    Deno.env.delete('OTEL_EXPORTER_OTLP_ENDPOINT');
    Deno.env.delete('OTEL_SERVICE_NAME');
    Deno.env.delete('OTEL_RESOURCE_ATTRIBUTES');
    Deno.env.delete('OTEL_TRACES_SAMPLER');
    Deno.env.delete('OTEL_LOG_LEVEL');
    resetConfig();
  }
});
