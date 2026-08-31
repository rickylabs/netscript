import { assertEquals, assertStringIncludes } from '@std/assert';
import { runDoctorCommand } from '@netscript/plugin/adapter';
import { sagasAdapterPlugin } from '../../src/adapter/plugin.ts';
import { PLUGIN_PACKAGE_VERSION } from '../../src/package-metadata.generated.ts';

Deno.test('sagas doctor errors with a remediation when the saga registry is absent', async () => {
  const report = await runDoctorCommand({
    plugin: sagasAdapterPlugin,
    context: {
      workspaceRoot: '/workspace',
      options: {},
      config: { SAGAS_API_URL: 'http://localhost:9182' },
      dryRun: true,
      fileSystem: {
        exists: () => Promise.resolve(false),
        readText: () => Promise.reject(new Error('unexpected read')),
        writeText: () => Promise.reject(new Error('read only')),
      },
    },
  });
  assertEquals(report.checks.find((check) => check.name.includes('exists'))?.ok, false);
  assertStringIncludes(
    report.checks.find((check) => check.name.includes('exists'))?.message ?? '',
    `deno run -A jsr:@netscript/plugin-sagas@${PLUGIN_PACKAGE_VERSION}/cli generate-registry`,
  );
});

Deno.test('sagas doctor accepts the registry shape shared by both generation paths', async () => {
  const source = `
import * as saga0 from './checkout.saga.ts';
const entries = [
  [resolveSagaDefinition(saga0, './checkout.saga.ts').id, resolveSagaDefinition(saga0, './checkout.saga.ts')],
];
export const sagaRegistry = new Map(entries);
export const registry = sagaRegistry;
`;
  const report = await runDoctorCommand({
    plugin: sagasAdapterPlugin,
    context: {
      workspaceRoot: '/workspace',
      options: {},
      config: { SAGAS_API_URL: 'configured' },
      dryRun: true,
      fileSystem: {
        exists: () => Promise.resolve(true),
        readText: () => Promise.resolve(source),
        writeText: () => Promise.reject(new Error('read only')),
      },
    },
  });
  assertEquals(
    report.checks.filter((check) =>
      check.name.startsWith('generated') || check.name.startsWith('every')
    ).every((check) => check.ok),
    true,
  );
});
