import { assertEquals } from 'jsr:@std/assert@^1';
import { join } from '@std/path';

import {
  exists,
  writeOfficialPluginManifests,
  writeOfficialPluginRuntimeManifests,
  writeSourceFile,
} from './copy-official-plugin-test-support.ts';
import { _internal, canCopyOfficialPlugin, copyOfficialPlugin } from './copy-official-plugin.ts';

Deno.test('canCopyOfficialPlugin recognizes canonical first-party plugin names', async () => {
  const sourceRoot = await Deno.makeTempDir();
  await writeSourceFile(sourceRoot, 'packages/cli/bin/netscript.ts', 'export {};\n');
  await writeOfficialPluginManifests(sourceRoot);

  assertEquals(await canCopyOfficialPlugin(sourceRoot, 'worker', 'workers'), true);
  assertEquals(await canCopyOfficialPlugin(sourceRoot, 'worker', 'billing-worker'), false);
  assertEquals(await canCopyOfficialPlugin(sourceRoot, 'stream', 'streams'), true);
});

Deno.test('copyOfficialPlugin copies plugin and background source workspaces', async () => {
  const sourceRoot = await Deno.makeTempDir();
  const targetPath = await Deno.makeTempDir();

  await writeSourceFile(sourceRoot, 'packages/cli/bin/netscript.ts', 'export {};\n');
  await writeSourceFile(
    sourceRoot,
    'plugins/workers/mod.ts',
    "import { definePlugin } from '@netscript/plugin';\nexport const workersPlugin = definePlugin('workers', '1.0.0').build();\n",
  );
  await writeSourceFile(
    sourceRoot,
    'plugins/workers/deno.json',
    JSON.stringify({
      name: '@netscript/plugin-workers',
      imports: {
        '@netscript/plugin': '../../packages/plugin/mod.ts',
        '@netscript/plugin-workers-core/contracts':
          '../../packages/plugin-workers-core/src/contracts/v1/mod.ts',
        '@netscript/contracts': '../../packages/contracts/mod.ts',
      },
    }),
  );
  await writeOfficialPluginRuntimeManifests(sourceRoot);
  await writeOfficialPluginManifests(sourceRoot);
  await writeSourceFile(sourceRoot, 'plugins/sagas/mod.ts', 'export default {};\n');
  await writeSourceFile(
    sourceRoot,
    'plugins/sagas/deno.json',
    JSON.stringify({ name: '@netscript/plugin-sagas', imports: {} }),
  );
  await writeSourceFile(sourceRoot, 'plugins/triggers/mod.ts', 'export default {};\n');
  await writeSourceFile(
    sourceRoot,
    'plugins/triggers/deno.json',
    JSON.stringify({ name: '@netscript/plugin-triggers', imports: {} }),
  );
  await writeSourceFile(
    sourceRoot,
    'plugins/triggers/jobs/job-tools.ts',
    'export function createJobTools() { return {}; }\n',
  );
  await writeSourceFile(
    sourceRoot,
    'plugins/streams/mod.ts',
    "import { definePlugin } from '@netscript/plugin';\nexport const streamsPlugin = definePlugin('streams', '1.0.0').build();\n",
  );
  await writeSourceFile(
    sourceRoot,
    'plugins/streams/deno.json',
    JSON.stringify({
      name: '@netscript/plugin-streams',
      imports: {
        '@netscript/plugin': '../../packages/plugin/mod.ts',
      },
    }),
  );
  await writeSourceFile(
    sourceRoot,
    'workers/deno.json',
    JSON.stringify({
      name: '@test-app/workers',
      imports: {
        '@netscript/plugin-workers-core': '../packages/plugin-workers-core/mod.ts',
        '@netscript/plugin-workers': '../plugins/workers/mod.ts',
      },
    }),
  );
  await writeSourceFile(sourceRoot, 'workers/mod.ts', 'export {};\n');
  await writeSourceFile(
    sourceRoot,
    'workers/jobs/health-check.ts',
    "export default { id: 'health-check' };\n",
  );
  await writeSourceFile(
    sourceRoot,
    'workers/jobs/job-tools.ts',
    'export function createJobTools() { return {}; }\n',
  );
  await writeSourceFile(
    sourceRoot,
    'workers/jobs/fetch-product-catalog.ts',
    "import { productsContract } from '@contracts';\nexport default { id: productsContract.name };\n",
  );
  await writeSourceFile(
    sourceRoot,
    'workers/jobs/send-welcome-email.ts',
    "export default { id: 'send-welcome-email' };\n",
  );
  await writeSourceFile(
    sourceRoot,
    'workers/jobs/process-webhook-payload.ts',
    "export default { id: 'process-webhook-payload' };\n",
  );
  await writeSourceFile(
    sourceRoot,
    '.netscript/generated/plugin-workers/jobs.registry.ts',
    "import stale from '../../../plugins/triggers/jobs/file-import.ts';\nexport const registry = new Map([[stale.id, stale]]);\n",
  );

  const result = await copyOfficialPlugin({
    sourceRoot,
    targetPath,
    projectName: 'sample-app',
    kind: 'worker',
    pluginName: 'workers',
    importMode: 'jsr',
    force: false,
  });

  assertEquals(result.pluginName, 'workers');
  assertEquals(result.serviceEntrypoint, 'services/src/main.ts');
  assertEquals(result.backgroundEntrypoint, 'bin/combined.ts');
  assertEquals(result.workspaceMembers, ['workers']);
  assertEquals(await exists(join(targetPath, 'plugins/workers/mod.ts')), true);
  assertEquals(await exists(join(targetPath, 'plugins/streams/mod.ts')), true);
  assertEquals(await exists(join(targetPath, 'workers/mod.ts')), true);
  assertEquals(await exists(join(targetPath, 'workers/jobs/health-check.ts')), true);
  assertEquals(await exists(join(targetPath, 'workers/jobs/job-tools.ts')), true);
  assertEquals(await exists(join(targetPath, 'workers/jobs/fetch-product-catalog.ts')), false);

  const pluginDenoJson = JSON.parse(
    await Deno.readTextFile(join(targetPath, 'plugins/workers/deno.json')),
  ) as { imports: Record<string, string> };
  assertEquals(pluginDenoJson.imports['@netscript/plugin'], 'jsr:@netscript/plugin@^1.0.0');
  assertEquals(
    pluginDenoJson.imports['@netscript/plugin-workers-core/contracts'],
    'jsr:@netscript/plugin-workers-core@^1.0.0/contracts',
  );
  assertEquals(pluginDenoJson.imports['@netscript/contracts'], 'jsr:@netscript/contracts@^1.0.0');

  const workerDenoJson = JSON.parse(
    await Deno.readTextFile(join(targetPath, 'workers/deno.json')),
  ) as { name: string; imports: Record<string, string> };
  assertEquals(workerDenoJson.name, '@sample-app/workers');
  assertEquals(
    workerDenoJson.imports['@netscript/plugin-workers-core'],
    'jsr:@netscript/plugin-workers-core@^1.0.0',
  );
  assertEquals(workerDenoJson.imports['@netscript/plugin-workers'], '../plugins/workers/mod.ts');

  const registry = await Deno.readTextFile(
    join(targetPath, '.netscript/generated/plugin-workers/jobs.registry.ts'),
  );
  assertEquals(registry.includes('../../../plugins/triggers/jobs/file-import.ts'), false);
  assertEquals(registry.includes('job-tools.ts'), false);
  assertEquals(registry.includes('../../../workers/jobs/fetch-product-catalog.ts'), false);
  assertEquals(registry.includes('../../../workers/jobs/send-welcome-email.ts'), false);
  assertEquals(registry.includes('../../../workers/jobs/process-webhook-payload.ts'), false);
  assertEquals(registry.includes('../../../workers/jobs/health-check.ts'), true);

  const rootConfigAfterWorkers = await Deno.readTextFile(join(targetPath, 'netscript.config.ts'))
    .catch(() => '');
  assertEquals(rootConfigAfterWorkers.includes('./config/official-plugins/mod.ts'), false);

  await writeSourceFile(
    sourceRoot,
    'sagas/deno.json',
    JSON.stringify({
      name: '@test-app/sagas',
      imports: {
        '@netscript/plugin-sagas-core': '../packages/plugin-sagas-core/mod.ts',
      },
    }),
  );
  await writeSourceFile(sourceRoot, 'sagas/user-registration-saga.ts', 'export default {};\n');
  const sagaCopy = await copyOfficialPlugin({
    sourceRoot,
    targetPath,
    projectName: 'sample-app',
    kind: 'saga',
    pluginName: 'sagas',
    importMode: 'jsr',
    force: false,
  });
  assertEquals(sagaCopy.pluginReferences, ['workers-api']);

  await writeSourceFile(
    sourceRoot,
    'triggers/deno.json',
    JSON.stringify({
      name: '@test-app/triggers',
      imports: {
        '@netscript/plugin-triggers-core': '../packages/plugin-triggers-core/mod.ts',
        '@netscript/plugin-triggers-core/builders':
          '../packages/plugin-triggers-core/src/builders/mod.ts',
        '@netscript/plugin-triggers-core/config':
          '../packages/plugin-triggers-core/src/config/mod.ts',
      },
    }),
  );
  await writeSourceFile(sourceRoot, 'triggers/generic-webhook.ts', 'export default {};\n');
  await writeSourceFile(
    sourceRoot,
    'plugins/triggers/src/runtime/trigger-processor.ts',
    'export {};\n',
  );
  const triggerCopy = await copyOfficialPlugin({
    sourceRoot,
    targetPath,
    projectName: 'sample-app',
    kind: 'trigger',
    pluginName: 'triggers',
    importMode: 'jsr',
    force: false,
  });
  assertEquals(triggerCopy.pluginReferences, ['workers-api']);
  assertEquals(triggerCopy.backgroundEntrypoint, 'src/runtime/trigger-processor.ts');
  assertEquals(
    await exists(join(targetPath, 'plugins/triggers/src/runtime/trigger-processor.ts')),
    true,
  );
  assertEquals(await exists(join(targetPath, 'triggers', 'bin', 'combined.ts')), false);

  const integratedRegistry = await Deno.readTextFile(
    join(targetPath, '.netscript/generated/plugin-workers/jobs.registry.ts'),
  );
  assertEquals(integratedRegistry.includes('send-welcome-email.ts'), true);
  assertEquals(integratedRegistry.includes('process-webhook-payload.ts'), true);
  assertEquals(integratedRegistry.includes('export const jobDefinitions'), true);
  assertEquals(integratedRegistry.includes('createLocalJobDefinition'), true);
  assertEquals(await exists(join(targetPath, 'triggers/.data/incoming/diagnostics')), true);
});

