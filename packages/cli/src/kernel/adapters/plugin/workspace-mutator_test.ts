/**
 * @module infra/plugin/workspace-mutator_test
 *
 * Focused regression tests for plugin workspace mutations.
 */

import { assert, assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { dirname, fromFileUrl, join, relative, resolve, toFileUrl } from '@std/path';
import { artifactText, collectInstallArtifacts } from '@netscript/plugin/adapter';
import type { NetScriptPlugin } from '@netscript/plugin/adapter';
import { aiAdapterPlugin } from '@netscript/plugin-ai/adapter';
import { authAdapterPlugin } from '../../../../../../plugins/auth/src/adapter/plugin.ts';
import { sagasAdapterPlugin } from '../../../../../../plugins/sagas/src/adapter/plugin.ts';
import { streamsAdapterPlugin } from '../../../../../../plugins/streams/src/adapter/plugin.ts';
import { triggersAdapterPlugin } from '../../../../../../plugins/triggers/src/adapter/plugin.ts';
import { workersAdapterPlugin } from '../../../../../../plugins/workers/src/adapter/plugin.ts';
import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import { PluginWorkspaceMutator } from './workspace-mutator.ts';
import type { PluginKindProvider } from '../../domain/plugin-kind.ts';
import {
  netscriptJsrSpecifier,
  NETSCRIPT_RELEASE_VERSION,
} from '../../constants/jsr-specifiers.ts';
import { useLocalWorkspaceImports } from '../../../../tests/support/local-workspace-imports.ts';
import {
  SCAFFOLD_CONNECTOR_PACKAGES,
  SCAFFOLD_WORKSPACE_PACKAGES,
} from '../../constants/scaffold/scaffold-workspace-packages.ts';
import { SCAFFOLD_PACKAGES } from '../../constants/scaffold/scaffold-packages.ts';
import { resolveNetScriptImports } from '../scaffold/import-resolver.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';
import { loadRegisteredPlugins } from '../config/plugin-registry.ts';
import { DenoFileSystem } from '../runtime/file-system/deno-file-system.ts';
import { installUiRegistryItems } from '../../application/ui/registry.ts';

const REPO_ROOT = resolve(dirname(fromFileUrl(import.meta.url)), '../../../../../../');

interface FirstPartyPluginCase {
  readonly adapter: NetScriptPlugin;
  readonly kind: string;
  readonly namespace: string;
  readonly packageName: string;
  readonly manifestExport: string;
  readonly packageDir: string;
  readonly applicationExports: readonly string[];
}

const FIRST_PARTY_PLUGIN_CASES: readonly FirstPartyPluginCase[] = [
  {
    adapter: aiAdapterPlugin,
    kind: 'ai',
    namespace: 'ai',
    packageName: '@netscript/plugin-ai',
    manifestExport: 'aiPlugin',
    packageDir: 'ai',
    applicationExports: ['DEFAULT_CHAT_MODEL'],
  },
  {
    adapter: authAdapterPlugin,
    kind: 'auth',
    namespace: 'auth',
    packageName: '@netscript/plugin-auth',
    manifestExport: 'authPlugin',
    packageDir: 'auth',
    applicationExports: ['AUTH_SESSION_STATES'],
  },
  {
    adapter: sagasAdapterPlugin,
    kind: 'saga',
    namespace: 'sagas',
    packageName: '@netscript/plugin-sagas',
    manifestExport: 'sagasPlugin',
    packageDir: 'sagas',
    applicationExports: ['UserRegistrationSaga'],
  },
  {
    adapter: streamsAdapterPlugin,
    kind: 'stream',
    namespace: 'streams',
    packageName: '@netscript/plugin-streams',
    manifestExport: 'streamsPlugin',
    packageDir: 'streams',
    applicationExports: ['notificationsStream'],
  },
  {
    adapter: triggersAdapterPlugin,
    kind: 'trigger',
    namespace: 'triggers',
    packageName: '@netscript/plugin-triggers',
    manifestExport: 'triggersPlugin',
    packageDir: 'triggers',
    applicationExports: ['inboundGenericTrigger'],
  },
  {
    adapter: workersAdapterPlugin,
    kind: 'worker',
    namespace: 'workers',
    packageName: '@netscript/plugin-workers',
    manifestExport: 'workersPlugin',
    packageDir: 'workers',
    applicationExports: ['healthCheckJob'],
  },
];

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

const serviceLessProvider: PluginKindProvider = {
  kind: 'service-less',
  displayName: 'Service-less plugin',
  category: 'plugin',
  portRangeKey: 'PLUGIN_API',
  defaultPermissions: [],
  watchFlag: '--watch',
  defaultEntrypoint: 'mod.ts',
  defaultServiceEntrypoint: null,
  defaultRequiresDb: false,
  defaultRequiresKv: false,
  pluginType: 'utility',
  supportsConcurrency: false,
  concurrencyEnvVar: null,
  defaultConcurrency: null,
  defaultTelemetry: true,
  infrastructureRequires: [],
  infrastructureOptionalDeps: [],
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
  assertEquals(
    config.imports[SCAFFOLD_PACKAGES.NETSCRIPT_SDK],
    netscriptJsrSpecifier('sdk'),
  );
  assertEquals(
    config.imports[SCAFFOLD_PACKAGES.NETSCRIPT_SDK_CLIENT],
    netscriptJsrSpecifier('sdk', '/client'),
  );
});

