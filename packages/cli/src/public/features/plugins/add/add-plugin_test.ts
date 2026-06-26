import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals, assertFalse, assertStringIncludes } from 'jsr:@std/assert@^1';

import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { Scaffolder } from '../../../../kernel/adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../../../kernel/adapters/scaffold/template-adapter.ts';
import { PluginKindRegistry } from '../../../../kernel/application/registries/plugin-kind-registry.ts';
import { PluginRegistryScaffolder } from '../../../../kernel/adapters/plugin/registry-scaffolder.ts';
import { PluginScaffolder } from '../../../../kernel/adapters/plugin/scaffolder.ts';
import { PluginWorkspaceMutator } from '../../../../kernel/adapters/plugin/workspace-mutator.ts';
import { addPlugin } from './add-plugin.ts';
import { planPluginAdd } from './plan-plugin-add.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../kernel/application/registries/template-registry.ts';

// This flow renders plugin/workspace files via sync template generators, which
// require a previously-awaited registry hydration. The test drives the flow
// directly (outside the CLI dispatch path), so hydrate at module load.
await DEFAULT_TEMPLATE_REGISTRY.hydrate();

describe('public add plugin flow', () => {
  it('plans a starter plugin request from project metadata', async () => {
    const fs = new MemoryFileSystemAdapter();
    await writeProjectFiles(fs);

    const plan = await planPluginAdd({
      kind: 'api',
      pluginName: 'payments',
      serviceReferences: [],
      pluginReferences: [],
      noDb: false,
      includeSamples: true,
      projectRoot: '/workspace/alpha',
      overwrite: false,
    }, {
      fs,
      registry: new PluginKindRegistry(),
    });

    assertEquals(plan.kind, 'api');
    assertEquals(plan.projectName, 'alpha-app');
    assertEquals(plan.dbDetection.requiresDb, false);
  });

  it('writes starter plugin files with JSR imports and updates workspace config', async () => {
    const fs = new MemoryFileSystemAdapter();
    await writeProjectFiles(fs);
    const templateAdapter = new StringTemplateAdapter(fs);
    const scaffolder = new Scaffolder(templateAdapter, fs);
    const registry = new PluginKindRegistry();

    const result = await addPlugin({
      kind: 'api',
      pluginName: 'payments',
      serviceReferences: ['users'],
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
      regenerateHelpers: () => Promise.resolve(['/workspace/alpha/aspire/apphost.mts']),
    });

    const pluginDenoJson = JSON.parse(
      await fs.readFile('/workspace/alpha/plugins/payments/deno.json'),
    );
    const appsettings = JSON.parse(await fs.readFile('/workspace/alpha/appsettings.json'));
    const rootDenoJson = JSON.parse(await fs.readFile('/workspace/alpha/deno.json'));

    assertStringIncludes(pluginDenoJson.imports['@netscript/plugin'], 'jsr:@netscript/plugin');
    assertEquals(appsettings.NetScript.Plugins.payments.ServiceReferences, ['users']);
    assertEquals(rootDenoJson.workspace.includes('./plugins/*'), true);
    assertFalse(await fs.exists('/workspace/alpha/plugins/registry.ts'));
    assertEquals(result.helperFiles.length, 1);
  });

  it('registers copied official background workspaces as Deno workspace members', async () => {
    const fs = new MemoryFileSystemAdapter();
    await writeProjectFiles(fs);
    const templateAdapter = new StringTemplateAdapter(fs);
    const scaffolder = new Scaffolder(templateAdapter, fs);
    const registry = new PluginKindRegistry();
    registry.register('worker', {
      kind: 'worker',
      displayName: 'Background Worker',
      category: 'background-processor',
      portRangeKey: 'INFRA_PLUGIN',
      defaultPermissions: ['--unstable-kv', '--allow-all'],
      watchFlag: '--watch',
      defaultEntrypoint: 'bin/combined.ts',
      defaultServiceEntrypoint: 'services/src/main.ts',
      defaultRequiresDb: false,
      defaultRequiresKv: true,
      pluginType: 'background-processor',
      supportsConcurrency: true,
      concurrencyEnvVar: 'WORKER_CONCURRENCY',
      defaultConcurrency: 2,
      defaultTelemetry: true,
      infrastructureRequires: ['kv'],
      infrastructureOptionalDeps: [],
    });

    await addPlugin({
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
      regenerateHelpers: () => Promise.resolve(['/workspace/alpha/aspire/apphost.mts']),
      findSourceRoot: () => Promise.resolve('/repo'),
      canCopyPlugin: () => Promise.resolve(true),
      copyPlugin: async () => {
        await fs.writeFile('/workspace/alpha/plugins/workers/mod.ts', 'export {};\n');
        await fs.writeFile('/workspace/alpha/workers/mod.ts', 'export {};\n');
        return {
          scaffoldResult: {
            filesCreated: [
              '/workspace/alpha/plugins/workers/mod.ts',
              '/workspace/alpha/workers/mod.ts',
            ],
            directoriesCreated: ['/workspace/alpha/plugins/workers', '/workspace/alpha/workers'],
            filesSkipped: [],
            totalOperations: 4,
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
          dependencies: [],
          pluginReferences: [],
          workspaceMembers: ['workers'],
        };
      },
      getSource: () =>
        Promise.resolve({
          kind: 'worker',
          canonicalName: 'workers',
          pluginDir: 'workers',
          backgroundDir: 'workers',
          serviceEntrypoint: 'services/src/main.ts',
          backgroundEntrypoint: 'bin/combined.ts',
          serviceConfigKey: 'workers-api',
          servicePort: 8091,
          backgroundPort: 8091,
          dependencies: [],
          pluginReferences: [],
        }),
    });

    const rootDenoJson = JSON.parse(await fs.readFile('/workspace/alpha/deno.json'));

    assertEquals(rootDenoJson.workspace.includes('./plugins/*'), true);
    assertEquals(rootDenoJson.workspace.includes('./workers'), true);
  });
});

async function writeProjectFiles(fs: MemoryFileSystemAdapter): Promise<void> {
  await fs.writeFile(
    '/workspace/alpha/appsettings.json',
    JSON.stringify(
      {
        NetScript: {
          Name: 'alpha-app',
          Services: {
            users: {
              Enabled: true,
              Runtime: 'deno',
              Port: 3001,
              Entrypoint: 'src/main.ts',
              Workdir: 'services/users',
            },
          },
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
