import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import type { InfrastructureConfig } from '../../../domain/infrastructure-config.ts';
import { generateEnvFileContent } from './env-file-content.ts';
import { collectAllEnvVars } from './env-file-values.ts';

const INFRASTRUCTURE: InfrastructureConfig = {
  database: {
    name: 'postgres',
    provider: 'postgres',
    mode: 'external',
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres',
  },
  cache: {
    name: 'redis',
    provider: 'redis',
    mode: 'external',
    host: 'localhost',
    port: 6379,
    connectionString: 'redis://localhost:6379',
  },
  additionalDatabases: {},
  otlpEndpoint: 'http://localhost:4318',
};

Deno.test('Windows env values emit ASPIRE_DASHBOARD_PORT only when configured', () => {
  const absent = collectAllEnvVars([], INFRASTRUCTURE, {}, {});
  assertEquals(absent.ASPIRE_DASHBOARD_PORT, undefined);
  const configured = collectAllEnvVars([], INFRASTRUCTURE, {}, { dashboardPort: 42501 });
  assertEquals(configured.ASPIRE_DASHBOARD_PORT, '42501');
});

Deno.test('Windows env content emits ASPIRE_DASHBOARD_PORT only when configured', () => {
  const absent = generateEnvFileContent([], INFRASTRUCTURE, {}, {});
  assert(!absent.includes('ASPIRE_DASHBOARD_PORT='));
  const configured = generateEnvFileContent([], INFRASTRUCTURE, {}, { dashboardPort: 42501 });
  assertStringIncludes(configured, 'ASPIRE_DASHBOARD_PORT=42501');
});
