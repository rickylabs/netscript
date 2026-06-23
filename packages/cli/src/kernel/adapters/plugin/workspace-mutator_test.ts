/**
 * @module infra/plugin/workspace-mutator_test
 *
 * Focused regression tests for plugin workspace mutations.
 */

import { assertEquals } from 'jsr:@std/assert@^1';
import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import { PluginWorkspaceMutator } from './workspace-mutator.ts';
import type { PluginKindProvider } from '../../domain/plugin-kind.ts';

const backgroundProvider: PluginKindProvider = {
  kind: 'background',
  displayName: 'Background Processor',
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
  concurrencyEnvVar: 'BACKGROUND_CONCURRENCY',
  defaultConcurrency: 2,
  defaultTelemetry: true,
  infrastructureRequires: ['kv'],
  infrastructureOptionalDeps: ['db'],
};

const sagaProvider: PluginKindProvider = {
  ...backgroundProvider,
  kind: 'saga',
  displayName: 'Saga Orchestrator',
  concurrencyEnvVar: 'SAGA_CONCURRENCY',
};

Deno.test('PluginWorkspaceMutator ensures plugins root and plugin packages are workspace members', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/deno.json',
    JSON.stringify(
      {
        workspace: ['./apps/dashboard', './contracts', './plugins'],
        tasks: { dev: 'deno run --allow-all apps/dashboard/main.ts' },
      },
      null,
      2,
    ) + '\n',
  );

  await new PluginWorkspaceMutator(fs).ensureWorkspaceMember('/project');

  const config = JSON.parse(await fs.readFile('/project/deno.json')) as {
    workspace: string[];
  };

  assertEquals(config.workspace, [
    './apps/dashboard',
    './contracts',
    './plugins',
    './plugins/*',
  ]);
});

Deno.test('PluginWorkspaceMutator registers background plugins with companion API service', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/appsettings.json',
    JSON.stringify({ NetScript: {} }, null, 2) + '\n',
  );

  await new PluginWorkspaceMutator(fs).updateAppsettings(
    '/project',
    {
      scaffoldResult: {
        filesCreated: [],
        directoriesCreated: [],
        filesSkipped: [],
        totalOperations: 0,
        durationMs: 0,
      },
      pluginDir: '/project/plugins/billing-worker',
      kind: 'background',
      port: 4400,
      servicePort: 8091,
      configSection: 'BackgroundProcessors',
      configKey: 'billing-worker',
      serviceConfigKey: 'billing-worker-api',
    },
    backgroundProvider,
  );

  const config = JSON.parse(await fs.readFile('/project/appsettings.json')) as {
    NetScript: {
      Plugins: Record<string, unknown>;
      BackgroundProcessors: Record<string, unknown>;
    };
  };

  assertEquals(config.NetScript.Plugins['billing-worker-api'], {
    Enabled: true,
    Runtime: 'deno',
    Port: 8091,
    Entrypoint: 'services/src/main.ts',
    Workdir: 'plugins/billing-worker',
    RequiresKv: true,
    RequiresDb: true,
    Permissions: [
      '--allow-net',
      '--allow-env',
      '--allow-read',
      '--allow-write',
      '--allow-run',
    ],
  });
  assertEquals(config.NetScript.BackgroundProcessors['billing-worker'], {
    Enabled: true,
    Runtime: 'deno',
    Entrypoint: 'bin/combined.ts',
    Workdir: 'plugins/billing-worker',
    Telemetry: true,
    WatchMode: true,
    RequiresDb: true,
    RequiresKv: true,
    Permissions: [
      '--allow-net',
      '--allow-env',
      '--allow-read',
      '--allow-write',
      '--allow-run',
    ],
    Concurrency: 2,
    ConcurrencyEnvVar: 'BACKGROUND_CONCURRENCY',
    PluginReferences: ['billing-worker-api'],
  });
});

