import type { PluginScaffoldManifestSpec } from '@netscript/plugin/scaffold';

/** Default sagas service and background port used by scaffold metadata. */
export const SAGAS_SERVICE_PORT: number = 8092;

/** Static scaffold manifest data for the sagas plugin. */
export const sagasScaffoldSpec: PluginScaffoldManifestSpec = {
  name: '@netscript/plugin-sagas',
  displayName: 'Saga Orchestrator',
  description:
    'NetScript plugin for durable saga orchestration, workflow APIs, and saga runtime metadata.',
  capabilities: {
    hasDatabaseMigrations: true,
    hasRoutes: true,
    hasBackgroundWorkers: true,
  },
  provider: {
    kind: 'saga',
    displayName: 'Saga Orchestrator',
    category: 'background-processor',
    portRangeKey: 'INFRA_PLUGIN',
    defaultPermissions: ['--unstable-kv', '--allow-all'],
    watchFlag: '--watch',
    defaultEntrypoint: 'bin/combined.ts',
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
  },
  officialSource: {
    canonicalName: 'sagas',
    pluginDir: 'sagas',
    backgroundDir: 'sagas',
    serviceEntrypoint: 'services/src/main.ts',
    backgroundEntrypoint: 'bin/combined.ts',
    serviceConfigKey: 'sagas-api',
    servicePort: SAGAS_SERVICE_PORT,
    backgroundPort: SAGAS_SERVICE_PORT,
    dependencies: ['streams'],
    requiresDb: true,
    requiresKv: true,
    permissions: ['--unstable-kv', '--allow-all'],
    pluginReferences: ['workers-api'],
  },
};
