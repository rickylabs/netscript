import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals, assertFalse, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1';
import { dirname, fromFileUrl, join, resolve } from '@std/path';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';

import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { DenoProcess } from '../../../../kernel/adapters/runtime/process/deno-process.ts';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { Scaffolder } from '../../../../kernel/adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../../../kernel/adapters/scaffold/template-adapter.ts';
import { PluginKindRegistry } from '../../../../kernel/application/registries/plugin-kind-registry.ts';
import { PluginRegistryScaffolder } from '../../../../kernel/adapters/plugin/registry-scaffolder.ts';
import { PluginWorkspaceMutator } from '../../../../kernel/adapters/plugin/workspace-mutator.ts';
import type { PluginKindProvider } from '../../../../kernel/domain/plugin-kind.ts';
import { netscriptJsrSpecifier } from '../../../../kernel/constants/jsr-specifiers.ts';
import { installPlugin } from './install-plugin.ts';
import type {
  JsrPluginValidationResult,
  JsrPluginValidatorPort,
  ValidatedPluginDescriptor,
} from './jsr-plugin-validator-port.ts';
import { planPluginInstall } from './plan-plugin-install.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../kernel/application/registries/template-registry.ts';
import { dispatchPluginScaffold } from '../dispatch/dispatch-plugin-verb.ts';

// This flow renders plugin/workspace files via sync template generators, which
// require a previously-awaited registry hydration. The test drives the flow
// directly (outside the CLI dispatch path), so hydrate at module load.
await DEFAULT_TEMPLATE_REGISTRY.hydrate();

const REPO_ROOT = resolve(dirname(fromFileUrl(import.meta.url)), '../../../../../../..');

function repoPath(path: string): string {
  return join(REPO_ROOT, path);
}

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

const authProvider: PluginKindProvider = {
  kind: 'auth',
  displayName: 'Auth',
  category: 'plugin',
  portRangeKey: 'PLUGIN_API',
  defaultPermissions: ['--unstable-kv', '--allow-net', '--allow-env', '--allow-read'],
  watchFlag: '--watch',
  defaultEntrypoint: 'services/src/main.ts',
  defaultServiceEntrypoint: 'services/src/main.ts',
  defaultRequiresDb: true,
  defaultRequiresKv: true,
  pluginType: 'utility',
  supportsConcurrency: false,
  concurrencyEnvVar: null,
  defaultConcurrency: null,
  defaultTelemetry: true,
  infrastructureRequires: ['db', 'kv'],
  infrastructureOptionalDeps: [],
};