Deno.test('root-level scaffold runtime imports resolve in both package-source modes', async () => {
  // Scan the real root-owned worker sources plus the runtime E2E fixture that
  // injects the generated service-client import into workers/jobs/health-check.ts.
  const sourceUrls = [
    ...await collectTypeScriptFiles(
      new URL('../../../../../../plugins/workers/jobs', import.meta.url),
    ),
    ...await collectTypeScriptFiles(
      new URL('../../../../../../plugins/workers/contracts', import.meta.url),
    ),
    new URL('../../../../../../packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts', import.meta.url),
  ];
  const specifierPattern = /(?:from|import)\s+['"](@netscript\/[^'"]+)['"]/g;
  const rootLevelSpecifiers = new Set<string>();
  for (const sourceUrl of sourceUrls) {
    const source = await Deno.readTextFile(sourceUrl);
    for (const match of source.matchAll(specifierPattern)) {
      rootLevelSpecifiers.add(match[1]);
    }
  }
  assert(
    rootLevelSpecifiers.has(SCAFFOLD_PACKAGES.NETSCRIPT_SDK_CLIENT),
    'expected the workers runtime fixture to emit @netscript/sdk/client',
  );

  for (const mode of ['jsr', 'local'] as const) {
    const imports = resolveNetScriptImports(mode);
    for (const specifier of [...rootLevelSpecifiers].sort()) {
      const { pkg } = splitNetscriptSpecifier(specifier);
      const rootAlias = `@netscript/${pkg}`;
      assert(
        imports[specifier] !== undefined || imports[rootAlias] !== undefined,
        `Root-level scaffold import "${specifier}" is unresolved in ${mode} mode.`,
      );
    }
  }

  // @netscript/ai deliberately computes its optional MCP adapter imports so
  // they stay out of the static JSR graph. Reconstruct those real specifiers
  // and prove that the generated project owns their runtime resolution.
  const tanstackConnectorUrl = new URL(
    '../../../../../../packages/ai/src/mcp/adapters/tanstack-connector.ts',
    import.meta.url,
  );
  const tanstackConnectorSource = await Deno.readTextFile(tanstackConnectorUrl);
  const computedSpecifierPattern =
    /\[\s*['"](@[^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\]\.join\(\s*['"]{2}\s*\)/g;
  const computedRuntimeSpecifiers = new Set<string>();
  for (const match of tanstackConnectorSource.matchAll(computedSpecifierPattern)) {
    computedRuntimeSpecifiers.add(`${match[1]}${match[2]}`);
  }
  assert(
    computedRuntimeSpecifiers.has('@tanstack/ai-mcp'),
    'expected @netscript/ai to compute the @tanstack/ai-mcp runtime specifier',
  );
  assert(
    computedRuntimeSpecifiers.has('@tanstack/ai-mcp/stdio'),
    'expected @netscript/ai to compute the @tanstack/ai-mcp/stdio runtime specifier',
  );

  const aiDenoJson = JSON.parse(
    await Deno.readTextFile(
      new URL('../../../../../../packages/ai/deno.json', import.meta.url),
    ),
  ) as { imports: Record<string, string> };
  const mcpRootAlias = rootPackageAlias('@tanstack/ai-mcp');
  const expectedMcpTarget = aiDenoJson.imports[mcpRootAlias];
  assert(expectedMcpTarget !== undefined, `${mcpRootAlias} must be pinned by packages/ai/deno.json`);

  for (const mode of ['jsr', 'local'] as const) {
    const resolverImports = resolveNetScriptImports(mode);
    const fs = new MemoryFileSystemAdapter();
    await fs.writeFile(
      '/project/deno.json',
      JSON.stringify({ workspace: ['./plugins/*'], imports: {} }, null, 2) + '\n',
    );
    if (mode === 'local') {
      await fs.writeFile(
        join('/project', 'packages', 'cli', 'deno.json'),
        JSON.stringify({ name: '@netscript/cli' }, null, 2) + '\n',
      );
    }
    await new PluginWorkspaceMutator(fs).ensureRootImportsForPluginKind('/project', 'ai');
    const generatedConfig = JSON.parse(await fs.readFile('/project/deno.json')) as {
      imports: Record<string, string>;
    };

    for (const specifier of [...computedRuntimeSpecifiers].sort()) {
      const rootAlias = rootPackageAlias(specifier);
      assertEquals(
        resolverImports[specifier] ?? resolverImports[rootAlias],
        expectedMcpTarget,
        `Computed @netscript/ai runtime import "${specifier}" is unresolved or mis-pinned by the ${mode} resolver.`,
      );
      assertEquals(
        generatedConfig.imports[specifier] ?? generatedConfig.imports[rootAlias],
        expectedMcpTarget,
        `Computed @netscript/ai runtime import "${specifier}" is unresolved in the ${mode} generated root map.`,
      );
    }
  }
});

function rootPackageAlias(specifier: string): string {
  const match = /^(@[^/]+\/[^/]+|[^/]+)/.exec(specifier);
  if (match?.[1] === undefined) {
    throw new Error(`Cannot derive a root package alias from "${specifier}".`);
  }
  return match[1];
}

async function collectTypeScriptFiles(root: URL): Promise<URL[]> {
  const files: URL[] = [];
  for await (const entry of Deno.readDir(root)) {
    const child = new URL(`${root.href}/${entry.name}`);
    if (entry.isDirectory) {
      files.push(...await collectTypeScriptFiles(child));
    } else if (entry.isFile && entry.name.endsWith('.ts')) {
      files.push(child);
    }
  }
  return files;
}

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

Deno.test('PluginWorkspaceMutator omits appsettings entries for service-less plugins', async () => {
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
      pluginDir: '/project/plugins/service-less',
      kind: 'service-less',
      port: 4400,
      servicePort: 8091,
      configSection: 'Plugins',
      configKey: 'service-less',
      serviceConfigKey: 'service-less-api',
    },
    serviceLessProvider,
  );

  assertEquals(JSON.parse(await fs.readFile('/project/appsettings.json')), {
    NetScript: {},
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

Deno.test('PluginWorkspaceMutator keeps package id separate from the instance name', async () => {
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
      pluginDir: '/project/plugins/rehearsal-worker',
      kind: 'background',
      port: 4400,
      servicePort: 8091,
      configSection: 'BackgroundProcessors',
      configKey: 'rehearsal-worker',
      serviceConfigKey: 'rehearsal-worker-api',
    },
    backgroundProvider,
    {
      packageSpecifier: '@netscript/plugin-workers',
      packageVersion: NETSCRIPT_RELEASE_VERSION,
    },
  );

  const config = JSON.parse(await fs.readFile('/project/appsettings.json'));
  assertEquals(
    config.NetScript.Plugins['rehearsal-worker-api'].Entrypoint,
    `jsr:@netscript/plugin-workers@${NETSCRIPT_RELEASE_VERSION}/services`,
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
  await fs.writeFile('/project/plugins/workers/plugin.ts', 'export {};\n');
  await fs.writeFile('/project/plugins/sagas/plugin.ts', 'export {};\n');

  const mutator = new PluginWorkspaceMutator(fs);
  assertEquals(
    await mutator.ensureNetScriptConfigPlugin('/project', 'workers', undefined, 'plugin.ts'),
    true,
  );
  assertEquals(
    await mutator.ensureNetScriptConfigPlugin('/project', 'workers', undefined, 'plugin.ts'),
    false,
  );
  assertEquals(
    await mutator.ensureNetScriptConfigPlugin('/project', 'sagas', undefined, 'plugin.ts'),
    true,
  );

  const config = await fs.readFile('/project/netscript.config.ts');
  assertEquals(config.includes("'./plugins/workers/plugin.ts',"), true);
  assertEquals(config.includes("'./plugins/sagas/plugin.ts',"), true);
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
  await fs.writeFile('/project/workers/plugin.ts', 'export {};\n');

  const mutator = new PluginWorkspaceMutator(fs);
  assertEquals(
    await mutator.ensureNetScriptConfigPlugin(
      '/project',
      'workers',
      '/project/workers',
      'plugin.ts',
    ),
    true,
  );
  assertEquals(
    await mutator.ensureNetScriptConfigPlugin(
      '/project',
      'workers',
      '/project/workers',
      'plugin.ts',
    ),
    false,
  );

  const config = await fs.readFile('/project/netscript.config.ts');
  assertEquals(config.includes("'./workers/plugin.ts'"), true);
});

Deno.test('PluginWorkspaceMutator rejects a missing configured plugin module', async () => {
  const fs = new MemoryFileSystemAdapter();
  const configPath = '/project/netscript.config.ts';
  const original = [
    "import { defineConfig } from '@netscript/config';",
    '',
    'export default defineConfig({',
    "  name: 'sample-app',",
    '  plugins: [],',
    '});',
    '',
  ].join('\n');
  await fs.writeFile(configPath, original);

  await assertRejects(
    () =>
      new PluginWorkspaceMutator(fs).ensureNetScriptConfigPlugin(
        '/project',
        'missing',
        undefined,
        'plugin.ts',
      ),
    ScaffoldValidationError,
    'configured module was not found at plugins/missing/plugin.ts',
  );
  assertEquals(await fs.readFile(configPath), original);
});

Deno.test('PluginWorkspaceMutator removes exactly one plugin instance from netscript config', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/netscript.config.ts',
    [
      "import { defineConfig } from '@netscript/config';",
      '',
      'export default defineConfig({',
      "  plugins: ['./plugins/rehearsal-worker/mod.ts', './plugins/workers/mod.ts'],",
      '});',
      '',
    ].join('\n'),
  );

  const mutator = new PluginWorkspaceMutator(fs);
  assertEquals(
    await mutator.removeNetScriptConfigPlugin('/project', 'rehearsal-worker'),
    true,
  );
  assertEquals(
    await mutator.removeNetScriptConfigPlugin('/project', 'rehearsal-worker'),
    false,
  );

  const config = await fs.readFile('/project/netscript.config.ts');
  assertEquals(config.includes('rehearsal-worker'), false);
  assertEquals(config.includes("'./plugins/workers/mod.ts'"), true);
});

Deno.test('PluginWorkspaceMutator removes generated root-level plugin glue declarations', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/netscript.config.ts',
    "export default defineConfig({ plugins: ['./rehearsal-worker/mod.ts'] });\n",
  );

  const mutator = new PluginWorkspaceMutator(fs);
  assertEquals(
    await mutator.removeNetScriptConfigPlugin('/project', 'rehearsal-worker'),
    true,
  );
  assertEquals(
    (await fs.readFile('/project/netscript.config.ts')).includes('rehearsal-worker'),
    false,
  );
});

