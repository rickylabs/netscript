import type { PluginScaffoldManifestSpec } from '@netscript/plugin/scaffold';

/** Default workers service and background port used by scaffold metadata. */
export const WORKER_SERVICE_PORT: number = 8091;

/** Static scaffold manifest data for the workers plugin. */
export const workersScaffoldSpec: PluginScaffoldManifestSpec = {
  name: '@netscript/plugin-workers',
  displayName: 'Background Worker',
  description:
    'NetScript plugin for background job scheduling, task execution, and worker API endpoints.',
  capabilities: {
    hasDatabaseMigrations: true,
    hasRoutes: true,
    hasBackgroundWorkers: true,
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
  officialSource: {
    canonicalName: 'workers',
    pluginDir: 'workers',
    backgroundDir: 'workers',
    serviceEntrypoint: 'services/src/main.ts',
    backgroundEntrypoint: 'bin/combined.ts',
    serviceConfigKey: 'workers-api',
    servicePort: WORKER_SERVICE_PORT,
    backgroundPort: WORKER_SERVICE_PORT,
    dependencies: ['streams'],
    requiresDb: true,
    requiresKv: true,
    permissions: [
      '--unstable-kv',
      '--allow-net',
      '--allow-env',
      '--allow-read',
      '--allow-write',
      '--allow-run',
    ],
    pluginReferences: [],
  },
};
