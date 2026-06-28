import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals, assertFalse, assertStringIncludes } from 'jsr:@std/assert@^1';
import { join, resolve } from '@std/path';

import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { DenoProcess } from '../../../../kernel/adapters/runtime/process/deno-process.ts';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { Scaffolder } from '../../../../kernel/adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../../../kernel/adapters/scaffold/template-adapter.ts';
import { PluginKindRegistry } from '../../../../kernel/application/registries/plugin-kind-registry.ts';
import { PluginRegistryScaffolder } from '../../../../kernel/adapters/plugin/registry-scaffolder.ts';
import { PluginScaffolder } from '../../../../kernel/adapters/plugin/scaffolder.ts';
import { PluginWorkspaceMutator } from '../../../../kernel/adapters/plugin/workspace-mutator.ts';
import type { PluginKindProvider } from '../../../../kernel/domain/plugin-kind.ts';
import { addPlugin } from './add-plugin.ts';
import type {
  JsrPluginValidationResult,
  JsrPluginValidatorPort,
  ValidatedPluginDescriptor,
} from './jsr-plugin-validator-port.ts';
import { planPluginAdd } from './plan-plugin-add.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../kernel/application/registries/template-registry.ts';
import { dispatchPluginScaffold } from '../dispatch/dispatch-plugin-verb.ts';

// This flow renders plugin/workspace files via sync template generators, which
// require a previously-awaited registry hydration. The test drives the flow
// directly (outside the CLI dispatch path), so hydrate at module load.
await DEFAULT_TEMPLATE_REGISTRY.hydrate();

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

const sagaProvider: PluginKindProvider = {
  kind: 'saga',
  displayName: 'Saga Orchestrator',
  category: 'background-processor',
  portRangeKey: 'INFRA_PLUGIN',
  defaultPermissions: [
    '--unstable-kv',
    '--allow-net',
    '--allow-env',
    '--allow-read',
    '--allow-write',
  ],
  watchFlag: '--watch',
  defaultEntrypoint: 'src/runtime/saga-runner.ts',
  defaultServiceEntrypoint: 'services/src/main.ts',
  defaultRequiresDb: true,
  defaultRequiresKv: true,
  pluginType: 'background-processor',
  supportsConcurrency: true,
  concurrencyEnvVar: 'SAGA_CONCURRENCY',
  defaultConcurrency: 2,
  defaultTelemetry: true,
  infrastructureRequires: ['kv'],
  infrastructureOptionalDeps: ['db'],
};

const triggerProvider: PluginKindProvider = {
  kind: 'triggers',
  displayName: 'Trigger Processor',
  category: 'background-processor',
  portRangeKey: 'INFRA_PLUGIN',
  defaultPermissions: [
    '--unstable-kv',
    '--allow-net',
    '--allow-env',
    '--allow-read',
    '--allow-write',
  ],
  watchFlag: '--watch',
  defaultEntrypoint: 'src/runtime/trigger-processor.ts',
  defaultServiceEntrypoint: 'services/src/main.ts',
  defaultRequiresDb: true,
  defaultRequiresKv: true,
  pluginType: 'background-processor',
  supportsConcurrency: true,
  concurrencyEnvVar: 'TRIGGER_CONCURRENCY',
  defaultConcurrency: 10,
  defaultTelemetry: true,
  infrastructureRequires: ['kv'],
  infrastructureOptionalDeps: ['db'],
};

