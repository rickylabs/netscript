import type { PluginScaffoldManifestSpec } from '@netscript/plugin/scaffold';

/** Default triggers service and background port used by scaffold metadata. */
export const TRIGGERS_SERVICE_PORT: number = 8093;

/** Static scaffold manifest data for the triggers plugin. */
export const triggersScaffoldSpec: PluginScaffoldManifestSpec = {
  name: '@netscript/plugin-triggers',
  displayName: 'Trigger Processor',
  description:
    'NetScript plugin for trigger ingress, scheduling, file watching, and trigger runtime APIs.',
  capabilities: {
    hasDatabaseMigrations: true,
    hasRoutes: true,
    hasBackgroundWorkers: true,
  },
  provider: {
    kind: 'trigger',
    displayName: 'Trigger Processor',
    category: 'background-processor',
    portRangeKey: 'INFRA_PLUGIN',
    defaultPermissions: ['--unstable-kv', '--allow-all'],
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
  },
  officialSource: {
    canonicalName: 'triggers',
    pluginDir: 'triggers',
    backgroundDir: 'triggers',
    serviceEntrypoint: 'services/src/main.ts',
    backgroundEntrypoint: 'src/runtime/trigger-processor.ts',
    serviceConfigKey: 'triggers-api',
    servicePort: TRIGGERS_SERVICE_PORT,
    backgroundPort: TRIGGERS_SERVICE_PORT,
    dependencies: ['streams'],
    pluginReferences: ['workers-api'],
  },
};