Deno.test('PluginWorkspaceMutator writes saga store backend appsettings for saga plugins', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/appsettings.json',
    JSON.stringify({ NetScript: {} }, null, 2) + '\n',
  );

  await new PluginWorkspaceMutator(fs).updateAppsettings(
    '/project',
    {
      scaffoldResult: {
        filesCreated: [],
        directoriesCreated: [],
        filesSkipped: [],
        totalOperations: 0,
        durationMs: 0,
      },
      pluginDir: '/project/plugins/sagas',
      kind: 'saga',
      port: 4400,
      servicePort: 8092,
      configSection: 'BackgroundProcessors',
      configKey: 'sagas',
      serviceConfigKey: 'sagas-api',
    },
    sagaProvider,
    { sagaStoreBackend: 'prisma' },
  );

  const config = JSON.parse(await fs.readFile('/project/appsettings.json')) as {
    NetScript: {
      Plugins: Record<string, { Sagas?: unknown }>;
      BackgroundProcessors: Record<string, { Sagas?: unknown }>;
    };
  };

  assertEquals(config.NetScript.Plugins['sagas-api'].Sagas, {
    Store: { Backend: 'prisma' },
  });
  assertEquals(config.NetScript.BackgroundProcessors.sagas.Sagas, {
    Store: { Backend: 'prisma' },
  });
});

Deno.test('PluginWorkspaceMutator provisions shared Garnet cache when missing', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/appsettings.json',
    JSON.stringify({ NetScript: { Cache: {} } }, null, 2) + '\n',
  );

  const created = await new PluginWorkspaceMutator(fs).ensureSharedCache('/project');

  const config = JSON.parse(await fs.readFile('/project/appsettings.json')) as {
    NetScript: {
      PrimaryCache: string;
      Cache: Record<string, unknown>;
    };
  };

  assertEquals(created, true);
  assertEquals(config.NetScript.PrimaryCache, 'garnet');
  assertEquals(config.NetScript.Cache.garnet, {
    Enabled: true,
    Engine: 'Garnet',
    Mode: 'Container',
  });
});

Deno.test('PluginWorkspaceMutator reuses existing shared cache entry', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/appsettings.json',
    JSON.stringify(
      {
        NetScript: {
          PrimaryCache: 'redis',
          Cache: {
            garnet: { Enabled: false, Engine: 'Garnet', Mode: 'External' },
          },
        },
      },
      null,
      2,
    ) + '\n',
  );

  const created = await new PluginWorkspaceMutator(fs).ensureSharedCache('/project');

  const config = JSON.parse(await fs.readFile('/project/appsettings.json')) as {
    NetScript: {
      PrimaryCache: string;
      Cache: Record<string, unknown>;
    };
  };

  assertEquals(created, false);
  assertEquals(config.NetScript.PrimaryCache, 'redis');
  assertEquals(config.NetScript.Cache.garnet, {
    Enabled: false,
    Engine: 'Garnet',
    Mode: 'External',
  });
});

Deno.test('PluginWorkspaceMutator appends project-local plugin config specs', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/netscript.config.ts',
    [
      "import { defineConfig } from '@netscript/config';",
      '',
      'export default defineConfig({',
      "  name: 'sample-app',",
      '  databases: {',
      '    config: [],',
      '  },',
      '  plugins: [],',
      '});',
      '',
    ].join('\n'),
  );

  const mutator = new PluginWorkspaceMutator(fs);
  assertEquals(await mutator.ensureNetScriptConfigPlugin('/project', 'workers'), true);
  assertEquals(await mutator.ensureNetScriptConfigPlugin('/project', 'workers'), false);
  assertEquals(await mutator.ensureNetScriptConfigPlugin('/project', 'sagas'), true);

  const config = await fs.readFile('/project/netscript.config.ts');
  assertEquals(config.includes("'./plugins/workers/mod.ts',"), true);
  assertEquals(config.includes("'./plugins/sagas/mod.ts',"), true);
});