const streamsProvider: PluginKindProvider = {
  kind: 'stream',
  displayName: 'Durable Streams',
  category: 'plugin',
  portRangeKey: 'PLUGIN_API',
  defaultPermissions: [
    '--allow-net',
    '--allow-env',
    '--allow-read',
    '--allow-write',
    '--allow-sys',
    '--allow-ffi',
  ],
  watchFlag: '--watch',
  defaultEntrypoint: 'services/src/main.ts',
  defaultServiceEntrypoint: 'services/src/main.ts',
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

  it('keeps canonical plugin add on the JSR stub path without copying official source', async () => {
    const fs = new MemoryFileSystemAdapter();
    await writeProjectFiles(fs);
    const templateAdapter = new StringTemplateAdapter(fs);
    const scaffolder = new Scaffolder(templateAdapter, fs);
    const registry = new PluginKindRegistry();
    registry.register(workerProvider.kind, workerProvider);

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
    });

    const pluginDenoJson = JSON.parse(
      await fs.readFile('/workspace/alpha/plugins/workers/deno.json'),
    );
    const pluginMod = await fs.readFile('/workspace/alpha/plugins/workers/mod.ts');

    assertStringIncludes(pluginDenoJson.imports['@netscript/plugin'], 'jsr:@netscript/plugin');
    assertStringIncludes(pluginMod, "import { definePlugin } from '@netscript/plugin';");
    assertFalse(pluginMod.includes('./src/public/mod.ts'));
    assertFalse(await fs.exists('/workspace/alpha/plugins/workers/src/public/mod.ts'));
    assertFalse(await fs.exists('/workspace/alpha/plugins/workers/worker/worker.ts'));
    assertFalse(await fs.exists('/workspace/alpha/plugins/workers/scaffold.plugin.json'));
    assertFalse(await fs.exists('/workspace/alpha/workers'));
  });

  it('resolves a bare plugin alias before kind-registry planning', async () => {
    const fs = new MemoryFileSystemAdapter();
    await writeProjectFiles(fs);
    const templateAdapter = new StringTemplateAdapter(fs);
    const scaffolder = new Scaffolder(templateAdapter, fs);
    const registry = new PluginKindRegistry();

    const result = await addPlugin({
      kind: 'workers',
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
      pluginValidator: new FixturePluginValidator(workerProvider),
      regenerateHelpers: () => Promise.resolve(['/workspace/alpha/aspire/apphost.mts']),
    });

    assertEquals(result.resolvedPlugin?.package.packageSpecifier, '@netscript/plugin-workers');
    assertEquals(result.plugin.kind, 'worker');
  });

  it('respects --no-copy-source by rendering the JSR stub instead of copying official source', async () => {
    const fs = new MemoryFileSystemAdapter();
    await writeProjectFiles(fs);
    const templateAdapter = new StringTemplateAdapter(fs);
    const scaffolder = new Scaffolder(templateAdapter, fs);
    const registry = new PluginKindRegistry();
    registry.register(workerProvider.kind, workerProvider);

    await addPlugin({
      kind: 'worker',
      pluginName: 'workers',
      serviceReferences: [],
      pluginReferences: [],
      noDb: true,
      includeSamples: false,
      noCopySource: true,
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

    assertFalse(await fs.exists('/workspace/alpha/workers/mod.ts'));
    const rootDenoJson = JSON.parse(await fs.readFile('/workspace/alpha/deno.json'));
    assertEquals(rootDenoJson.workspace.includes('./workers'), false);
    const pluginMod = await fs.readFile('/workspace/alpha/plugins/workers/mod.ts');
    assertStringIncludes(pluginMod, "import { definePlugin } from '@netscript/plugin';");
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

  it('previews a local-path plugin-owned scaffolder without writing files', async () => {
    const projectRoot = await Deno.makeTempDir();
    const fixtureRoot = resolve('packages/cli/tests/fixtures/plugin-scaffolder');
    try {
      await writeRealProjectFiles(projectRoot);
      const fs = new DenoFileSystem();
      const templateAdapter = new StringTemplateAdapter(fs);
      const scaffolder = new Scaffolder(templateAdapter, fs);
      const registry = new PluginKindRegistry();

      const result = await addPlugin({
        kind: 'fixture',
        pluginName: 'fixture',
        serviceReferences: [],
        pluginReferences: [],
        noDb: true,
        includeSamples: false,
        dryRun: true,
        localPath: fixtureRoot,
        projectRoot,
        overwrite: false,
      }, {
        fs,
        scaffolder,
        templateAdapter,
        registry,
        pluginScaffolder: new PluginScaffolder(scaffolder, fs, registry),
        registryScaffolder: new PluginRegistryScaffolder(scaffolder),
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: new DenoProcess(),
        regenerateHelpers: () => Promise.resolve([]),
      });

      assertEquals(result.pluginOwnedScaffold?.status, 'planned');
      assertEquals(result.pluginOwnedScaffold?.createdFiles, ['plugins/fixture/generated.txt']);
      await assertFalseExists(join(projectRoot, 'plugins/fixture/generated.txt'));
      await assertFalseExists(join(projectRoot, 'post-script-ran.txt'));
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('adds workers from the real local-path plugin-owned scaffolder', async () => {
    const projectRoot = await Deno.makeTempDir();
    const workersRoot = resolve('plugins/workers');
    try {
      await writeRealProjectFiles(projectRoot);
      const fs = new DenoFileSystem();
      const templateAdapter = new StringTemplateAdapter(fs);
      const scaffolder = new Scaffolder(templateAdapter, fs);
      const registry = new PluginKindRegistry();

      const result = await addPlugin({
        kind: 'workers',
        pluginName: 'workers',
        serviceReferences: [],
        pluginReferences: [],
        noDb: true,
        includeSamples: true,
        localPath: workersRoot,
        projectRoot,
        overwrite: false,
      }, {
        fs,
        scaffolder,
        templateAdapter,
        registry,
        pluginScaffolder: new PluginScaffolder(scaffolder, fs, registry),
        registryScaffolder: new PluginRegistryScaffolder(scaffolder),
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: new DenoProcess(),
        regenerateHelpers: () => Promise.resolve([]),
      });

      assertEquals(result.pluginOwnedScaffold?.status, 'applied');
      assertEquals(result.pluginOwnedScaffold?.databaseMigrationsAdded, true);
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'plugins/workers/services/src/main.ts',
      );
      assertStringIncludes(
        await Deno.readTextFile(join(projectRoot, 'plugins/workers/mod.ts')),
        "definePlugin('workers', '0.1.0')",
      );
      assertStringIncludes(
        await Deno.readTextFile(join(projectRoot, 'plugins/workers/database/schema.prisma')),
        'model WorkersRecord',
      );
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('previews the real workers local-path scaffolder without writing files', async () => {
    const projectRoot = await Deno.makeTempDir();
    const workersRoot = resolve('plugins/workers');
    try {
      await writeRealProjectFiles(projectRoot);
      const fs = new DenoFileSystem();
      const templateAdapter = new StringTemplateAdapter(fs);
      const scaffolder = new Scaffolder(templateAdapter, fs);
      const registry = new PluginKindRegistry();

      const result = await addPlugin({
        kind: 'workers',
        pluginName: 'workers',
        serviceReferences: [],
        pluginReferences: [],
        noDb: true,
        includeSamples: true,
        dryRun: true,
        localPath: workersRoot,
        projectRoot,
        overwrite: false,
      }, {
        fs,
        scaffolder,
        templateAdapter,
        registry,
        pluginScaffolder: new PluginScaffolder(scaffolder, fs, registry),
        registryScaffolder: new PluginRegistryScaffolder(scaffolder),
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: new DenoProcess(),
        regenerateHelpers: () => Promise.resolve([]),
      });

      assertEquals(result.pluginOwnedScaffold?.status, 'planned');
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'plugins/workers/bin/combined.ts',
      );
      await assertFalseExists(join(projectRoot, 'plugins/workers/mod.ts'));
      await assertFalseExists(join(projectRoot, 'plugins/workers/database/schema.prisma'));
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('reruns the real workers scaffolder idempotently', async () => {
    const projectRoot = await Deno.makeTempDir();
    const workersRoot = resolve('plugins/workers');
    const descriptor = workersDescriptor();
    try {
      await writeRealProjectFiles(projectRoot);

      const first = await dispatchPluginScaffold({
        descriptor,
        source: { kind: 'local-path', path: workersRoot },
        projectRoot,
        pluginName: 'workers',
        dryRun: false,
        permissionFlags: ['-A'],
        processRunner: new DenoProcess(),
      });
      const second = await dispatchPluginScaffold({
        descriptor,
        source: { kind: 'local-path', path: workersRoot },
        projectRoot,
        pluginName: 'workers',
        dryRun: false,
        permissionFlags: ['-A'],
        processRunner: new DenoProcess(),
      });

      assertEquals(first.status, 'applied');
      assertEquals(second.status, 'skipped');
      assertEquals(second.createdFiles, []);
      assertEquals(second.modifiedFiles, []);
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('runs the real sagas local-path scaffolder through plugin add', async () => {
    const projectRoot = await Deno.makeTempDir();
    const sagasRoot = resolve('plugins/sagas');
    try {
      await writeRealProjectFiles(projectRoot);
      const fs = new DenoFileSystem();
      const templateAdapter = new StringTemplateAdapter(fs);
      const scaffolder = new Scaffolder(templateAdapter, fs);
      const registry = new PluginKindRegistry();

      const result = await addPlugin({
        kind: 'sagas',
        pluginName: 'sagas',
        serviceReferences: [],
        pluginReferences: ['workers-api'],
        noDb: true,
        includeSamples: true,
        localPath: sagasRoot,
        projectRoot,
        overwrite: false,
        sagaStoreBackend: 'prisma',
      }, {
        fs,
        scaffolder,
        templateAdapter,
        registry,
        pluginScaffolder: new PluginScaffolder(scaffolder, fs, registry),
        registryScaffolder: new PluginRegistryScaffolder(scaffolder),
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: new DenoProcess(),
        regenerateHelpers: () => Promise.resolve([]),
      });

      assertEquals(result.pluginOwnedScaffold?.status, 'applied');
      assertEquals(result.pluginOwnedScaffold?.databaseMigrationsAdded, true);
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'plugins/sagas/database/sagas.prisma',
      );
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'plugins/sagas/sagas/user-registration-saga.ts',
      );
      assertStringIncludes(
        await Deno.readTextFile(join(projectRoot, 'plugins/sagas/mod.ts')),
        "definePlugin('sagas', '0.1.0')",
      );
      assertStringIncludes(
        await Deno.readTextFile(join(projectRoot, 'plugins/sagas/database/sagas.prisma')),
        'model SagaRuntimeState',
      );
      assertStringIncludes(
        await Deno.readTextFile(join(projectRoot, 'appsettings.json')),
        '"Backend": "prisma"',
      );
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('previews the real sagas local-path scaffolder without writing files', async () => {
    const projectRoot = await Deno.makeTempDir();
    const sagasRoot = resolve('plugins/sagas');
    try {
      await writeRealProjectFiles(projectRoot);
      const fs = new DenoFileSystem();
      const templateAdapter = new StringTemplateAdapter(fs);
      const scaffolder = new Scaffolder(templateAdapter, fs);
      const registry = new PluginKindRegistry();

      const result = await addPlugin({
        kind: 'sagas',
        pluginName: 'sagas',
        serviceReferences: [],
        pluginReferences: ['workers-api'],
        noDb: true,
        includeSamples: true,
        dryRun: true,
        localPath: sagasRoot,
        projectRoot,
        overwrite: false,
      }, {
        fs,
        scaffolder,
        templateAdapter,
        registry,
        pluginScaffolder: new PluginScaffolder(scaffolder, fs, registry),
        registryScaffolder: new PluginRegistryScaffolder(scaffolder),
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: new DenoProcess(),
        regenerateHelpers: () => Promise.resolve([]),
      });

      assertEquals(result.pluginOwnedScaffold?.status, 'planned');
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'plugins/sagas/src/runtime/saga-runner.ts',
      );
      await assertFalseExists(join(projectRoot, 'plugins/sagas/mod.ts'));
      await assertFalseExists(join(projectRoot, 'plugins/sagas/database/sagas.prisma'));
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('reruns the real sagas scaffolder idempotently', async () => {
    const projectRoot = await Deno.makeTempDir();
    const sagasRoot = resolve('plugins/sagas');
    const descriptor = sagasDescriptor();
    try {
      await writeRealProjectFiles(projectRoot);

      const first = await dispatchPluginScaffold({
        descriptor,
        source: { kind: 'local-path', path: sagasRoot },
        projectRoot,
        pluginName: 'sagas',
        dryRun: false,
        permissionFlags: ['-A'],
        processRunner: new DenoProcess(),
      });
      const second = await dispatchPluginScaffold({
        descriptor,
        source: { kind: 'local-path', path: sagasRoot },
        projectRoot,
        pluginName: 'sagas',
        dryRun: false,
        permissionFlags: ['-A'],
        processRunner: new DenoProcess(),
      });

      assertEquals(first.status, 'applied');
      assertEquals(second.status, 'skipped');
      assertEquals(second.createdFiles, []);
      assertEquals(second.modifiedFiles, []);
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('runs the real triggers local-path scaffolder through plugin add', async () => {
    const projectRoot = await Deno.makeTempDir();
    const triggersRoot = resolve('plugins/triggers');
    try {
      await writeRealProjectFiles(projectRoot);
      const fs = new DenoFileSystem();
      const templateAdapter = new StringTemplateAdapter(fs);
      const scaffolder = new Scaffolder(templateAdapter, fs);
      const registry = new PluginKindRegistry();

      const result = await addPlugin({
        kind: 'triggers',
        pluginName: 'triggers',
        serviceReferences: [],
        pluginReferences: ['workers-api'],
        noDb: true,
        includeSamples: true,
        localPath: triggersRoot,
        projectRoot,
        overwrite: false,
      }, {
        fs,
        scaffolder,
        templateAdapter,
        registry,
        pluginScaffolder: new PluginScaffolder(scaffolder, fs, registry),
        registryScaffolder: new PluginRegistryScaffolder(scaffolder),
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: new DenoProcess(),
        regenerateHelpers: () => Promise.resolve([]),
      });

      assertEquals(result.pluginOwnedScaffold?.status, 'applied');
      assertEquals(result.pluginOwnedScaffold?.databaseMigrationsAdded, true);
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'plugins/triggers/database/triggers.prisma',
      );
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'plugins/triggers/triggers/generic-inbound-webhook.ts',
      );
      assertStringIncludes(
        await Deno.readTextFile(join(projectRoot, 'plugins/triggers/mod.ts')),
        "definePlugin('triggers', '0.1.0')",
      );
      assertStringIncludes(
        await Deno.readTextFile(join(projectRoot, 'plugins/triggers/database/triggers.prisma')),
        'model TriggerEvent',
      );
      assertStringIncludes(
        await Deno.readTextFile(
          join(projectRoot, 'plugins/triggers/triggers/daily-maintenance.ts'),
        ),
        'defineScheduledTrigger',
      );
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('previews the real triggers local-path scaffolder without writing files', async () => {
    const projectRoot = await Deno.makeTempDir();
    const triggersRoot = resolve('plugins/triggers');
    try {
      await writeRealProjectFiles(projectRoot);
      const fs = new DenoFileSystem();
      const templateAdapter = new StringTemplateAdapter(fs);
      const scaffolder = new Scaffolder(templateAdapter, fs);
      const registry = new PluginKindRegistry();

      const result = await addPlugin({
        kind: 'triggers',
        pluginName: 'triggers',
        serviceReferences: [],
        pluginReferences: ['workers-api'],
        noDb: true,
        includeSamples: true,
        dryRun: true,
        localPath: triggersRoot,
        projectRoot,
        overwrite: false,
      }, {
        fs,
        scaffolder,
        templateAdapter,
        registry,
        pluginScaffolder: new PluginScaffolder(scaffolder, fs, registry),
        registryScaffolder: new PluginRegistryScaffolder(scaffolder),
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: new DenoProcess(),
        regenerateHelpers: () => Promise.resolve([]),
      });

      assertEquals(result.pluginOwnedScaffold?.status, 'planned');
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'plugins/triggers/src/runtime/trigger-processor.ts',
      );
      await assertFalseExists(join(projectRoot, 'plugins/triggers/mod.ts'));
      await assertFalseExists(join(projectRoot, 'plugins/triggers/database/triggers.prisma'));
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('reruns the real triggers scaffolder idempotently', async () => {
    const projectRoot = await Deno.makeTempDir();
    const triggersRoot = resolve('plugins/triggers');
    const descriptor = triggersDescriptor();
    try {
      await writeRealProjectFiles(projectRoot);

      const first = await dispatchPluginScaffold({
        descriptor,
        source: { kind: 'local-path', path: triggersRoot },
        projectRoot,
        pluginName: 'triggers',
        dryRun: false,
        permissionFlags: ['-A'],
        processRunner: new DenoProcess(),
      });
      const second = await dispatchPluginScaffold({
        descriptor,
        source: { kind: 'local-path', path: triggersRoot },
        projectRoot,
        pluginName: 'triggers',
        dryRun: false,
        permissionFlags: ['-A'],
        processRunner: new DenoProcess(),
      });

      assertEquals(first.status, 'applied');
      assertEquals(second.status, 'skipped');
      assertEquals(second.createdFiles, []);
      assertEquals(second.modifiedFiles, []);
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('runs the real streams local-path scaffolder through plugin add', async () => {
    const projectRoot = await Deno.makeTempDir();
    const streamsRoot = resolve('plugins/streams');
    try {
      await writeRealProjectFiles(projectRoot);
      const fs = new DenoFileSystem();
      const templateAdapter = new StringTemplateAdapter(fs);
      const scaffolder = new Scaffolder(templateAdapter, fs);
      const registry = new PluginKindRegistry();

      const result = await addPlugin({
        kind: 'streams',
        pluginName: 'streams',
        serviceReferences: [],
        pluginReferences: [],
        noDb: true,
        includeSamples: true,
        localPath: streamsRoot,
        projectRoot,
        overwrite: false,
      }, {
        fs,
        scaffolder,
        templateAdapter,
        registry,
        pluginScaffolder: new PluginScaffolder(scaffolder, fs, registry),
        registryScaffolder: new PluginRegistryScaffolder(scaffolder),
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: new DenoProcess(),
        regenerateHelpers: () => Promise.resolve([]),
      });

      assertEquals(result.pluginOwnedScaffold?.status, 'applied');
      assertEquals(result.pluginOwnedScaffold?.databaseMigrationsAdded, false);
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'plugins/streams/services/src/routes.ts',
      );
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'plugins/streams/src/streams/mod.ts',
      );
      assertStringIncludes(
        await Deno.readTextFile(join(projectRoot, 'plugins/streams/mod.ts')),
        "definePlugin('streams', '0.1.0')",
      );
      assertStringIncludes(
        await Deno.readTextFile(join(projectRoot, 'plugins/streams/services/src/routes.ts')),
        'DurableStreamTestServer',
      );
      assertStringIncludes(
        await Deno.readTextFile(join(projectRoot, 'plugins/streams/src/aspire/mod.ts')),
        "entrypoint: 'plugins/streams/services/src/main.ts'",
      );
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('previews the real streams local-path scaffolder without writing files', async () => {
    const projectRoot = await Deno.makeTempDir();
    const streamsRoot = resolve('plugins/streams');
    try {
      await writeRealProjectFiles(projectRoot);
      const fs = new DenoFileSystem();
      const templateAdapter = new StringTemplateAdapter(fs);
      const scaffolder = new Scaffolder(templateAdapter, fs);
      const registry = new PluginKindRegistry();

      const result = await addPlugin({
        kind: 'streams',
        pluginName: 'streams',
        serviceReferences: [],
        pluginReferences: [],
        noDb: true,
        includeSamples: true,
        dryRun: true,
        localPath: streamsRoot,
        projectRoot,
        overwrite: false,
      }, {
        fs,
        scaffolder,
        templateAdapter,
        registry,
        pluginScaffolder: new PluginScaffolder(scaffolder, fs, registry),
        registryScaffolder: new PluginRegistryScaffolder(scaffolder),
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: new DenoProcess(),
        regenerateHelpers: () => Promise.resolve([]),
      });

      assertEquals(result.pluginOwnedScaffold?.status, 'planned');
      assertEquals(result.pluginOwnedScaffold?.databaseMigrationsAdded, false);
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'plugins/streams/services/src/main.ts',
      );
      await assertFalseExists(join(projectRoot, 'plugins/streams/mod.ts'));
      await assertFalseExists(join(projectRoot, 'plugins/streams/services/src/routes.ts'));
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('reruns the real streams scaffolder idempotently', async () => {
    const projectRoot = await Deno.makeTempDir();
    const streamsRoot = resolve('plugins/streams');
    const descriptor = streamsDescriptor();
    try {
      await writeRealProjectFiles(projectRoot);

      const first = await dispatchPluginScaffold({
        descriptor,
        source: { kind: 'local-path', path: streamsRoot },
        projectRoot,
        pluginName: 'streams',
        dryRun: false,
        permissionFlags: ['-A'],
        processRunner: new DenoProcess(),
      });
      const second = await dispatchPluginScaffold({
        descriptor,
        source: { kind: 'local-path', path: streamsRoot },
        projectRoot,
        pluginName: 'streams',
        dryRun: false,
        permissionFlags: ['-A'],
        processRunner: new DenoProcess(),
      });

      assertEquals(first.status, 'applied');
      assertEquals(second.status, 'skipped');
      assertEquals(second.createdFiles, []);
      assertEquals(second.modifiedFiles, []);
      assertEquals(second.databaseMigrationsAdded, false);
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });
});

class FixturePluginValidator implements JsrPluginValidatorPort {
  constructor(private readonly provider: PluginKindProvider) {}

  validate(): Promise<JsrPluginValidationResult> {
    return Promise.resolve({
      ok: true,
      descriptor: {
        package: {
          requestedSpec: 'workers',
          source: 'bare-alias',
          scope: 'netscript',
          packageName: 'plugin-workers',
          packageSpecifier: '@netscript/plugin-workers',
          jsrSpecifier: 'jsr:@netscript/plugin-workers',
          alias: 'workers',
        },
        version: '0.0.1-alpha.12',
        manifest: {
          schemaVersion: 1,
          name: '@netscript/plugin-workers',
          version: '0.0.1-alpha.12',
          displayName: 'Background Worker',
          description: 'Workers plugin',
          peerDependencies: {},
          capabilities: {
            hasDatabaseMigrations: true,
            hasRoutes: true,
            hasBackgroundWorkers: true,
          },
          scaffolder: {
            export: './scaffold',
            requiredPermissions: { net: [], read: [], write: [] },
          },
          provider: {
            kind: this.provider.kind,
            displayName: this.provider.displayName,
            category: this.provider.category,
            portRangeKey: this.provider.portRangeKey,
            defaultPermissions: this.provider.defaultPermissions,
            watchFlag: this.provider.watchFlag,
            defaultEntrypoint: this.provider.defaultEntrypoint,
            defaultServiceEntrypoint: this.provider.defaultServiceEntrypoint ?? '',
            defaultRequiresDb: this.provider.defaultRequiresDb,
            defaultRequiresKv: this.provider.defaultRequiresKv,
            pluginType: this.provider.pluginType,
            supportsConcurrency: this.provider.supportsConcurrency,
            concurrencyEnvVar: this.provider.concurrencyEnvVar,
            defaultConcurrency: this.provider.defaultConcurrency,
            defaultTelemetry: this.provider.defaultTelemetry,
            infrastructureRequires: this.provider.infrastructureRequires,
            infrastructureOptionalDeps: this.provider.infrastructureOptionalDeps,
          },
        },
        packageMetadata: {
          latest: '0.0.1-alpha.12',
          isYanked: false,
        },
        versionMetadata: {
          exports: { '.': './mod.ts', './scaffold': './src/scaffold/mod.ts' },
          files: { '/scaffold.plugin.json': 'sha256-good' },
        },
        details: {
          description: 'Workers plugin',
          score: 95,
        },
      },
    });
  }
}

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

async function writeRealProjectFiles(projectRoot: string): Promise<void> {
  await Deno.writeTextFile(
    join(projectRoot, 'appsettings.json'),
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
  await Deno.writeTextFile(
    join(projectRoot, 'deno.json'),
    JSON.stringify({ workspace: ['apps/web'] }, null, 2) + '\n',
  );
}

async function assertFalseExists(path: string): Promise<void> {
  try {
    await Deno.stat(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return;
    }
    throw error;
  }
  throw new Error(`Expected ${path} not to exist.`);
}

function workersDescriptor(): ValidatedPluginDescriptor {
  return {
    package: {
      requestedSpec: 'workers',
      source: 'bare-alias',
      scope: 'netscript',
      packageName: 'plugin-workers',
      packageSpecifier: '@netscript/plugin-workers',
      jsrSpecifier: 'jsr:@netscript/plugin-workers',
      alias: 'workers',
    },
    version: '0.0.1-alpha.12',
    manifest: {
      schemaVersion: 1,
      name: '@netscript/plugin-workers',
      version: '0.0.1-alpha.12',
      displayName: 'Background Worker',
      description:
        'NetScript plugin for background job scheduling, task execution, and worker API endpoints.',
      peerDependencies: {
        '@netscript/plugin': '0.0.1-alpha.12',
      },
      capabilities: {
        hasDatabaseMigrations: true,
        hasRoutes: true,
        hasBackgroundWorkers: true,
      },
      scaffolder: {
        export: './scaffold',
        requiredPermissions: {
          net: [],
          read: ['<workspaceRoot>'],
          write: ['<workspaceRoot>'],
        },
      },
      provider: {
        kind: 'worker',
        displayName: 'Background Worker',
        category: 'background-processor',
        portRangeKey: 'INFRA_PLUGIN',
        defaultPermissions: [
          '--unstable-kv',
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
      },
    },
    packageMetadata: {
      latest: '0.0.1-alpha.12',
      isYanked: false,
    },
    versionMetadata: {
      exports: { '.': './mod.ts', './scaffold': './src/scaffold/mod.ts' },
      files: { '/scaffold.plugin.json': 'sha256-good' },
    },
    details: {
      description:
        'NetScript plugin for background job scheduling, task execution, and worker API endpoints.',
      score: 95,
    },
  };
}

function sagasDescriptor(): ValidatedPluginDescriptor {
  return {
    package: {
      requestedSpec: 'sagas',
      source: 'bare-alias',
      scope: 'netscript',
      packageName: 'plugin-sagas',
      packageSpecifier: '@netscript/plugin-sagas',
      jsrSpecifier: 'jsr:@netscript/plugin-sagas',
      alias: 'sagas',
    },
    version: '0.0.1-alpha.12',
    manifest: {
      schemaVersion: 1,
      name: '@netscript/plugin-sagas',
      version: '0.0.1-alpha.12',
      displayName: 'Saga Orchestrator',
      description:
        'NetScript plugin for durable saga orchestration, workflow APIs, and saga runtime metadata.',
      peerDependencies: {
        '@netscript/plugin': '0.0.1-alpha.12',
      },
      capabilities: {
        hasDatabaseMigrations: true,
        hasRoutes: true,
        hasBackgroundWorkers: true,
      },
      scaffolder: {
        export: './scaffold',
        requiredPermissions: {
          net: [],
          read: ['<workspaceRoot>'],
          write: ['<workspaceRoot>'],
        },
      },
      provider: {
        kind: sagaProvider.kind,
        displayName: sagaProvider.displayName,
        category: sagaProvider.category,
        portRangeKey: sagaProvider.portRangeKey,
        defaultPermissions: sagaProvider.defaultPermissions,
        watchFlag: sagaProvider.watchFlag,
        defaultEntrypoint: sagaProvider.defaultEntrypoint,
        defaultServiceEntrypoint: sagaProvider.defaultServiceEntrypoint ?? '',
        defaultRequiresDb: sagaProvider.defaultRequiresDb,
        defaultRequiresKv: sagaProvider.defaultRequiresKv,
        pluginType: sagaProvider.pluginType,
        supportsConcurrency: sagaProvider.supportsConcurrency,
        concurrencyEnvVar: sagaProvider.concurrencyEnvVar,
        defaultConcurrency: sagaProvider.defaultConcurrency,
        defaultTelemetry: sagaProvider.defaultTelemetry,
        infrastructureRequires: sagaProvider.infrastructureRequires,
        infrastructureOptionalDeps: sagaProvider.infrastructureOptionalDeps,
      },
    },
    packageMetadata: {
      latest: '0.0.1-alpha.12',
      isYanked: false,
    },
    versionMetadata: {
      exports: { '.': './mod.ts', './scaffold': './scaffold.ts' },
      files: { '/scaffold.plugin.json': 'sha256-good' },
    },
    details: {
      description:
        'NetScript plugin for durable saga orchestration, workflow APIs, and saga runtime metadata.',
      score: 95,
    },
  };
}

function triggersDescriptor(): ValidatedPluginDescriptor {
  return {
    package: {
      requestedSpec: 'triggers',
      source: 'bare-alias',
      scope: 'netscript',
      packageName: 'plugin-triggers',
      packageSpecifier: '@netscript/plugin-triggers',
      jsrSpecifier: 'jsr:@netscript/plugin-triggers',
      alias: 'triggers',
    },
    version: '0.0.1-alpha.12',
    manifest: {
      schemaVersion: 1,
      name: '@netscript/plugin-triggers',
      version: '0.0.1-alpha.12',
      displayName: 'Trigger Processor',
      description:
        'NetScript plugin for trigger ingress, scheduling, file watching, and trigger runtime APIs.',
      peerDependencies: {
        '@netscript/plugin': '0.0.1-alpha.12',
      },
      capabilities: {
        hasDatabaseMigrations: true,
        hasRoutes: true,
        hasBackgroundWorkers: true,
      },
      scaffolder: {
        export: './scaffold',
        requiredPermissions: {
          net: [],
          read: ['<workspaceRoot>'],
          write: ['<workspaceRoot>'],
        },
      },
      provider: {
        kind: triggerProvider.kind,
        displayName: triggerProvider.displayName,
        category: triggerProvider.category,
        portRangeKey: triggerProvider.portRangeKey,
        defaultPermissions: triggerProvider.defaultPermissions,
        watchFlag: triggerProvider.watchFlag,
        defaultEntrypoint: triggerProvider.defaultEntrypoint,
        defaultServiceEntrypoint: triggerProvider.defaultServiceEntrypoint ?? '',
        defaultRequiresDb: triggerProvider.defaultRequiresDb,
        defaultRequiresKv: triggerProvider.defaultRequiresKv,
        pluginType: triggerProvider.pluginType,
        supportsConcurrency: triggerProvider.supportsConcurrency,
        concurrencyEnvVar: triggerProvider.concurrencyEnvVar,
        defaultConcurrency: triggerProvider.defaultConcurrency,
        defaultTelemetry: triggerProvider.defaultTelemetry,
        infrastructureRequires: triggerProvider.infrastructureRequires,
        infrastructureOptionalDeps: triggerProvider.infrastructureOptionalDeps,
      },
    },
    packageMetadata: {
      latest: '0.0.1-alpha.12',
      isYanked: false,
    },
    versionMetadata: {
      exports: { '.': './mod.ts', './scaffold': './scaffold.ts' },
      files: { '/scaffold.plugin.json': 'sha256-good' },
    },
    details: {
      description:
        'NetScript plugin for trigger ingress, scheduling, file watching, and trigger runtime APIs.',
      score: 95,
    },
  };
}

function streamsDescriptor(): ValidatedPluginDescriptor {
  return {
    package: {
      requestedSpec: 'streams',
      source: 'bare-alias',
      scope: 'netscript',
      packageName: 'plugin-streams',
      packageSpecifier: '@netscript/plugin-streams',
      jsrSpecifier: 'jsr:@netscript/plugin-streams',
      alias: 'streams',
    },
    version: '0.0.1-alpha.12',
    manifest: {
      schemaVersion: 1,
      name: '@netscript/plugin-streams',
      version: '0.0.1-alpha.12',
      displayName: 'Durable Streams',
      description:
        'Durable Streams service, CLI, Aspire, E2E, and scaffolding plugin for NetScript.',
      peerDependencies: {
        '@netscript/plugin': '0.0.1-alpha.12',
      },
      capabilities: {
        hasDatabaseMigrations: false,
        hasRoutes: true,
        hasBackgroundWorkers: false,
      },
      scaffolder: {
        export: './scaffold',
        requiredPermissions: {
          net: [],
          read: ['<workspaceRoot>'],
          write: ['<workspaceRoot>'],
        },
      },
      provider: {
        kind: streamsProvider.kind,
        displayName: streamsProvider.displayName,
        category: streamsProvider.category,
        portRangeKey: streamsProvider.portRangeKey,
        defaultPermissions: streamsProvider.defaultPermissions,
        watchFlag: streamsProvider.watchFlag,
        defaultEntrypoint: streamsProvider.defaultEntrypoint,
        defaultServiceEntrypoint: streamsProvider.defaultServiceEntrypoint ?? '',
        defaultRequiresDb: streamsProvider.defaultRequiresDb,
        defaultRequiresKv: streamsProvider.defaultRequiresKv,
        pluginType: streamsProvider.pluginType,
        supportsConcurrency: streamsProvider.supportsConcurrency,
        concurrencyEnvVar: streamsProvider.concurrencyEnvVar,
        defaultConcurrency: streamsProvider.defaultConcurrency,
        defaultTelemetry: streamsProvider.defaultTelemetry,
        infrastructureRequires: streamsProvider.infrastructureRequires,
        infrastructureOptionalDeps: streamsProvider.infrastructureOptionalDeps,
      },
    },
    packageMetadata: {
      latest: '0.0.1-alpha.12',
      isYanked: false,
    },
    versionMetadata: {
      exports: { '.': './mod.ts', './scaffold': './scaffold.ts' },
      files: { '/scaffold.plugin.json': 'sha256-good' },
    },
    details: {
      description:
        'Durable Streams service, CLI, Aspire, E2E, and scaffolding plugin for NetScript.',
      score: 95,
    },
  };
}
