/**
 * Static data for the thin triggers plugin scaffolder.
 *
 * This module is data-only: the published manifest spec, the dependency specifier the userland glue
 * imports, and the sample-stub manifest mapping each text-imported stub to its workspace-relative
 * emit path. It contains no file I/O and no code generation. The sample stub contents are imported
 * as text via import attributes (`with { type: 'text' }`) — the repo's locked, JSR-safe asset
 * mechanism — so they ship as real, type-checked source inside `@netscript/plugin-triggers` and are
 * emitted verbatim, with no scaffold-time interpolation.
 *
 * @module
 */

import type { PluginScaffoldManifestSpec } from '@netscript/plugin/scaffold';
import sampleWebhookSource from './stubs/generic-inbound-webhook.ts' with { type: 'text' };
import sampleScheduleSource from './stubs/daily-maintenance.ts' with { type: 'text' };
import sampleFileWatchSource from './stubs/incoming-file-watch.ts' with { type: 'text' };
import triggersBarrelSource from './stubs/mod.ts' with { type: 'text' };

/**
 * Published JSR specifier of the triggers runtime core the emitted userland stubs import.
 *
 * The sample triggers reference this package (never the user's instance name), which is what keeps
 * the emitted stubs static and interpolation-free.
 */
export const TRIGGERS_RUNTIME_CORE_SPECIFIER = '@netscript/plugin-triggers-core';

/** Background workspace directory the triggers userland samples are emitted under. */
export const TRIGGERS_BACKGROUND_WORKSPACE = 'triggers';

/**
 * A single userland sample stub: its text content and the workspace-relative path it is written to.
 */
export interface TriggersSampleStub {
  /** Workspace-relative path the stub is written to, using forward slashes. */
  readonly path: string;
  /** Full text content of the stub, imported from a real type-checked source. */
  readonly content: string;
}

/**
 * The complete set of user-owned sample stubs `plugin add triggers` emits.
 *
 * Order is the emission order: the three leaf samples first, then the barrel that re-exports them.
 * Every path lives under {@linkcode TRIGGERS_BACKGROUND_WORKSPACE} and contains no plugin source
 * (`services/`, `contracts/`, `src/runtime/`, `src/aspire/`, `bin/`, `database/`) — that all
 * resolves from the `@netscript/plugin-triggers` dependency.
 */
export const TRIGGERS_SAMPLE_STUBS: readonly TriggersSampleStub[] = [
  {
    path: `${TRIGGERS_BACKGROUND_WORKSPACE}/generic-inbound-webhook.ts`,
    content: sampleWebhookSource,
  },
  {
    path: `${TRIGGERS_BACKGROUND_WORKSPACE}/daily-maintenance.ts`,
    content: sampleScheduleSource,
  },
  {
    path: `${TRIGGERS_BACKGROUND_WORKSPACE}/incoming-file-watch.ts`,
    content: sampleFileWatchSource,
  },
  { path: `${TRIGGERS_BACKGROUND_WORKSPACE}/mod.ts`, content: triggersBarrelSource },
];

/**
 * Version-independent specification of the published `plugins/triggers/scaffold.plugin.json`.
 *
 * Rendered to the committed manifest bytes by `buildScaffoldPluginJson(triggersManifestSpec,
 * version)`; the `version` and `@netscript/plugin` peer-dependency range are injected at build time.
 */
export const triggersManifestSpec: PluginScaffoldManifestSpec = {
  name: '@netscript/plugin-triggers',
  displayName: 'Trigger Processor',
  description:
    'NetScript plugin for trigger ingress, scheduling, file watching, and trigger runtime APIs.',
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
    servicePort: 8093,
    backgroundPort: 8093,
    dependencies: ['streams'],
    pluginReferences: ['workers-api'],
  },
};
