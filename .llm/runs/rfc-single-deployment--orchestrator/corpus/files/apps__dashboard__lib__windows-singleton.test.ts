import { assertEquals, assertThrows } from '@std/assert';
import { join } from '@std/path';
import {
  resolveWindowsSingletonPaths,
  windowsSingletonServiceEnvironment,
  windowsSingletonTelemetryEnvironment,
} from './windows-singleton.ts';

Deno.test('windows singleton paths use per-user application data', () => {
  const paths = resolveWindowsSingletonPaths(
    { LOCALAPPDATA: 'C:\\Users\\alice\\AppData\\Local' },
    'C:\\Program Files\\eis-chat',
  );

  assertEquals(paths.dataDir, join('C:\\Users\\alice\\AppData\\Local', 'eis-chat'));
  assertEquals(paths.databaseUrl, `file:${join(paths.dataDir, 'eis_chat.db')}`);
  assertEquals(paths.channelDataDir, join(paths.dataDir, 'channels'));
  assertEquals(paths.logDir, join(paths.dataDir, 'logs'));
  assertEquals(paths.sidecarPath, join('C:\\Program Files\\eis-chat', 'eischat-service.exe'));
});

Deno.test('windows singleton paths accept an explicit sidecar override', () => {
  const paths = resolveWindowsSingletonPaths(
    { APPDATA: 'C:\\Users\\alice\\AppData\\Roaming', EISCHAT_SINGLETON_SIDECAR: 'D:\\eis.exe' },
    'C:\\Program Files\\eis-chat',
  );
  assertEquals(paths.sidecarPath, 'D:\\eis.exe');
});

Deno.test('windows singleton paths require an application data root', () => {
  assertThrows(
    () => resolveWindowsSingletonPaths({}, 'C:\\Program Files\\eis-chat'),
    Error,
    'LOCALAPPDATA or APPDATA',
  );
});

Deno.test('windows singleton service environment covers server and browser discovery', () => {
  const runtime = windowsSingletonServiceEnvironment();
  assertEquals(runtime.services__eischat__http__0, 'http://127.0.0.1:3001');
  assertEquals(runtime.EISCHAT_URL, 'http://127.0.0.1:3001');
  assertEquals(runtime['services__workers-api__http__0'], 'http://127.0.0.1:8091');
  assertEquals(runtime.LEGACY_ARCHEO_MCP_URL, 'http://127.0.0.1:8095');
  assertEquals(runtime.DURABLE_STREAMS_URL, 'http://127.0.0.1:4437');
  assertEquals(runtime.VITE_services__eischat__http__0, undefined);

  const build = windowsSingletonServiceEnvironment({ includeVite: true });
  assertEquals(build.VITE_services__eischat__http__0, 'http://127.0.0.1:3001');
  assertEquals(build.VITE_EISCHAT_URL, 'http://127.0.0.1:3001');
  assertEquals(build['VITE_services__workers-api__http__0'], undefined);
  assertEquals(build.VITE_WORKERS_API_URL, 'http://127.0.0.1:8091');
  assertEquals(build.VITE_DURABLE_STREAMS_URL, 'http://127.0.0.1:4437');
});

Deno.test('windows singleton telemetry environment enables compiled Deno OTLP', () => {
  const env = windowsSingletonTelemetryEnvironment({ serviceName: 'eischat' });
  assertEquals(env.OTEL_DENO, 'true');
  assertEquals(env.OTEL_DENO_TRACING, 'true');
  assertEquals(env.OTEL_DENO_METRICS, 'true');
  assertEquals(env.OTEL_DENO_CONSOLE, 'capture');
  assertEquals(env.OTEL_PROPAGATORS, 'tracecontext,baggage');
  assertEquals(env.OTEL_SERVICE_NAME, 'eischat');
  assertEquals(env.OTEL_EXPORTER_OTLP_ENDPOINT, 'http://127.0.0.1:4318');
  assertEquals(env.OTEL_EXPORTER_OTLP_PROTOCOL, 'http/protobuf');
  assertEquals(env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT, undefined);
});
