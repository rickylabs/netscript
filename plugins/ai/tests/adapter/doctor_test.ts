import { assertEquals } from '@std/assert';
import { runDoctorCommand } from '@netscript/plugin/adapter';
import { aiAdapterPlugin } from '../../src/adapter/plugin.ts';

const noopFs = {
  readText: () => Promise.resolve(''),
  writeText: () => Promise.resolve(),
  exists: () => Promise.resolve(true),
};

Deno.test('ai plugin doctor reports missing ANTHROPIC_API_KEY', async () => {
  const report = await runDoctorCommand({
    plugin: aiAdapterPlugin,
    context: {
      workspaceRoot: '/workspace',
      options: {},
      config: {},
      dryRun: true,
      fileSystem: noopFs,
    },
  });

  const check = report.checks.find((entry) => entry.name === 'config:ANTHROPIC_API_KEY');
  assertEquals(check?.ok, false);
  assertEquals(check?.message, 'Missing config key ANTHROPIC_API_KEY');
});

Deno.test('ai plugin doctor accepts configured ANTHROPIC_API_KEY', async () => {
  const report = await runDoctorCommand({
    plugin: aiAdapterPlugin,
    context: {
      workspaceRoot: '/workspace',
      options: {},
      config: { ANTHROPIC_API_KEY: 'test-key' },
      dryRun: true,
      fileSystem: noopFs,
    },
  });

  const check = report.checks.find((entry) => entry.name === 'config:ANTHROPIC_API_KEY');
  assertEquals(check?.ok, true);
});
