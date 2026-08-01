import { assertEquals, assertStringIncludes } from '@std/assert';
import { runDoctorCommand } from '@netscript/plugin/adapter';
import { sagasAdapterPlugin } from '../../src/adapter/plugin.ts';

Deno.test('sagas doctor errors with a remediation when the saga registry is absent', async () => {
  const report = await runDoctorCommand({
    plugin: sagasAdapterPlugin,
    context: {
      workspaceRoot: '/workspace',
      options: {},
      config: { SAGAS_API_URL: 'http://localhost:8092' },
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
    'netscript plugin sagas generate-registry',
  );
});
