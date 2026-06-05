import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { dirname, resolve } from '@std/path';

import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { Scaffolder } from '../../../../kernel/adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../../../kernel/adapters/scaffold/template-adapter.ts';
import { PluginKindRegistry } from '../../../../kernel/application/registries/plugin-kind-registry.ts';
import { PluginRegistryScaffolder } from '../../../../kernel/adapters/plugin/registry-scaffolder.ts';
import { PluginScaffolder } from '../../../../kernel/adapters/plugin/scaffolder.ts';
import { PluginWorkspaceMutator } from '../../../../kernel/adapters/plugin/workspace-mutator.ts';
import type { PluginKindProvider } from '../../../../kernel/domain/plugin-kind.ts';
import { addLocalPlugin, resolveOfficialPluginSourceRoot } from './add-local-plugin.ts';

const workerProvider: PluginKindProvider = {
  kind: 'worker',
  displayName: 'Background Worker',
  category: 'background-processor',
  portRangeKey: 'INFRA_PLUGIN',
  defaultPermissions: [
    '--allow-net',
    '--allow-env',
    '--allow-read',
    '--allow-write',
    '--allow-run',
  ],
  watchFlag: '--watch',
  defaultEntrypoint: 'bin/combined.ts',
  defaultServiceEntrypoint: 'services/src/main.ts',
  defaultRequiresDb: true,
  defaultRequiresKv: true,
  pluginType: 'background-processor',
  supportsConcurrency: true,
  concurrencyEnvVar: 'WORKER_CONCURRENCY',
  defaultConcurrency: 2,
  defaultTelemetry: true,
  infrastructureRequires: ['kv'],
  infrastructureOptionalDeps: ['db'],
};