Deno.test('copyOfficialPlugin rewrites fallback plugin source imports for top-level background workspaces', async () => {
  const sourceRoot = await Deno.makeTempDir();
  const targetPath = await Deno.makeTempDir();

  await writeSourceFile(sourceRoot, 'packages/cli/bin/netscript.ts', 'export {};\n');
  await writeOfficialPluginRuntimeManifests(sourceRoot);
  await writeOfficialPluginManifests(sourceRoot);
  await writeSourceFile(sourceRoot, 'plugins/streams/mod.ts', 'export default {};\n');
  await writeSourceFile(
    sourceRoot,
    'plugins/streams/deno.json',
    JSON.stringify({
      name: '@netscript/plugin-streams',
      imports: {
        '@netscript/plugin': '../../packages/plugin/mod.ts',
      },
    }),
  );
  await writeSourceFile(sourceRoot, 'plugins/workers/mod.ts', 'export default {};\n');
  await writeSourceFile(
    sourceRoot,
    'plugins/workers/deno.json',
    JSON.stringify({
      name: '@netscript/plugin-workers',
      imports: {
        '@netscript/plugin': '../../packages/plugin/mod.ts',
        '@netscript/plugin-streams': '../streams/mod.ts',
        '@netscript/plugin-workers-core/runtime':
          '../../packages/plugin-workers-core/src/runtime/mod.ts',
      },
    }),
  );
  await writeSourceFile(
    sourceRoot,
    'plugins/workers/jobs/health-check.ts',
    "export default { id: 'health-check' };\n",
  );
  await writeSourceFile(
    sourceRoot,
    'plugins/workers/jobs/job-tools.ts',
    'export function createJobTools() { return {}; }\n',
  );

  await copyOfficialPlugin({
    sourceRoot,
    targetPath,
    projectName: 'sample-app',
    kind: 'worker',
    pluginName: 'workers',
    importMode: 'local',
    force: false,
  });

  const workerDenoJson = JSON.parse(
    await Deno.readTextFile(join(targetPath, 'workers/deno.json')),
  ) as { name: string; imports: Record<string, string> };
  assertEquals(workerDenoJson.name, '@sample-app/workers');
  assertEquals(workerDenoJson.imports['@netscript/plugin'], '../packages/plugin/mod.ts');
  assertEquals(workerDenoJson.imports['@netscript/plugin-streams'], '../plugins/streams/mod.ts');
  assertEquals(
    workerDenoJson.imports['@netscript/plugin-workers-core/runtime'],
    '../packages/plugin-workers-core/src/runtime/mod.ts',
  );
});

Deno.test('official plugin import rewrite converts local package paths to JSR specifiers', () => {
  assertEquals(
    _internal.rewritePackagePathToJsr('../../packages/plugin-workers-core/src/streams/mod.ts'),
    'jsr:@netscript/plugin-workers-core@^1.0.0/streams',
  );
  assertEquals(
    _internal.rewritePackagePathToJsr('../packages/plugin/mod.ts'),
    'jsr:@netscript/plugin@^1.0.0',
  );
});
