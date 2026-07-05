/**
 * @module infra/plugin/workspace-mutator_test
 *
 * Focused regression tests for plugin workspace mutations.
 */

import { assertEquals } from 'jsr:@std/assert@^1';
import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import { PluginWorkspaceMutator } from './workspace-mutator.ts';
import type { PluginKindProvider } from '../../domain/plugin-kind.ts';
import { netscriptJsrSpecifier } from '../../constants/jsr-specifiers.ts';

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

Deno.test('PluginWorkspaceMutator injects first-party plugin core imports into root deno config', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/deno.json',
    JSON.stringify(
      {
        workspace: ['./plugins/*'],
        imports: {
          '@netscript/plugin': netscriptJsrSpecifier('plugin'),
        },
      },
      null,
      2,
    ) + '\n',
  );

  const mutator = new PluginWorkspaceMutator(fs);
  await mutator.ensureRootImportsForPluginKind('/project', 'worker');
  await mutator.ensureRootImportsForPluginKind('/project', 'worker');
  await mutator.ensureRootImportsForPluginKind('/project', 'saga');
  await mutator.ensureRootImportsForPluginKind('/project', 'trigger');
  await mutator.ensureRootImportsForPluginKind('/project', 'auth');

  const config = JSON.parse(await fs.readFile('/project/deno.json'));

  assertEquals(
    config.imports['@netscript/contracts'],
    netscriptJsrSpecifier('contracts'),
  );
  assertEquals(
    config.imports['@netscript/kv'],
    netscriptJsrSpecifier('kv'),
  );
  assertEquals(
    config.imports['@netscript/plugin-workers/runtime'],
    netscriptJsrSpecifier('plugin-workers', '/runtime'),
  );
  assertEquals(
    config.imports['jsr:@netscript/plugin-workers/jobs/health-check.ts'],
    netscriptJsrSpecifier('plugin-workers', '/jobs/health-check.ts'),
  );
  assertEquals(
    config.imports['@netscript/plugin-workers-core/schemas'],
    netscriptJsrSpecifier('plugin-workers-core', '/schemas'),
  );
  assertEquals(
    config.imports['@netscript/plugin-sagas/runtime'],
    netscriptJsrSpecifier('plugin-sagas', '/runtime'),
  );
  assertEquals(
    config.imports['@netscript/plugin-sagas-core/domain'],
    netscriptJsrSpecifier('plugin-sagas-core', '/domain'),
  );
  assertEquals(
    config.imports['@netscript/plugin-triggers/runtime'],
    netscriptJsrSpecifier('plugin-triggers', '/runtime'),
  );
  assertEquals(
    config.imports['@netscript/plugin-triggers-core/builders'],
    netscriptJsrSpecifier('plugin-triggers-core', '/builders'),
  );
  assertEquals(
    config.imports['@netscript/plugin-auth-core/contracts/v1'],
    netscriptJsrSpecifier('plugin-auth-core', '/contracts/v1'),
  );
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
    Entrypoint: netscriptJsrSpecifier('plugin-billing-worker', '/services'),
    Workdir: '.',
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
    Entrypoint: 'billing-worker/runtime.ts',
    Workdir: '.',
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

Deno.test('PluginWorkspaceMutator honors absolute local source service entrypoints', async () => {
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
      pluginDir: '/project/plugins/triggers',
      kind: 'trigger',
      port: 4400,
      servicePort: 8093,
      configSection: 'BackgroundProcessors',
      configKey: 'triggers',
      serviceConfigKey: 'triggers-api',
    },
    {
      ...backgroundProvider,
      kind: 'trigger',
      displayName: 'Triggers',
      defaultServiceEntrypoint:
        '/home/codex/repos/netscript-scaffold-167/plugins/triggers/services/src/main.ts',
    },
  );

  const config = JSON.parse(await fs.readFile('/project/appsettings.json')) as {
    NetScript: {
      Plugins: Record<string, unknown>;
    };
  };

  assertEquals(
    config.NetScript.Plugins['triggers-api'],
    {
      Enabled: true,
      Runtime: 'deno',
      Port: 8093,
      Entrypoint:
        '/home/codex/repos/netscript-scaffold-167/plugins/triggers/services/src/main.ts',
      Workdir: '.',
      RequiresKv: true,
      RequiresDb: true,
      Permissions: [
        '--allow-net',
        '--allow-env',
        '--allow-read',
        '--allow-write',
        '--allow-run',
      ],
    },
  );
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
    Mode: 'Auto',
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

Deno.test('PluginWorkspaceMutator registers generated plugin glue entrypoints', async () => {
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
  assertEquals(
    await mutator.ensureNetScriptConfigPlugin('/project', 'workers', '/project/workers'),
    true,
  );
  assertEquals(
    await mutator.ensureNetScriptConfigPlugin('/project', 'workers', '/project/workers'),
    false,
  );

  const config = await fs.readFile('/project/netscript.config.ts');
  assertEquals(config.includes("'./workers/mod.ts'"), true);
});