describe('local contributor add plugin flow', () => {
  it('writes starter plugin files with local imports for non-canonical plugin names', async () => {
    const fs = new MemoryFileSystemAdapter();
    await writeProjectFiles(fs);
    const templateAdapter = new StringTemplateAdapter(fs);
    const scaffolder = new Scaffolder(templateAdapter, fs);
    const registry = new PluginKindRegistry();
    registry.register(workerProvider.kind, workerProvider);

    const result = await addLocalPlugin({
      kind: 'worker',
      pluginName: 'worker',
      serviceReferences: [],
      pluginReferences: [],
      noDb: true,
      includeSamples: false,
      projectRoot: '/workspace/alpha',
      overwrite: false,
    }, {
      fs,
      scaffolder,
      templateAdapter,
      registry,
      pluginScaffolder: new PluginScaffolder(scaffolder, fs, registry),
      registryScaffolder: new PluginRegistryScaffolder(scaffolder),
      workspaceMutator: new PluginWorkspaceMutator(fs),
      findSourceRoot: () => Promise.resolve('/repo'),
      regenerateHelpers: () => Promise.resolve(['/workspace/alpha/aspire/apphost.ts']),
    });

    const pluginDenoJson = JSON.parse(
      await fs.readFile('/workspace/alpha/plugins/worker/deno.json'),
    );

    assertStringIncludes(
      pluginDenoJson.imports['@netscript/plugin'],
      '../../packages/plugin/mod.ts',
    );
    assertEquals(result.plugin.configKey, 'worker');
  });

  it('copies official canonical plugins with local workspace members and references', async () => {
    const fs = new MemoryFileSystemAdapter();
    await writeProjectFiles(fs);
    const templateAdapter = new StringTemplateAdapter(fs);
    const scaffolder = new Scaffolder(templateAdapter, fs);
    const registry = new PluginKindRegistry();
    registry.register(workerProvider.kind, workerProvider);

    const result = await addLocalPlugin({
      kind: 'worker',
      pluginName: 'workers',
      serviceReferences: [],
      pluginReferences: [],
      noDb: true,
      includeSamples: false,
      projectRoot: '/workspace/alpha',
      overwrite: false,
    }, {
      fs,
      scaffolder,
      templateAdapter,
      registry,
      pluginScaffolder: new PluginScaffolder(scaffolder, fs, registry),
      registryScaffolder: new PluginRegistryScaffolder(scaffolder),
      workspaceMutator: new PluginWorkspaceMutator(fs),
      findSourceRoot: () => Promise.resolve('/repo'),
      canCopyPlugin: () => Promise.resolve(true),
      getSource: (_sourceRoot, kind) => {
        const source: Record<
          string,
          { canonicalName: string; pluginReferences: readonly string[] }
        > = {
          worker: { canonicalName: 'workers', pluginReferences: [] },
          saga: { canonicalName: 'sagas', pluginReferences: ['workers-api'] },
          trigger: { canonicalName: 'triggers', pluginReferences: ['workers-api'] },
        };
        return Promise.resolve(source[kind] as never);
      },
      copyPlugin: () =>
        Promise.resolve({
          scaffoldResult: {
            filesCreated: ['/workspace/alpha/plugins/workers/mod.ts'],
            directoriesCreated: ['/workspace/alpha/plugins/workers', '/workspace/alpha/workers'],
            filesSkipped: [],
            totalOperations: 3,
            durationMs: 0,
          },
          pluginName: 'workers',
          pluginDir: '/workspace/alpha/plugins/workers',
          backgroundDir: '/workspace/alpha/workers',
          serviceConfigKey: 'workers-api',
          servicePort: 8091,
          serviceEntrypoint: 'services/src/main.ts',
          backgroundPort: 8091,
          backgroundEntrypoint: 'bin/combined.ts',
          dependencies: [{
            pluginDir: 'streams',
            configKey: 'streams',
            servicePort: 4437,
            serviceEntrypoint: 'services/src/main.ts',
            requiresDb: false,
            requiresKv: false,
            permissions: ['--allow-net'],
          }],
          pluginReferences: [],
          workspaceMembers: ['workers'],
        }),
      regenerateHelpers: () => Promise.resolve(['/workspace/alpha/aspire/apphost.ts']),
    });

    const appsettings = JSON.parse(await fs.readFile('/workspace/alpha/appsettings.json'));
    const rootDenoJson = JSON.parse(await fs.readFile('/workspace/alpha/deno.json'));

    assertEquals(result.plugin.backgroundWorkdir, 'workers');
    assertEquals(appsettings.NetScript.BackgroundProcessors.workers.Workdir, 'workers');
    assertEquals(appsettings.NetScript.BackgroundProcessors.workers.PluginReferences, [
      'streams',
      'workers-api',
    ]);
    assertEquals(appsettings.NetScript.Plugins.streams.Port, 4437);
    assertEquals(appsettings.NetScript.Plugins['workers-api'].PluginReferences, ['streams']);
    assertEquals(rootDenoJson.workspace.includes('./workers'), true);
  });

  it('skips the target generated project when discovering the official plugin source root', async () => {
    const generatedProjectRoot = resolve('/workspace/alpha');
    const generatedProjectParent = dirname(generatedProjectRoot);
    const repoRoot = Deno.cwd();
    const normalizeForAssert = (value: string) =>
      Deno.build.os === 'windows' ? value.toLowerCase() : value;
    const sourceRootCalls: string[] = [];
    const sourceRoot = await resolveOfficialPluginSourceRoot('/workspace/alpha', {
      fs: new MemoryFileSystemAdapter(),
      scaffolder: new Scaffolder(
        new StringTemplateAdapter(new MemoryFileSystemAdapter()),
        new MemoryFileSystemAdapter(),
      ),
      templateAdapter: new StringTemplateAdapter(new MemoryFileSystemAdapter()),
      pluginScaffolder: {} as PluginScaffolder,
      registryScaffolder: {} as PluginRegistryScaffolder,
      workspaceMutator: {} as PluginWorkspaceMutator,
      sourceRootStartDir: '/workspace/alpha',
      findSourceRoot: (startDir?: string) => {
        sourceRootCalls.push(startDir ?? '');
        const normalizedStartDir = normalizeForAssert(startDir ?? '');
        if (normalizedStartDir === normalizeForAssert(generatedProjectRoot)) {
          return Promise.resolve(generatedProjectRoot);
        }
        if (normalizedStartDir === normalizeForAssert(generatedProjectParent)) {
          return Promise.resolve(repoRoot);
        }
        return Promise.resolve(null);
      },
    });

    assertEquals(
      sourceRootCalls.map(normalizeForAssert),
      [generatedProjectRoot, generatedProjectParent].map(normalizeForAssert),
    );
    assertEquals(
      normalizeForAssert(sourceRoot ?? ''),
      normalizeForAssert(repoRoot),
    );
  });
});

async function writeProjectFiles(fs: MemoryFileSystemAdapter): Promise<void> {
  await fs.writeFile(
    '/workspace/alpha/appsettings.json',
    JSON.stringify(
      {
        NetScript: {
          Name: 'alpha-app',
          Services: {},
          Plugins: {},
          BackgroundProcessors: {},
        },
      },
      null,
      2,
    ) + '\n',
  );
  await fs.writeFile(
    '/workspace/alpha/deno.json',
    JSON.stringify({ workspace: ['apps/web'] }, null, 2) + '\n',
  );
}
