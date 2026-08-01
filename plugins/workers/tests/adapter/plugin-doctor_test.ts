import { assertEquals, assertStringIncludes } from '@std/assert';
import { runDoctorCommand } from '@netscript/plugin/adapter';
import { workersAdapterPlugin } from '../../src/adapter/plugin.ts';

Deno.test('workers doctor errors with a remediation when the job registry is absent', async () => {
  const report = await runDoctorCommand({
    plugin: workersAdapterPlugin,
    context: {
      workspaceRoot: '/workspace',
      options: {},
      config: { WORKERS_API_URL: 'http://localhost:8091' },
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
    'netscript plugin workers compile-registry',
  );
});
