import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';

import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import { Scaffolder } from '../scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../scaffold/template-adapter.ts';
import { PluginKindRegistry } from '../../application/registries/plugin-kind-registry.ts';
import type { PluginKindProvider } from '../../domain/plugin-kind.ts';
import { PluginScaffolder } from './scaffolder.ts';

const backgroundProvider: PluginKindProvider = {
  kind: 'background',
  displayName: 'Background Processor',
  category: 'background-processor',
  portRangeKey: 'INFRA_PLUGIN',
  defaultPermissions: ['--allow-all'],
  watchFlag: '--watch',
  defaultEntrypoint: 'bin/combined.ts',
  defaultServiceEntrypoint: 'services/src/main.ts',
  defaultRequiresDb: true,
  defaultRequiresKv: true,
  pluginType: 'background-processor',
  supportsConcurrency: true,
  concurrencyEnvVar: 'BACKGROUND_CONCURRENCY',
  defaultConcurrency: 2,
  defaultTelemetry: true,
  infrastructureRequires: ['kv'],
  infrastructureOptionalDeps: ['db'],
};

async function createPluginScaffolder(): Promise<{
  readonly fs: MemoryFileSystemAdapter;
  readonly scaffolder: PluginScaffolder;
}> {
  const fs = new MemoryFileSystemAdapter();
  const template = new StringTemplateAdapter(fs);
  const core = new Scaffolder(template, fs);
  await fs.writeFile('/project/appsettings.json', JSON.stringify({ NetScript: {} }));

  const registry = new PluginKindRegistry();
  registry.register(backgroundProvider.kind, backgroundProvider);

  return {
    fs,
    scaffolder: new PluginScaffolder(core, fs, registry),
  };
}

function createdFiles(
  result: Awaited<ReturnType<PluginScaffolder['scaffold']>>,
): readonly string[] {
  return result.scaffoldResult.filesCreated.map((path) => path.replaceAll('\\', '/'));
}

Deno.test('PluginScaffolder includes sample jobs and tasks by default', async () => {
  const { fs, scaffolder } = await createPluginScaffolder();

  const result = await scaffolder.scaffold({
    projectName: 'sample-app',
    targetPath: '/project',
    kind: 'background',
    pluginName: 'billing-worker',
    importMode: 'jsr',
    requiresDb: true,
    force: false,
  });

  const files = createdFiles(result);

  assert(files.includes('/project/plugins/billing-worker/jobs/health-check.ts'));
  assert(files.includes('/project/plugins/billing-worker/tasks/validate-payload.ts'));

  const manifest = await fs.readFile('/project/plugins/billing-worker/mod.ts');
  assertStringIncludes(manifest, "definePlugin('billing-worker', '0.1.0')");
  assertStringIncludes(manifest, "entrypoint: './bin/combined.ts'");

  const denoJson = JSON.parse(await fs.readFile('/project/plugins/billing-worker/deno.json')) as {
    imports: Record<string, string>;
    tasks: Record<string, string>;
  };
  assertEquals(
    denoJson.imports['@netscript/plugin-workers-core'],
    'jsr:@netscript/plugin-workers-core@0.0.1-alpha.1',
  );
  assertEquals(denoJson.imports['@netscript/plugin-sagas-core'], undefined);
  assertStringIncludes(denoJson.tasks.check, 'jobs/**/*.ts');
  assertStringIncludes(denoJson.tasks.check, 'tasks/**/*.ts');
});

Deno.test('PluginScaffolder skips sample files and manifest contributions when disabled', async () => {
  const { fs, scaffolder } = await createPluginScaffolder();

  const result = await scaffolder.scaffold({
    projectName: 'sample-app',
    targetPath: '/project',
    kind: 'background',
    pluginName: 'quiet-worker',
    importMode: 'jsr',
    requiresDb: true,
    includeSamples: false,
    force: false,
  });

  const files = createdFiles(result);

  assert(!files.includes('/project/plugins/quiet-worker/jobs/health-check.ts'));
  assert(!files.includes('/project/plugins/quiet-worker/tasks/validate-payload.ts'));

  const manifest = await fs.readFile('/project/plugins/quiet-worker/mod.ts');
  assert(!manifest.includes('jobs: {'));
  assert(!manifest.includes('tasks: {'));

  const denoJson = JSON.parse(await fs.readFile('/project/plugins/quiet-worker/deno.json')) as {
    imports: Record<string, string>;
    tasks: Record<string, string>;
  };
  assertEquals(denoJson.imports['@netscript/plugin-workers-core'], undefined);
  assertEquals(denoJson.imports['@netscript/plugin-sagas-core'], undefined);
  assert(!denoJson.tasks.check.includes('jobs/**/*.ts'));
});
