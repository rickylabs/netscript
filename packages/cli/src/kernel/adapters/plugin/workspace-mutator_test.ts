/**
 * @module infra/plugin/workspace-mutator_test
 *
 * Focused regression tests for plugin workspace mutations.
 */

import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { join } from '@std/path';
import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import { PluginWorkspaceMutator } from './workspace-mutator.ts';
import type { PluginKindProvider } from '../../domain/plugin-kind.ts';
import { netscriptJsrSpecifier } from '../../constants/jsr-specifiers.ts';
import { SCAFFOLD_WORKSPACE_PACKAGES } from '../../constants/scaffold/scaffold-workspace-packages.ts';
import { SCAFFOLD_PACKAGES } from '../../constants/scaffold/scaffold-packages.ts';
import { resolveNetScriptImports } from '../scaffold/import-resolver.ts';

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

/**
 * Recursively collect `*.stub.ts` file URLs under a resources root. Each AI
 * scaffold stub wraps the emitted userland source in a `defineStub({ source })`
 * template literal, so scanning the stub text yields the exact `@netscript/*`
 * specifiers the generated project will contain.
 */
async function collectStubFiles(root: URL): Promise<URL[]> {
  const files: URL[] = [];
  for await (const entry of Deno.readDir(root)) {
    const child = new URL(`${root.href}/${entry.name}`);
    if (entry.isDirectory) {
      files.push(...await collectStubFiles(child));
    } else if (entry.isFile && entry.name.endsWith('.stub.ts')) {
      files.push(child);
    }
  }
  return files;
}

/** Split `@netscript/<pkg>[/<subpath...>]` into its `netscriptJsrSpecifier` args. */
function splitNetscriptSpecifier(specifier: string): { pkg: string; subpath: string } {
  const withoutScope = specifier.slice('@netscript/'.length);
  const slash = withoutScope.indexOf('/');
  if (slash === -1) {
    return { pkg: withoutScope, subpath: '' };
  }
  return { pkg: withoutScope.slice(0, slash), subpath: withoutScope.slice(slash) };
}

Deno.test('PluginWorkspaceMutator wires every @netscript/* specifier emitted by the AI scaffold', async () => {
  // Read the real AI scaffold stubs relative to the worktree repo root so this
  // guard fails whenever the scaffold emits a bare `@netscript/*` specifier that
  // the prod/JSR import-map wiring does not cover (regression guard for #505).
  const resourcesRoot = new URL(
    '../../../../../../plugins/ai/src/adapter/resources',
    import.meta.url,
  );
  const stubFiles = await collectStubFiles(resourcesRoot);
  assert(stubFiles.length > 0, 'expected to find AI scaffold *.stub.ts sources');

  // `@netscript/plugin/adapter` is the stub-authoring wrapper (imported by the
  // .stub.ts module itself), never part of the emitted userland source.
  const STUB_AUTHORING_IMPORT = '@netscript/plugin/adapter';
  // Match only module specifiers in real `import`/`export` statements — either
  // `from '<spec>'` or a side-effect `import '<spec>'`. This deliberately ignores
  // `@netscript/*` mentions in prose/JSDoc and quoted data literals (e.g. a
  // `pluginName: '@netscript/plugin-ai'` capability string), which are not imports.
  const specifierPattern = /(?:from|import)\s+['"](@netscript\/[^'"]+)['"]/g;
  const emitted = new Set<string>();
  for (const file of stubFiles) {
    const source = await Deno.readTextFile(file);
    for (const match of source.matchAll(specifierPattern)) {
      if (match[1] !== STUB_AUTHORING_IMPORT) {
        emitted.add(match[1]);
      }
    }
  }
  assert(
    emitted.has('@netscript/fresh/ai'),
    'AI scaffold is expected to emit @netscript/fresh/ai (defect #505 anchor)',
  );

  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/deno.json',
    JSON.stringify({ workspace: ['./plugins/*'], imports: {} }, null, 2) + '\n',
  );

  await new PluginWorkspaceMutator(fs).ensureRootImportsForPluginKind('/project', 'ai');

  const config = JSON.parse(await fs.readFile('/project/deno.json')) as {
    imports: Record<string, string>;
  };

  // Prod/JSR coverage: kind-source wiring uses bare package aliases only —
  // Deno expands export subpaths through a root `jsr:` package alias (deno-add
  // semantics), so every emitted specifier is covered when its root package
  // alias maps to an exact `jsr:@netscript/<pkg>@<version>` (no subpath).
  const bareJsrAliasPattern = /^jsr:@netscript\/[a-z0-9-]+@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
  for (const specifier of [...emitted].sort()) {
    const { pkg } = splitNetscriptSpecifier(specifier);
    const rootAlias = `@netscript/${pkg}`;
    const target = config.imports[rootAlias];
    assert(
      target !== undefined,
      `AI scaffold emits "${specifier}" but the prod import-map wiring has no ` +
        `root alias for "${rootAlias}". Add it to PLUGIN_KIND_SOURCE_IMPORTS.ai ` +
        `in workspace-mutator.ts.`,
    );
    assert(
      bareJsrAliasPattern.test(target),
      `Root alias "${rootAlias}" must be a bare exact-version jsr package alias ` +
        `(subpath expansion only works through bare aliases), got "${target}".`,
    );
  }

  // Exact targets: all three kind-source packages ride the release train.
  assertEquals(config.imports['@netscript/ai'], netscriptJsrSpecifier('ai'));
  assertEquals(
    config.imports['@netscript/plugin-ai-core'],
    netscriptJsrSpecifier('plugin-ai-core'),
  );
  assertEquals(config.imports['@netscript/fresh'], netscriptJsrSpecifier('fresh'));

  // Drift-guard: the map's @netscript/ai entry must match the pin declared by
  // packages/plugin-ai-core/deno.json — the in-repo source of truth for what
  // the published stack references. This keeps the map honest across release
  // cuts: if the engine ever leaves the train again (or the cut misses one of
  // the two files), this assertion fails in the same PR.
  const pluginAiCoreDenoJson = JSON.parse(
    await Deno.readTextFile(
      new URL('../../../../../../packages/plugin-ai-core/deno.json', import.meta.url),
    ),
  ) as { imports: Record<string, string> };
  assertEquals(
    config.imports['@netscript/ai'],
    pluginAiCoreDenoJson.imports['@netscript/ai'],
    'The @netscript/ai entry in PLUGIN_KIND_SOURCE_IMPORTS drifted from the ' +
      '@netscript/ai pin in packages/plugin-ai-core/deno.json. Both must reference ' +
      'the same published engine version.',
  );

  // Local-source coverage: every emitted @netscript/* package must be copied
  // into local scaffolds as a workspace member, because the local path gets NO
  // kind-source import-map entries (see the local-marker test below) and
  // resolves these specifiers purely through workspace membership + exports.
  const memberSet = new Set<string>(SCAFFOLD_WORKSPACE_PACKAGES);
  for (const specifier of [...emitted].sort()) {
    const { pkg } = splitNetscriptSpecifier(specifier);
    assert(
      memberSet.has(pkg),
      `AI scaffold emits "${specifier}" but "${pkg}" is not in ` +
        `SCAFFOLD_WORKSPACE_PACKAGES, so local-source projects cannot resolve it.`,
    );
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
  for (const specifier of ['@netscript/ai', '@netscript/plugin-ai-core', '@netscript/fresh']) {
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
