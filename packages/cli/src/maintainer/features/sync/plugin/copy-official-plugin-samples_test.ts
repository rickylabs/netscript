import { assertEquals } from 'jsr:@std/assert@^1';
import { join } from '@std/path';

import {
  exists,
  writeMinimalOfficialSource,
  writeSourceFile,
} from './copy-official-plugin-test-support.ts';
import { copyOfficialPlugin } from './copy-official-plugin.ts';

Deno.test('copyOfficialPlugin wires sample config and runtime files for scaffold projects', async () => {
  const sourceRoot = await Deno.makeTempDir();
  const targetPath = await Deno.makeTempDir();

  await writeMinimalOfficialSource(sourceRoot);
  await writeSourceFile(targetPath, 'netscript.config.ts', scaffoldConfig());

  await copyOfficialPlugin({
    sourceRoot,
    targetPath,
    projectName: 'sample-app',
    kind: 'worker',
    pluginName: 'workers',
    importMode: 'local',
    force: false,
  });
  await copyOfficialPlugin({
    sourceRoot,
    targetPath,
    projectName: 'sample-app',
    kind: 'saga',
    pluginName: 'sagas',
    importMode: 'local',
    force: false,
  });
  await copyOfficialPlugin({
    sourceRoot,
    targetPath,
    projectName: 'sample-app',
    kind: 'trigger',
    pluginName: 'triggers',
    importMode: 'local',
    force: false,
  });

  const rootConfig = await Deno.readTextFile(join(targetPath, 'netscript.config.ts'));
  assertEquals(rootConfig.includes('./config/official-plugins/mod.ts'), false);
  assertEquals(rootConfig.includes('workers,'), false);
  assertEquals(rootConfig.includes('sagas,'), false);
  assertEquals(rootConfig.includes('triggers,'), false);
  assertEquals(rootConfig.includes('runtimeConfig,'), false);

  const officialConfig = await Deno.readTextFile(
    join(targetPath, 'config/official-plugins/mod.ts'),
  );
  assertEquals(officialConfig.includes("defineJob('process-webhook-payload'"), true);
  assertEquals(officialConfig.includes("defineJob('send-welcome-email'"), true);
  assertEquals(officialConfig.includes('UserRegistrationSaga'), true);
  assertEquals(officialConfig.includes('webhook-validate-data'), true);

  const workerTasks = JSON.parse(
    await Deno.readTextFile(join(targetPath, 'workers/runtime/tasks/v1.0.0.json')),
  ) as { tasks: Array<{ id: string }> };
  assertEquals(workerTasks.tasks.some((task) => task.id === 'validate-data'), true);
  assertEquals(workerTasks.tasks.some((task) => task.id === 'system-diagnostics'), true);

  const triggerOverrides = JSON.parse(
    await Deno.readTextFile(join(targetPath, 'triggers/runtime/triggers/v1.0.0.json')),
  ) as { overrides: Array<{ id: string; paths?: string[] }> };
  assertEquals(
    triggerOverrides.overrides.some((entry) =>
      entry.id === 'file-watcher-diagnostics' &&
      entry.paths?.includes('.data/incoming/diagnostics')
    ),
    true,
  );
});

Deno.test('copyOfficialPlugin honors includeSamples false', async () => {
  const sourceRoot = await Deno.makeTempDir();
  const targetPath = await Deno.makeTempDir();

  await writeMinimalOfficialSource(sourceRoot);
  await writeSourceFile(targetPath, 'netscript.config.ts', scaffoldConfig());

  await copyOfficialPlugin({
    sourceRoot,
    targetPath,
    projectName: 'sample-app',
    kind: 'worker',
    pluginName: 'workers',
    importMode: 'local',
    force: false,
    includeSamples: false,
  });

  assertEquals(await exists(join(targetPath, 'config/official-plugins/mod.ts')), false);
  assertEquals(await exists(join(targetPath, 'workers/runtime/tasks/v1.0.0.json')), false);
  assertEquals(await exists(join(targetPath, 'workers/jobs/health-check.ts')), false);
  assertEquals(await exists(join(targetPath, 'sagas/user-registration-saga.ts')), false);
  assertEquals(await exists(join(targetPath, 'triggers/generic-webhook.ts')), false);
});

function scaffoldConfig(): string {
  return `import { defineConfig } from '@netscript/config';

export default defineConfig({
  name: 'sample-app',
  version: '1.0.0',
  databases: { config: [] },
  plugins: [],
});
`;
}