Deno.test('first-party control-plane modules are import-safe and preserve application barrels', async () => {
  const projectRoot = await Deno.makeTempDir({ prefix: 'first-party-contract-' });
  const configuredModules: string[] = [];
  await Deno.writeTextFile(
    resolve(projectRoot, 'deno.json'),
    JSON.stringify({
      workspace: [],
      imports: { '@netscript/config': netscriptJsrSpecifier('config') },
    }, null, 2) + '\n',
  );
  await useLocalWorkspaceImports(projectRoot, REPO_ROOT);
  const workspaceMutator = new PluginWorkspaceMutator(new DenoFileSystem());
  for (const plugin of FIRST_PARTY_PLUGIN_CASES) {
    await workspaceMutator.ensureRootImportsForPluginKind(projectRoot, plugin.kind);
  }
  await useLocalWorkspaceImports(projectRoot, REPO_ROOT);

  for (const plugin of FIRST_PARTY_PLUGIN_CASES) {
    const artifacts = collectInstallArtifacts(plugin.adapter);
    const modulePath = `${plugin.namespace}/plugin.ts`;
    configuredModules.push(`./${modulePath}`);

    for (const artifact of artifacts) {
      const outputPath = resolve(projectRoot, artifact.path);
      await Deno.mkdir(dirname(outputPath), { recursive: true });
      await Deno.writeTextFile(outputPath, artifactText(artifact));
    }

    const generatedModule = artifacts.find((artifact) => artifact.path === modulePath);
    assert(generatedModule, `${plugin.namespace} must emit ${modulePath}`);
    const moduleSource = artifactText(generatedModule);
    assert(
      moduleSource.includes(
        `export { ${plugin.manifestExport} } from '${plugin.packageName}';`,
      ),
      `${modulePath} must re-export ${plugin.manifestExport} from ${plugin.packageName}`,
    );
    assertEquals(
      emittedModuleSpecifiers(moduleSource),
      [plugin.packageName],
      `${modulePath} must import only its package-owned manifest`,
    );
    assertEquals(
      moduleSource.includes('./mod.ts') || moduleSource.includes('./runtime.ts'),
      false,
      `${modulePath} must not load application or runtime modules`,
    );

    const moduleUrl = toFileUrl(resolve(projectRoot, modulePath)).href;
    const controlPlaneProbeSource = `const permission = await Deno.permissions.query({ name: 'env' });
if (permission.state !== 'denied') throw new Error('control-plane env access is not denied');
const imported = await import(${JSON.stringify(moduleUrl)});
const manifests = Object.values(imported).filter((value) =>
  value !== null && typeof value === 'object' &&
  typeof Reflect.get(value, 'name') === 'string' &&
  typeof Reflect.get(value, 'version') === 'string' &&
  typeof Reflect.get(value, 'contributions') === 'object'
);
if (!Reflect.has(imported, ${JSON.stringify(plugin.manifestExport)})) {
  throw new Error('missing package manifest re-export');
}
if (manifests.length !== 1) {
  throw new Error(\`expected one manifest-shaped export, got \${manifests.length}\`);
}`;
    const inspection = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--no-check',
        '--allow-read',
        '--allow-net',
        '--deny-env',
        '--minimum-dependency-age=0',
        '--config',
        resolve(projectRoot, 'deno.json'),
        `data:application/typescript,${encodeURIComponent(controlPlaneProbeSource)}`,
      ],
      clearEnv: true,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assert(
      inspection.success,
      `${modulePath} additivity check failed: ${new TextDecoder().decode(inspection.stderr)}`,
    );

    const applicationModuleUrl = toFileUrl(resolve(projectRoot, plugin.namespace, 'mod.ts')).href;
    const applicationInspection = await new Deno.Command(Deno.execPath(), {
      args: [
        'eval',
        '--minimum-dependency-age=0',
        '--config',
        resolve(projectRoot, 'deno.json'),
        `const imported = await import(${JSON.stringify(applicationModuleUrl)});
for (const name of ${JSON.stringify(plugin.applicationExports)}) {
  if (!Reflect.has(imported, name)) throw new Error(\`missing application export \${name}\`);
}`,
      ],
      env: { DURABLE_STREAMS_URL: 'http://127.0.0.1:8090' },
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assert(
      applicationInspection.success,
      `${plugin.namespace}/mod.ts application export check failed: ${
        new TextDecoder().decode(applicationInspection.stderr)
      }`,
    );

    const packageConfig: unknown = JSON.parse(
      await Deno.readTextFile(
        new URL(`../../../../../../plugins/${plugin.packageDir}/deno.json`, import.meta.url),
      ),
    );
    assert(packageConfig !== null && typeof packageConfig === 'object');
    const publish = Reflect.get(packageConfig, 'publish');
    assert(publish !== null && typeof publish === 'object');
    const include = Reflect.get(publish, 'include');
    assert(Array.isArray(include));
    assert(
      include.includes('src/**/*.ts'),
      `${plugin.packageName} publish.include must ship its scaffold emitters`,
    );
  }

  await Deno.writeTextFile(
    resolve(projectRoot, 'netscript.config.ts'),
    `export default {
  name: 'fixture-app',
  databases: { config: [] },
  plugins: ${JSON.stringify(configuredModules)},
};
`,
  );
  const registered = await loadRegisteredPlugins(projectRoot);
  assertEquals(
    Object.values(registered).map((entry) => entry.name).sort(),
    FIRST_PARTY_PLUGIN_CASES.map((plugin) => plugin.packageName).sort(),
    'all configured first-party modules must resolve together through the runtime plugin loader',
  );
});

/** Split `@netscript/<pkg>[/<subpath...>]` into its `netscriptJsrSpecifier` args. */
function splitNetscriptSpecifier(specifier: string): { pkg: string; subpath: string } {
  const withoutScope = specifier.slice('@netscript/'.length);
  const slash = withoutScope.indexOf('/');
  if (slash === -1) {
    return { pkg: withoutScope, subpath: '' };
  }
  return { pkg: withoutScope.slice(0, slash), subpath: withoutScope.slice(slash) };
}

function importMapFromJson(source: string): object {
  const parsed: unknown = JSON.parse(source);
  if (parsed === null || typeof parsed !== 'object') return {};
  const imports = Reflect.get(parsed, 'imports');
  return imports !== null && typeof imports === 'object' ? imports : {};
}

function importTarget(imports: object, specifier: string): unknown {
  const direct = Reflect.get(imports, specifier);
  if (direct !== undefined) return direct;
  if (!specifier.startsWith('@')) {
    return Reflect.get(imports, specifier.split('/')[0]);
  }
  const segments = specifier.split('/');
  return segments.length >= 2 ? Reflect.get(imports, segments.slice(0, 2).join('/')) : undefined;
}

function emittedModuleSpecifiers(source: string): readonly string[] {
  const pattern = /(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']/g;
  return [...source.matchAll(pattern)].map((match) => match[1]);
}

async function declaredRuntimeRegistryPaths(packageDir: string): Promise<readonly string[]> {
  const manifestUrl = new URL(
    `../../../../../../plugins/${packageDir}/scaffold.runtime.json`,
    import.meta.url,
  );
  try {
    const parsed: unknown = JSON.parse(await Deno.readTextFile(manifestUrl));
    if (parsed === null || typeof parsed !== 'object') return [];
    const registries = Reflect.get(parsed, 'runtimeRegistries');
    if (!Array.isArray(registries)) return [];
    return registries.flatMap((registry: unknown) => {
      if (registry === null || typeof registry !== 'object') return [];
      const path = Reflect.get(registry, 'registryPath');
      return typeof path === 'string' ? [path] : [];
    });
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return [];
    throw error;
  }
}

Deno.test('first-party generated namespaces have complete imports in JSR and local-source modes', async () => {
  const localPackageNames = new Set<string>([
    ...SCAFFOLD_WORKSPACE_PACKAGES,
    ...SCAFFOLD_CONNECTOR_PACKAGES,
  ]);

  for (const plugin of FIRST_PARTY_PLUGIN_CASES) {
    const artifacts = collectInstallArtifacts(plugin.adapter);
    const emittedSources = artifacts
      .filter((artifact) => artifact.path.endsWith('.ts') || artifact.path.endsWith('.tsx'))
      .map((artifact) => ({ path: artifact.path, source: artifactText(artifact) }));
    const emittedPaths = new Set(artifacts.map((artifact) => artifact.path));
    for (const path of await declaredRuntimeRegistryPaths(plugin.packageDir)) {
      emittedPaths.add(path);
    }
    const namespaceRoot = resolve('/', plugin.namespace);
    const namespaceFs = new MemoryFileSystemAdapter();
    for (const artifact of artifacts) {
      await namespaceFs.writeFile(resolve('/', artifact.path), artifactText(artifact));
    }
    if (plugin.adapter.install.uiRegistryItems?.length) {
      const installedUi = await installUiRegistryItems({
        projectRoot: namespaceRoot,
        names: plugin.adapter.install.uiRegistryItems,
        overwrite: false,
      }, { fs: namespaceFs });
      for (const copiedPath of installedUi.copiedFiles) {
        const emittedPath = join(plugin.namespace, relative(namespaceRoot, copiedPath));
        emittedPaths.add(emittedPath);
        if (emittedPath.endsWith('.ts') || emittedPath.endsWith('.tsx')) {
          emittedSources.push({
            path: emittedPath,
            source: await namespaceFs.readFile(copiedPath),
          });
        }
      }
    }
    const namespaceDenoJson = resolve(namespaceRoot, 'deno.json');
    const namespaceImports = await namespaceFs.exists(namespaceDenoJson)
      ? importMapFromJson(await namespaceFs.readFile(namespaceDenoJson))
      : {};
    const externalSpecifiers = new Set<string>();

    for (const emitted of emittedSources) {
      for (const specifier of emittedModuleSpecifiers(emitted.source)) {
        if (specifier.startsWith('.')) {
          const resolved = resolve('/', dirname(emitted.path), specifier).slice(1);
          const candidates = [resolved, `${resolved}.ts`, `${resolved}.tsx`, `${resolved}/mod.ts`];
          assert(
            candidates.some((candidate) => emittedPaths.has(candidate)),
            `${emitted.path} imports relative module "${specifier}" that is not emitted`,
          );
        } else if (
          !specifier.startsWith('jsr:') && !specifier.startsWith('npm:') &&
          !specifier.startsWith('node:')
        ) {
          externalSpecifiers.add(specifier);
        }
      }
    }

    for (const mode of ['jsr', 'local-source']) {
      const fs = new MemoryFileSystemAdapter();
      await fs.writeFile(
        '/project/deno.json',
        JSON.stringify({ workspace: ['./packages/*', './plugins/*'], imports: {} }, null, 2) +
          '\n',
      );
      if (mode === 'local-source') {
        await fs.writeFile(
          join('/project', 'packages', 'cli', 'deno.json'),
          JSON.stringify({ name: '@netscript/cli' }, null, 2) + '\n',
        );
      }

      await new PluginWorkspaceMutator(fs).ensureRootImportsForPluginKind('/project', plugin.kind);
      const rootImports = importMapFromJson(await fs.readFile('/project/deno.json'));

      for (const specifier of [...externalSpecifiers].sort()) {
        const target = importTarget(namespaceImports, specifier) ??
          importTarget(rootImports, specifier);
        if (target !== undefined) continue;

        if (mode === 'local-source' && specifier.startsWith('@netscript/')) {
          const { pkg } = splitNetscriptSpecifier(specifier);
          assert(
            localPackageNames.has(pkg),
            `${plugin.namespace} emits "${specifier}", but local-source scaffolds do not copy ` +
              `the "${pkg}" package`,
          );
          continue;
        }

        throw new Error(
          `${plugin.namespace} emits "${specifier}", but ${mode} import wiring does not resolve it`,
        );
      }
    }
  }
});


Deno.test('PluginWorkspaceMutator writes no ai kind-source jsr pins into local-source projects', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/deno.json',
    JSON.stringify({ workspace: ['./packages/*', './plugins/*'], imports: {} }, null, 2) + '\n',
  );
  // LOCAL_SOURCE_MARKER: presence of the copied CLI package manifest marks a
  // local-source (maintainer) scaffold whose packages resolve as members.
  await fs.writeFile(
    join('/project', 'packages', 'cli', 'deno.json'),
    JSON.stringify({ name: '@netscript/cli' }, null, 2) + '\n',
  );

  await new PluginWorkspaceMutator(fs).ensureRootImportsForPluginKind('/project', 'ai');

  const config = JSON.parse(await fs.readFile('/project/deno.json')) as {
    imports: Record<string, string>;
  };

  // Exact jsr pins for the ai kind sources must NOT be written into
  // local-source projects: they would shadow the copied workspace members on
  // any version mismatch and wedge release-cut CI on not-yet-published
  // versions. Resolution is provided by the copied members instead.
  for (
    const specifier of [
      '@netscript/ai',
      '@netscript/plugin-ai',
      '@netscript/plugin-ai-core',
      '@netscript/fresh',
    ]
  ) {
    assertEquals(
      config.imports[specifier],
      undefined,
      `Local-source project must not receive a jsr pin for "${specifier}".`,
    );
  }
  const aiSubpathKeys = Object.keys(config.imports).filter((key) =>
    key.startsWith('@netscript/ai/') || key.startsWith('@netscript/fresh/ai')
  );
  assertEquals(aiSubpathKeys, [], 'Local-source project must not receive ai subpath pins.');
});