describe('public install plugin flow', () => {
  it('plans a starter plugin request from project metadata', async () => {
    const fs = new MemoryFileSystemAdapter();
    await writeProjectFiles(fs);

    const plan = await planPluginInstall({
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

  it('rejects an unresolvable plugin (no JSR/local descriptor) instead of CLI-side rendering', async () => {
    const fs = new MemoryFileSystemAdapter();
    await writeProjectFiles(fs);
    const templateAdapter = new StringTemplateAdapter(fs);
    const scaffolder = new Scaffolder(templateAdapter, fs);
    const registry = new PluginKindRegistry();

    // `kind: 'api'` does not resolve to a JSR package and no validator/processRunner
    // is supplied, so the plugin-owned scaffold path cannot run. The command must
    // throw a typed error rather than silently fall back to CLI-side rendering.
    const error = await assertRejects(
      () =>
        installPlugin({
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
          registryScaffolder: new PluginRegistryScaffolder(scaffolder),
          workspaceMutator: new PluginWorkspaceMutator(fs),
          regenerateHelpers: () => Promise.resolve(['/workspace/alpha/aspire/apphost.mts']),
        }),
      ScaffoldValidationError,
    );
    assertStringIncludes(error.message, 'process runner');
    assertFalse(await fs.exists('/workspace/alpha/plugins/payments/deno.json'));
  });

  it('rejects a resolvable plugin when no process runner can dispatch its scaffolder', async () => {
    const fs = new MemoryFileSystemAdapter();
    await writeProjectFiles(fs);
    const templateAdapter = new StringTemplateAdapter(fs);
    const scaffolder = new Scaffolder(templateAdapter, fs);
    const registry = new PluginKindRegistry();

    // The validator resolves a descriptor, but without a processRunner the
    // plugin-owned scaffolder cannot be dispatched, so the command must throw.
    const error = await assertRejects(
      () =>
        installPlugin({
          kind: 'workers',
          pluginName: 'workers',
          serviceReferences: [],
          pluginReferences: [],
          noDb: true,
          includeSamples: false,
          skipConfirmation: true,
          projectRoot: '/workspace/alpha',
          overwrite: false,
        }, {
          fs,
          scaffolder,
          templateAdapter,
          registry,
          registryScaffolder: new PluginRegistryScaffolder(scaffolder),
          workspaceMutator: new PluginWorkspaceMutator(fs),
          pluginValidator: new FixturePluginValidator(workerProvider),
          regenerateHelpers: () => Promise.resolve(['/workspace/alpha/aspire/apphost.mts']),
        }),
      ScaffoldValidationError,
    );
    assertStringIncludes(error.message, 'process runner');
    assertFalse(await fs.exists('/workspace/alpha/plugins/workers/mod.ts'));
  });

  it('previews a local-path plugin-owned scaffolder without writing files', async () => {
    const projectRoot = await Deno.makeTempDir();
    const fixtureRoot = repoPath('packages/cli/tests/fixtures/plugin-scaffolder');
    try {
      await writeRealProjectFiles(projectRoot);
      const fs = new DenoFileSystem();
      const templateAdapter = new StringTemplateAdapter(fs);
      const scaffolder = new Scaffolder(templateAdapter, fs);
      const registry = new PluginKindRegistry();

      const result = await installPlugin({
        kind: 'fixture',
        pluginName: 'fixture',
        serviceReferences: [],
        pluginReferences: [],
        noDb: true,
        includeSamples: false,
        dryRun: true,
        skipConfirmation: true,
        localPath: fixtureRoot,
        projectRoot,
        overwrite: false,
      }, {
        fs,
        scaffolder,
        templateAdapter,
        registry,
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
    const workersRoot = repoPath('plugins/workers');
    try {
      await writeRealProjectFiles(projectRoot);
      const fs = new DenoFileSystem();
      const templateAdapter = new StringTemplateAdapter(fs);
      const scaffolder = new Scaffolder(templateAdapter, fs);
      const registry = new PluginKindRegistry();

      const result = await installPlugin({
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
        registryScaffolder: new PluginRegistryScaffolder(scaffolder),
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: new DenoProcess(),
        regenerateHelpers: () => Promise.resolve([]),
      });

      assertEquals(result.pluginOwnedScaffold?.status, 'applied');
      assertEquals(result.pluginOwnedScaffold?.databaseMigrationsAdded, false);
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'workers/jobs/health-check.ts',
      );
      assertStringIncludes(
        await Deno.readTextFile(join(projectRoot, 'workers/mod.ts')),
        'export { healthCheckJob }',
      );
      assertStringIncludes(
        await Deno.readTextFile(join(projectRoot, 'workers/runtime.ts')),
        "@netscript/plugin-workers/runtime",
      );
      assertStringIncludes(
        await Deno.readTextFile(join(projectRoot, 'appsettings.json')),
        `"Entrypoint": "${netscriptJsrSpecifier('plugin-workers', '/services')}"`,
      );
      assertStringIncludes(
        await Deno.readTextFile(join(projectRoot, 'appsettings.json')),
        '"Entrypoint": "workers/runtime.ts"',
      );
      assertStringIncludes(
        await Deno.readTextFile(join(projectRoot, 'appsettings.json')),
        '"Workdir": "."',
      );
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('previews the real workers local-path scaffolder without writing files', async () => {
    const projectRoot = await Deno.makeTempDir();
    const workersRoot = repoPath('plugins/workers');
    try {
      await writeRealProjectFiles(projectRoot);
      const fs = new DenoFileSystem();
      const templateAdapter = new StringTemplateAdapter(fs);
      const scaffolder = new Scaffolder(templateAdapter, fs);
      const registry = new PluginKindRegistry();

      const result = await installPlugin({
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
        registryScaffolder: new PluginRegistryScaffolder(scaffolder),
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: new DenoProcess(),
        regenerateHelpers: () => Promise.resolve([]),
      });

      assertEquals(result.pluginOwnedScaffold?.status, 'planned');
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'workers/mod.ts',
      );
      await assertFalseExists(join(projectRoot, 'workers/mod.ts'));
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('reruns the real workers scaffolder idempotently', async () => {
    const projectRoot = await Deno.makeTempDir();
    const workersRoot = repoPath('plugins/workers');
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

  it('runs the real sagas local-path scaffolder through plugin install', async () => {
    const projectRoot = await Deno.makeTempDir();
    const sagasRoot = repoPath('plugins/sagas');
    try {
      await writeRealProjectFiles(projectRoot);
      const fs = new DenoFileSystem();
      const templateAdapter = new StringTemplateAdapter(fs);
      const scaffolder = new Scaffolder(templateAdapter, fs);
      const registry = new PluginKindRegistry();

      const result = await installPlugin({
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
        registryScaffolder: new PluginRegistryScaffolder(scaffolder),
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: new DenoProcess(),
        regenerateHelpers: () => Promise.resolve([]),
      });

      assertEquals(result.pluginOwnedScaffold?.status, 'applied');
      assertEquals(result.pluginOwnedScaffold?.databaseMigrationsAdded, false);
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'sagas/user-registration-saga.ts',
      );
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'sagas/mod.ts',
      );
      assertStringIncludes(
        await Deno.readTextFile(join(projectRoot, 'sagas/mod.ts')),
        'UserRegistrationSaga',
      );
      assertStringIncludes(
        await Deno.readTextFile(join(projectRoot, 'sagas/runtime.ts')),
        "@netscript/plugin-sagas/runtime",
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
    const sagasRoot = repoPath('plugins/sagas');
    try {
      await writeRealProjectFiles(projectRoot);
      const fs = new DenoFileSystem();
      const templateAdapter = new StringTemplateAdapter(fs);
      const scaffolder = new Scaffolder(templateAdapter, fs);
      const registry = new PluginKindRegistry();

      const result = await installPlugin({
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
        registryScaffolder: new PluginRegistryScaffolder(scaffolder),
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: new DenoProcess(),
        regenerateHelpers: () => Promise.resolve([]),
      });

      assertEquals(result.pluginOwnedScaffold?.status, 'planned');
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'sagas/mod.ts',
      );
      await assertFalseExists(join(projectRoot, 'sagas/mod.ts'));
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('reruns the real sagas scaffolder idempotently', async () => {
    const projectRoot = await Deno.makeTempDir();
    const sagasRoot = repoPath('plugins/sagas');
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

  it('runs the real triggers local-path scaffolder through plugin install', async () => {
    const projectRoot = await Deno.makeTempDir();
    const triggersRoot = repoPath('plugins/triggers');
    try {
      await writeRealProjectFiles(projectRoot);
      const fs = new DenoFileSystem();
      const templateAdapter = new StringTemplateAdapter(fs);
      const scaffolder = new Scaffolder(templateAdapter, fs);
      const registry = new PluginKindRegistry();

      const result = await installPlugin({
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
        registryScaffolder: new PluginRegistryScaffolder(scaffolder),
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: new DenoProcess(),
        regenerateHelpers: () => Promise.resolve([]),
      });

      assertEquals(result.pluginOwnedScaffold?.status, 'applied');
      assertEquals(result.pluginOwnedScaffold?.databaseMigrationsAdded, false);
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'triggers/generic-inbound-webhook.ts',
      );
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'triggers/mod.ts',
      );
      assertStringIncludes(
        await Deno.readTextFile(join(projectRoot, 'triggers/mod.ts')),
        'genericInboundWebhookTrigger',
      );
      assertStringIncludes(
        await Deno.readTextFile(
          join(projectRoot, 'triggers/daily-maintenance.ts'),
        ),
        'defineScheduledTrigger',
      );
      assertStringIncludes(
        await Deno.readTextFile(join(projectRoot, 'triggers/runtime.ts')),
        "@netscript/plugin-triggers/runtime",
      );
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('previews the real triggers local-path scaffolder without writing files', async () => {
    const projectRoot = await Deno.makeTempDir();
    const triggersRoot = repoPath('plugins/triggers');
    try {
      await writeRealProjectFiles(projectRoot);
      const fs = new DenoFileSystem();
      const templateAdapter = new StringTemplateAdapter(fs);
      const scaffolder = new Scaffolder(templateAdapter, fs);
      const registry = new PluginKindRegistry();

      const result = await installPlugin({
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
        registryScaffolder: new PluginRegistryScaffolder(scaffolder),
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: new DenoProcess(),
        regenerateHelpers: () => Promise.resolve([]),
      });

      assertEquals(result.pluginOwnedScaffold?.status, 'planned');
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'triggers/mod.ts',
      );
      await assertFalseExists(join(projectRoot, 'triggers/mod.ts'));
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('reruns the real triggers scaffolder idempotently', async () => {
    const projectRoot = await Deno.makeTempDir();
    const triggersRoot = repoPath('plugins/triggers');
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

  it('runs the real streams local-path scaffolder through plugin install', async () => {
    const projectRoot = await Deno.makeTempDir();
    const streamsRoot = repoPath('plugins/streams');
    try {
      await writeRealProjectFiles(projectRoot);
      const fs = new DenoFileSystem();
      const templateAdapter = new StringTemplateAdapter(fs);
      const scaffolder = new Scaffolder(templateAdapter, fs);
      const registry = new PluginKindRegistry();

      const result = await installPlugin({
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
        registryScaffolder: new PluginRegistryScaffolder(scaffolder),
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: new DenoProcess(),
        regenerateHelpers: () => Promise.resolve([]),
      });

      assertEquals(result.pluginOwnedScaffold?.status, 'applied');
      assertEquals(result.pluginOwnedScaffold?.databaseMigrationsAdded, false);
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'streams/notifications-stream.ts',
      );
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'streams/mod.ts',
      );
      assertStringIncludes(
        await Deno.readTextFile(join(projectRoot, 'streams/mod.ts')),
        'notificationsStream',
      );
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('previews the real streams local-path scaffolder without writing files', async () => {
    const projectRoot = await Deno.makeTempDir();
    const streamsRoot = repoPath('plugins/streams');
    try {
      await writeRealProjectFiles(projectRoot);
      const fs = new DenoFileSystem();
      const templateAdapter = new StringTemplateAdapter(fs);
      const scaffolder = new Scaffolder(templateAdapter, fs);
      const registry = new PluginKindRegistry();

      const result = await installPlugin({
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
        registryScaffolder: new PluginRegistryScaffolder(scaffolder),
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: new DenoProcess(),
        regenerateHelpers: () => Promise.resolve([]),
      });

      assertEquals(result.pluginOwnedScaffold?.status, 'planned');
      assertEquals(result.pluginOwnedScaffold?.databaseMigrationsAdded, false);
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'streams/mod.ts',
      );
      await assertFalseExists(join(projectRoot, 'streams/mod.ts'));
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('reruns the real streams scaffolder idempotently', async () => {
    const projectRoot = await Deno.makeTempDir();
    const streamsRoot = repoPath('plugins/streams');
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

  it('runs the real auth local-path scaffolder through plugin install', async () => {
    const projectRoot = await Deno.makeTempDir();
    const authRoot = repoPath('plugins/auth');
    try {
      await writeRealProjectFiles(projectRoot);
      const fs = new DenoFileSystem();
      const templateAdapter = new StringTemplateAdapter(fs);
      const scaffolder = new Scaffolder(templateAdapter, fs);
      const registry = new PluginKindRegistry();

      const result = await installPlugin({
        kind: 'auth',
        pluginName: 'auth',
        serviceReferences: [],
        pluginReferences: ['streams'],
        noDb: false,
        includeSamples: true,
        localPath: authRoot,
        projectRoot,
        overwrite: false,
      }, {
        fs,
        scaffolder,
        templateAdapter,
        registry,
        registryScaffolder: new PluginRegistryScaffolder(scaffolder),
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: new DenoProcess(),
        regenerateHelpers: () => Promise.resolve([]),
      });

      assertEquals(result.pluginOwnedScaffold?.status, 'applied');
      assertEquals(result.pluginOwnedScaffold?.databaseMigrationsAdded, false);
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'auth/mod.ts',
      );
      assertStringIncludes(
        await Deno.readTextFile(join(projectRoot, 'auth/mod.ts')),
        'AuthSessionResponseSchema',
      );
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('previews the real auth local-path scaffolder without writing files', async () => {
    const projectRoot = await Deno.makeTempDir();
    const authRoot = repoPath('plugins/auth');
    try {
      await writeRealProjectFiles(projectRoot);
      const fs = new DenoFileSystem();
      const templateAdapter = new StringTemplateAdapter(fs);
      const scaffolder = new Scaffolder(templateAdapter, fs);
      const registry = new PluginKindRegistry();

      const result = await installPlugin({
        kind: 'auth',
        pluginName: 'auth',
        serviceReferences: [],
        pluginReferences: ['streams'],
        noDb: false,
        includeSamples: true,
        dryRun: true,
        localPath: authRoot,
        projectRoot,
        overwrite: false,
      }, {
        fs,
        scaffolder,
        templateAdapter,
        registry,
        registryScaffolder: new PluginRegistryScaffolder(scaffolder),
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: new DenoProcess(),
        regenerateHelpers: () => Promise.resolve([]),
      });

      assertEquals(result.pluginOwnedScaffold?.status, 'planned');
      assertEquals(result.pluginOwnedScaffold?.databaseMigrationsAdded, false);
      assertStringIncludes(
        result.pluginOwnedScaffold?.createdFiles.join('\n') ?? '',
        'auth/mod.ts',
      );
      await assertFalseExists(join(projectRoot, 'auth/mod.ts'));
    } finally {
      await Deno.remove(projectRoot, { recursive: true });
    }
  });

  it('reruns the real auth scaffolder idempotently', async () => {
    const projectRoot = await Deno.makeTempDir();
    const authRoot = repoPath('plugins/auth');
    const descriptor = authDescriptor();
    try {
      await writeRealProjectFiles(projectRoot);

      const first = await dispatchPluginScaffold({
        descriptor,
        source: { kind: 'local-path', path: authRoot },
        projectRoot,
        pluginName: 'auth',
        dryRun: false,
        permissionFlags: ['-A'],
        processRunner: new DenoProcess(),
      });
      const second = await dispatchPluginScaffold({
        descriptor,
        source: { kind: 'local-path', path: authRoot },
        projectRoot,
        pluginName: 'auth',
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

function authDescriptor(): ValidatedPluginDescriptor {
  return {
    package: {
      requestedSpec: 'auth',
      source: 'bare-alias',
      scope: 'netscript',
      packageName: 'plugin-auth',
      packageSpecifier: '@netscript/plugin-auth',
      jsrSpecifier: 'jsr:@netscript/plugin-auth',
      alias: 'auth',
    },
    version: '0.0.1-alpha.12',
    manifest: {
      schemaVersion: 1,
      name: '@netscript/plugin-auth',
      version: '0.0.1-alpha.12',
      displayName: 'Auth',
      description:
        'NetScript plugin for a unified auth API, auth database schema, and auth session streams.',
      peerDependencies: {
        '@netscript/plugin': '0.0.1-alpha.12',
      },
      capabilities: {
        hasDatabaseMigrations: true,
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
        kind: authProvider.kind,
        displayName: authProvider.displayName,
        category: authProvider.category,
        portRangeKey: authProvider.portRangeKey,
        defaultPermissions: authProvider.defaultPermissions,
        watchFlag: authProvider.watchFlag,
        defaultEntrypoint: authProvider.defaultEntrypoint,
        defaultServiceEntrypoint: authProvider.defaultServiceEntrypoint ?? '',
        defaultRequiresDb: authProvider.defaultRequiresDb,
        defaultRequiresKv: authProvider.defaultRequiresKv,
        pluginType: authProvider.pluginType,
        supportsConcurrency: authProvider.supportsConcurrency,
        concurrencyEnvVar: authProvider.concurrencyEnvVar,
        defaultConcurrency: authProvider.defaultConcurrency,
        defaultTelemetry: authProvider.defaultTelemetry,
        infrastructureRequires: authProvider.infrastructureRequires,
        infrastructureOptionalDeps: authProvider.infrastructureOptionalDeps,
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
        'NetScript plugin for a unified auth API, auth database schema, and auth session streams.',
      score: 95,
    },
  };
}
