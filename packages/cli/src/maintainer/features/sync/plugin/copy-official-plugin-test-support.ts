import { dirname, join } from '@std/path';
import { registryGeneratorFixture } from '../../../../kernel/assets/registry-generator-fixture.ts';

export async function writeSourceFile(
  root: string,
  relativePath: string,
  content: string,
): Promise<void> {
  const path = join(root, ...relativePath.split('/'));
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, content);
}

export async function writeMinimalOfficialSource(sourceRoot: string): Promise<void> {
  await writeSourceFile(sourceRoot, 'packages/cli/bin/netscript.ts', 'export {};\n');
  await writeSourceFile(sourceRoot, 'plugins/workers/mod.ts', 'export default {};\n');
  await writeSourceFile(sourceRoot, 'plugins/workers/deno.json', JSON.stringify({ imports: {} }));
  await writeOfficialPluginManifests(sourceRoot);
  await writeOfficialPluginRuntimeManifests(sourceRoot);
  await writeSourceFile(
    sourceRoot,
    'plugins/workers/jobs/health-check.ts',
    "export default { id: 'workers-plugin-health-check' };\n",
  );
  await writeSourceFile(sourceRoot, 'plugins/sagas/mod.ts', 'export default {};\n');
  await writeSourceFile(sourceRoot, 'plugins/sagas/deno.json', JSON.stringify({ imports: {} }));
  await writeSourceFile(sourceRoot, 'plugins/triggers/mod.ts', 'export default {};\n');
  await writeSourceFile(sourceRoot, 'plugins/triggers/deno.json', JSON.stringify({ imports: {} }));
  await writeSourceFile(sourceRoot, 'plugins/streams/mod.ts', 'export default {};\n');
  await writeSourceFile(sourceRoot, 'plugins/streams/deno.json', JSON.stringify({ imports: {} }));
  await writeSourceFile(sourceRoot, 'workers/deno.json', JSON.stringify({ imports: {} }));
  await writeSourceFile(sourceRoot, 'workers/mod.ts', 'export {};\n');
  await writeSourceFile(
    sourceRoot,
    'workers/jobs/health-check.ts',
    "export default { id: 'health-check' };\n",
  );
  await writeSourceFile(
    sourceRoot,
    'workers/jobs/process-webhook-payload.ts',
    "export default { id: 'process-webhook-payload' };\n",
  );
  await writeSourceFile(
    sourceRoot,
    'workers/jobs/send-welcome-email.ts',
    "export default { id: 'send-welcome-email' };\n",
  );
  await writeSourceFile(sourceRoot, 'workers/tasks/validate-data.ts', 'export {};\n');
  await writeSourceFile(sourceRoot, 'workers/tasks/system-diagnostics.ps1', '# noop\n');
  await writeSourceFile(sourceRoot, 'sagas/deno.json', JSON.stringify({ imports: {} }));
  await writeSourceFile(
    sourceRoot,
    'sagas/user-registration-saga.ts',
    'export default { definition: { name: "UserRegistrationSaga" } };\n',
  );
  await writeSourceFile(sourceRoot, 'triggers/deno.json', JSON.stringify({ imports: {} }));
  await writeSourceFile(
    sourceRoot,
    'plugins/triggers/src/runtime/trigger-processor.ts',
    'export {};\n',
  );
  await writeSourceFile(
    sourceRoot,
    'triggers/generic-webhook.ts',
    "export default { id: 'generic-inbound-webhook' };\n",
  );
  await writeSourceFile(
    sourceRoot,
    'triggers/webhook-validate-data.ts',
    "export default { id: 'webhook-validate-data' };\n",
  );
  await writeSourceFile(
    sourceRoot,
    'triggers/file-watcher-diagnostics.ts',
    "export default { id: 'file-watcher-diagnostics' };\n",
  );
}

export async function writeOfficialPluginManifests(sourceRoot: string): Promise<void> {
  await writeSourceFile(
    sourceRoot,
    'plugins/streams/scaffold.plugin.json',
    JSON.stringify({
      provider: {
        kind: 'stream',
        displayName: 'Durable Streams',
        category: 'plugin',
        portRangeKey: 'PLUGIN_API',
        defaultPermissions: ['--allow-net'],
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
      },
      officialSource: {
        canonicalName: 'streams',
        pluginDir: 'streams',
        serviceEntrypoint: 'services/src/main.ts',
        serviceConfigKey: 'streams',
        servicePort: 4437,
        backgroundPort: 4437,
        permissions: ['--allow-net'],
      },
    }),
  );
  await writePluginManifest(sourceRoot, 'workers', {
    kind: 'worker',
    displayName: 'Background Worker',
    concurrencyEnvVar: 'WORKER_CONCURRENCY',
    defaultConcurrency: 2,
    serviceConfigKey: 'workers-api',
    servicePort: 8091,
    dependencies: ['streams'],
    pluginReferences: [],
  });
  await writePluginManifest(sourceRoot, 'sagas', {
    kind: 'saga',
    displayName: 'Saga Orchestrator',
    concurrencyEnvVar: 'SAGA_CONCURRENCY',
    defaultConcurrency: 2,
    serviceConfigKey: 'sagas-api',
    servicePort: 8092,
    dependencies: ['streams'],
    pluginReferences: ['workers-api'],
  });
  await writePluginManifest(sourceRoot, 'triggers', {
    kind: 'trigger',
    displayName: 'Trigger Processor',
    concurrencyEnvVar: 'TRIGGER_CONCURRENCY',
    defaultConcurrency: 10,
    defaultEntrypoint: 'src/runtime/trigger-processor.ts',
    backgroundEntrypoint: 'src/runtime/trigger-processor.ts',
    serviceConfigKey: 'triggers-api',
    servicePort: 8093,
    dependencies: ['streams'],
    pluginReferences: ['workers-api'],
  });
}