Deno.test('PluginWorkspaceMutator rewrite map covers every @netscript/telemetry export subpath', async () => {
  // Resolve the real telemetry manifest relative to the worktree repo root so
  // this guard fails when either the export map or the rewrite map drifts.
  const telemetryDenoJsonUrl = new URL(
    '../../../../../../packages/telemetry/deno.json',
    import.meta.url,
  );
  const telemetryDenoJson = JSON.parse(
    await Deno.readTextFile(telemetryDenoJsonUrl),
  ) as { exports: Record<string, string> };
  const exportKeys = Object.keys(telemetryDenoJson.exports ?? {});
  assert(
    exportKeys.length > 0,
    'telemetry deno.json must declare an exports map',
  );

  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/deno.json',
    JSON.stringify({ workspace: ['./plugins/*'], imports: {} }, null, 2) + '\n',
  );

  await new PluginWorkspaceMutator(fs).ensureRootImportsForPluginKind(
    '/project',
    'worker',
  );

  const config = JSON.parse(await fs.readFile('/project/deno.json')) as {
    imports: Record<string, string>;
  };

  for (const exportKey of exportKeys) {
    const subpath = exportKey === '.' ? '' : exportKey.slice(1);
    const specifier = `@netscript/telemetry${subpath}`;
    const expected = subpath === ''
      ? netscriptJsrSpecifier('telemetry')
      : netscriptJsrSpecifier('telemetry', subpath);
    assertEquals(
      config.imports[specifier],
      expected,
      `workspace-mutator rewrite map is missing an entry for "${specifier}" ` +
        `(telemetry export "${exportKey}").`,
    );
  }
});
