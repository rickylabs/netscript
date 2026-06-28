/**
 * Static data for the thin workers plugin scaffolder.
 *
 * This module is data-only: the published manifest spec, the dependency specifier the userland glue
 * imports, and the sample-stub manifest mapping each text-imported stub to its workspace-relative
 * emit path. It contains no file I/O and no code generation. The sample stub contents are imported
 * as text via import attributes (`with { type: 'text' }`) — the repo's locked, JSR-safe asset
 * mechanism — so they ship as real, type-checked source inside `@netscript/plugin-workers` and are
 * emitted verbatim, with no scaffold-time interpolation.
 *
 * @module
 */

import type { PluginScaffoldManifestSpec } from '@netscript/plugin/scaffold';
import sampleJobSource from './stubs/jobs/health-check.ts' with { type: 'text' };
import sampleTaskSource from './stubs/tasks/validate-payload.ts' with { type: 'text' };
import workersBarrelSource from './stubs/mod.ts' with { type: 'text' };

/**
 * Published JSR specifier of the workers runtime core the emitted userland stubs import.
 *
 * The sample job and task reference this package (never the user's instance name), which is what
 * keeps the emitted stubs static and interpolation-free.
 */
export const WORKERS_RUNTIME_CORE_SPECIFIER = '@netscript/plugin-workers-core';

/** Background workspace directory the workers userland samples are emitted under. */
export const WORKERS_BACKGROUND_WORKSPACE = 'workers';

/**
 * A single userland sample stub: its text content and the workspace-relative path it is written to.
 */
export interface WorkersSampleStub {
  /** Workspace-relative path the stub is written to, using forward slashes. */
  readonly path: string;
  /** Full text content of the stub, imported from a real type-checked source. */
  readonly content: string;
}

/**
 * The complete set of user-owned sample stubs `plugin add workers` emits.
 *
 * Order is the emission order: the two leaf samples first, then the barrel that re-exports them.
 * Every path lives under {@linkcode WORKERS_BACKGROUND_WORKSPACE} and contains no plugin source
 * (`services/`, `contracts/`, `src/runtime/`, `src/aspire/`, `bin/`) — that all resolves from the
 * `@netscript/plugin-workers` dependency.
 */
export const WORKERS_SAMPLE_STUBS: readonly WorkersSampleStub[] = [
  { path: `${WORKERS_BACKGROUND_WORKSPACE}/jobs/health-check.ts`, content: sampleJobSource },
  {
    path: `${WORKERS_BACKGROUND_WORKSPACE}/tasks/validate-payload.ts`,
    content: sampleTaskSource,
  },
  { path: `${WORKERS_BACKGROUND_WORKSPACE}/mod.ts`, content: workersBarrelSource },
];

/**
 * Version-independent specification of the published `plugins/workers/scaffold.plugin.json`.
 *
 * Rendered to the committed manifest bytes by `buildScaffoldPluginJson(workersManifestSpec,
 * version)`; the `version` and `@netscript/plugin` peer-dependency range are injected at build time.
 */
export const workersManifestSpec: PluginScaffoldManifestSpec = {
  name: '@netscript/plugin-workers',
  displayName: 'Background Worker',
  description:
    'NetScript plugin for background job scheduling, task execution, and worker API endpoints.',
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
  officialSource: {
    canonicalName: 'workers',
    pluginDir: 'workers',
    backgroundDir: 'workers',
    serviceEntrypoint: 'services/src/main.ts',
    backgroundEntrypoint: 'bin/combined.ts',
    serviceConfigKey: 'workers-api',
    servicePort: 8091,
    backgroundPort: 8091,
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