interface PluginManifestFixture {
  readonly kind: string;
  readonly displayName: string;
  readonly concurrencyEnvVar: string;
  readonly defaultConcurrency: number;
  readonly defaultEntrypoint?: string;
  readonly backgroundEntrypoint?: string;
  readonly serviceConfigKey: string;
  readonly servicePort: number;
  readonly dependencies: readonly string[];
  readonly pluginReferences: readonly string[];
}

async function writePluginManifest(
  sourceRoot: string,
  pluginDir: string,
  fixture: PluginManifestFixture,
): Promise<void> {
  await writeSourceFile(
    sourceRoot,
    `plugins/${pluginDir}/scaffold.plugin.json`,
    JSON.stringify({
      provider: {
        kind: fixture.kind,
        displayName: fixture.displayName,
        category: 'background-processor',
        portRangeKey: 'INFRA_PLUGIN',
        defaultPermissions: ['--allow-all'],
        watchFlag: '--watch',
        defaultEntrypoint: fixture.defaultEntrypoint ?? 'bin/combined.ts',
        defaultServiceEntrypoint: 'services/src/main.ts',
        defaultRequiresDb: true,
        defaultRequiresKv: true,
        pluginType: 'background-processor',
        supportsConcurrency: true,
        concurrencyEnvVar: fixture.concurrencyEnvVar,
        defaultConcurrency: fixture.defaultConcurrency,
        defaultTelemetry: true,
        infrastructureRequires: ['kv'],
        infrastructureOptionalDeps: ['db'],
      },
      officialSource: {
        canonicalName: pluginDir,
        pluginDir,
        backgroundDir: pluginDir,
        serviceEntrypoint: 'services/src/main.ts',
        backgroundEntrypoint: fixture.backgroundEntrypoint ?? 'bin/combined.ts',
        serviceConfigKey: fixture.serviceConfigKey,
        servicePort: fixture.servicePort,
        backgroundPort: fixture.servicePort,
        dependencies: fixture.dependencies,
        pluginReferences: fixture.pluginReferences,
      },
    }),
  );
}

export async function writeOfficialPluginRuntimeManifests(sourceRoot: string): Promise<void> {
  await writeSourceFile(
    sourceRoot,
    'plugins/workers/scaffold.runtime.json',
    JSON.stringify({
      runtimeRegistryGenerator: {
        command: 'src/cli/generate-runtime-registries.ts',
        args: ['--profile', 'scaffold'],
      },
      backgroundSampleRules: [
        {
          workspace: 'workers',
          managed: [{ prefix: 'jobs/' }, { prefix: 'tasks/' }],
          keep: [
            'jobs/job-tools.ts',
            'jobs/example-job.ts',
            'jobs/health-check.ts',
            'jobs/process-webhook-payload.ts',
            'jobs/send-welcome-email.ts',
            'tasks/system-diagnostics.ps1',
            'tasks/validate-data.ts',
          ],
        },
      ],
    }),
  );
  await writeSourceFile(
    sourceRoot,
    'plugins/workers/src/cli/generate-runtime-registries.ts',
    registryGeneratorFixture(),
  );
  await writeSourceFile(
    sourceRoot,
    'plugins/sagas/scaffold.runtime.json',
    JSON.stringify({
      backgroundSampleRules: [
        {
          workspace: 'sagas',
          managed: [{ suffix: '-saga.ts' }],
          keep: ['user-registration-saga.ts'],
        },
      ],
    }),
  );
  await writeSourceFile(
    sourceRoot,
    'plugins/triggers/scaffold.runtime.json',
    JSON.stringify({
      backgroundSampleRules: [
        {
          workspace: 'triggers',
          managed: [{ suffix: '.ts', without: '/' }],
          keep: [
            'mod.ts',
            'file-watcher-diagnostics.ts',
            'generic-webhook.ts',
            'webhook-validate-data.ts',
          ],
          runtimeDirectories: ['.data/incoming/diagnostics'],
        },
      ],
    }),
  );
}

export async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}
